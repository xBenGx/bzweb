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

    console.log(`📡 Webhook GetNet: Ref: ${reference} - Estado: ${status?.status}`);

    if (status?.status !== 'APPROVED') {
      return NextResponse.json({ message: 'Ignorado (No aprobado o pendiente)' });
    }

    // 1. Buscar reserva en la base de datos
    const { data: reserva, error: reservaError } = await supabase
      .from('reservas')
      .select('*')
      .eq('id', reference) // Asumiendo que 'reference' de Getnet es el ID de tu reserva
      .single();

    if (reservaError || !reserva) {
      console.error('Error buscando reserva:', reservaError);
      return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
    }

    // Extraer datos del cliente
    const nombreCliente = reserva.name || 'Cliente'; 
    const emailCliente = reserva.email;
    
    // 🔥 CORRECCIÓN CRÍTICA APLICADA: Ahora lee desde 'pre_order' en lugar de 'details_json'
    const carritoItems = reserva.pre_order || [];

    // Filtrar solo los items que son tickets/entradas
    const ticketItems = carritoItems.filter((item: any) => item.category === 'ticket');

    if (ticketItems.length === 0) {
       // Si solo compraron comida/delivery, actualizamos la reserva a pagado de todas formas
       await supabase.from('reservas').update({ status: 'pagado' }).eq('id', reference);
       console.log('La reserva no contiene entradas, solo productos. Estado actualizado a pagado.');
       return NextResponse.json({ status: 'OK', message: 'Sin tickets para generar, pero pago validado.' });
    }

    // ==========================================
    // PASO 2 y 3: GENERAR MÚLTIPLES TICKETS, QRS Y UN PDF MULTIPÁGINA
    // ==========================================
    
    // B. Crear PDF en memoria (Un solo archivo PDF que contendrá todas las entradas)
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const generatedTicketsData = [];

    // Iterar sobre cada tipo de ticket comprado
    for (const item of ticketItems) {
      // Si el cliente compró cantidad: 2, generamos 2 tickets distintos
      for (let i = 0; i < item.quantity; i++) {
        
        // A. Crear Ticket individual en Supabase
        const { data: nuevoTicket, error: ticketError } = await supabase
          .from('tickets')
          .insert({
            event_id: item.id, // Guardamos el ID del producto/evento
            user_email: emailCliente,
            customer_name: nombreCliente,
            status: 'valid'
          })
          .select().single();

        if (ticketError) {
          console.error('Error creando ticket individual:', ticketError);
          continue; // Si falla uno, intentamos con el siguiente
        }

        const ticketUUID = nuevoTicket.id;
        generatedTicketsData.push(nuevoTicket);
        
        // B. Generar QR para ESTE ticket específico
        const qrDataUrl = await QRCode.toDataURL(ticketUUID, { margin: 1, width: 250 });
        const qrImageBytes = Buffer.from(qrDataUrl.split(',')[1], 'base64');
        const qrImage = await pdfDoc.embedPng(qrImageBytes);
        
        // C. Añadir una nueva página al PDF (1 página = 1 entrada física)
        const page = pdfDoc.addPage([400, 650]); // Tamaño tipo entrada vertical
        
        // Diseño de la entrada (Estilo Passline)
        page.drawRectangle({ x: 0, y: 0, width: 400, height: 650, color: rgb(0.97, 0.97, 0.97) }); // Fondo claro
        
        // Cabecera
        page.drawText('BOULEVARD ZAPALLAR', { x: 40, y: 600, size: 22, font, color: rgb(0.1, 0.1, 0.1) });
        page.drawText('ENTRADA OFICIAL', { x: 40, y: 575, size: 14, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });
        
        // Línea separadora
        page.drawLine({ start: { x: 40, y: 550 }, end: { x: 360, y: 550 }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });

        // Datos del Show
        page.drawText(item.name.toUpperCase(), { x: 40, y: 510, size: 18, font, color: rgb(0.85, 0.64, 0.12) }); // Color dorado #DAA520 aprox
        page.drawText(`Titular: ${nombreCliente}`, { x: 40, y: 470, size: 14, font: fontRegular });
        page.drawText(`Tipo: Entrada General`, { x: 40, y: 450, size: 12, font: fontRegular });
        
        // Incrustar el QR centrado
        page.drawImage(qrImage, { x: 75, y: 170, width: 250, height: 250 });

        // Pie de página
        page.drawText(`Ticket ID: ${ticketUUID}`, { x: 40, y: 130, size: 10, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });
        page.drawText('Presenta este código QR en la puerta para ingresar.', { x: 40, y: 110, size: 10, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });
      }
    }

    // D. Guardar el PDF con todas las páginas compiladas
    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);

    // ==========================================
    // PASO 4: ENVIAR CORREO CON RESEND
    // ==========================================
    
    // Tomamos el primer QR generado para mostrarlo de preview en el cuerpo del correo
    const firstTicketUUID = generatedTicketsData[0]?.id || 'N/A';
    const firstQrDataUrl = await QRCode.toDataURL(firstTicketUUID);

    // Nombres de eventos separados por coma (ej: "Salsa Nights, Fiesta 80s")
    const nombresEventos = [...new Set(ticketItems.map((i: any) => i.name))].join(', ');

    const emailData = await resend.emails.send({
      from: 'Entradas Boulevard <onboarding@resend.dev>', // Asegúrate de configurar tu dominio en Resend en producción
      
      // MODO PRUEBA DE RESEND: Solo te deja enviar al correo con el que te registraste.
      // Cuando verifiques tu dominio en Resend, cambia esto a: to: [emailCliente]
      to: [process.env.NODE_ENV === 'development' ? 'TU_CORREO_REGISTRADO_EN_RESEND@gmail.com' : emailCliente], 
      
      subject: `🎟️ Tus entradas para ${nombresEventos} - Boulevard Zapallar`,
      
      react: TicketEmail({ 
        customerName: nombreCliente, 
        eventName: nombresEventos, 
        eventDate: "Revisa los detalles en tu PDF", // Podrías extraer esto de tu BD si lo tienes
        qrCodeUrl: firstQrDataUrl, 
        ticketId: firstTicketUUID 
      }) as React.ReactElement, 
      
      attachments: [
        {
          filename: `Entradas_BoulevardZapallar_${reference.substring(0,6)}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    console.log('✅ Correo enviado con PDF multipágina adjunto:', emailData);

    // ==========================================
    // PASO 5: ACTUALIZAR LA RESERVA COMO PAGADA
    // ==========================================
    await supabase
      .from('reservas')
      .update({ status: 'pagado' })
      .eq('id', reference);

    return NextResponse.json({ status: 'OK', ticketsGenerados: generatedTicketsData.length });

  } catch (error: any) {
    console.error('Webhook Error Crítico:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}