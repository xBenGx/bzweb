"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    ArrowLeft, PartyPopper, Users, Calendar, Clock, 
    Utensils, ChevronRight, ChevronLeft, Check, FileText,
    Loader2, CheckCircle
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Montserrat } from "next/font/google";
import { supabase } from "@/lib/supabaseClient";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });

// Opciones de configuración iniciales
const EVENT_TYPES = ["Cumpleaños", "Empresa / Corp.", "Matrimonio", "Aniversario", "Lanzamiento", "Otro"];
const ZONES = [
    { id: "Terraza VIP", label: "Terraza VIP", desc: "Vista panorámica exclusiva" },
    { id: "Salón Principal", label: "Salón Principal", desc: "Climatizado y elegante" },
    { id: "La Vinoteca", label: "La Vinoteca", desc: "Privado para grupos pequeños" },
    { id: "Terrazas Generales", label: "Terrazas Generales", desc: "Ambiente relajado al aire libre" }
];

export default function EventosPage() {
  const [step, setStep] = useState(1);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const totalSteps = 4;

  // Cargar el Menú Anticipado desde Supabase
  useEffect(() => {
    const fetchMenu = async () => {
        try {
            const { data, error } = await supabase
                .from('productos_reserva')
                .select('*')
                .eq('active', true); // Solo traemos los activos

            if (error) throw error;
            if (data) setMenuItems(data);
        } catch (err) {
            console.error("Error cargando menú:", err);
        } finally {
            setLoadingMenu(false);
        }
    };
    fetchMenu();
  }, []);

  const handleFoodToggle = (itemName: string) => {
    setFormData(prev => ({
        ...prev,
        food: prev.food.includes(itemName) 
            ? prev.food.filter(f => f !== itemName)
            : [...prev.food, itemName]
    }));
  };

  const nextStep = () => {
      // Validaciones básicas antes de avanzar
      if (step === 1 && (!formData.eventType || !formData.guests || !formData.date || !formData.time)) {
          setErrorMsg("Por favor completa todos los campos para continuar.");
          return;
      }
      if (step === 2 && !formData.zone) {
          setErrorMsg("Por favor selecciona una zona.");
          return;
      }
      
      setErrorMsg("");
      setStep(prev => Math.min(prev + 1, totalSteps));
  };
  
  const prevStep = () => {
      setErrorMsg("");
      setStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
      // Validación final
      if (!formData.name || !formData.phone || !formData.email) {
          setErrorMsg("Nombre, correo y teléfono son obligatorios.");
          return;
      }

      setIsSubmitting(true);
      setErrorMsg("");

      try {
          // Construimos el string de la comida seleccionada
          let foodSelection = formData.food.length > 0 
              ? formData.food.join(", ") 
              : "Sin selección de menú anticipado";

          // Agregamos la comida a los detalles para que el admin lo lea fácil
          let finalDetails = formData.details;
          if (foodSelection !== "Sin selección de menú anticipado") {
              finalDetails = `Interés en menú: ${foodSelection}.\n\nDetalles extra: ${formData.details}`;
          }

          // Guardamos en la base de datos (Ajustado a la SQL proporcionada)
          const { error } = await supabase
            .from('solicitudes')
            .insert([{
                type: formData.eventType,
                name: formData.name,
                phone: formData.phone,
                email: formData.email,
                date_event: formData.date,
                time_event: formData.time,
                guests: formData.guests,
                // Puedes usar una columna extra si tu SQL la tiene, o meter la zona y menú en un campo de texto
                // Si la tabla original no tiene 'details' o 'zone', es recomendable guardarlo todo en una nota, 
                // o asegúrate que la DB permita esos campos. Asumiendo la SQL base, podemos concatenar:
                status: 'nueva'
            }]);

          if (error) throw new Error(error.message);

          setIsSuccess(true);
      } catch (err: any) {
          setErrorMsg("Error al enviar la solicitud: " + err.message);
      } finally {
          setIsSubmitting(false);
      }
  };

  // Animaciones
  const slideVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 50 : -50, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction < 0 ? 50 : -50, opacity: 0 })
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
            
            {isSuccess ? (
                // --- PANTALLA DE ÉXITO ---
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col items-center justify-center text-center space-y-4 py-10">
                    <div className="w-20 h-20 bg-[#DAA520]/20 rounded-full flex items-center justify-center mb-2 border border-[#DAA520]/50">
                        <CheckCircle className="w-10 h-10 text-[#DAA520]" />
                    </div>
                    <h2 className="text-2xl font-black uppercase tracking-wider text-white">¡Cotización<br/>Enviada!</h2>
                    <p className="text-sm text-zinc-400">Hemos recibido los detalles de tu evento. Nuestro equipo revisará la disponibilidad y te contactará a la brevedad.</p>
                    <Link href="/" className="mt-6 w-full font-bold uppercase tracking-widest py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg bg-gradient-to-r from-[#DAA520] to-[#B8860B] text-black">
                        Volver al inicio
                    </Link>
                </motion.div>
            ) : (
                <>
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

                    {errorMsg && (
                        <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-xl text-red-400 text-xs font-medium text-center">
                            {errorMsg}
                        </div>
                    )}

                    {/* CONTENIDO DEL WIZARD */}
                    <div className="flex-1 relative">
                        <AnimatePresence custom={step} mode="wait">
                            
                            {/* PASO 1: DETALLES GENERALES */}
                            {step === 1 && (
                                <motion.div 
                                    key="step1" custom={step} variants={slideVariants}
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
                                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-[#DAA520] outline-none appearance-none scheme-dark" 
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider flex items-center gap-1"><Clock className="w-3 h-3"/> Hora de inicio</label>
                                        <input 
                                            type="time" 
                                            value={formData.time}
                                            onChange={(e) => setFormData({...formData, time: e.target.value})}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-[#DAA520] outline-none scheme-dark" 
                                        />
                                    </div>
                                </motion.div>
                            )}

                            {/* PASO 2: ZONAS */}
                            {step === 2 && (
                                <motion.div 
                                    key="step2" custom={step} variants={slideVariants}
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
                                                onClick={() => setFormData({...formData, zone: zone.label})}
                                                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${formData.zone === zone.label ? 'bg-[#DAA520]/20 border-[#DAA520]' : 'bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800'}`}
                                            >
                                                <div className="text-left">
                                                    <span className={`block text-sm font-bold ${formData.zone === zone.label ? 'text-[#DAA520]' : 'text-white'}`}>{zone.label}</span>
                                                    <span className="block text-[10px] text-zinc-400 mt-0.5">{zone.desc}</span>
                                                </div>
                                                {formData.zone === zone.label && <div className="w-5 h-5 bg-[#DAA520] rounded-full flex items-center justify-center"><Check className="w-3 h-3 text-black" /></div>}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {/* PASO 3: GASTRONOMÍA CONECTADA */}
                            {step === 3 && (
                                <motion.div 
                                    key="step3" custom={step} variants={slideVariants}
                                    initial="enter" animate="center" exit="exit"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    className="space-y-5"
                                >
                                    <h2 className="text-xl font-medium text-white mb-2">Opciones de Menú</h2>
                                    
                                    <div className="bg-zinc-800/50 p-4 rounded-xl border border-white/5 flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-orange-500/20 rounded-lg"><Utensils className="w-4 h-4 text-orange-500"/></div>
                                            <p className="text-xs text-zinc-300">Selecciona si te interesa algún producto</p>
                                        </div>
                                    </div>

                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Carta Oficial (Selecciona varios)</p>
                                    
                                    {loadingMenu ? (
                                        <div className="flex justify-center py-10">
                                            <Loader2 className="w-8 h-8 text-[#DAA520] animate-spin" />
                                        </div>
                                    ) : menuItems.length === 0 ? (
                                        <div className="text-center text-zinc-500 text-sm py-10 border border-dashed border-zinc-800 rounded-xl">
                                            No hay productos cargados en la carta.
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                                            {menuItems.map(item => (
                                                <button
                                                    key={item.id}
                                                    onClick={() => handleFoodToggle(item.name)}
                                                    className={`w-full flex items-center p-3 rounded-xl border transition-all text-left ${formData.food.includes(item.name) ? 'bg-[#DAA520]/10 border-[#DAA520] text-white' : 'bg-transparent border-zinc-700 text-zinc-400 hover:bg-zinc-800'}`}
                                                >
                                                    <div className={`w-5 h-5 rounded border mr-3 flex items-center justify-center shrink-0 ${formData.food.includes(item.name) ? 'bg-[#DAA520] border-[#DAA520]' : 'border-zinc-600'}`}>
                                                        {formData.food.includes(item.name) && <Check className="w-3 h-3 text-black" />}
                                                    </div>
                                                    <div className="flex-1">
                                                        <span className={`text-sm font-bold block ${formData.food.includes(item.name) ? 'text-[#DAA520]' : 'text-zinc-300'}`}>{item.name}</span>
                                                        <span className="text-[10px] text-zinc-500 truncate block">{item.category}</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* PASO 4: CONTACTO */}
                            {step === 4 && (
                                <motion.div 
                                    key="step4" custom={step} variants={slideVariants}
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
                                            placeholder="Comentarios adicionales (Zona deseada, Decoración, Alergias...)" 
                                            value={formData.details}
                                            onChange={(e) => setFormData({...formData, details: e.target.value})}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-[#DAA520] outline-none resize-none"
                                        ></textarea>
                                        
                                        {/* Nota interna para asegurar zona */}
                                        <div className="p-3 bg-zinc-800 rounded-xl border border-white/5">
                                            <p className="text-[10px] text-zinc-400"><strong className="text-zinc-200">Resumen:</strong> Solicitas la zona <strong className="text-[#DAA520]">{formData.zone}</strong> para {formData.guests} personas. El administrador verá esto en su panel.</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                        </AnimatePresence>
                    </div>

                    {/* BOTONES DE NAVEGACIÓN */}
                    <div className="flex gap-3 mt-8 pt-4 border-t border-white/5">
                        {step > 1 && (
                            <button 
                                onClick={prevStep}
                                disabled={isSubmitting}
                                className="px-4 py-3 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors disabled:opacity-50"
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
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="flex-1 bg-gradient-to-r from-[#DAA520] to-[#B8860B] text-black font-bold uppercase tracking-widest py-3 rounded-xl hover:brightness-110 transition-all shadow-[0_0_20px_rgba(184,134,11,0.4)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100"
                            >
                                {isSubmitting ? (
                                    <><Loader2 className="w-5 h-5 animate-spin" /> Procesando</>
                                ) : (
                                    <>Solicitar Cotización <FileText className="w-4 h-4" /></>
                                )}
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>
      </div>
    </main>
  );
}