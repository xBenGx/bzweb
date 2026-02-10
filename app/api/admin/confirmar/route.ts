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
 * Genera un código aleatorio formato BZ-XXXX (Respaldo)
 */
function generarCodigoBZ(): string {
  const numeroAleatorio = Math.floor(1000 + Math.random() * 9000); 
  return `BZ-${numeroAleatorio}`;
}

/**
 * Formatea la fecha para que se vea bonita en el mensaje y evite "Invalid Date"
 * Entrada: "2024-02-07" -> Salida: "Viernes, 7 de Febrero"
 */
function formatearFechaBonita(fechaStr: string): string {
  if (!fechaStr) return "Fecha por confirmar";
  try {
    // Dividimos manualmente para evitar errores de zona horaria (UTC vs Local)
    const partes = fechaStr.split('-');
    if (partes.length !== 3) return fechaStr;

    const year = parseInt(partes[0]);
    const month = parseInt(partes[1]) - 1; // Meses en JS van de 0 a 11
    const day = parseInt(partes[2]);

    const date = new Date(year, month, day);
    
    // Formateamos en español de Chile
    const opciones: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    };
    // Capitalizamos la primera letra
    const fechaFormateada = date.toLocaleDateString('es-CL', opciones);
    return fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1);
  } catch (e) {
    return fechaStr; // Fallback
  }
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
 * AHORA INCLUYE DETALLE DEL PEDIDO ANTICIPADO
 */
async function enviarWhatsApp(
  telefono: string, 
  qrUrl: string, 
  nombre: string, 
  fecha: string, 
  personas: number,
  codigoReserva: string,
  preOrder: any[] = [] // Nuevo parámetro para el menú
) {
  // Limpieza de teléfono
  let raw = telefono.replace(/\D/g, "");
  if (raw.length === 9 && raw.startsWith("9")) raw = "56" + raw;
  if (raw.length === 8) raw = "569" + raw;
  
  // 1. Formatear la fecha para que no salga error
  const fechaTexto = formatearFechaBonita(fecha);

  // 2. Construir el bloque de texto del Pedido (si existe)
  let textoPedido = "";
  if (preOrder && preOrder.length > 0) {
    const itemsList = preOrder.map((item: any) => `▪ ${item.quantity}x ${item.name}`).join("\n");
    const totalPedido = preOrder.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);
    
    textoPedido = `
🍽 *PEDIDO ANTICIPADO (PAGADO)*
${itemsList}
💰 *Total Extra:* $${totalPedido.toLocaleString('es-CL')}
`;
  }

  // 3. Construir mensaje final
  const mensaje = `Hola ${nombre} 👋,

¡Tu reserva en *Boulevard Zapallar* está CONFIRMADA! 🥂

🔑 *CÓDIGO DE ACCESO: ${codigoReserva}*

📅 Fecha: ${fechaTexto}
👥 Personas: ${personas}
${textoPedido}
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
    const { reservaId, reservation_code } = body; 

    // --- CORRECCIÓN CRÍTICA DEL DOMINIO ---
    let origin = process.env.NEXT_PUBLIC_BASE_URL;
    
    if (!origin) {
        const protocol = req.headers.get("x-forwarded-proto") || "https";
        const host = req.headers.get("host");
        if (host && !host.includes("localhost")) {
             origin = `${protocol}://${host}`;
        }
    }

    // Fallback manual: asegurar dominio producción
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
      .select("*") // Esto trae todas las columnas, incluido pre_order
      .eq("id", reservaId)
      .single();

    if (error || !reserva) {
      return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
    }

    // ---------------------------------------------------------
    // LÓGICA SINCRONIZADA
    // ---------------------------------------------------------
    const codigoBZ = reservation_code || generarCodigoBZ(); 
    console.log(`✅ Usando Código: ${codigoBZ}`);

    // 2. Generar URL de Validación CORRECTA (con /admin/)
    const urlValidacion = `${origin}/admin/validar/${reservaId}`;
    
    console.log(`🔗 Link QR generado: ${urlValidacion}`);

    // 3. Generar Imagen QR (Buffer)
    const qrBuffer = await generarImagenQR(urlValidacion);

    // 4. Subir QR a Supabase Storage
    const publicQrUrl = await subirQRaSupabase(reservaId, qrBuffer);

    if (!publicQrUrl) {
      throw new Error("No se pudo generar la URL pública del QR");
    }

    // 5. Actualizar Base de Datos
    const { error: updateError } = await supabaseAdmin
      .from("reservas")
      .update({ 
        status: "confirmada",      
        reservation_code: codigoBZ, 
        qr_url: publicQrUrl        
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
        reserva.date_reserva || "", // Enviamos el string crudo, la funcion lo formatea
        reserva.guests || 0,
        codigoBZ,
        reserva.pre_order // Pasamos el array de productos del pedido
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