import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import path from "path";

// ----------------------------------------------------------------------
// 1. CONFIGURACIÓN Y CREDENCIALES (CORREGIDAS SEGÚN TU IMAGEN)
// ----------------------------------------------------------------------

// Credenciales SUPABASE
const SUPABASE_URL = "https://lqelewbxejvsiitpjjly.supabase.co";
const SUPABASE_KEY = "sb_publishable_WQ6_AT1KoCGLJ_kbAgrszA_-p9hSp_Z"; 

// Configuración WHATSAPP (UltraMsg)
const WAPP_INSTANCE_ID = "instance160510"; 
// ¡AQUÍ ESTABA EL ERROR! Corregido el '1' por un '4' según tu imagen
const WAPP_TOKEN = "j5bw6c72074pgp29";     

// URLs base
const WAPP_API_URL = `https://api.ultramsg.com/${WAPP_INSTANCE_ID}`;

// ----------------------------------------------------------------------
// 2. FUNCIONES AUXILIARES
// ----------------------------------------------------------------------

// Carga segura de Canvas (Fallback)
let canvasLib: any = null;
try {
    canvasLib = require("canvas");
} catch (e) {
    console.warn("⚠️ Canvas no disponible. Se usará modo texto o imagen externa.");
}

/**
 * Genera una imagen PNG del ticket (Lógica Servidor)
 */
async function generarTicketImagen(reserva: any) {
  if (!canvasLib) return null;

  try {
    const { createCanvas, loadImage } = canvasLib;
    const bgPath = path.join(process.cwd(), "public", "ticket-bg.png");
    
    let width = 1080;
    let height = 1920;
    let image = null;

    try {
        image = await loadImage(bgPath);
        width = image.width;
        height = image.height;
    } catch (e) {
        // Ignoramos error de imagen de fondo
    }

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    if (image) {
        ctx.drawImage(image, 0, 0);
    } else {
        ctx.fillStyle = "#111111";
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = "#DAA520";
        ctx.lineWidth = 30;
        ctx.strokeRect(40, 40, width - 80, height - 80);
    }

    ctx.fillStyle = image ? "#000000" : "#FFFFFF";
    ctx.font = "bold 55px Arial"; 
    ctx.textAlign = "center";
    const yCode = image ? 450 : height / 2 - 150;
    ctx.fillText(reserva.reservation_code, width / 2, yCode); 

    ctx.font = "bold 30px Arial";
    ctx.textAlign = image ? "right" : "center"; 
    const xPos = image ? 550 : width / 2;
    const yBase = image ? 580 : (height / 2) + 50;

    ctx.fillText(`${reserva.date_reserva}, ${reserva.time_reserva}`, xPos, yBase);
    ctx.fillText(reserva.zone, xPos, yBase + 60);
    ctx.fillText(`${reserva.guests} Personas`, xPos, yBase + 120);

    return canvas.toBuffer("image/png");
  } catch (error) {
    console.error("❌ Error generando ticket visual:", error);
    return null; 
  }
}

/**
 * Envía el mensaje a UltraMsg usando fetch (Equivalente moderno al código de la imagen)
 */
async function enviarWhatsApp(telefono: string, imagenUrl: string | null, codigo: string, nombre: string) {
  // 1. Limpieza y Formato
  let raw = telefono.replace(/\D/g, ""); 
  
  // Lógica Chile
  if (raw.length === 9 && raw.startsWith("9")) raw = "56" + raw;
  if (raw.length === 8) raw = "569" + raw;
  
  // Agregar el "+" (UltraMsg lo requiere)
  const phoneFinal = "+" + raw;

  const mensaje = `Hola ${nombre} 👋,\n\n¡Tu reserva en *Boulevard Zapallar* ha sido CONFIRMADA! 🥂\n\n📌 *Código:* ${codigo}\n\n${imagenUrl ? "Adjuntamos tu ticket de entrada. 🎟️" : "Por favor muestra este mensaje en recepción."}\n\n¡Te esperamos!`;

  try {
    // Definir endpoint según si es imagen o chat
    const endpoint = imagenUrl ? "/messages/image" : "/messages/chat";
    const url = `${WAPP_API_URL}${endpoint}`;

    // Construir parámetros URL Encoded (Igual que el ejemplo qs.stringify)
    const params = new URLSearchParams();
    params.append("token", WAPP_TOKEN);
    params.append("to", phoneFinal);
    
    if (imagenUrl) {
        params.append("image", imagenUrl);
        params.append("caption", mensaje);
    } else {
        params.append("body", mensaje);
    }
    params.append("priority", "10");

    console.log(`📨 Enviando a: ${phoneFinal} | URL: ${url}`);

    const res = await fetch(url, {
      method: "POST",
      headers: { 
          "Content-Type": "application/x-www-form-urlencoded" 
      },
      body: params
    });
    
    const responseText = await res.text();
    console.log("📡 Respuesta UltraMsg:", responseText);
    
    if (!res.ok) {
        console.error("❌ Error HTTP UltraMsg:", responseText);
        return false;
    }
    
    return true;

  } catch (e) {
    console.error("❌ Error conexión WhatsApp:", e);
    return false;
  }
}

// ----------------------------------------------------------------------
// 3. ENDPOINT PRINCIPAL (POST)
// ----------------------------------------------------------------------
export async function POST(req: Request) {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const body = await req.json();
    const { reservaId, ticketUrl: clientTicketUrl } = body;

    if (!reservaId) return NextResponse.json({ error: "Falta reservaId" }, { status: 400 });

    // 1. Obtener Reserva
    const { data: reserva, error } = await supabase
      .from("reservas")
      .select("*")
      .eq("id", reservaId)
      .single();

    if (error || !reserva) {
        return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    }

    // 2. Generar Código
    let codigoReserva = reserva.reservation_code;
    if (!codigoReserva) {
        codigoReserva = `BZ-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    // 3. Gestionar Imagen (Cliente > Servidor > Nada)
    let finalTicketUrl = clientTicketUrl || "";

    if (!finalTicketUrl && canvasLib) {
        try {
            const ticketBuffer = await generarTicketImagen({ ...reserva, reservation_code: codigoReserva });
            if (ticketBuffer) {
                const fileName = `ticket-${codigoReserva}-${Date.now()}.png`;
                const { error: uploadError } = await supabase.storage
                  .from('tickets')
                  .upload(fileName, ticketBuffer, { contentType: 'image/png', upsert: true });

                if (!uploadError) {
                    const { data } = supabase.storage.from('tickets').getPublicUrl(fileName);
                    finalTicketUrl = data.publicUrl;
                }
            }
        } catch (e) { console.error("Error canvas server:", e); }
    }

    // 4. Enviar WhatsApp (AQUÍ ES DONDE IMPORTA EL TOKEN CORREGIDO)
    let whatsappEnviado = false;
    if (reserva.phone) {
       whatsappEnviado = await enviarWhatsApp(reserva.phone, finalTicketUrl || null, codigoReserva, reserva.name);
    }

    // 5. Actualizar DB
    await supabase.from("reservas")
      .update({ 
        status: "confirmada", 
        reservation_code: codigoReserva,
        ticket_url: finalTicketUrl || null 
      })
      .eq("id", reservaId);

    return NextResponse.json({ 
        success: true, 
        whatsapp: whatsappEnviado,
        debug_token: "Token corregido a ...pgp29" // Para que sepas que se actualizó
    });

  } catch (err: any) {
    console.error("🔥 Error Crítico Endpoint:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}