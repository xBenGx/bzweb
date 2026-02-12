import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { status, reference, requestId } = body;

    console.log(`📡 Webhook GetNet recibido: Ref: ${reference} - Estado: ${status.status}`);

    // Solo nos interesa si está APROBADO
    if (status.status !== 'APPROVED') {
      return NextResponse.json({ message: 'Ignorado (No aprobado)' });
    }

    // 🔥 MAGIA: Llamamos a tu propia API de emisión internamente
    // Asegúrate de definir NEXT_PUBLIC_SITE_URL en tu .env.local (ej: https://boulevardzapallar.cl)
    const apiUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/tickets/emitir`;

    // Necesitamos recuperar los datos del cliente. 
    // OPCIÓN 1 (Recomendada): Buscar la reserva en Supabase usando la 'reference' (ID reserva)
    // OPCIÓN 2 (Rápida): Si GetNet devuelve metadata, usarla. Asumiremos Opción 1.

    // *Aquí deberías consultar Supabase para sacar email y nombre usando el 'reference'*
    // Como ejemplo simplificado, haré la llamada fetch asumiendo que tienes los datos o los recuperas aquí.
    
    /* --- LÓGICA SUGERIDA ---
       1. const reserva = await supabase.from('reservas').select('*').eq('id', reference).single();
       2. fetch(apiUrl, { ... body: { userEmail: reserva.email ... } }) 
    */

    return NextResponse.json({ status: 'OK' });

  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}