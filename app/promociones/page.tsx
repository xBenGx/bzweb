"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Search, Calendar, Gift, ArrowLeft, 
    ChevronRight, ShoppingCart, Loader2, 
    Tag, Clock, Star 
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Montserrat } from "next/font/google";
import { supabase } from "@/lib/supabaseClient";
import { useCart } from "@/components/CartContext";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800"] });

// Orden para las promos semanales
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
    
    // Carrito
    const { addItem } = useCart();

    // --- CARGA DE DATOS ---
    useEffect(() => {
        const fetchPromos = async () => {
            try {
                const { data, error } = await supabase
                    .from('promociones')
                    .select('*')
                    .eq('active', true)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                if (data) {
                    const normalizedData = data.map(p => ({
                        ...p,
                        price: Number(p.price) || 0,
                        // Normalizamos datos para la UI visual
                        image: p.image_url || "/placeholder.jpg",
                        location: "Boulevard Zapallar", // Default
                    }));
                    setPromos(normalizedData);
                }
            } catch (error) {
                console.error("Error cargando promos:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPromos();
    }, []);

    // --- LÓGICA DE FILTRADO ---
    const filteredPromos = promos.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
        // Filtro de Tabs: 'semana' vs 'pack'
        const matchesTab = p.category === activeTab;
        // Filtro especial: Si hay items categorizados como 'banner', los mostramos en ambos o los excluimos de la lista si queremos
        return matchesSearch && matchesTab;
    });

    // Ordenar: Si es semana por día, si es pack por novedad
    const sortedPromos = [...filteredPromos].sort((a, b) => {
        if (activeTab === "semana") {
            const dayA = dayOrder[a.day] || 99;
            const dayB = dayOrder[b.day] || 99;
            return dayA - dayB;
        }
        return 0; // Packs por defecto (creación)
    });

    const visiblePromos = sortedPromos.slice(0, visibleCount);

    // --- ACCIONES ---
    const handleLoadMore = () => {
        setIsLoadingMore(true);
        setTimeout(() => {
            setVisibleCount(prev => prev + 5);
            setIsLoadingMore(false);
        }, 800);
    };

    const handleAddToCart = (e: React.MouseEvent, promo: any) => {
        e.preventDefault(); // Evitar navegación si hay Link
        e.stopPropagation();
        addItem({
            id: `promo-${promo.id}`,
            name: promo.title,
            price: promo.price || 0,
            quantity: 1,
            image: promo.image,
            detail: "Promo Pack Web",
            category: "shop"
        });
    };

    return (
        <main className={`min-h-screen bg-black text-white pb-24 overflow-x-hidden ${montserrat.className}`}>
            
            {/* --- HEADER (IGUAL A TICKETS) --- */}
            <div className="bg-black/90 backdrop-blur-md px-4 py-4 flex items-center justify-between sticky top-0 z-50 border-b border-white/10 shadow-xl transition-all">
                <Link href="/" className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                    <ArrowLeft className="w-5 h-5 text-white" />
                </Link>
                
                <div className="relative w-40 h-12 md:w-60 md:h-16"> 
                    <Image src="/logo.png" alt="Boulevard Zapallar" fill className="object-contain" priority />
                </div>

                <div className="p-2 bg-[#DAA520]/10 rounded-full border border-[#DAA520]/30 animate-pulse">
                    <Gift className="w-5 h-5 text-[#DAA520]" />
                </div>
            </div>

            {/* --- HERO CARRUSEL (DESTACADOS / BANNERS) --- */}
            <div className="relative w-full h-80 overflow-hidden bg-black mb-6">
                {loading ? (
                    <div className="w-full h-full flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-[#DAA520] animate-spin"/>
                    </div>
                ) : promos.length > 0 ? (
                    <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide h-full">
                        {/* Mostramos primero los Banners o los 3 primeros packs/promos */}
                        {promos.filter(p => p.category === 'banner' || p.tag === 'DESTACADO').concat(promos.slice(0,3)).slice(0, 4).map((item, idx) => (
                            <div key={`${item.id}-${idx}`} className="snap-center min-w-full relative h-full">
                                <div className="relative w-full h-full">
                                    <Image src={item.image} alt={item.title} fill className="object-cover opacity-70" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                                    <div className="absolute bottom-0 left-0 right-0 p-6 pb-8">
                                        <span className="bg-[#DAA520] text-black text-[9px] font-extrabold px-3 py-1 rounded mb-2 inline-flex items-center gap-1 uppercase tracking-widest shadow-lg">
                                            <Star className="w-3 h-3 fill-black"/> {item.tag || "Imperdible"}
                                        </span>
                                        <h2 className="text-3xl md:text-4xl font-bold text-white uppercase leading-none mb-1 drop-shadow-xl max-w-lg">
                                            {item.title}
                                        </h2>
                                        <p className="text-sm text-zinc-200 font-medium mb-2 line-clamp-1">{item.subtitle}</p>
                                        
                                        {item.category === 'pack' ? (
                                            <p className="text-lg text-[#DAA520] font-black tracking-wide">
                                                ${item.price.toLocaleString('es-CL')}
                                            </p>
                                        ) : (
                                            <p className="text-xs text-[#DAA520] flex items-center gap-1 font-bold tracking-wide uppercase">
                                                <Calendar className="w-3 h-3"/> {item.day === 'todos' ? 'Todos los días' : item.day}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : null}
            </div>

            {/* --- MARQUEE INFINITO (PACKS VISUALES) --- */}
            {!loading && promos.some(p => p.category === 'pack') && (
                <div className="mb-8 overflow-hidden relative">
                    <h3 className="px-4 text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Packs más vendidos</h3>
                    <div className="flex gap-4 w-[200%] animate-marquee hover:pause">
                        {[...promos.filter(p => p.category === 'pack'), ...promos.filter(p => p.category === 'pack')].slice(0, 10).map((promo, index) => (
                             <div key={`mq-${promo.id}-${index}`} className="min-w-[140px] h-24 relative rounded-xl overflow-hidden border border-white/10 group shadow-lg shrink-0">
                                <Image src={promo.image} alt={promo.title} fill className="object-cover" />
                                <div className="absolute inset-0 bg-black/40 flex items-end p-2">
                                    <span className="text-[9px] font-bold text-white leading-tight uppercase truncate w-full">{promo.title}</span>
                                </div>
                             </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- BUSCADOR --- */}
            <div className="px-4 mb-5">
                <div className="relative group">
                    <input 
                        type="text" 
                        placeholder="Buscar promoción..." 
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
                    <button 
                        onClick={() => setActiveTab("semana")}
                        className={`flex-1 py-3 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                            activeTab === "semana" ? 'bg-[#DAA520] text-black shadow-lg' : 'text-zinc-500 hover:text-white'
                        }`}
                    >
                        <Calendar className="w-3 h-3" /> La Semana
                    </button>
                    <button 
                        onClick={() => setActiveTab("pack")}
                        className={`flex-1 py-3 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                            activeTab === "pack" ? 'bg-[#DAA520] text-black shadow-lg' : 'text-zinc-500 hover:text-white'
                        }`}
                    >
                        <Gift className="w-3 h-3" /> Packs & Regalos
                    </button>
                </div>
            </div>

            {/* --- LISTADO (CARDS HORIZONTALES) --- */}
            <div className="px-4 space-y-4 pb-8">
                {loading ? (
                     <div className="text-center py-10 text-zinc-500">
                        <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-[#DAA520]" />
                        <p className="text-sm">Cargando promociones...</p>
                    </div>
                ) : visiblePromos.length > 0 ? (
                    visiblePromos.map((promo) => (
                        <motion.div 
                            key={promo.id}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 flex h-36 relative active:scale-[0.98] transition-transform shadow-lg"
                        >
                            {/* TAG SUPERIOR */}
                            {promo.tag && (
                                <div className="absolute top-0 left-0 z-20 bg-[#DAA520] text-black text-[8px] font-extrabold px-3 py-1 rounded-br-lg uppercase tracking-wider shadow-md">
                                    {promo.tag}
                                </div>
                            )}

                            {/* IMAGEN IZQUIERDA */}
                            <div className="w-32 md:w-40 relative shrink-0">
                                <Image src={promo.image} alt={promo.title} fill className="object-cover opacity-90" />
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-zinc-900/90" />
                            </div>

                            {/* CONTENIDO DERECHA */}
                            <div className="flex-1 p-3 pl-1 flex flex-col justify-between relative">
                                <div>
                                    <div className="flex items-center gap-1 text-[9px] text-zinc-400 font-bold uppercase tracking-wider mb-1">
                                        {activeTab === 'semana' ? (
                                            <><Clock className="w-3 h-3 text-[#DAA520]" /> Disponible: {promo.day}</>
                                        ) : (
                                            <><Tag className="w-3 h-3 text-[#DAA520]" /> Pack Exclusivo</>
                                        )}
                                    </div>
                                    <h3 className="text-sm font-bold text-white uppercase leading-tight line-clamp-2 mb-1">
                                        {promo.title}
                                    </h3>
                                    <p className="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed">
                                        {promo.desc_text || promo.subtitle}
                                    </p>
                                </div>

                                {/* FOOTER DE LA CARD (PRECIO/ACCIÓN) */}
                                <div className="flex items-end justify-between border-t border-white/5 pt-2 mt-1">
                                    <div className="flex items-center gap-3">
                                        {activeTab === 'pack' ? (
                                            // VISTA PRECIO (PACK)
                                            <div className="flex flex-col leading-none">
                                                <span className="text-[9px] text-zinc-500 uppercase font-bold">Valor</span>
                                                <span className="text-xl font-black text-[#DAA520]">
                                                    ${promo.price.toLocaleString('es-CL')}
                                                </span>
                                            </div>
                                        ) : (
                                            // VISTA DIA (SEMANA)
                                            <div className="flex flex-col items-start leading-none pr-3">
                                                <span className="text-[9px] text-zinc-500 uppercase font-bold mb-0.5">Día Promo</span>
                                                <span className="text-sm font-bold text-white bg-white/10 px-2 py-0.5 rounded border border-white/10 uppercase">
                                                    {promo.day === 'todos' ? 'DIARIO' : promo.day.substring(0,3)}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* BOTÓN DE ACCIÓN */}
                                    {activeTab === 'pack' ? (
                                        <button 
                                            onClick={(e) => handleAddToCart(e, promo)}
                                            className="bg-white text-black p-2 pr-3 pl-3 rounded-full hover:bg-[#DAA520] transition-all flex items-center gap-1 shadow-[0_0_10px_rgba(255,255,255,0.1)]"
                                        >
                                            <ShoppingCart className="w-4 h-4" />
                                            <span className="text-[10px] font-black uppercase">Agregar</span>
                                        </button>
                                    ) : (
                                        <Link href="/reservas">
                                            <div className="bg-zinc-800 text-white p-2 pr-3 pl-3 rounded-full hover:bg-[#DAA520] hover:text-black transition-all flex items-center gap-1 border border-white/10">
                                                <span className="text-[10px] font-bold uppercase">Reservar</span>
                                                <ChevronRight className="w-3 h-3" />
                                            </div>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="text-center py-10 text-zinc-500 border border-dashed border-zinc-800 rounded-2xl">
                        <Gift className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No hay {activeTab === 'semana' ? 'promociones' : 'packs'} disponibles.</p>
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
                            {isLoadingMore ? <Loader2 className="w-4 h-4 animate-spin"/> : "Ver más promociones"}
                        </button>
                    </div>
                )}
            </div>

            {/* --- WHATSAPP (MANTENIDO) --- */}
            <a 
                href="https://wa.me/569XXXXXXXX" 
                target="_blank" 
                rel="noopener noreferrer"
                className="fixed bottom-6 right-6 z-50 bg-[#25D366] w-12 h-12 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(37,211,102,0.4)] hover:scale-110 transition-transform duration-300"
            >
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-white fill-current" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
            </a>

            <style jsx>{`
                @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
                .animate-marquee { animation: marquee 20s linear infinite; }
            `}</style>
        </main>
    );
}