"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    ArrowLeft, Calendar, Clock, Gift, Percent, 
    Utensils, Info, Star, Flame, ShoppingCart, 
    PartyPopper, Loader2, MapPin, ChevronRight
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Montserrat } from "next/font/google";
import { useCart } from "@/components/CartContext";
import { supabase } from "@/lib/supabaseClient";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });

export default function PromocionesPage() {
  const [activeTab, setActiveTab] = useState("semana"); // semana | pack
  const [currentDay, setCurrentDay] = useState("");
  
  // Estados de Datos
  const [heroPromo, setHeroPromo] = useState<any>(null); // El banner principal
  const [promos, setPromos] = useState<any[]>([]); // Lista de promos normales
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
            .eq('active', true)
            .order('id', { ascending: false }); // Las más nuevas primero
          
          if (error) throw error;
          
          if (data) {
              const normalizedData = data.map(p => ({
                  ...p,
                  price: Number(p.price) || 0
              }));

              // 1. Separar el Banner (Categoría 'banner')
              const bannerItem = normalizedData.find(p => p.category === 'banner');
              // 2. El resto son promos normales
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

  // Filtrado de lista (excluyendo el banner que ya se muestra arriba)
  const filteredPromos = promos.filter(p => p.category === activeTab);

  return (
    <main className={`min-h-screen bg-black text-white pb-32 overflow-x-hidden ${montserrat.className}`}>
      
      {/* --- HEADER --- */}
      <div className="bg-black/80 backdrop-blur-xl px-4 py-4 flex items-center justify-between sticky top-0 z-50 border-b border-white/5">
        <Link href="/" className="p-2 bg-white/5 rounded-full hover:bg-white/20 transition-colors">
            <ArrowLeft className="w-5 h-5 text-white" />
        </Link>
        <div className="relative w-48 h-10"> 
            <Image src="/logo.png" alt="Boulevard Zapallar" fill className="object-contain" priority />
        </div>
        <div className="w-9 h-9 bg-[#DAA520]/10 rounded-full flex items-center justify-center border border-[#DAA520]/30">
            <Gift className="w-4 h-4 text-[#DAA520]" />
        </div>
      </div>

      {/* --- HERO BANNER AUTOADMINISTRABLE --- */}
      {/* Si existe heroPromo en DB lo muestra, si no, muestra un fallback o nada */}
      {loading ? (
         <div className="w-full h-72 bg-zinc-900 animate-pulse" />
      ) : heroPromo ? (
        <div className="relative w-full h-[60vh] max-h-[500px] overflow-hidden bg-zinc-900 mb-8 group border-b border-[#DAA520]/20">
            <Image 
                src={heroPromo.image_url || "/placeholder.jpg"} 
                alt={heroPromo.title} 
                fill 
                className="object-cover opacity-80 group-hover:scale-105 transition-transform duration-1000" 
            />
            {/* Gradiente sutil solo abajo para texto */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            
            <div className="absolute bottom-0 left-0 p-6 w-full max-w-lg">
                <motion.div 
                    initial={{ opacity: 0, x: -20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    className="flex gap-2 mb-3"
                >
                    {heroPromo.tag && (
                        <span className="bg-[#DAA520] text-black text-[10px] font-black px-3 py-1 rounded-sm uppercase tracking-widest shadow-lg">
                            {heroPromo.tag}
                        </span>
                    )}
                </motion.div>
                
                <h1 className="text-4xl md:text-5xl font-black text-white uppercase leading-none mb-2 drop-shadow-xl">
                    {heroPromo.title}
                </h1>
                <p className="text-lg text-zinc-200 mb-4 font-light leading-tight">{heroPromo.subtitle}</p>
                
                {heroPromo.desc_text && (
                    <div className="flex items-center gap-2 text-sm text-zinc-300 bg-black/60 w-fit px-4 py-2 rounded-full backdrop-blur-md border border-white/10">
                        <Clock className="w-4 h-4 text-[#DAA520]" />
                        <span className="font-medium text-xs">{heroPromo.desc_text}</span>
                    </div>
                )}
            </div>
        </div>
      ) : (
        // Fallback por si no hay banner configurado
        <div className="relative w-full h-48 bg-zinc-900 flex items-center justify-center mb-6">
            <p className="text-zinc-500 text-xs">Configura una promo categoría 'banner' en el admin</p>
        </div>
      )}

      {/* --- TABS DE NAVEGACIÓN --- */}
      <div className="px-4 mb-8 sticky top-20 z-40">
        <div className="flex p-1.5 bg-zinc-900/90 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl">
            <button 
                onClick={() => setActiveTab("semana")}
                className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === "semana" ? 'bg-[#DAA520] text-black shadow-lg scale-100' : 'text-zinc-500 hover:text-white scale-95'}`}
            >
                <Calendar className="w-4 h-4" /> La Semana
            </button>
            <button 
                onClick={() => setActiveTab("pack")}
                className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === "pack" ? 'bg-[#DAA520] text-black shadow-lg scale-100' : 'text-zinc-500 hover:text-white scale-95'}`}
            >
                <Gift className="w-4 h-4" /> Packs
            </button>
        </div>
      </div>

      {/* --- CONTENIDO DINÁMICO (GRID 1080x1080) --- */}
      <div className="px-4 pb-12 max-w-5xl mx-auto">
        {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-10 h-10 text-[#DAA520] animate-spin" />
                <p className="text-xs text-zinc-500 uppercase tracking-widest">Cargando promociones...</p>
            </div>
        ) : filteredPromos.length === 0 ? (
            <div className="text-center py-20 bg-zinc-900/50 rounded-3xl border border-white/5">
                <Gift className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-500 text-sm">No hay promociones activas en esta categoría.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <AnimatePresence mode="popLayout">
                    {filteredPromos.map((promo) => (
                        <motion.div 
                            key={promo.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3 }}
                            // Diseño de Tarjeta Limpia
                            className="bg-zinc-900 rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl flex flex-col"
                        >
                            {/* 1. IMAGEN CUADRADA (1080x1080 Aspect Ratio) - SIN DEGRADADOS */}
                            <div className="relative w-full aspect-square bg-black">
                                <Image 
                                    src={promo.image_url || "/placeholder.jpg"} 
                                    alt={promo.title} 
                                    fill 
                                    className="object-cover" // Se muestra tal cual es, sin opacidad
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                />
                                
                                {/* Badge de Día (Flotante) */}
                                {promo.category === "semana" && (
                                    <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md text-white px-4 py-2 rounded-xl border border-white/10 shadow-xl flex flex-col items-center">
                                        <span className={`text-2xl font-black uppercase tracking-tighter ${promo.day === currentDay ? 'text-[#DAA520]' : 'text-zinc-400'}`}>
                                            {promo.day?.substring(0, 3)}
                                        </span>
                                        {promo.day === currentDay && <span className="text-[8px] text-green-400 font-bold uppercase tracking-widest">Hoy</span>}
                                    </div>
                                )}

                                {/* Etiqueta Tag (Flotante) */}
                                {promo.tag && (
                                    <div className="absolute top-4 left-4">
                                        <span className="bg-[#DAA520] text-black text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider shadow-lg">
                                            {promo.tag}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* 2. CONTENIDO (Panel Inferior Limpio) */}
                            <div className="p-6 flex flex-col flex-1">
                                <div className="flex-1">
                                    <h3 className="text-2xl font-bold text-white uppercase leading-none mb-2">
                                        {promo.title}
                                    </h3>
                                    <p className="text-sm text-[#DAA520] font-medium uppercase tracking-wide mb-4">
                                        {promo.subtitle}
                                    </p>
                                    <div className="h-px w-full bg-white/10 mb-4" />
                                    <p className="text-xs text-zinc-400 leading-relaxed">
                                        {promo.desc_text}
                                    </p>
                                </div>

                                {/* Botones de Acción */}
                                <div className="mt-6">
                                    {promo.category === "pack" ? (
                                        <div className="flex gap-3 items-center">
                                            <div className="flex-1">
                                                <p className="text-[10px] text-zinc-500 uppercase font-bold">Precio Pack</p>
                                                <p className="text-xl font-bold text-white">${promo.price?.toLocaleString('es-CL')}</p>
                                            </div>
                                            <button 
                                                onClick={() => handleAddToCart(promo)}
                                                className="flex-1 py-3.5 bg-white text-black font-bold uppercase text-xs rounded-xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg"
                                            >
                                                <ShoppingCart className="w-4 h-4" /> Comprar
                                            </button>
                                        </div>
                                    ) : (
                                        <Link href="/reservas" className="block w-full">
                                            <button className="w-full py-4 bg-[#DAA520] text-black font-bold uppercase text-xs rounded-xl hover:bg-[#B8860B] transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-[#DAA520]/10">
                                                <Calendar className="w-4 h-4" /> Reservar para {promo.day}
                                                <ChevronRight className="w-4 h-4 opacity-50" />
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

      {/* --- INFO EXTRA --- */}
      <div className="px-6 text-center pb-8">
        <div className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 rounded-full border border-white/5">
            <Info className="w-4 h-4 text-zinc-600" />
            <span className="text-[10px] text-zinc-500 font-medium">Imágenes referenciales. Promociones sujetas a disponibilidad.</span>
        </div>
      </div>

    </main>
  );
}