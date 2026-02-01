"use client";

import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Navigation, Clock, Phone, Calendar } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });

export default function UbicacionPage() {
  
  // Animación suave para la tarjeta
  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 40, damping: 15 } }
  };

  return (
    <main className={`min-h-screen bg-black text-white pb-20 overflow-x-hidden ${montserrat.className}`}>
      
      {/* --- HERO HEADER (Estilo Inmersivo) --- */}
      <div className="relative h-72 w-full">
        {/* Fondo con imagen referencial del local o mapa artístico */}
        <div className="absolute inset-0 bg-zinc-900">
             {/* Puedes reemplazar '/fondo-boulevard.jpg' con una foto real de tu fachada o interior */}
             <Image 
                src="/fondo-boulevard.jpg" 
                alt="Boulevard Zapallar Fondo" 
                fill 
                className="object-cover opacity-60 blur-[2px]" 
                priority
             />
        </div>
        
        {/* Degradado para legibilidad */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black" />
        
        {/* Botón Volver */}
        <div className="absolute top-6 left-6 z-20">
            <Link href="/" className="p-3 bg-white/10 backdrop-blur-md rounded-full border border-white/10 hover:bg-white/20 transition-all active:scale-95 group">
                <ArrowLeft className="w-5 h-5 text-white group-hover:-translate-x-1 transition-transform" />
            </Link>
        </div>
        
        {/* Título Principal */}
        <div className="absolute bottom-10 left-0 right-0 z-10 text-center px-4">
            <motion.div 
                initial={{ y: 20, opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }} 
                transition={{ delay: 0.2 }}
                className="flex flex-col items-center"
            >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4285F4]/10 border border-[#4285F4]/30 mb-3">
                    <MapPin className="w-3 h-3 text-[#4285F4]" />
                    <span className="text-[10px] font-bold text-[#4285F4] uppercase tracking-widest">Punto de Encuentro</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-white drop-shadow-2xl">
                    Ubicación<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500">Exacta</span>
                </h1>
            </motion.div>
        </div>
      </div>

      {/* --- TARJETA FLOTANTE PRINCIPAL --- */}
      <div className="px-4 md:px-6 -mt-8 relative z-20 container mx-auto max-w-lg">
        <motion.div 
            initial="hidden" animate="show" variants={fadeUp}
            className="bg-[#111] border border-white/10 rounded-3xl p-1 shadow-2xl overflow-hidden"
        >
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-[20px] p-6 md:p-8 space-y-8">
                
                {/* 1. SECCIÓN DIRECCIÓN */}
                <div className="flex items-start gap-5">
                    <div className="p-3 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl shadow-lg shrink-0 mt-1">
                        <MapPin className="w-6 h-6 text-white"/>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white mb-1">Boulevard Zapallar</h2>
                        <p className="text-sm text-zinc-400 leading-relaxed font-medium">
                            Av. Manuel Labra Lillo 430<br/>
                            Curicó, Región del Maule
                        </p>
                        <a href="tel:+56995051248" className="inline-flex items-center gap-2 mt-3 text-xs font-bold text-[#DAA520] hover:text-white transition-colors">
                            <Phone className="w-3 h-3" /> +56 9 9505 1248
                        </a>
                    </div>
                </div>

                <div className="w-full h-px bg-white/5" />

                {/* 2. SECCIÓN HORARIOS (Diseño Limpio) */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                         <Clock className="w-4 h-4 text-[#DAA520]" />
                         <span className="text-xs font-bold text-white uppercase tracking-widest">Horarios de Atención</span>
                    </div>
                    
                    <div className="grid gap-3">
                        {/* Lunes a Jueves */}
                        <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-1 h-8 bg-zinc-700 rounded-full" />
                                <span className="text-xs font-bold text-zinc-300 uppercase">Lun - Jue</span>
                            </div>
                            <span className="text-xs font-mono text-[#DAA520] font-medium">17:00 - 00:30</span>
                        </div>

                        {/* Viernes y Sábado */}
                        <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5 relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#DAA520]" />
                            <div className="flex items-center gap-3 pl-2">
                                <span className="text-xs font-bold text-white uppercase">Vie - Sáb</span>
                            </div>
                            <span className="text-xs font-mono text-[#DAA520] font-bold">17:00 - 02:30</span>
                        </div>

                        {/* Domingos */}
                        <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-1 h-8 bg-zinc-700 rounded-full" />
                                <span className="text-xs font-bold text-zinc-300 uppercase">Domingos</span>
                            </div>
                            <span className="text-xs font-mono text-[#DAA520] font-medium">16:00 - 00:00</span>
                        </div>
                    </div>
                </div>

                <div className="w-full h-px bg-white/5" />

                {/* 3. BOTONES DE ACCIÓN (WAZE & MAPS) */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Botón Waze */}
                    <a 
                        href="https://waze.com/ul?ll=-34.9801,-71.2307&navigate=yes" 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative flex flex-col items-center justify-center p-5 rounded-2xl border border-[#33CCFF]/20 bg-[#33CCFF]/5 hover:bg-[#33CCFF]/10 transition-all duration-300 active:scale-95"
                    >
                        <div className="p-3 bg-[#33CCFF]/10 rounded-full mb-3 group-hover:scale-110 transition-transform">
                            <Navigation className="w-6 h-6 text-[#33CCFF]" />
                        </div>
                        <span className="text-[10px] font-black text-[#33CCFF] uppercase tracking-widest">Ir con Waze</span>
                        <div className="absolute inset-0 rounded-2xl border-2 border-[#33CCFF] opacity-0 group-hover:opacity-20 transition-opacity" />
                    </a>

                    {/* Botón Google Maps */}
                    <a 
                        href="https://www.google.com/maps/search/?api=1&query=Boulevard+Zapallar+Curico" 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative flex flex-col items-center justify-center p-5 rounded-2xl border border-[#4285F4]/20 bg-[#4285F4]/5 hover:bg-[#4285F4]/10 transition-all duration-300 active:scale-95"
                    >
                        <div className="p-3 bg-[#4285F4]/10 rounded-full mb-3 group-hover:scale-110 transition-transform">
                            <MapPin className="w-6 h-6 text-[#4285F4]" />
                        </div>
                        <span className="text-[10px] font-black text-[#4285F4] uppercase tracking-widest">Google Maps</span>
                        <div className="absolute inset-0 rounded-2xl border-2 border-[#4285F4] opacity-0 group-hover:opacity-20 transition-opacity" />
                    </a>
                </div>

                {/* 4. MAPA PREVIEW (IFRAME) */}
                <div className="w-full h-40 rounded-2xl overflow-hidden border border-white/10 relative shadow-inner group">
                    {/* Mapa Embebido de Curicó */}
                    <iframe 
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3330.569106277258!2d-71.2329!3d-34.9801!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9665b161c2805555%3A0x666!2sAv.+Manuel+Labra+Lillo+430%2C+Curic%C3%B3!5e0!3m2!1ses!2scl!4v1600000000000!5m2!1ses!2scl" 
                        width="100%" 
                        height="100%" 
                        style={{ border: 0 }} 
                        allowFullScreen 
                        loading="lazy" 
                        className="grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700"
                    ></iframe>
                    
                    {/* Botón Flotante sobre el mapa */}
                    <div className="absolute bottom-3 right-3 pointer-events-none">
                        <span className="bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-[9px] uppercase font-bold text-white border border-white/10 shadow-lg flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#DAA520]"/> Ver Ubicación
                        </span>
                    </div>
                </div>

            </div>
        </motion.div>
      </div>
    </main>
  );
}