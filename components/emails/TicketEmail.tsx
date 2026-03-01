import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Hr,
} from "@react-email/components";
import * as React from "react";

interface TicketEmailProps {
  customerName: string;
  eventName: string;
  eventDate?: string;
  eventImage?: string;
  qrCodeUrl: string;
  ticketId: string;
}

export const TicketEmail = ({
  customerName = "Cliente",
  eventName = "Evento en Boulevard Zapallar",
  eventDate = "Fecha por confirmar",
  eventImage = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=600&auto=format&fit=crop", // Imagen gastronómica por defecto
  qrCodeUrl,
  ticketId,
}: TicketEmailProps) => (
  <Html>
    <Head />
    <Preview>🎟️ Tu entrada oficial para {eventName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>¡Entrada Confirmada!</Heading>
        <Text style={text}>
          Hola <strong>{customerName}</strong>, tu compra para <strong>{eventName}</strong> se ha procesado con éxito.
        </Text>

        {/* Imagen del Evento */}
        {eventImage && (
          <Section style={imageSection}>
            <Img 
              src={eventImage} 
              width="100%" 
              height="250"
              style={showImage} 
              alt={eventName} 
            />
          </Section>
        )}

        {/* Área del Ticket y QR */}
        <Section style={ticketContainer}>
          <Text style={eventInfo}>{eventName}</Text>
          <Text style={dateInfo}>📅 {eventDate}</Text>
          
          <Section style={qrSection}>
            {/* Se asume que qrCodeUrl es un string base64 generado en el backend */}
            <Img src={qrCodeUrl} width="180" height="180" alt="QR de acceso" style={qr} />
          </Section>
          
          <Text style={codeText}>ID TICKET: {ticketId}</Text>
          <Text style={instruction}>Muestra este código QR en la entrada o descarga el <strong>PDF adjunto</strong> en este correo.</Text>
        </Section>

        <Hr style={divider} />

        {/* Información adicional del Boulevard */}
        <Text style={footerText}>
          Prepárate para disfrutar de la mejor gastronomía, música en vivo y un ambiente Pet Friendly.
        </Text>

        <Text style={footer}>
          <strong>Boulevard Zapallar</strong><br />
          Sector Zapallar, Curicó, Región del Maule.<br />
          <a href="https://bzweb.vercel.app/" style={link}>Visita nuestra web</a>
        </Text>
      </Container>
    </Body>
  </Html>
);

// Estilos mejorados
const main = { backgroundColor: "#f4f4f5", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" };
const container = { backgroundColor: "#ffffff", margin: "40px auto", padding: "40px 30px", maxWidth: "600px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" };
const h1 = { color: "#111827", fontSize: "26px", textAlign: "center" as const, margin: "0 0 20px", fontWeight: "800" };
const text = { color: "#4b5563", fontSize: "16px", lineHeight: "26px", textAlign: "center" as const };
const imageSection = { margin: "25px 0" };
const showImage = { borderRadius: "10px", objectFit: "cover" as const, width: "100%", height: "250px" };
const ticketContainer = { border: "2px dashed #d1d5db", borderRadius: "12px", padding: "30px 20px", textAlign: "center" as const, backgroundColor: "#f9fafb", margin: "30px 0" };
const eventInfo = { fontSize: "22px", fontWeight: "bold", color: "#1f2937", margin: "0 0 10px 0" };
const dateInfo = { fontSize: "16px", color: "#6b7280", margin: "0 0 25px 0", fontWeight: "500" };
const qrSection = { display: "flex", justifyContent: "center", margin: "0 auto" };
const qr = { margin: "0 auto", borderRadius: "8px", border: "1px solid #e5e7eb", padding: "10px", backgroundColor: "#fff" };
const codeText = { fontSize: "13px", color: "#9ca3af", marginTop: "15px", letterSpacing: "1px", fontWeight: "bold" };
const instruction = { fontSize: "15px", fontWeight: "600", color: "#374151", marginTop: "15px" };
const divider = { borderColor: "#e5e7eb", margin: "30px 0" };
const footerText = { color: "#6b7280", fontSize: "14px", textAlign: "center" as const, fontStyle: "italic" };
const footer = { color: "#9ca3af", fontSize: "13px", marginTop: "20px", textAlign: "center" as const, lineHeight: "22px" };
const link = { color: "#3b82f6", textDecoration: "none" };

export default TicketEmail;