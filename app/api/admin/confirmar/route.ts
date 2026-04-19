import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import QRCode from "qrcode";

// ----------------------------------------------------------------------
// 1. CONFIGURACIÓN Y CREDENCIALES
// ----------------------------------------------------------------------

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Cliente con permisos de Admin (Service Role)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Configuración Evolution API
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL!;
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE!;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY!;

// ----------------------------------------------------------------------
// 2. FUNCIONES AUXILIARES
// ----------------------------------------------------------------------

function generarCodigoRespaldo(prefix: string = "BZ"): string {
  const numeroAleatorio = Math.floor(100000 + Math.random() * 900000); 
  return `${prefix}-${numeroAleatorio}`;
}

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

// NUEVA FUNCIÓN: Envío nativo mediante Evolution API
async function enviarWhatsApp(telefono: string, imageUrl: string, mensajeTexto: string) {
  let raw = telefono.replace(/\D/g, "");
  if (raw.length === 9 && raw.startsWith("9")) raw = "56" + raw;
  if (raw.length === 8) raw = "569" + raw;
  
  try {
    const res = await fetch(`${EVOLUTION_API_URL}/message/sendMedia/${EVOLUTION_INSTANCE}`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "apikey": EVOLUTION_API_KEY
      },
      body: JSON.stringify({
        number: raw,
        options: {
          delay: 1200,
          presence: "composing"
        },
        mediaMessage: {
          mediatype: "image",
          caption: mensajeTexto,
          media: imageUrl // Evolution API procesa URLs públicas sin problemas
        }
      })
    });

    const responseData = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(responseData));
    
    return { success: true, details: responseData };
  } catch (e: any) {
    console.error("❌ Error enviando WhatsApp (Evolution):", e);
    return { success: false, error: e.message };
  }
}

// ----------------------------------------------------------------------
// 3. ENDPOINT PRINCIPAL (POST)
// ----------------------------------------------------------------------

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { reservaId, reservation_code, ticketUrl, customMessage } = body; 

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

    const { data: reserva, error } = await supabaseAdmin
      .from("reservas")
      .select("*") 
      .eq("id", reservaId)
      .single();

    if (error || !reserva) {
      return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
    }

    const hasTickets = reserva.pre_order?.some((i: any) => i.category === 'ticket');
    const codigoPrefix = hasTickets ? "TKT" : "BZ";
    const codigoBZ = reservation_code || reserva.reservation_code || generarCodigoRespaldo(codigoPrefix); 
    
    const urlValidacion = hasTickets 
        ? `${origin}/validar-ticket/${reservaId}` 
        : `${origin}/admin/validar/${reservaId}`;
    
    let imagenPublica = ticketUrl; 

    if (!imagenPublica) {
        const qrBuffer = await generarImagenQR(urlValidacion);
        imagenPublica = await subirQRaSupabase(reservaId, qrBuffer);
        if (!imagenPublica) throw new Error("Fallo al generar código QR de respaldo");
    }

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

    let whatsappResult: any = { success: false, error: "Sin teléfono" };
    if (reserva.phone) {
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