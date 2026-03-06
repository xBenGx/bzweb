"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { 
    Ticket, CheckCircle, XCircle, AlertTriangle, 
    ArrowLeft, User, Mail, Hash, Phone, Utensils, Users, Clock 
} from "lucide-react";

// Inicialización del cliente Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ValidarTicketPage() {
  const { id } = useParams(); 
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [reserva, setReserva] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchReserva = async () => {
    if (!id) return;
    try {
      // Consultamos la tabla reservas, que contiene el pre_order con los tickets y el menú
      const { data, error } = await supabase
        .from("reservas")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setReserva(data);

      // Feedback táctil para el dispositivo del guardia
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
          if (data.status === 'confirmada') navigator.vibrate(200); // Éxito
          else if (data.status === 'realizado' || data.status === 'ingresado') navigator.vibrate([300, 100, 300]); // Ya usado
          else navigator.vibrate(500); // Otro error/rechazado
      }

    } catch (err: any) {
      setError("Entrada no encontrada o código QR inválido.");
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(500);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReserva();
  }, [id]);

  const handleCheckIn = async () => {
    if (!reserva?.id || processing) return;
    setProcessing(true);
    
    try {
      const { error } = await supabase
        .from("reservas")
        .update({ 
            status: 'realizado',
            check_in_time: new Date().toISOString() 
        })
        .eq('id', reserva.id);

      if (error) throw error;
      
      setReserva({ ...reserva, status: 'realizado' });

      // Vibración de validación exitosa
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([100, 50, 100]);

    } catch (err: any) {
      alert("❌ Error al registrar el ingreso: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  // Lógica de estados basados en tu estructura de la tabla reservas
  const getStatusConfig = (status: string) => {
    const s = status?.toLowerCase() || '';
    
    if (s === 'confirmada') return { 
        bgColor: 'bg-green-500', 
        textColor: 'text-green-950', 
        title: 'ACCESO PERMITIDO', 
        subtitle: 'Entrada válida y lista para check-in',
        icon: <CheckCircle className="w-20 h-20 mb-2 opacity-90" />
    };
    if (s === 'realizado' || s === 'ingresado') return { 
        bgColor: 'bg-yellow-500', 
        textColor: 'text-yellow-950', 
        title: 'TICKET YA USADO', 
        subtitle: 'Atención: Este código ya fue escaneado anteriormente',
        icon: <AlertTriangle className="w-20 h-20 mb-2 opacity-90" />
    };
    if (s === 'pendiente') return { 
        bgColor: 'bg-orange-500', 
        textColor: 'text-orange-950', 
        title: 'PAGO PENDIENTE', 
        subtitle: 'Esta reserva aún no ha sido aprobada en el sistema',
        icon: <AlertTriangle className="w-20 h-20 mb-2 opacity-90" />
    };
    
    return { 
        bgColor: 'bg-red-600', 
        textColor: 'text-white', 
        title: 'TICKET INVÁLIDO', 
        subtitle: 'El ticket fue cancelado, rechazado o no existe',
        icon: <XCircle className="w-20 h-20 mb-2 opacity-90" />
    };
  };

  // --- RENDERIZADOS CONDICIONALES ---

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center font-sans">
        <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-b-4 border-[#DAA520] mb-4"></div>
        <p className="text-[#DAA520] font-bold tracking-widest uppercase text-sm animate-pulse">Verificando en base de datos...</p>
      </div>
    );
  }

  if (error || !reserva) {
    return (
      <div className="min-h-screen bg-red-950 flex flex-col items-center justify-center p-6 text-center font-sans">
        <XCircle className="w-24 h-24 text-red-500 mb-6 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
        <h1 className="text-3xl font-black text-white mb-2 uppercase tracking-wider">NO ENCONTRADO</h1>
        <p className="text-red-300 mb-8 font-medium">{error || "El código QR no pertenece a este sistema."}</p>
        <button onClick={() => router.back()} className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold uppercase tracking-widest transition-colors flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" /> Volver al Escáner
        </button>
      </div>
    );
  }

  // Desglosar el pedido (Entradas vs Menú Anticipado)
  const tickets = reserva.pre_order?.filter((item: any) => item.category === 'ticket') || [];
  const menu = reserva.pre_order?.filter((item: any) => item.category !== 'ticket') || [];
  const statusInfo = getStatusConfig(reserva.status);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center font-sans pb-10">
      
      {/* HEADER NAVEGACIÓN */}
      <div className="w-full bg-zinc-900 border-b border-white/10 p-4 flex items-center justify-between sticky top-0 z-10 shadow-md">
          <button onClick={() => router.back()} className="text-zinc-400 hover:text-white p-2 rounded-lg bg-black/50 transition-colors">
              <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="text-center">
              <h2 className="text-[#DAA520] font-black tracking-widest text-sm">BOULEVARD ZAPALLAR</h2>
              <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Control de Acceso</p>
          </div>
          <div className="w-10"></div>
      </div>

      {/* CONTENEDOR PRINCIPAL DEL TICKET */}
      <div className="w-full max-w-md p-4 mt-4 flex-1 flex flex-col">
          
        <div className="bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden border border-white/5 flex flex-col relative">
          
          {/* BANNER ESTADO */}
          <div className={`${statusInfo.bgColor} ${statusInfo.textColor} p-8 text-center flex flex-col items-center justify-center transition-colors duration-500`}>
            {statusInfo.icon}
            <h1 className="text-3xl font-black uppercase tracking-wider leading-none">{statusInfo.title}</h1>
            <p className="text-sm font-bold mt-2 opacity-80">{statusInfo.subtitle}</p>
          </div>

          {/* CÓDIGO Y FECHA */}
          <div className="bg-black text-center py-3 border-b border-white/10 flex justify-between px-6 items-center">
             <span className="font-mono text-[#DAA520] font-black tracking-widest text-lg">{reserva.reservation_code || reserva.code}</span>
             <span className="text-zinc-400 text-xs font-bold uppercase flex items-center gap-1"><Clock className="w-3 h-3"/> {reserva.time_reserva} HRS</span>
          </div>

          {/* DETALLES DEL CLIENTE */}
          <div className="p-6 space-y-6 bg-zinc-900">
            
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 border border-white/10">
                    <User className="w-6 h-6 text-zinc-400"/>
                </div>
                <div>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Titular de la Compra</p>
                    <p className="text-xl font-black text-white uppercase leading-tight">{reserva.name}</p>
                    <div className="flex flex-col mt-1 space-y-0.5">
                        <span className="text-xs text-zinc-400 flex items-center gap-1.5"><Phone className="w-3 h-3 text-zinc-500"/> {reserva.phone}</span>
                        {reserva.email && <span className="text-xs text-zinc-400 flex items-center gap-1.5"><Mail className="w-3 h-3 text-zinc-500"/> {reserva.email}</span>}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/50 p-4 rounded-2xl border border-white/5">
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1"><Users className="w-3 h-3"/> Total PAX</p>
                    <p className="text-2xl font-black text-white">{reserva.guests} <span className="text-sm text-zinc-500 font-medium">Personas</span></p>
                </div>
                <div className="bg-black/50 p-4 rounded-2xl border border-white/5">
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1"><Hash className="w-3 h-3"/> Fecha</p>
                    <p className="text-sm font-bold text-white mt-1">{reserva.date_reserva}</p>
                </div>
            </div>

            {/* SECCIÓN TICKETS */}
            {tickets.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-[10px] text-purple-400 font-black uppercase tracking-widest flex items-center gap-1.5 border-b border-white/10 pb-2">
                        <Ticket className="w-4 h-4"/> Detalle de Entradas
                    </h3>
                    <ul className="space-y-2 pt-2">
                        {tickets.map((t: any, i: number) => (
                            <li key={i} className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
                                <span className="font-bold text-white text-sm">{t.name}</span>
                                <span className="bg-purple-600 text-white px-3 py-1 rounded-lg font-black text-sm">x{t.quantity}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* SECCIÓN MENÚ ANTICIPADO */}
            {menu.length > 0 && (
                <div className="space-y-2 pt-2">
                    <h3 className="text-[10px] text-[#DAA520] font-black uppercase tracking-widest flex items-center gap-1.5 border-b border-white/10 pb-2">
                        <Utensils className="w-4 h-4"/> Menú Pre-Pagado a Entregar
                    </h3>
                    <ul className="space-y-2 pt-2">
                        {menu.map((m: any, i: number) => (
                            <li key={i} className="flex justify-between items-center bg-[#DAA520]/10 p-3 rounded-xl border border-[#DAA520]/20">
                                <span className="font-bold text-[#DAA520] text-sm">{m.name}</span>
                                <span className="bg-[#DAA520] text-black px-3 py-1 rounded-lg font-black text-sm">x{m.quantity}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* BOTÓN DE ACCIÓN PRINCIPAL (Solo visible si el estado es 'confirmada') */}
            <div className="pt-4">
                {reserva.status === 'confirmada' ? (
                  <button 
                    onClick={handleCheckIn}
                    disabled={processing}
                    className="w-full py-5 bg-gradient-to-r from-green-500 to-green-700 text-white rounded-2xl font-black text-lg uppercase tracking-widest shadow-[0_0_30px_rgba(34,197,94,0.3)] hover:shadow-[0_0_40px_rgba(34,197,94,0.5)] transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100"
                  >
                    {processing ? "REGISTRANDO..." : "ESCANEAR Y PERMITIR ACCESO"}
                  </button>
                ) : (
                  <div className={`w-full py-4 rounded-2xl font-black text-center uppercase tracking-widest flex items-center justify-center gap-2 border ${reserva.status === 'realizado' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                      <XCircle className="w-5 h-5"/> ACCESO DENEGADO / NO VÁLIDO
                  </div>
                )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}