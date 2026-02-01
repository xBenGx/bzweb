"use client";

import { motion } from "framer-motion";
import { 
    ArrowLeft, MapPin, Navigation, Clock, 
    Phone, Star, Sparkles, ExternalLink 
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["300", "400", "500", "700", "900"] });

export default function UbicacionPage() {
  
  // Animación escalonada para los elementos
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 60 } }
  };

  return (
    <main className={`min-h-screen bg-black text-white pb-24 overflow-x-hidden ${montserrat.className}`}>
      
      {/* --- HERO HEADER --- */}
      <div className="relative h-[40vh] min-h-[320px] w-full overflow-hidden border-b border-[#DAA520]/20">
        <div className="absolute inset-0 bg-zinc-900">
             <Image 
                src="/fondo-boulevard.jpg" 
                alt="Ubicación Boulevard" 
                fill 
                className="object-cover opacity-50 blur-[2px]" 
                priority
             />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        
        {/* Navbar */}
        <div className="absolute top-6 left-6 z-20">
            <Link href="/" className="group p-3 bg-black/40 backdrop-blur-md rounded-full border border-white/10 hover:border-[#DAA520] transition-all active:scale-95">
                <ArrowLeft className="w-6 h-6 text-white group-hover:text-[#DAA520] transition-colors" />
            </Link>
        </div>
        
        {/* Título Impactante */}
        <div className="absolute bottom-12 left-0 right-0 z-10 px-6 text-center">
            <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center"
            >
                <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#DAA520] mb-4 shadow-[0_0_20px_rgba(218,165,32,0.4)]">
                    <MapPin className="w-4 h-4 text-black fill-black" />
                    <span className="text-[10px] font-black text-black uppercase tracking-widest">Curicó</span>
                </div>
                <h1 className="text-5xl md:text-6xl font-black uppercase leading-none text-white drop-shadow-2xl">
                    Ubicación <span className="text-[#DAA520]">BZ</span>
                </h1>
            </motion.div>
        </div>
      </div>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <div className="px-4 -mt-8 relative z-20 container mx-auto max-w-lg">
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-8"
        >
            
            {/* 1. HORARIOS DE ATENCIÓN (DISEÑO TARJETAS NEON) */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-[#DAA520]" />
                        <h3 className="text-sm font-black uppercase tracking-widest text-white">Horarios</h3>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-bold uppercase animate-pulse">Abierto Hoy</span>
                </div>

                <div className="flex flex-col gap-3">
                    {/* TARJETA 1: LUNES A JUEVES */}
                    <motion.div 
                        variants={cardVariants}
                        className="relative bg-zinc-900/80 border-l-4 border-[#DAA520]/50 rounded-r-xl p-4 flex justify-between items-center overflow-hidden group"
                    >
                        <div className="relative z-10">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Semana</span>
                            <h4 className="text-lg font-bold text-white group-hover:text-[#DAA520] transition-colors">Lun - Jue</h4>
                        </div>
                        <div className="relative z-10 text-right">
                            <span className="text-2xl font-black text-white tracking-tighter">00:30</span>
                            <span className="text-[10px] font-bold text-[#DAA520] block uppercase">Cierre</span>
                        </div>
                        {/* Brillo de fondo */}
                        <div className="absolute inset-0 bg-gradient-to-r from-[#DAA520]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.div>

                    {/* TARJETA 2: VIERNES Y SÁBADO (DESTACADA) */}
                    <motion.div 
                        variants={cardVariants}
                        className="relative bg-gradient-to-r from-[#DAA520] to-[#B8860B] rounded-xl p-5 flex justify-between items-center shadow-[0_0_25px_rgba(218,165,32,0.3)] transform scale-105 border-2 border-white/10"
                    >
                        <div className="relative z-10">
                            <div className="flex items-center gap-1 mb-1">
                                <Sparkles className="w-3 h-3 text-black fill-white" />
                                <span className="text-[9px] font-black text-black uppercase tracking-widest">Full Party</span>
                            </div>
                            <h4 className="text-2xl font-black text-black uppercase">Vie & Sáb</h4>
                            <span className="text-[10px] font-bold text-black/80 mt-1 block">Apertura 17:00 hrs</span>
                        </div>
                        <div className="relative z-10 text-right bg-black/20 px-3 py-2 rounded-lg backdrop-blur-sm">
                            <span className="text-3xl font-black text-white tracking-tighter drop-shadow-md">02:30</span>
                            <span className="text-[9px] font-black text-white/90 block uppercase text-center">AM</span>
                        </div>
                    </motion.div>

                    {/* TARJETA 3: DOMINGO */}
                    <motion.div 
                        variants={cardVariants}
                        className="relative bg-zinc-900/80 border-l-4 border-[#DAA520]/50 rounded-r-xl p-4 flex justify-between items-center overflow-hidden group"
                    >
                        <div className="relative z-10">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Relax</span>
                            <h4 className="text-lg font-bold text-white group-hover:text-[#DAA520] transition-colors">Domingos</h4>
                        </div>
                        <div className="relative z-10 text-right">
                            <span className="text-2xl font-black text-white tracking-tighter">00:00</span>
                            <span className="text-[10px] font-bold text-[#DAA520] block uppercase">Cierre</span>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-[#DAA520]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.div>
                </div>
            </div>

            {/* 2. DATOS DE CONTACTO (Estilo Glass) */}
            <motion.div variants={cardVariants} className="bg-[#111] rounded-[24px] border border-white/10 p-1">
                <div className="bg-zinc-900/80 rounded-[20px] p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#DAA520]/10 border border-[#DAA520]/30 flex items-center justify-center shrink-0">
                        <MapPin className="w-6 h-6 text-[#DAA520]" />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-sm font-bold text-white">Av. Manuel Labra Lillo 430</h4>
                        <p className="text-xs text-zinc-400 mt-0.5">Curicó, Región del Maule</p>
                        <a href="tel:+56995051248" className="text-xs font-bold text-white mt-2 inline-flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/5 hover:bg-white/10 transition-colors">
                            <Phone className="w-3 h-3 text-[#DAA520]" /> +56 9 9505 1248
                        </a>
                    </div>
                </div>
            </motion.div>

            {/* 3. BOTONES DE NAVEGACIÓN (GRANDES) */}
            <motion.div variants={cardVariants} className="grid grid-cols-2 gap-4">
                <a 
                    href="https://waze.com/ul?q=Av.+Manuel+Labra+Lillo+430,+Curicó" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative flex flex-col items-center justify-center h-24 rounded-2xl bg-[#33CCFF] overflow-hidden active:scale-95 transition-all shadow-[0_0_20px_rgba(51,204,255,0.2)]"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent" />
                    <Navigation className="w-8 h-8 text-white mb-1 z-10 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest z-10">Ir con Waze</span>
                </a>

                <a 
                    href="https://www.google.com/maps/dir/?api=1&destination=Av.+Manuel+Labra+Lillo+430,+Curicó" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative flex flex-col items-center justify-center h-24 rounded-2xl bg-white overflow-hidden active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-transparent" />
                    <MapPin className="w-8 h-8 text-black mb-1 z-10 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black text-black uppercase tracking-widest z-10">Google Maps</span>
                </a>
            </motion.div>

            {/* 4. MAPA VISUAL PREVIEW */}
            <motion.div variants={cardVariants} className="rounded-3xl border border-white/10 overflow-hidden relative h-48 shadow-2xl group">
                <iframe 
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3302.269062332678!2d-71.23288868478297!3d-34.98013898036124!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9664570000000001%3A0x0!2sAv.%20Manuel%20Labra%20Lillo%20430%2C%20Curic%C3%B3!5e0!3m2!1ses!2scl!4v1600000000000!5m2!1ses!2scl" 
                    width="100%" 
                    height="100%" 
                    style={{ border: 0 }} 
                    allowFullScreen 
                    loading="lazy" 
                    className="grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 scale-110"
                ></iframe>
                
                {/* Overlay Interactivo */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-4 right-4 pointer-events-none">
                    <span className="bg-[#DAA520] text-black px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2">
                        <ExternalLink className="w-3 h-3"/> Abrir Mapa
                    </span>
                </div>
            </motion.div>

        </motion.div>
      </div>
    </main>
  );
}