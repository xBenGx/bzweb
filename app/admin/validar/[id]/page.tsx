"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { Utensils, ShoppingBag, CheckCircle, XCircle, Clock, UserCheck, MapPin, AlertTriangle } from "lucide-react";

// ----------------------------------------------------------------------
// CONFIGURACIÓN SUPABASE
// ----------------------------------------------------------------------
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ValidarReservaPage() {
  const { id } = useParams(); 
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [reserva, setReserva] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // --- HELPER: FORMATO DE FECHA SEGURO (SOLUCIÓN INVALID DATE) ---
  const formatDateSafe = (dateString: string) => {
      if (!dateString) return "Sin Fecha";
      // Agregamos T12:00:00 para asegurar que la fecha se interprete al mediodía 
      // y evitar que la zona horaria reste un día.
      const date = new Date(`${dateString}T12:00:00`); 
      if (isNaN(date.getTime())) return dateString; 
      
      return date.toLocaleDateString('es-CL', { 
          weekday: 'long', 
          day: 'numeric', 
          month: 'long' 
      });
  };

  // Función para obtener la reserva
  const fetchReserva = async () => {
    if (!id) return;
    try {
      const { data, error } = await supabase
        .from("reservas")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setReserva(data);
    } catch (err: any) {
      console.error("Error validando:", err);
      setError("Reserva no encontrada o código inválido.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReserva();
  }, [id]);

  // Función para marcar el ingreso (Check-in)
  const handleCheckIn = async () => {
    if (!reserva?.id) return;
    setProcessing(true);
    
    try {
      // 1. Intentamos actualizar en Supabase
      // Nota: Usamos 'realizado' o 'ingresado' según lo que uses en tu Dashboard. 
      // He puesto 'realizado' para ser consistente con el panel anterior, 
      // pero si tu ENUM requiere 'ingresado', cámbialo aquí.
      const { error } = await supabase
        .from("reservas")
        .update({ 
            status: 'realizado', // Cambiado a 'realizado' para coincidir con lógica común, o usa 'ingresado'
            check_in_time: new Date().toISOString() 
        })
        .eq('id', reserva.id);

      if (error) throw error;
      
      // 2. Actualización Optimista (Visual inmediata)
      setReserva({ 
          ...reserva, 
          status: 'realizado',
          check_in_time: new Date().toISOString()
      });

      // 3. Feedback visual suave (sin alert intrusivo si prefieres)
      // alert("✅ Entrada registrada correctamente"); 

    } catch (err: any) {
      alert("❌ Error al registrar entrada: " + err.message);
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  // Lógica visual del estado
  const getStatusConfig = (status: string) => {
    // Normalizamos el status a minúsculas por seguridad
    const s = status?.toLowerCase() || '';
    
    if (s === 'confirmada') {
        return { color: 'bg-green-600', text: 'VÁLIDO', sub: 'Acceso Autorizado', icon: 'check' };
    } else if (s === 'ingresado' || s === 'realizado') {
        return { color: 'bg-blue-600', text: 'ADENTRO', sub: 'Ya ingresó al local', icon: 'in' };
    } else if (s === 'pendiente') {
        return { color: 'bg-yellow-500', text: 'PENDIENTE', sub: 'Pago no verificado', icon: 'wait' };
    } else {
        return { color: 'bg-red-600', text: 'CANCELADA', sub: 'Acceso Denegado', icon: 'x' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#DAA520] mb-4"></div>
        <p className="text-lg font-mono animate-pulse text-[#DAA520]">Verificando QR...</p>
      </div>
    );
  }

  if (error || !reserva) {
    return (
      <div className="min-h-screen bg-red-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-4 rounded-full mb-6 shadow-red-900/50 shadow-xl">
          <XCircle className="w-12 h-12 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">CÓDIGO NO VÁLIDO</h1>
        <p className="text-white/70 mb-6">No se encontró información para este código.</p>
        <Link href="/admin/dashboard" className="px-6 py-3 bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 transition font-bold">
          Volver al Dashboard
        </Link>
      </div>
    );
  }

  const statusInfo = getStatusConfig(reserva.status);

  // Calcular total del pre-order si existe
  const hasPreOrder = reserva.pre_order && Array.isArray(reserva.pre_order) && reserva.pre_order.length > 0;
  
  const preOrderTotal = hasPreOrder
    ? reserva.pre_order.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0)
    : 0;

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center p-4 sm:p-6 font-sans">
      
      <div className="w-full max-w-md mt-6 mb-6 text-center">
        <p className="text-gray-500 text-xs uppercase tracking-[0.2em] font-bold">Sistema de Control</p>
        <h2 className="text-xl font-bold text-[#DAA520] mt-1 tracking-widest">BOULEVARD ZAPALLAR</h2>
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden relative">
        
        {/* Banner de Estado */}
        <div className={`${statusInfo.color} p-10 text-center transition-colors duration-500 relative overflow-hidden`}>
          {/* Patrón de fondo sutil */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-black to-transparent"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-md rounded-full mb-4 border-4 border-white/30 shadow-lg">
               {statusInfo.icon === 'check' && <CheckCircle className="w-10 h-10 text-white" />}
               {statusInfo.icon === 'in' && <UserCheck className="w-10 h-10 text-white" />}
               {statusInfo.icon === 'wait' && <AlertTriangle className="w-10 h-10 text-white" />}
               {statusInfo.icon === 'x' && <XCircle className="w-10 h-10 text-white" />}
            </div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tight shadow-sm drop-shadow-md">{statusInfo.text}</h1>
            <p className="text-white/90 font-bold text-sm mt-1 uppercase tracking-wide">{statusInfo.sub}</p>
          </div>
        </div>

        <div className="p-6 space-y-6 bg-white relative">
          
          {/* Datos Principales */}
          <div className="flex flex-col border-b border-gray-100 pb-4">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Titular de la Reserva</span>
            <span className="text-gray-900 font-black text-2xl truncate">{reserva.name || "Sin Nombre"}</span>
            <span className="text-gray-500 text-sm font-medium mt-1">{reserva.email}</span>
          </div>

          <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-4">
            <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Personas</span>
                <p className="text-gray-900 font-bold text-xl flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-[#DAA520]" />
                    {reserva.guests} <span className="text-sm font-normal text-gray-500">pax</span>
                </p>
            </div>
            <div className="text-right">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Zona</span>
                <p className="text-gray-900 font-bold text-xl flex items-center justify-end gap-2">
                    {reserva.zone || "General"} <MapPin className="w-5 h-5 text-[#DAA520]" />
                </p>
            </div>
          </div>

          <div className="border-b border-gray-100 pb-4">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Fecha y Hora</span>
            <div className="flex items-center gap-3">
                <div className="bg-gray-100 p-2 rounded-lg"><Clock className="w-6 h-6 text-gray-600"/></div>
                <div>
                    {/* APLICACIÓN DE LA FECHA SEGURA */}
                    <p className="text-gray-900 font-bold text-lg capitalize leading-tight">
                        {formatDateSafe(reserva.date_reserva)}
                    </p>
                    <p className="text-[#DAA520] font-bold text-sm">
                        {reserva.time_reserva} hrs
                    </p>
                </div>
            </div>
          </div>

          {/* --- SECCIÓN PEDIDO ANTICIPADO (ACTUALIZADA) --- */}
          {/* Se renderiza solo si hasPreOrder es true */}
          {hasPreOrder && (
            <div className="bg-[#FFF8E1] rounded-2xl border-2 border-[#DAA520] p-5 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-[#DAA520] text-black text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase">
                    Pagado Web
                </div>
                
                <div className="flex items-center gap-2 mb-4">
                    <div className="bg-[#DAA520] p-2 rounded-full text-white">
                        <Utensils className="w-5 h-5"/>
                    </div>
                    <div>
                        <p className="text-sm font-black text-gray-900 uppercase tracking-wide leading-none">Menú Incluido</p>
                        <p className="text-[10px] text-gray-600">El cliente ya pagó estos productos</p>
                    </div>
                </div>

                <div className="space-y-3 mb-4 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                    {reserva.pre_order.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between items-center text-sm border-b border-[#DAA520]/20 pb-2 last:border-0 last:pb-0">
                            <div className="flex items-center gap-3">
                                <span className="bg-white border-2 border-[#DAA520] w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold text-black shadow-sm">
                                    {item.quantity}
                                </span>
                                <span className="text-gray-800 font-bold leading-tight">{item.name}</span>
                            </div>
                            <span className="text-gray-500 font-medium text-xs">${(item.price * item.quantity).toLocaleString('es-CL')}</span>
                        </div>
                    ))}
                </div>
                
                <div className="bg-white/60 rounded-xl p-3 flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500 uppercase">Total Pedido</span>
                    <span className="text-xl font-black text-[#DAA520]">${preOrderTotal.toLocaleString('es-CL')}</span>
                </div>
            </div>
          )}

          {/* Código de Reserva Sincronizado */}
          <div className="bg-gray-50 p-4 rounded-xl text-center border-2 border-dashed border-gray-200">
             <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">CÓDIGO DE RESERVA</p>
             <p className="text-3xl font-mono font-black text-gray-800 tracking-widest break-all">
                {reserva.reservation_code || reserva.code || "---"}
             </p>
          </div>

          {/* Botones de Acción */}
          {reserva.status === 'confirmada' && (
            <button 
              onClick={handleCheckIn}
              disabled={processing}
              className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold text-lg shadow-xl shadow-gray-900/30 hover:bg-black hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              {processing ? (
                <>
                    <span className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full"></span>
                    Registrando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-6 h-6 text-[#DAA520]" />
                  REGISTRAR ENTRADA
                </>
              )}
            </button>
          )}

          {(reserva.status === 'ingresado' || reserva.status === 'realizado') && (
             <div className="w-full py-4 bg-blue-50 text-blue-800 rounded-xl font-bold text-center border-2 border-blue-100 flex flex-col items-center justify-center gap-1 shadow-inner">
                <div className="flex items-center gap-2">
                    <CheckCircle className="w-6 h-6" />
                    <span className="text-lg">INGRESO REGISTRADO</span>
                </div>
                <span className="text-xs text-blue-400">
                    {reserva.check_in_time ? new Date(reserva.check_in_time).toLocaleTimeString() : 'Hora registrada'}
                </span>
             </div>
          )}

        </div>
      </div>

      <Link href="/admin/dashboard" className="mt-8 px-6 py-3 rounded-full bg-gray-800 border border-gray-700 text-gray-300 text-xs font-bold uppercase tracking-widest hover:text-white hover:bg-gray-700 transition flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        Volver al Dashboard
      </Link>

    </div>
  );
}