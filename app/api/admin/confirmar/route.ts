import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import path from "path";
// Importamos canvas para dibujar en el servidor (Backend)
import { createCanvas, loadImage } from "canvas";

// ----------------------------------------------------------------------
// 1. CONFIGURACIÓN Y CREDENCIALES
// ----------------------------------------------------------------------

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Inicializar Supabase con permisos de administrador (Service Role)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const WAPP_INSTANCE_ID = process.env.ULTRAMSG_INSTANCE_ID || "instance161222"; 
const WAPP_TOKEN = process.env.ULTRAMSG_TOKEN || "65qat7d38cyc4ozf";     
const WAPP_API_URL = `https://api.ultramsg.com/${WAPP_INSTANCE_ID}`;

// ----------------------------------------------------------------------
// 2. GENERADOR DE IMAGEN (SERVER SIDE) - ¡AQUÍ ESTÁ LA MAGIA!
// ----------------------------------------------------------------------

/**
 * Esta función dibuja el ticket pixel por pixel en el servidor.
 * No depende del navegador del usuario.
 */
async function generarTicketHD(reserva: any, codigo: string) {
  try {
    // 1. Cargar la imagen de fondo desde la carpeta public
    // process.cwd() es necesario en Vercel para encontrar archivos
    const bgPath = path.join(process.cwd(), "public", "ticket-bg.png");
    const image = await loadImage(bgPath);

    // 2. Crear un Lienzo de 1080x1920 (Calidad HD Vertical)
    const canvas = createCanvas(1080, 1920);
    const ctx = canvas.getContext("2d");

    // 3. Dibujar el Fondo
    ctx.drawImage(image, 0, 0, 1080, 1920);

    // 4. CONFIGURACIÓN DE ESTILOS DE TEXTO
    // Usamos color NEGRO (#000000) porque el fondo en esas zonas es blanco
    ctx.fillStyle = "#000000"; 
    
    // --- A. DIBUJAR EL CÓDIGO (En el recuadro blanco central) ---
    ctx.font = "900 110px Arial"; // Fuente gruesa
    ctx.textAlign = "center";     // Centrado horizontalmente
    
    // Coordenadas calculadas: 
    // X = 540 (Mitad de 1080)
    // Y = 940 (Altura visual del recuadro punteado en tu imagen)
    ctx.fillText(codigo, 540, 940); 

    // --- B. DIBUJAR LOS DETALLES (Fecha, Zona, Pax) ---
    // Cambiamos alineación a la izquierda
    ctx.textAlign = "left"; 
    ctx.font = "bold 40px Arial"; // Fuente un poco más pequeña pero legible
    
    // Coordenada X fija para alinear los textos (Un poco a la derecha del borde)
    const xPos = 80; 

    // 1. FECHA Y HORA (Debajo de la etiqueta "FECHA Y HORA")
    // Altura aprox Y = 1330
    ctx.fillText(`${reserva.date_reserva}  |  ${reserva.time_reserva} HRS`, xPos, 1330);

    // 2. ZONA (Debajo de la etiqueta "ZONA")
    // Altura aprox Y = 1490
    ctx.fillText(reserva.zone ? reserva.zone.toUpperCase() : "GENERAL", xPos, 1490);

    // 3. PERSONAS (Debajo de la etiqueta "PERSONAS")
    // Altura aprox Y = 1650
    ctx.fillText(`${reserva.guests} PERSONAS`, xPos, 1650);

    // Retornamos la imagen generada como un Buffer (archivo en memoria)
    return canvas.toBuffer("image/png");

  } catch (error) {
    console.error("❌ Error pintando canvas en servidor:", error);
    return null;
  }
}

// ----------------------------------------------------------------------
// 3. ENVÍO DE WHATSAPP
// ----------------------------------------------------------------------

async function enviarWhatsApp(telefono: string, imagenUrl: string | null, codigo: string, nombre: string) {
  // Limpieza de teléfono (Formato Chile 569...)
  let raw = telefono.replace(/\D/g, "");
  if (raw.length === 8) raw = "569" + raw;
  if (raw.length === 9 && raw.startsWith("9")) raw = "56" + raw;
  
  const mensaje = `Hola ${nombre} 👋,

¡Tu reserva en *Boulevard Zapallar* está CONFIRMADA! 🥂

📌 Código: *${codigo}*

Adjuntamos tu ticket oficial de entrada. 🎟️
Por favor presenta la imagen adjunta en recepción para validar tu ingreso.

¡Te esperamos!`;

  try {
    const endpoint = imagenUrl ? "/messages/image" : "/messages/chat";
    const body: any = {
        token: WAPP_TOKEN,
        to: raw,
        priority: 10
    };

    if (imagenUrl) {
        body.image = imagenUrl;
        body.caption = mensaje;
    } else {
        body.body = mensaje;
    }

    const formBody = new URLSearchParams(body);

    console.log(`📨 Enviando WhatsApp a ${raw}...`);

    const res = await fetch(`${WAPP_API_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formBody
    });
    
    return res.ok;
  } catch (e) {
    console.error("Error WhatsApp:", e);
    return false;
  }
}

// ----------------------------------------------------------------------
// 4. ENDPOINT PRINCIPAL (POST)
// ----------------------------------------------------------------------
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Ahora solo necesitamos el ID y el teléfono, el servidor hace el resto
    const { reservaId, phone } = body;

    if (!reservaId) return NextResponse.json({ error: "Falta reservaId" }, { status: 400 });

    // 1. Obtener Reserva de la Base de Datos
    const { data: reserva, error } = await supabaseAdmin
      .from("reservas")
      .select("*")
      .eq("id", reservaId)
      .single();

    if (error || !reserva) {
        return NextResponse.json({ error: "Reserva no encontrada en DB" }, { status: 404 });
    }

    // 2. Determinar Código Final
    const codigoFinal = reserva.code || `BZ-${Math.floor(1000 + Math.random() * 9000)}`;

    // 3. GENERACIÓN DE IMAGEN EN SERVIDOR (Prioridad Absoluta)
    console.log("🎨 Generando ticket internamente en el servidor...");
    let finalTicketUrl = "";
    
    // Llamamos a nuestra función que usa 'canvas'
    const ticketBuffer = await generarTicketHD(reserva, codigoFinal);

    // 4. Subir a Supabase Storage
    if (ticketBuffer) {
        const fileName = `ticket-${codigoFinal}-${Date.now()}.png`;
        
        // Subimos al bucket 'tickets'
        const { error: uploadError } = await supabaseAdmin.storage
            .from('tickets')
            .upload(fileName, ticketBuffer, { contentType: 'image/png', upsert: true });

        if (!uploadError) {
            const { data } = supabaseAdmin.storage.from('tickets').getPublicUrl(fileName);
            finalTicketUrl = data.publicUrl;
            console.log("✅ Imagen generada y subida:", finalTicketUrl);
        } else {
            console.error("❌ Error subiendo a Supabase:", uploadError);
        }
    } else {
        console.warn("⚠️ Falló la generación de imagen en servidor (Buffer vacío).");
    }

    // 5. Enviar WhatsApp
    const targetPhone = phone || reserva.phone;
    let whatsappResult = false;
    
    if (targetPhone) {
       whatsappResult = await enviarWhatsApp(targetPhone, finalTicketUrl || null, codigoFinal, reserva.name);
    }

    // 6. Actualizar Base de Datos (Estado y Código)
    await supabaseAdmin.from("reservas")
      .update({ 
        status: "confirmada", 
        code: codigoFinal, 
        // ticket_url: finalTicketUrl 
      })
      .eq("id", reservaId);

    return NextResponse.json({ 
        success: true, 
        whatsapp: whatsappResult,
        code: codigoFinal
    });

  } catch (err: any) {
    console.error("🔥 Error Crítico Endpoint:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}