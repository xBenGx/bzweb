"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

// ----------------------------------------------------------------------
// CONFIGURACIÓN RÁPIDA (Replicamos cliente para lectura)
// ----------------------------------------------------------------------
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ValidarReservaPage() {
  const { id } = useParams(); // Capturamos el ID de la URL
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [reserva, setReserva] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReserva() {
      if (!id) return;

      try {
        console.log("🔍 Buscando reserva:", id);
        
        // Buscamos la reserva en Supabase
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
    }

    fetchReserva();
  }, [id]);

  // ----------------------------------------------------------------------
  // 1. ESTADO DE CARGA
  // ----------------------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white p-6">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-500 mb-4"></div>
        <p className="text-xl animate-pulse">Verificando QR...</p>
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // 2. ESTADO DE ERROR (ROJO)
  // ----------------------------------------------------------------------
  if (error || !reserva) {
    return (
      <div className="min-h-screen bg-red-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-4 rounded-full mb-6">
          <svg className="w-16 h-16 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">¡ACCESO DENEGADO!</h1>
        <p className="text-red-200 text-lg mb-8">{error || "El código no existe en el sistema."}</p>
        
        <Link href="/admin/dashboard" className="px-6 py-3 bg-white text-red-900 font-bold rounded-lg shadow-lg hover:bg-gray-200 transition">
          Volver al Dashboard
        </Link>
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // 3. ESTADO EXITOSO (VERDE/DORADO)
  // ----------------------------------------------------------------------
  // Determinamos el color según el estado actual
  const isConfirmed = reserva.status === "confirmada";
  const isPending = reserva.status === "pendiente";
  
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center p-6">
      
      {/* Encabezado */}
      <div className="w-full max-w-md mt-10 mb-8 text-center">
        <p className="text-gray-400 text-sm uppercase tracking-widest">Sistema de Control</p>
        <h2 className="text-2xl font-bold text-white mt-1">Boulevard Zapallar</h2>
      </div>

      {/* Tarjeta de Validación */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Banner de Estado */}
        <div className={`p-6 text-center ${isConfirmed ? 'bg-green-600' : isPending ? 'bg-yellow-500' : 'bg-red-500'}`}>
          {isConfirmed ? (
            <>
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-3 shadow-inner">
                 <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                 </svg>
              </div>
              <h1 className="text-3xl font-black text-white uppercase tracking-wider">VÁLIDO</h1>
              <p className="text-green-100 font-medium mt-1">Acceso Autorizado</p>
            </>
          ) : (
            <>
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-3 shadow-inner">
                 <span className="text-4xl">⚠️</span>
              </div>
              <h1 className="text-2xl font-black text-white uppercase tracking-wider">
                {reserva.status === 'pendiente' ? 'PENDIENTE' : 'CANCELADA'}
              </h1>
              <p className="text-white/80 font-medium mt-1">Revisar pago o estado</p>
            </>
          )}
        </div>

        {/* Detalles de la Reserva */}
        <div className="p-8 space-y-6">
          
          <div className="flex justify-between border-b border-gray-100 pb-4">
            <span className="text-gray-400 font-medium">Titular</span>
            <span className="text-gray-900 font-bold text-lg">{reserva.name}</span>
          </div>

          <div className="flex justify-between border-b border-gray-100 pb-4">
            <span className="text-gray-400 font-medium">Personas</span>
            <span className="text-gray-900 font-bold text-xl">{reserva.guests} pax</span>
          </div>

          <div className="flex justify-between border-b border-gray-100 pb-4">
            <span className="text-gray-400 font-medium">Fecha</span>
            <span className="text-gray-900 font-bold">{reserva.date_reserva || "Fecha no definida"}</span>
          </div>

          <div className="flex justify-between items-center pt-2">
             <span className="text-gray-400 font-medium">Zona</span>
             <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-semibold">
               {reserva.zone || "General"}
             </span>
          </div>
          
          {/* Código de Reserva */}
          <div className="mt-8 bg-gray-50 p-4 rounded-lg text-center border border-dashed border-gray-300">
             <p className="text-xs text-gray-400 mb-1">CÓDIGO DE RESERVA</p>
             <p className="text-2xl font-mono font-bold text-gray-700 tracking-widest">{reserva.code || "---"}</p>
          </div>

        </div>
      </div>

      {/* Botón Salir */}
      <Link href="/admin/dashboard" className="mt-8 text-gray-500 hover:text-white transition underline">
        Volver al panel principal
      </Link>

    </div>
  );
}