"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
    Search, Calendar, Gift, ArrowLeft, 
    ChevronRight, ShoppingCart, Filter, Loader2, Tag, Star
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Montserrat } from "next/font/google";
import { supabase } from "@/lib/supabaseClient";
import { useCart } from "@/components/CartContext";

// Usamos la misma fuente que en Shows para mantener la identidad
const montserrat = Montserrat({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800"] });

// Orden lógico para los días de la semana
const dayOrder: { [key: string]: number } = {
    "todos": 0, "Lunes": 1, "Martes": 2, "Miércoles": 3, 
    "Jueves": 4, "Viernes": 5, "Sábado": 6, "Domingo": 7
};

export default function PromocionesPage() {
  // --- ESTADOS ---
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("semana"); // 'semana' | 'pack'
  const [visibleCount, setVisibleCount] = useState(5); 
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Hook del Carrito
  const { addItem } = useCart();

  // --- CONEXIÓN A SUPABASE ---
  useEffect(() => {
    const fetchPromos = async () => {
        try {
            const { data, error } = await supabase
                .from('promociones')
                .select('*')
                .eq('active', true); // Solo traemos las activas
            
            if (error) throw error;

            if (data) {
                // Adaptamos los datos para que encajen en el diseño visual de "Shows"
                const normalizedData = data.map(p => ({
                    id: p.id,
                    title: p.title, // Título principal
                    subtitle: p.subtitle || "Promoción Exclusiva", // Subtítulo
                    desc_text: p.desc_text,
                    category: p.category, // 'semana' o 'pack'
                    
                    // LÓGICA DE VISUALIZACIÓN (Mapeo a diseño de Shows)
                    // Si es Pack -> Mostramos Precio. Si es Semana -> Mostramos Día.
                    mainInfo: p.category === 'pack' 
                        ? `$${(Number(p.price) || 0).toLocaleString('es-CL')}` 
                        : (p.day === 'todos' ? 'TODOS' : p.day?.substring(0, 3).toUpperCase()),
                    
                    subInfo: p.category === 'pack' ? 'CLP' : 'DÍA',
                    
                    image: p.image_url || "/placeholder.jpg",
                    tag: p.tag || "", // "DESTACADO", "NUEVO", etc.
                    dayFull: p.day,
                    priceRaw: Number(p.price) || 0
                }));
                setPromos(normalizedData);
            }
        } catch (error) {
            console.error("Error cargando promociones:", error);
        } finally {
            setLoading(false);
        }
    };

    fetchPromos();
  }, []);

  // --- FILTRADO ---
  const filteredPromos = promos.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTab = p.category === activeTab;
      return matchesSearch && matchesTab;
  });

  // --- ORDENAMIENTO ---
  const sortedPromos = [...filteredPromos].sort((a, b) => {
      if (activeTab === "semana") {
          const dayA = dayOrder[a.dayFull] || 99;
          const dayB = dayOrder[b.dayFull] || 99;
          return dayA - dayB;
      }
      // Packs: Los más nuevos primero (por ID asumiendo autoincrement)
      return b.id - a.id; 
  });

  const visiblePromos = sortedPromos.slice(0, visibleCount);

  // --- MANEJADORES ---
  const handleLoadMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
        setVisibleCount(prev => prev + 4);
        setIsLoadingMore(false);
    }, 800); 
  };

  const handleAddToCart = (e: any, promo: any) => {
      e.preventDefault(); 
      e.stopPropagation();
      addItem({
          id: `promo-${promo.id}`,
          name: promo.title,
          price: promo.priceRaw,
          quantity: 1,
          image: promo.image,
          detail: "Promo Web",
          category: "shop"
      });
  };

  return (
    <main className={`min-h-screen bg-black text-white pb-24 overflow-x-hidden ${montserrat.className}`}>
      
      {/* --- HEADER (EXACTAMENTE IGUAL A SHOWS) --- */}
      <div className="bg-black/90 backdrop-blur-md px-4 py-4 flex items-center justify-between sticky top-0 z-50 border-b border-white/10 shadow-xl transition-all">
        <Link href="/" className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
            <ArrowLeft className="w-5 h-5 text-white" />
        </Link>
        
        {/* Logo Central */}
        <div className="relative w-48 h-12 md:w-60 md:h-16"> 
            <Image src="/logo.png" alt="Boulevard Zapallar" fill className="object-contain" priority />
        </div>

        {/* Icono de Acción (Regalo para promos) */}
        <button className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
            <Gift className="w-5 h-5 text-[#DAA520]" />
        </button>
      </div>

      {/* --- HERO CARRUSEL (SLIDER SUPERIOR) --- */}
      <div className="relative w-full h-96 overflow-hidden bg-black mb-6 border-b border-white/5">
        {loading ? (
            <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#DAA520] animate-spin"/>
            </div>
        ) : promos.length > 0 ? (
            <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide h-full">
                {/* Filtramos para mostrar primero los DESTACADOS en el banner */}
                {promos.filter(p => p.tag === 'DESTACADO' || p.tag === 'BANNER').concat(promos).slice(0, 4).map((promo, index) => (
                    <div key={`hero-${promo.id}-${index}`} className="snap-center min-w-full relative h-full">
                        <div className="relative w-full h-full">
                            {/* Imagen de Fondo */}
                            <Image src={promo.image} alt={promo.title} fill className="object-cover opacity-80" priority={index === 0} />
                            
                            {/* Degradado Cinematográfico */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                            
                            {/* Contenido del Hero */}
                            <div className="absolute bottom-0 left-0 right-0 p-6 pb-10 max-w-4xl mx-auto">
                                {promo.tag && (
                                    <span className="bg-[#DAA520] text-black text-[10px] font-black px-3 py-1 rounded mb-3 inline-flex items-center gap-1 uppercase tracking-widest shadow-lg">
                                        <Star className="w-3 h-3 fill-black"/> {promo.tag}
                                    </span>
                                )}
                                <h2 className="text-4xl md:text-5xl font-black text-white uppercase leading-[0.9] mb-2 drop-shadow-2xl">
                                    {promo.title}
                                </h2>
                                <p className="text-sm md:text-base text-zinc-200 font-medium mb-4 max-w-xl leading-snug">
                                    {promo.subtitle}
                                </p>
                                
                                {/* Metadata del Hero */}
                                <div className="flex items-center gap-4 text-xs font-bold tracking-wide">
                                    <span className="text-[#DAA520] flex items-center gap-1 uppercase">
                                        {promo.category === 'pack' ? (
                                            <><Tag className="w-4 h-4"/> Precio Web: {promo.mainInfo}</>
                                        ) : (
                                            <><Calendar className="w-4 h-4"/> Disponible: {promo.dayFull}</>
                                        )}
                                    </span>
                                    <span className="text-zinc-500">•</span>
                                    <span className="text-zinc-300">Boulevard Zapallar</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-500">
                <p>Cargando destacados...</p>
            </div>
        )}
      </div>

      {/* --- MARQUEE (PRÓXIMOS HITS / PACKS TOP) --- */}
      {!loading && promos.length > 0 && (
          <div className="mb-10 overflow-hidden relative">
            <h3 className="px-4 text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Lo más vendido</h3>
            <div className="flex gap-4 w-[200%] animate-marquee hover:pause px-4">
                {[...promos, ...promos].slice(0, 10).map((p, index) => (
                    <div key={`mq-${p.id}-${index}`} className="min-w-[160px] h-28 relative rounded-xl overflow-hidden border border-white/10 group shadow-lg shrink-0 cursor-pointer">
                        <Image src={p.image} alt={p.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/40 flex items-end p-3">
                            <span className="text-[10px] font-bold text-white leading-tight uppercase truncate w-full drop-shadow-md">
                                {p.title}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
          </div>
      )}

      {/* --- BUSCADOR --- */}
      <div className="px-4 mb-6">
        <div className="relative group max-w-4xl mx-auto">
            <input 
                type="text" 
                placeholder="Buscar sushi, tragos, promos..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#DAA520] focus:ring-1 focus:ring-[#DAA520] transition-all shadow-inner"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-[#DAA520] transition-colors" />
        </div>
      </div>

      {/* --- TABS DE FILTRO (DISEÑO SHOWS) --- */}
      <div className="px-4 mb-8 max-w-4xl mx-auto">
        <div className="flex gap-2 p-1 bg-zinc-900 rounded-xl border border-zinc-800 shadow-lg">
            {['semana', 'pack'].map((tab) => (
                <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-3 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${
                        activeTab === tab 
                        ? 'bg-[#DAA520] text-black shadow-md transform scale-[1.02]' 
                        : 'text-zinc-500 hover:text-white'
                    }`}
                >
                    {tab === 'semana' ? 'Esta Semana' : 'Packs & Regalos'}
                </button>
            ))}
        </div>
      </div>

      {/* --- LISTADO PRINCIPAL (DISEÑO HORIZONTAL IDENTICO A TICKETS) --- */}
      <div className="px-4 space-y-4 pb-12 max-w-4xl mx-auto">
        {loading ? (
             <div className="text-center py-16 text-zinc-500">
                <Loader2 className="w-10 h-10 mx-auto mb-4 animate-spin text-[#DAA520]" />
                <p className="text-xs font-bold uppercase tracking-widest">Cargando experiencias...</p>
            </div>
        ) : visiblePromos.length > 0 ? (
            visiblePromos.map((promo) => (
                <div key={promo.id} className="relative group">
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        // CLASES IDENTICAS A LA CARD DE SHOWS (h-36, bg-zinc-900, etc.)
                        className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 flex h-36 relative active:scale-[0.98] transition-transform mb-4 shadow-xl hover:border-[#DAA520]/30"
                    >
                        {/* TAG SUPERIOR (Ej: DESTACADO) */}
                        {promo.tag && (
                            <div className="absolute top-0 left-0 z-20 bg-[#DAA520] text-black text-[8px] font-extrabold px-3 py-1 rounded-br-lg uppercase tracking-wider shadow-md">
                                {promo.tag}
                            </div>
                        )}

                        {/* 1. IMAGEN (Izquierda) */}
                        <div className="w-32 md:w-40 relative shrink-0 overflow-hidden">
                            <Image 
                                src={promo.image} 
                                alt={promo.title} 
                                fill 
                                className="object-cover opacity-90 group-hover:scale-110 transition-transform duration-700" 
                            />
                            {/* Gradiente lateral para fundir con el texto */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-zinc-900/95" />
                        </div>

                        {/* 2. CONTENIDO (Derecha) */}
                        <div className="flex-1 p-4 pl-2 flex flex-col justify-between relative">
                            {/* Encabezado de la Card */}
                            <div>
                                <div className="flex items-center gap-1 text-[9px] text-zinc-400 font-bold uppercase tracking-wider mb-1">
                                    {activeTab === 'semana' ? (
                                        <><Calendar className="w-3 h-3 text-[#DAA520]" /> Disponible: {promo.dayFull}</>
                                    ) : (
                                        <><Tag className="w-3 h-3 text-[#DAA520]" /> Pack Web</>
                                    )}
                                </div>
                                <h3 className="text-sm md:text-base font-black text-white uppercase leading-tight line-clamp-2 mb-1 group-hover:text-[#DAA520] transition-colors">
                                    {promo.title}
                                </h3>
                                {/* Descripción breve opcional */}
                                {promo.desc_text && (
                                    <p className="text-[10px] text-zinc-500 line-clamp-1">{promo.desc_text}</p>
                                )}
                            </div>

                            {/* Footer de la Card (Separador y Datos) */}
                            <div className="flex items-end justify-between border-t border-white/5 pt-2 mt-1">
                                <div className="flex items-center gap-3">
                                    {/* BLOQUE DE DATO PRINCIPAL (Donde iba la fecha en Shows) */}
                                    <div className="flex flex-col items-center justify-center leading-none pr-3 border-r border-white/10 min-w-[3.5rem]">
                                        {/* Dato Grande (Precio o Día) */}
                                        <span className={`font-black text-white tracking-tighter ${activeTab === 'pack' ? 'text-sm' : 'text-xl'}`}>
                                            {promo.mainInfo}
                                        </span>
                                        {/* Dato Pequeño (CLP o TIPO) */}
                                        <span className="text-[8px] font-bold text-[#DAA520] uppercase mt-0.5">
                                            {promo.subInfo}
                                        </span>
                                    </div>
                                    
                                    {/* Subtexto (Nombre del local o Subtítulo) */}
                                    <div className="flex flex-col leading-none">
                                        <span className="text-[10px] text-zinc-400 font-medium line-clamp-1">
                                            Boulevard Zapallar
                                        </span>
                                    </div>
                                </div>

                                {/* BOTÓN DE ACCIÓN CIRCULAR */}
                                {activeTab === 'pack' ? (
                                    <button 
                                        onClick={(e) => handleAddToCart(e, promo)}
                                        className="bg-white text-black w-9 h-9 rounded-full hover:bg-[#DAA520] transition-all flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.1)] group/btn"
                                    >
                                        <ShoppingCart className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                                    </button>
                                ) : (
                                    <Link href="/reservas" className="bg-zinc-800 border border-white/10 text-white w-9 h-9 rounded-full hover:bg-[#DAA520] hover:text-black hover:border-[#DAA520] transition-all flex items-center justify-center group/btn">
                                        <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-0.5 transition-transform" />
                                    </Link>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            ))
        ) : (
            <div className="text-center py-10 bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-800">
                <Filter className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm text-zinc-500">No hay promociones disponibles.</p>
            </div>
        )}

        {/* --- BOTÓN VER MÁS --- */}
        {visibleCount < filteredPromos.length && (
            <div className="mt-8 flex justify-center">
                <button 
                    onClick={handleLoadMore}
                    className="bg-zinc-800 text-white px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest border border-zinc-700 hover:bg-[#DAA520] hover:text-black transition-all flex items-center gap-2"
                    disabled={isLoadingMore}
                >
                    {isLoadingMore ? <Loader2 className="w-4 h-4 animate-spin"/> : "Cargar más"}
                </button>
            </div>
        )}
      </div>

      <style jsx>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 30s linear infinite; }
        .hover\:pause:hover { animation-play-state: paused; }
      `}</style>
    </main>
  );
}