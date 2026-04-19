import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import QRCode from 'qrcode';
import TicketEmail from '@/components/emails/TicketEmail'; 
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);

// Cliente Supabase con privilegios (Service Role)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

// Configuración Evolution API
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL!;
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE!;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY!;

// Helper para Evolution API (Envía el Base64 directamente)
async function enviarWhatsAppTicket(telefono: string, base64Image: string, mensajeTexto: string) {
  let raw = telefono.replace(/\D/g, "");
  if (raw.length === 9 && raw.startsWith("9")) raw = "56" + raw;
  if (raw.length === 8) raw = "569" + raw;
  
  try {
    const res = await fetch(`${EVOLUTION_API_URL}/message/sendMedia/${EVOLUTION_INSTANCE}`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "apikey": EVOLUTION_API_KEY
      },
      body: JSON.stringify({
        number: raw,
        options: { delay: 1200, presence: "composing" },
        mediaMessage: {
          mediatype: "image",
          caption: mensajeTexto,
          media: base64Image 
        }
      })
    });
    const responseData = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(responseData));
    return { success: true };
  } catch (e: any) {
    console.error("❌ Error enviando WhatsApp (Evolution):", e);
    return { success: false, error: e.message };
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Agregamos customerPhone para que el botón pueda mandar el número
    const { userEmail, customerName, customerPhone, eventId, paymentRef } = body;

    // 1. Obtener datos del show
    const { data: show, error: showError } = await supabase
      .from('shows') 
      .select('*')
      .eq('id', eventId)
      .single();

    if (showError || !show) {
      return NextResponse.json({ error: 'Show no encontrado' }, { status: 404 });
    }

    // 2. Crear el ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .insert([
        { 
          event_id: eventId, 
          user_email: userEmail, 
          customer_name: customerName,
          payment_reference: paymentRef,
          status: 'valid'
        }
      ])
      .select()
      .single();

    if (ticketError) {
      return NextResponse.json({ error: 'Error creando ticket: ' + ticketError.message }, { status: 500 });
    }

    // 3. Generar QR (URL de validación)
    const validationUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://bzweb.vercel.app'}/validar-ticket/${ticket.id}`;
    const qrCodeDataUrl = await QRCode.toDataURL(validationUrl);

    // 4. Enviar WhatsApp (Si el frontend envió un teléfono)
    if (customerPhone) {
      const waMessage = `¡Hola ${customerName}! 👋\n\nAquí tienes tu entrada confirmada para *${show.nombre}* 🎟️.\n\n📅 Fecha: ${show.fecha}\n🎫 Código: ${ticket.id.slice(0, 8).toUpperCase()}\n\nMuestra este código QR en el acceso.\n¡Te esperamos!`;
      await enviarWhatsAppTicket(customerPhone, qrCodeDataUrl, waMessage);
    }

    // 5. Enviar Email
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'Boulevard Zapallar <entradas@boulevardzapallar.cl>', 
      to: [userEmail],
      subject: `Tu entrada para ${show.nombre}`,
      react: TicketEmail({
        customerName: customerName,
        eventName: show.nombre,
        eventDate: show.fecha, 
        eventImage: show.imagen_url || '',
        qrCodeUrl: qrCodeDataUrl,
        ticketId: ticket.id.slice(0, 8).toUpperCase()
      }),
    });

    if (emailError) {
      console.error('Error email:', emailError);
      return NextResponse.json({ error: 'Ticket creado, pero falló email' }, { status: 500 });
    }

    return NextResponse.json({ success: true, ticketId: ticket.id });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}