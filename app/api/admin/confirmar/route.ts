import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import QRCode from "qrcode";

// ----------------------------------------------------------------------
// 1. CONFIGURACIÓN Y CREDENCIALES
// ----------------------------------------------------------------------

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Cliente con permisos de Admin (Service Role) para poder escribir/leer todo
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Configuración UltraMsg
const WAPP_INSTANCE_ID = process.env.ULTRAMSG_INSTANCE_ID || "instance161222";
const WAPP_TOKEN = process.env.ULTRAMSG_TOKEN || "65qat7d38cyc4ozf";
const WAPP_API_URL = `https://api.ultramsg.com/${WAPP_INSTANCE_ID}`;

// ----------------------------------------------------------------------
// 2. FUNCIONES AUXILIARES
// ----------------------------------------------------------------------

/**
 * Genera un código aleatorio dinámico según el tipo (TKT-XXXX o BZ-XXXX)
 */
function generarCodigoRespaldo(prefix: string = "BZ"): string {
  const numeroAleatorio = Math.floor(100000 + Math.random() * 900000); 
  return `${prefix}-${numeroAleatorio}`;
}

/**
 * Formatea la fecha para que se vea bonita en el mensaje (Fallback)
 */
function formatearFechaBonita(fechaStr: string): string {
  if (!fechaStr) return "Fecha por confirmar";
  try {
    const partes = fechaStr.split('-');
    if (partes.length !== 3) return fechaStr;

    const year = parseInt(partes[0]);
    const month = parseInt(partes[1]) - 1; 
    const day = parseInt(partes[2]);

    const date = new Date(year, month, day);
    const opciones: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' };
    const fechaFormateada = date.toLocaleDateString('es-CL', opciones);
    return fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1);
  } catch (e) {
    return fechaStr; 
  }
}

/**
 * Generador interno de mensaje detallado (Actúa como respaldo si el Dashboard no envía el customMessage)
 */
function generarMensajeDetalladoFallback(reserva: any, codigo: string, hasTickets: boolean): string {
    const fechaTexto = formatearFechaBonita(reserva.date_reserva);
    const tickets = reserva.pre_order?.filter((i: any) => i.category === 'ticket') || [];
    const menu = reserva.pre_order?.filter((i: any) => i.category !== 'ticket') || [];

    let mensaje = `Hola ${reserva.name} 👋,\n\n`;

    if (hasTickets) {
        mensaje += `¡Tu compra de entradas para *Boulevard Zapallar* está CONFIRMADA! 🎉\n\n`;
        mensaje += `🔑 *CÓDIGO DE ACCESO: ${codigo}*\n\n`;
        mensaje += `📅 Fecha: ${fechaTexto}\n`;
        mensaje += `👥 Tickets: ${reserva.guests}\n\n`;
        
        const ticketDetails = tickets.map((t: any) => `▪ ${t.quantity}x ${t.name}`).join('\n');
        mensaje += `🎟 *TUS ENTRADAS:*\n${ticketDetails}\n\n`;
    } else {
        mensaje += `¡Tu reserva de mesa en *Boulevard Zapallar* está CONFIRMADA! 🥂\n\n`;
        mensaje += `🔑 *CÓDIGO DE ACCESO: ${codigo}*\n\n`;
        mensaje += `📅 Fecha: ${fechaTexto}\n`;
        mensaje += `👥 Personas: ${reserva.guests}\n\n`;
    }

    if (menu.length > 0) {
        const menuDetails = menu.map((m: any) => `▪ ${m.quantity}x ${m.name}`).join('\n');
        mensaje += `🍽 *PEDIDO ANTICIPADO (PAGADO)*\n${menuDetails}\n\n`;
    }

    mensaje += `👇 *IMPORTANTE: TICKET DE INGRESO*\n`;
    mensaje += `Este código QR (o imagen adjunta) es tu pase de entrada. Por favor muéstralo en recepción para ser escaneado.\n\n`;
    mensaje += `¡Te esperamos!`;

    return mensaje;
}

/**
 * Genera el Buffer de la imagen QR a partir de una URL o Texto
 */
async function generarImagenQR(texto: string): Promise<Buffer> {
  try {
    const qrBuffer = await QRCode.toBuffer(texto, {
      type: 'png',
      width: 500,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    });
    return qrBuffer;
  } catch (err) {
    console.error("❌ Error generando QR:", err);
    throw new Error("Fallo al generar código QR");
  }
}

/**
 * Sube el QR a Supabase y retorna la URL pública
 */
async function subirQRaSupabase(idReserva: string, buffer: Buffer): Promise<string | null> {
  try {
    const fileName = `qr-${idReserva}-${Date.now()}.png`;
    
    const { error: uploadError } = await supabaseAdmin.storage
      .from('qrcodes')
      .upload(fileName, buffer, { contentType: 'image/png', upsert: true });

    if (uploadError) {
      console.error("❌ Error subiendo a Supabase Storage:", uploadError);
      return null;
    }

    const { data } = supabaseAdmin.storage.from('qrcodes').getPublicUrl(fileName);
    return data.publicUrl;
  } catch (error) {
    console.error("❌ Error en gestión de archivos:", error);
    return null;
  }
}

/**
 * Envía el mensaje con el QR o E-Ticket a UltraMsg
 */
async function enviarWhatsApp(telefono: string, imageUrl: string, mensajeTexto: string) {
  let raw = telefono.replace(/\D/g, "");
  if (raw.length === 9 && raw.startsWith("9")) raw = "56" + raw;
  if (raw.length === 8) raw = "569" + raw;
  
  try {
    const params = new URLSearchParams();
    params.append("token", WAPP_TOKEN);
    params.append("to", raw);
    params.append("image", imageUrl);
    params.append("caption", mensajeTexto);
    params.append("priority", "10");

    const res = await fetch(`${WAPP_API_URL}/messages/image`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params
    });

    const responseText = await res.text();
    if (!res.ok) throw new Error(responseText);
    
    return { success: true, details: responseText };
  } catch (e: any) {
    console.error("❌ Error enviando WhatsApp:", e);
    return { success: false, error: e.message };
  }
}

// ----------------------------------------------------------------------
// 3. ENDPOINT PRINCIPAL (POST)
// ----------------------------------------------------------------------

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Extraemos las nuevas variables que envía el Dashboard actualizado
    const { reservaId, reservation_code, ticketUrl, customMessage } = body; 

    // --- CORRECCIÓN CRÍTICA DEL DOMINIO ---
    let origin = process.env.NEXT_PUBLIC_BASE_URL;
    
    if (!origin) {
        const protocol = req.headers.get("x-forwarded-proto") || "https";
        const host = req.headers.get("host");
        if (host && !host.includes("localhost")) {
             origin = `${protocol}://${host}`;
        }
    }

    if (!origin || origin.includes("localhost")) {
        origin = "https://bzweb.vercel.app"; 
    }
    origin = origin.replace(/\/$/, "");

    if (!reservaId) {
      return NextResponse.json({ error: "Falta reservaId" }, { status: 400 });
    }

    console.log(`🚀 Iniciando confirmación. ID: ${reservaId}`);

    // 1. Obtener datos de la reserva actual (incluyendo pre_order)
    const { data: reserva, error } = await supabaseAdmin
      .from("reservas")
      .select("*") 
      .eq("id", reservaId)
      .single();

    if (error || !reserva) {
      return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
    }

    // ---------------------------------------------------------
    // LÓGICA DE DETECCIÓN Y SINCRONIZACIÓN
    // ---------------------------------------------------------
    // Detectamos si hay tickets comprados en el pre_order
    const hasTickets = reserva.pre_order?.some((i: any) => i.category === 'ticket');
    
    const codigoPrefix = hasTickets ? "TKT" : "BZ";
    const codigoBZ = reservation_code || reserva.reservation_code || generarCodigoRespaldo(codigoPrefix); 
    
    console.log(`✅ Usando Código: ${codigoBZ} | Es Show: ${hasTickets}`);

    // 2. Asignar URL de Validación Correcta
    // Si es Show va a validar-ticket, si es mesa va a admin/validar
    const urlValidacion = hasTickets 
        ? `${origin}/validar-ticket/${reservaId}` 
        : `${origin}/admin/validar/${reservaId}`;
    
    console.log(`🔗 Link Validación generado: ${urlValidacion}`);

    // 3. Determinar Imagen a Enviar (E-Ticket vs QR Nativo)
    let imagenPublica = ticketUrl; // Intentamos usar el ticket bonito del Frontend

    if (!imagenPublica) {
        console.log("⚠️ No se recibió ticketUrl del Frontend. Generando QR nativo...");
        const qrBuffer = await generarImagenQR(urlValidacion);
        imagenPublica = await subirQRaSupabase(reservaId, qrBuffer);
        if (!imagenPublica) throw new Error("Fallo al generar código QR de respaldo");
    }

    // 4. Actualizar Base de Datos
    const { error: updateError } = await supabaseAdmin
      .from("reservas")
      .update({ 
        status: "confirmada",      
        reservation_code: codigoBZ, 
        qr_url: imagenPublica        
      })
      .eq("id", reservaId);

    if (updateError) {
      console.error("⚠️ Error actualizando estado en DB:", updateError);
      throw updateError;
    }

    // 5. Enviar WhatsApp al cliente
    let whatsappResult: any = { success: false, error: "Sin teléfono" };
    if (reserva.phone) {
      // Priorizamos el mensaje exacto generado por el Dashboard, si falla, usamos nuestro generador interno
      const mensajeFinal = customMessage || generarMensajeDetalladoFallback(reserva, codigoBZ, hasTickets);

      whatsappResult = await enviarWhatsApp(
        reserva.phone, 
        imagenPublica, 
        mensajeFinal
      );
    }

    return NextResponse.json({ 
      success: true, 
      reservation_code: codigoBZ,
      qr_url: imagenPublica,
      whatsapp: whatsappResult 
    });

  } catch (err: any) {
    console.error("🔥 Error Crítico Endpoint:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}