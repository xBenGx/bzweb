import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inicializamos Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  console.log("🚀 Iniciando proceso de checkout (Vercel)..."); 

  try {
    const { cart, total, customerDetails } = await request.json();

    // 1. VALIDACIÓN DE VARIABLES DE ENTORNO CRÍTICAS
    // Verificamos que existan todas las credenciales antes de empezar
    if (!process.env.GETNET_LOGIN || !process.env.GETNET_ENDPOINT || !process.env.GETNET_SECRET_KEY) {
       throw new Error("Faltan variables de entorno de GetNet (Login, Endpoint o Secret)");
    }
    
    if (!process.env.NEXT_PUBLIC_BASE_URL) {
       throw new Error("Falta la variable NEXT_PUBLIC_BASE_URL. El pago fallará sin ella.");
    }

    // --- CORRECCIÓN ERROR 404 (Auth) ---
    // Limpiamos la URL por si tiene una barra al final (ej: .com/)
    // Esto asegura que la url quede limpia: "https://api.globalgetnet.com"
    const baseUrl = process.env.GETNET_ENDPOINT.replace(/\/$/, ""); 
    
    // Construimos las URLs completas
    const authUrl = `${baseUrl}/auth/token`;
    const paymentUrl = `${baseUrl}/v1/payments/link`;

    // 2. GUARDAR PRE-ORDEN EN SUPABASE
    console.log("💾 Guardando orden en DB..."); 
    
    // Opcional: Guardamos el carrito "ligero" en la base de datos si tu tabla tiene la columna 'detalle_json'
    // Si no la tiene, Supabase ignorará ese campo o dará error si es estricto.
    const { data: orderData, error: orderError } = await supabase
      .from('ventas_generales')
      .insert([
        {
          descripcion: `Reserva Web - ${customerDetails.name}`,
          monto: total, 
          tipo: 'reserva_web',
          metodo_pago: 'getnet_pendiente',
          detalle_json: cart // Guardamos el resumen de items
        }
      ])
      .select()
      .single();

    if (orderError) {
      console.error("❌ Error Supabase:", orderError); 
      throw new Error(`Error DB: ${orderError.message}`);
    }
    console.log("✅ Orden guardada ID:", orderData.id);

    // 3. CONECTAR CON GETNET (AUTH)
    console.log(`🔌 Conectando a GetNet Auth: ${authUrl}`); 
    
    const authString = Buffer.from(`${process.env.GETNET_LOGIN}:${process.env.GETNET_SECRET_KEY}`).toString('base64');
    
    // Timeout de seguridad de 10 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); 

    const authResponse = await fetch(authUrl, {
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
        throw new Error(`Fallo Auth GetNet (${authResponse.status}): Verifica tus credenciales y endpoint.`);
    }

    const authData = await authResponse.json();
    console.log("✅ Token GetNet recibido");

    // 4. GENERAR LINK DE PAGO
    console.log(`🔗 Generando Link en: ${paymentUrl}`);
    
    const paymentBody = {
        amount: { currency: "CLP", total: total },
        order: { 
            order_id: orderData.id.toString(), 
            description: "Consumo Boulevard Zapallar" 
        },
        customer: { 
            email: "cliente@boulevard.cl", // Puedes cambiarlo si pides email en el frontend
            first_name: customerDetails.name 
        },
        // Aquí usamos la variable que agregaste en Vercel
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/confirmacion?status=success&order=${orderData.id}`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/?status=cancelled`
    };

    const paymentResponse = await fetch(paymentUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authData.access_token}`,
            'request-id': orderData.id.toString()
        },
        body: JSON.stringify(paymentBody)
    });

    const paymentData = await paymentResponse.json();
    
    // Logueamos la respuesta para depuración (sin mostrar datos sensibles si los hubiera)
    console.log("✅ Respuesta GetNet recibida");

    // Validamos que haya llegado una URL
    if (!paymentData.payment_url && !paymentData.redirect_url) {
        console.error("❌ GetNet no devolvió URL. Respuesta:", paymentData);
        throw new Error("GetNet no entregó la URL de pago");
    }

    // 5. RESPONDER AL FRONTEND
    return NextResponse.json({ 
        url: paymentData.payment_url || paymentData.redirect_url 
    });

  } catch (error: any) {
    console.error("🚨 Error General Checkout:", error);
    // Devolvemos el error como JSON para que el frontend lo muestre en el alert()
    return NextResponse.json(
        { error: error.message || 'Error interno del servidor de pagos' }, 
        { status: 500 }
    );
  }
}