"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    ArrowLeft, Upload, Send, Lock, User, Mail, Phone, 
    Briefcase, CheckCircle, ChevronDown, Loader2
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Montserrat } from "next/font/google";
import { supabase } from "@/lib/supabaseClient";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });

// Roles disponibles
const ROLES = [
    { id: "Garzón / Mesera", label: "Garzón / Mesera" },
    { id: "Bartender / Barra", label: "Bartender / Barra" },
    { id: "Cocina", label: "Cocina (Chef/Ayudante)" },
    { id: "Bodega / Logística", label: "Bodega / Logística" },
    { id: "Administración", label: "Administración" },
    { id: "Recepción / Host", label: "Recepción / Host" },
    { id: "Seguridad", label: "Seguridad" }
];

export default function TrabajoPage() {
  // --- ESTADOS DEL FORMULARIO ---
  const [formData, setFormData] = useState({
      name: "",
      email: "",
      phone: "",
      experience: ""
  });
  const [selectedRole, setSelectedRole] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  
  // --- ESTADOS DE UI ---
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Manejo de inputs de texto
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Manejo del archivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      // Validación básica de tamaño (ej. max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
          setErrorMsg("El archivo es muy pesado. Máximo 5MB.");
          return;
      }
      setFile(selectedFile);
      setErrorMsg("");
    }
  };

  // --- ENVÍO A SUPABASE ---
  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMsg("");

      if (!selectedRole) {
          setErrorMsg("Por favor, selecciona un cargo al que postulas.");
          return;
      }

      setIsSubmitting(true);

      try {
          let cvUrl = null;

          // 1. Si hay archivo, lo subimos al bucket 'cvs'
          if (file) {
              const fileExt = file.name.split('.').pop();
              const fileName = `cv-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
              
              const { error: uploadError } = await supabase.storage
                  .from('cvs')
                  .upload(fileName, file);

              if (uploadError) throw new Error("Error al subir el CV: " + uploadError.message);

              const { data: publicUrlData } = supabase.storage
                  .from('cvs')
                  .getPublicUrl(fileName);
                  
              cvUrl = publicUrlData.publicUrl;
          }

          // 2. Guardamos los datos en la tabla 'candidatos'
          const { error: insertError } = await supabase
              .from('candidatos')
              .insert([{
                  name: formData.name,
                  email: formData.email,
                  phone: formData.phone,
                  role: selectedRole,
                  experience: formData.experience,
                  cv_url: cvUrl
              }]);

          if (insertError) throw new Error("Error al enviar postulación: " + insertError.message);

          // 3. Éxito
          setIsSuccess(true);
          
      } catch (error: any) {
          setErrorMsg(error.message);
      } finally {
          setIsSubmitting(false);
      }
  };

  // Animaciones simples
  const containerAnim = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.3 } }
  };

  const itemAnim = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <main className={`min-h-screen bg-black text-white pb-20 overflow-x-hidden ${montserrat.className}`}>
      
      {/* --- HERO HEADER --- */}
      <div className="relative h-72 w-full">
        <Image src="/equipo-bg.jpg" alt="Equipo" fill className="object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/70 to-black" />
        
        <div className="absolute top-6 left-6 z-10">
            <Link href="/" className="p-2 bg-black/50 backdrop-blur-md rounded-full border border-white/10 hover:bg-black/80 transition-colors inline-block">
                <ArrowLeft className="w-6 h-6 text-white" />
            </Link>
        </div>
        
        {/* TITULO CENTRADO */}
        <div className="absolute bottom-8 left-0 right-0 z-10 text-center flex flex-col items-center">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-center gap-2 mb-2">
                <Briefcase className="w-5 h-5 text-[#2A9D8F]" />
                <span className="text-xs font-bold text-[#2A9D8F] uppercase tracking-[0.2em]">Carreras</span>
            </motion.div>
            <h1 className="text-3xl font-bold uppercase tracking-wide text-white drop-shadow-lg leading-none">Únete al<br/>Equipo BZ</h1>
        </div>
      </div>

      {/* --- TARJETA FLOTANTE / FORMULARIO --- */}
      <div className="px-6 -mt-6 relative z-20">
        <motion.div 
            variants={containerAnim as any}
            initial="hidden"
            animate="show"
            className="w-full max-w-lg mx-auto bg-zinc-900 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6"
        >
            {isSuccess ? (
                // --- PANTALLA DE ÉXITO ---
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-10 text-center flex flex-col items-center space-y-4">
                    <div className="w-20 h-20 bg-[#2A9D8F]/20 rounded-full flex items-center justify-center mb-2 border border-[#2A9D8F]/50">
                        <CheckCircle className="w-10 h-10 text-[#2A9D8F]" />
                    </div>
                    <h2 className="text-2xl font-black uppercase tracking-wider text-white">¡Postulación<br/>Enviada!</h2>
                    <p className="text-sm text-zinc-400">Hemos recibido tus datos y tu currículum. Si tu perfil se ajusta a lo que buscamos, nos contactaremos contigo.</p>
                    <Link href="/" className="mt-6 w-full font-bold uppercase tracking-widest py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg bg-white text-black hover:bg-zinc-200">
                        Volver al inicio
                    </Link>
                </motion.div>
            ) : (
                // --- FORMULARIO ---
                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {errorMsg && (
                        <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-xl text-red-400 text-xs font-medium text-center">
                            {errorMsg}
                        </div>
                    )}

                    {/* 1. Datos Personales */}
                    <div className="space-y-4">
                        <motion.h2 variants={itemAnim as any} className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                            <User className="w-4 h-4"/> Tus Datos
                        </motion.h2>
                        <div className="space-y-3">
                            <motion.div variants={itemAnim as any} className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                <input required type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Nombre Completo" className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:border-[#2A9D8F] outline-none transition-colors" />
                            </motion.div>
                            <motion.div variants={itemAnim as any} className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                <input required type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="Correo Electrónico" className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:border-[#2A9D8F] outline-none transition-colors" />
                            </motion.div>
                            <motion.div variants={itemAnim as any} className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                <input required type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="+56 9..." className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:border-[#2A9D8F] outline-none transition-colors" />
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
                                <span>{selectedRole ? ROLES.find(r => r.id === selectedRole)?.label : "Selecciona el cargo al que postulas"}</span>
                                <ChevronDown className="w-4 h-4" />
                            </button>
                            
                            <AnimatePresence>
                                {isSelectOpen && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                                        className="absolute top-full left-0 w-full mt-2 bg-zinc-800 border border-white/10 rounded-xl overflow-hidden shadow-xl z-50 max-h-60 overflow-y-auto custom-scrollbar"
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
                            <textarea required name="experience" value={formData.experience} onChange={handleInputChange} rows={3} placeholder="Cuéntanos brevemente sobre tu experiencia..." className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-[#2A9D8F] outline-none resize-none"></textarea>
                        </motion.div>
                    </div>

                    {/* 3. Carga de CV */}
                    <motion.div variants={itemAnim as any} className="space-y-2">
                        <label className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer transition-all ${file ? 'border-[#2A9D8F] bg-[#2A9D8F]/10' : 'border-white/10 hover:bg-white/5'}`}>
                            {file ? (
                                <div className="flex flex-col items-center text-[#2A9D8F]">
                                    <CheckCircle className="w-8 h-8 mb-1" />
                                    <p className="text-xs font-bold text-center px-2 truncate max-w-[200px]">{file.name}</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center text-zinc-500">
                                    <Upload className="w-6 h-6 mb-2" />
                                    <p className="text-xs"><span className="font-bold text-zinc-300">Sube tu CV</span> (PDF o Word)</p>
                                </div>
                            )}
                            <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleFileChange} />
                        </label>
                    </motion.div>

                    {/* Términos y Botón */}
                    <motion.div variants={itemAnim as any} className="pt-2 border-t border-white/5">
                        <label className="flex items-center gap-3 cursor-pointer mb-6 mt-4">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${acceptedTerms ? 'bg-[#2A9D8F] border-[#2A9D8F]' : 'border-white/30'}`}>
                                {acceptedTerms && <CheckCircle className="w-3 h-3 text-black" />}
                            </div>
                            <input type="checkbox" className="hidden" checked={acceptedTerms} onChange={() => setAcceptedTerms(!acceptedTerms)} />
                            <p className="text-[10px] text-zinc-400">Declaro que la información entregada es real y acepto el tratamiento de mis datos.</p>
                        </label>

                        <button 
                            type="submit"
                            disabled={!acceptedTerms || isSubmitting}
                            className={`w-full font-black uppercase tracking-widest py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg ${acceptedTerms && !isSubmitting ? 'bg-[#2A9D8F] hover:bg-[#21867a] text-black' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'}`}
                        >
                            {isSubmitting ? (
                                <><Loader2 className="w-5 h-5 animate-spin" /> Procesando...</>
                            ) : (
                                <>Enviar Postulación <Send className="w-5 h-5" /></>
                            )}
                        </button>
                    </motion.div>

                    <motion.div variants={itemAnim as any} className="text-center pt-2">
                        <Link href="/admin/login" className="text-[9px] text-zinc-600 hover:text-white uppercase tracking-widest flex items-center justify-center gap-1 transition-colors">
                            <Lock className="w-3 h-3" /> Acceso Staff
                        </Link>
                    </motion.div>

                </form>
            )}
        </motion.div>
      </div>
    </main>
  );
}