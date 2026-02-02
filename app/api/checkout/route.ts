import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inicializar Supabase (asegúrate de tener tus variables de entorno de Supabase configuradas)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // O la Service Role si necesitas más permisos
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const { cart, total, customerDetails } = await request.json();

    // 1. (Opcional) Guardar la intención de compra en Supabase como "Pendiente"
    // Esto es útil para saber cuánta gente intenta pagar pero no termina.
    const { data: orderData, error: orderError } = await supabase
      .from('ventas_generales')
      .insert([
        {
          descripcion: `Pedido Web - ${customerDetails.email}`,
          monto_numeric: total,
          tipo: 'pedido_web',
          metodo_pago: 'getnet_pendiente', // Lo actualizaremos luego a 'aprobado'
          // created_at se genera solo según tu tabla
        }
      ])
      .select()
      .single();

    if (orderError) throw new Error('Error guardando pedido en DB');

    // 2. Autenticación con GetNet (Obtener Token)
    // *La estructura exacta depende de la doc de GetNet, pero suele ser así:*
    const authResponse = await fetch(`${process.env.GETNET_ENDPOINT}/auth/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + Buffer.from(`${process.env.GETNET_LOGIN}:${process.env.GETNET_SECRET_KEY}`).toString('base64')
        },
        body: JSON.stringify({ grant_type: 'client_credentials' }) // Ajustar según doc específica
    });
    
    const authData = await authResponse.json();
    const accessToken = authData.access_token; // Ajustar según respuesta real

    // 3. Crear la transacción de pago
    const paymentResponse = await fetch(`${process.env.GETNET_ENDPOINT}/v1/payments/link`, { // Endpoint hipotético de "link de pago"
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'request-id': orderData.id.toString(), // Usamos el ID de supabase como referencia
        },
        body: JSON.stringify({
            amount: total,
            currency: "CLP",
            order_id: orderData.id,
            callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/checkout/callback`, // Webhook (avanzado)
            return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/confirmacion?order=${orderData.id}`, // Donde vuelve el usuario
            description: "Consumo en Boulevard Zapallar"
        })
    });

    const paymentData = await paymentResponse.json();

    // 4. Devolver la URL de pago al Frontend
    return NextResponse.json({ 
        url: paymentData.payment_url, // La URL donde GetNet cobra
        orderId: orderData.id 
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error procesando el pago' }, { status: 500 });
  }
}