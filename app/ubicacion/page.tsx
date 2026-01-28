"use client";

import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Navigation, Clock, Phone } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });

export default function UbicacionPage() {
  
  // Animación simple sin tipado estricto
  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50 } }
  };

  return (
    <main className={`min-h-screen bg-black text-white pb-20 overflow-x-hidden ${montserrat.className}`}>
      
      {/* --- HERO HEADER (Estilo Eventos Centrado) --- */}
      <div className="relative h-64 w-full">
        {/* Fondo: Imagen de fondo con blur */}
        <Image src="/fondo-boulevard.jpg" alt="Mapa Fondo" fill className="object-cover opacity-50 blur-sm" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/70 to-black" />
        
        <div className="absolute top-6 left-6 z-10">
            <Link href="/" className="p-2 bg-black/50 backdrop-blur-md rounded-full border border-white/10 hover:bg-black/80 transition-colors inline-block">
                <ArrowLeft className="w-6 h-6 text-white" />
            </Link>
        </div>
        
        {/* TITULO CENTRADO */}
        <div className="absolute bottom-6 left-0 right-0 z-10 text-center flex flex-col items-center">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-center justify-center gap-2 mb-2">
                <MapPin className="w-5 h-5 text-[#4285F4]" />
                {/* TEXTO CAMBIADO A "Visítanos" */}
                <span className="text-xs font-bold text-[#4285F4] uppercase tracking-[0.2em]">Visítanos</span>
            </motion.div>
            <h1 className="text-3xl font-bold uppercase tracking-wide text-white drop-shadow-lg leading-none">Ubicación<br/>Exacta</h1>
        </div>
      </div>

      {/* --- TARJETA FLOTANTE --- */}
      <div className="px-6 -mt-6 relative z-20">
        <motion.div 
            // Usamos 'as any' para evitar conflictos de tipado estricto
            initial="hidden" animate="show" variants={fadeUp as any}
            className="w-full max-w-lg mx-auto bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6"
        >
            
            {/* Info Dirección */}
            <div className="flex items-start gap-4 p-4 bg-black/40 rounded-2xl border border-white/5">
                <div className="p-2 bg-white/10 rounded-lg shrink-0"><MapPin className="w-5 h-5 text-red-500"/></div>
                <div>
                    <h3 className="text-sm font-bold text-white mb-1">Boulevard Zapallar</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                        Av. Manuel Labra Lillo 430<br/>Curicó, Región del Maule
                    </p>
                </div>
            </div>

            {/* Info Extra (Horario y Teléfono) */}
            <div className="flex items-center justify-between px-2 text-sm text-zinc-300">
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#DAA520]" />
                    <span>Abierto hasta las 02:00</span>
                </div>
                <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#25D366]" />
                    <span>+56 9 9505 1248</span>
                </div>
            </div>

            {/* Mapa Preview (Iframe) */}
            <div className="w-full h-48 rounded-2xl overflow-hidden border border-white/10 relative shadow-lg group">
                <iframe 
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3300.957643596942!2d-71.239563!3d-34.980655!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzTCsDU4JzUwLjQiUyA3McKwMTQnMjIuNCJX!5e0!3m2!1ses!2scl!4v1620000000000!5m2!1ses!2scl" 
                    width="100%" height="100%" loading="lazy" 
                    className="grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500"
                ></iframe>
                {/* Overlay Interacción */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider text-white border border-white/10">Ver en mapa</span>
                </div>
            </div>

            {/* Botones de Acción Grandes */}
            <div className="grid grid-cols-2 gap-3">
                <a 
                    href="https://waze.com/ul?q=Av.+Manuel+Labra+Lillo+430,+Curicó" 
                    target="_blank"
                    className="flex flex-col items-center justify-center p-4 rounded-2xl border border-[#33CCFF]/30 bg-[#33CCFF]/10 hover:bg-[#33CCFF]/20 transition-all active:scale-95"
                >
                    <Navigation className="w-6 h-6 text-[#33CCFF] mb-2" />
                    <span className="text-[10px] text-[#33CCFF] font-bold uppercase tracking-widest">Ir con Waze</span>
                </a>

                <a 
                    href="http://googleusercontent.com/maps.google.com/7" 
                    target="_blank"
                    className="flex flex-col items-center justify-center p-4 rounded-2xl border border-[#4285F4]/30 bg-[#4285F4]/10 hover:bg-[#4285F4]/20 transition-all active:scale-95"
                >
                    <MapPin className="w-6 h-6 text-[#4285F4] mb-2" />
                    <span className="text-[10px] text-[#4285F4] font-bold uppercase tracking-widest">Google Maps</span>
                </a>
            </div>

        </motion.div>
      </div>
    </main>
  );
}