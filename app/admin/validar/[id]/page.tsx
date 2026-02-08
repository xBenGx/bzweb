"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { Utensils, ShoppingBag } from "lucide-react"; // Agregamos iconos para el pedido

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
      const { error } = await supabase
        .from("reservas")
        .update({ status: 'ingresado', check_in_time: new Date().toISOString() })
        .eq('id', reserva.id);

      if (error) throw error;
      
      setReserva({ ...reserva, status: 'ingresado' });
      alert("✅ Entrada registrada correctamente");
    } catch (err) {
      alert("❌ Error al registrar entrada");
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  // Lógica visual del estado
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'confirmada':
        return { color: 'bg-green-600', text: 'VÁLIDO', sub: 'Acceso Autorizado', icon: 'check' };
      case 'ingresado':
        return { color: 'bg-blue-600', text: 'ADENTRO', sub: 'Ya ingresó al local', icon: 'in' };
      case 'pendiente':
        return { color: 'bg-yellow-500', text: 'PENDIENTE', sub: 'Pago no verificado', icon: 'wait' };
      default:
        return { color: 'bg-red-600', text: 'CANCELADA', sub: 'Acceso Denegado', icon: 'x' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-green-500 mb-4"></div>
        <p className="text-lg font-mono animate-pulse">Sincronizando...</p>
      </div>
    );
  }

  if (error || !reserva) {
    return (
      <div className="min-h-screen bg-red-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-4 rounded-full mb-6 shadow-red-900/50 shadow-xl">
          <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">CÓDIGO NO VÁLIDO</h1>
        <Link href="/admin/dashboard" className="px-6 py-2 bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 transition mt-4">
          Volver al Dashboard
        </Link>
      </div>
    );
  }

  const statusInfo = getStatusConfig(reserva.status);

  // Calcular total del pre-order si existe
  const preOrderTotal = reserva.pre_order 
    ? reserva.pre_order.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0)
    : 0;

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center p-4 sm:p-6 font-sans">
      
      <div className="w-full max-w-md mt-6 mb-6 text-center">
        <p className="text-gray-500 text-xs uppercase tracking-[0.2em]">Sistema de Control</p>
        <h2 className="text-xl font-bold text-white mt-1">Boulevard Zapallar</h2>
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden relative">
        
        {/* Banner de Estado */}
        <div className={`${statusInfo.color} p-8 text-center transition-colors duration-500 relative overflow-hidden`}>
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full mb-3 border-2 border-white/30">
               {statusInfo.icon === 'check' && <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>}
               {statusInfo.icon === 'in' && <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path></svg>}
               {statusInfo.icon === 'wait' && <span className="text-3xl">⚠️</span>}
               {statusInfo.icon === 'x' && <span className="text-3xl">✖️</span>}
            </div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tight shadow-sm">{statusInfo.text}</h1>
            <p className="text-white/90 font-medium text-sm mt-1">{statusInfo.sub}</p>
          </div>
        </div>

        <div className="p-6 space-y-5 bg-white">
          
          <div className="flex flex-col border-b border-gray-100 pb-3">
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Titular</span>
            <span className="text-gray-900 font-bold text-xl truncate">{reserva.name || "Sin Nombre"}</span>
          </div>

          <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-3">
            <div>
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Personas</span>
                <p className="text-gray-900 font-bold text-lg">{reserva.guests} <span className="text-sm font-normal text-gray-500">pax</span></p>
            </div>
            <div className="text-right">
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Zona</span>
                <p className="text-gray-900 font-bold text-lg">{reserva.zone || "General"}</p>
            </div>
          </div>

          <div className="border-b border-gray-100 pb-3">
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Fecha y Hora</span>
            <p className="text-gray-900 font-bold text-lg capitalize">
                {reserva.date_reserva ? new Date(reserva.date_reserva).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' }) : "Fecha abierta"}
                <span className="text-gray-400 text-sm ml-2">| {reserva.time_reserva} hrs</span>
            </p>
          </div>

          {/* --- SECCIÓN PEDIDO ANTICIPADO (NUEVO) --- */}
          {reserva.pre_order && reserva.pre_order.length > 0 && (
            <div className="bg-gray-50 rounded-xl border border-dashed border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                        <Utensils className="w-3 h-3"/> Pedido Anticipado
                    </p>
                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">PAGADO</span>
                </div>
                <div className="space-y-2">
                    {reserva.pre_order.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between text-sm">
                            <span className="text-gray-700 font-medium flex items-center gap-2">
                                <span className="bg-white border border-gray-200 w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold">{item.quantity}</span>
                                {item.name}
                            </span>
                            <span className="text-gray-900 font-bold">${(item.price * item.quantity).toLocaleString('es-CL')}</span>
                        </div>
                    ))}
                </div>
                <div className="border-t border-gray-200 mt-3 pt-2 flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-400 uppercase">Total Compra</span>
                    <span className="text-lg font-black text-gray-800">${preOrderTotal.toLocaleString('es-CL')}</span>
                </div>
            </div>
          )}

          {/* Código de Reserva Sincronizado */}
          <div className="bg-gray-50 p-4 rounded-xl text-center border-2 border-dashed border-gray-200 mt-2">
             <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">CÓDIGO DE RESERVA</p>
             <p className="text-2xl font-mono font-black text-gray-700 tracking-widest break-all">
                {reserva.reservation_code || reserva.code || "---"}
             </p>
          </div>

          {/* Botones de Acción */}
          {reserva.status === 'confirmada' && (
            <button 
              onClick={handleCheckIn}
              disabled={processing}
              className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-gray-800 active:scale-95 transition-all flex items-center justify-center gap-2 mt-4"
            >
              {processing ? (
                <span className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full"></span>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  Registrar Ingreso
                </>
              )}
            </button>
          )}

          {reserva.status === 'ingresado' && (
             <div className="w-full py-3 bg-blue-50 text-blue-700 rounded-xl font-bold text-center border border-blue-100 mt-4">
                ✅ Cliente ya ingresado
             </div>
          )}

        </div>
      </div>

      <Link href="/admin/dashboard" className="mt-8 px-4 py-2 rounded-full bg-gray-800/50 text-gray-400 text-sm hover:text-white hover:bg-gray-800 transition">
        ← Volver al Dashboard
      </Link>

    </div>
  );
}