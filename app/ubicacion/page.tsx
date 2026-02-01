"use client";

import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Navigation, Clock, Phone, Calendar, ExternalLink } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800"] });

export default function UbicacionPage() {
  
  // Animación de entrada
  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50, damping: 20 } }
  };

  // Datos de horarios para renderizado dinámico
  const schedules = [
    { label: "Lunes a Jueves", time: "17:00 - 00:30", highlight: false },
    { label: "Viernes y Sábado", time: "17:00 - 02:30", highlight: true, tag: "HORARIO EXTENDIDO" },
    { label: "Domingos", time: "16:00 - 00:00", highlight: false }
  ];

  return (
    <main className={`min-h-screen bg-black text-white pb-20 overflow-x-hidden ${montserrat.className}`}>
      
      {/* --- HERO HEADER --- */}
      <div className="relative h-80 w-full overflow-hidden">
        {/* Fondo */}
        <div className="absolute inset-0 bg-zinc-900">
             <Image 
                src="/fondo-boulevard.jpg" 
                alt="Boulevard Zapallar Fondo" 
                fill 
                className="object-cover opacity-50 blur-[3px] scale-105" 
                priority
             />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/60 to-[#000]" />
        
        {/* Botón Volver */}
        <div className="absolute top-6 left-6 z-20">
            <Link href="/" className="group p-3 bg-white/5 backdrop-blur-md rounded-full border border-white/10 hover:bg-white/20 transition-all active:scale-95">
                <ArrowLeft className="w-5 h-5 text-white group-hover:-translate-x-1 transition-transform" />
            </Link>
        </div>
        
        {/* Título Principal */}
        <div className="absolute bottom-12 left-0 right-0 z-10 text-center px-4">
            <motion.div 
                initial={{ y: 30, opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }} 
                transition={{ delay: 0.1 }}
                className="flex flex-col items-center"
            >
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#4285F4]/10 border border-[#4285F4]/30 mb-4 shadow-[0_0_15px_rgba(66,133,244,0.2)]">
                    <MapPin className="w-3 h-3 text-[#4285F4]" />
                    <span className="text-[10px] font-black text-[#4285F4] uppercase tracking-widest">Cómo llegar</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white drop-shadow-2xl">
                    Ubicación<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-600">Exacta</span>
                </h1>
            </motion.div>
        </div>
      </div>

      {/* --- CONTENEDOR PRINCIPAL --- */}
      <div className="px-4 -mt-10 relative z-20 container mx-auto max-w-lg">
        <motion.div 
            initial="hidden" animate="show" variants={fadeUp}
            className="bg-[#0a0a0a] border border-white/10 rounded-[32px] p-1.5 shadow-2xl"
        >
            <div className="bg-zinc-900/80 backdrop-blur-md rounded-[28px] p-6 md:p-8 space-y-8">
                
                {/* 1. DATOS DE DIRECCIÓN */}
                <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-14 h-14 bg-gradient-to-br from-red-600 to-red-900 rounded-2xl flex items-center justify-center shadow-lg border border-red-500/20 mb-1">
                        <MapPin className="w-7 h-7 text-white fill-white/20"/>
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">Boulevard Zapallar</h2>
                        <p className="text-sm text-zinc-400 font-medium leading-relaxed mt-1">
                            Av. Manuel Labra Lillo 430<br/>Curicó, Región del Maule
                        </p>
                    </div>
                    <a href="tel:+56995051248" className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800/50 rounded-full border border-white/5 hover:border-[#DAA520]/50 transition-colors group">
                        <Phone className="w-3 h-3 text-[#DAA520] group-hover:animate-pulse" /> 
                        <span className="text-xs font-bold text-white group-hover:text-[#DAA520] transition-colors">+56 9 9505 1248</span>
                    </a>
                </div>

                <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                {/* 2. HORARIOS DE ATENCIÓN (NUEVO DISEÑO PREMIUM) */}
                <div className="space-y-4">
                    <div className="flex items-center justify-center gap-2 mb-2 opacity-80">
                         <Clock className="w-4 h-4 text-[#DAA520]" />
                         <span className="text-xs font-bold text-white uppercase tracking-[0.2em]">Horarios de Atención</span>
                    </div>
                    
                    <div className="grid gap-3">
                        {schedules.map((item, idx) => (
                            <div 
                                key={idx} 
                                className={`relative flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 group
                                    ${item.highlight 
                                        ? 'bg-gradient-to-r from-zinc-800/80 to-zinc-900/80 border-[#DAA520]/30 shadow-[0_4px_20px_rgba(0,0,0,0.3)]' 
                                        : 'bg-black/20 border-white/5 hover:bg-white/5'
                                    }`}
                            >
                                {/* Indicador lateral dorado para destacados */}
                                {item.highlight && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-[#DAA520] rounded-r-full shadow-[0_0_10px_#DAA520]" />
                                )}

                                <div className="flex flex-col gap-1 pl-2">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-bold uppercase tracking-wide ${item.highlight ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`}>
                                            {item.label}
                                        </span>
                                        {item.highlight && (
                                            <span className="text-[8px] font-black bg-[#DAA520] text-black px-1.5 py-0.5 rounded uppercase tracking-tighter">
                                                {item.tag}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-2
                                    ${item.highlight ? 'bg-black/40 border-[#DAA520]/20' : 'bg-black/20 border-white/5'}`}>
                                    <Clock className={`w-3 h-3 ${item.highlight ? 'text-[#DAA520]' : 'text-zinc-500'}`} />
                                    <span className={`text-xs font-mono font-bold ${item.highlight ? 'text-[#DAA520]' : 'text-zinc-300'}`}>
                                        {item.time}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. BOTONES DE NAVEGACIÓN */}
                <div className="grid grid-cols-2 gap-3 md:gap-4 pt-2">
                    <a 
                        href="https://waze.com/ul?q=Av.+Manuel+Labra+Lillo+430,+Curicó" 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative flex flex-col items-center justify-center p-4 rounded-2xl border border-[#33CCFF]/20 bg-[#33CCFF]/5 hover:bg-[#33CCFF]/10 transition-all duration-300 active:scale-[0.98]"
                    >
                        <div className="w-10 h-10 bg-[#33CCFF]/10 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(51,204,255,0.1)]">
                            <Navigation className="w-5 h-5 text-[#33CCFF]" />
                        </div>
                        <span className="text-[10px] font-black text-[#33CCFF] uppercase tracking-widest">Ir con Waze</span>
                    </a>

                    <a 
                        href="https://www.google.com/maps/dir/?api=1&destination=Av.+Manuel+Labra+Lillo+430,+Curicó" 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative flex flex-col items-center justify-center p-4 rounded-2xl border border-[#4285F4]/20 bg-[#4285F4]/5 hover:bg-[#4285F4]/10 transition-all duration-300 active:scale-[0.98]"
                    >
                        <div className="w-10 h-10 bg-[#4285F4]/10 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(66,133,244,0.1)]">
                            <MapPin className="w-5 h-5 text-[#4285F4]" />
                        </div>
                        <span className="text-[10px] font-black text-[#4285F4] uppercase tracking-widest">Google Maps</span>
                    </a>
                </div>

                {/* 4. MAPA EMBEBIDO (Integrado) */}
                <div className="w-full h-48 rounded-2xl overflow-hidden border border-white/10 relative shadow-inner group">
                    <iframe 
                        // Usamos un query string genérico seguro para evitar errores 404
                        src="https://maps.google.com/maps?q=Av.+Manuel+Labra+Lillo+430,+Curicó&t=&z=15&ie=UTF8&iwloc=&output=embed" 
                        width="100%" 
                        height="100%" 
                        style={{ border: 0 }} 
                        allowFullScreen 
                        loading="lazy" 
                        className="grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700"
                    ></iframe>
                    
                    <div className="absolute bottom-3 right-3 pointer-events-none">
                        <span className="bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-[9px] uppercase font-bold text-white border border-white/10 shadow-lg flex items-center gap-1.5">
                            <ExternalLink className="w-3 h-3 text-[#DAA520]"/> Toca para interactuar
                        </span>
                    </div>
                </div>

            </div>
        </motion.div>
      </div>
    </main>
  );
}