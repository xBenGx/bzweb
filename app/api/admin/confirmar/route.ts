import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import path from "path";

// ----------------------------------------------------------------------
// 1. CARGA SEGURA DE LIBRERÍAS
// ----------------------------------------------------------------------
// Intentamos cargar Canvas. Si falla, no rompemos el servidor.
let canvasLib: any = null;
try {
    canvasLib = require("canvas");
} catch (e) {
    console.warn("⚠️ Canvas no disponible. Se usará modo solo texto o imagen del cliente.");
}

// ----------------------------------------------------------------------
// 2. CONFIGURACIÓN Y CREDENCIALES
// ----------------------------------------------------------------------

// Credenciales SUPABASE (Directas)
const SUPABASE_URL = "https://lqelewbxejvsiitpjjly.supabase.co";
const SUPABASE_KEY = "sb_publishable_WQ6_AT1KoCGLJ_kbAgrszA_-p9hSp_Z"; 

// Configuración WHATSAPP (UltraMsg)
const WAPP_INSTANCE_ID = "instance160510"; 
const WAPP_TOKEN = "j5bw6c72071pgp29";     

// URLs para imagen y texto
const WAPP_URL_IMAGE = `https://api.ultramsg.com/${WAPP_INSTANCE_ID}/messages/image`; 
const WAPP_URL_CHAT = `https://api.ultramsg.com/${WAPP_INSTANCE_ID}/messages/chat`; 

// ----------------------------------------------------------------------
// 3. FUNCIONES AUXILIARES
// ----------------------------------------------------------------------

/**
 * Genera una imagen PNG del ticket usando Canvas (Lógica del Servidor).
 * Retorna el Buffer de la imagen o NULL si falla/no está disponible.
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
        ctx.fillStyle = "#111111"; // Negro
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = "#DAA520"; 
        ctx.lineWidth = 30;
        ctx.strokeRect(40, 40, width - 80, height - 80);
    }

    // 2. Configuración de Textos
    ctx.fillStyle = image ? "#000000" : "#FFFFFF";
    
    // Código
    ctx.font = "bold 55px Arial"; 
    ctx.textAlign = "center";
    const yCode = image ? 450 : height / 2 - 150;
    ctx.fillText(reserva.reservation_code, width / 2, yCode); 

    // Detalles
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
 * Envía el mensaje a UltraMsg.
 * CORRECCIÓN: Agrega el "+" al número final.
 */
async function enviarWhatsApp(telefono: string, imagenUrl: string | null, codigo: string, nombre: string) {
  // 1. Obtener solo dígitos primero para análisis
  let rawDigits = telefono.replace(/\D/g, ""); 
  
  // 2. Lógica para completar números de Chile si faltan prefijos
  if (rawDigits.length === 9 && rawDigits.startsWith("9")) {
      rawDigits = "56" + rawDigits; // ej: 912345678 -> 56912345678
  }
  if (rawDigits.length === 8) {
      rawDigits = "569" + rawDigits; // ej: 12345678 -> 56912345678
  }
  // Si ya tiene 11 (569...) lo dejamos igual.

  // 3. AGREGAR EL "+" (Requerimiento de usuario)
  const phoneFinal = "+" + rawDigits;

  const mensaje = `Hola ${nombre} 👋,\n\n¡Tu reserva en *Boulevard Zapallar* ha sido CONFIRMADA! 🥂\n\n📌 *Código:* ${codigo}\n\n${imagenUrl ? "Adjuntamos tu ticket de entrada. 🎟️" : "Por favor muestra este mensaje y código en recepción."}\n\n¡Te esperamos!`;

  try {
    let urlToUse = WAPP_URL_CHAT;
    let bodyParams: any = {
        token: WAPP_TOKEN,
        to: phoneFinal, // Aquí va el número con "+"
        body: mensaje, 
        priority: 10
    };

    if (imagenUrl) {
        urlToUse = WAPP_URL_IMAGE;
        bodyParams = {
            token: WAPP_TOKEN,
            to: phoneFinal, // Aquí va el número con "+"
            image: imagenUrl,
            caption: mensaje,
            priority: 10
        };
    }

    console.log(`📨 Enviando a: ${phoneFinal} | Modo: ${imagenUrl ? 'IMAGEN' : 'TEXTO'}`);

    const res = await fetch(urlToUse, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(bodyParams)
    });
    
    // Leemos la respuesta para debug
    const responseText = await res.text();
    
    if (!res.ok) {
        console.error("❌ Error HTTP UltraMsg:", responseText);
        return false;
    }
    
    console.log("✅ Respuesta UltraMsg:", responseText);
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
    // Recibimos ticketUrl si viene del Dashboard (HTML2Canvas)
    const { reservaId, ticketUrl: clientTicketUrl } = body;

    if (!reservaId) return NextResponse.json({ error: "Falta reservaId" }, { status: 400 });

    // 2. Obtener Reserva
    const { data: reserva, error } = await supabase
      .from("reservas")
      .select("*")
      .eq("id", reservaId)
      .single();

    if (error || !reserva) {
        console.error("Reserva no encontrada");
        return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    }

    // 3. Generar Código si falta
    let codigoReserva = reserva.reservation_code;
    if (!codigoReserva) {
        codigoReserva = `BZ-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    // 4. Determinar URL del Ticket
    // Prioridad: 1. URL del cliente | 2. Generada en servidor | 3. Texto
    let finalTicketUrl = clientTicketUrl || "";

    // Si NO vino del cliente y tenemos Canvas, intentamos generar
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
        console.warn("⚠️ Sin teléfono");
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