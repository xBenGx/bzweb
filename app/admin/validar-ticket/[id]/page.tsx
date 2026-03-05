"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { Ticket, CheckCircle, XCircle, AlertTriangle, ArrowLeft, User, Mail, Hash } from "lucide-react";

// Usamos las variables públicas para el cliente
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ValidarTicketPage() {
  const { id } = useParams(); 
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [ticket, setTicket] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchTicket = async () => {
    if (!id) return;
    try {
      // Intentamos traer la información del ticket.
      const { data, error } = await supabase
        .from("tickets")
        .select(`*, shows ( nombre )`) // Si tu nombre de evento está en productos_reserva, ajusta 'shows' por tu tabla real
        .eq("id", id)
        .single();

      if (error) throw error;
      setTicket(data);

      // Feedback táctil para el guardia (si el dispositivo lo soporta)
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
          if (data.status === 'valid') navigator.vibrate(200); // Vibración corta de éxito
          else if (data.status === 'used') navigator.vibrate([300, 100, 300]); // Alerta de error (doble)
      }

    } catch (err: any) {
      setError("Entrada no encontrada o código inválido.");
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(500); // Vibración larga de error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const handleCheckIn = async () => {
    if (!ticket?.id || processing) return;
    setProcessing(true);
    
    try {
      const { error } = await supabase
        .from("tickets")
        .update({ 
            status: 'used',
            // Opcional: si tienes un campo check_in_time en tu tabla tickets, puedes guardar la hora exacta
            // updated_at: new Date().toISOString() 
        })
        .eq('id', ticket.id);

      if (error) throw error;
      
      setTicket({ ...ticket, status: 'used' });

      // Feedback táctil de validación exitosa
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([100, 50, 100]);

    } catch (err: any) {
      alert("❌ Error al registrar entrada: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const s = status?.toLowerCase() || '';
    if (s === 'valid') return { 
        bgColor: 'bg-green-500', 
        textColor: 'text-green-950', 
        title: 'ENTRADA VÁLIDA', 
        subtitle: 'Lista para hacer check-in',
        icon: <CheckCircle className="w-20 h-20 mb-2 opacity-90" />
    };
    if (s === 'used') return { 
        bgColor: 'bg-yellow-500', 
        textColor: 'text-yellow-950', 
        title: 'YA FUE USADA', 
        subtitle: 'Atención: Este ticket ya fue validado antes',
        icon: <AlertTriangle className="w-20 h-20 mb-2 opacity-90" />
    };
    return { 
        bgColor: 'bg-red-600', 
        textColor: 'text-white', 
        title: 'INVÁLIDA', 
        subtitle: 'El ticket fue cancelado o no existe',
        icon: <XCircle className="w-20 h-20 mb-2 opacity-90" />
    };
  };

  // 1. PANTALLA DE CARGA
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center font-sans">
        <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-b-4 border-[#DAA520] mb-4"></div>
        <p className="text-[#DAA520] font-bold tracking-widest uppercase text-sm animate-pulse">Consultando base de datos...</p>
      </div>
    );
  }

  // 2. PANTALLA DE ERROR CRÍTICO (NO ENCONTRADO)
  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-red-950 flex flex-col items-center justify-center p-6 text-center font-sans">
        <XCircle className="w-24 h-24 text-red-500 mb-6 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
        <h1 className="text-3xl font-black text-white mb-2 uppercase tracking-wider">TICKET NO ENCONTRADO</h1>
        <p className="text-red-300 mb-8 font-medium">El código QR escaneado no pertenece a nuestra base de datos o es falso.</p>
        
        <button onClick={() => router.back()} className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold uppercase tracking-widest transition-colors flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" /> Volver al Escáner
        </button>
      </div>
    );
  }

  // 3. PANTALLA PRINCIPAL DE VALIDACIÓN
  const statusInfo = getStatusConfig(ticket.status);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center font-sans">
      
      {/* HEADER NAVBAR */}
      <div className="w-full bg-zinc-900 border-b border-white/10 p-4 flex items-center justify-between sticky top-0 z-10">
          <button onClick={() => router.push('/admin/dashboard')} className="text-zinc-400 hover:text-white p-2 rounded-lg bg-black/50 transition-colors">
              <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="text-center">
              <h2 className="text-[#DAA520] font-black tracking-widest text-sm">BOULEVARD ZAPALLAR</h2>
              <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Control de Acceso</p>
          </div>
          <div className="w-10"></div> {/* Espaciador para centrar */}
      </div>

      {/* CONTENEDOR DE TARJETA */}
      <div className="w-full max-w-md p-5 flex-1 flex flex-col justify-center">
          
        <div className="bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden border border-white/5 flex flex-col">
          
          {/* BANNER DE ESTADO GIGANTE (Color dinámico) */}
          <div className={`${statusInfo.bgColor} ${statusInfo.textColor} p-8 text-center flex flex-col items-center justify-center transition-colors duration-500`}>
            {statusInfo.icon}
            <h1 className="text-3xl font-black uppercase tracking-wider leading-none">{statusInfo.title}</h1>
            <p className="text-sm font-bold mt-2 opacity-80">{statusInfo.subtitle}</p>
          </div>

          {/* DETALLES DEL TICKET */}
          <div className="p-6 space-y-5 bg-zinc-900">
            
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1"><User className="w-3 h-3"/> Titular de la Reserva</span>
              <p className="text-xl font-black text-white uppercase">{ticket.customer_name || "Sin Nombre Registrado"}</p>
              <p className="text-sm text-zinc-400 flex items-center gap-1"><Mail className="w-3 h-3"/> {ticket.user_email}</p>
            </div>

            <div className="h-px w-full bg-white/5"></div>

            <div className="space-y-1">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1"><Ticket className="w-3 h-3"/> Tipo de Entrada</span>
              <p className="text-lg font-bold text-[#DAA520] leading-tight">
                {ticket.shows?.nombre || ticket.event_id || "Entrada General"}
              </p>
            </div>

            <div className="bg-black/50 p-4 rounded-2xl text-center border border-white/5">
                <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest flex items-center justify-center gap-1 mb-1"><Hash className="w-3 h-3"/> ID Único del Ticket</span>
                <p className="text-xs font-mono font-medium text-zinc-400 truncate select-all">{ticket.id}</p>
            </div>

            {/* BOTÓN DE ACCIÓN (Solo si es válido) */}
            <div className="pt-2">
                {ticket.status === 'valid' && (
                  <button 
                    onClick={handleCheckIn}
                    disabled={processing}
                    className="w-full py-5 bg-gradient-to-r from-[#DAA520] to-[#B8860B] text-black rounded-2xl font-black text-lg uppercase tracking-widest shadow-[0_0_30px_rgba(218,165,32,0.3)] hover:shadow-[0_0_40px_rgba(218,165,32,0.5)] transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100"
                  >
                    {processing ? "PROCESANDO..." : "PERMITIR ACCESO"}
                  </button>
                )}

                {ticket.status === 'used' && (
                    <div className="w-full py-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl font-black text-center uppercase tracking-widest flex items-center justify-center gap-2">
                        <XCircle className="w-5 h-5"/> ACCESO DENEGADO
                    </div>
                )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}