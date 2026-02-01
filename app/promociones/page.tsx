"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    ArrowLeft, Calendar, Clock, Gift, ShoppingCart, 
    Loader2, MapPin, ChevronRight, Info
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Montserrat } from "next/font/google";
import { useCart } from "@/components/CartContext";
import { supabase } from "@/lib/supabaseClient";

// Configuración de fuente
const montserrat = Montserrat({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800"] });

// Orden de los días para mostrarlos correctamente
const dayOrder: { [key: string]: number } = {
    "todos": 0,
    "Lunes": 1,
    "Martes": 2,
    "Miércoles": 3,
    "Jueves": 4,
    "Viernes": 5,
    "Sábado": 6,
    "Domingo": 7
};

export default function PromocionesPage() {
  const [activeTab, setActiveTab] = useState("semana"); // 'semana' | 'pack'
  const [currentDay, setCurrentDay] = useState("");
  
  // Estados de Datos
  const [heroPromo, setHeroPromo] = useState<any>(null); // El banner principal
  const [promos, setPromos] = useState<any[]>([]); // Lista de promos
  const [loading, setLoading] = useState(true);
  
  const { addItem } = useCart();

  useEffect(() => {
    const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    setCurrentDay(days[new Date().getDay()]);
    fetchPromos();
  }, []);

  // --- LEER DE SUPABASE ---
  const fetchPromos = async () => {
      try {
          const { data, error } = await supabase
            .from('promociones')
            .select('*')
            .eq('active', true);
          
          if (error) throw error;
          
          if (data) {
              const normalizedData = data.map(p => ({
                  ...p,
                  price: Number(p.price) || 0
              }));

              // 1. Extraer el Banner
              // Busca primero una categoría 'banner', si no, usa la más reciente destacada
              const bannerItem = normalizedData.find(p => p.category === 'banner');
              
              // 2. Filtrar el resto (que no sean banner)
              const listItems = normalizedData.filter(p => p.category !== 'banner');

              if (bannerItem) setHeroPromo(bannerItem);
              setPromos(listItems);
          }
      } catch (error) {
          console.error("Error cargando promociones:", error);
      } finally {
          setLoading(false);
      }
  };

  const handleAddToCart = (promo: any) => {
      addItem({
          id: `promo-${promo.id}`,
          name: promo.title,
          price: promo.price || 0,
          quantity: 1,
          image: promo.image_url,
          detail: "Promo Pack Web",
          category: "shop"
      });
  };

  // Filtrar y Ordenar Promociones
  const getFilteredPromos = () => {
      let filtered = promos.filter(p => p.category === activeTab);
      
      // Si es semana, ordenar por día
      if (activeTab === "semana") {
          filtered.sort((a, b) => {
              const dayA = dayOrder[a.day] || 99;
              const dayB = dayOrder[b.day] || 99;
              return dayA - dayB;
          });
      } else {
          // Si son packs, mostrar los más nuevos primero
          filtered.sort((a, b) => b.id - a.id);
      }
      return filtered;
  };

  const displayPromos = getFilteredPromos();

  return (
    <main className={`min-h-screen bg-black text-white pb-32 overflow-x-hidden ${montserrat.className}`}>
      
      {/* --- HEADER FLOTANTE --- */}
      <div className="fixed top-0 left-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-white/10 shadow-2xl transition-all duration-300">
          <div className="px-4 py-3 flex items-center justify-between max-w-7xl mx-auto">
            <Link href="/" className="p-2 bg-white/5 rounded-full hover:bg-white/20 transition-colors group">
                <ArrowLeft className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
            </Link>
            
            <div className="relative w-32 h-8 md:w-40 md:h-10"> 
                <Image src="/logo.png" alt="Boulevard Zapallar" fill className="object-contain" priority />
            </div>

            <div className="w-9 h-9 bg-[#DAA520]/10 rounded-full flex items-center justify-center border border-[#DAA520]/30 animate-pulse">
                <Gift className="w-4 h-4 text-[#DAA520]" />
            </div>
          </div>
      </div>

      {/* Espaciador para el header fijo */}
      <div className="h-20" />

      {/* --- HERO BANNER AUTOADMINISTRABLE (DISEÑO SHOWS) --- */}
      {loading ? (
         <div className="w-full h-[50vh] bg-zinc-900 animate-pulse mb-8" />
      ) : heroPromo ? (
        <div className="relative w-full h-[60vh] max-h-[600px] overflow-hidden group">
            {/* Imagen Full con Overlay cinemático */}
            <Image 
                src={heroPromo.image_url || "/placeholder.jpg"} 
                alt={heroPromo.title} 
                fill 
                className="object-cover transition-transform duration-1000 group-hover:scale-105" 
                priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            
            <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 flex flex-col items-start max-w-4xl mx-auto">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="flex flex-wrap gap-2 mb-4"
                >
                    <span className="bg-[#DAA520] text-black text-[10px] md:text-xs font-black px-3 py-1 rounded uppercase tracking-widest shadow-lg">
                        {heroPromo.tag || "DESTACADO"}
                    </span>
                    {heroPromo.day && (
                        <span className="bg-white/10 backdrop-blur-md text-white text-[10px] md:text-xs font-bold px-3 py-1 rounded uppercase tracking-wide border border-white/10">
                            {heroPromo.day === 'todos' ? 'Todos los días' : heroPromo.day}
                        </span>
                    )}
                </motion.div>
                
                <motion.h1 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-4xl md:text-6xl font-black text-white uppercase leading-[0.9] mb-3 drop-shadow-2xl"
                >
                    {heroPromo.title}
                </motion.h1>
                
                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-lg md:text-xl text-zinc-200 font-light max-w-xl leading-snug mb-6"
                >
                    {heroPromo.subtitle}
                </motion.p>

                {heroPromo.desc_text && (
                    <div className="flex items-center gap-3 text-sm text-zinc-300 bg-black/60 px-5 py-2.5 rounded-full backdrop-blur-md border border-white/10">
                        <Clock className="w-4 h-4 text-[#DAA520]" />
                        <span className="font-medium tracking-wide text-xs md:text-sm">{heroPromo.desc_text}</span>
                    </div>
                )}
            </div>
        </div>
      ) : (
        <div className="relative w-full h-64 bg-zinc-900 flex items-center justify-center mb-8 border-b border-white/5">
            <div className="text-center">
                <Gift className="w-12 h-12 text-zinc-700 mx-auto mb-2"/>
                <p className="text-zinc-500 text-sm">Configura un 'Banner Principal' en el dashboard.</p>
            </div>
        </div>
      )}

      {/* --- BARRA DE NAVEGACIÓN (ESTILO SHOWS) --- */}
      <div className="sticky top-[60px] z-40 bg-black/95 backdrop-blur-xl border-y border-white/10 shadow-2xl mb-8">
        <div className="max-w-5xl mx-auto px-4 py-3">
            <div className="flex gap-2 md:gap-4 overflow-x-auto no-scrollbar">
                <button 
                    onClick={() => setActiveTab("semana")}
                    className={`flex-1 min-w-[140px] py-3 px-6 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                        activeTab === "semana" 
                        ? 'bg-[#DAA520] text-black shadow-[0_0_15px_rgba(218,165,32,0.4)]' 
                        : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800 hover:text-white border border-white/5'
                    }`}
                >
                    <Calendar className="w-4 h-4" /> La Semana
                </button>
                <button 
                    onClick={() => setActiveTab("pack")}
                    className={`flex-1 min-w-[140px] py-3 px-6 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                        activeTab === "pack" 
                        ? 'bg-[#DAA520] text-black shadow-[0_0_15px_rgba(218,165,32,0.4)]' 
                        : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800 hover:text-white border border-white/5'
                    }`}
                >
                    <Gift className="w-4 h-4" /> Packs & Regalos
                </button>
            </div>
        </div>
      </div>

      {/* --- GRID DE PROMOCIONES (1080x1080) --- */}
      <div className="px-4 max-w-6xl mx-auto pb-16">
        {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Loader2 className="w-10 h-10 text-[#DAA520] animate-spin" />
                <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Cargando experiencias...</p>
            </div>
        ) : displayPromos.length === 0 ? (
            <div className="text-center py-24 bg-zinc-900/30 rounded-3xl border border-white/5 border-dashed">
                <Gift className="w-16 h-16 text-zinc-800 mx-auto mb-4" />
                <p className="text-zinc-500 text-sm font-medium">No hay promociones activas en esta categoría por el momento.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                <AnimatePresence mode="popLayout">
                    {displayPromos.map((promo, index) => (
                        <motion.div 
                            key={promo.id}
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                            className="bg-zinc-900 rounded-2xl overflow-hidden border border-white/10 shadow-lg hover:border-[#DAA520]/50 transition-all duration-300 group flex flex-col h-full"
                        >
                            {/* 1. IMAGEN 1:1 (ASPECT SQUARE) - SIN FILTROS OSCUROS */}
                            <div className="relative w-full aspect-square bg-zinc-950 overflow-hidden">
                                <Image 
                                    src={promo.image_url || "/placeholder.jpg"} 
                                    alt={promo.title} 
                                    fill 
                                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                />
                                
                                {/* Etiqueta Tag (Top Left) */}
                                {promo.tag && (
                                    <div className="absolute top-3 left-3 z-10">
                                        <span className="bg-[#DAA520] text-black text-[9px] font-black px-2.5 py-1 rounded shadow-lg uppercase tracking-wider">
                                            {promo.tag}
                                        </span>
                                    </div>
                                )}

                                {/* Badge de Día (Top Right) - Solo para 'semana' */}
                                {promo.category === "semana" && (
                                    <div className="absolute top-3 right-3 z-10 flex flex-col items-end">
                                        <span className={`text-[10px] font-black px-3 py-1 rounded border shadow-lg backdrop-blur-md uppercase tracking-wider ${
                                            promo.day === currentDay 
                                            ? 'bg-green-600 text-white border-green-500' 
                                            : 'bg-black/70 text-white border-white/20'
                                        }`}>
                                            {promo.day === 'todos' ? 'TODOS LOS DÍAS' : promo.day}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* 2. CONTENIDO (Panel Inferior) */}
                            <div className="p-5 flex flex-col flex-1 relative">
                                {/* Decoración dorada sutil */}
                                <div className="absolute top-0 left-5 w-10 h-0.5 bg-[#DAA520]" />

                                <div className="flex-1 mt-2">
                                    <h3 className="text-xl font-black text-white uppercase leading-none mb-1 group-hover:text-[#DAA520] transition-colors">
                                        {promo.title}
                                    </h3>
                                    {promo.subtitle && (
                                        <p className="text-xs text-zinc-400 font-bold uppercase tracking-wide mb-3">
                                            {promo.subtitle}
                                        </p>
                                    )}
                                    <p className="text-xs text-zinc-500 leading-relaxed line-clamp-3">
                                        {promo.desc_text}
                                    </p>
                                </div>

                                {/* Botones de Acción */}
                                <div className="mt-5 pt-4 border-t border-white/5">
                                    {promo.category === "pack" ? (
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1">
                                                <p className="text-[9px] text-zinc-500 uppercase font-bold">Valor Pack</p>
                                                <p className="text-lg font-black text-[#DAA520]">${promo.price?.toLocaleString('es-CL')}</p>
                                            </div>
                                            <button 
                                                onClick={() => handleAddToCart(promo)}
                                                className="bg-white text-black h-10 px-4 rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-zinc-200 transition-colors flex items-center gap-2"
                                            >
                                                <ShoppingCart className="w-3 h-3" /> Agregar
                                            </button>
                                        </div>
                                    ) : (
                                        <Link href="/reservas" className="block w-full">
                                            <button className="w-full h-10 bg-zinc-800 text-white border border-white/10 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-[#DAA520] hover:text-black hover:border-[#DAA520] transition-all flex items-center justify-center gap-2 group/btn">
                                                Reservar Mesa
                                                <ChevronRight className="w-3 h-3 text-[#DAA520] group-hover/btn:text-black transition-colors" />
                                            </button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        )}
      </div>

      {/* --- WHATSAPP FLOTANTE --- */}
      <a 
        href="https://wa.me/569XXXXXXXX" // REEMPLAZA CON TU NÚMERO
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] w-14 h-14 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(37,211,102,0.4)] hover:scale-110 transition-transform duration-300"
      >
        <svg viewBox="0 0 24 24" className="w-8 h-8 text-white fill-current" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
      </a>

      {/* --- INFO EXTRA --- */}
      <div className="px-6 text-center pb-8 border-t border-white/5 pt-8 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-zinc-900 rounded-full border border-white/10">
            <Info className="w-4 h-4 text-zinc-500" />
            <span className="text-[10px] text-zinc-500 font-medium tracking-wide uppercase">Imágenes referenciales • Sujeto a disponibilidad</span>
        </div>
      </div>

    </main>
  );
}