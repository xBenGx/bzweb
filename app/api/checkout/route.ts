import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Inicializamos Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Usamos el Service Role Key para poder insertar datos de forma segura desde el backend
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  console.log("🚀 Iniciando Checkout (GetNet Chile - Web Checkout)...");

  try {
    const { cart, total, customerDetails } = await request.json();
    
    // 1. VALIDAR VARIABLES DE ENTORNO
    if (!process.env.GETNET_LOGIN || !process.env.GETNET_SECRET_KEY || !process.env.GETNET_ENDPOINT) {
        throw new Error("Faltan credenciales de GetNet en las variables de entorno");
    }
    
    // Limpiamos la URL base (quitamos slash final si lo tiene)
    const baseUrl = process.env.GETNET_ENDPOINT.replace(/\/$/, "");
    const apiUrl = `${baseUrl}/api/session`; 

    // Extraer IP real y User-Agent desde los headers de Next.js (Mejora anti-fraude para GetNet)
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || "127.0.0.1";
    const userAgent = request.headers.get('user-agent') || "NextJS-App";

    // 2. GUARDAR EN SUPABASE (Tabla: reservas)
    // CRÍTICO: Debe ser la misma tabla que el webhook consultará después
    console.log("💾 Guardando reserva en DB...");
    const { data: reservaData, error: reservaError } = await supabase
      .from('reservas')
      .insert([{
          name: customerDetails.name,
          email: customerDetails.email,
          phone: customerDetails.phone,
          total_pre_order: total,
          status: 'pendiente_pago',
          details_json: cart,
          payment_method: 'getnet',
          date_reserva: new Date().toISOString().split('T')[0]
      }])
      .select()
      .single();

    if (reservaError) throw new Error(`Error DB: ${reservaError.message}`);
    
    // Este UUID será el 'reference' que enviaremos a GetNet y que el Webhook recibirá
    const orderId = reservaData.id.toString(); 
    console.log("✅ Reserva Creada. ID (Reference):", orderId);

    // 3. GENERAR AUTENTICACIÓN (PlacetoPay / GetNet Chile)
    const login = process.env.GETNET_LOGIN;
    const secretKey = process.env.GETNET_SECRET_KEY;
    
    // Generar Seed (Fecha ISO actual)
    const seed = new Date().toISOString();
    
    // Generar Nonce (Aleatorio)
    const nonceRaw = crypto.randomBytes(16);
    const nonceBase64 = nonceRaw.toString('base64');
    
    // Generar TranKey: Base64(SHA1(Nonce + Seed + SecretKey))
    const tranKeyHash = crypto.createHash('sha1');
    tranKeyHash.update(nonceRaw);
    tranKeyHash.update(seed);
    tranKeyHash.update(secretKey);
    const tranKey = tranKeyHash.digest('base64');

    const authData = {
        login: login,
        tranKey: tranKey,
        nonce: nonceBase64,
        seed: seed
    };

    // 4. PREPARAR REQUEST PARA GETNET CHILE
    // Definimos URL base dependiendo del entorno
    const appBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const returnUrl = `${appBaseUrl}/confirmacion?order=${orderId}`;
    
    const payload = {
        auth: authData,
        locale: "es_CL",
        buyer: {
            name: customerDetails.name,
            email: customerDetails.email,
            mobile: customerDetails.phone
        },
        payment: {
            reference: orderId, // EL DATO MÁS IMPORTANTE PARA EL WEBHOOK
            description: "Entradas y/o Consumo - Boulevard Zapallar",
            amount: {
                currency: "CLP",
                total: total
            },
            allowPartial: false
        },
        expiration: new Date(Date.now() + 15 * 60000).toISOString(), // Expira en 15 mins
        returnUrl: returnUrl,
        ipAddress: ipAddress,
        userAgent: userAgent
    };

    console.log(`🔌 Conectando a GetNet...`);

    // 5. ENVIAR A GETNET
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const result = await response.json();
    console.log("✅ Respuesta GetNet Status:", result.status?.status);

    // 6. MANEJAR RESPUESTA
    if (result.status && result.status.status === "OK") {
        return NextResponse.json({ 
            url: result.processUrl, // Redirigiremos al cliente a esta URL
            requestId: result.requestId 
        });
    } else {
        console.error("❌ Error GetNet Chile:", result);
        throw new Error(result.status?.message || "Error al crear sesión en GetNet");
    }

  } catch (error: any) {
    console.error("🚨 Error Checkout:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}