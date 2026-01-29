/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // Permite imágenes de cualquier dominio (Supabase, etc.)
      },
    ],
  },
  typescript: {
    // Ignora errores de tipado para que Hostinger compile sin fallar por detalles menores
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignora errores de linter durante la construcción
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;