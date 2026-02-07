import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import path from "path";

// ----------------------------------------------------------------------
// 1. CONFIGURACIÓN Y CREDENCIALES
// ----------------------------------------------------------------------

// IMPORTANTE: Se usan variables de entorno. 
// La clave 'anon' no sirve aquí, se requiere la SERVICE_ROLE para editar reservas.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Inicializar Supabase con permisos de administrador
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Configuración WHATSAPP (UltraMsg)
// ACTUALIZADO SEGÚN TU IMAGEN:
const WAPP_INSTANCE_ID = "instance161222"; 
const WAPP_TOKEN = "65qat7d38cyc4ozf";     

// URL base de UltraMsg
const WAPP_API_URL = `https://api.ultramsg.com/${WAPP_INSTANCE_ID}`;

// ----------------------------------------------------------------------
// 2. FUNCIONES AUXILIARES
// ----------------------------------------------------------------------

// Carga segura de Canvas (Fallback opcional si falla la imagen del cliente)
let canvasLib: any = null;
try {
    if (typeof window === 'undefined') {
        canvasLib = require("canvas");
    }
} catch (e) {
    console.warn("⚠️ Canvas no disponible en el servidor. Dependeremos de la imagen del cliente.");
}

/**
 * Genera una imagen PNG del ticket en el servidor (Respaldo)
 * Solo se ejecuta si el Dashboard no envió la URL de la imagen.
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
        console.warn("⚠️ No se encontró ticket-bg.png en servidor para fallback.");
    }

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Fondo
    if (image) {
        ctx.drawImage(image, 0, 0);
    } else {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, width, height);
    }

    // Texto Básico de Respaldo
    ctx.fillStyle = "#DAA520";
    ctx.font = "bold 80px Arial"; 
    ctx.textAlign = "center";
    ctx.fillText(reserva.reservation_code || "CODIGO", width / 2, height / 2); 

    return canvas.toBuffer("image/png");

  } catch (error) {
    console.error("❌ Error generando ticket server-side:", error);
    return null; 
  }
}

/**
 * Envía el mensaje a UltraMsg
 */
async function enviarWhatsApp(telefono: string, imagenUrl: string | null, codigo: string, nombre: string) {
  // 1. Limpieza de Teléfono
  let raw = telefono.replace(/\D/g, ""); // Quitar todo lo que no sea número
  
  // Lógica para Chile (Si viene 912345678, lo convertimos a 56912345678)
  if (raw.length === 9 && raw.startsWith("9")) {
      raw = "56" + raw;
  }
  // Si viene con 8 dígitos (raro, pero por si acaso)
  if (raw.length === 8) {
      raw = "569" + raw;
  }
  
  // UltraMsg suele requerir el número sin el "+" en endpoints x-www-form-urlencoded, 
  // pero depende de la configuración. Probaremos formato estándar.
  const phoneFinal = raw; 

  const mensaje = `Hola ${nombre} 👋,\n\n¡Tu reserva en *Boulevard Zapallar* ha sido CONFIRMADA! 🥂\n\n📌 *Código:* ${codigo}\n\n${imagenUrl ? "Adjuntamos tu ticket de entrada. 🎟️" : "Por favor muestra este mensaje y código en recepción."}\n\n¡Te esperamos!`;

  try {
    const endpoint = imagenUrl ? "/messages/image" : "/messages/chat";
    const url = `${WAPP_API_URL}${endpoint}`;

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
    const { reservaId, ticketUrl: clientTicketUrl, codigo: clientCodigo, phone } = body;

    if (!reservaId) return NextResponse.json({ error: "Falta reservaId" }, { status: 400 });

    // 1. Obtener Reserva para validar
    const { data: reserva, error } = await supabaseAdmin
      .from("reservas")
      .select("*")
      .eq("id", reservaId)
      .single();

    if (error || !reserva) {
        return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
    }

    // 2. Determinar Código Final
    const codigoFinal = clientCodigo || reserva.code || `BZ-${Math.floor(1000 + Math.random() * 9000)}`;

    // 3. Gestión de Imagen (Prioridad: Cliente > Server Fallback)
    let finalTicketUrl = clientTicketUrl || ""; 

    if (!finalTicketUrl && canvasLib) {
        // Fallback: Generar en servidor si el cliente falló
        try {
            const ticketBuffer = await generarTicketImagenServidor({ ...reserva, reservation_code: codigoFinal });
            if (ticketBuffer) {
                const fileName = `ticket-${codigoFinal}-${Date.now()}.png`;
                const { error: uploadError } = await supabaseAdmin.storage
                  .from('tickets')
                  .upload(fileName, ticketBuffer, { contentType: 'image/png', upsert: true });

                if (!uploadError) {
                    const { data } = supabaseAdmin.storage.from('tickets').getPublicUrl(fileName);
                    finalTicketUrl = data.publicUrl;
                }
            }
        } catch (e) {
            console.error("Fallo generación fallback:", e);
        }
    }

    // 4. Enviar WhatsApp
    // Usamos el teléfono que viene del dashboard (que suele estar más limpio) o el de la reserva
    const targetPhone = phone || reserva.phone;
    let whatsappResult: any = { success: false, error: "Sin teléfono" };
    
    if (targetPhone) {
       whatsappResult = await enviarWhatsApp(targetPhone, finalTicketUrl || null, codigoFinal, reserva.name);
    }

    // 5. Actualizar Base de Datos
    // Guardamos estado 'confirmada' y el código definitivo
    await supabaseAdmin.from("reservas")
      .update({ 
        status: "confirmada", 
        code: codigoFinal, 
        // ticket_url: finalTicketUrl // Descomentar si tienes esta columna
      })
      .eq("id", reservaId);

    return NextResponse.json({ 
        success: true, 
        whatsapp: whatsappResult.success,
        code: codigoFinal
    });

  } catch (err: any) {
    console.error("🔥 Error Endpoint:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}