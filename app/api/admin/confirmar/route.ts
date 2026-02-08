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

// Configuración UltraMsg
const WAPP_INSTANCE_ID = process.env.ULTRAMSG_INSTANCE_ID || "instance161222";
const WAPP_TOKEN = process.env.ULTRAMSG_TOKEN || "65qat7d38cyc4ozf";
const WAPP_API_URL = `https://api.ultramsg.com/${WAPP_INSTANCE_ID}`;

// ----------------------------------------------------------------------
// 2. FUNCIONES AUXILIARES
// ----------------------------------------------------------------------

/**
 * Genera un código aleatorio formato BZ-XXXX
 */
function generarCodigoBZ(): string {
  const numeroAleatorio = Math.floor(1000 + Math.random() * 9000); // Genera entre 1000 y 9999
  return `BZ-${numeroAleatorio}`;
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
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
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
    
    // Subir al bucket 'qrcodes'
    const { error: uploadError } = await supabaseAdmin.storage
      .from('qrcodes')
      .upload(fileName, buffer, { 
        contentType: 'image/png', 
        upsert: true 
      });

    if (uploadError) {
      console.error("❌ Error subiendo a Supabase Storage:", uploadError);
      return null;
    }

    // Obtener URL Pública
    const { data } = supabaseAdmin.storage
      .from('qrcodes')
      .getPublicUrl(fileName);

    return data.publicUrl;
  } catch (error) {
    console.error("❌ Error en gestión de archivos:", error);
    return null;
  }
}

/**
 * Envía el mensaje con el QR a UltraMsg
 */
async function enviarWhatsApp(
  telefono: string, 
  qrUrl: string, 
  nombre: string, 
  fecha: string, 
  personas: number,
  codigoReserva: string // Añado el código al mensaje por seguridad
) {
  // Limpieza de teléfono
  let raw = telefono.replace(/\D/g, "");
  if (raw.length === 9 && raw.startsWith("9")) raw = "56" + raw;
  if (raw.length === 8) raw = "569" + raw;
  
  // Mensaje
  const mensaje = `Hola ${nombre} 👋,

¡Tu reserva en *Boulevard Zapallar* está CONFIRMADA! 🥂

🔑 *CÓDIGO DE ACCESO: ${codigoReserva}*

📅 Fecha: ${fecha}
👥 Personas: ${personas}

👇 *IMPORTANTE: TICKET DE INGRESO*
Este código QR es tu pase de entrada. Por favor muéstralo en recepción para ser escaneado.

¡Te esperamos!`;

  try {
    const params = new URLSearchParams();
    params.append("token", WAPP_TOKEN);
    params.append("to", raw);
    params.append("image", qrUrl);
    params.append("caption", mensaje);
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
    const { reservaId } = body;

    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_BASE_URL || "https://tupaginaweb.com";

    if (!reservaId) {
      return NextResponse.json({ error: "Falta reservaId" }, { status: 400 });
    }

    console.log(`🚀 Iniciando confirmación para reserva: ${reservaId}`);

    // 1. Obtener datos de la reserva actual
    const { data: reserva, error } = await supabaseAdmin
      .from("reservas")
      .select("*")
      .eq("id", reservaId)
      .single();

    if (error || !reserva) {
      return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
    }

    // ---------------------------------------------------------
    // NUEVA LÓGICA: Generar Código BZ Único
    // ---------------------------------------------------------
    const codigoBZ = generarCodigoBZ(); 
    console.log(`🆕 Código Generado: ${codigoBZ}`);

    // 2. Generar URL de Validación (Link que contendrá el QR)
    // Usamos el ID de la reserva, pero ahora el sistema ya tendrá el código BZ guardado
    const urlValidacion = `${origin}/tickets/${reservaId}`; 
    // NOTA: Cambié esto a /tickets/[id] para que el usuario al escanear vea SU ticket.
    // Si prefieres que sea para el guardia (/admin/validar/[id]), cámbialo de nuevo.
    
    // 3. Generar Imagen QR (Buffer)
    const qrBuffer = await generarImagenQR(urlValidacion);

    // 4. Subir QR a Supabase Storage
    const publicQrUrl = await subirQRaSupabase(reservaId, qrBuffer);

    if (!publicQrUrl) {
      throw new Error("No se pudo generar la URL pública del QR");
    }

    // 5. Actualizar Base de Datos con el CÓDIGO BZ
    const { error: updateError } = await supabaseAdmin
      .from("reservas")
      .update({ 
        status: "confirmada",      // Cambia estado a verde
        reservation_code: codigoBZ, // <--- AQUÍ SE GUARDA EL CÓDIGO BZ-XXXX
        qr_url: publicQrUrl        // Guarda la imagen del QR
      })
      .eq("id", reservaId);

    if (updateError) {
      console.error("⚠️ Error actualizando estado en DB:", updateError);
      throw updateError;
    }

    // 6. Enviar WhatsApp al cliente
    let whatsappResult: any = { success: false, error: "Sin teléfono" };
    if (reserva.phone) {
      whatsappResult = await enviarWhatsApp(
        reserva.phone, 
        publicQrUrl, 
        reserva.name, 
        reserva.date_reserva || "Fecha Pendiente", 
        reserva.guests || 0,
        codigoBZ // Pasamos el código para que salga en el texto del chat
      );
    }

    return NextResponse.json({ 
      success: true, 
      reservation_code: codigoBZ,
      qr_url: publicQrUrl,
      whatsapp: whatsappResult 
    });

  } catch (err: any) {
    console.error("🔥 Error Crítico Endpoint:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}