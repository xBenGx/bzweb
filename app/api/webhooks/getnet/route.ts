import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Resend } from 'resend';
import * as React from 'react';
import TicketEmail from '@/components/emails/TicketEmail';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; 
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Inicializamos Resend
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { status, reference } = body;

    console.log(`📡 Webhook GetNet: Ref: ${reference} - Estado: ${status.status}`);

    if (status.status !== 'APPROVED') {
      return NextResponse.json({ message: 'Ignorado (No aprobado)' });
    }

    // 1. Buscar reserva
    const { data: reserva, error: reservaError } = await supabase
      .from('reservas')
      .select('*')
      .eq('id', reference) 
      .single();

    if (reservaError || !reserva) {
      return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
    }

    // 2. Crear Ticket en Supabase
    const { data: nuevoTicket, error: ticketError } = await supabase
      .from('tickets')
      .insert({
        event_id: reserva.event_id,
        user_email: reserva.email,
        customer_name: reserva.nombre,
        status: 'valid'
      })
      .select().single();

    if (ticketError) {
      return NextResponse.json({ error: 'Error creando ticket' }, { status: 500 });
    }

    const ticketUUID = nuevoTicket.id;
    
    // ==========================================
    // PASO 3: GENERAR QR Y PDF (ESTILO PASSLINE)
    // ==========================================
    
    // A. Generar QR en formato Data URL (base64)
    const qrDataUrl = await QRCode.toDataURL(ticketUUID);
    
    // B. Crear PDF en memoria
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([400, 600]); // Tamaño tipo entrada vertical
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Dibujar texto básico en el PDF
    const nombreCliente = (reserva.nombre as string) || 'Cliente'; 
    
    page.drawText('BOULEVARD ZAPALLAR', { x: 50, y: 550, size: 24, font, color: rgb(0, 0, 0) });
    page.drawText('ENTRADA OFICIAL', { x: 50, y: 520, size: 18, color: rgb(0.3, 0.3, 0.3) });
    page.drawText(`A nombre de: ${nombreCliente}`, { x: 50, y: 480, size: 14 });
    page.drawText(`ID: ${ticketUUID}`, { x: 50, y: 460, size: 10 });

    // Incrustar el QR en el PDF
    const qrImageBytes = Buffer.from(qrDataUrl.split(',')[1], 'base64');
    const qrImage = await pdfDoc.embedPng(qrImageBytes);
    page.drawImage(qrImage, { x: 100, y: 200, width: 200, height: 200 });

    // C. Guardar el PDF como un Buffer para enviarlo por correo
    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);

    // ==========================================
    // PASO 4: ENVIAR CORREO CON RESEND
    // ==========================================
    
    const emailData = await resend.emails.send({
      // MODO PRUEBA: Obligatorio usar este remitente hasta que verifiques tu dominio
      from: 'onboarding@resend.dev', 
      
      // MODO PRUEBA: ¡IMPORTANTE! Cambia esto por TU correo personal de Resend
      to: ['TU_CORREO_REGISTRADO_EN_RESEND@gmail.com'], 
      
      subject: '🎟️ Tus entradas para Boulevard Zapallar',
      
      // 🔥 SOLUCIÓN DEL ERROR: Usamos las propiedades exactas que espera TicketEmailProps
      react: TicketEmail({ 
        customerName: nombreCliente, 
        eventName: "Experiencia en Boulevard Zapallar", 
        eventDate: "Próximamente",
        qrCodeUrl: qrDataUrl, // Pasamos el QR generado
        ticketId: ticketUUID  // Pasamos el ID generado
      }) as React.ReactElement, 
      
      attachments: [
        {
          filename: `Entrada_BoulevardZapallar_${ticketUUID.substring(0,8)}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    console.log('✅ Correo enviado con PDF adjunto:', emailData);

    return NextResponse.json({ status: 'OK', ticketId: ticketUUID });

  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}