import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import path from "path";

// ----------------------------------------------------------------------
// 1. CONFIGURACIÓN Y CREDENCIALES
// ----------------------------------------------------------------------

// SUPABASE: Usamos las variables de entorno para seguridad.
// Es CRÍTICO usar la SERVICE_ROLE_KEY para poder actualizar el estado de la reserva sin restricciones.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Inicializar Supabase con permisos de administrador (Service Role)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ULTRAMSG: Usamos las variables que definiste en tu .env.local
// Si por alguna razón no las lee, usa los valores por defecto (backup)
const WAPP_INSTANCE_ID = process.env.ULTRAMSG_INSTANCE_ID || "instance161222"; 
const WAPP_TOKEN = process.env.ULTRAMSG_TOKEN || "65qat7d38cyc4ozf";     

// Construimos la URL base automáticamente
const WAPP_API_URL = `https://api.ultramsg.com/${WAPP_INSTANCE_ID}`;

// ----------------------------------------------------------------------
// 2. FUNCIONES AUXILIARES
// ----------------------------------------------------------------------

// Carga segura de Canvas (Fallback opcional por si falla la imagen del cliente)
// Esto permite que el servidor genere la imagen si el navegador falla.
let canvasLib: any = null;
try {
    if (typeof window === 'undefined') {
        canvasLib = require("canvas");
    }
} catch (e) {
    // Si no está instalado canvas en el servidor, no pasa nada, usamos la imagen del cliente.
    console.warn("⚠️ Canvas server-side no disponible. Se dependerá 100% de la imagen del cliente.");
}

/**
 * Genera una imagen PNG del ticket en el servidor (Respaldo)
 * Solo se usa si el Dashboard no envió la URL de la imagen generada.
 */
async function generarTicketImagenServidor(reserva: any, codigo: string) {
  if (!canvasLib) return null;

  try {
    const { createCanvas, loadImage } = canvasLib;
    // Intentamos buscar la imagen de fondo en la carpeta public
    const bgPath = path.join(process.cwd(), "public", "ticket-bg.png");
    
    let width = 1080;
    let height = 1920;
    let image = null;

    try {
        image = await loadImage(bgPath);
        width = image.width;
        height = image.height;
    } catch (e) {
        console.warn("⚠️ No se encontró ticket-bg.png en servidor para fallback.");
    }

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // 1. Dibujar Fondo
    if (image) {
        ctx.drawImage(image, 0, 0);
    } else {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, width, height);
    }

    // 2. Escribir Datos (Diseño Básico de Respaldo)
    ctx.fillStyle = "#DAA520"; // Color dorado
    ctx.font = "bold 80px Arial"; 
    ctx.textAlign = "center";
    
    // Posición aproximada del código
    ctx.fillText(codigo, width / 2, 900); 

    // Detalles simples
    ctx.font = "bold 40px Arial";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(reserva.date_reserva, width / 2, 1100);
    ctx.fillText(`${reserva.guests} Personas`, width / 2, 1200);

    return canvas.toBuffer("image/png");

  } catch (error) {
    console.error("❌ Error generando ticket server-side:", error);
    return null; 
  }
}

/**
 * Envía el mensaje a UltraMsg (WhatsApp)
 */
async function enviarWhatsApp(telefono: string, imagenUrl: string | null, codigo: string, nombre: string) {
  // 1. Limpieza y Formato de Teléfono
  let raw = telefono.replace(/\D/g, ""); // Quitar todo lo que no sea número
  
  // Lógica para Chile: Asegurar formato 569XXXXXXXX
  if (raw.length === 9 && raw.startsWith("9")) {
      raw = "56" + raw;
  }
  if (raw.length === 8) {
      raw = "569" + raw;
  }
  
  // El número final para UltraMsg
  const phoneFinal = raw; 

  // 2. Construcción del Mensaje (Caption)
  const mensaje = `Hola ${nombre} 👋,

¡Tu reserva en *Boulevard Zapallar* ha sido CONFIRMADA! 🥂

📌 *Código:* ${codigo}

Adjuntamos tu ticket oficial de entrada. 🎟️
Por favor presenta la imagen adjunta en recepción para validar tu ingreso.

¡Te esperamos!`;

  try {
    // Definir endpoint (Si hay imagen usa /image, si no usa /chat)
    const endpoint = imagenUrl ? "/messages/image" : "/messages/chat";
    const url = `${WAPP_API_URL}${endpoint}`;

    // Construir parámetros URL Encoded
    const params = new URLSearchParams();
    params.append("token", WAPP_TOKEN);
    params.append("to", phoneFinal);
    
    if (imagenUrl) {
        params.append("image", imagenUrl);
        params.append("caption", mensaje);
    } else {
        params.append("body", mensaje);
    }
    params.append("priority", "10"); // Prioridad alta

    console.log(`📨 Enviando a: ${phoneFinal} | URL: ${url} | Tiene Imagen: ${!!imagenUrl}`);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params
    });
    
    const responseText = await res.text();
    console.log("📡 Respuesta UltraMsg:", responseText);
    
    if (!res.ok) {
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
    const body = await req.json();
    
    // Recibimos datos del Dashboard:
    // reservaId: ID de la reserva a confirmar
    // ticketUrl: URL de la imagen generada por html2canvas en el cliente
    // codigo: El código generado en el cliente
    // phone: El teléfono del cliente
    const { reservaId, ticketUrl: clientTicketUrl, codigo: clientCodigo, phone } = body;

    // Validación básica
    if (!reservaId) return NextResponse.json({ error: "Falta reservaId" }, { status: 400 });

    // 1. Obtener Reserva de la Base de Datos para validar existencia
    const { data: reserva, error } = await supabaseAdmin
      .from("reservas")
      .select("*")
      .eq("id", reservaId)
      .single();

    if (error || !reserva) {
        return NextResponse.json({ error: "Reserva no encontrada en DB" }, { status: 404 });
    }

    // 2. Determinar Código Final
    // Prioridad: El que viene del dashboard > El que ya tiene la reserva > Generar uno nuevo
    const codigoFinal = clientCodigo || reserva.code || `BZ-${Math.floor(1000 + Math.random() * 9000)}`;

    // 3. Gestión de Imagen (Prioridad: Cliente > Server Fallback)
    let finalTicketUrl = clientTicketUrl || ""; 

    // FALLBACK: Si no vino imagen del cliente, intentamos generarla en servidor (si canvas está disponible)
    if (!finalTicketUrl && canvasLib) {
        try {
            console.log("⚠️ No llegó imagen del cliente, intentando generar en servidor...");
            const ticketBuffer = await generarTicketImagenServidor(reserva, codigoFinal);
            
            if (ticketBuffer) {
                const fileName = `ticket-${codigoFinal}-${Date.now()}.png`;
                const { error: uploadError } = await supabaseAdmin.storage
                  .from('tickets')
                  .upload(fileName, ticketBuffer, { contentType: 'image/png', upsert: true });

                if (!uploadError) {
                    const { data } = supabaseAdmin.storage.from('tickets').getPublicUrl(fileName);
                    finalTicketUrl = data.publicUrl;
                    console.log("✅ Imagen generada en SERVIDOR:", finalTicketUrl);
                }
            }
        } catch (e) {
            console.error("Fallo generación fallback server:", e);
        }
    }

    // 4. Enviar WhatsApp
    // Usamos el teléfono que viene del dashboard (preferible) o el de la reserva
    const targetPhone = phone || reserva.phone;
    let whatsappResult: any = { success: false, error: "Sin teléfono" };
    
    if (targetPhone) {
       whatsappResult = await enviarWhatsApp(targetPhone, finalTicketUrl || null, codigoFinal, reserva.name);
    } else {
       console.warn("⚠️ Reserva sin teléfono, se omite envío de WhatsApp.");
    }

    // 5. Actualizar Base de Datos
    // Guardamos estado 'confirmada' y el código definitivo
    const { error: updateError } = await supabaseAdmin.from("reservas")
      .update({ 
        status: "confirmada", 
        code: codigoFinal, 
        // ticket_url: finalTicketUrl // Descomentar si tienes esta columna en tu DB
      })
      .eq("id", reservaId);

    if (updateError) {
        console.error("Error al actualizar DB:", updateError);
        // No retornamos error fatal porque el WS ya se envió, pero lo logueamos
    }

    // 6. Responder al Dashboard
    return NextResponse.json({ 
        success: true, 
        whatsapp: whatsappResult.success,
        whatsapp_details: whatsappResult,
        code: codigoFinal
    });

  } catch (err: any) {
    console.error("🔥 Error Crítico Endpoint:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}