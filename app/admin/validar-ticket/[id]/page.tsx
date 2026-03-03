"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { Ticket, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ValidarTicketPage() {
  const { id } = useParams(); 

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [ticket, setTicket] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchTicket = async () => {
    if (!id) return;
    try {
      const { data, error } = await supabase
        .from("tickets")
        .select(`*, shows ( nombre )`)
        .eq("id", id)
        .single();

      if (error) throw error;
      setTicket(data);
    } catch (err: any) {
      setError("Entrada no encontrada o código inválido.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const handleCheckIn = async () => {
    if (!ticket?.id) return;
    setProcessing(true);
    
    try {
      const { error } = await supabase
        .from("tickets")
        .update({ status: 'used' })
        .eq('id', ticket.id);

      if (error) throw error;
      
      setTicket({ ...ticket, status: 'used' });

    } catch (err: any) {
      alert("❌ Error al registrar entrada: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const s = status?.toLowerCase() || '';
    if (s === 'valid') return { color: 'bg-green-600', text: 'ENTRADA VÁLIDA', icon: 'check' };
    if (s === 'used') return { color: 'bg-blue-600', text: 'YA FUE USADA', icon: 'in' };
    return { color: 'bg-red-600', text: 'CANCELADA / INVÁLIDA', icon: 'x' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#DAA520] mb-4"></div>
        <p className="text-[#DAA520]">Verificando QR de Entrada...</p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-red-950 flex flex-col items-center justify-center p-6 text-center">
        <XCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">ENTRADA FALSA O NO VÁLIDA</h1>
        <Link href="/admin/dashboard" className="mt-6 px-6 py-3 bg-white/10 text-white rounded-lg">Volver al Dashboard</Link>
      </div>
    );
  }

  const statusInfo = getStatusConfig(ticket.status);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center p-6 font-sans">
      <div className="w-full max-w-md mt-6 mb-6 text-center">
        <p className="text-gray-500 text-xs uppercase tracking-[0.2em] font-bold">Control de Puerta - Shows</p>
        <h2 className="text-xl font-bold text-[#DAA520] mt-1 tracking-widest">BOULEVARD ZAPALLAR</h2>
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className={`${statusInfo.color} p-8 text-center`}>
          <h1 className="text-3xl font-black text-white uppercase">{statusInfo.text}</h1>
        </div>

        <div className="p-6 space-y-4">
          <div className="border-b pb-4">
            <span className="text-xs text-gray-400 font-bold uppercase">Cliente</span>
            <p className="text-xl font-black text-gray-900">{ticket.customer_name || "Sin Nombre"}</p>
            <p className="text-sm text-gray-500">{ticket.user_email}</p>
          </div>

          <div className="border-b pb-4">
            <span className="text-xs text-gray-400 font-bold uppercase">Show / Evento</span>
            <p className="text-lg font-bold text-gray-900 flex items-center gap-2 mt-1">
              <Ticket className="text-[#DAA520] w-5 h-5" />
              {ticket.shows?.nombre || "Evento General"}
            </p>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg text-center">
             <p className="text-[10px] text-gray-400 font-bold uppercase">ID Ticket</p>
             <p className="text-xs font-mono font-bold text-gray-500 truncate">{ticket.id}</p>
          </div>

          {ticket.status === 'valid' && (
            <button 
              onClick={handleCheckIn}
              disabled={processing}
              className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold shadow-lg hover:bg-black transition flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5 text-[#DAA520]" />
              VALIDAR ACCESO
            </button>
          )}

          {ticket.status === 'used' && (
             <div className="w-full py-4 bg-blue-50 text-blue-800 rounded-xl font-bold text-center border border-blue-200">
                ⚠️ TICKET YA ESCANEADO
             </div>
          )}
        </div>
      </div>
    </div>
  );
}