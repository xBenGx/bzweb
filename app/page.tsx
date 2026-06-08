"use client";

import Image from "next/image";
import { Montserrat } from "next/font/google";
import { motion } from "framer-motion";
import { Instagram, MapPin, Facebook } from "lucide-react";

const montserrat = Montserrat({ 
  subsets: ["latin"],
  weight: ["300", "400", "700"] 
});

export default function MaintenancePage() {
  return (
    <main className={`relative min-h-screen w-full bg-black flex flex-col items-center justify-center overflow-hidden ${montserrat.className}`}>
      
      {/* 1. FONDO CINEMÁTICO */}
      <div className="fixed inset-0 z-0">
        <Image 
          src="/fondo-boulevard.jpg" 
          alt="Boulevard Zapallar" 
          fill 
          className="object-cover opacity-40 blur-[4px] scale-110" 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black" />
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />
      </div>

      {/* 2. CONTENIDO PRINCIPAL */}
      <div className="relative z-10 flex flex-col items-center px-6 text-center max-w-2xl">
        
        {/* LOGO con animación de respiración */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="relative w-72 h-72 md:w-80 md:h-80 mb-4"
        >
          {/* ¡AQUÍ ESTABA EL FIX! Agregamos relative w-full h-full para que el Image fill funcione */}
          <motion.div
            className="relative w-full h-full"
            animate={{ 
              scale: [1, 1.03, 1],
              opacity: [0.9, 1, 0.9]
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          >
            <Image 
              src="/logo.png" 
              alt="Boulevard Zapallar Logo" 
              fill 
              className="object-contain drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]" 
              priority
            />
          </motion.div>
        </motion.div>

        {/* MENSAJE DE EVOLUCIÓN */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-center gap-3 opacity-60">
            <div className="h-[1px] w-8 bg-white" />
            <span className="text-[10px] tracking-[0.4em] uppercase text-white font-bold">
              Zapallar · Curicó
            </span>
            <div className="h-[1px] w-8 bg-white" />
          </div>

          <h1 className="text-2xl md:text-4xl font-light text-white leading-tight tracking-wide">
            ¡Iniciamos un <span className="font-bold italic text-boulevard-red">proceso de evolución</span>, pronto nos volveremos a encontrar!
          </h1>

          <p className="text-zinc-400 text-sm md:text-base font-light tracking-widest uppercase">
            Estamos preparando algo increíble para ti.
          </p>
        </motion.div>

        {/* REDES SOCIALES */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-12 flex gap-8 items-center justify-center"
        >
          <a 
            href="https://www.instagram.com/boulevardzapallar/?hl=es" 
            target="_blank" 
            className="text-white/40 hover:text-white transition-colors"
          >
            <Instagram className="w-6 h-6" />
          </a>
          <a 
            href="https://waze.com/ul?q=Av.+Manuel+Labra+Lillo+430,+Curicó" 
            target="_blank" 
            className="text-white/40 hover:text-white transition-colors"
          >
            <MapPin className="w-6 h-6" />
          </a>
          <a 
            href="#" 
            className="text-white/40 hover:text-white transition-colors"
          >
            <Facebook className="w-6 h-6" />
          </a>
        </motion.div>

      </div>

      {/* FOOTER */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-10 z-10"
      >
        <p className="text-[9px] text-zinc-600 font-bold tracking-[0.4em] uppercase">
          Powered By <span className="text-white/40">BAYX</span>
        </p>
      </motion.div>

    </main>
  );
}