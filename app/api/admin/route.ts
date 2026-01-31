import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
// Si te sigue marcando error rojo en 'canvas', el archivo types.d.ts lo soluciona, 
// pero por seguridad importamos así:
import { createCanvas, loadImage } from "canvas"; 
import path from "path";

// 1. CONEXIÓN A SUPABASE (Service Role = Permisos Totales)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

// 2. CONFIGURACIÓN DEL GATEWAY DE WHATSAPP (ACTUALIZADO CON TUS DATOS REALES)
const WAPP_INSTANCE_ID = "instance160510"; // TU INSTANCE ID REAL
const WAPP_TOKEN = "j5bw6c72071pgp29";     // TU TOKEN REAL
const WAPP_URL = `https://api.ultramsg.com/${WAPP_INSTANCE_ID}/messages/image`; 

// --- GENERADOR DE IMAGEN (CANVAS) ---
async function generarTicketImagen(reserva: any) {
  try {
    // Ruta a la imagen base LIMPIA en la carpeta public (ticket-bg.png)
    const bgPath = path.join(process.cwd(), "public", "ticket-bg.png"); 
    const image = await loadImage(bgPath);
    
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext("2d");

    // Dibujar fondo
    ctx.drawImage(image, 0, 0);

    // Configurar estilos 
    ctx.fillStyle = "#000000"; // Letra Negra
    
    // 1. CÓDIGO GRANDE (Centrado)
    // Ajusta '450' si quieres subir o bajar el código
    ctx.font = "bold 55px Arial"; 
    ctx.textAlign = "center";
    ctx.fillText(reserva.reservation_code, canvas.width / 2, 450); 

    // 2. DATOS DE LA RESERVA (Alineados a la derecha)
    // Ajusta '550' si quieres mover el texto más a la izquierda/derecha
    ctx.font = "bold 20px Arial";
    ctx.textAlign = "right"; 
    const xRight = 550; 

    // Escribimos los datos (Las coordenadas Y: 580, 630, 680)
    ctx.fillText(`${reserva.date_reserva}, ${reserva.time_reserva}`, xRight, 580);
    ctx.fillText(reserva.zone, xRight, 630);
    ctx.fillText(`${reserva.guests} Personas`, xRight, 680);

    return canvas.toBuffer("image/png");

  } catch (error) {
    console.error("Error generando ticket:", error);
    return null;
  }
}

// --- FUNCIÓN DE ENVÍO (Gateway HTTP - UltraMsg) ---
async function enviarWhatsApp(telefono: string, imagenUrl: string, codigo: string, nombre: string) {
  // Limpiamos el número (solo dejamos dígitos)
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

// --- ENDPOINT PRINCIPAL (LLAMADO DESDE EL DASHBOARD) ---
export async function POST(req: Request) {
  try {
    const { reservaId } = await req.json();

    // 1. BUSCAR RESERVA EN BD
    const { data: reserva, error } = await supabase
      .from("reservas")
      .select("*")
      .eq("id", reservaId)
      .single();

    if (error || !reserva) return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });

    // 2. ASEGURAR QUE TENGA CÓDIGO (Si no tiene, lo creamos)
    if (!reserva.reservation_code) {
        reserva.reservation_code = `BZ-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    // 3. GENERAR IMAGEN DEL TICKET
    const ticketBuffer = await generarTicketImagen(reserva);
    if (!ticketBuffer) throw new Error("Fallo al dibujar el ticket (Revisa ticket-bg.png en public)");

    // 4. SUBIR A SUPABASE STORAGE 
    const fileName = `ticket-${reserva.reservation_code}.png`;
    const { error: uploadError } = await supabase
      .storage
      .from('tickets') // Debe existir este bucket público
      .upload(fileName, ticketBuffer, { contentType: 'image/png', upsert: true });

    if (uploadError) throw uploadError;

    // Obtener URL pública de la imagen
    const { data: { publicUrl } } = supabase.storage.from('tickets').getPublicUrl(fileName);

    // 5. ENVIAR WHATSAPP (Solo si tiene teléfono)
    let whatsappEnviado = false;
    if (reserva.phone) {
       whatsappEnviado = await enviarWhatsApp(reserva.phone, publicUrl, reserva.reservation_code, reserva.name);
    }

    // 6. ACTUALIZAR ESTADO EN BD
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