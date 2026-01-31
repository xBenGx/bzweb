import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import path from "path";

// ----------------------------------------------------------------------
// 1. CONFIGURACIÓN Y CREDENCIALES (HARCODED PARA EVITAR ERRORES DE ENTORNO)
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

// Intentamos cargar Canvas de forma dinámica para evitar que el servidor explote si falta la librería
let canvasLib: any = null;
try {
    canvasLib = require("canvas");
} catch (e) {
    console.warn("⚠️ La librería 'canvas' no está instalada o soportada en este servidor. Se usará modo solo texto.");
}

/**
 * Genera una imagen PNG del ticket usando Canvas.
 * Retorna el Buffer de la imagen o NULL si falla.
 */
async function generarTicketImagen(reserva: any) {
  // Si la librería no cargó al inicio, retornamos null directo (Modo Texto)
  if (!canvasLib) return null;

  try {
    const { createCanvas, loadImage } = canvasLib;
    const bgPath = path.join(process.cwd(), "public", "ticket-bg.png");
    
    // Dimensiones por defecto
    let width = 1080;
    let height = 1920;
    
    let image = null;
    try {
        image = await loadImage(bgPath);
        width = image.width;
        height = image.height;
    } catch (e) {
        console.warn("⚠️ No se encontró ticket-bg.png en public, generando fondo negro por código.");
    }

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // --- 1. DIBUJAR FONDO ---
    if (image) {
        ctx.drawImage(image, 0, 0);
    } else {
        // Fondo de respaldo elegante si no hay imagen
        ctx.fillStyle = "#111111"; // Negro casi puro
        ctx.fillRect(0, 0, width, height);
        // Borde Dorado
        ctx.strokeStyle = "#DAA520";
        ctx.lineWidth = 30;
        ctx.strokeRect(40, 40, width - 80, height - 80);
    }

    // --- 2. CONFIGURACIÓN DE TEXTOS ---
    // Ajustamos color dependiendo si hay imagen de fondo o es el negro
    ctx.fillStyle = image ? "#000000" : "#FFFFFF";
    
    // A. Código de Reserva (Grande y Centrado)
    ctx.font = "bold 80px Arial"; 
    ctx.textAlign = "center";
    // Si no hay imagen, centramos verticalmente, si hay, ajustamos a la posición del diseño
    const yCode = image ? 450 : height / 2 - 150;
    ctx.fillText(reserva.reservation_code, width / 2, yCode); 

    // B. Detalles de la Reserva
    ctx.font = "bold 40px Arial";
    ctx.textAlign = image ? "right" : "center"; 
    
    // Coordenadas base
    const xPos = image ? 900 : width / 2; // Si es imagen, alineado a la derecha
    const yBase = image ? 580 : (height / 2) + 50;
    const lineHeight = 70;

    // Pintamos los datos
    ctx.fillText(`${reserva.date_reserva}`, xPos, yBase);
    ctx.fillText(`${reserva.time_reserva} hrs`, xPos, yBase + lineHeight);
    ctx.fillText(reserva.zone, xPos, yBase + (lineHeight * 2));
    ctx.fillText(`${reserva.guests} Personas`, xPos, yBase + (lineHeight * 3));

    return canvas.toBuffer("image/png");

  } catch (error) {
    console.error("❌ Error generando ticket visual:", error);
    return null; // Fallback a texto
  }
}

/**
 * Envía el mensaje a UltraMsg.
 * Decide automáticamente si enviar Endpoint de Imagen o de Chat.
 */
async function enviarWhatsApp(telefono: string, imagenUrl: string | null, codigo: string, nombre: string) {
  // --- LIMPIEZA DE TELÉFONO PARA CHILE ---
  let phoneClean = telefono.replace(/\D/g, ""); // Quitar todo lo que no sea número
  
  // Caso 9 dígitos (9 1234 5678) -> Agregamos 56
  if (phoneClean.length === 9 && phoneClean.startsWith("9")) {
      phoneClean = "56" + phoneClean;
  }
  // Caso 8 dígitos antiguo (1234 5678) -> Agregamos 569
  if (phoneClean.length === 8) {
      phoneClean = "569" + phoneClean;
  }
  // Si ya tiene 11 (569...) o 12 (549...), se deja igual.

  // --- MENSAJE ---
  const mensaje = `Hola ${nombre} 👋,\n\n¡Tu reserva en *Boulevard Zapallar* ha sido CONFIRMADA! 🥂\n\n📌 *Código:* ${codigo}\n\n${imagenUrl ? "Adjuntamos tu ticket de entrada. 🎟️" : "Por favor muestra este mensaje y código en recepción."}\n\n¡Te esperamos!`;

  try {
    let urlToUse = WAPP_URL_CHAT;
    let bodyParams: any = {
        token: WAPP_TOKEN,
        to: phoneClean,
        body: mensaje, // 'body' para texto
        priority: 10
    };

    // Si logramos generar la imagen, cambiamos al endpoint de imagen
    if (imagenUrl) {
        urlToUse = WAPP_URL_IMAGE;
        bodyParams = {
            token: WAPP_TOKEN,
            to: phoneClean,
            image: imagenUrl,
            caption: mensaje, // 'caption' para imagen
            priority: 10
        };
    }

    console.log(`📨 Enviando WhatsApp a: ${phoneClean} | Modo: ${imagenUrl ? 'IMAGEN' : 'TEXTO'}`);

    const res = await fetch(urlToUse, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(bodyParams)
    });
    
    if (!res.ok) {
        const txt = await res.text();
        console.error("❌ Error respuesta UltraMsg:", txt);
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
    console.log("🚀 Iniciando proceso de confirmación...");

    // 1. Inicializar Supabase
    if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error("Credenciales vacías");
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    
    const body = await req.json();
    const { reservaId } = body;

    if (!reservaId) return NextResponse.json({ error: "Falta reservaId" }, { status: 400 });

    // 2. Obtener datos de la Reserva
    const { data: reserva, error } = await supabase
      .from("reservas")
      .select("*")
      .eq("id", reservaId)
      .single();

    if (error || !reserva) {
        console.error("Reserva no encontrada en DB");
        return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
    }

    // 3. Generar Código si no existe
    let codigoReserva = reserva.reservation_code;
    if (!codigoReserva) {
        codigoReserva = `BZ-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    // 4. Intentar Generar Ticket (Imagen)
    let publicUrl = "";
    
    // Solo intentamos si tenemos librería Canvas
    if (canvasLib) {
        try {
            // Pasamos el código actualizado al generador
            const reservaConCodigo = { ...reserva, reservation_code: codigoReserva };
            const ticketBuffer = await generarTicketImagen(reservaConCodigo);
            
            if (ticketBuffer) {
                const fileName = `ticket-${codigoReserva}-${Date.now()}.png`;
                // Subir a Supabase Storage (Bucket 'tickets')
                const { error: uploadError } = await supabase.storage
                  .from('tickets')
                  .upload(fileName, ticketBuffer, { contentType: 'image/png', upsert: true });

                if (!uploadError) {
                    const { data } = supabase.storage.from('tickets').getPublicUrl(fileName);
                    publicUrl = data.publicUrl;
                    console.log("✅ Imagen generada y subida:", publicUrl);
                } else {
                    console.error("⚠️ Error subiendo a Supabase Storage:", uploadError.message);
                }
            }
        } catch (imgErr) {
            console.error("⚠️ Falló proceso de imagen (Se usará fallback texto):", imgErr);
        }
    } else {
        console.log("ℹ️ Modo Texto: Librería Canvas no disponible.");
    }

    // 5. Enviar WhatsApp (Imagen o Texto según resultado anterior)
    let whatsappEnviado = false;
    if (reserva.phone) {
       // Si publicUrl existe, enviará foto. Si es "", enviará texto.
       whatsappEnviado = await enviarWhatsApp(reserva.phone, publicUrl || null, codigoReserva, reserva.name);
    } else {
        console.warn("⚠️ Reserva sin teléfono, no se envió WhatsApp.");
    }

    // 6. Actualizar Base de Datos (Confirmar)
    await supabase.from("reservas")
      .update({ 
        status: "confirmada", 
        reservation_code: codigoReserva,
        ticket_url: publicUrl || null 
      })
      .eq("id", reservaId);

    // Respuesta Final al Dashboard
    return NextResponse.json({ 
        success: true, 
        whatsapp: whatsappEnviado,
        mode: publicUrl ? "imagen" : "texto_fallback",
        code: codigoReserva
    });

  } catch (err: any) {
    console.error("🔥 Error Crítico Endpoint:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}