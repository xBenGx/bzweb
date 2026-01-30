"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Users, ChevronRight, ChevronLeft, 
  CheckCircle, Calendar, Clock, AlertTriangle, 
  Armchair, Cigarette, CigaretteOff, Loader2, User, Mail, Phone, 
  ShoppingBag, Plus, Minus, X, Utensils
} from "lucide-react";
import Link from "next/link";
import Image from "next/image"; // Importante para las imágenes 1080x1080
import { Montserrat } from "next/font/google";
import { supabase } from "@/lib/supabaseClient"; 

const montserrat = Montserrat({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });

// --- INTERFACES ---
interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
}

interface CartItem extends Product {
  quantity: number;
}

// --- 1. CONFIGURACIÓN DE ZONAS ---
const ZONES = [
    { 
        id: "salon", 
        name: "Salón Principal", 
        desc: "Ambiente climatizado y elegante.", 
        capacity: 56, 
        tables: 14,
        type: "No Fumador",
        icon: Armchair 
    },
    { 
        id: "vinoteca", 
        name: "La Vinoteca", 
        desc: "Espacio privado e íntimo.", 
        capacity: 12, 
        tables: 3,
        type: "No Fumador",
        icon: Users 
    },
    { 
        id: "vip", 
        name: "Terraza VIP", 
        desc: "Zona exclusiva con vista privilegiada.", 
        capacity: 60, 
        tables: 15,
        type: "Premium",
        icon: CheckCircle 
    },
    { 
        id: "lat_izq", 
        name: "Terraza Lateral Izq.", 
        desc: "Sector tranquilo al aire libre.", 
        capacity: 60, 
        tables: 15,
        type: "No Fumador",
        icon: CigaretteOff 
    },
    { 
        id: "lat_der", 
        name: "Terraza Lateral Der.", 
        desc: "Ambiente relajado.", 
        capacity: 40, 
        tables: 10,
        type: "Fumador",
        icon: Cigarette 
    },
    { 
        id: "terraza1", 
        name: "Terraza 1", 
        desc: "Anexa al lateral izquierdo.", 
        capacity: 30, 
        tables: 8,
        type: "No Fumador",
        icon: CigaretteOff 
    },
    { 
        id: "terraza2", 
        name: "Terraza 2", 
        desc: "Zona amplia para grupos.", 
        capacity: 40, 
        tables: 10,
        type: "Fumador",
        icon: Cigarette 
    }
];

// --- 2. GENERADOR DE HORARIOS ---
const generateTimeSlots = () => {
    const times = [];
    let startHour = 12; 
    let endHour = 23;   
    
    for (let h = startHour; h <= endHour; h++) {
        for (let m = 0; m < 60; m += 15) {
            if (h === 12 && m < 30) continue; 
            const hourStr = h.toString().padStart(2, '0');
            const minStr = m.toString().padStart(2, '0');
            times.push(`${hourStr}:${minStr}`);
        }
    }
    return times;
};

const TIME_SLOTS = generateTimeSlots();
const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

// --- DATOS DE EJEMPLO POR SI FALLA LA DB (FALLBACK) ---
const MOCK_PRODUCTS: Product[] = [
  { id: 1, name: "Tabla de Quesos", description: "Selección de quesos premium, frutos secos y miel.", price: 18990, category: "Tablas", image_url: "https://images.unsplash.com/photo-1631379578550-7038263db699?q=80&w=1000&auto=format&fit=crop" },
  { id: 2, name: "Ceviche Mixto", description: "Pescado del día, camarones, leche de tigre y maíz.", price: 14500, category: "Entradas", image_url: "https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?q=80&w=1000&auto=format&fit=crop" },
  { id: 3, name: "Pisco Sour Catedral", description: "Nuestra receta secreta, doble medida.", price: 7900, category: "Tragos", image_url: "https://images.unsplash.com/photo-1510626176961-4b57d4fbad03?q=80&w=1000&auto=format&fit=crop" },
  { id: 4, name: "Limonada Menta Jengibre", description: "Refrescante y natural.", price: 4500, category: "Bebidas", image_url: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=1000&auto=format&fit=crop" },
];

export default function BookingPage() {
  const [step, setStep] = useState(1);
  
  // Datos de la reserva
  const [guests, setGuests] = useState(2);
  const [selectedDate, setSelectedDate] = useState<number>(new Date().getDate());
  const [time, setTime] = useState("");
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  
  // Datos del Cliente
  const [userData, setUserData] = useState({ name: "", email: "", phone: "" });

  // Estado de envío y Reserva
  const [bookingCode, setBookingCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // --- NUEVO: ESTADOS PARA EL MENÚ PRE-ORDER ---
  const [showMenu, setShowMenu] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);

  const currentMonth = MONTHS[new Date().getMonth()];
  const currentYear = new Date().getFullYear();
  const daysInMonth = new Date(currentYear, new Date().getMonth() + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Navegación
  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  // --- EFECTO: CARGAR PRODUCTOS AL ENTRAR AL PASO 4 O AL ABRIR MENU ---
  useEffect(() => {
    const fetchProducts = async () => {
        // Intentamos cargar de Supabase
        const { data, error } = await supabase
            .from('productos_reserva') // Asegúrate de crear esta tabla
            .select('*')
            .eq('active', true);
        
        if (!error && data && data.length > 0) {
            setProducts(data);
        } else {
            // Si no hay tabla o datos, usamos los Mock para que se vea el diseño
            setProducts(MOCK_PRODUCTS); 
        }
    };
    
    fetchProducts();
  }, []);

  // --- LÓGICA DEL CARRITO ---
  const addToCart = (product: Product) => {
    setCart(prev => {
        const existing = prev.find(item => item.id === product.id);
        if (existing) {
            return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
        }
        return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => {
        const existing = prev.find(item => item.id === productId);
        if (existing && existing.quantity > 1) {
            return prev.map(item => item.id === productId ? { ...item, quantity: item.quantity - 1 } : item);
        }
        return prev.filter(item => item.id !== productId);
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // --- GUARDAR RESERVA ---
  const handleConfirmReservation = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      
      const generatedCode = `BZ-${Math.floor(1000 + Math.random() * 9000)}`;
      const zoneDetails = ZONES.find(z => z.id === selectedZone);

      try {
          const { error } = await supabase.from('reservas').insert([{
              name: userData.name,
              email: userData.email,
              phone: userData.phone,
              date_reserva: `${selectedDate} de ${currentMonth}`,
              time_reserva: time,
              guests: guests,
              zone: zoneDetails?.name || "Zona General",
              code: generatedCode,
              status: 'pendiente'
          }]);

          if (error) throw error;

          setBookingCode(generatedCode);
          setStep(4); // Ir al ticket final

      } catch (error) {
          console.error("Error reservando:", error);
          alert("Hubo un problema al procesar tu reserva.");
      } finally {
          setIsSubmitting(false);
      }
  };

  // --- GUARDAR PEDIDO PREVIO ---
  const handleSubmitOrder = async () => {
    if (cart.length === 0) return;
    setIsOrdering(true);

    try {
        // Actualizamos la reserva existente con el pedido
        // Asegúrate de tener una columna 'pre_order' de tipo JSONB en tu tabla 'reservas'
        const { error } = await supabase
            .from('reservas')
            .update({ 
                pre_order: cart,
                total_pre_order: cartTotal
            })
            .eq('code', bookingCode);

        if (error) throw error;

        setOrderConfirmed(true);
        setTimeout(() => {
            setShowMenu(false);
            setCart([]); // Limpiar carrito tras éxito
        }, 2000);

    } catch (error) {
        console.error("Error al guardar pedido:", error);
        alert("No se pudo guardar el pedido. Intenta nuevamente.");
    } finally {
        setIsOrdering(false);
    }
  };

  // Animaciones
  const slideVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 20 : -20, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction < 0 ? 20 : -20, opacity: 0 })
  };

  return (
    <main className={`min-h-screen bg-black text-white pb-20 relative overflow-x-hidden ${montserrat.className}`}>
      
      {/* FONDO DECORATIVO */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#DAA520]/10 rounded-full blur-[120px]" />
         <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-red-900/10 rounded-full blur-[100px]" />
      </div>

      {/* --- HEADER --- */}
      <div className="relative h-64 w-full flex flex-col justify-between p-6 z-10">
        
        {/* Botón Atrás */}
        <div className="absolute top-6 left-6 z-20">
            <Link href="/" className="p-3 bg-black/50 backdrop-blur-md rounded-full border border-white/10 hover:bg-black/80 transition-colors inline-block">
                <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
        </div>

        {/* TÍTULO */}
        <div className="absolute bottom-4 left-0 right-0 z-10 text-center flex flex-col items-center">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-[#DAA520]" />
                <span className="text-xs font-bold text-[#DAA520] uppercase tracking-[0.2em]">Reservas Online</span>
            </motion.div>
            <h1 className="text-3xl font-bold uppercase tracking-wide text-white drop-shadow-lg leading-none">Asegura tu<br/>Mesa</h1>
        </div>
      </div>

      {/* --- CONTENEDOR PRINCIPAL --- */}
      <div className="relative z-20 px-4 -mt-4 max-w-lg mx-auto">
        <AnimatePresence custom={step} mode="wait">
          
          {/* PASO 1: DATOS BÁSICOS (Fecha, Hora, Pax) */}
          {step === 1 && (
            <motion.div 
              key="step1"
              custom={step}
              variants={slideVariants}
              initial="enter" animate="center" exit="exit"
              className="space-y-6"
            >
              {/* Selector de Personas */}
              <div className="bg-zinc-900 border border-white/10 rounded-2xl p-5 flex items-center justify-between shadow-lg">
                 <div className="flex items-center gap-4">
                    <div className="bg-[#DAA520]/20 p-3 rounded-xl"><Users className="w-5 h-5 text-[#DAA520]"/></div>
                    <div>
                        <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Mesa Para</p>
                        <p className="text-lg font-bold text-white">{guests} Personas</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-2 bg-black rounded-xl p-1.5 border border-white/10">
                    <button onClick={() => setGuests(Math.max(1, guests - 1))} className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors font-bold text-lg">-</button>
                    <button onClick={() => setGuests(guests + 1)} className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors font-bold text-lg">+</button>
                 </div>
              </div>

              {/* Calendario */}
              <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6 shadow-lg">
                 <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-white">{currentMonth} {currentYear}</h3>
                    <div className="flex gap-1">
                        <button className="p-1 hover:bg-white/10 rounded"><ChevronLeft className="w-5 h-5 text-zinc-500" /></button>
                        <button className="p-1 hover:bg-white/10 rounded"><ChevronRight className="w-5 h-5 text-white" /></button>
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-7 text-center mb-3">
                    {['L','M','M','J','V','S','D'].map((d, i) => (
                        <span key={i} className="text-[10px] font-bold text-zinc-600">{d}</span>
                    ))}
                 </div>

                 <div className="grid grid-cols-7 gap-y-3 gap-x-1">
                    {[1,2,3].map(i => <div key={`empty-${i}`} />)}
                    {days.map(d => (
                        <button 
                            key={d}
                            onClick={() => setSelectedDate(d)}
                            className={`
                                h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold transition-all relative
                                ${selectedDate === d 
                                    ? 'bg-[#DAA520] text-black shadow-[0_0_15px_rgba(218,165,32,0.4)] scale-110 z-10' 
                                    : 'text-zinc-400 hover:bg-white/5 hover:text-white'}
                            `}
                        >
                            {d}
                        </button>
                    ))}
                 </div>
              </div>

              {/* Horarios (Grid de 15 mins) */}
              <div>
                  <p className="text-[10px] text-zinc-500 uppercase font-bold mb-3 tracking-widest pl-2">Horarios Disponibles</p>
                  <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {TIME_SLOTS.map(t => (
                        <button 
                            key={t} 
                            onClick={() => setTime(t)}
                            className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${time === t ? 'bg-white text-black border-white shadow-md' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white'}`}
                        >
                            {t}
                        </button>
                    ))}
                  </div>
              </div>

              <button 
                onClick={nextStep} 
                disabled={!selectedDate || !time}
                className="w-full bg-[#DAA520] text-black font-bold uppercase tracking-widest py-4 rounded-xl mt-4 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(218,165,32,0.3)] hover:bg-[#B8860B] transition-all flex items-center justify-center gap-2"
              >
                Elegir Zona <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* PASO 2: ZONAS */}
          {step === 2 && (
            <motion.div 
                key="step2"
                custom={step}
                variants={slideVariants}
                initial="enter" animate="center" exit="exit"
                className="space-y-4"
            >
                <div className="text-center mb-6">
                    <h2 className="text-xl font-bold text-white uppercase">Elige tu Ambiente</h2>
                    <p className="text-xs text-zinc-500 mt-1">Capacidad según aforo actual</p>
                </div>

                <div className="grid gap-3 pb-24">
                    {ZONES.map((zone) => (
                        <button
                            key={zone.id}
                            onClick={() => setSelectedZone(zone.id)}
                            className={`
                                relative p-4 rounded-2xl border text-left transition-all flex items-center gap-4 group
                                ${selectedZone === zone.id 
                                    ? "bg-zinc-900 border-[#DAA520] shadow-[0_0_20px_rgba(218,165,32,0.15)]" 
                                    : "bg-zinc-900/50 border-white/5 hover:bg-zinc-800"}
                            `}
                        >
                            {selectedZone === zone.id && (
                                <div className="absolute top-3 right-3 text-[#DAA520]">
                                    <CheckCircle className="w-5 h-5 fill-[#DAA520] text-black" />
                                </div>
                            )}
                            
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${selectedZone === zone.id ? 'bg-[#DAA520] text-black' : 'bg-black text-zinc-600'}`}>
                                <zone.icon className="w-5 h-5" />
                            </div>

                            <div className="flex-1 pr-6">
                                <div className="flex justify-between items-center">
                                    <h3 className={`font-bold text-xs uppercase ${selectedZone === zone.id ? 'text-white' : 'text-zinc-300'}`}>{zone.name}</h3>
                                    <span className="text-[9px] text-zinc-500 font-medium">Cap: {zone.capacity}p</span>
                                </div>
                                <p className="text-[10px] text-zinc-500 mt-0.5">{zone.desc}</p>
                                <div className="mt-2 flex gap-2">
                                    <span className={`text-[9px] px-2 py-0.5 rounded uppercase tracking-wider ${zone.type === 'Fumador' ? 'bg-red-900/30 text-red-400' : 'bg-green-900/30 text-green-400'}`}>
                                        {zone.type}
                                    </span>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                <div className="fixed bottom-0 left-0 w-full p-4 bg-zinc-900 border-t border-white/10 flex gap-3 z-30 safe-area-bottom">
                    <button onClick={prevStep} className="w-14 h-14 rounded-xl bg-black border border-white/10 flex items-center justify-center text-white hover:bg-zinc-800"><ArrowLeft/></button>
                    <button onClick={nextStep} disabled={!selectedZone} className="flex-1 bg-[#DAA520] text-black font-bold uppercase tracking-widest rounded-xl disabled:opacity-50 hover:bg-[#B8860B] transition-colors">
                        Continuar
                    </button>
                </div>
            </motion.div>
          )}

          {/* PASO 3: FORMULARIO */}
          {step === 3 && (
            <motion.div 
                key="step3"
                custom={step}
                variants={slideVariants}
                initial="enter" animate="center" exit="exit"
            >
                 <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6 shadow-lg mb-6">
                      <div className="text-center mb-6">
                         <h3 className="text-lg font-bold text-white uppercase tracking-wide">Tus Datos</h3>
                         <p className="text-xs text-zinc-500">Necesarios para confirmar tu reserva.</p>
                      </div>
                      
                      <form onSubmit={handleConfirmReservation} className="space-y-4">
                          {/* Nombre */}
                          <div>
                              <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 ml-1">Nombre Completo</label>
                              <div className="relative">
                                 <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"/>
                                 <input 
                                     required 
                                     type="text" 
                                     placeholder="Ej: Juan Pérez"
                                     className="w-full bg-black/50 border border-zinc-700 rounded-xl p-3 pl-10 text-white text-sm focus:border-[#DAA520] focus:ring-1 focus:ring-[#DAA520] outline-none transition-all placeholder:text-zinc-600" 
                                     value={userData.name} 
                                     onChange={e => setUserData({...userData, name: e.target.value})} 
                                 />
                              </div>
                          </div>

                          {/* Email */}
                          <div>
                              <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 ml-1">Correo Electrónico</label>
                              <div className="relative">
                                 <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"/>
                                 <input 
                                     required 
                                     type="email" 
                                     placeholder="tucorreo@ejemplo.com"
                                     className="w-full bg-black/50 border border-zinc-700 rounded-xl p-3 pl-10 text-white text-sm focus:border-[#DAA520] focus:ring-1 focus:ring-[#DAA520] outline-none transition-all placeholder:text-zinc-600" 
                                     value={userData.email} 
                                     onChange={e => setUserData({...userData, email: e.target.value})} 
                                 />
                              </div>
                          </div>

                          {/* Teléfono */}
                          <div>
                              <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 ml-1">Teléfono</label>
                              <div className="relative">
                                 <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"/>
                                 <input 
                                     required 
                                     type="tel" 
                                     placeholder="+569 1234 5678"
                                     className="w-full bg-black/50 border border-zinc-700 rounded-xl p-3 pl-10 text-white text-sm focus:border-[#DAA520] focus:ring-1 focus:ring-[#DAA520] outline-none transition-all placeholder:text-zinc-600" 
                                     value={userData.phone} 
                                     onChange={e => setUserData({...userData, phone: e.target.value})} 
                                 />
                              </div>
                          </div>

                          <div className="pt-4">
                              <button 
                                 type="submit" 
                                 disabled={isSubmitting} 
                                 className="w-full bg-[#DAA520] text-black font-bold uppercase tracking-widest py-4 rounded-xl hover:bg-[#B8860B] transition-colors flex items-center justify-center gap-2 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                              >
                                  {isSubmitting ? (
                                      <>
                                          <Loader2 className="animate-spin w-5 h-5"/> Procesando...
                                      </>
                                  ) : (
                                      "Finalizar Reserva"
                                  )}
                              </button>
                          </div>
                      </form>
                 </div>
                 
                 <button onClick={prevStep} className="w-full py-3 text-xs font-bold text-zinc-500 uppercase hover:text-white transition-colors">
                    Volver Atrás
                 </button>
            </motion.div>
          )}

          {/* PASO 4: TICKET DE CONFIRMACIÓN + MENÚ EXPRESS */}
          {step === 4 && (
             <motion.div 
                key="step4" 
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                className="pt-2 flex flex-col items-center pb-24"
             >
                <div className="w-full bg-white text-black rounded-3xl overflow-hidden shadow-2xl relative max-w-sm mb-6">
                    {/* Header Ticket */}
                    <div className="bg-black p-8 text-center relative border-b-4 border-[#DAA520]">
                        <div className="absolute top-[-50%] left-1/2 -translate-x-1/2 w-40 h-40 bg-[#DAA520]/30 rounded-full blur-3xl" />
                        <CheckCircle className="w-12 h-12 text-[#DAA520] mx-auto mb-3 relative z-10" />
                        <h2 className="text-white font-black text-2xl uppercase tracking-widest relative z-10">Reserva Lista</h2>
                        <p className="text-zinc-400 text-[10px] uppercase tracking-[0.3em] mt-1 relative z-10">Te esperamos en BZ</p>
                    </div>

                    {/* Body Ticket */}
                    <div className="p-6 relative bg-zinc-50">
                        {/* Muecas del ticket */}
                        <div className="absolute top-[-10px] left-[-10px] w-5 h-5 bg-black rounded-full" />
                        <div className="absolute top-[-10px] right-[-10px] w-5 h-5 bg-black rounded-full" />

                        <div className="text-center mb-8">
                            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-2">Tu Código de Reserva</p>
                            <div className="text-4xl font-black text-black tracking-wider font-mono bg-white border-2 border-dashed border-zinc-200 py-3 rounded-xl select-all">
                                {bookingCode}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b border-zinc-200 pb-3">
                                <span className="text-xs font-bold text-zinc-400 uppercase">Fecha</span>
                                <span className="text-sm font-bold text-black flex items-center gap-2"><Calendar className="w-3 h-3"/> {selectedDate} de {currentMonth}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-zinc-200 pb-3">
                                <span className="text-xs font-bold text-zinc-400 uppercase">Hora</span>
                                <span className="text-sm font-bold text-black flex items-center gap-2"><Clock className="w-3 h-3"/> {time} hrs</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-zinc-200 pb-3">
                                <span className="text-xs font-bold text-zinc-400 uppercase">Mesa</span>
                                <span className="text-sm font-bold text-black">{guests} Personas</span>
                            </div>
                            <div className="flex justify-between items-center pb-1">
                                <span className="text-xs font-bold text-zinc-400 uppercase">Zona</span>
                                <span className="text-sm font-bold text-[#DAA520] uppercase bg-black px-2 py-0.5 rounded">{ZONES.find(z => z.id === selectedZone)?.name}</span>
                            </div>
                        </div>

                        {/* WARNING */}
                        <div className="mt-6 bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3 items-start">
                            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-[10px] font-bold text-amber-700 uppercase mb-1">Importante</p>
                                <p className="text-[10px] text-amber-600 leading-snug">
                                    Tu mesa tendrá 15 minutos de tolerancia.
                                    <br/>
                                    <strong>Debes confirmar tu asistencia 3 horas antes</strong> vía WhatsApp o el link enviado a tu correo.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer Ticket */}
                    <div className="bg-white p-4 flex flex-col items-center justify-center border-t border-dashed border-zinc-300">
                        <div className="h-8 w-2/3 bg-black opacity-90 rounded-sm mb-1" style={{ maskImage: 'repeating-linear-gradient(90deg, black, black 2px, transparent 2px, transparent 4px)' }} />
                        <p className="text-[8px] text-zinc-400 uppercase">{bookingCode} - VALID FOR ENTRY</p>
                    </div>
                </div>

                {/* BOTÓN PARA ABRIR MENÚ DE PEDIDOS ANTICIPADOS */}
                {!orderConfirmed && (
                    <div className="w-full px-6 mb-4">
                         <button 
                            onClick={() => setShowMenu(true)}
                            className="w-full bg-gradient-to-r from-zinc-800 to-black border border-white/20 text-white p-4 rounded-2xl flex items-center justify-between shadow-xl group hover:border-[#DAA520]/50 transition-all"
                         >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-[#DAA520]/20 rounded-xl text-[#DAA520] group-hover:scale-110 transition-transform">
                                    <Utensils className="w-6 h-6" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-sm uppercase text-[#DAA520]">¿Quieres adelantar algo?</p>
                                    <p className="text-[10px] text-zinc-400">Pide productos para tener listos al llegar.</p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-white" />
                         </button>
                    </div>
                )}
                
                {/* MENSAJE DE CONFIRMACIÓN DE PEDIDO */}
                {orderConfirmed && (
                    <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="w-full px-6 mb-4">
                        <div className="bg-green-900/20 border border-green-500/30 p-4 rounded-2xl flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <div>
                                <p className="text-sm font-bold text-white">¡Pedido Adelantado Recibido!</p>
                                <p className="text-[10px] text-zinc-400">Tus productos estarán listos en tu mesa.</p>
                            </div>
                        </div>
                    </motion.div>
                )}

                <div className="w-full px-6">
                    <Link href="/" className="block w-full bg-zinc-900 text-white py-4 rounded-xl font-bold text-center border border-zinc-800 hover:bg-black transition-colors uppercase tracking-widest text-xs">
                        Volver al Inicio
                    </Link>
                </div>
             </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* --- OVERLAY DEL MENÚ DE PRE-ORDEN --- */}
      <AnimatePresence>
        {showMenu && (
            <motion.div 
                initial={{ y: "100%" }} 
                animate={{ y: 0 }} 
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed inset-0 z-50 bg-black flex flex-col"
            >
                {/* Header Menú */}
                <div className="p-6 pb-4 flex items-center justify-between bg-zinc-900/50 backdrop-blur-md border-b border-white/10">
                    <button onClick={() => setShowMenu(false)} className="p-2 rounded-full hover:bg-white/10">
                        <ArrowLeft className="w-6 h-6 text-white" />
                    </button>
                    <div className="text-center">
                        <h2 className="text-lg font-bold text-white uppercase tracking-wider">Menú Express</h2>
                        <p className="text-[10px] text-zinc-400">Adelanta tu pedido</p>
                    </div>
                    <div className="w-10" /> {/* Espaciador */}
                </div>

                {/* Lista de Productos */}
                <div className="flex-1 overflow-y-auto p-4 pb-32 custom-scrollbar">
                    <div className="grid grid-cols-1 gap-4">
                        {products.map((product) => {
                            const inCart = cart.find(item => item.id === product.id);
                            return (
                                <div key={product.id} className="bg-zinc-900 border border-white/5 rounded-2xl p-3 flex gap-4 items-center shadow-lg">
                                    <div className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-zinc-800">
                                        <Image 
                                            src={product.image_url} 
                                            alt={product.name}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-white text-sm truncate">{product.name}</h3>
                                        <p className="text-[10px] text-zinc-500 line-clamp-2 leading-tight mt-1">{product.description}</p>
                                        <p className="text-[#DAA520] font-bold text-sm mt-2">${product.price.toLocaleString('es-CL')}</p>
                                    </div>
                                    <div className="flex flex-col items-center gap-2 bg-black rounded-lg p-1 border border-white/10">
                                        <button onClick={() => addToCart(product)} className="w-8 h-8 flex items-center justify-center text-white bg-zinc-800 rounded-md hover:bg-[#DAA520] hover:text-black transition-colors">
                                            <Plus className="w-4 h-4" />
                                        </button>
                                        <span className="text-xs font-bold w-6 text-center">{inCart?.quantity || 0}</span>
                                        <button onClick={() => removeFromCart(product.id)} className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${inCart ? 'text-white bg-zinc-800 hover:bg-red-900' : 'text-zinc-600 bg-zinc-900'}`} disabled={!inCart}>
                                            <Minus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Footer Carrito */}
                <div className="absolute bottom-0 left-0 w-full bg-zinc-900 border-t border-white/10 p-4 safe-area-bottom">
                    <div className="flex justify-between items-center mb-4 px-2">
                        <span className="text-xs font-bold text-zinc-400 uppercase">Total Estimado</span>
                        <span className="text-xl font-bold text-white">${cartTotal.toLocaleString('es-CL')}</span>
                    </div>
                    <button 
                        onClick={handleSubmitOrder}
                        disabled={cart.length === 0 || isOrdering}
                        className="w-full bg-[#DAA520] text-black font-bold uppercase tracking-widest py-4 rounded-xl hover:bg-[#B8860B] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(218,165,32,0.3)]"
                    >
                         {isOrdering ? <Loader2 className="animate-spin" /> : <ShoppingBag className="w-5 h-5" />}
                         {isOrdering ? "Enviando..." : `Confirmar Pedido (${cartCount})`}
                    </button>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}