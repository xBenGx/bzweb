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
} from "@react-email/components";
import * as React from "react";

interface TicketEmailProps {
  customerName: string;
  eventName: string;
  eventDate: string;
  eventImage: string;
  qrCodeUrl: string;
  ticketId: string;
}

export const TicketEmail = ({
  customerName,
  eventName,
  eventDate,
  eventImage,
  qrCodeUrl,
  ticketId,
}: TicketEmailProps) => (
  <Html>
    <Head />
    <Preview>Tu entrada para {eventName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>¡Entrada Confirmada!</Heading>
        <Text style={text}>
          Hola {customerName}, tu compra para <strong>{eventName}</strong> está lista.
        </Text>

        {/* Imagen del Evento */}
        <Section style={imageSection}>
          <Img 
            src={eventImage} 
            width="100%" 
            height="250"
            style={showImage} 
            alt={eventName} 
          />
        </Section>

        {/* Área del Ticket y QR */}
        <Section style={ticketContainer}>
          <Text style={eventInfo}>{eventName}</Text>
          <Text style={dateInfo}>{eventDate}</Text>
          
          <Img src={qrCodeUrl} width="200" height="200" alt="QR de acceso" style={qr} />
          
          <Text style={codeText}>ID Ticket: {ticketId}</Text>
          <Text style={instruction}>Muestra este código en la entrada</Text>
        </Section>

        <Text style={footer}>
          Boulevard Zapallar<br />
          Ruta E-30-F, Zapallar, Valparaíso.
        </Text>
      </Container>
    </Body>
  </Html>
);

// Estilos
const main = { backgroundColor: "#f6f9fc", fontFamily: "sans-serif" };
const container = { backgroundColor: "#ffffff", margin: "0 auto", padding: "40px 20px", maxWidth: "600px" };
const h1 = { color: "#333", fontSize: "24px", textAlign: "center" as const, margin: "0 0 20px" };
const text = { color: "#525f7f", fontSize: "16px", lineHeight: "24px", textAlign: "center" as const };
const imageSection = { margin: "20px 0" };
const showImage = { borderRadius: "8px", objectFit: "cover" as const, width: "100%", height: "auto" };
const ticketContainer = { border: "2px dashed #e6ebf1", borderRadius: "8px", padding: "20px", textAlign: "center" as const, backgroundColor: "#fafbfc" };
const eventInfo = { fontSize: "20px", fontWeight: "bold", color: "#333", margin: "0" };
const dateInfo = { fontSize: "16px", color: "#8898aa", margin: "5px 0 20px" };
const qr = { margin: "0 auto" };
const codeText = { fontSize: "12px", color: "#8898aa", marginTop: "10px", textTransform: "uppercase" as const };
const instruction = { fontSize: "14px", fontWeight: "bold", color: "#333", marginTop: "10px" };
const footer = { color: "#8898aa", fontSize: "12px", marginTop: "30px", textAlign: "center" as const };

export default TicketEmail;