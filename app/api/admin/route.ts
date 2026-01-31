import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
// Usamos require para evitar problemas de importación estática con canvas en algunos entornos
// Si tienes el archivo types.d.ts, esto funcionará perfecto
import { createCanvas, loadImage } from "canvas"; 
import path from "path";

// 1. CONFIGURACIÓN DEL GATEWAY DE WHATSAPP (UltraMsg)
const WAPP_INSTANCE_ID = "instance160510"; // Tu ID Real
const WAPP_TOKEN = "j5bw6c72071pgp29";     // Tu Token Real
const WAPP_URL = `https://api.ultramsg.com/${WAPP_INSTANCE_ID}/messages/image`; 

// --- GENERADOR DE IMAGEN (CANVAS) ---
async function generarTicketImagen(reserva: any) {
  try {
    const bgPath = path.join(process.cwd(), "public", "ticket-bg.png"); 
    const image = await loadImage(bgPath);
    
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(image, 0, 0);
    ctx.fillStyle = "#000000"; 
    
    // Configuración de textos
    ctx.font = "bold 55px Arial"; 
    ctx.textAlign = "center";
    ctx.fillText(reserva.reservation_code, canvas.width / 2, 450); 

    ctx.font = "bold 20px Arial";
    ctx.textAlign = "right"; 
    const xRight = 550; 

    ctx.fillText(`${reserva.date_reserva}, ${reserva.time_reserva}`, xRight, 580);
    ctx.fillText(reserva.zone, xRight, 630);
    ctx.fillText(`${reserva.guests} Personas`, xRight, 680);

    return canvas.toBuffer("image/png");

  } catch (error) {
    console.error("Error generando ticket:", error);
    return null;
  }
}

// --- FUNCIÓN DE ENVÍO WHATSAPP ---
async function enviarWhatsApp(telefono: string, imagenUrl: string, codigo: string, nombre: string) {
  const phoneClean = telefono.replace(/\D/g, ""); 
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
    return res.ok;
  } catch (e) {
    console.error("Error API WhatsApp:", e);
    return false;
  }
}

// --- ENDPOINT PRINCIPAL ---
export async function POST(req: Request) {
  try {
    // --- CAMBIO CLAVE: INICIALIZAMOS SUPABASE AQUÍ DENTRO ---
    // Esto evita que falle el Build si las variables tardan en cargar
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Faltan las variables de entorno de Supabase (URL o KEY)");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    // --------------------------------------------------------

    const { reservaId } = await req.json();

    // 1. Obtener Reserva
    const { data: reserva, error } = await supabase
      .from("reservas")
      .select("*")
      .eq("id", reservaId)
      .single();

    if (error || !reserva) return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });

    // 2. Generar Código si no existe
    if (!reserva.reservation_code) {
        reserva.reservation_code = `BZ-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    // 3. Generar Ticket
    const ticketBuffer = await generarTicketImagen(reserva);
    // Si falla canvas, seguimos sin ticket visual, pero confirmamos igual (fail-safe)
    let publicUrl = "";
    
    if (ticketBuffer) {
        const fileName = `ticket-${reserva.reservation_code}.png`;
        const { error: uploadError } = await supabase
          .storage
          .from('tickets')
          .upload(fileName, ticketBuffer, { contentType: 'image/png', upsert: true });

        if (!uploadError) {
            const { data } = supabase.storage.from('tickets').getPublicUrl(fileName);
            publicUrl = data.publicUrl;
        }
    }

    // 4. Enviar WhatsApp
    let whatsappEnviado = false;
    if (reserva.phone && publicUrl) {
       whatsappEnviado = await enviarWhatsApp(reserva.phone, publicUrl, reserva.reservation_code, reserva.name);
    }

    // 5. Actualizar Base de Datos
    await supabase.from("reservas")
      .update({ 
        status: "confirmada", 
        reservation_code: reserva.reservation_code,
        ticket_url: publicUrl 
      })
      .eq("id", reservaId);

    return NextResponse.json({ success: true, whatsapp: whatsappEnviado });

  } catch (err: any) {
    console.error("Error en endpoint:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}