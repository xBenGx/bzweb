"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    ArrowLeft, Calendar, Clock, Gift, Percent, 
    Utensils, Info, Star, Flame, ShoppingCart, 
    PartyPopper, Loader2
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Montserrat } from "next/font/google";
// Importamos el hook del carrito
import { useCart } from "@/components/CartContext";
import { supabase } from "@/lib/supabaseClient"; // Conexión Real

const montserrat = Montserrat({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });

export default function PromocionesPage() {
  const [activeTab, setActiveTab] = useState("semana"); // semana | pack
  const [currentDay, setCurrentDay] = useState("");
  const [promos, setPromos] = useState<any[]>([]); // Estado para datos de DB
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart(); // Conexión al carrito

  useEffect(() => {
    const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    setCurrentDay(days[new Date().getDay()]);
    fetchPromos();
  }, []);

  // --- FUNCIÓN PARA LEER DE SUPABASE ---
  const fetchPromos = async () => {
      try {
          const { data, error } = await supabase
            .from('promociones')
            .select('*')
            .eq('active', true) // Solo mostrar las activas
            .order('id', { ascending: true }); // Mantener el orden de inserción
          
          if (error) throw error;
          
          if (data) {
              // Normalizamos los datos por si acaso (aunque la estructura SQL ya es correcta)
              const normalizedData = data.map(p => ({
                  ...p,
                  price: Number(p.price) || 0 // Asegurar que price sea número
              }));
              setPromos(normalizedData);
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
          detail: "Promo Pack",
          category: "shop"
      });
  };

  const filteredPromos = promos.filter(p => p.category === activeTab);

  return (
    <main className={`min-h-screen bg-black text-white pb-32 overflow-x-hidden ${montserrat.className}`}>
      
      {/* --- HEADER --- */}
      <div className="bg-black/90 backdrop-blur-md px-4 py-4 flex items-center justify-between sticky top-0 z-50 border-b border-white/10 shadow-xl">
        <Link href="/" className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
            <ArrowLeft className="w-5 h-5 text-white" />
        </Link>
        
        {/* LOGO AUMENTADO */}
        <div className="relative w-60 h-16"> 
            <Image src="/logo.png" alt="Boulevard Zapallar" fill className="object-contain" priority />
        </div>

        <div className="w-9 h-9 bg-zinc-800 rounded-full flex items-center justify-center border border-white/5">
            <Gift className="w-4 h-4 text-[#DAA520]" />
        </div>
      </div>

      {/* --- HERO BANNER (Carrusel Automático Visual) --- */}
      <div className="relative w-full h-72 overflow-hidden bg-zinc-900 mb-6 group">
        <Image 
            src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=1470&auto=format&fit=crop" 
            alt="Happy Hour" 
            fill 
            className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        
        <div className="absolute bottom-0 left-0 p-6 w-full">
            <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.2 }}
                className="bg-[#DAA520] text-black text-[10px] font-extrabold px-3 py-1 rounded w-fit mb-2 uppercase tracking-widest shadow-lg"
            >
                Happy Hour
            </motion.div>
            <h1 className="text-4xl font-bold text-white uppercase leading-none mb-2 drop-shadow-lg">
                2x1 <br/><span className="text-zinc-400">En Tragos</span>
            </h1>
            <div className="flex items-center gap-2 text-sm text-zinc-300 bg-black/40 w-fit px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
                <Clock className="w-4 h-4 text-[#DAA520]" />
                <span className="font-medium text-xs">Horario por definir</span>
            </div>
        </div>
      </div>

      {/* --- TABS DE NAVEGACIÓN --- */}
      <div className="px-4 mb-6">
        <div className="flex p-1 bg-zinc-900 rounded-xl border border-white/10">
            <button 
                onClick={() => setActiveTab("semana")}
                className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === "semana" ? 'bg-[#DAA520] text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
            >
                <Calendar className="w-3 h-3" /> Semana
            </button>
            <button 
                onClick={() => setActiveTab("pack")}
                className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === "pack" ? 'bg-[#DAA520] text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
            >
                <Gift className="w-3 h-3" /> Packs & Regalos
            </button>
        </div>
      </div>

      {/* --- CONTENIDO DINÁMICO (DESDE DB) --- */}
      <div className="px-4 space-y-4 pb-8">
        {loading ? (
            <div className="flex justify-center py-10">
                <Loader2 className="w-8 h-8 text-[#DAA520] animate-spin" />
            </div>
        ) : filteredPromos.length === 0 ? (
            <p className="text-center text-zinc-500 py-10">No hay promociones disponibles en esta categoría.</p>
        ) : (
            <AnimatePresence mode="wait">
                {filteredPromos.map((promo) => (
                    <motion.div 
                        key={promo.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        // Resaltar si es el día actual y es categoría semana
                        className={`relative overflow-hidden rounded-2xl border transition-all ${
                            promo.category === "semana" && promo.day === currentDay 
                            ? 'border-[#DAA520] shadow-[0_0_20px_rgba(218,165,32,0.2)]' 
                            : 'border-white/10'
                        } bg-zinc-900`}
                    >
                        {/* Imagen de Fondo con Overlay */}
                        <div className="relative h-32 w-full">
                            <Image 
                                src={promo.image_url || "/placeholder.jpg"} 
                                alt={promo.title} 
                                fill 
                                className="object-cover opacity-50" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
                            
                            {/* Contenido sobre la imagen */}
                            <div className="absolute inset-0 p-4 flex flex-col justify-center items-start z-10 pl-24">
                                {promo.tag && (
                                    <span className="text-[8px] font-extrabold bg-[#DAA520] text-black px-2 py-0.5 rounded mb-1 uppercase tracking-wider shadow-md">
                                        {promo.tag}
                                    </span>
                                )}
                                <h3 className="text-xl font-bold text-white uppercase leading-none mb-1 drop-shadow-md">
                                    {promo.title}
                                </h3>
                                <p className="text-xs text-[#DAA520] font-medium uppercase tracking-wide mb-2">
                                    {promo.subtitle}
                                </p>
                            </div>

                            {/* Icono del día o Pack (Izquierda) */}
                            <div className="absolute left-0 top-0 bottom-0 w-20 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center border-r border-white/5 z-20">
                                {promo.category === "semana" ? (
                                    <>
                                        <span className={`text-2xl font-black ${promo.day === currentDay ? 'text-[#DAA520]' : 'text-zinc-600'}`}>
                                            {promo.day?.substring(0, 3).toUpperCase()}
                                        </span>
                                        {promo.day === currentDay && (
                                            <span className="text-[8px] text-white bg-red-600 px-1.5 py-0.5 rounded mt-1 animate-pulse font-bold">
                                                HOY
                                            </span>
                                        )}
                                    </>
                                ) : (
                                    <Gift className="w-8 h-8 text-[#DAA520]" />
                                )}
                            </div>
                        </div>

                        {/* Descripción y Acción (Footer de la tarjeta) */}
                        <div className="p-4 bg-zinc-900 border-t border-white/5">
                            <p className="text-xs text-zinc-400 leading-relaxed mb-4 line-clamp-2">
                                {promo.desc_text}
                            </p>
                            
                            {promo.category === "pack" ? (
                                <button 
                                    onClick={() => handleAddToCart(promo)}
                                    className="w-full py-3 bg-white text-black font-bold uppercase text-xs rounded-xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md"
                                >
                                    <ShoppingCart className="w-3 h-3" /> Agregar • ${promo.price?.toLocaleString('es-CL')}
                                </button>
                            ) : (
                                <Link href="/reservas" className="block w-full">
                                    <button className="w-full py-3 bg-zinc-800 text-[#DAA520] font-bold uppercase text-xs rounded-xl border border-[#DAA520]/30 hover:bg-[#DAA520]/10 transition-colors flex items-center justify-center gap-2 active:scale-95">
                                        <Calendar className="w-3 h-3" /> Reservar Mesa
                                    </button>
                                </Link>
                            )}
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        )}
      </div>

      {/* --- INFO EXTRA --- */}
      <div className="px-6 text-center pb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 rounded-full border border-white/10">
            <Info className="w-3 h-3 text-zinc-500" />
            <span className="text-[10px] text-zinc-500">Promociones no acumulables con otras ofertas.</span>
        </div>
      </div>

    </main>
  );
}