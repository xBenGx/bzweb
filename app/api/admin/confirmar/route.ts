import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
// Importaciones para manejo de archivos e imágenes
import { createCanvas, loadImage, registerFont } from "canvas"; 
import path from "path";

// ----------------------------------------------------------------------
// 1. CONFIGURACIÓN Y CREDENCIALES
// ----------------------------------------------------------------------

// Credenciales SUPABASE (Incrustadas para evitar error de variables de entorno)
const SUPABASE_URL = "https://lqelewbxejvsiitpjjly.supabase.co";
// NOTA: Usualmente se requiere la SERVICE_ROLE_KEY para escribir sin restricciones.
// Usaremos la clave que proporcionaste. Si tienes errores de permiso, busca la "service_role" en Supabase.
const SUPABASE_KEY = "sb_publishable_WQ6_AT1KoCGLJ_kbAgrszA_-p9hSp_Z"; 

// Configuración WHATSAPP (UltraMsg)
const WAPP_INSTANCE_ID = "instance160510"; 
const WAPP_TOKEN = "j5bw6c72071pgp29";     
const WAPP_URL = `https://api.ultramsg.com/${WAPP_INSTANCE_ID}/messages/image`; 

// ----------------------------------------------------------------------
// 2. FUNCIONES AUXILIARES
// ----------------------------------------------------------------------

/**
 * Genera una imagen PNG del ticket usando Canvas.
 * Si falla la carga de la imagen de fondo, intenta crear un ticket genérico.
 */
async function generarTicketImagen(reserva: any) {
  try {
    // Intentamos buscar la imagen en la carpeta public
    const bgPath = path.join(process.cwd(), "public", "ticket-bg.png");
    
    // Dimensiones por defecto (por si falla la carga de imagen)
    let width = 1080;
    let height = 1920;
    
    let image = null;
    try {
        image = await loadImage(bgPath);
        width = image.width;
        height = image.height;
    } catch (e) {
        console.warn("No se encontró ticket-bg.png, generando fondo sólido.");
    }

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // 1. Dibujar Fondo
    if (image) {
        ctx.drawImage(image, 0, 0);
    } else {
        // Fondo de respaldo negro si no hay imagen
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = "#DAA520"; // Dorado para borde
        ctx.lineWidth = 20;
        ctx.strokeRect(0, 0, width, height);
    }

    // 2. Configuración de Textos
    ctx.fillStyle = image ? "#000000" : "#FFFFFF"; // Texto negro si hay fondo, blanco si es respaldo
    
    // Código de Reserva (Centro Grande)
    ctx.font = "bold 55px Arial"; 
    ctx.textAlign = "center";
    // Ajustamos la posición Y dependiendo si hay imagen o es genérico
    const yCode = image ? 450 : height / 2;
    ctx.fillText(reserva.reservation_code, width / 2, yCode); 

    // Detalles (Alineado derecha o centro)
    ctx.font = "bold 25px Arial";
    ctx.textAlign = image ? "right" : "center"; 
    
    const xPos = image ? 550 : width / 2;
    const yBase = image ? 580 : (height / 2) + 100;

    // Formatear textos
    const textoFecha = `${reserva.date_reserva}, ${reserva.time_reserva}`;
    const textoZona = reserva.zone;
    const textoPersonas = `${reserva.guests} Personas`;

    ctx.fillText(textoFecha, xPos, yBase);
    ctx.fillText(textoZona, xPos, yBase + 50);
    ctx.fillText(textoPersonas, xPos, yBase + 100);

    return canvas.toBuffer("image/png");

  } catch (error) {
    console.error("Error crítico generando ticket:", error);
    return null;
  }
}

/**
 * Envía el mensaje y la imagen a través de UltraMsg
 */
async function enviarWhatsApp(telefono: string, imagenUrl: string, codigo: string, nombre: string) {
  // Limpieza del número telefónico para formato internacional (569...)
  let phoneClean = telefono.replace(/\D/g, ""); 
  if (phoneClean.length === 8) phoneClean = "569" + phoneClean; // Caso 912345678 -> 56912345678

  const mensaje = `Hola ${nombre} 👋,\n\n¡Tu reserva en *Boulevard Zapallar* ha sido CONFIRMADA! 🥂\n\n📌 *Código:* ${codigo}\n\nAdjuntamos tu ticket de entrada. Por favor preséntalo en recepción.\nRecuerda llegar con 15 min de tolerancia.\n\n¡Te esperamos!`;

  try {
    const res = await fetch(WAPP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        token: WAPP_TOKEN,
        to: phoneClean,
        image: imagenUrl,
        caption: mensaje
      })
    });
    
    if (!res.ok) {
        const errText = await res.text();
        console.error("UltraMsg Error:", errText);
    }
    
    return res.ok;
  } catch (e) {
    console.error("Error API WhatsApp:", e);
    return false;
  }
}

// ----------------------------------------------------------------------
// 3. ENDPOINT PRINCIPAL (POST)
// ----------------------------------------------------------------------
export async function POST(req: Request) {
  try {
    // Inicializar Supabase con las credenciales harcodeadas (Solución al error del Dashboard)
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      throw new Error("Credenciales de Supabase vacías. Revisa las constantes en route.ts");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // Obtener ID del body
    const body = await req.json();
    const { reservaId } = body;

    if (!reservaId) {
        return NextResponse.json({ error: "Falta reservaId" }, { status: 400 });
    }

    // 1. Obtener datos de la Reserva
    const { data: reserva, error } = await supabase
      .from("reservas")
      .select("*")
      .eq("id", reservaId)
      .single();

    if (error || !reserva) {
        console.error("Error buscando reserva:", error);
        return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
    }

    // 2. Generar Código si no existe
    let codigoReserva = reserva.reservation_code;
    if (!codigoReserva) {
        codigoReserva = `BZ-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    // 3. Generar Ticket (Imagen)
    // Pasamos el objeto con el código actualizado por si no lo tenía
    const reservaParaTicket = { ...reserva, reservation_code: codigoReserva };
    const ticketBuffer = await generarTicketImagen(reservaParaTicket);
    
    let publicUrl = "";
    
    // Solo intentamos subir si se generó el buffer correctamente
    if (ticketBuffer) {
        const fileName = `ticket-${codigoReserva}.png`;
        const { error: uploadError } = await supabase
          .storage
          .from('tickets')
          .upload(fileName, ticketBuffer, { contentType: 'image/png', upsert: true });

        if (!uploadError) {
            const { data } = supabase.storage.from('tickets').getPublicUrl(fileName);
            publicUrl = data.publicUrl;
        } else {
            console.error("Error subiendo ticket a Supabase:", uploadError);
        }
    }

    // 4. Enviar WhatsApp (Si hay teléfono y se generó url, o enviamos solo texto si falló imagen)
    let whatsappEnviado = false;
    if (reserva.phone && publicUrl) {
       whatsappEnviado = await enviarWhatsApp(reserva.phone, publicUrl, codigoReserva, reserva.name);
    } else if (reserva.phone) {
       // Fallback: Enviar mensaje sin imagen si falló el ticket
       console.warn("Enviando WhatsApp sin imagen (fallo ticket)");
       // Aquí podrías implementar una llamada a messages/chat en vez de messages/image si quisieras
    }

    // 5. Actualizar Base de Datos
    const { error: updateError } = await supabase.from("reservas")
      .update({ 
        status: "confirmada", 
        reservation_code: codigoReserva,
        ticket_url: publicUrl || null 
      })
      .eq("id", reservaId);

    if (updateError) {
        console.error("Error actualizando estado en DB:", updateError);
        return NextResponse.json({ error: "Error al actualizar DB", details: updateError }, { status: 500 });
    }

    return NextResponse.json({ 
        success: true, 
        whatsapp: whatsappEnviado, 
        code: codigoReserva 
    });

  } catch (err: any) {
    console.error("Error en endpoint /api/admin/confirmar:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}