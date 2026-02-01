"use client";

import { motion } from "framer-motion";
import { 
    ArrowLeft, MapPin, Navigation, Clock, 
    Phone, Calendar, Star, PartyPopper, ExternalLink 
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["300", "400", "500", "700", "900"] });

export default function UbicacionPage() {
  
  // Animación de entrada escalonada
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50 } }
  };

  return (
    <main className={`min-h-screen bg-black text-white pb-24 overflow-x-hidden ${montserrat.className}`}>
      
      {/* --- HERO HEADER --- */}
      <div className="relative h-[35vh] min-h-[300px] w-full overflow-hidden">
        {/* Fondo con efecto Parallax simulado */}
        <div className="absolute inset-0 bg-zinc-900">
             <Image 
                src="/fondo-boulevard.jpg" 
                alt="Ubicación Boulevard" 
                fill 
                className="object-cover opacity-60 blur-sm scale-110" 
                priority
             />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/60 to-black" />
        
        {/* Navbar Flotante */}
        <div className="absolute top-0 left-0 w-full p-6 z-20 flex justify-between items-center">
            <Link href="/" className="group p-3 bg-white/5 backdrop-blur-md rounded-full border border-white/10 hover:bg-white/20 transition-all active:scale-95">
                <ArrowLeft className="w-6 h-6 text-white group-hover:-translate-x-1 transition-transform" />
            </Link>
        </div>
        
        {/* Título */}
        <div className="absolute bottom-8 left-0 right-0 z-10 px-6">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-start max-w-lg mx-auto"
            >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DAA520]/20 border border-[#DAA520]/50 mb-3 shadow-[0_0_15px_rgba(218,165,32,0.3)]">
                    <MapPin className="w-3 h-3 text-[#DAA520]" />
                    <span className="text-[10px] font-black text-[#DAA520] uppercase tracking-widest">Curicó, Maule</span>
                </div>
                <h1 className="text-5xl font-black uppercase leading-[0.9] text-white drop-shadow-2xl">
                    Ubicación<br/><span className="text-zinc-500">Exacta</span>
                </h1>
            </motion.div>
        </div>
      </div>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <div className="px-4 -mt-4 relative z-20 container mx-auto max-w-lg">
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-6"
        >
            
            {/* 1. SECCIÓN HORARIOS (DISEÑO BENTO GRID DESTACADO) */}
            <motion.div variants={itemVariants} className="space-y-3">
                <div className="flex items-center gap-2 pl-1 opacity-80">
                    <Clock className="w-4 h-4 text-[#DAA520]" />
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-300">Horarios de Atención</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {/* TARJETA GOLD (Fin de Semana) - Ocupa todo el ancho */}
                    <div className="col-span-2 relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#DAA520] via-[#B8860B] to-[#8B4513] p-5 shadow-[0_10px_30px_-10px_rgba(218,165,32,0.5)] group border border-[#FFD700]/30">
                        {/* Efecto de brillo animado */}
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/20 blur-2xl rounded-full group-hover:scale-150 transition-transform duration-700" />
                        
                        <div className="relative z-10 flex justify-between items-end">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="bg-black/90 text-[#DAA520] text-[9px] font-black px-2 py-1 rounded uppercase tracking-wider shadow-sm">
                                        Horario Prime
                                    </span>
                                    <PartyPopper className="w-4 h-4 text-black" />
                                </div>
                                <h3 className="text-2xl font-black text-black uppercase leading-none mt-2">Viernes &<br/>Sábado</h3>
                            </div>
                            <div className="text-right">
                                <span className="block text-[10px] font-bold text-black/70 uppercase">Cierre Extendido</span>
                                <span className="text-3xl font-black text-black tracking-tighter">02:30<span className="text-sm align-top opacity-70">AM</span></span>
                                <span className="block text-xs font-bold text-black/80">Desde las 17:00</span>
                            </div>
                        </div>
                    </div>

                    {/* TARJETA STANDARD (Semana) */}
                    <div className="col-span-1 bg-zinc-900/80 backdrop-blur-md border border-white/10 rounded-3xl p-4 flex flex-col justify-between hover:border-white/20 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mb-2">
                            <Calendar className="w-4 h-4 text-zinc-400" />
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-zinc-500 uppercase">Lun - Jue</span>
                            <div className="text-xl font-bold text-white mt-1">00:30<span className="text-[10px] text-zinc-500">AM</span></div>
                            <span className="text-[10px] text-zinc-400">Abre 17:00</span>
                        </div>
                    </div>

                    {/* TARJETA DOMINGO */}
                    <div className="col-span-1 bg-zinc-900/80 backdrop-blur-md border border-white/10 rounded-3xl p-4 flex flex-col justify-between hover:border-white/20 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mb-2">
                            <Star className="w-4 h-4 text-zinc-400" />
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-zinc-500 uppercase">Domingos</span>
                            <div className="text-xl font-bold text-white mt-1">00:00<span className="text-[10px] text-zinc-500">AM</span></div>
                            <span className="text-[10px] text-zinc-400">Abre 16:00</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* 2. DATOS DE CONTACTO */}
            <motion.div variants={itemVariants} className="bg-[#111] rounded-[24px] border border-white/10 p-1">
                <div className="bg-zinc-900/50 rounded-[20px] p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center shadow-lg shrink-0">
                        <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-sm font-bold text-white">Av. Manuel Labra Lillo 430</h4>
                        <p className="text-xs text-zinc-400 mt-0.5">Curicó, Región del Maule</p>
                        <a href="tel:+56995051248" className="text-xs font-bold text-[#DAA520] mt-1 inline-flex items-center gap-1 hover:underline">
                            <Phone className="w-3 h-3" /> +56 9 9505 1248
                        </a>
                    </div>
                </div>
            </motion.div>

            {/* 3. BOTONES DE NAVEGACIÓN (GRANDES) */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
                <a 
                    href="https://waze.com/ul?q=Av.+Manuel+Labra+Lillo+430,+Curicó" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative flex flex-col items-center justify-center h-28 rounded-3xl border border-[#33CCFF]/30 bg-[#33CCFF]/10 overflow-hidden active:scale-95 transition-all"
                >
                    <div className="absolute inset-0 bg-[#33CCFF]/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Navigation className="w-8 h-8 text-[#33CCFF] mb-2 z-10 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-black text-[#33CCFF] uppercase tracking-widest z-10">Waze</span>
                </a>

                <a 
                    href="https://www.google.com/maps/dir/?api=1&destination=Av.+Manuel+Labra+Lillo+430,+Curicó" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative flex flex-col items-center justify-center h-28 rounded-3xl border border-[#4285F4]/30 bg-[#4285F4]/10 overflow-hidden active:scale-95 transition-all"
                >
                    <div className="absolute inset-0 bg-[#4285F4]/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <MapPin className="w-8 h-8 text-[#4285F4] mb-2 z-10 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-black text-[#4285F4] uppercase tracking-widest z-10">Maps</span>
                </a>
            </motion.div>

            {/* 4. MAPA VISUAL PREVIEW */}
            <motion.div variants={itemVariants} className="rounded-3xl border border-white/10 overflow-hidden relative h-48 shadow-2xl group">
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
                    <span className="bg-white text-black px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2">
                        <ExternalLink className="w-3 h-3"/> Abrir Mapa
                    </span>
                </div>
            </motion.div>

        </motion.div>
      </div>
    </main>
  );
}