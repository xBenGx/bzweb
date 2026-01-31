import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
// Importaciones para manejo de archivos e imágenes
import { createCanvas, loadImage } from "canvas"; 
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

// Genera una imagen PNG del ticket usando Canvas.
async function generarTicketImagen(reserva: any) {
  try {
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
        console.warn("⚠️ No se encontró ticket-bg.png, usando fondo generado.");
    }

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // 1. Dibujar Fondo
    if (image) {
        ctx.drawImage(image, 0, 0);
    } else {
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = "#DAA520";
        ctx.lineWidth = 20;
        ctx.strokeRect(20, 20, width - 40, height - 40);
    }

    // 2. Configuración de Textos
    ctx.fillStyle = image ? "#000000" : "#FFFFFF";
    
    // Código de Reserva
    ctx.font = "bold 55px Arial"; 
    ctx.textAlign = "center";
    const yCode = image ? 450 : height / 2 - 100;
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
    console.error("❌ Error generando ticket (Canvas):", error);
    return null; // Retornamos null para activar el modo "solo texto"
  }
}

// Envía WhatsApp (Imagen o Texto)
async function enviarWhatsApp(telefono: string, imagenUrl: string | null, codigo: string, nombre: string) {
  // 1. LIMPIEZA DE TELÉFONO (CRÍTICO)
  let phoneClean = telefono.replace(/\D/g, ""); 
  
  // Caso Chile 9 dígitos: 912345678 -> Agregamos 56 => 56912345678
  if (phoneClean.length === 9 && phoneClean.startsWith("9")) {
      phoneClean = "56" + phoneClean;
  }
  // Caso Chile 8 dígitos (formato antiguo): 12345678 -> Agregamos 569 => 56912345678
  if (phoneClean.length === 8) {
      phoneClean = "569" + phoneClean;
  }
  // Si ya tiene 11 dígitos (569...) se deja igual.

  const mensaje = `Hola ${nombre} 👋,\n\n¡Tu reserva en *Boulevard Zapallar* ha sido CONFIRMADA! 🥂\n\n📌 *Código:* ${codigo}\n📅 *Fecha:* Hoy/Pronto\n\n${imagenUrl ? "Adjuntamos tu ticket de entrada. 🎟️" : "Por favor muestra este mensaje en recepción."}\n\n¡Te esperamos!`;

  try {
    let urlToUse = WAPP_URL_CHAT;
    let bodyParams: any = {
        token: WAPP_TOKEN,
        to: phoneClean,
        body: mensaje // Para chat se usa 'body'
    };

    // Si tenemos imagen, cambiamos el endpoint y los parámetros
    if (imagenUrl) {
        urlToUse = WAPP_URL_IMAGE;
        bodyParams = {
            token: WAPP_TOKEN,
            to: phoneClean,
            image: imagenUrl,
            caption: mensaje // Para imagen se usa 'caption'
        };
    }

    console.log(`📨 Enviando WhatsApp a: ${phoneClean} (Con imagen: ${!!imagenUrl})`);

    const res = await fetch(urlToUse, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(bodyParams)
    });
    
    if (!res.ok) {
        const txt = await res.text();
        console.error("❌ Error UltraMsg:", txt);
    }
    
    return res.ok;
  } catch (e) {
    console.error("❌ Error API WhatsApp:", e);
    return false;
  }
}

// ----------------------------------------------------------------------
// 3. ENDPOINT PRINCIPAL (POST)
// ----------------------------------------------------------------------
export async function POST(req: Request) {
  try {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      throw new Error("Credenciales de Supabase vacías.");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const body = await req.json();
    const { reservaId } = body;

    // 1. Obtener datos de la Reserva
    const { data: reserva, error } = await supabase
      .from("reservas")
      .select("*")
      .eq("id", reservaId)
      .single();

    if (error || !reserva) return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });

    // 2. Generar Código si no existe
    let codigoReserva = reserva.reservation_code;
    if (!codigoReserva) {
        codigoReserva = `BZ-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    // 3. Intentar Generar Ticket (Imagen)
    let publicUrl = "";
    try {
        // Pasamos el código actualizado
        const ticketBuffer = await generarTicketImagen({ ...reserva, reservation_code: codigoReserva });
        
        if (ticketBuffer) {
            const fileName = `ticket-${codigoReserva}.png`;
            const { error: uploadError } = await supabase.storage
              .from('tickets')
              .upload(fileName, ticketBuffer, { contentType: 'image/png', upsert: true });

            if (!uploadError) {
                const { data } = supabase.storage.from('tickets').getPublicUrl(fileName);
                publicUrl = data.publicUrl;
            } else {
                console.error("Error subiendo imagen:", uploadError);
            }
        }
    } catch (imgErr) {
        console.error("Saltando generación de imagen por error:", imgErr);
    }

    // 4. Enviar WhatsApp (Con o Sin Imagen)
    let whatsappEnviado = false;
    if (reserva.phone) {
       // Si publicUrl está vacío, la función enviarWhatsApp enviará automáticamente solo texto
       whatsappEnviado = await enviarWhatsApp(reserva.phone, publicUrl || null, codigoReserva, reserva.name);
    }

    // 5. Actualizar Base de Datos
    await supabase.from("reservas")
      .update({ 
        status: "confirmada", 
        reservation_code: codigoReserva,
        ticket_url: publicUrl || null 
      })
      .eq("id", reservaId);

    return NextResponse.json({ 
        success: true, 
        whatsapp: whatsappEnviado,
        mode: publicUrl ? "imagen" : "texto_fallback"
    });

  } catch (err: any) {
    console.error("Error Endpoint:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}