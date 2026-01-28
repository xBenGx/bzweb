"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
    Search, Calendar, MapPin, ArrowLeft, 
    ChevronRight, Music, Filter, Loader2 
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Montserrat } from "next/font/google";
import { supabase } from "@/lib/supabaseClient"; // Conexión Real

const montserrat = Montserrat({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });

export default function TicketsPage() {
  // --- ESTADOS ---
  const [events, setEvents] = useState<any[]>([]); // Almacena los eventos reales de Supabase
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("semana");
  const [visibleCount, setVisibleCount] = useState(4); 
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // --- CONEXIÓN A BASE DE DATOS (CARGA INICIAL) ---
  useEffect(() => {
    const fetchShows = async () => {
        try {
            // Solicitamos todos los shows activos desde la tabla 'shows'
            const { data, error } = await supabase
                .from('shows')
                .select('*')
                .eq('active', true)
                .order('created_at', { ascending: true }); // Ordenar por creación o fecha

            if (error) throw error;

            if (data) {
                // Mapeamos los datos de la DB (snake_case) a la estructura que usa tu UI
                const mappedEvents = data.map(evt => ({
                    id: evt.id,
                    title: evt.title,
                    subtitle: evt.subtitle || "Evento Exclusivo", // Fallback si no hay subtítulo
                    date: evt.date_event, // Ej: "Sáb 31 Ene"
                    fullDate: evt.date_event, 
                    time: evt.time_event, // Ej: "22:00"
                    endTime: "05:00",
                    location: evt.location,
                    address: "Av. Manuel Labra Lillo 430, Curicó",
                    // Usamos la imagen de la DB o un placeholder si no hay
                    image: evt.image_url || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1470&auto=format&fit=crop",
                    tag: evt.tag || "", // Ej: "DESTACADO"
                    category: "semana", // Puedes guardar esto en DB si quieres filtrar real por día
                    isAdultOnly: evt.is_adult || false,
                    description: evt.description || "Sin descripción disponible.",
                    tickets: evt.tickets || [] 
                }));
                setEvents(mappedEvents);
            }
        } catch (error) {
            console.error("Error cargando shows:", error);
        } finally {
            setLoading(false);
        }
    };

    fetchShows();
  }, []);

  // --- LÓGICA DE FILTRADO ---
  const filteredEvents = events.filter(event => {
      const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase());
      // Lógica de pestañas: 'semana' muestra todo, específicas filtran por categoría exacta
      const matchesTab = activeTab === "semana" ? true : event.category === activeTab;
      return matchesSearch && matchesTab;
  });

  const visibleEvents = filteredEvents.slice(0, visibleCount);

  // --- MANEJADOR DE "VER MÁS" ---
  const handleLoadMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
        setVisibleCount(prev => prev + 3);
        setIsLoadingMore(false);
    }, 800); 
  };

  return (
    <main className={`min-h-screen bg-black text-white pb-24 overflow-x-hidden ${montserrat.className}`}>
      
      {/* --- HEADER --- */}
      <div className="bg-black/90 backdrop-blur-md px-4 py-4 flex items-center justify-between sticky top-0 z-50 border-b border-white/10 shadow-xl">
        <Link href="/" className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
            <ArrowLeft className="w-5 h-5 text-white" />
        </Link>
        
        {/* LOGO AUMENTADO (w-60) */}
        <div className="relative w-60 h-16"> 
            <Image src="/logo.png" alt="Boulevard Zapallar" fill className="object-contain" priority />
        </div>

        <button className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
            <Music className="w-5 h-5 text-[#DAA520]" />
        </button>
      </div>

      {/* --- HERO CARRUSEL (Top 3 Eventos) --- */}
      <div className="relative w-full h-80 overflow-hidden bg-black mb-6">
        {loading ? (
            <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#DAA520] animate-spin"/>
            </div>
        ) : events.length > 0 ? (
            <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide h-full">
                {events.slice(0, 3).map((event) => (
                    <div key={event.id} className="snap-center min-w-full relative h-full">
                        <Link href={`/tickets/${event.id}`}>
                            <Image src={event.image} alt={event.title} fill className="object-cover opacity-80" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-6 pb-8">
                                {event.tag && (
                                    <span className="bg-[#DAA520] text-black text-[9px] font-extrabold px-3 py-1 rounded mb-2 inline-block uppercase tracking-widest shadow-lg">
                                        {event.tag}
                                    </span>
                                )}
                                <h2 className="text-4xl font-bold text-white uppercase leading-none mb-1 drop-shadow-xl">{event.title}</h2>
                                <p className="text-sm text-zinc-200 font-medium mb-2">{event.subtitle}</p>
                                <p className="text-xs text-[#DAA520] flex items-center gap-1 font-bold tracking-wide">
                                    <Calendar className="w-3 h-3"/> {event.date} • {event.location}
                                </p>
                            </div>
                        </Link>
                    </div>
                ))}
            </div>
        ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-500">
                <p>No hay eventos destacados</p>
            </div>
        )}
      </div>

      {/* --- PRÓXIMOS HITS (CARRUSEL INFINITO) --- */}
      {/* Solo mostramos esto si hay eventos cargados */}
      {!loading && events.length > 0 && (
          <div className="mb-8 overflow-hidden relative">
            <h3 className="px-4 text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Próximos Hits</h3>
            <div className="flex gap-4 w-[200%] animate-marquee hover:pause">
                {/* Duplicamos el array para el efecto infinito */}
                {[...events, ...events].map((evt, index) => (
                    <Link href={`/tickets/${evt.id}`} key={`${evt.id}-${index}`} className="min-w-[160px] h-28 relative rounded-2xl overflow-hidden border border-white/10 group shadow-lg shrink-0">
                        <Image src={evt.image} alt={evt.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/50 flex items-end p-3">
                            <span className="text-[10px] font-bold text-white leading-tight uppercase truncate w-full drop-shadow-md">{evt.title}</span>
                        </div>
                    </Link>
                ))}
            </div>
          </div>
      )}

      {/* --- BARRA DE BÚSQUEDA --- */}
      <div className="px-4 mb-5">
        <div className="relative group">
            <input 
                type="text" 
                placeholder="Buscar evento..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#DAA520] focus:ring-1 focus:ring-[#DAA520] transition-all"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-[#DAA520] transition-colors" />
        </div>
      </div>

      {/* --- FILTROS DE TIEMPO --- */}
      <div className="px-4 mb-8">
        <div className="flex gap-2 p-1 bg-zinc-900 rounded-xl border border-zinc-800">
            {['hoy', 'manana', 'semana'].map((tab) => (
                <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${activeTab === tab ? 'bg-[#DAA520] text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                >
                    {tab === 'manana' ? 'Mañana' : tab === 'semana' ? 'Esta Semana' : 'Hoy'}
                </button>
            ))}
        </div>
      </div>

      {/* --- LISTADO DE EVENTOS (CARDS) --- */}
      <div className="px-4 space-y-4 pb-8">
        {loading ? (
             <div className="text-center py-10 text-zinc-500">
                <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-[#DAA520]" />
                <p className="text-sm">Cargando cartelera...</p>
            </div>
        ) : visibleEvents.length > 0 ? (
            visibleEvents.map((event) => (
                <Link href={`/tickets/${event.id}`} key={event.id}>
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 flex h-36 relative active:scale-[0.98] transition-transform mb-4"
                    >
                        {event.tag && (
                            <div className="absolute top-0 left-0 z-20 bg-[#DAA520] text-black text-[8px] font-extrabold px-3 py-1 rounded-br-lg uppercase tracking-wider shadow-md">
                                {event.tag}
                            </div>
                        )}
                        <div className="w-36 relative shrink-0">
                            <Image src={event.image} alt={event.title} fill className="object-cover opacity-90" />
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-zinc-900/80" />
                        </div>

                        <div className="flex-1 p-4 pl-2 flex flex-col justify-between relative">
                            <div>
                                <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1">
                                    <MapPin className="w-3 h-3 text-[#DAA520]" /> {event.location}
                                </div>
                                <h3 className="text-sm font-bold text-white uppercase leading-snug line-clamp-2 mb-2">
                                    {event.title}
                                </h3>
                            </div>

                            <div className="flex items-end justify-between border-t border-white/5 pt-2">
                                <div className="flex items-center gap-3">
                                    <div className="flex flex-col items-center leading-none pr-3 border-r border-white/10">
                                        <span className="text-2xl font-bold text-white">{event.date.split(" ")[1] || ""}</span>
                                        <span className="text-[9px] font-bold text-[#DAA520] uppercase">{event.date.split(" ")[0] || ""}</span>
                                    </div>
                                    <div className="flex flex-col leading-none">
                                        <span className="text-sm font-bold text-white">{event.time}</span>
                                        <span className="text-[9px] text-zinc-500 uppercase">hrs</span>
                                    </div>
                                </div>
                                <div className="bg-white/10 p-2 rounded-full hover:bg-[#DAA520] hover:text-black transition-all">
                                    <ChevronRight className="w-5 h-5" />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </Link>
            ))
        ) : (
            <div className="text-center py-10 text-zinc-500">
                <Filter className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay eventos disponibles.</p>
            </div>
        )}

        {/* --- BOTÓN VER MÁS --- */}
        {visibleCount < filteredEvents.length && (
            <div className="mt-8 flex justify-center">
                <button 
                    onClick={handleLoadMore}
                    className="bg-zinc-800 text-white px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest border border-zinc-700 hover:bg-[#DAA520] hover:text-black transition-all flex items-center gap-2"
                    disabled={isLoadingMore}
                >
                    {isLoadingMore ? <Loader2 className="w-4 h-4 animate-spin"/> : "Cargar más eventos"}
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