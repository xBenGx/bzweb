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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userEmail, customerName, eventId, paymentRef } = body;

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
    const validationUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://boulevardzapallar.cl'}/admin/validar/${ticket.id}`;
    const qrCodeDataUrl = await QRCode.toDataURL(validationUrl);

    // 4. Enviar Email
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'Boulevard Zapallar <entradas@boulevardzapallar.cl>', 
      // IMPORTANTE: Si no has verificado dominio en Resend, usa: 'onboarding@resend.dev' para probar
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