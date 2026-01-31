import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import path from "path";

// ----------------------------------------------------------------------
// 1. CONFIGURACIÓN Y CREDENCIALES
// ----------------------------------------------------------------------

// Credenciales SUPABASE
const SUPABASE_URL = "https://lqelewbxejvsiitpjjly.supabase.co";
const SUPABASE_KEY = "sb_publishable_WQ6_AT1KoCGLJ_kbAgrszA_-p9hSp_Z"; 

// Configuración WHATSAPP (UltraMsg)
const WAPP_INSTANCE_ID = "instance160510"; 
// Token Corregido (Según tu imagen terminación 4pgp29)
const WAPP_TOKEN = "j5bw6c72074pgp29";     

// URLs base de UltraMsg
const WAPP_API_URL = `https://api.ultramsg.com/${WAPP_INSTANCE_ID}`;

// ----------------------------------------------------------------------
// 2. FUNCIONES AUXILIARES
// ----------------------------------------------------------------------

// Carga segura de Canvas (Fallback para el servidor si no llega imagen del cliente)
let canvasLib: any = null;
try {
    canvasLib = require("canvas");
} catch (e) {
    console.warn("⚠️ Canvas no disponible en servidor. Se dependerá de la imagen enviada por el cliente.");
}

/**
 * Genera una imagen PNG del ticket (Lógica Servidor - RESPALDO)
 * Solo se usa si el cliente no envió la imagen generada.
 */
async function generarTicketImagenServidor(reserva: any) {
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
        console.warn("⚠️ No se encontró ticket-bg.png en servidor, usando fondo generado.");
    }

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // 1. Dibujar Fondo
    if (image) {
        ctx.drawImage(image, 0, 0);
    } else {
        ctx.fillStyle = "#111111";
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = "#DAA520";
        ctx.lineWidth = 30;
        ctx.strokeRect(40, 40, width - 80, height - 80);
    }

    // 2. Configuración de Textos
    ctx.fillStyle = image ? "#000000" : "#FFFFFF";
    
    // Código
    ctx.font = "bold 80px Arial"; 
    ctx.textAlign = "center";
    const yCode = image ? 450 : height / 2 - 150;
    ctx.fillText(reserva.reservation_code, width / 2, yCode); 

    // Detalles
    ctx.font = "bold 40px Arial";
    ctx.textAlign = image ? "right" : "center"; 
    
    const xPos = image ? 900 : width / 2;
    const yBase = image ? 580 : (height / 2) + 50;
    const lh = 70;

    ctx.fillText(`${reserva.date_reserva}`, xPos, yBase);
    ctx.fillText(`${reserva.time_reserva} hrs`, xPos, yBase + lh);
    ctx.fillText(reserva.zone, xPos, yBase + (lh * 2));
    ctx.fillText(`${reserva.guests} Personas`, xPos, yBase + (lh * 3));

    return canvas.toBuffer("image/png");

  } catch (error) {
    console.error("❌ Error generando ticket server-side:", error);
    return null; 
  }
}

/**
 * Envía el mensaje a UltraMsg usando fetch con formato x-www-form-urlencoded
 */
async function enviarWhatsApp(telefono: string, imagenUrl: string | null, codigo: string, nombre: string) {
  // 1. Limpieza y Formato
  let raw = telefono.replace(/\D/g, ""); 
  
  // Lógica Chile para asegurar 11 dígitos (56 9 XXXXXXXX)
  if (raw.length === 9 && raw.startsWith("9")) {
      raw = "56" + raw;
  }
  if (raw.length === 8) {
      raw = "569" + raw;
  }
  
  // Agregar el "+" (UltraMsg lo requiere explícitamente en algunos casos)
  const phoneFinal = "+" + raw;

  const mensaje = `Hola ${nombre} 👋,\n\n¡Tu reserva en *Boulevard Zapallar* ha sido CONFIRMADA! 🥂\n\n📌 *Código:* ${codigo}\n📅 *Fecha:* Pronto\n\n${imagenUrl ? "Adjuntamos tu ticket de entrada. 🎟️" : "Por favor muestra este mensaje y código en recepción."}\n\n¡Te esperamos!`;

  try {
    // Definir endpoint (Chat o Imagen)
    const endpoint = imagenUrl ? "/messages/image" : "/messages/chat";
    const url = `${WAPP_API_URL}${endpoint}`;

    // Construir parámetros URL Encoded (Estándar UltraMsg)
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

    console.log(`📨 Enviando a: ${phoneFinal} | URL: ${url} | Tiene Imagen: ${!!imagenUrl}`);

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
        return { success: false, error: responseText };
    }
    
    // Verificar si la respuesta contiene error aunque sea 200 OK
    if (responseText.includes("error")) {
         return { success: false, error: responseText };
    }

    return { success: true, details: responseText };

  } catch (e: any) {
    console.error("❌ Error conexión WhatsApp:", e);
    return { success: false, error: e.message };
  }
}

// ----------------------------------------------------------------------
// 3. ENDPOINT PRINCIPAL (POST)
// ----------------------------------------------------------------------
export async function POST(req: Request) {
  try {
    console.log("🚀 Iniciando endpoint confirmar...");
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const body = await req.json();
    
    // Recibimos datos extendidos del Dashboard (incluyendo la imagen generada por html2canvas)
    const { reservaId, ticketUrl: clientTicketUrl, codigo: clientCodigo } = body;

    if (!reservaId) return NextResponse.json({ error: "Falta reservaId" }, { status: 400 });

    // 1. Obtener Reserva de la Base de Datos
    const { data: reserva, error } = await supabase
      .from("reservas")
      .select("*")
      .eq("id", reservaId)
      .single();

    if (error || !reserva) {
        return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    }

    // 2. Determinar Código Final
    // Usamos el que manda el cliente (recién generado) o el que tiene la DB, o creamos uno.
    const codigoFinal = clientCodigo || reserva.reservation_code || `BZ-${Math.floor(1000 + Math.random() * 9000)}`;

    // 3. Determinar Imagen Final (Estrategia Híbrida)
    let finalTicketUrl = clientTicketUrl || ""; // Prioridad 1: Imagen del Cliente

    // Si NO vino del cliente y tenemos Canvas en servidor, intentamos generar (Prioridad 2)
    if (!finalTicketUrl && canvasLib) {
        try {
            console.log("⚠️ No llegó imagen del cliente, intentando generar en servidor...");
            const ticketBuffer = await generarTicketImagenServidor({ ...reserva, reservation_code: codigoFinal });
            
            if (ticketBuffer) {
                const fileName = `ticket-${codigoFinal}-${Date.now()}.png`;
                const { error: uploadError } = await supabase.storage
                  .from('tickets')
                  .upload(fileName, ticketBuffer, { contentType: 'image/png', upsert: true });

                if (!uploadError) {
                    const { data } = supabase.storage.from('tickets').getPublicUrl(fileName);
                    finalTicketUrl = data.publicUrl;
                    console.log("✅ Imagen generada en SERVIDOR:", finalTicketUrl);
                } else {
                    console.error("⚠️ Error subiendo imagen server:", uploadError.message);
                }
            }
        } catch (imgErr) {
            console.error("⚠️ Falló generación server-side:", imgErr);
        }
    }

    // 4. Enviar WhatsApp
    // CORRECCIÓN AQUÍ: Usamos 'any' para evitar el error de TypeScript TS2322
    let whatsappResult: any = { success: false, error: "Sin teléfono" };
    
    if (reserva.phone) {
       whatsappResult = await enviarWhatsApp(reserva.phone, finalTicketUrl || null, codigoFinal, reserva.name);
    } else {
        console.warn("⚠️ Reserva sin teléfono, omitiendo WhatsApp.");
    }

    // 5. Actualizar Base de Datos (Siempre, aunque falle el WS, para no trabar el sistema)
    await supabase.from("reservas")
      .update({ 
        status: "confirmada", 
        reservation_code: codigoFinal,
        ticket_url: finalTicketUrl || null 
      })
      .eq("id", reservaId);

    // 6. Respuesta al Cliente
    return NextResponse.json({ 
        success: true, 
        whatsapp: whatsappResult.success,
        whatsapp_debug: whatsappResult,
        mode: finalTicketUrl ? "imagen" : "texto_fallback",
        code: codigoFinal
    });

  } catch (err: any) {
    console.error("🔥 Error Crítico Endpoint:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}