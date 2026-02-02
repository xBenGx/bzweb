import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inicializamos Supabase del lado del servidor (más seguro)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Usamos la Service Role Key si la tienes para saltar las reglas RLS, o la Anon Key si tus políticas son abiertas
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const { cart, total, customerDetails } = await request.json();

    // 1. GUARDAR PRE-ORDEN EN SUPABASE
    // Guardamos en 'ventas_generales' como vimos en tu imagen
    const { data: orderData, error: orderError } = await supabase
      .from('ventas_generales')
      .insert([
        {
          descripcion: `Reserva Web - ${customerDetails.name} (${customerDetails.phone})`,
          monto_numeric: total,
          tipo: 'reserva_web',
          metodo_pago: 'getnet_pendiente', // Estado inicial
          // Supongo que tienes una columna para guardar el JSON del carrito, si no, puedes omitirlo o crear una tabla relacionada
          // detalle_json: cart 
        }
      ])
      .select()
      .single();

    if (orderError) {
      console.error("Error DB:", orderError);
      throw new Error('No se pudo crear la orden en base de datos');
    }

    // 2. AUTENTICACIÓN CON GETNET (Obtener Token)
    const authString = Buffer.from(`${process.env.GETNET_LOGIN}:${process.env.GETNET_SECRET_KEY}`).toString('base64');
    
    const authResponse = await fetch(`${process.env.GETNET_ENDPOINT}/auth/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${authString}`
        },
        body: 'scope=oob&grant_type=client_credentials'
    });

    const authData = await authResponse.json();
    if (!authData.access_token) throw new Error("Fallo autenticación con GetNet");

    // 3. GENERAR LINK DE PAGO (Payment Link)
    // Nota: La estructura del body depende de la versión de API de GetNet Chile, esta es la estándar v1
    const paymentBody = {
        amount: {
            currency: "CLP",
            total: total
        },
        order: {
            order_id: orderData.id.toString(), // Usamos ID de supabase
            description: "Consumo Boulevard Zapallar"
        },
        customer: {
            email: "cliente@boulevard.cl", // GetNet suele pedir email, puedes pedirlo en el form o usar uno genérico
            first_name: customerDetails.name
        },
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/confirmacion?status=success&order=${orderData.id}`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/?status=cancelled`
    };

    const paymentResponse = await fetch(`${process.env.GETNET_ENDPOINT}/v1/payments/link`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authData.access_token}`,
            'request-id': crypto.randomUUID()
        },
        body: JSON.stringify(paymentBody)
    });

    const paymentData = await paymentResponse.json();

    // 4. RESPONDER AL FRONTEND
    // Dependiendo de la respuesta de GetNet, la URL suele venir en 'payment_url' o 'redirect_url'
    const redirectUrl = paymentData.payment_url || paymentData.redirect_url;

    if (!redirectUrl) {
        console.error("Respuesta GetNet:", paymentData);
        throw new Error("GetNet no devolvió URL de pago");
    }

    return NextResponse.json({ url: redirectUrl });

  } catch (error: any) {
    console.error("Checkout Error:", error);
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
  }
}