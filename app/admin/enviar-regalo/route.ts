import { NextResponse } from "next/server";

const WAPP_INSTANCE_ID = process.env.ULTRAMSG_INSTANCE_ID || "instance161222";
const WAPP_TOKEN = process.env.ULTRAMSG_TOKEN || "65qat7d38cyc4ozf";
const WAPP_API_URL = `https://api.ultramsg.com/${WAPP_INSTANCE_ID}`;

export async function POST(req: Request) {
  try {
    const { phone, imageUrl, message } = await req.json();

    if (!phone || !imageUrl || !message) {
      return NextResponse.json({ error: "Faltan parámetros (phone, imageUrl, message)" }, { status: 400 });
    }

    // Limpieza de número chileno
    let raw = phone.replace(/\D/g, "");
    if (raw.length === 9 && raw.startsWith("9")) raw = "56" + raw;
    if (raw.length === 8) raw = "569" + raw;

    const params = new URLSearchParams();
    params.append("token", WAPP_TOKEN);
    params.append("to", raw);
    params.append("image", imageUrl);
    params.append("caption", message);
    params.append("priority", "10");

    const res = await fetch(`${WAPP_API_URL}/messages/image`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params
    });

    const responseText = await res.text();
    if (!res.ok) throw new Error(responseText);

    return NextResponse.json({ success: true, details: responseText });
  } catch (err: any) {
    console.error("🔥 Error enviando regalo:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}