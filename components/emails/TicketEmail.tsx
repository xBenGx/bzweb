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
  Link,
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
  eventDate = "Ver detalles en el PDF adjunto",
  eventImage = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=600&auto=format&fit=crop", 
  qrCodeUrl,
  ticketId,
}: TicketEmailProps) => (
  <Html>
    <Head />
    <Preview>🎟️ Entradas confirmadas: {eventName} en Boulevard Zapallar</Preview>
    <Body style={main}>
      <Container style={container}>
        
        {/* Header / Logo Texto */}
        <Section style={headerSection}>
          <Text style={logoText}>BOULEVARD ZAPALLAR</Text>
          <Text style={logoSubText}>CENTRO GASTRONÓMICO Y EVENTOS</Text>
        </Section>

        <Heading style={h1}>¡Reserva Confirmada!</Heading>
        <Text style={text}>
          Hola <strong style={{ color: "#DAA520" }}>{customerName}</strong>, tu compra para <strong>{eventName}</strong> se ha procesado con éxito. 
          Estamos emocionados de recibirte.
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

        {/* Área del Ticket (Vista Previa) */}
        <Section style={ticketContainer}>
          <Text style={ticketHeader}>VISTA PREVIA DE TU ENTRADA</Text>
          <Text style={eventInfo}>{eventName}</Text>
          <Text style={dateInfo}>📅 {eventDate}</Text>
          
          <Section style={qrSection}>
            <Container style={qrWrapper}>
                <Img src={qrCodeUrl} width="160" height="160" alt="QR de acceso" style={qr} />
            </Container>
          </Section>
          
          <Text style={codeText}>ID REF: {ticketId}</Text>
        </Section>

        {/* Instrucciones Importantes */}
        <Section style={alertBox}>
          <Text style={alertText}>
            <strong style={{ color: "#DAA520", fontSize: "16px" }}>⚠️ IMPORTANTE:</strong><br/><br/>
            Si compraste más de una entrada, el código QR de arriba es solo el de tu primer ticket. 
            <strong> Por favor, descarga el archivo PDF adjunto a este correo</strong>, allí encontrarás todas tus entradas individuales para ser escaneadas en puerta.
          </Text>
        </Section>

        <Hr style={divider} />

        {/* Información adicional del Boulevard */}
        <Text style={footerText}>
          Prepárate para disfrutar de la mejor gastronomía, coctelería de autor, música en vivo y un ambiente increíble.
        </Text>

        <Text style={footer}>
          <strong>Boulevard Zapallar</strong><br />
          Sector Zapallar, Curicó, Región del Maule.<br />
          <Link href="https://bzweb.vercel.app/" style={link}>bzweb.vercel.app</Link>
        </Text>
      </Container>
    </Body>
  </Html>
);

// --- ESTILOS PREMIUM DARK MODE ---
const main = { 
    backgroundColor: "#000000", 
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    padding: "20px 0"
};

const container = { 
    backgroundColor: "#0a0a0a", 
    margin: "0 auto", 
    padding: "40px 30px", 
    maxWidth: "600px", 
    borderRadius: "16px", 
    border: "1px solid rgba(218, 165, 32, 0.15)", // Borde dorado sutil
    boxShadow: "0 10px 40px rgba(218, 165, 32, 0.05)" 
};

const headerSection = {
    textAlign: "center" as const,
    marginBottom: "30px",
    paddingBottom: "20px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.05)"
};

const logoText = {
    color: "#ffffff",
    fontSize: "22px",
    fontWeight: "900",
    letterSpacing: "4px",
    margin: "0",
};

const logoSubText = {
    color: "#DAA520",
    fontSize: "10px",
    fontWeight: "bold",
    letterSpacing: "2px",
    margin: "5px 0 0 0",
};

const h1 = { 
    color: "#ffffff", 
    fontSize: "26px", 
    textAlign: "center" as const, 
    margin: "0 0 20px", 
    fontWeight: "800" 
};

const text = { 
    color: "#a1a1aa", 
    fontSize: "16px", 
    lineHeight: "26px", 
    textAlign: "center" as const 
};

const imageSection = { 
    margin: "25px 0" 
};

const showImage = { 
    borderRadius: "12px", 
    objectFit: "cover" as const, 
    width: "100%", 
    height: "250px",
    border: "1px solid rgba(255,255,255,0.1)"
};

const ticketContainer = { 
    border: "1px dashed rgba(218, 165, 32, 0.4)", 
    borderRadius: "16px", 
    padding: "30px 20px", 
    textAlign: "center" as const, 
    backgroundColor: "#111111", 
    margin: "30px 0" 
};

const ticketHeader = {
    color: "#DAA520",
    fontSize: "11px",
    fontWeight: "bold",
    letterSpacing: "2px",
    marginBottom: "15px",
    marginTop: "0"
};

const eventInfo = { 
    fontSize: "22px", 
    fontWeight: "bold", 
    color: "#ffffff", 
    margin: "0 0 10px 0" 
};

const dateInfo = { 
    fontSize: "15px", 
    color: "#a1a1aa", 
    margin: "0 0 25px 0", 
    fontWeight: "500" 
};

const qrSection = { 
    display: "flex", 
    justifyContent: "center", 
    margin: "0 auto",
    width: "100%"
};

const qrWrapper = {
    backgroundColor: "#ffffff",
    padding: "15px",
    borderRadius: "12px",
    display: "inline-block",
    margin: "0 auto"
};

const qr = { 
    margin: "0 auto", 
    display: "block"
};

const codeText = { 
    fontSize: "12px", 
    color: "#71717a", 
    marginTop: "20px", 
    letterSpacing: "1px", 
    fontWeight: "bold" 
};

const alertBox = {
    backgroundColor: "rgba(218, 165, 32, 0.05)",
    borderLeft: "4px solid #DAA520",
    padding: "20px",
    borderRadius: "0 12px 12px 0",
    margin: "20px 0"
};

const alertText = { 
    fontSize: "14px", 
    color: "#d4d4d8", 
    margin: "0",
    lineHeight: "22px"
};

const divider = { 
    borderColor: "rgba(255,255,255,0.1)", 
    margin: "30px 0" 
};

const footerText = { 
    color: "#71717a", 
    fontSize: "14px", 
    textAlign: "center" as const, 
    fontStyle: "italic",
    lineHeight: "22px"
};

const footer = { 
    color: "#71717a", 
    fontSize: "12px", 
    marginTop: "25px", 
    textAlign: "center" as const, 
    lineHeight: "22px" 
};

const link = { 
    color: "#DAA520", 
    textDecoration: "none",
    fontWeight: "bold"
};

export default TicketEmail;