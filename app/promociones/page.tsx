"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
    Search, Calendar, Gift, ArrowLeft, 
    ChevronRight, ShoppingCart, Filter, Loader2, Tag
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Montserrat } from "next/font/google";
import { supabase } from "@/lib/supabaseClient";
import { useCart } from "@/components/CartContext";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });

// Orden para organizar los días de la semana
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

  const { addItem } = useCart();

  // --- CONEXIÓN A BASE DE DATOS ---
  useEffect(() => {
    const fetchPromos = async () => {
        try {
            const { data, error } = await supabase
                .from('promociones')
                .select('*')
                .eq('active', true);
            
            if (error) throw error;

            if (data) {
                // Normalizamos los datos para que encajen en el diseño visual de "Shows"
                const normalizedData = data.map(p => ({
                    id: p.id,
                    title: p.title,
                    subtitle: p.subtitle || p.desc_text || "Promoción exclusiva",
                    // Lógica para mostrar Día o 'Pack'
                    dateDisplay: p.category === 'pack' ? 'PACK' : (p.day === 'todos' ? 'ALL' : p.day?.substring(0, 3).toUpperCase()),
                    subDateDisplay: p.category === 'pack' ? 'WEB' : 'DÍA',
                    price: Number(p.price) || 0,
                    image: p.image_url || "/placeholder.jpg",
                    tag: p.tag || "",
                    category: p.category, // 'semana' o 'pack'
                    dayFull: p.day,
                    description: p.desc_text
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

  // --- LÓGICA DE FILTRADO Y ORDEN ---
  const filteredPromos = promos.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTab = p.category === activeTab;
      return matchesSearch && matchesTab;
  });

  // Ordenar: Si es semana por día, si es pack por ID (novedad)
  const sortedPromos = [...filteredPromos].sort((a, b) => {
      if (activeTab === "semana") {
          const dayA = dayOrder[a.dayFull] || 99;
          const dayB = dayOrder[b.dayFull] || 99;
          return dayA - dayB;
      }
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
      e.preventDefault(); // Evitar navegación del Link
      addItem({
          id: `promo-${promo.id}`,
          name: promo.title,
          price: promo.price,
          quantity: 1,
          image: promo.image,
          detail: "Promo Pack Web",
          category: "shop"
      });
  };

  return (
    <main className={`min-h-screen bg-black text-white pb-24 overflow-x-hidden ${montserrat.className}`}>
      
      {/* --- HEADER --- */}
      <div className="bg-black/90 backdrop-blur-md px-4 py-4 flex items-center justify-between sticky top-0 z-50 border-b border-white/10 shadow-xl">
        <Link href="/" className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
            <ArrowLeft className="w-5 h-5 text-white" />
        </Link>
        
        {/* LOGO */}
        <div className="relative w-60 h-16"> 
            <Image src="/logo.png" alt="Boulevard Zapallar" fill className="object-contain" priority />
        </div>

        {/* Icono cambiado a Gift/Shopping para diferenciar de tickets */}
        <Link href="/reservas" className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
            <Gift className="w-5 h-5 text-[#DAA520]" />
        </Link>
      </div>

      {/* --- HERO CARRUSEL (DESTACADOS) --- */}
      <div className="relative w-full h-80 overflow-hidden bg-black mb-6">
        {loading ? (
            <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#DAA520] animate-spin"/>
            </div>
        ) : promos.length > 0 ? (
            <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide h-full">
                {/* Mostramos las primeras 3 promos o las que tengan tag DESTACADO */}
                {promos.slice(0, 4).map((promo, index) => (
                    <div key={`${promo.id}-${index}`} className="snap-center min-w-full relative h-full">
                        <div className="relative w-full h-full">
                            <Image src={promo.image} alt={promo.title} fill className="object-cover opacity-80" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-6 pb-8">
                                {promo.tag && (
                                    <span className="bg-[#DAA520] text-black text-[9px] font-extrabold px-3 py-1 rounded mb-2 inline-block uppercase tracking-widest shadow-lg">
                                        {promo.tag}
                                    </span>
                                )}
                                <h2 className="text-3xl md:text-4xl font-bold text-white uppercase leading-none mb-1 drop-shadow-xl">{promo.title}</h2>
                                <p className="text-sm text-zinc-200 font-medium mb-2">{promo.subtitle}</p>
                                <p className="text-xs text-[#DAA520] flex items-center gap-1 font-bold tracking-wide">
                                    {promo.category === 'pack' ? (
                                        <><Tag className="w-3 h-3"/> ${promo.price.toLocaleString('es-CL')} • Compra Web</>
                                    ) : (
                                        <><Calendar className="w-3 h-3"/> {promo.dayFull} • Presencial</>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-500">
                <p>No hay promociones destacadas</p>
            </div>
        )}
      </div>

      {/* --- MARQUEE INFINITO (Igual que shows) --- */}
      {!loading && promos.length > 0 && (
          <div className="mb-8 overflow-hidden relative">
            <h3 className="px-4 text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Más Populares</h3>
            <div className="flex gap-4 w-[200%] animate-marquee hover:pause">
                {[...promos, ...promos].slice(0, 10).map((p, index) => (
                    <div key={`mq-${p.id}-${index}`} className="min-w-[160px] h-28 relative rounded-2xl overflow-hidden border border-white/10 group shadow-lg shrink-0">
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
      <div className="px-4 mb-5">
        <div className="relative group">
            <input 
                type="text" 
                placeholder="Buscar sushi, tragos, packs..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#DAA520] focus:ring-1 focus:ring-[#DAA520] transition-all"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-[#DAA520] transition-colors" />
        </div>
      </div>

      {/* --- TABS (FILTROS) --- */}
      <div className="px-4 mb-8">
        <div className="flex gap-2 p-1 bg-zinc-900 rounded-xl border border-zinc-800">
            {['semana', 'pack'].map((tab) => (
                <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${activeTab === tab ? 'bg-[#DAA520] text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                >
                    {tab === 'semana' ? 'La Semana' : 'Packs & Regalos'}
                </button>
            ))}
        </div>
      </div>

      {/* --- LISTADO (CARDS ESTILO SHOWS) --- */}
      <div className="px-4 space-y-4 pb-8">
        {loading ? (
             <div className="text-center py-10 text-zinc-500">
                <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-[#DAA520]" />
                <p className="text-sm">Cargando promociones...</p>
            </div>
        ) : visiblePromos.length > 0 ? (
            visiblePromos.map((promo) => (
                // Usamos un div interactivo o link dependiendo si es pack o reserva
                <div key={promo.id} className="relative">
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 flex h-36 relative active:scale-[0.98] transition-transform mb-4 shadow-lg"
                    >
                        {/* Tag dorado esquina */}
                        {promo.tag && (
                            <div className="absolute top-0 left-0 z-20 bg-[#DAA520] text-black text-[8px] font-extrabold px-3 py-1 rounded-br-lg uppercase tracking-wider shadow-md">
                                {promo.tag}
                            </div>
                        )}

                        {/* Imagen Izquierda (Estilo Shows) */}
                        <div className="w-36 relative shrink-0">
                            <Image src={promo.image} alt={promo.title} fill className="object-cover opacity-90" />
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-zinc-900/90" />
                        </div>

                        {/* Contenido Derecha */}
                        <div className="flex-1 p-4 pl-2 flex flex-col justify-between relative">
                            <div>
                                <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1">
                                    {activeTab === 'semana' ? (
                                        <><Calendar className="w-3 h-3 text-[#DAA520]" /> Disponible: {promo.dayFull}</>
                                    ) : (
                                        <><Tag className="w-3 h-3 text-[#DAA520]" /> Pack Web</>
                                    )}
                                </div>
                                <h3 className="text-sm font-bold text-white uppercase leading-snug line-clamp-2 mb-2">
                                    {promo.title}
                                </h3>
                            </div>

                            <div className="flex items-end justify-between border-t border-white/5 pt-2">
                                <div className="flex items-center gap-3">
                                    {/* CAJA DE DATO PRINCIPAL (Igual que Fecha/Hora en Shows) */}
                                    <div className="flex flex-col items-center leading-none pr-3 border-r border-white/10 min-w-[3.5rem]">
                                        {activeTab === 'pack' ? (
                                            // SI ES PACK: MUESTRA PRECIO
                                            <>
                                                <span className="text-[10px] font-bold text-[#DAA520] uppercase mb-0.5">Valor</span>
                                                <span className="text-lg font-bold text-white tracking-tight">
                                                    ${(promo.price/1000).toFixed(0)}k
                                                </span>
                                            </>
                                        ) : (
                                            // SI ES SEMANA: MUESTRA DÍA CORTO
                                            <>
                                                <span className="text-xl font-bold text-white">{promo.dateDisplay}</span>
                                                <span className="text-[9px] font-bold text-[#DAA520] uppercase">{promo.subDateDisplay}</span>
                                            </>
                                        )}
                                    </div>
                                    
                                    {/* Subtexto */}
                                    <div className="flex flex-col leading-none">
                                        <span className="text-[10px] text-zinc-400 font-medium line-clamp-1 max-w-[80px]">
                                            {promo.subtitle}
                                        </span>
                                    </div>
                                </div>

                                {/* BOTÓN DE ACCIÓN */}
                                {activeTab === 'pack' ? (
                                    <button 
                                        onClick={(e) => handleAddToCart(e, promo)}
                                        className="bg-white text-black p-2 rounded-full hover:bg-[#DAA520] transition-all shadow-[0_0_10px_rgba(255,255,255,0.1)]"
                                    >
                                        <ShoppingCart className="w-5 h-5" />
                                    </button>
                                ) : (
                                    <Link href="/reservas" className="bg-white/10 p-2 rounded-full hover:bg-[#DAA520] hover:text-black transition-all">
                                        <ChevronRight className="w-5 h-5" />
                                    </Link>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            ))
        ) : (
            <div className="text-center py-10 text-zinc-500">
                <Filter className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay promociones en esta categoría.</p>
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
                    {isLoadingMore ? <Loader2 className="w-4 h-4 animate-spin"/> : "Ver más"}
                </button>
            </div>
        )}
      </div>

      <style jsx>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 20s linear infinite; }
      `}</style>
    </main>
  );
}