"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    ArrowLeft, Upload, Send, Lock, User, Mail, Phone, 
    Briefcase, FileText, CheckCircle, ChevronDown 
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });

// Roles disponibles
const ROLES = [
    { id: "garzon", label: "Garzón / Mesera" },
    { id: "bartender", label: "Bartender / Barra" },
    { id: "cocina", label: "Cocina (Chef/Ayudante)" },
    { id: "bodega", label: "Bodega / Logística" },
    { id: "admin", label: "Administración" },
    { id: "host", label: "Recepción / Host" },
    { id: "seguridad", label: "Seguridad" }
];

export default function TrabajoPage() {
  const [fileName, setFileName] = useState("");
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
  };

  // Animaciones simples sin tipado estricto
  const containerAnim = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.3 }
    }
  };

  const itemAnim = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <main className={`min-h-screen bg-black text-white pb-20 overflow-x-hidden ${montserrat.className}`}>
      
      {/* --- HERO HEADER (Aumentado a h-72 para más espacio) --- */}
      <div className="relative h-72 w-full">
        <Image src="/equipo-bg.jpg" alt="Equipo" fill className="object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/70 to-black" />
        
        <div className="absolute top-6 left-6 z-10">
            <Link href="/" className="p-2 bg-black/50 backdrop-blur-md rounded-full border border-white/10 hover:bg-black/80 transition-colors inline-block">
                <ArrowLeft className="w-6 h-6 text-white" />
            </Link>
        </div>
        
        {/* TITULO CENTRADO (Ajustado bottom-8 para más separación) */}
        <div className="absolute bottom-8 left-0 right-0 z-10 text-center flex flex-col items-center">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-center gap-2 mb-2">
                <Briefcase className="w-5 h-5 text-[#2A9D8F]" />
                <span className="text-xs font-bold text-[#2A9D8F] uppercase tracking-[0.2em]">Carreras</span>
            </motion.div>
            {/* TÍTULO ACTUALIZADO A BZ */}
            <h1 className="text-3xl font-bold uppercase tracking-wide text-white drop-shadow-lg leading-none">Únete al<br/>Equipo BZ</h1>
        </div>
      </div>

      {/* --- TARJETA FLOTANTE --- */}
      <div className="px-6 -mt-6 relative z-20">
        <motion.div 
            // Usamos 'as any' para evitar conflictos de tipado estricto
            variants={containerAnim as any}
            initial="hidden"
            animate="show"
            className="w-full max-w-lg mx-auto bg-zinc-900 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6"
        >
            
            {/* 1. Datos Personales */}
            <div className="space-y-4">
                <motion.h2 variants={itemAnim as any} className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                    <User className="w-4 h-4"/> Tus Datos
                </motion.h2>
                <div className="space-y-3">
                    <motion.div variants={itemAnim as any} className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input type="text" placeholder="Nombre Completo" className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:border-[#2A9D8F] outline-none transition-colors" />
                    </motion.div>
                    <motion.div variants={itemAnim as any} className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input type="email" placeholder="Correo Electrónico" className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:border-[#2A9D8F] outline-none transition-colors" />
                    </motion.div>
                    <motion.div variants={itemAnim as any} className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input type="tel" placeholder="+56 9..." className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:border-[#2A9D8F] outline-none transition-colors" />
                    </motion.div>
                </div>
            </div>

            {/* 2. Perfil y Cargo */}
            <div className="space-y-4">
                <motion.h2 variants={itemAnim as any} className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                    <Briefcase className="w-4 h-4"/> Tu Perfil
                </motion.h2>
                
                {/* Selector Custom */}
                <motion.div variants={itemAnim as any} className="relative">
                    <button 
                        type="button"
                        onClick={() => setIsSelectOpen(!isSelectOpen)}
                        className={`w-full flex items-center justify-between bg-black/40 border rounded-xl py-3 px-4 text-sm transition-all ${isSelectOpen ? 'border-[#2A9D8F] text-white' : 'border-white/10 text-zinc-400'}`}
                    >
                        <span>{selectedRole ? ROLES.find(r => r.id === selectedRole)?.label : "Selecciona el cargo"}</span>
                        <ChevronDown className="w-4 h-4" />
                    </button>
                    
                    <AnimatePresence>
                        {isSelectOpen && (
                            <motion.div 
                                initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                                className="absolute top-full left-0 w-full mt-2 bg-zinc-800 border border-white/10 rounded-xl overflow-hidden shadow-xl z-50 max-h-60 overflow-y-auto"
                            >
                                {ROLES.map((role) => (
                                    <button
                                        key={role.id}
                                        type="button"
                                        onClick={() => { setSelectedRole(role.id); setIsSelectOpen(false); }}
                                        className="w-full text-left px-4 py-3 text-sm text-zinc-300 hover:bg-white/10 hover:text-white transition-colors"
                                    >
                                        {role.label}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                <motion.div variants={itemAnim as any}>
                    <textarea rows={3} placeholder="Cuéntanos sobre tu experiencia..." className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-[#2A9D8F] outline-none resize-none"></textarea>
                </motion.div>
            </div>

            {/* 3. Carga de CV */}
            <motion.div variants={itemAnim as any} className="space-y-2">
                <label className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer transition-all ${fileName ? 'border-[#2A9D8F] bg-[#2A9D8F]/10' : 'border-white/10 hover:bg-white/5'}`}>
                    {fileName ? (
                        <div className="flex flex-col items-center text-[#2A9D8F]">
                            <CheckCircle className="w-8 h-8 mb-1" />
                            <p className="text-xs font-bold text-center px-2">{fileName}</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center text-zinc-500">
                            <Upload className="w-6 h-6 mb-2" />
                            <p className="text-xs"><span className="font-bold text-zinc-300">Sube tu CV</span> (PDF/Word)</p>
                        </div>
                    )}
                    <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleFileChange} />
                </label>
            </motion.div>

            {/* Términos y Botón */}
            <motion.div variants={itemAnim as any} className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer mb-4">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${acceptedTerms ? 'bg-[#2A9D8F] border-[#2A9D8F]' : 'border-white/30'}`}>
                        {acceptedTerms && <CheckCircle className="w-3 h-3 text-black" />}
                    </div>
                    <input type="checkbox" className="hidden" checked={acceptedTerms} onChange={() => setAcceptedTerms(!acceptedTerms)} />
                    <p className="text-[10px] text-zinc-400">Acepto el tratamiento de mis datos.</p>
                </label>

                <button 
                    disabled={!acceptedTerms}
                    className={`w-full font-bold uppercase tracking-widest py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg ${acceptedTerms ? 'bg-[#2A9D8F] hover:bg-[#21867a] text-black' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'}`}
                >
                    Enviar <Send className="w-4 h-4" />
                </button>
            </motion.div>

            <motion.div variants={itemAnim as any} className="text-center pt-4 border-t border-white/5">
                <Link href="/admin/login" className="text-[10px] text-zinc-600 hover:text-white uppercase tracking-widest flex items-center justify-center gap-1 transition-colors">
                    <Lock className="w-3 h-3" /> Acceso Staff
                </Link>
            </motion.div>

        </motion.div>
      </div>
    </main>
  );
}