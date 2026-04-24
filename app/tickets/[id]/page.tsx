// app/tickets/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
    ArrowLeft, Calendar, MapPin, Clock, Minus, Plus, 
    ShoppingCart, Share2, AlertCircle, 
    Ticket as TicketIcon, CheckCircle, X, Loader2, AlertTriangle, Shield, 
    Lock, ExternalLink
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Montserrat } from "next/font/google";
import { supabase } from "@/lib/supabaseClient";
import { useCart } from "@/components/CartContext"; 

const montserrat = Montserrat({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter(); 
  const id = params?.id; 
  
  const { addItem } = useCart();

  // --- ESTADOS ---
  const [event, setEvent] = useState<any>(null); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isLocked, setIsLocked] = useState(false); 

  // Estados de interacción
  const [ticketsSelection, setTicketsSelection] = useState<{ [key: string]: number }>({});
  const [termsAccepted, setTermsAccepted] = useState(false);

  // --- 1. CARGAR DATOS Y EVALUAR BLOQUEO ---
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
                setEvent({
                    id: data.id,
                    title: data.title,
                    subtitle: data.subtitle || "Evento Exclusivo",
                    fullDate: data.date_event, 
                    time: data.time_event,
                    endTime: data.end_time || "05:00",
                    location: data.location,
                    address: "Av. Manuel Labra Lillo 430, Curicó",
                    image: data.image_url || "/placeholder.jpg",
                    tag: data.tag || "",
                    isAdultOnly: data.is_adult || false,
                    description: data.description || "Sin descripción disponible.",
                    tickets: data.tickets && data.tickets.length > 0 ? data.tickets : [
                        { id: 'gen', name: 'Entrada General', desc: 'Acceso General', price: 15000 }
                    ],
                    lock_time: data.lock_time || null,
                    external_ticket_url: data.external_ticket_url || null // Rescatamos link externo
                });

                // Evaluar si ya está bloqueado en la carga inicial
                if (data.date_event && data.lock_time) {
                    checkLockStatus(data.date_event, data.lock_time);
                }

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

  // --- 2. LOOP DE REVISIÓN CONSTANTE ---
  useEffect(() => {
      if (!event || !event.fullDate || !event.lock_time) return;

      // Revisa cada 15 segundos para mayor precisión
      const intervalId = setInterval(() => {
          checkLockStatus(event.fullDate, event.lock_time);
      }, 15000); 

      return () => clearInterval(intervalId); 
  }, [event?.fullDate, event?.lock_time]); // Dependencias optimizadas

  // Función robusta para evaluar el bloqueo
  const checkLockStatus = (dateEvent: string, lockTime: string) => {
      if (!dateEvent || !lockTime) return;

      try {
          const [year, month, day] = dateEvent.split('-').map(Number);
          const [hour, minute] = lockTime.split(':').map(Number);
          
          const limitDate = new Date(year, month - 1, day, hour, minute, 0);
          const now = new Date();

          if (now >= limitDate) {
              setIsLocked(true);
              setTicketsSelection({}); 
          } else {
              setIsLocked(false);
          }
      } catch (e) {
          console.error("Error calculando hora de bloqueo", e);
      }
  };

  // --- LÓGICA DEL CARRITO ---
  const updateLocalSelection = (ticketId: string, delta: number) => {
    if (isLocked) return; 
    setTicketsSelection(prev => {
        const current = prev[ticketId] || 0;
        const newValue = Math.max(0, current + delta);
        return { ...prev, [ticketId]: newValue };
    });
  };

  const handleAddToCart = () => {
      if (isLocked) {
          alert("La venta web para este evento ya ha finalizado. Por favor, compra tu entrada directamente en la puerta del local.");
          return;
      }
      if (!termsAccepted) {
          alert("Por favor, acepta las políticas de compra y devolución para continuar.");
          return;
      }

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
          setTicketsSelection({}); 
          alert("Tickets agregados al carrito.");
      }
  };

  const handleGoToReservations = () => {
      if (isLocked) {
          alert("La reserva web para este evento ya cerró. Te esperamos directamente en el local.");
          return;
      }
      if (!termsAccepted) {
          alert("Por favor, acepta las políticas de compra y devolución para continuar.");
          return;
      }
      router.push('/reservas');
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

  const isFreeEvent = event.tickets.some((t: any) => t.price === 0);
  const total = event.tickets.reduce((acc: number, t: any) => acc + (t.price * (ticketsSelection[t.id] || 0)), 0);
  const totalCount = Object.values(ticketsSelection).reduce((a, b) => a + b, 0);

  return (
    <main className={`min-h-screen bg-black text-white pb-48 overflow-x-hidden ${montserrat.className}`}>
      
      {/* --- HEADER EVENTO (HERO) --- */}
      <div className="relative h-[450px] w-full">
        <Image src={event.image} alt={event.title} fill className={`object-cover ${isLocked ? 'grayscale opacity-70' : ''}`} priority unoptimized />
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
            {isLocked && (
                <div className="inline-flex items-center gap-1 bg-red-600 text-white border border-red-500/50 text-[10px] font-black px-3 py-1 rounded mb-3 ml-2 uppercase tracking-widest shadow-lg">
                    <Lock className="w-3 h-3"/> Venta Cerrada
                </div>
            )}
            {event.external_ticket_url && !isLocked && (
                <div className="inline-flex items-center gap-1 bg-blue-600 text-white border border-blue-500/50 text-[10px] font-black px-3 py-1 rounded mb-3 ml-2 uppercase tracking-widest shadow-lg">
                    <ExternalLink className="w-3 h-3"/> Ticketera Externa
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

      {/* --- ESTADO DE VENTA BLOQUEADA --- */}
      {isLocked && (
          <div className="px-4 mt-6">
              <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-6 text-center shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                  <Lock className="w-12 h-12 text-red-500 mx-auto mb-3 opacity-80" />
                  <h3 className="text-lg font-black text-red-400 uppercase tracking-widest mb-2">Venta Web Finalizada</h3>
                  <p className="text-sm text-zinc-300 leading-relaxed">
                      El plazo para comprar entradas online ha terminado. 
                      <strong className="text-white block mt-1">Podrás adquirir tus entradas directamente en la puerta del local al llegar.</strong>
                  </p>
                  <p className="text-[10px] text-zinc-500 uppercase mt-4 font-bold tracking-widest">¡Te esperamos!</p>
              </div>
          </div>
      )}

      {/* --- SELECCIÓN DE ENTRADAS (Solo si no está bloqueado Y no es ticketera externa) --- */}
      {!isLocked && !event.external_ticket_url && (
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
      )}

      {/* --- DESCRIPCIÓN --- */}
      <div className="px-6 py-8">
        <h3 className="text-lg font-bold text-white uppercase tracking-wide mb-4 border-l-4 border-[#DAA520] pl-3">Información del Evento</h3>
        <div className="text-zinc-400 text-sm leading-relaxed space-y-4">
            <p>{event.description}</p>
            <p>Ven a disfrutar de una experiencia única en Boulevard Zapallar. Contamos con estacionamiento privado, seguridad reforzada y la mejor coctelería de autor.</p>
        </div>
      </div>

      {/* --- POLÍTICAS DE COMPRA CON CHECK OBLIGATORIO (Se oculta si está bloqueado o usa ticketera externa) --- */}
      {!isLocked && !event.external_ticket_url && (
          <div className="px-4 mb-8">
            <div className={`bg-zinc-900/50 border rounded-xl p-5 transition-colors ${termsAccepted ? 'border-[#DAA520]' : 'border-white/5'}`}>
                <div className="flex items-center gap-2 mb-3 text-zinc-300">
                    <Shield className={`w-4 h-4 ${termsAccepted ? 'text-[#DAA520]' : 'text-zinc-500'}`} />
                    <h4 className="text-xs font-bold uppercase tracking-wider">Políticas de Compra y Devoluciones</h4>
                </div>
                
                <div className="text-[10px] text-zinc-500 space-y-3 leading-relaxed text-justify mb-4">
                    <p>
                        Estimado cliente, por normativa de <strong>Boulevard Zapallar</strong>, declaramos expresamente que <strong>no se realizarán cambios ni devoluciones de dinero</strong> una vez finalizado el proceso de compra.
                    </p>
                    <p>
                        <strong>Excepción por Fuerza Mayor:</strong> Únicamente en caso de que el evento sea suspendido o cancelado por fuerza mayor, se procederá al reintegro del dinero. <strong className="uppercase text-zinc-300">El reembolso será hasta 15 días hábiles después de la compra.</strong>
                    </p>
                    <p>
                        Recomendamos revisar cuidadosamente los datos de su orden antes de confirmar la compra. Las entradas son nominativas y personalizadas.
                    </p>
                    <div className="bg-[#DAA520]/10 border border-[#DAA520]/20 p-2 rounded text-[#DAA520] font-bold text-center mt-2">
                        AVISO IMPORTANTE: Según el tipo de evento, las mesas podrían ser compartidas.
                    </div>
                </div>

                <div 
                    onClick={() => setTermsAccepted(!termsAccepted)}
                    className="flex items-center gap-3 p-3 bg-black rounded-lg cursor-pointer hover:bg-white/5 transition-colors select-none"
                >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${termsAccepted ? 'bg-[#DAA520] border-[#DAA520]' : 'border-zinc-600 bg-transparent'}`}>
                        {termsAccepted && <CheckCircle className="w-3.5 h-3.5 text-black" />}
                    </div>
                    <p className={`text-xs font-bold ${termsAccepted ? 'text-white' : 'text-zinc-400'}`}>
                        He leído y acepto las políticas de compra y devolución.
                    </p>
                </div>
            </div>
          </div>
      )}

      {/* --- BARRA INFERIOR DE ACCIÓN (Se adapta según bloqueo y link externo) --- */}
      <div className="fixed bottom-0 left-0 w-full bg-zinc-900 border-t border-white/10 p-4 pb-6 shadow-[0_-5px_30px_rgba(0,0,0,0.5)] z-50 flex items-center justify-between safe-area-bottom">
        
        {isLocked ? (
            <div className="w-full flex flex-col items-center">
                <span className="text-red-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                    <Lock className="w-4 h-4"/> Ventas cerradas online
                </span>
                <span className="text-[10px] text-zinc-400 mt-1">Compra disponible en puerta.</span>
            </div>
        ) : event.external_ticket_url ? (
            <a 
                href={event.external_ticket_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full px-8 py-4 rounded-xl font-black uppercase tracking-widest shadow-[0_0_20px_rgba(37,99,235,0.3)] flex items-center justify-center gap-2 transition-all active:scale-95 bg-blue-600 hover:bg-blue-500 text-white"
            >
                Comprar en Ticketera <ExternalLink className="w-5 h-5" />
            </a>
        ) : isFreeEvent ? (
            <button 
                onClick={handleGoToReservations}
                disabled={!termsAccepted}
                className={`w-full px-8 py-4 rounded-xl font-bold uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${
                    termsAccepted 
                    ? 'bg-[#DAA520] hover:bg-[#B8860B] text-black cursor-pointer' 
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50'
                }`}
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
                    disabled={total === 0 || !termsAccepted}
                    className={`px-8 py-3.5 rounded-xl font-bold uppercase tracking-widest shadow-lg flex items-center gap-2 transition-all active:scale-95 ${
                        (total > 0 && termsAccepted)
                        ? 'bg-[#DAA520] hover:bg-[#B8860B] text-black cursor-pointer' 
                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                    }`}
                >
                    Agregar <ShoppingCart className="w-4 h-4 hidden sm:block" />
                    {totalCount > 0 && <span className="bg-black text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center ml-1">{totalCount}</span>}
                </button>
            </>
        )}
      </div>

    </main>
  );
}