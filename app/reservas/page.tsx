"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Users, ChevronRight, ChevronLeft, 
  CheckCircle, Calendar, Clock, AlertTriangle, 
  Armchair, Cigarette, CigaretteOff, Loader2, User, Mail, Phone, 
  ShoppingBag, Plus, Minus, X, Utensils, Wine, ChefHat, Sparkles, Eye,
  Hourglass, MessageCircle
} from "lucide-react";
import Link from "next/link";
import Image from "next/image"; 
import { Montserrat } from "next/font/google";
import { supabase } from "@/lib/supabaseClient"; 

// Configuración de la fuente
const montserrat = Montserrat({ 
  subsets: ["latin"], 
  weight: ["300", "400", "500", "600", "700"] 
});

// --- INTERFACES Y TIPOS ---
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

// --- 1. CONFIGURACIÓN DE ZONAS (ESTÁTICO) ---
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
        icon: Wine 
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
            // Evitar horarios antes de apertura real si es necesario
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

// --- DATOS DE EJEMPLO (FALLBACK SI FALLA SUPABASE) ---
const MOCK_PRODUCTS: Product[] = [
  { id: 1, name: "Tabla de Quesos", description: "Selección de quesos premium, frutos secos y miel.", price: 18990, category: "Tablas", image_url: "https://images.unsplash.com/photo-1631379578550-7038263db699?q=80&w=1000&auto=format&fit=crop" },
  { id: 2, name: "Ceviche Mixto", description: "Pescado del día, camarones, leche de tigre y maíz.", price: 14500, category: "Entradas", image_url: "https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?q=80&w=1000&auto=format&fit=crop" },
  { id: 3, name: "Pisco Sour Catedral", description: "Nuestra receta secreta, doble medida.", price: 7900, category: "Tragos", image_url: "https://images.unsplash.com/photo-1510626176961-4b57d4fbad03?q=80&w=1000&auto=format&fit=crop" },
  { id: 4, name: "Limonada Menta Jengibre", description: "Refrescante y natural.", price: 4500, category: "Bebidas", image_url: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=1000&auto=format&fit=crop" },
];

// --- COMPONENTE PRINCIPAL ---
export default function BookingPage() {
  // Estados de navegación
  const [step, setStep] = useState(1);
  
  // Estados de Datos de la Reserva
  const [guests, setGuests] = useState(2);
  const [selectedDate, setSelectedDate] = useState<number>(new Date().getDate());
  const [time, setTime] = useState("");
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  
  // Estados de Datos del Cliente
  const [userData, setUserData] = useState({ name: "", email: "", phone: "" });

  // Estados de Backend y UI
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // --- NUEVO: ESTADOS PARA EL MENÚ PRE-ORDER ---
  const [showMenu, setShowMenu] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Utilidades de fecha
  const currentMonth = MONTHS[new Date().getMonth()];
  const currentYear = new Date().getFullYear();
  const daysInMonth = new Date(currentYear, new Date().getMonth() + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Funciones de navegación
  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  // --- EFECTO: CARGAR PRODUCTOS ---
  useEffect(() => {
    const fetchProducts = async () => {
        try {
            // Intentamos cargar de Supabase
            // IMPORTANTE: Asegúrate de tener la tabla 'productos_reserva' creada
            const { data, error } = await supabase
                .from('productos_reserva') 
                .select('*')
                .eq('active', true)
                .order('category', { ascending: true }); // Ordenar por categoría
            
            if (!error && data && data.length > 0) {
                setProducts(data);
            } else {
                console.log("Usando datos Mock porque no se encontraron productos o hubo error.");
                setProducts(MOCK_PRODUCTS); 
            }
        } catch (err) {
            console.error("Error crítico fetching products:", err);
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

  // Cálculos del carrito
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // --- GUARDAR RESERVA COMPLETA (CON PEDIDO) ---
  const handleConfirmReservation = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      
      const zoneDetails = ZONES.find(z => z.id === selectedZone);

      try {
          // Construimos el objeto de datos a enviar
          // NOTA: No generamos el código aquí, se genera en el backend al confirmar
          const payload = {
              name: userData.name,
              email: userData.email,
              phone: userData.phone,
              date_reserva: `${selectedDate} de ${currentMonth}`,
              time_reserva: time,
              guests: guests,
              zone: zoneDetails?.name || "Zona General",
              status: 'pendiente', // Estado inicial
              // Aquí integramos el pedido directamente en la reserva
              pre_order: cart.length > 0 ? cart : null, 
              total_pre_order: cartTotal
          };

          const { error } = await supabase.from('reservas').insert([payload]);

          if (error) throw error;

          setStep(4); // Éxito: Ir a pantalla de "Solicitud Enviada"

      } catch (error) {
          console.error("Error reservando:", error);
          alert("Hubo un problema al procesar tu reserva. Por favor verifica tu conexión.");
      } finally {
          setIsSubmitting(false);
      }
  };

  // --- ANIMACIONES (FRAMER MOTION) ---
  const slideVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 20 : -20, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction < 0 ? 20 : -20, opacity: 0 })
  };

  // Animación para el overlay del menú
  const menuOverlayVariants = {
      hidden: { y: "100%", opacity: 0 },
      visible: { 
          y: 0, 
          opacity: 1,
          transition: { type: "spring", damping: 25, stiffness: 300 }
      },
      exit: { y: "100%", opacity: 0 }
  };

  // Animación escalonada (Stagger) para los productos
  const listContainerVariants = {
      hidden: { opacity: 0 },
      show: {
          opacity: 1,
          transition: {
              staggerChildren: 0.1
          }
      }
  };

  const listItemVariants = {
      hidden: { opacity: 0, y: 20 },
      show: { opacity: 1, y: 0 }
  };

  return (
    <main className={`min-h-screen bg-black text-white pb-20 relative overflow-x-hidden ${montserrat.className}`}>
      
      {/* FONDO DECORATIVO ANIMADO SUAVEMENTE */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#DAA520]/10 rounded-full blur-[120px] animate-pulse" style={{animationDuration: '4s'}} />
         <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-red-900/10 rounded-full blur-[100px]" />
      </div>

      {/* --- HEADER SUPERIOR --- */}
      <div className="relative h-64 w-full flex flex-col justify-between p-6 z-10">
        
        {/* Botón Atrás */}
        <div className="absolute top-6 left-6 z-20">
            <Link href="/" className="p-3 bg-black/50 backdrop-blur-md rounded-full border border-white/10 hover:bg-black/80 transition-colors inline-block group">
                <ArrowLeft className="w-5 h-5 text-white group-hover:-translate-x-1 transition-transform" />
            </Link>
        </div>

        {/* TÍTULO PRINCIPAL */}
        <div className="absolute bottom-4 left-0 right-0 z-10 text-center flex flex-col items-center">
            <motion.div 
                initial={{ y: 20, opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }} 
                transition={{ delay: 0.2 }}
                className="flex items-center gap-2 mb-2"
            >
                <Calendar className="w-5 h-5 text-[#DAA520]" />
                <span className="text-xs font-bold text-[#DAA520] uppercase tracking-[0.2em]">Reservas Online</span>
            </motion.div>
            <motion.h1 
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }}
                className="text-3xl font-bold uppercase tracking-wide text-white drop-shadow-lg leading-none"
            >
                Asegura tu<br/>Mesa
            </motion.h1>
        </div>
      </div>

      {/* --- CONTENEDOR DE PASOS --- */}
      <div className="relative z-20 px-4 -mt-4 max-w-lg mx-auto">
        <AnimatePresence custom={step} mode="wait">
          
          {/* ================= PASO 1: DATOS BÁSICOS ================= */}
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

              {/* Horarios Grid */}
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
                className="w-full bg-[#DAA520] text-black font-bold uppercase tracking-widest py-4 rounded-xl mt-4 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(218,165,32,0.3)] hover:bg-[#B8860B] transition-all flex items-center justify-center gap-2 group"
              >
                Elegir Zona <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          )}

          {/* ================= PASO 2: SELECCIÓN DE ZONA ================= */}
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
                                    ? "bg-zinc-900 border-[#DAA520] shadow-[0_0_20px_rgba(218,165,32,0.15)] scale-[1.02]" 
                                    : "bg-zinc-900/50 border-white/5 hover:bg-zinc-800"}
                            `}
                        >
                            {selectedZone === zone.id && (
                                <motion.div initial={{scale:0}} animate={{scale:1}} className="absolute top-3 right-3 text-[#DAA520]">
                                    <CheckCircle className="w-5 h-5 fill-[#DAA520] text-black" />
                                </motion.div>
                            )}
                            
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${selectedZone === zone.id ? 'bg-[#DAA520] text-black' : 'bg-black text-zinc-600'}`}>
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
                    <button onClick={prevStep} className="w-14 h-14 rounded-xl bg-black border border-white/10 flex items-center justify-center text-white hover:bg-zinc-800 transition-colors"><ArrowLeft/></button>
                    <button onClick={nextStep} disabled={!selectedZone} className="flex-1 bg-[#DAA520] text-black font-bold uppercase tracking-widest rounded-xl disabled:opacity-50 hover:bg-[#B8860B] transition-colors shadow-lg">
                        Continuar
                    </button>
                </div>
            </motion.div>
          )}

          {/* ================= PASO 3: FORMULARIO + MENÚ EXPRESS CARRUSEL ================= */}
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
                          <p className="text-xs text-zinc-500">Completa para asegurar tu mesa.</p>
                      </div>
                      
                      <form onSubmit={handleConfirmReservation} className="space-y-4">
                          {/* Inputs del formulario */}
                          <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 ml-1">Nombre Completo</label>
                                <div className="relative group">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-[#DAA520] transition-colors"/>
                                    <input required type="text" placeholder="Ej: Juan Pérez" className="w-full bg-black/50 border border-zinc-700 rounded-xl p-3 pl-10 text-white text-sm focus:border-[#DAA520] focus:ring-1 focus:ring-[#DAA520] outline-none transition-all placeholder:text-zinc-600" value={userData.name} onChange={e => setUserData({...userData, name: e.target.value})} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 ml-1">Correo Electrónico</label>
                                <div className="relative group">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-[#DAA520] transition-colors"/>
                                    <input required type="email" placeholder="tucorreo@ejemplo.com" className="w-full bg-black/50 border border-zinc-700 rounded-xl p-3 pl-10 text-white text-sm focus:border-[#DAA520] focus:ring-1 focus:ring-[#DAA520] outline-none transition-all placeholder:text-zinc-600" value={userData.email} onChange={e => setUserData({...userData, email: e.target.value})} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 ml-1">Teléfono</label>
                                <div className="relative group">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-[#DAA520] transition-colors"/>
                                    <input required type="tel" placeholder="+569 1234 5678" className="w-full bg-black/50 border border-zinc-700 rounded-xl p-3 pl-10 text-white text-sm focus:border-[#DAA520] focus:ring-1 focus:ring-[#DAA520] outline-none transition-all placeholder:text-zinc-600" value={userData.phone} onChange={e => setUserData({...userData, phone: e.target.value})} />
                                </div>
                            </div>
                          </div>

                          {/* --- SECCIÓN CARRUSEL AUTOMÁTICO DE PRODUCTOS --- */}
                          <div className="pt-6 border-t border-white/5 mt-4">
                              <div className="flex items-center justify-between mb-4 px-1">
                                <label className="text-[10px] uppercase font-bold text-[#DAA520] tracking-widest flex items-center gap-1">
                                    <Sparkles className="w-3 h-3"/> Experiencia Gourmet
                                </label>
                                <button type="button" onClick={() => setShowMenu(true)} className="text-[10px] text-zinc-400 font-bold hover:text-white flex items-center gap-1 transition-colors">
                                    Ver todo el menú <ChevronRight className="w-3 h-3"/>
                                </button>
                              </div>
                              
                              {/* Contenedor Carrusel */}
                              <div className="relative w-full overflow-hidden rounded-xl bg-black/20 border border-white/5 py-3 group cursor-pointer" onClick={() => setShowMenu(true)}>
                                  {/* Gradientes laterales para efecto fade */}
                                  <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-zinc-900 to-transparent z-10 pointer-events-none"/>
                                  <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-zinc-900 to-transparent z-10 pointer-events-none"/>
                                  
                                  {products.length > 0 ? (
                                    <motion.div 
                                        className="flex gap-3 px-3"
                                        animate={{ x: ["0%", "-50%"] }}
                                        transition={{ 
                                            repeat: Infinity, 
                                            duration: 20, 
                                            ease: "linear",
                                        }}
                                        style={{ width: "max-content" }}
                                    >
                                            {/* Duplicamos los productos para crear el efecto de bucle infinito */}
                                            {[...products, ...products].map((item, idx) => (
                                                <div key={`${item.id}-${idx}`} className="w-32 flex-shrink-0 bg-black/60 border border-white/10 rounded-lg overflow-hidden group-hover:border-[#DAA520]/50 transition-colors">
                                                    <div className="relative h-20 w-full bg-zinc-800">
                                                        <Image src={item.image_url} alt={item.name} fill className="object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                                    </div>
                                                    <div className="p-2">
                                                        <p className="text-[10px] font-bold text-white truncate">{item.name}</p>
                                                        <p className="text-[10px] text-[#DAA520] font-bold mt-0.5">${item.price.toLocaleString('es-CL')}</p>
                                                    </div>
                                                </div>
                                            ))}
                                    </motion.div>
                                  ) : (
                                    <div className="text-center py-4">
                                        <Loader2 className="w-5 h-5 animate-spin mx-auto text-zinc-500"/>
                                        <p className="text-[9px] text-zinc-600 mt-2">Cargando delicias...</p>
                                    </div>
                                  )}
                              </div>

                              {/* Preview del Carrito si hay items seleccionados */}
                              <AnimatePresence>
                                {cart.length > 0 && (
                                    <motion.div 
                                        initial={{ height: 0, opacity: 0 }} 
                                        animate={{ height: 'auto', opacity: 1 }} 
                                        exit={{ height: 0, opacity: 0 }}
                                        className="mt-3 bg-zinc-800/50 rounded-xl p-3 border border-white/5 overflow-hidden"
                                    >
                                        <div className="flex justify-between items-center mb-2 pb-2 border-b border-white/5">
                                            <span className="text-[10px] font-bold text-zinc-400 uppercase">Resumen Pedido</span>
                                            <span className="text-[10px] font-bold text-[#DAA520]">${cartTotal.toLocaleString('es-CL')}</span>
                                        </div>
                                        <div className="space-y-2">
                                            {cart.map(item => (
                                                <div key={item.id} className="flex justify-between text-xs text-zinc-300">
                                                    <span>{item.quantity}x {item.name}</span>
                                                    <span>${(item.price * item.quantity).toLocaleString('es-CL')}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                              </AnimatePresence>
                          </div>

                          {/* BOTÓN DE ACCIÓN FINAL */}
                          <div className="pt-4">
                              <button 
                                  type="submit" 
                                  disabled={isSubmitting} 
                                  className="w-full bg-[#DAA520] text-black font-bold uppercase tracking-widest py-4 rounded-xl hover:bg-[#B8860B] transition-colors flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(218,165,32,0.3)] disabled:opacity-70 disabled:cursor-not-allowed transform hover:scale-[1.01] active:scale-[0.99]"
                              >
                                  {isSubmitting ? (
                                    <><Loader2 className="animate-spin w-5 h-5"/> Procesando...</>
                                  ) : (
                                    cart.length > 0 ? `Reservar y Pedir ($${cartTotal.toLocaleString('es-CL')})` : "Finalizar Reserva"
                                  )}
                              </button>
                          </div>
                      </form>
                  </div>
                  
                  <button onClick={prevStep} className="w-full py-3 text-xs font-bold text-zinc-500 uppercase hover:text-white transition-colors">Volver Atrás</button>
            </motion.div>
          )}

          {/* ================= PASO 4: PANTALLA DE "SOLICITUD ENVIADA" (SIN CÓDIGO) ================= */}
          {step === 4 && (
             <motion.div 
                key="step4" 
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                className="pt-10 flex flex-col items-center pb-24 text-center px-4"
             >
                <div className="w-full bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative max-w-sm p-8">
                    
                    {/* ÍCONO DE ESPERA */}
                    <div className="mb-6 relative">
                        <div className="absolute inset-0 bg-[#DAA520]/20 blur-3xl rounded-full" />
                        <Hourglass className="w-20 h-20 text-[#DAA520] mx-auto animate-pulse relative z-10" />
                    </div>

                    <h2 className="text-2xl font-bold text-white uppercase tracking-wide mb-2">
                        Solicitud Enviada
                    </h2>
                    <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
                        Hemos recibido tu solicitud de reserva. Nuestro equipo está verificando la disponibilidad.
                    </p>

                    <div className="bg-black/30 rounded-xl p-4 border border-white/5 mb-6 text-left">
                        <div className="flex items-start gap-3">
                            <MessageCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-xs font-bold text-white uppercase mb-1">Confirmación por WhatsApp</h4>
                                <p className="text-[10px] text-zinc-400 leading-snug">
                                    En breves momentos recibirás un mensaje a tu WhatsApp con tu <strong>Ticket de Entrada y Código QR</strong> una vez que confirmemos tu mesa.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-white/10 pt-4 mt-2">
                        <p className="text-[10px] text-zinc-600 uppercase tracking-widest">
                            Estado: <span className="text-yellow-500 font-bold">En Revisión</span>
                        </p>
                    </div>
                </div>

                <Link href="/" className="mt-8 px-8 py-3 bg-white/5 text-white rounded-xl font-bold border border-white/10 text-xs uppercase tracking-widest hover:bg-white/10 transition-colors">
                    Volver al Inicio
                </Link>
             </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ================= OVERLAY DEL MENÚ DE PRE-ORDEN (BOTTOM SHEET) ================= */}
      <AnimatePresence>
        {showMenu && (
            <motion.div 
                variants={menuOverlayVariants}
                initial="hidden" 
                animate="visible" 
                exit="exit"
                className="fixed inset-0 z-50 bg-black flex flex-col"
            >
                {/* Header del Menú Overlay */}
                <div className="p-6 pb-4 flex items-center justify-between bg-zinc-900/90 backdrop-blur-md border-b border-white/10 sticky top-0 z-20">
                    <button onClick={() => setShowMenu(false)} className="p-2 rounded-full bg-zinc-800 text-white hover:bg-zinc-700 transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div className="text-center">
                        <h2 className="text-lg font-bold text-white uppercase tracking-wider">Menú Express</h2>
                        <p className="text-[10px] text-[#DAA520]">Personaliza tu Experiencia</p>
                    </div>
                    <div className="w-10 flex justify-end">
                        <div className="relative">
                            <ShoppingBag className="w-6 h-6 text-white"/>
                            {cartCount > 0 && (
                                <motion.span 
                                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                                    className="absolute -top-1 -right-1 bg-[#DAA520] text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center"
                                >
                                    {cartCount}
                                </motion.span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Lista de Productos con Animación Stagger */}
                <motion.div 
                    variants={listContainerVariants}
                    initial="hidden"
                    animate="show"
                    className="flex-1 overflow-y-auto p-4 pb-40 custom-scrollbar"
                >
                    <div className="grid grid-cols-1 gap-4">
                        {products.map((product) => {
                            const inCart = cart.find(item => item.id === product.id);
                            return (
                                <motion.div 
                                    variants={listItemVariants} 
                                    key={product.id} 
                                    className="bg-zinc-900 border border-white/5 rounded-2xl p-3 flex gap-4 items-center shadow-lg hover:border-[#DAA520]/30 transition-colors"
                                >
                                    <div className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-zinc-800">
                                        <Image src={product.image_url} alt={product.name} fill className="object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-bold text-white text-sm truncate pr-2">{product.name}</h3>
                                        </div>
                                        <p className="text-[10px] text-zinc-500 line-clamp-2 leading-tight mt-1">{product.description}</p>
                                        <p className="text-[#DAA520] font-bold text-sm mt-3">${product.price.toLocaleString('es-CL')}</p>
                                    </div>
                                    
                                    {/* Controles de Cantidad */}
                                    <div className="flex flex-col items-center gap-2 bg-black rounded-lg p-1 border border-white/10 shadow-inner">
                                        <button onClick={() => addToCart(product)} className="w-8 h-8 flex items-center justify-center text-white bg-zinc-800 rounded-md hover:bg-[#DAA520] hover:text-black transition-colors">
                                            <Plus className="w-4 h-4" />
                                        </button>
                                        <span className="text-xs font-bold w-6 text-center text-white">{inCart?.quantity || 0}</span>
                                        <button onClick={() => removeFromCart(product.id)} className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${inCart ? 'text-white bg-zinc-800 hover:bg-red-900' : 'text-zinc-600 bg-zinc-900'}`} disabled={!inCart}>
                                            <Minus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                </motion.div>

                {/* Footer Flotante del Menú */}
                <div className="absolute bottom-0 left-0 w-full bg-black/95 backdrop-blur-xl border-t border-white/10 p-5 safe-area-bottom z-20">
                    <div className="flex justify-between items-center mb-4 px-1">
                        <span className="text-xs font-bold text-zinc-400 uppercase">Total Adicional</span>
                        <span className="text-2xl font-black text-white">${cartTotal.toLocaleString('es-CL')}</span>
                    </div>
                    <button 
                        onClick={() => setShowMenu(false)}
                        className="w-full bg-[#DAA520] text-black font-bold uppercase tracking-widest py-4 rounded-xl hover:bg-[#B8860B] transition-colors shadow-[0_0_20px_rgba(218,165,32,0.3)]"
                    >
                        Confirmar Selección ({cartCount})
                    </button>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}