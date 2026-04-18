// app/tickets/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
    Search, Calendar, MapPin, ArrowLeft, 
    ChevronRight, Music, Filter, Loader2, AlertCircle,
    ExternalLink, ShieldAlert, Lock
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Montserrat } from "next/font/google";
import { supabase } from "@/lib/supabaseClient";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });

export default function TicketsPage() {
  // --- ESTADOS ---
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("semana");
  const [visibleCount, setVisibleCount] = useState(10);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // --- HELPER: Formatear Fecha para UI ---
  const formatDateForUI = (dateString: string) => {
    if (!dateString) return "Fecha Pendiente";
    try {
        const parts = dateString.split('-');
        if (parts.length !== 3) return dateString;
        
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; 
        const day = parseInt(parts[2], 10);
        
        const dateObj = new Date(year, month, day);
        if (isNaN(dateObj.getTime())) return dateString;

        const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        
        const dayName = days[dateObj.getDay()];
        const monthName = months[dateObj.getMonth()];
        const dayNum = String(dateObj.getDate()).padStart(2, '0');
        
        return `${dayName} ${dayNum} ${monthName}`;
    } catch (error) {
        console.error("Error al formatear fecha:", error);
        return dateString;
    }
  };

  // --- HELPER: Determinar si la venta está bloqueada ---
  const isWebSaleLocked = (dateEvent: string, lockTime: string) => {
    if (!dateEvent || !lockTime) return false;

    const [year, month, day] = dateEvent.split('-');
    const [hour, minute] = lockTime.split(':');
    
    // Fecha límite establecida en el panel
    const limitDate = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
    const now = new Date();

    return now >= limitDate;
  };

  // --- CONEXIÓN A BASE DE DATOS ---
  useEffect(() => {
    const fetchShows = async () => {
        try {
            setFetchError(null);

            const now = new Date();
            const tYear = now.getFullYear();
            const tMonth = String(now.getMonth() + 1).padStart(2, '0');
            const tDay = String(now.getDate()).padStart(2, '0');
            const todayString = `${tYear}-${tMonth}-${tDay}`;

            const { data, error } = await supabase
                .from('shows')
                .select('*')
                .eq('active', true)
                .gte('date_event', todayString) 
                .order('date_event', { ascending: true }); 

            if (error) throw error;

            if (data) {
                const mappedEvents = data.map(evt => {
                    try {
                        const isLocked = isWebSaleLocked(evt.date_event, evt.lock_time);

                        return {
                            id: evt.id,
                            title: evt.title || "Evento Sin Título",
                            subtitle: evt.subtitle || "Evento Exclusivo", 
                            rawDate: evt.date_event || "", 
                            date: formatDateForUI(evt.date_event), 
                            fullDate: evt.date_event || "", 
                            time: evt.time_event ? String(evt.time_event).substring(0, 5) : "22:00",
                            endTime: evt.end_time ? String(evt.end_time).substring(0, 5) : "05:00",
                            location: evt.location || "Boulevard Zapallar",
                            address: "Av. Manuel Labra Lillo 430, Curicó",
                            image: evt.image_url || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1470&auto=format&fit=crop",
                            tag: evt.tag || "", 
                            category: "semana", 
                            isAdultOnly: evt.is_adult || false,
                            description: evt.description || "Sin descripción disponible.",
                            tickets: evt.tickets || [],
                            externalTicketUrl: evt.external_ticket_url || null,
                            isLocked: isLocked
                        };
                    } catch (e) {
                        console.error(`Error procesando show ID ${evt.id}:`, e);
                        return null;
                    }
                }).filter(Boolean);

                setEvents(mappedEvents);
            }
        } catch (error: any) {
            console.error("Error cargando shows:", error);
            setFetchError(error.message || "Error al conectar con la base de datos.");
        } finally {
            setLoading(false);
        }
    };

    fetchShows();
  }, []);

  // --- LÓGICA DE FILTRADO ---
  const filteredEvents = events.filter(event => {
      const matchesSearch = (event.title || "").toLowerCase().includes(searchTerm.toLowerCase());
      let matchesTab = true;
      
      const today = new Date();
      const tYear = today.getFullYear();
      const tMonth = String(today.getMonth() + 1).padStart(2, '0');
      const tDay = String(today.getDate()).padStart(2, '0');
      const todayString = `${tYear}-${tMonth}-${tDay}`;

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tmYear = tomorrow.getFullYear();
      const tmMonth = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const tmDay = String(tomorrow.getDate()).padStart(2, '0');
      const tomorrowString = `${tmYear}-${tmMonth}-${tmDay}`;

      if (activeTab === "hoy") {
          matchesTab = event.rawDate === todayString;
      } else if (activeTab === "manana") {
          matchesTab = event.rawDate === tomorrowString;
      } else if (activeTab === "semana") {
          matchesTab = true;
      }

      return matchesSearch && matchesTab;
  });

  const visibleEvents = filteredEvents.slice(0, visibleCount);

  // --- MANEJADOR DE CARGA ---
  const handleLoadMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
        setVisibleCount(prev => prev + 6); 
        setIsLoadingMore(false);
    }, 500); 
  };

  // --- RENDER DE ENLACE CONDICIONAL (Interno o Externo) ---
  const EventCardLink = ({ event, children, className }: { event: any, children: React.ReactNode, className?: string }) => {
    if (event.externalTicketUrl) {
      return (
        <a href={event.externalTicketUrl} target="_blank" rel="noopener noreferrer" className={className}>
          {children}
        </a>
      );
    }
    return (
      <Link href={`/tickets/${event.id}`} className={className}>
        {children}
      </Link>
    );
  };

  return (
    <main className={`min-h-screen bg-black text-white pb-24 overflow-x-hidden ${montserrat.className}`}>
      
      {/* --- HEADER --- */}
      <div className="bg-black/90 backdrop-blur-md px-4 py-4 flex items-center justify-between sticky top-0 z-50 border-b border-white/10 shadow-xl">
        <Link href="/" className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
            <ArrowLeft className="w-5 h-5 text-white" />
        </Link>
        
        <div className="relative w-60 h-16"> 
            <Image src="/logo.png" alt="Boulevard Zapallar" fill className="object-contain" priority />
        </div>

        <button className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
            <Music className="w-5 h-5 text-[#DAA520]" />
        </button>
      </div>

      {/* --- MENSAJE DE ERROR DE CONEXIÓN --- */}
      {fetchError && (
          <div className="mx-4 mt-4 bg-red-900/30 border border-red-500/50 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                  <h4 className="text-sm font-bold text-red-400 uppercase">Error de Conexión</h4>
                  <p className="text-xs text-zinc-400 mt-1">{fetchError}</p>
                  <button onClick={() => window.location.reload()} className="mt-2 text-xs font-bold text-white underline">Reintentar</button>
              </div>
          </div>
      )}

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
                        <EventCardLink event={event} className="block w-full h-full relative">
                            <Image src={event.image} alt={event.title} fill className={`object-cover transition-opacity duration-700 ${event.isLocked ? 'opacity-40 grayscale' : 'opacity-80'}`} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                            
                            <div className="absolute bottom-0 left-0 right-0 p-6 pb-8">
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {event.tag && (
                                        <span className="bg-[#DAA520] text-black text-[9px] font-extrabold px-3 py-1 rounded inline-block uppercase tracking-widest shadow-lg">
                                            {event.tag}
                                        </span>
                                    )}
                                    {event.externalTicketUrl && (
                                        <span className="bg-blue-600 text-white text-[9px] font-bold px-2 py-1 rounded uppercase flex items-center gap-1 shadow-lg">
                                            <ExternalLink className="w-3 h-3"/> Web Externa
                                        </span>
                                    )}
                                    {event.isLocked && (
                                        <span className="bg-red-600 text-white text-[9px] font-bold px-2 py-1 rounded uppercase flex items-center gap-1 shadow-lg">
                                            <Lock className="w-3 h-3"/> Venta Cerrada
                                        </span>
                                    )}
                                </div>
                                <h2 className="text-4xl font-bold text-white uppercase leading-none mb-1 drop-shadow-xl">{event.title}</h2>
                                <p className="text-sm text-zinc-200 font-medium mb-2">{event.subtitle}</p>
                                <p className="text-xs text-[#DAA520] flex items-center gap-1 font-bold tracking-wide">
                                    <Calendar className="w-3 h-3"/> {event.date} • {event.location}
                                </p>
                            </div>
                        </EventCardLink>
                    </div>
                ))}
            </div>
        ) : (
            !loading && !fetchError && (
                <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 border-b border-white/5">
                    <Music className="w-10 h-10 mb-3 opacity-20" />
                    <p className="text-sm uppercase font-bold tracking-widest">Cartelera en Construcción</p>
                </div>
            )
        )}
      </div>

      {/* --- PRÓXIMOS HITS (CARRUSEL INFINITO) --- */}
      {!loading && events.length > 0 && (
          <div className="mb-8 overflow-hidden relative">
            <h3 className="px-4 text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Próximos Hits</h3>
            <div className="flex gap-4 w-max animate-marquee hover:pause">
                {[...events, ...events, ...events, ...events].map((evt, index) => (
                    <EventCardLink event={evt} key={`${evt.id}-${index}`} className="w-40 h-28 relative rounded-2xl overflow-hidden border border-white/10 group shadow-lg shrink-0 block">
                        <Image src={evt.image} alt={evt.title} fill className={`object-cover transition-transform duration-700 group-hover:scale-110 ${evt.isLocked ? 'opacity-50 grayscale' : 'opacity-100'}`} />
                        <div className="absolute inset-0 bg-black/50 flex items-end p-3">
                            <span className="text-[10px] font-bold text-white leading-tight uppercase truncate w-full drop-shadow-md flex items-center gap-1">
                                {evt.externalTicketUrl && <ExternalLink className="w-3 h-3 shrink-0 text-blue-400" />}
                                {evt.isLocked && <Lock className="w-3 h-3 shrink-0 text-red-400" />}
                                {evt.title}
                            </span>
                        </div>
                    </EventCardLink>
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
                    {tab === 'manana' ? 'Mañana' : tab === 'semana' ? 'Catálogo' : 'Hoy'}
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
                <EventCardLink event={event} key={event.id} className="block">
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className={`bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 flex h-36 relative active:scale-[0.98] transition-transform mb-4 shadow-lg ${event.isLocked ? 'opacity-80' : ''}`}
                    >
                        <div className="absolute top-2 right-2 flex flex-col gap-1 z-20 items-end">
                             {event.tag && (
                                <div className="bg-[#DAA520] text-black text-[8px] font-extrabold px-2 py-1 rounded uppercase tracking-wider shadow-md">
                                    {event.tag}
                                </div>
                            )}
                            {event.isAdultOnly && (
                                <div className="bg-red-600 text-white text-[8px] font-extrabold px-2 py-1 rounded uppercase shadow-md flex items-center gap-1 w-fit">
                                    <ShieldAlert className="w-2 h-2"/> +18
                                </div>
                            )}
                        </div>

                        <div className="w-36 relative shrink-0">
                            <Image src={event.image} alt={event.title} fill className={`object-cover ${event.isLocked ? 'grayscale opacity-50' : 'opacity-90'}`} />
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-zinc-900/80" />
                        </div>

                        <div className="flex-1 p-4 pl-2 flex flex-col justify-between relative">
                            <div>
                                <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1">
                                    <MapPin className="w-3 h-3 text-[#DAA520]" /> {event.location}
                                </div>
                                <h3 className={`text-sm font-bold uppercase leading-snug line-clamp-2 mb-1 ${event.isLocked ? 'text-zinc-400 line-through decoration-zinc-500' : 'text-white'}`}>
                                    {event.title}
                                </h3>
                                {/* Badge Externo / Bloqueo visible en la lista */}
                                {event.isLocked ? (
                                     <span className="text-[9px] font-bold text-red-500 uppercase flex items-center gap-1"><Lock className="w-3 h-3"/> Venta Puerta</span>
                                ) : event.externalTicketUrl ? (
                                    <span className="text-[9px] font-bold text-blue-400 uppercase flex items-center gap-1"><ExternalLink className="w-3 h-3"/> Link Externo</span>
                                ) : null}
                            </div>

                            <div className="flex items-end justify-between border-t border-white/5 pt-2">
                                <div className="flex items-center gap-3">
                                    <div className="flex flex-col items-center leading-none pr-3 border-r border-white/10">
                                        <span className="text-2xl font-bold text-white">{event.date.split(" ")[1] || "00"}</span>
                                        <span className="text-[9px] font-bold text-[#DAA520] uppercase">{event.date.split(" ")[0] || "Día"}</span>
                                    </div>
                                    <div className="flex flex-col leading-none">
                                        <span className="text-sm font-bold text-white">{event.time}</span>
                                        <span className="text-[9px] text-zinc-500 uppercase">hrs</span>
                                    </div>
                                </div>
                                
                                <div className={`p-2 rounded-full transition-all ${event.isLocked ? 'bg-zinc-800 text-zinc-600' : event.externalTicketUrl ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-600 hover:text-white' : 'bg-white/10 text-white hover:bg-[#DAA520] hover:text-black'}`}>
                                    {event.isLocked ? <Lock className="w-4 h-4"/> : event.externalTicketUrl ? <ExternalLink className="w-5 h-5"/> : <ChevronRight className="w-5 h-5" />}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </EventCardLink>
            ))
        ) : (
            !loading && !fetchError && (
                <div className="text-center py-10 text-zinc-500">
                    <Filter className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hay eventos disponibles para este filtro.</p>
                </div>
            )
        )}

        {/* --- BOTÓN VER MÁS --- */}
        {visibleCount < filteredEvents.length && (
            <div className="mt-8 flex justify-center">
                <button 
                    onClick={handleLoadMore}
                    className="bg-zinc-800 text-white px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest border border-zinc-700 hover:bg-[#DAA520] hover:text-black transition-all flex items-center gap-2 shadow-lg"
                    disabled={isLoadingMore}
                >
                    {isLoadingMore ? <Loader2 className="w-4 h-4 animate-spin"/> : "Cargar más eventos"}
                </button>
            </div>
        )}
      </div>

      <style jsx>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 30s linear infinite; }
      `}</style>
    </main>
  );
}