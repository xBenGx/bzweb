"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Search, Calendar, ArrowLeft, 
    ChevronRight, Gift, Filter, Loader2, 
    Tag, ShoppingCart, Star, MapPin, Clock 
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Montserrat } from "next/font/google";
import { supabase } from "@/lib/supabaseClient";
import { useCart } from "@/components/CartContext";

// Configuración de fuente idéntica a Tickets
const montserrat = Montserrat({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800"] });

// Orden lógico de días para ordenar la lista 'semana'
const dayOrder: { [key: string]: number } = {
    "todos": 0, "Lunes": 1, "Martes": 2, "Miércoles": 3, 
    "Jueves": 4, "Viernes": 5, "Sábado": 6, "Domingo": 7
};

export default function PromocionesPage() {
  // ---------------------------------------------------------------------------
  // 1. ESTADOS Y HOOKS
  // ---------------------------------------------------------------------------
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("semana"); // 'semana' | 'pack'
  const [visibleCount, setVisibleCount] = useState(5); 
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const { addItem } = useCart();

  // ---------------------------------------------------------------------------
  // 2. CARGA DE DATOS DESDE SUPABASE
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const fetchPromos = async () => {
        try {
            // Solicitamos solo promociones activas
            const { data, error } = await supabase
                .from('promociones')
                .select('*')
                .eq('active', true)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                // Normalizamos los datos para que la UI no tenga errores
                const mappedPromos = data.map(p => ({
                    id: p.id,
                    title: p.title,
                    subtitle: p.subtitle || p.desc_text || "Promoción Especial",
                    image: p.image_url || "/placeholder.jpg",
                    tag: p.tag || "", 
                    category: p.category, // 'semana' o 'pack'
                    day: p.day, // Ej: 'Viernes' o 'todos'
                    price: Number(p.price) || 0,
                    description: p.desc_text,
                    
                    // PRE-CALCULO PARA DISEÑO VISUAL (Card Estilo Ticket)
                    // CAMBIO: Formato de precio completo (Ej: $150.000.-) en vez de K
                    displayMain: p.category === 'pack' 
                        ? `$${(Number(p.price)).toLocaleString('es-CL')}.-` 
                        : (p.day === 'todos' ? 'ALL' : p.day?.substring(0, 3).toUpperCase()), // Ej: VIE
                    
                    displaySub: p.category === 'pack' ? 'VALOR' : 'DÍA'
                }));
                setPromos(mappedPromos);
            }
        } catch (error) {
            console.error("Error cargando promociones:", error);
        } finally {
            setLoading(false);
        }
    };

    fetchPromos();
  }, []);

  // ---------------------------------------------------------------------------
  // 3. LÓGICA DE FILTRADO Y ORDENAMIENTO
  // ---------------------------------------------------------------------------
  const filteredPromos = promos.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTab = p.category === activeTab;
      return matchesSearch && matchesTab;
  });

  // Ordenar: Semana por día lógico, Packs por novedad (ID)
  const sortedPromos = [...filteredPromos].sort((a, b) => {
      if (activeTab === "semana") {
          const dayA = dayOrder[a.day] || 99;
          const dayB = dayOrder[b.day] || 99;
          return dayA - dayB;
      }
      return b.id - a.id;
  });

  const visiblePromos = sortedPromos.slice(0, visibleCount);

  // ---------------------------------------------------------------------------
  // 4. MANEJADORES DE INTERACCIÓN
  // ---------------------------------------------------------------------------
  const handleLoadMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
        setVisibleCount(prev => prev + 5);
        setIsLoadingMore(false);
    }, 800); 
  };

  const handleAddToCart = (e: React.MouseEvent, promo: any) => {
      e.preventDefault(); 
      e.stopPropagation(); // Evita navegar si hay un Link padre
      addItem({
          id: `promo-${promo.id}`,
          name: promo.title,
          price: promo.price,
          quantity: 1,
          image: promo.image,
          detail: "Promo Web",
          category: "shop"
      });
  };

  // ---------------------------------------------------------------------------
  // 5. RENDERIZADO (UI)
  // ---------------------------------------------------------------------------
  return (
    <main className={`min-h-screen bg-black text-white pb-32 overflow-x-hidden ${montserrat.className}`}>
      
      {/* --- HEADER --- */}
      <div className="bg-black/90 backdrop-blur-md px-4 py-4 flex items-center justify-between sticky top-0 z-50 border-b border-white/10 shadow-xl transition-all">
        <Link href="/" className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors group">
            <ArrowLeft className="w-5 h-5 text-white group-hover:text-[#DAA520] transition-colors" />
        </Link>
        
        {/* LOGO */}
        <div className="relative w-48 h-12 md:w-60 md:h-16"> 
            <Image src="/logo.png" alt="Boulevard Zapallar" fill className="object-contain" priority />
        </div>

        {/* ICONO ACCIÓN */}
        <div className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors animate-pulse">
            <Gift className="w-5 h-5 text-[#DAA520]" />
        </div>
      </div>

      {/* --- HERO CARRUSEL (DESTACADOS) --- */}
      <div className="relative w-full h-80 md:h-96 overflow-hidden bg-black mb-6 border-b border-white/5">
        {loading ? (
            <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#DAA520] animate-spin"/>
            </div>
        ) : promos.length > 0 ? (
            <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide h-full">
                {/* Mostramos primero los que tengan tag DESTACADO, luego el resto */}
                {promos
                    .sort((a, b) => (b.tag === 'DESTACADO' ? 1 : -1))
                    .slice(0, 5)
                    .map((promo, index) => (
                    <div key={`hero-${promo.id}-${index}`} className="snap-center min-w-full relative h-full">
                        <Link href={promo.category === 'pack' ? '#' : '/reservas'}>
                            <div className="relative w-full h-full">
                                <Image src={promo.image} alt={promo.title} fill className="object-cover opacity-80" priority={index === 0} />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                                
                                <div className="absolute bottom-0 left-0 right-0 p-6 pb-10 max-w-4xl mx-auto">
                                    {promo.tag && (
                                        <span className="bg-[#DAA520] text-black text-[9px] font-extrabold px-3 py-1 rounded mb-2 inline-flex items-center gap-1 uppercase tracking-widest shadow-lg">
                                            <Star className="w-3 h-3 fill-black"/> {promo.tag}
                                        </span>
                                    )}
                                    <h2 className="text-4xl md:text-5xl font-black text-white uppercase leading-none mb-2 drop-shadow-2xl">
                                        {promo.title}
                                    </h2>
                                    <p className="text-sm md:text-base text-zinc-200 font-medium mb-3 line-clamp-1">
                                        {promo.subtitle}
                                    </p>
                                    
                                    <p className="text-xs text-[#DAA520] flex items-center gap-2 font-bold tracking-wide uppercase">
                                        {promo.category === 'pack' 
                                            // CAMBIO: Formato precio en Hero también
                                            ? <><Tag className="w-4 h-4"/> Precio Web: ${promo.price.toLocaleString('es-CL')}.-</>
                                            : <><Calendar className="w-4 h-4"/> Disponible: {promo.day === 'todos' ? 'Todos los días' : promo.day}</>
                                        }
                                        <span className="text-white mx-2">•</span>
                                        <span className="text-white flex items-center gap-1"><MapPin className="w-3 h-3"/> Boulevard Zapallar</span>
                                    </p>
                                </div>
                            </div>
                        </Link>
                    </div>
                ))}
            </div>
        ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-500">
                <p>No hay promociones destacadas</p>
            </div>
        )}
      </div>

      {/* --- MARQUEE (Próximos Hits / Packs Populares) --- */}
      {/* Solo se muestra si hay items cargados */}
      {!loading && promos.length > 0 && (
          <div className="mb-8 overflow-hidden relative">
            <h3 className="px-4 text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Tendencias</h3>
            <div className="flex gap-4 w-[200%] animate-marquee hover:pause px-4">
                {[...promos, ...promos].slice(0, 10).map((p, index) => (
                    <div key={`mq-${p.id}-${index}`} className="min-w-[160px] h-28 relative rounded-2xl overflow-hidden border border-white/10 group shadow-lg shrink-0 cursor-pointer">
                        <Image src={p.image} alt={p.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/50 flex items-end p-3">
                            <span className="text-[10px] font-bold text-white leading-tight uppercase truncate w-full drop-shadow-md">{p.title}</span>
                        </div>
                    </div>
                ))}
            </div>
          </div>
      )}

      {/* --- BARRA DE BÚSQUEDA --- */}
      <div className="px-4 mb-6">
        <div className="relative group max-w-2xl mx-auto">
            <input 
                type="text" 
                placeholder="Buscar sushi, cocktails, packs..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#DAA520] focus:ring-1 focus:ring-[#DAA520] transition-all shadow-inner"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-[#DAA520] transition-colors" />
        </div>
      </div>

      {/* --- TABS (FILTROS) --- */}
      <div className="px-4 mb-8 max-w-2xl mx-auto">
        <div className="flex gap-2 p-1 bg-zinc-900 rounded-xl border border-zinc-800 shadow-lg">
            {['semana', 'pack'].map((tab) => (
                <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                        activeTab === tab 
                        ? 'bg-[#DAA520] text-black shadow-md scale-[1.02]' 
                        : 'text-zinc-500 hover:text-white hover:bg-white/5'
                    }`}
                >
                    {tab === 'semana' ? 'Esta Semana' : 'Packs & Regalos'}
                </button>
            ))}
        </div>
      </div>

      {/* --- LISTADO PRINCIPAL (CARDS HORIZONTALES - ESTILO TICKETS) --- */}
      <div className="px-4 space-y-4 pb-8 max-w-2xl mx-auto">
        {loading ? (
             <div className="text-center py-12 text-zinc-500">
                <Loader2 className="w-10 h-10 mx-auto mb-3 animate-spin text-[#DAA520]" />
                <p className="text-xs uppercase tracking-widest">Cargando...</p>
            </div>
        ) : visiblePromos.length > 0 ? (
            <AnimatePresence>
                {visiblePromos.map((promo) => (
                    <motion.div 
                        key={promo.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        exit={{ opacity: 0 }}
                        className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 flex h-36 relative active:scale-[0.98] transition-transform mb-4 shadow-xl group hover:border-[#DAA520]/40"
                    >
                        {/* TAG SUPERIOR (Ej: NUEVO) */}
                        {promo.tag && (
                            <div className="absolute top-0 left-0 z-20 bg-[#DAA520] text-black text-[8px] font-extrabold px-3 py-1 rounded-br-lg uppercase tracking-wider shadow-md">
                                {promo.tag}
                            </div>
                        )}

                        {/* --- 1. IMAGEN IZQUIERDA (W-36) --- */}
                        <div className="w-36 md:w-40 relative shrink-0 overflow-hidden">
                            <Image 
                                src={promo.image} 
                                alt={promo.title} 
                                fill 
                                className="object-cover opacity-90 group-hover:scale-110 transition-transform duration-700" 
                            />
                            {/* Gradiente lateral para fundir */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-zinc-900/90" />
                        </div>

                        {/* --- 2. CONTENIDO DERECHA --- */}
                        <div className="flex-1 p-4 pl-2 flex flex-col justify-between relative">
                            {/* Header Card */}
                            <div>
                                <div className="flex items-center gap-1 text-[9px] text-zinc-400 font-bold uppercase tracking-wider mb-1">
                                    {activeTab === 'semana' 
                                      ? <><Calendar className="w-3 h-3 text-[#DAA520]" /> {promo.day === 'todos' ? 'Todos los días' : promo.day}</>
                                      : <><Tag className="w-3 h-3 text-[#DAA520]" /> Oferta Online</>
                                    }
                                </div>
                                <h3 className="text-sm font-black text-white uppercase leading-snug line-clamp-2 mb-1 group-hover:text-[#DAA520] transition-colors">
                                    {promo.title}
                                </h3>
                            </div>

                            {/* Footer Card (Línea Divisoria y Datos) */}
                            <div className="flex items-end justify-between border-t border-white/5 pt-2">
                                <div className="flex items-center gap-3">
                                    {/* CAJA DE DATO PRINCIPAL (Separada por borde derecho) */}
                                    <div className="flex flex-col items-center justify-center leading-none pr-3 border-r border-white/10 min-w-[3.5rem]">
                                        {/* Ajustamos el tamaño del texto dependiendo de la pestaña para que quepa el precio largo */}
                                        <span className={`font-black text-white tracking-tight ${activeTab === 'pack' ? 'text-sm md:text-base' : 'text-xl'}`}>
                                            {promo.displayMain}
                                        </span>
                                        <span className="text-[8px] font-bold text-[#DAA520] uppercase mt-0.5">
                                            {promo.displaySub}
                                        </span>
                                    </div>
                                    
                                    {/* Subtexto */}
                                    <div className="flex flex-col leading-none">
                                        <span className="text-[10px] text-zinc-500 uppercase font-medium line-clamp-1">
                                            Boulevard
                                        </span>
                                    </div>
                                </div>
                                
                                {/* BOTÓN ACCIÓN */}
                                {activeTab === 'pack' ? (
                                    <button 
                                        onClick={(e) => handleAddToCart(e, promo)}
                                        className="bg-white text-black w-10 h-10 rounded-full hover:bg-[#DAA520] transition-all flex items-center justify-center shadow-[0_0_10px_rgba(255,255,255,0.1)] group/btn"
                                    >
                                        <ShoppingCart className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                                    </button>
                                ) : (
                                    <Link href="/reservas" className="bg-zinc-800 border border-white/10 text-white w-10 h-10 rounded-full hover:bg-[#DAA520] hover:text-black hover:border-[#DAA520] transition-all flex items-center justify-center group/btn">
                                        <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-0.5 transition-transform" />
                                    </Link>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        ) : (
            <div className="text-center py-16 text-zinc-500 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/30">
                <Filter className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No se encontraron resultados.</p>
                <button 
                    onClick={() => {setSearchTerm(""); setActiveTab("semana");}}
                    className="mt-4 text-xs text-[#DAA520] hover:underline"
                >
                    Limpiar filtros
                </button>
            </div>
        )}

        {/* --- BOTÓN VER MÁS --- */}
        {visibleCount < filteredPromos.length && (
            <div className="mt-8 flex justify-center">
                <button 
                    onClick={handleLoadMore}
                    className="bg-zinc-800 text-white px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest border border-zinc-700 hover:bg-[#DAA520] hover:text-black transition-all flex items-center gap-2 shadow-lg hover:shadow-[#DAA520]/20"
                    disabled={isLoadingMore}
                >
                    {isLoadingMore ? <Loader2 className="w-4 h-4 animate-spin"/> : "Ver más promociones"}
                </button>
            </div>
        )}
      </div>

      {/* ESTILOS GLOBALES PARA MARQUEE */}
      <style jsx>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 30s linear infinite; }
      `}</style>
    </main>
  );
}