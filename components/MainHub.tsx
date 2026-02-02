"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Utensils, CalendarCheck, Music,
  MapPin, Instagram, Facebook, ArrowUpRight, 
  ChevronRight, Sparkles, Clock, Loader2,
  Ticket, ShoppingBag, Star, Flame, Info
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Montserrat } from "next/font/google";

// --- 1. SOLUCIÓN DE CONEXIÓN (CLIENTE ESTÁNDAR) ---
// Usamos 'createClient' directo para máxima compatibilidad y evitar errores de versión
import { createClient } from '@supabase/supabase-js';

// Inicialización segura del cliente (Usa tus variables de entorno locales)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

// --- CONFIGURACIÓN DE FUENTES ---
const montserrat = Montserrat({ 
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"]
});

// --- TIPOS DE DATOS (INTERFACES) ---
// Esto unifica lo que viene de la tabla 'eventos' y 'promociones'
type CarouselItem = {
  id: string; // ID único (ej: "evt-1" o "prm-5")
  dbId: number; // ID real en base de datos
  type: 'promo' | 'show';
  title: string;
  subtitle: string;
  description: string;
  image: string;
  linkUrl: string; // URL a donde redirige al hacer click
  color: string;
  tag: string;
  ctaText: string; // Texto del botón (ej: "Comprar Ticket" o "Ver Menú")
};

// --- DATOS DE RESPALDO (VISUALES) ---
// Se muestran solo si la base de datos está vacía o cargando
const FALLBACK_ITEMS: CarouselItem[] = [
  {
    id: "fallback-1", dbId: 0, type: "show",
    title: "EXPERIENCIA BOULEVARD", subtitle: "Vive momentos únicos", description: "Gastronomía, música y el mejor ambiente de Curicó.",
    image: "/fondo-boulevard.jpg", linkUrl: "/reservas", color: "#8338EC", tag: "BIENVENIDOS", ctaText: "Reservar Ahora"
  }
];

// --- COMPONENTES UI (ICONOS) ---
const CustomBadgePercentIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3.85 8.62a4 4 0 0 1 4.77-4.77 4 4 0 0 1 6.76 0 4 4 0 0 1 4.77 4.77 4 4 0 0 1 0 6.76 4 4 0 0 1-4.77 4.77 4 4 0 0 1-6.76 0 4 4 0 0 1-4.77-4.77 4 4 0 0 1 0-6.76Z" /><path d="m15 9-6 6" /><path d="M9 9h.01" /><path d="M15 15h.01" /></svg>
);
const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
);

// --- LINKS ESTÁTICOS (GRID INFERIOR) ---
const LARGE_LINKS = [
  { id: "carta", title: "Nuestra Carta", icon: Utensils, href: "https://menu.fu.do/boulevardzapallar/qr-menu", image: "/menu.jpeg", overlay: "from-[#FF4500]/80 via-black/50 via-25% to-transparent", iconStyle: "bg-white/20 text-white border-white/30", borderGlow: "group-hover:border-[#FF4500]/50 group-hover:shadow-[0_0_30px_rgba(255,69,0,0.3)]" },
  { id: "promos", title: "Promociones", icon: CustomBadgePercentIcon, href: "/promociones", image: "/promos.jpeg", overlay: "from-[#FFCC00]/80 via-black/50 via-25% to-transparent", iconStyle: "bg-white/20 text-white border-white/30", textColor: "text-white", borderGlow: "group-hover:border-[#FFCC00]/50 group-hover:shadow-[0_0_30px_rgba(255,204,0,0.4)]" },
  { id: "reserva", title: "Reservar Mesa", icon: CalendarCheck, href: "/reservas", image: "/reservas.jpg", overlay: "from-[#28A745]/80 via-black/50 via-25% to-transparent", iconStyle: "bg-white/20 text-white border-white/30", borderGlow: "group-hover:border-[#28A745]/50 group-hover:shadow-[0_0_30px_rgba(40,167,69,0.3)]" },
  { id: "show", title: "Show Musicales", icon: Music, href: "/tickets", image: "/shows.jpeg", overlay: "from-[#8338EC]/80 via-black/50 via-25% to-transparent", iconStyle: "bg-white/20 text-white border-white/30", borderGlow: "group-hover:border-[#8338EC]/50 group-hover:shadow-[0_0_30px_rgba(131,56,236,0.3)]" },
];

const BENTO_LINKS = [
  { id: "delivery", title: "Delivery", href: "/delivery", image: "/delivery.jpeg", overlay: "from-[#F3722C]/80 via-black/50 via-40% to-transparent" },
  { id: "eventos", title: "Cotiza tu Evento", href: "/eventos", image: "/cotizatuevento.jpeg", overlay: "from-[#B8860B]/90 via-black/80 via-40% to-transparent" },
  { id: "trabajo", title: "Únete al Equipo", href: "/trabajo", image: "/unetealequipo.jpg", overlay: "from-[#2A9D8F]/90 via-black/80 via-40% to-transparent" },
  { id: "ubicacion", title: "Ubicación", href: "/ubicacion", image: "https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1474&auto=format&fit=crop", overlay: "from-zinc-900/90 via-black/80 via-40% to-transparent" },
];

export default function MainHub() {
  
  // --- ESTADOS DE LA APLICACIÓN ---
  const [items, setItems] = useState<CarouselItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filter, setFilter] = useState<'all' | 'promociones' | 'eventos'>('all');
  const [isPaused, setIsPaused] = useState(false);

  // --- EFECTO: CARGAR DATOS DE SUPABASE ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!supabase) {
          console.error("Supabase no está configurado (Faltan variables de entorno)");
          setItems(FALLBACK_ITEMS);
          setIsLoading(false);
          return;
        }

        setIsLoading(true);

        // 1. Consultar Tabla Promociones
        // Asumimos columnas: id, titulo, descripcion, imagen_url, activo
        const { data: promosData, error: promoError } = await supabase
          .from('promociones')
          .select('*')
          .eq('activo', true)
          .order('created_at', { ascending: false });

        if (promoError) console.log("Nota: Tabla promociones vacía o error:", promoError.message);

        // 2. Consultar Tabla Eventos
        // Asumimos columnas: id, nombre, fecha, imagen_flyer, activo
        const { data: eventosData, error: eventError } = await supabase
          .from('eventos')
          .select('*')
          .eq('activo', true)
          .order('fecha', { ascending: true }); // Ordenar por fecha próxima

        if (eventError) console.log("Nota: Tabla eventos vacía o error:", eventError.message);

        // 3. Normalizar y mezclar datos
        let formattedPromos: CarouselItem[] = [];
        if (promosData) {
            formattedPromos = promosData.map((p: any) => ({
                id: `promo-${p.id}`,
                dbId: p.id,
                type: 'promo',
                title: p.titulo || "PROMOCIÓN",
                subtitle: "Especial Boulevard",
                description: p.descripcion || "¡No te lo pierdas!",
                image: p.imagen_url || "/promos.jpeg",
                linkUrl: "/promociones", // REDIRIGE A LA PÁGINA DE PROMOS
                color: "#FFCC00",
                tag: "OFERTA",
                ctaText: "Ver Promo"
            }));
        }

        let formattedEventos: CarouselItem[] = [];
        if (eventosData) {
            formattedEventos = eventosData.map((e: any) => {
                // Formatear fecha bonita
                const dateObj = new Date(e.fecha);
                const fechaStr = isNaN(dateObj.getTime()) 
                    ? "Próximamente" 
                    : dateObj.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'short' });
                
                return {
                    id: `event-${e.id}`,
                    dbId: e.id,
                    type: 'show',
                    title: e.nombre || "SHOW EN VIVO",
                    subtitle: fechaStr,
                    description: "Música y ambiente en vivo",
                    image: e.imagen_flyer || "/shows.jpeg",
                    linkUrl: "/tickets", // REDIRIGE A LA PÁGINA DE TICKETS
                    color: "#8338EC",
                    tag: "EN VIVO",
                    ctaText: "Comprar Ticket"
                };
            });
        }

        const allItems = [...formattedEventos, ...formattedPromos];

        if (allItems.length > 0) {
            setItems(allItems);
        } else {
            setItems(FALLBACK_ITEMS);
        }

      } catch (error) {
        console.error("Error crítico cargando datos:", error);
        setItems(FALLBACK_ITEMS);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- LÓGICA DE FILTRADO ---
  const filteredItems = filter === 'all' 
    ? items 
    : items.filter(item => {
        if (filter === 'promociones') return item.type === 'promo';
        if (filter === 'eventos') return item.type === 'show';
        return true;
    });

  // Resetear índice al cambiar filtro para evitar errores
  useEffect(() => { setCurrentIndex(0); }, [filter]);

  // --- AUTO-PLAY DEL CARRUSEL ---
  useEffect(() => {
    if (isPaused || filteredItems.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % filteredItems.length);
    }, 5000); // Cambia cada 5 segundos
    return () => clearInterval(interval);
  }, [currentIndex, isPaused, filteredItems.length]);

  // Item actual seguro
  const currentItem = filteredItems[currentIndex] || FALLBACK_ITEMS[0];

  // --- RENDERIZADO ---
  return (
    <main className={`min-h-screen w-full bg-black relative flex flex-col items-center pb-16 overflow-x-hidden ${montserrat.className}`}>
      
      {/* 1. FONDO AMBIENTAL (Optimizado) */}
      <div className="fixed inset-0 z-0 pointer-events-none select-none">
        <Image src="/fondo-boulevard.jpg" alt="Background" fill className="object-cover opacity-40 blur-sm scale-105" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/80 to-black" />
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
      </div>

      {/* CONTENEDOR PRINCIPAL */}
      <div className="relative z-10 w-full max-w-md px-5 flex flex-col items-center">
        
        {/* 2. LOGO HEADER */}
        <motion.div 
          initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}
          className="pt-2 pb-4 flex flex-col items-center text-center w-full"
        >
          <div className="relative w-52 h-52 mb-0 drop-shadow-2xl"> 
             <Image src="/logo.png" alt="Boulevard Zapallar" fill className="object-contain" priority />
          </div>
          <div className="flex items-center gap-2 opacity-90 mt-[-35px] w-full justify-center mb-6">
             <div className="h-[1px] w-6 bg-gradient-to-r from-transparent to-boulevard-red shrink-0" />
             <p className="text-[10px] text-white font-bold tracking-[0.25em] uppercase glow-text">CREAMOS MOMENTOS FELICES</p>
             <div className="h-[1px] w-6 bg-gradient-to-l from-transparent to-boulevard-red shrink-0" />
          </div>
        </motion.div>

        {/* ========================================================= */}
        {/* 🔥 PANELES AVANZADOS (MASTER DETAIL GALLERY) 🔥 */}
        {/* ========================================================= */}
        <div className="w-full mb-8 relative group/panel">
            
            {/* ENCABEZADO DEL PANEL: TABS DE FILTRO */}
            <div className="flex justify-between items-end mb-3 px-1">
                <h2 className="text-white text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" /> Destacados
                </h2>
                <div className="flex gap-1 bg-white/10 p-1 rounded-full backdrop-blur-md">
                    <button onClick={() => setFilter('all')} className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase transition-all ${filter === 'all' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-white'}`}>Todo</button>
                    <button onClick={() => setFilter('promociones')} className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase transition-all ${filter === 'promociones' ? 'bg-[#FFCC00] text-black shadow-sm' : 'text-gray-400 hover:text-white'}`}>Promos</button>
                    <button onClick={() => setFilter('eventos')} className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase transition-all ${filter === 'eventos' ? 'bg-[#8338EC] text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}>Shows</button>
                </div>
            </div>

            {/* VISOR PRINCIPAL (HERO CARD) */}
            <div className="relative w-full aspect-[4/3] rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 bg-zinc-900 transition-transform duration-500 hover:scale-[1.01]">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full w-full text-white/50 gap-3">
                       <Loader2 className="animate-spin w-8 h-8 text-boulevard-red"/> 
                       <span className="text-xs tracking-widest uppercase">Cargando Agenda...</span>
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentItem.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 w-full h-full cursor-pointer"
                        onMouseEnter={() => setIsPaused(true)}
                        onMouseLeave={() => setIsPaused(false)}
                      >
                        {/* 1. LINK GLOBAL: Al hacer clic en la imagen, va al destino */}
                        <Link href={currentItem.linkUrl} className="block w-full h-full relative">
                            
                            {/* IMAGEN DE FONDO */}
                            <Image 
                              src={currentItem.image} 
                              alt={currentItem.title}
                              fill
                              className="object-cover transition-transform duration-[4s] ease-in-out group-hover/panel:scale-105"
                            />
                            
                            {/* CAPAS DE GRADIENTE INTELIGENTE */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80" />
                            <div 
                               className="absolute inset-0 opacity-40 mix-blend-overlay"
                               style={{ backgroundImage: `linear-gradient(to top, ${currentItem.color}, transparent)` }}
                            />

                            {/* CONTENIDO TEXTUAL SOBRE LA IMAGEN */}
                            <div className="absolute inset-0 p-6 flex flex-col justify-end items-start z-10">
                               
                               {/* ETIQUETA FLOTANTE SUPERIOR */}
                               <div className="absolute top-4 right-4">
                                   <span 
                                     className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1 backdrop-blur-md bg-white/90 text-black border border-white/20"
                                     style={{ color: currentItem.color }}
                                   >
                                     {currentItem.type === 'show' ? <Music className="w-3 h-3"/> : <Flame className="w-3 h-3"/>}
                                     {currentItem.tag}
                                   </span>
                               </div>

                               {/* TÍTULO Y DESCRIPCIÓN */}
                               <motion.div 
                                 initial={{ y: 20, opacity: 0 }} 
                                 animate={{ y: 0, opacity: 1 }} 
                                 transition={{ delay: 0.1 }}
                                 className="w-full"
                               >
                                   <h2 className="text-3xl font-black text-white leading-[0.9] uppercase italic drop-shadow-xl mb-2 line-clamp-2">
                                      {currentItem.title}
                                   </h2>
                                   
                                   <div className="flex items-center gap-2 mb-3">
                                       <Clock className="w-3 h-3 text-white/80" />
                                       <p className="text-xs text-gray-200 font-medium tracking-wide uppercase">
                                          {currentItem.subtitle}
                                       </p>
                                   </div>

                                   <p className="text-[11px] text-gray-300 line-clamp-2 mb-4 leading-relaxed max-w-[90%]">
                                      {currentItem.description}
                                   </p>
                                   
                                   {/* BOTÓN FALSO (VISUAL) */}
                                   <div 
                                     className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-[10px] font-bold text-white uppercase tracking-widest shadow-lg transition-all hover:gap-3"
                                     style={{ backgroundColor: currentItem.color }}
                                   >
                                      {currentItem.ctaText} <ChevronRight className="w-3 h-3" />
                                   </div>
                               </motion.div>
                            </div>
                        </Link>
                      </motion.div>
                    </AnimatePresence>
                )}
            </div>

            {/* TIRA DE MINIATURAS (THUMBNAIL STRIP) */}
            {/* Permite navegar rápidamente entre todos los elementos */}
            {!isLoading && filteredItems.length > 1 && (
                <div className="mt-4 overflow-x-auto no-scrollbar flex gap-3 pl-1 pb-2 mask-linear-fade">
                    {filteredItems.map((item, idx) => (
                        <button 
                           key={item.id}
                           onClick={() => { setCurrentIndex(idx); setIsPaused(true); }}
                           className={`relative flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all duration-300 ease-out group ${currentIndex === idx ? 'w-20 border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'border-white/10 opacity-50 hover:opacity-100 grayscale hover:grayscale-0'}`}
                        >
                            <Image src={item.image} alt="thumb" fill className="object-cover" />
                            {/* Barra de progreso visual si está activo */}
                            {currentIndex === idx && !isPaused && (
                                <motion.div 
                                  layoutId="progress"
                                  initial={{ width: "0%" }}
                                  animate={{ width: "100%" }}
                                  transition={{ duration: 5, ease: "linear", repeat: Infinity }}
                                  className="absolute bottom-0 left-0 h-1 bg-white z-20"
                                />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
        {/* ========================================================= */}

        {/* 3. GRID DE NAVEGACIÓN PRINCIPAL (TARJETAS GRANDES) */}
        <motion.div 
           variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
           initial="hidden" animate="show" 
           className="w-full flex flex-col gap-4 mb-6"
        >
          {LARGE_LINKS.map((link) => (
            <motion.div key={link.id} variants={{ hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } }} className="w-full">
              <Link 
                  href={link.href} 
                  className={`group relative block w-full h-24 rounded-3xl overflow-hidden border border-white/5 transition-all duration-300 active:scale-[0.98] shadow-xl backdrop-blur-sm ${link.borderGlow}`}
              >
                {/* Fondo e Imagen */}
                <div className="absolute inset-0 z-0">
                   <Image src={link.image} alt={link.title} fill className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-[1.5s]" />
                   <div className={`absolute inset-0 bg-gradient-to-r ${link.overlay}`} />
                </div>
                
                {/* Contenido Tarjeta */}
                <div className="relative z-10 h-full p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl backdrop-blur-md border shadow-lg ${link.iconStyle} group-hover:scale-110 transition-transform`}>
                            <link.icon className="w-8 h-8 drop-shadow" />
                        </div>
                        <h3 className={`text-lg font-bold uppercase tracking-wide drop-shadow-md leading-none ${link.textColor || 'text-white'}`}>
                            {link.title}
                        </h3>
                    </div>
                    <div className="p-2 bg-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity -translate-x-4 group-hover:translate-x-0 duration-300">
                        <ArrowUpRight className="w-4 h-4 text-white" />
                    </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* 4. BENTO GRID (SERVICIOS SECUNDARIOS) */}
        <motion.div 
            variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }} 
            initial="hidden" animate="show" 
            className="w-full grid grid-cols-2 gap-3 pb-8"
        >
            {BENTO_LINKS.map((widget) => (
                <motion.div key={widget.id} variants={{ hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } }}>
                    <Link href={widget.href} className="group relative block h-36 rounded-3xl overflow-hidden border border-white/10 active:scale-[0.98] transition-all hover:border-white/30">
                        <div className="absolute inset-0 z-0">
                            <Image src={widget.image} alt={widget.title} fill className="object-cover opacity-50 group-hover:scale-110 transition-transform duration-[2s]"/>
                            <div className={`absolute inset-0 bg-gradient-to-t ${widget.overlay}`} />
                        </div>
                        <div className="relative z-10 p-4 h-full flex flex-col justify-center items-center text-center">
                            <h3 className="text-xs font-bold text-white leading-tight uppercase drop-shadow-sm whitespace-nowrap tracking-wider">{widget.title}</h3>
                        </div>
                    </Link>
                </motion.div>
            ))}
        </motion.div>

        {/* 5. SECCIÓN SOCIAL (INSTAGRAM FEED) */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="w-full mb-10">
            <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 rounded-lg shadow-lg">
                        <Instagram className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-bold text-white tracking-wide">@boulevardzapallar</span>
                </div>
                <a href="https://www.instagram.com/boulevardzapallar/?hl=es" target="_blank" className="text-[10px] font-bold text-gray-400 hover:text-white uppercase tracking-wider flex items-center gap-1 bg-white/5 px-3 py-1 rounded-full transition-colors border border-white/5">
                    Seguir <ArrowUpRight className="w-3 h-3" />
                </a>
            </div>
            <div className="relative w-full h-[450px] rounded-[2rem] overflow-hidden border border-white/10 bg-zinc-900/50 backdrop-blur-xl shadow-2xl">
                {/* Fallback visual mientras carga iframe */}
                <div className="absolute inset-0 flex items-center justify-center -z-10 text-white/20">
                    <Loader2 className="animate-spin w-8 h-8" />
                </div>
                <iframe 
                    src="https://www.instagram.com/boulevardzapallar/embed" 
                    className="w-full h-full border-none" 
                    loading="lazy"
                    allowTransparency={true}
                ></iframe>
            </div>
        </motion.div>

        {/* 6. FOOTER */}
        <div className="mt-auto flex flex-col items-center gap-6 mb-8">
            <div className="flex gap-6 items-center justify-center p-4 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-lg">
                <a href="https://www.instagram.com/boulevardzapallar/?hl=es" target="_blank" className="text-gray-400 hover:text-boulevard-red hover:scale-110 transition-all p-2 hover:bg-white/10 rounded-full"><Instagram className="w-6 h-6"/></a>
                <a href="#" className="text-gray-400 hover:text-blue-500 hover:scale-110 transition-all p-2 hover:bg-white/10 rounded-full"><Facebook className="w-6 h-6"/></a>
                <a href="https://waze.com/ul?q=Av.+Manuel+Labra+Lillo+430,+Curicó" target="_blank" className="text-gray-400 hover:text-green-500 hover:scale-110 transition-all p-2 hover:bg-white/10 rounded-full"><MapPin className="w-6 h-6"/></a>
            </div>
            
            <div className="flex flex-col items-center gap-4 text-center">
                <Link href="/admin/login" className="text-[9px] text-zinc-600 hover:text-zinc-400 uppercase tracking-[0.2em] transition-colors border border-white/5 px-5 py-2 rounded-full hover:bg-white/5 hover:border-white/20">
                    Staff Access Only
                </Link>
                <div className="flex flex-col gap-1">
                     <p className="text-[10px] text-zinc-500 font-bold tracking-[0.3em] uppercase">
                        Powered By <span className="text-boulevard-red glow-text">BAYX</span>
                    </p>
                    <p className="text-[9px] text-zinc-700">v2.5.0 Master Hub</p>
                </div>
            </div>
        </div>

      </div>

      {/* 7. BOTÓN FLOTANTE WHATSAPP (FIXED) */}
      <motion.a 
        href="https://wa.me/56995051248" 
        target="_blank" 
        initial={{ scale: 0, rotate: 180 }} 
        animate={{ scale: 1, rotate: 0 }} 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-8 right-6 z-50 p-4 bg-[#25D366] rounded-full shadow-[0_4px_30px_rgba(37,211,102,0.4)] border border-white/10 group cursor-pointer"
      >
        <WhatsAppIcon className="w-8 h-8 text-white group-hover:rotate-12 transition-transform" />
        <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full border-2 border-black animate-pulse"></span>
      </motion.a>

    </main>
  );
}