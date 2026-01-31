import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
// Usamos imports dinámicos o try/catch para canvas para evitar que tumbe el servidor si falta la librería
import { createCanvas, loadImage } from "canvas"; 
import path from "path";

// ----------------------------------------------------------------------
// 1. CONFIGURACIÓN Y CREDENCIALES (HARCODED PARA EVITAR ERRORES)
// ----------------------------------------------------------------------

// Credenciales SUPABASE DIRECTAS (Soluciona el error "Faltan variables")
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
    // Retornamos null para que el sistema NO se detenga y envíe al menos el texto
    return null; 
  }
}

// Envía WhatsApp (Imagen o Texto)
async function enviarWhatsApp(telefono: string, imagenUrl: string | null, codigo: string, nombre: string) {
  // 1. LIMPIEZA DE TELÉFONO (CRÍTICO PARA CHILE)
  // Eliminamos el +, espacios, guiones
  let phoneClean = telefono.replace(/\D/g, ""); 
  
  // Caso Chile 9 dígitos: 958444061 -> Agregamos 56 => 56958444061
  if (phoneClean.length === 9 && phoneClean.startsWith("9")) {
      phoneClean = "56" + phoneClean;
  }
  // Caso Chile 8 dígitos (formato antiguo): 12345678 -> Agregamos 569 => 56912345678
  if (phoneClean.length === 8) {
      phoneClean = "569" + phoneClean;
  }
  // Si ya tiene 11 dígitos (56958444061) se deja igual.

  const mensaje = `Hola ${nombre} 👋,\n\n¡Tu reserva en *Boulevard Zapallar* ha sido CONFIRMADA! 🥂\n\n📌 *Código:* ${codigo}\n📅 *Fecha:* Hoy/Pronto\n\n${imagenUrl ? "Adjuntamos tu ticket de entrada. 🎟️" : "Por favor muestra este mensaje en recepción."}\n\n¡Te esperamos!`;

  try {
    let urlToUse = WAPP_URL_CHAT;
    let bodyParams: any = {
        token: WAPP_TOKEN,
        to: phoneClean,
        body: mensaje, // Para chat se usa 'body'
        priority: 10 // Prioridad alta
    };

    // Si tenemos imagen, cambiamos el endpoint y los parámetros
    if (imagenUrl) {
        urlToUse = WAPP_URL_IMAGE;
        bodyParams = {
            token: WAPP_TOKEN,
            to: phoneClean,
            image: imagenUrl,
            caption: mensaje, // Para imagen se usa 'caption'
            priority: 10
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
        return false;
    }
    
    return true;
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
    console.log("🚀 Iniciando confirmación de reserva...");

    // Inicializamos Supabase con las claves harcodeadas
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    
    const body = await req.json();
    const { reservaId } = body;

    if (!reservaId) {
        return NextResponse.json({ error: "Falta el ID de la reserva" }, { status: 400 });
    }

    // 1. Obtener datos de la Reserva
    const { data: reserva, error } = await supabase
      .from("reservas")
      .select("*")
      .eq("id", reservaId)
      .single();

    if (error || !reserva) {
        console.error("❌ Reserva no encontrada:", error);
        return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
    }

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
            // IMPORTANTE: Si usas la KEY publica, asegúrate de que el bucket 'tickets' sea publico y tenga politicas abiertas
            const { error: uploadError } = await supabase.storage
              .from('tickets')
              .upload(fileName, ticketBuffer, { contentType: 'image/png', upsert: true });

            if (!uploadError) {
                const { data } = supabase.storage.from('tickets').getPublicUrl(fileName);
                publicUrl = data.publicUrl;
            } else {
                console.error("⚠️ Error subiendo imagen a Supabase (posible permiso):", uploadError);
            }
        }
    } catch (imgErr) {
        console.error("⚠️ Saltando generación de imagen por error de servidor:", imgErr);
    }

    // 4. Enviar WhatsApp (Con o Sin Imagen)
    let whatsappEnviado = false;
    if (reserva.phone) {
       // Si publicUrl está vacío, se envía solo texto automáticamente
       whatsappEnviado = await enviarWhatsApp(reserva.phone, publicUrl || null, codigoReserva, reserva.name);
    }

    // 5. Actualizar Base de Datos
    // NOTA: Si usas la clave 'anon' (public), asegúrate de que tengas permisos RLS para hacer UPDATE en la tabla 'reservas'
    // Si esto falla, el mensaje de WhatsApp YA SE ENVIÓ en el paso anterior, así que al menos el cliente sabe.
    const { error: updateError } = await supabase.from("reservas")
      .update({ 
        status: "confirmada", 
        reservation_code: codigoReserva,
        ticket_url: publicUrl || null 
      })
      .eq("id", reservaId);

    if (updateError) {
        console.error("⚠️ Error actualizando estado en DB (RLS o Permisos):", updateError);
        // Retornamos 200 aunque falle la DB para que el frontend no muestre error rojo si el WhatsApp se envió
        if (whatsappEnviado) {
             return NextResponse.json({ 
                success: true, 
                warning: "WhatsApp enviado, pero error al actualizar estado DB",
                whatsapp: true 
            });
        }
        return NextResponse.json({ error: "Error actualizando DB" }, { status: 500 });
    }

    return NextResponse.json({ 
        success: true, 
        whatsapp: whatsappEnviado,
        mode: publicUrl ? "imagen" : "texto_fallback"
    });

  } catch (err: any) {
    console.error("🔥 Error Critico Endpoint:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}