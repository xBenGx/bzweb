"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    ArrowLeft, PartyPopper, Users, Calendar, Clock, 
    Utensils, ChevronRight, ChevronLeft, Check, FileText 
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });

// Opciones de configuración
const EVENT_TYPES = ["Cumpleaños", "Empresa / Corp.", "Matrimonio", "Aniversario", "Lanzamiento", "Otro"];
const ZONES = [
    { id: "vip", label: "Terraza VIP", desc: "Vista panorámica exclusiva" },
    { id: "salon", label: "Salón Principal", desc: "Climatizado y elegante" },
    { id: "vinoteca", label: "La Vinoteca", desc: "Privado para grupos pequeños" },
    { id: "terraza", label: "Terrazas Generales", desc: "Ambiente relajado al aire libre" }
];
const FOOD_OPTIONS = [
    { id: "tablas", label: "Tablas & Piqueos" },
    { id: "cocktail", label: "Cóctel & Finger Food" },
    { id: "cena", label: "Cena (Entrada, Fondo, Postre)" },
    { id: "barra", label: "Solo Barra Abierta" }
];

export default function EventosPage() {
  const [step, setStep] = useState(1);
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    eventType: "",
    guests: "",
    date: "",
    time: "",
    zone: "",
    food: [] as string[],
    name: "",
    email: "",
    phone: "",
    details: ""
  });

  const totalSteps = 4;

  const handleFoodToggle = (id: string) => {
    setFormData(prev => ({
        ...prev,
        food: prev.food.includes(id) 
            ? prev.food.filter(f => f !== id)
            : [...prev.food, id]
    }));
  };

  const nextStep = () => setStep(prev => Math.min(prev + 1, totalSteps));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  // Animaciones (Sin tipos estrictos para evitar errores)
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 50 : -50,
      opacity: 0
    })
  };

  return (
    <main className={`min-h-screen bg-black text-white pb-20 overflow-x-hidden ${montserrat.className}`}>
      
      {/* --- HERO HEADER --- */}
      <div className="relative h-64 w-full">
        <Image src="/cotizatuevento.jpeg" alt="Eventos" fill className="object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/70 to-black" />
        
        <div className="absolute top-6 left-6 z-10">
            <Link href="/" className="p-2 bg-black/50 backdrop-blur-md rounded-full border border-white/10 hover:bg-black/80 transition-colors inline-block">
                <ArrowLeft className="w-6 h-6 text-white" />
            </Link>
        </div>
        
        {/* TITULO CENTRADO CON MÁS ESPACIO ABAJO (mb-8) */}
        <div className="absolute bottom-8 left-0 right-0 z-10 text-center flex flex-col items-center">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-center gap-2 mb-2">
                <PartyPopper className="w-5 h-5 text-[#DAA520]" />
                <span className="text-xs font-bold text-[#DAA520] uppercase tracking-[0.2em]">Celebraciones</span>
            </motion.div>
            <h1 className="text-3xl font-bold uppercase tracking-wide text-white drop-shadow-lg leading-none">Diseña tu<br/>Experiencia</h1>
        </div>
      </div>

      {/* --- CONTENEDOR PRINCIPAL --- */}
      <div className="px-6 -mt-6 relative z-20">
        <div className="w-full max-w-lg mx-auto bg-zinc-900 border border-white/10 rounded-3xl p-6 shadow-2xl min-h-[500px] flex flex-col">
            
            {/* BARRA DE PROGRESO */}
            <div className="flex items-center justify-between mb-8">
                {[1, 2, 3, 4].map((s) => (
                    <div key={s} className="flex flex-col items-center gap-1 w-full">
                        <div className={`h-1 w-full rounded-full transition-all duration-500 ${s <= step ? 'bg-[#DAA520]' : 'bg-zinc-800'}`} />
                        <span className={`text-[9px] font-bold uppercase tracking-wider ${s === step ? 'text-[#DAA520]' : 'text-zinc-600'}`}>
                            {s === 1 ? 'Datos' : s === 2 ? 'Zona' : s === 3 ? 'Menú' : 'Final'}
                        </span>
                    </div>
                ))}
            </div>

            {/* CONTENIDO DEL WIZARD */}
            <div className="flex-1 relative">
                <AnimatePresence custom={step} mode="wait">
                    
                    {/* PASO 1: DETALLES GENERALES */}
                    {step === 1 && (
                        <motion.div 
                            key="step1"
                            custom={step}
                            variants={slideVariants}
                            initial="enter" animate="center" exit="exit"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="space-y-5"
                        >
                            <h2 className="text-xl font-medium text-white mb-4">¿Qué vamos a celebrar?</h2>
                            
                            <div className="grid grid-cols-2 gap-3">
                                {EVENT_TYPES.map(type => (
                                    <button 
                                        key={type}
                                        onClick={() => setFormData({...formData, eventType: type})}
                                        className={`p-3 rounded-xl border text-xs font-medium transition-all ${formData.eventType === type ? 'bg-[#DAA520] border-[#DAA520] text-black font-bold' : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'}`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider flex items-center gap-1"><Users className="w-3 h-3"/> Personas</label>
                                    <input 
                                        type="number" 
                                        value={formData.guests}
                                        onChange={(e) => setFormData({...formData, guests: e.target.value})}
                                        placeholder="Ej: 40" 
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-[#DAA520] outline-none" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider flex items-center gap-1"><Calendar className="w-3 h-3"/> Fecha</label>
                                    <input 
                                        type="date" 
                                        value={formData.date}
                                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-[#DAA520] outline-none appearance-none" 
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider flex items-center gap-1"><Clock className="w-3 h-3"/> Hora de inicio</label>
                                <input 
                                    type="time" 
                                    value={formData.time}
                                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-[#DAA520] outline-none" 
                                />
                            </div>
                        </motion.div>
                    )}

                    {/* PASO 2: ZONAS */}
                    {step === 2 && (
                        <motion.div 
                            key="step2"
                            custom={step}
                            variants={slideVariants}
                            initial="enter" animate="center" exit="exit"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="space-y-4"
                        >
                            <h2 className="text-xl font-medium text-white mb-4">Elige tu ambiente ideal</h2>
                            <p className="text-xs text-zinc-400 -mt-3 mb-4">Selecciona la zona donde te gustaría realizar el evento.</p>

                            <div className="space-y-3">
                                {ZONES.map(zone => (
                                    <button
                                        key={zone.id}
                                        onClick={() => setFormData({...formData, zone: zone.id})}
                                        className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${formData.zone === zone.id ? 'bg-[#DAA520]/20 border-[#DAA520]' : 'bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800'}`}
                                    >
                                        <div className="text-left">
                                            <span className={`block text-sm font-bold ${formData.zone === zone.id ? 'text-[#DAA520]' : 'text-white'}`}>{zone.label}</span>
                                            <span className="block text-[10px] text-zinc-400 mt-0.5">{zone.desc}</span>
                                        </div>
                                        {formData.zone === zone.id && <div className="w-5 h-5 bg-[#DAA520] rounded-full flex items-center justify-center"><Check className="w-3 h-3 text-black" /></div>}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* PASO 3: GASTRONOMÍA */}
                    {step === 3 && (
                        <motion.div 
                            key="step3"
                            custom={step}
                            variants={slideVariants}
                            initial="enter" animate="center" exit="exit"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="space-y-5"
                        >
                            <h2 className="text-xl font-medium text-white mb-2">Experiencia Gastronómica</h2>
                            
                            {/* LINK A LA CARTA */}
                            <div className="bg-zinc-800/50 p-4 rounded-xl border border-white/5 flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-500/20 rounded-lg"><Utensils className="w-4 h-4 text-orange-500"/></div>
                                    <p className="text-xs text-zinc-300">¿Dudas con la comida?</p>
                                </div>
                                <Link href="/carta" target="_blank" className="text-[10px] font-bold uppercase text-[#DAA520] border border-[#DAA520] px-3 py-1.5 rounded-full hover:bg-[#DAA520] hover:text-black transition-colors">
                                    Ver Carta
                                </Link>
                            </div>

                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Preferencias (Selecciona varias)</p>
                            <div className="grid grid-cols-1 gap-3">
                                {FOOD_OPTIONS.map(opt => (
                                    <button
                                        key={opt.id}
                                        onClick={() => handleFoodToggle(opt.id)}
                                        className={`w-full flex items-center p-3 rounded-xl border transition-all text-left ${formData.food.includes(opt.id) ? 'bg-white/10 border-white text-white' : 'bg-transparent border-zinc-700 text-zinc-400'}`}
                                    >
                                        <div className={`w-4 h-4 rounded border mr-3 flex items-center justify-center ${formData.food.includes(opt.id) ? 'bg-white border-white' : 'border-zinc-600'}`}>
                                            {formData.food.includes(opt.id) && <Check className="w-3 h-3 text-black" />}
                                        </div>
                                        <span className="text-sm">{opt.label}</span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* PASO 4: CONTACTO */}
                    {step === 4 && (
                        <motion.div 
                            key="step4"
                            custom={step}
                            variants={slideVariants}
                            initial="enter" animate="center" exit="exit"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="space-y-4"
                        >
                            <h2 className="text-xl font-medium text-white mb-4">Últimos detalles</h2>
                            
                            <div className="space-y-3">
                                <input 
                                    type="text" 
                                    placeholder="Nombre Completo"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-[#DAA520] outline-none" 
                                />
                                <input 
                                    type="email" 
                                    placeholder="Correo Electrónico" 
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-[#DAA520] outline-none" 
                                />
                                <input 
                                    type="tel" 
                                    placeholder="Teléfono / WhatsApp" 
                                    value={formData.phone}
                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-[#DAA520] outline-none" 
                                />
                                <textarea 
                                    rows={3} 
                                    placeholder="Comentarios adicionales (Decoración, DJ, Alergias...)" 
                                    value={formData.details}
                                    onChange={(e) => setFormData({...formData, details: e.target.value})}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-[#DAA520] outline-none resize-none"
                                ></textarea>
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>

            {/* BOTONES DE NAVEGACIÓN */}
            <div className="flex gap-3 mt-8">
                {step > 1 && (
                    <button 
                        onClick={prevStep}
                        className="px-4 py-3 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                )}
                
                {step < totalSteps ? (
                    <button 
                        onClick={nextStep}
                        className="flex-1 bg-white text-black font-bold uppercase tracking-widest py-3 rounded-xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
                    >
                        Siguiente <ChevronRight className="w-4 h-4" />
                    </button>
                ) : (
                    <button 
                        className="flex-1 bg-gradient-to-r from-[#DAA520] to-[#B8860B] text-black font-bold uppercase tracking-widest py-3 rounded-xl hover:brightness-110 transition-all shadow-[0_0_20px_rgba(184,134,11,0.4)] flex items-center justify-center gap-2"
                    >
                        Solicitar Cotización <FileText className="w-4 h-4" />
                    </button>
                )}
            </div>

        </div>
      </div>
    </main>
  );
}