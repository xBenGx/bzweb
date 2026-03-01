import type { Metadata } from "next";
import { Inter } from "next/font/google"; 
import "./globals.css";

// Importamos el Provider y el nuevo Overlay Global
import { CartProvider } from "@/components/CartContext"; 

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Boulevard Zapallar | Experiencia Gastronómica",
  description: "Reservas, Menú y Eventos en Boulevard Zapallar",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <CartProvider>
            {children}
        </CartProvider>
      </body>
    </html>
  );
}