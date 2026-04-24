/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. Configuración de Imágenes
  images: {
    // Restringido por seguridad solo a tu bucket de Supabase
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lqelewbxejvsiitpjjly.supabase.co",
      },
    ],
    // Formatos modernos para que la web cargue rápido
    formats: ['image/avif', 'image/webp'],
  },

  // 2. "Válvulas de Seguridad" para el Build
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // 3. Rendimiento y Seguridad
  reactStrictMode: true,
  poweredByHeader: false, 
  
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', 
    },
  },
};

export default nextConfig;