import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  console.log("🚀 Iniciando proceso de checkout..."); // LOG 1

  try {
    const { cart, total, customerDetails } = await request.json();

    // 1. VERIFICAR VARIABLES
    if (!process.env.GETNET_LOGIN || !process.env.GETNET_ENDPOINT) {
       throw new Error("Faltan variables de entorno de GetNet en el servidor");
    }

    // 2. GUARDAR EN SUPABASE
    console.log("💾 Guardando en base de datos..."); // LOG 2
    const { data: orderData, error: orderError } = await supabase
      .from('ventas_generales')
      .insert([
        {
          descripcion: `Reserva Web - ${customerDetails.name}`,
          monto: total, // Asegúrate que coincida con tu tabla corregida
          tipo: 'reserva_web',
          metodo_pago: 'getnet_pendiente',
        }
      ])
      .select()
      .single();

    if (orderError) {
      console.error("❌ Error Supabase:", orderError); // LOG ERROR DB
      throw new Error(`Error DB: ${orderError.message}`);
    }
    console.log("✅ Orden guardada ID:", orderData.id);

    // 3. CONECTAR CON GETNET
    console.log("globe_with_meridians Conectando con GetNet..."); // LOG 3
    const authString = Buffer.from(`${process.env.GETNET_LOGIN}:${process.env.GETNET_SECRET_KEY}`).toString('base64');
    
    // Usamos un timeout manual para que no se cuelgue infinitamente
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos max

    const authResponse = await fetch(`${process.env.GETNET_ENDPOINT}/auth/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${authString}`
        },
        body: 'scope=oob&grant_type=client_credentials',
        signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!authResponse.ok) {
        const errorText = await authResponse.text();
        console.error("❌ Error Auth GetNet:", authResponse.status, errorText);
        throw new Error(`Fallo Auth GetNet: ${authResponse.status}`);
    }

    const authData = await authResponse.json();
    console.log("✅ Token GetNet recibido");

    // 4. GENERAR LINK
    const paymentBody = {
        amount: { currency: "CLP", total: total },
        order: { order_id: orderData.id.toString(), description: "Consumo Boulevard" },
        customer: { email: "cliente@boulevard.cl", first_name: customerDetails.name },
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/confirmacion?status=success&order=${orderData.id}`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/?status=cancelled`
    };

    const paymentResponse = await fetch(`${process.env.GETNET_ENDPOINT}/v1/payments/link`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authData.access_token}`,
            'request-id': orderData.id.toString()
        },
        body: JSON.stringify(paymentBody)
    });

    const paymentData = await paymentResponse.json();
    console.log("✅ Respuesta Pago:", paymentData);

    if (!paymentData.payment_url && !paymentData.redirect_url) {
        throw new Error("GetNet no devolvió URL de pago");
    }

    return NextResponse.json({ url: paymentData.payment_url || paymentData.redirect_url });

  } catch (error: any) {
    console.error("🚨 Error General:", error);
    // Devolvemos el error como JSON para que el frontend no falle con "<"
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}