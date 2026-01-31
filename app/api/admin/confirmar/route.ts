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
const WAPP_TOKEN = "j5bw6c72071pgp29";     

// URLs para imagen y texto
const WAPP_URL_IMAGE = `https://api.ultramsg.com/${WAPP_INSTANCE_ID}/messages/image`; 
const WAPP_URL_CHAT = `https://api.ultramsg.com/${WAPP_INSTANCE_ID}/messages/chat`; 

// ----------------------------------------------------------------------
// 2. FUNCIONES AUXILIARES
// ----------------------------------------------------------------------

// Intentamos cargar Canvas de forma dinámica
let canvasLib: any = null;
try {
    canvasLib = require("canvas");
} catch (e) {
    console.warn("⚠️ La librería 'canvas' no está instalada. Se usará modo solo texto/fallback.");
}

/**
 * Genera una imagen PNG del ticket usando Canvas.
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
        console.warn("⚠️ No se encontró ticket-bg.png, usando fondo generado.");
    }

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // 1. Dibujar Fondo
    if (image) {
        ctx.drawImage(image, 0, 0);
    } else {
        ctx.fillStyle = "#111111"; // Negro elegante
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = "#DAA520";
        ctx.lineWidth = 30;
        ctx.strokeRect(40, 40, width - 80, height - 80);
    }

    // 2. Configuración de Textos
    ctx.fillStyle = image ? "#000000" : "#FFFFFF";
    
    // Código de Reserva
    ctx.font = "bold 80px Arial"; 
    ctx.textAlign = "center";
    // Ajuste vertical según si hay imagen o no
    const yCode = image ? 450 : height / 2 - 150;
    ctx.fillText(reserva.reservation_code, width / 2, yCode); 

    // Detalles
    ctx.font = "bold 40px Arial";
    ctx.textAlign = image ? "right" : "center"; 
    
    const xPos = image ? 550 : width / 2;
    const yBase = image ? 580 : (height / 2) + 50;
    const lh = 70; // Line height

    ctx.fillText(`${reserva.date_reserva}`, xPos, yBase);
    ctx.fillText(`${reserva.time_reserva} hrs`, xPos, yBase + lh);
    ctx.fillText(reserva.zone, xPos, yBase + (lh * 2));
    ctx.fillText(`${reserva.guests} Personas`, xPos, yBase + (lh * 3));

    return canvas.toBuffer("image/png");

  } catch (error) {
    console.error("❌ Error generando ticket visual:", error);
    return null; 
  }
}

/**
 * Envía el mensaje a UltraMsg.
 * CORRECCIÓN: Formato Estricto con "+" (+569...)
 */
async function enviarWhatsApp(telefono: string, imagenUrl: string | null, codigo: string, nombre: string) {
  // 1. OBTENER SOLO DÍGITOS
  let rawDigits = telefono.replace(/\D/g, ""); 
  
  // 2. CORRECCIÓN INTELIGENTE PARA CHILE
  // Si tiene 9 dígitos y empieza con 9 (ej: 958444061) -> Falta el 56
  if (rawDigits.length === 9 && rawDigits.startsWith("9")) {
      rawDigits = "56" + rawDigits;
  }
  // Si tiene 8 dígitos (ej: 58444061) -> Falta el 569
  if (rawDigits.length === 8) {
      rawDigits = "569" + rawDigits;
  }
  // Si ya tiene 11 (569...) lo dejamos igual.

  // 3. AGREGAR EL "+" (Vital para que UltraMsg lo reconozca igual que en tu prueba manual)
  const phoneFinal = "+" + rawDigits;

  // Mensaje con Emojis
  const mensaje = `Hola ${nombre} 👋,\n\n¡Tu reserva en *Boulevard Zapallar* ha sido CONFIRMADA! 🥂\n\n📌 *Código:* ${codigo}\n📅 *Fecha:* Pronto\n\n${imagenUrl ? "Adjuntamos tu ticket de entrada. 🎟️" : "Por favor muestra este mensaje y código en recepción."}\n\n¡Te esperamos!`;

  try {
    let urlToUse = WAPP_URL_CHAT;
    let bodyParams: any = {
        token: WAPP_TOKEN,
        to: phoneFinal, // Enviamos con el +
        body: mensaje, 
        priority: 10
    };

    // Si hay imagen, cambiamos endpoint
    if (imagenUrl) {
        urlToUse = WAPP_URL_IMAGE;
        bodyParams = {
            token: WAPP_TOKEN,
            to: phoneFinal, // Enviamos con el +
            image: imagenUrl,
            caption: mensaje,
            priority: 10
        };
    }

    console.log(`📨 Enviando a: ${phoneFinal} | URL: ${urlToUse}`);

    const res = await fetch(urlToUse, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(bodyParams)
    });
    
    // Loguear respuesta de UltraMsg para depuración
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
    console.log("🚀 Iniciando confirmación...");

    // 1. Inicializar Supabase
    if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error("Credenciales vacías");
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    
    const body = await req.json();
    // Aceptamos ticketUrl si viene del frontend (plan B)
    const { reservaId, ticketUrl: clientTicketUrl } = body;

    if (!reservaId) return NextResponse.json({ error: "Falta reservaId" }, { status: 400 });

    // 2. Obtener Reserva
    const { data: reserva, error } = await supabase
      .from("reservas")
      .select("*")
      .eq("id", reservaId)
      .single();

    if (error || !reserva) {
        return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    }

    // 3. Generar Código si falta
    let codigoReserva = reserva.reservation_code;
    if (!codigoReserva) {
        codigoReserva = `BZ-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    // 4. Lógica de Imagen (Prioridad: Frontend > Backend Canvas > Texto)
    let finalTicketUrl = clientTicketUrl || "";

    // Si NO vino del cliente y tenemos Canvas, intentamos generar en servidor
    if (!finalTicketUrl && canvasLib) {
        try {
            const reservaConCodigo = { ...reserva, reservation_code: codigoReserva };
            const ticketBuffer = await generarTicketImagen(reservaConCodigo);
            
            if (ticketBuffer) {
                const fileName = `ticket-${codigoReserva}-${Date.now()}.png`;
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
            console.error("⚠️ Falló Canvas Server:", imgErr);
        }
    }

    // 5. Enviar WhatsApp
    let whatsappEnviado = false;
    if (reserva.phone) {
       whatsappEnviado = await enviarWhatsApp(reserva.phone, finalTicketUrl || null, codigoReserva, reserva.name);
    } else {
        console.warn("⚠️ Reserva sin teléfono");
    }

    // 6. Actualizar DB
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
        mode: finalTicketUrl ? "imagen" : "texto_fallback",
        code: codigoReserva
    });

  } catch (err: any) {
    console.error("🔥 Error Crítico Endpoint:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}