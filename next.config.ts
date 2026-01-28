/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Permite cargar imágenes desde cualquier dominio (incluyendo Supabase)
      },
    ],
  },
};

export default nextConfig;