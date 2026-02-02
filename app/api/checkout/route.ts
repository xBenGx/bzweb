import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto'; // Usamos librería nativa de Node.js

// Inicializamos Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  console.log("🚀 Iniciando Checkout (GetNet Chile - Web Checkout)...");

  try {
    const { cart, total, customerDetails } = await request.json();
    
    // 1. VALIDAR VARIABLES
    if (!process.env.GETNET_LOGIN || !process.env.GETNET_SECRET_KEY || !process.env.GETNET_ENDPOINT) {
        throw new Error("Faltan credenciales de GetNet en Vercel");
    }
    
    // Limpiamos la URL base (quitamos slash final si tiene)
    const baseUrl = process.env.GETNET_ENDPOINT.replace(/\/$/, "");
    const apiUrl = `${baseUrl}/api/session`; // <--- RUTA CORRECTA PARA CHILE

    // 2. GUARDAR EN SUPABASE
    console.log("💾 Guardando orden en DB...");
    const { data: orderData, error: orderError } = await supabase
      .from('ventas_generales')
      .insert([{
          descripcion: `Reserva Web - ${customerDetails.name}`,
          monto: total,
          tipo: 'reserva_web',
          metodo_pago: 'getnet_pendiente',
          detalle_json: cart
      }])
      .select()
      .single();

    if (orderError) throw new Error(`Error DB: ${orderError.message}`);
    const orderId = orderData.id.toString();
    console.log("✅ Orden ID:", orderId);

    // 3. GENERAR AUTENTICACIÓN (PlacetoPay / GetNet Chile)
    // GetNet Chile pide: Login + Seed (fecha) + Nonce (random) + TranKey (hash)
    
    const login = process.env.GETNET_LOGIN;
    const secretKey = process.env.GETNET_SECRET_KEY;
    
    // Generar Seed (Fecha ISO actual)
    const seed = new Date().toISOString();
    
    // Generar Nonce (Aleatorio)
    const nonceRaw = crypto.randomBytes(16);
    const nonceBase64 = nonceRaw.toString('base64');
    
    // Generar TranKey: Base64(SHA1(Nonce + Seed + SecretKey))
    // Nota: El hash se hace con el nonce RAW, no el base64
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
    const returnUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/confirmacion?order=${orderId}`;
    
    const payload = {
        auth: authData,
        locale: "es_CL",
        payment: {
            reference: orderId,
            description: "Consumo Boulevard Zapallar",
            amount: {
                currency: "CLP",
                total: total
            },
            allowPartial: false
        },
        expiration: new Date(Date.now() + 15 * 60000).toISOString(), // Expira en 15 mins
        returnUrl: returnUrl,
        ipAddress: "127.0.0.1", // Vercel no siempre da la IP real, usamos local
        userAgent: "NextJS-Vercel"
    };

    console.log(`🔌 Conectando a: ${apiUrl}`);

    // 5. ENVIAR A GETNET
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const result = await response.json();
    console.log("✅ Respuesta GetNet:", result.status?.status);

    // 6. MANEJAR RESPUESTA
    if (result.status && result.status.status === "OK") {
        return NextResponse.json({ 
            url: result.processUrl, // GetNet Chile devuelve 'processUrl'
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