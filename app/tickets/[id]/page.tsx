"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    ArrowLeft, Calendar, MapPin, Clock, Minus, Plus, 
    ShoppingCart, Share2, AlertCircle, 
    Ticket as TicketIcon, CheckCircle, X, Loader2, AlertTriangle, Shield
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Montserrat } from "next/font/google";
// Eliminamos la importación estática y usamos Supabase
import { supabase } from "@/lib/supabaseClient";
import { useCart } from "@/components/CartContext"; 

const montserrat = Montserrat({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });

export default function EventDetailPage() {
  const params = useParams();
  const id = params?.id; // Obtenemos el ID de la URL
  
  const { addItem } = useCart();

  // --- ESTADOS ---
  const [event, setEvent] = useState<any>(null); // Datos del evento
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Estados de interacción
  const [ticketsSelection, setTicketsSelection] = useState<{ [key: string]: number }>({});
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [reservationData, setReservationData] = useState({ name: "", email: "", phone: "", guests: 1 });

  // --- 1. CARGAR DATOS DESDE SUPABASE ---
  useEffect(() => {
    const fetchEvent = async () => {
        if (!id) return;

        try {
            const { data, error } = await supabase
                .from('shows')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            if (data) {
                // Formateamos los datos para la vista
                setEvent({
                    id: data.id,
                    title: data.title,
                    subtitle: data.subtitle || "Evento Exclusivo",
                    fullDate: data.date_event, // Asumiendo formato "2026-01-31" o texto
                    time: data.time_event,
                    endTime: data.end_time || "05:00",
                    location: data.location,
                    address: "Av. Manuel Labra Lillo 430, Curicó",
                    image: data.image_url || "/placeholder.jpg",
                    tag: data.tag || "",
                    isAdultOnly: data.is_adult || false,
                    description: data.description || "Sin descripción disponible.",
                    // Usamos los tickets configurados o uno por defecto
                    tickets: data.tickets && data.tickets.length > 0 ? data.tickets : [
                        { id: 'gen', name: 'Entrada General', desc: 'Acceso General', price: 15000 }
                    ]
                });
            } else {
                setError(true);
            }
        } catch (err) {
            console.error("Error al cargar evento:", err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    fetchEvent();
  }, [id]);

  // --- LÓGICA DEL CARRITO ---
  const updateLocalSelection = (ticketId: string, delta: number) => {
    setTicketsSelection(prev => {
        const current = prev[ticketId] || 0;
        const newValue = Math.max(0, current + delta);
        return { ...prev, [ticketId]: newValue };
    });
  };

  const handleAddToCart = () => {
      let added = false;
      if (!event) return;

      event.tickets.forEach((ticketType: any) => {
          const qty = ticketsSelection[ticketType.id];
          if (qty > 0) {
              addItem({
                  id: `${event.id}-${ticketType.id}`,
                  name: `${event.title} - ${ticketType.name}`,
                  price: ticketType.price,
                  quantity: qty,
                  image: event.image,
                  detail: event.fullDate,
                  category: "ticket"
              });
              added = true;
          }
      });

      if (added) {
          setTicketsSelection({}); // Resetear selección
          // Aquí podrías abrir el carrito o mostrar confirmación
      }
  };

  const handleReservationSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      // Lógica simple para reserva gratuita (podría conectarse a Supabase 'reservas')
      alert(`Reserva gratuita confirmada para ${reservationData.name}.`);
      setShowReservationModal(false);
  };

  // --- RENDERIZADO CONDICIONAL ---

  if (loading) {
      return (
          <div className="min-h-screen bg-black flex items-center justify-center text-[#DAA520]">
              <Loader2 className="w-10 h-10 animate-spin" />
          </div>
      );
  }

  if (error || !event) {
      return (
          <div className={`min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 ${montserrat.className}`}>
              <AlertTriangle className="w-16 h-16 text-zinc-600 mb-4" />
              <h2 className="text-2xl font-bold uppercase mb-2">Evento no encontrado</h2>
              <p className="text-zinc-500 mb-8 text-center">El evento que buscas no existe o ha finalizado.</p>
              <Link href="/tickets" className="bg-[#DAA520] text-black px-8 py-3 rounded-full font-bold uppercase tracking-widest hover:bg-white transition-colors">
                  Volver a la Cartelera
              </Link>
          </div>
      );
  }

  // Cálculos de UI
  const isFreeEvent = event.tickets.some((t: any) => t.price === 0);
  const total = event.tickets.reduce((acc: number, t: any) => acc + (t.price * (ticketsSelection[t.id] || 0)), 0);
  const totalCount = Object.values(ticketsSelection).reduce((a, b) => a + b, 0);

  return (
    <main className={`min-h-screen bg-black text-white pb-40 overflow-x-hidden ${montserrat.className}`}>
      
      {/* --- HEADER EVENTO (HERO) --- */}
      <div className="relative h-[450px] w-full">
        <Image src={event.image} alt={event.title} fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black" />
        
        <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-20">
            <Link href="/tickets" className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black transition-colors">
                <ArrowLeft className="w-6 h-6" />
            </Link>
            <button className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black transition-colors">
                <Share2 className="w-5 h-5" />
            </button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 pt-12 bg-gradient-to-t from-black via-black/90 to-transparent">
            {event.tag && (
                <div className="inline-flex items-center gap-1 bg-[#DAA520] text-black text-[10px] font-extrabold px-3 py-1 rounded mb-3 uppercase tracking-widest shadow-lg">
                    {event.tag}
                </div>
            )}
            <h1 className="text-3xl md:text-4xl font-bold text-white uppercase leading-tight mb-2 drop-shadow-xl">{event.title}</h1>
            <p className="text-lg text-zinc-300 font-medium mb-4">{event.subtitle}</p>
            
            <div className="flex flex-col gap-2.5 text-sm text-zinc-300 bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                <div className="flex items-center gap-3"><Calendar className="w-4 h-4 text-[#DAA520]"/> <span className="font-medium">{event.fullDate}</span></div>
                <div className="flex items-center gap-3"><Clock className="w-4 h-4 text-[#DAA520]"/> <span>{event.time} - {event.endTime} hrs</span></div>
                <div className="flex items-center gap-3"><MapPin className="w-4 h-4 text-[#DAA520]"/> <span className="uppercase">{event.location} <span className="text-zinc-500 mx-1">|</span> {event.address}</span></div>
            </div>
        </div>
      </div>

      {/* --- SELECCIÓN DE ENTRADAS --- */}
      <div className="px-4 mt-6">
        <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-zinc-800 p-4 flex justify-between items-center border-b border-white/5">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <TicketIcon className="w-4 h-4 text-[#DAA520]" /> {isFreeEvent ? "Reserva tu Ingreso" : "Selecciona tus Tickets"}
                </h3>
            </div>

            <div className="divide-y divide-white/5">
                {event.tickets.map((t: any) => (
                    <div key={t.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                        <div className="flex-1 pr-4">
                            <h4 className="font-bold text-white text-sm uppercase">{t.name}</h4>
                            {t.desc && <p className="text-[10px] text-zinc-500 mt-0.5">{t.desc}</p>}
                            <p className="text-[#DAA520] font-bold text-lg mt-1">
                                {t.price === 0 ? "ENTRADA LIBERADA" : `$${Number(t.price).toLocaleString('es-CL')}`}
                            </p>
                        </div>
                        
                        {!isFreeEvent && (
                            <div className="flex items-center gap-3 bg-black rounded-lg p-1 border border-white/10">
                                <button 
                                    onClick={() => updateLocalSelection(t.id, -1)} 
                                    className="w-8 h-8 flex items-center justify-center bg-zinc-800 rounded text-white active:scale-90 disabled:opacity-30 hover:bg-zinc-700 transition-all" 
                                    disabled={!ticketsSelection[t.id]}
                                >
                                    <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-4 text-center font-bold text-white text-sm">{ticketsSelection[t.id] || 0}</span>
                                <button 
                                    onClick={() => updateLocalSelection(t.id, 1)} 
                                    className="w-8 h-8 flex items-center justify-center bg-[#DAA520] text-black rounded active:scale-90 hover:bg-[#B8860B] transition-all"
                                >
                                    <Plus className="w-3 h-3" />
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {event.isAdultOnly && (
                <div className="bg-red-500/10 p-4 flex items-start gap-3 border-t border-red-500/20">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-xs font-bold text-red-500 uppercase mb-1">Evento exclusivo para mayores de 18 años</h4>
                        <p className="text-[10px] text-red-400/80 leading-relaxed">Se exigirá cédula de identidad física al ingreso. Nos reservamos el derecho de admisión.</p>
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* --- DESCRIPCIÓN --- */}
      <div className="px-6 py-8">
        <h3 className="text-lg font-bold text-white uppercase tracking-wide mb-4 border-l-4 border-[#DAA520] pl-3">Información del Evento</h3>
        <div className="text-zinc-400 text-sm leading-relaxed space-y-4">
            <p>{event.description}</p>
            <p>Ven a disfrutar de una experiencia única en Boulevard Zapallar. Contamos con estacionamiento privado, seguridad reforzada y la mejor coctelería de autor.</p>
        </div>
      </div>

      {/* --- POLÍTICAS DE COMPRA (NUEVA SECCIÓN) --- */}
      <div className="px-4 mb-8">
        <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3 text-zinc-300">
                <Shield className="w-4 h-4 text-[#DAA520]" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Políticas de Compra y Devoluciones</h4>
            </div>
            
            <div className="text-[10px] text-zinc-500 space-y-3 leading-relaxed text-justify">
                <p>
                    Estimado cliente, por normativa de <strong>Boulevard Zapallar</strong>, declaramos expresamente que <strong>no se realizarán cambios ni devoluciones de dinero</strong> una vez finalizado el proceso de compra.
                </p>
                
                <p>
                    <strong>Excepción por Fuerza Mayor:</strong> Únicamente en caso de que el evento sea suspendido o cancelado por fuerza mayor, se procederá al reintegro del dinero por concepto de venta de entradas. Alternativamente, y solo si el cliente lo desea, se podrá optar por el canje de las entradas del evento cancelado por tickets para futuros eventos.
                </p>

                <p>
                    <strong>Devolución por Cancelación:</strong> En caso de cancelación o suspensión definitiva del evento, la devolución de los montos recaudados se realizará previa autorización, coordinación y publicación oficial, en un plazo no mayor a <strong>15 días hábiles</strong>.
                </p>

                <p>
                    Recomendamos revisar cuidadosamente los datos de su orden antes de confirmar la compra. Las entradas son nominativas y personalizadas.
                </p>

                <div className="bg-[#DAA520]/10 border border-[#DAA520]/20 p-2 rounded text-[#DAA520] font-bold text-center mt-2">
                    AVISO IMPORTANTE: Según el tipo de evento, las mesas podrían ser compartidas.
                </div>
                
                <p className="text-center pt-2 italic">Agradecemos su atención y preferencia.</p>
            </div>
        </div>
      </div>

      {/* --- BARRA INFERIOR DE ACCIÓN --- */}
      <div className="fixed bottom-0 left-0 w-full bg-zinc-900 border-t border-white/10 p-4 pb-6 shadow-[0_-5px_30px_rgba(0,0,0,0.5)] z-50 flex items-center justify-between safe-area-bottom">
        
        {isFreeEvent ? (
            <button 
                onClick={() => setShowReservationModal(true)}
                className="w-full bg-[#DAA520] hover:bg-[#B8860B] text-black px-8 py-4 rounded-xl font-bold uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
            >
                Reservar Cupo Gratis <CheckCircle className="w-4 h-4" />
            </button>
        ) : (
            <>
                <div className="flex flex-col">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Total a Pagar</span>
                    <span className="text-2xl font-black text-white">${total.toLocaleString('es-CL')}</span>
                </div>
                
                <button 
                    onClick={handleAddToCart}
                    disabled={total === 0}
                    className={`px-8 py-3.5 rounded-xl font-bold uppercase tracking-widest shadow-lg flex items-center gap-2 transition-all active:scale-95 ${total > 0 ? 'bg-[#DAA520] hover:bg-[#B8860B] text-black cursor-pointer' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}`}
                >
                    Agregar al Carrito <ShoppingCart className="w-4 h-4" />
                    {totalCount > 0 && <span className="bg-black text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center ml-1">{totalCount}</span>}
                </button>
            </>
        )}
      </div>

      {/* --- MODAL DE RESERVA (SOLO SI ES GRATIS) --- */}
      <AnimatePresence>
      {showReservationModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowReservationModal(false)} />
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="bg-zinc-900 border border-white/10 rounded-3xl p-6 w-full max-w-md relative z-10 shadow-2xl"
            >
                <button onClick={() => setShowReservationModal(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><X className="w-6 h-6"/></button>
                <h3 className="text-xl font-bold text-white uppercase mb-1">Reserva tu Mesa</h3>
                <p className="text-xs text-zinc-400 mb-6">{event.title} - Entrada Liberada</p>
                
                <form onSubmit={handleReservationSubmit} className="space-y-4">
                    <div>
                        <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Nombre Completo</label>
                        <input required type="text" className="w-full bg-black/50 border border-zinc-700 rounded-xl p-3 text-white text-sm focus:border-[#DAA520] outline-none" onChange={e => setReservationData({...reservationData, name: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Correo Electrónico</label>
                        <input required type="email" className="w-full bg-black/50 border border-zinc-700 rounded-xl p-3 text-white text-sm focus:border-[#DAA520] outline-none" onChange={e => setReservationData({...reservationData, email: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Teléfono</label>
                            <input required type="tel" className="w-full bg-black/50 border border-zinc-700 rounded-xl p-3 text-white text-sm focus:border-[#DAA520] outline-none" onChange={e => setReservationData({...reservationData, phone: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Personas</label>
                            <input required type="number" min="1" max="10" className="w-full bg-black/50 border border-zinc-700 rounded-xl p-3 text-white text-sm focus:border-[#DAA520] outline-none" onChange={e => setReservationData({...reservationData, guests: parseInt(e.target.value)})} />
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-[#DAA520] text-black font-bold uppercase tracking-widest py-4 rounded-xl mt-2 hover:bg-[#B8860B] transition-colors">
                        Confirmar Reserva
                    </button>
                </form>
            </motion.div>
        </div>
      )}
      </AnimatePresence>

    </main>
  );
}