"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { CheckCircle, Loader2, XCircle, Mail, ArrowRight, Ticket, Download, Receipt } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

// 1. Componente interno: Maneja la lógica de los parámetros URL y la consulta a la BD
function ContenidoConfirmacion() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("order");

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'timeout'>('loading');
  const [reserva, setReserva] = useState<any>(null);
  const [ticketsGenerados, setTicketsGenerados] = useState<any[]>([]);

  useEffect(() => {
    if (!orderId) {
      setStatus('error');
      return;
    }

    // Función para consultar el estado y obtener los tickets generados
    const checkPaymentStatus = async () => {
      try {
        // 1. Buscar la reserva
        const { data: reservaData, error: reservaError } = await supabase
          .from('reservas')
          .select('*')
          .eq('id', orderId)
          .single();

        if (reservaError) throw reservaError;

        // Si el Webhook ya actualizó el estado a 'pagado'
        if (reservaData.status === 'pagado') {
          setReserva(reservaData);
          
          // 2. Si compró entradas, buscamos los tickets recién generados en Supabase
          const carrito = reservaData.pre_order || [];
          const totalEntradas = carrito
            .filter((item: any) => item.category === 'ticket')
            .reduce((acc: number, item: any) => acc + item.quantity, 0);

          if (totalEntradas > 0) {
            // Buscamos los últimos tickets creados con ese correo (los que hizo el webhook)
            const { data: ticketsData } = await supabase
                .from('tickets')
                .select('*')
                .eq('user_email', reservaData.email)
                .order('created_at', { ascending: false })
                .limit(totalEntradas);
            
            if (ticketsData) setTicketsGenerados(ticketsData);
          }

          setStatus('success');
          return true; // Retornamos true para detener el intervalo
        } else if (reservaData.status === 'rechazado' || reservaData.status === 'cancelado' || reservaData.status === 'error') {
          setStatus('error');
          return true;
        }
        
        // Si sigue pendiente, retornamos false para seguir buscando
        return false; 
      } catch (err) {
        console.error("Error consultando reserva:", err);
        return false;
      }
    };

    // Hacer la primera consulta de inmediato
    checkPaymentStatus();

    // Configurar el Polling (consultar cada 3 segundos hasta que GetNet/Webhook respondan)
    const intervalId = setInterval(async () => {
      const isFinished = await checkPaymentStatus();
      if (isFinished) {
        clearInterval(intervalId);
      }
    }, 3000);

    // Timeout de 2 minutos por si GetNet se cae
    const timeoutId = setTimeout(() => {
      clearInterval(intervalId);
      if (status === 'loading') setStatus('timeout');
    }, 120000);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [orderId, status]);

  // Función para obtener el nombre legible del evento desde el carrito
  const getEventName = (eventId: string) => {
      if (!reserva?.pre_order) return "Entrada General";
      const item = reserva.pre_order.find((p: any) => String(p.id) === String(eventId));
      return item ? item.name : "Entrada General";
  };

  // --- VISTA 1: CARGANDO (ESPERANDO AL WEBHOOK) ---
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white font-sans p-6 text-center">
        <div className="relative">
            <div className="absolute inset-0 bg-[#DAA520] blur-[30px] opacity-20 rounded-full"></div>
            <Loader2 className="w-16 h-16 animate-spin text-[#DAA520] relative z-10 mb-6" />
        </div>
        <h1 className="text-2xl font-black uppercase tracking-widest mb-2">Validando Transacción</h1>
        <p className="text-zinc-400 text-sm max-w-sm mt-2">
          Estamos procesando tu pago con GetNet. Por favor, no cierres esta ventana...
        </p>
      </div>
    );
  }

  // --- VISTA 2: TIMEOUT O ERROR ---
  if (status === 'error' || status === 'timeout') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white font-sans p-6 text-center">
        <XCircle className="w-20 h-20 text-red-500 mb-6 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
        <h1 className="text-3xl font-black uppercase tracking-widest mb-2">Pago No Confirmado</h1>
        <p className="text-zinc-400 text-sm max-w-sm mb-8 mt-2">
          {status === 'timeout' 
            ? "El banco está tardando demasiado en responder. Si el cobro fue realizado, tu entrada llegará al correo en los próximos minutos."
            : "Hubo un problema con tu pago o la reserva no existe. Por favor, intenta nuevamente."}
        </p>
        <button onClick={() => router.push('/')} className="px-8 py-4 bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-white rounded-xl font-bold uppercase tracking-widest transition-colors">
          Volver al Inicio
        </button>
      </div>
    );
  }

  // --- VISTA 3: ÉXITO (PAGO APROBADO) ---
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center py-12 px-4 font-sans relative overflow-hidden print:bg-white print:py-0">
        
        {/* Fondo Decorativo (Oculto al imprimir) */}
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#DAA520]/10 rounded-full blur-[120px] pointer-events-none print:hidden"></div>

        <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-3xl p-8 shadow-[0_0_50px_rgba(218,165,32,0.15)] relative z-10 print:shadow-none print:border-none print:bg-white print:text-black"
        >
            {/* ENCABEZADO DE ÉXITO */}
            <div className="text-center mb-8 print:hidden">
                <motion.div 
                    initial={{ scale: 0 }} 
                    animate={{ scale: 1 }} 
                    transition={{ type: "spring", delay: 0.2 }}
                    className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20"
                >
                    <CheckCircle className="w-12 h-12 text-green-500" />
                </motion.div>
                <h1 className="text-2xl font-black text-white uppercase tracking-wider mb-2">¡Compra Exitosa!</h1>
                <p className="text-zinc-400 text-sm">Tu reserva y pago están 100% confirmados.</p>
            </div>

            {/* CAJA DE ALERTA DE CORREO RESEND (Oculta al imprimir) */}
            <div className="bg-[#DAA520]/10 border border-[#DAA520]/30 rounded-2xl p-5 mb-8 flex gap-4 items-start print:hidden">
                <Mail className="w-8 h-8 text-[#DAA520] shrink-0 mt-1" />
                <div>
                    <h3 className="text-sm font-bold text-[#DAA520] uppercase tracking-wider mb-1">Revisa tu Correo</h3>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                        A través de <strong>Resend</strong>, hemos enviado a <span className="font-semibold text-white">{reserva?.email}</span> un archivo PDF oficial con estas mismas entradas. 
                    </p>
                </div>
            </div>

            {/* RENDERIZADO VISUAL DE ENTRADAS (TIPO PASSLINE) */}
            {ticketsGenerados.length > 0 && (
                <div className="mb-10 space-y-6">
                    <div className="flex justify-between items-center border-b border-white/10 pb-3 print:border-black/10">
                        <h4 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 print:text-black">
                            <Ticket className="w-5 h-5 text-[#DAA520]"/> Tus Entradas
                        </h4>
                        <button onClick={() => window.print()} className="text-[10px] bg-white text-black px-3 py-1.5 rounded-lg font-bold uppercase flex items-center gap-1 hover:bg-gray-200 transition-colors print:hidden">
                            <Download className="w-3 h-3"/> Descargar PDF
                        </button>
                    </div>

                    <div className="grid gap-5">
                        {ticketsGenerados.map((ticket, index) => (
                            <div key={ticket.id} className="relative bg-white rounded-2xl overflow-hidden flex flex-col sm:flex-row shadow-lg border border-gray-200 print:shadow-none print:border-2 print:border-black">
                                
                                {/* Lado Izquierdo: Branding */}
                                <div className="bg-[#DAA520] p-4 sm:w-16 flex items-center justify-center border-b sm:border-b-0 sm:border-r-2 border-dashed border-black/20">
                                    <span className="sm:-rotate-90 font-black tracking-[0.3em] text-black text-xs whitespace-nowrap">BOULEVARD ZAPALLAR</span>
                                </div>

                                {/* Centro: Datos */}
                                <div className="flex-1 p-5 flex flex-col justify-center border-b sm:border-b-0 sm:border-r-2 border-dashed border-gray-300">
                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Entrada Oficial</span>
                                    <h3 className="text-xl font-black text-black uppercase leading-tight mb-3">
                                        {getEventName(ticket.event_id)}
                                    </h3>
                                    
                                    <div className="space-y-1">
                                        <p className="text-xs text-gray-600"><strong className="text-gray-900">Titular:</strong> {ticket.customer_name}</p>
                                        <p className="text-xs text-gray-600"><strong className="text-gray-900">Fecha:</strong> {reserva.date_reserva}</p>
                                        <p className="text-[10px] text-gray-400 mt-2">ID: {ticket.id}</p>
                                    </div>
                                </div>

                                {/* Lado Derecho: Código QR (Sincronizado con Supabase) */}
                                <div className="p-5 flex flex-col items-center justify-center bg-gray-50 min-w-[160px]">
                                    <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                                        {/* Usamos api pública para generar QR sin cargar el cliente */}
                                        <img 
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${ticket.id}`} 
                                            alt="Código QR de Acceso" 
                                            className="w-24 h-24 sm:w-28 sm:h-28"
                                        />
                                    </div>
                                    <span className="text-[9px] text-gray-400 font-bold uppercase mt-2 text-center">Escanear en puerta</span>
                                </div>

                                {/* Círculos de recorte tipo ticket */}
                                <div className="hidden sm:block absolute top-[-10px] right-[150px] w-5 h-5 bg-zinc-900 rounded-full print:bg-white"></div>
                                <div className="hidden sm:block absolute bottom-[-10px] right-[150px] w-5 h-5 bg-zinc-900 rounded-full print:bg-white"></div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* RESUMEN DE COMPRA GENERAL */}
            <div className="bg-black/50 rounded-2xl p-6 border border-white/5 space-y-4 mb-8 print:hidden">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest border-b border-white/5 pb-3 flex items-center gap-2">
                    <Receipt className="w-4 h-4"/> Detalle de Facturación
                </h4>
                
                <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-zinc-400">Titular</span>
                        <span className="text-sm font-bold text-white uppercase">{reserva?.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-zinc-400">ID Operación GetNet</span>
                        <span className="text-xs font-mono text-zinc-500">{orderId}</span>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                    <span className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Total Pagado</span>
                    <span className="text-xl font-black text-[#DAA520]">${reserva?.total_pre_order?.toLocaleString('es-CL') || 0}</span>
                </div>
            </div>

            {/* BOTÓN VOLVER (Oculto al imprimir) */}
            <Link href="/" className="w-full py-4 bg-white text-black rounded-xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors print:hidden shadow-lg">
                Volver a la Página Principal <ArrowRight className="w-4 h-4" />
            </Link>
        </motion.div>
    </div>
  );
}

// Envolvemos todo en Suspense porque useSearchParams lo requiere en App Router de Next.js
export default function ConfirmacionPage() {
  return (
    <Suspense fallback={
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white">
            <Loader2 className="w-12 h-12 animate-spin text-[#DAA520] mb-4"/>
            <p className="text-zinc-500 text-sm font-bold tracking-widest uppercase">Cargando transacción...</p>
        </div>
    }>
      <ContenidoConfirmacion />
    </Suspense>
  );
}