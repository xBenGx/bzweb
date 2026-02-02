"use client";

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react'; // Importación vital para corregir el error
import Link from 'next/link';
import { CheckCircle, Loader2 } from 'lucide-react';

// 1. Componente interno: Maneja la lógica de los parámetros URL
function ContenidoConfirmacion() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status');
  const orderId = searchParams.get('order');

  if (status === 'success') {
    return (
      <div className="bg-zinc-900 border border-[#DAA520] p-8 rounded-2xl max-w-md w-full shadow-[0_0_50px_rgba(218,165,32,0.2)]">
        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
        <h1 className="text-3xl font-black text-white uppercase mb-2">¡Pago Exitoso!</h1>
        <p className="text-zinc-400 mb-6">Tu orden #{orderId} ha sido confirmada. Te esperamos en Boulevard Zapallar.</p>
        
        <Link href="/" className="block w-full bg-[#DAA520] text-black font-bold py-4 rounded-xl hover:bg-white transition-colors">
            VOLVER AL INICIO
        </Link>
      </div>
    );
  }

  // Estado por defecto (si no es success o está cargando lógica)
  return (
    <div className="text-white flex flex-col items-center">
        <Loader2 className="w-12 h-12 text-[#DAA520] animate-spin mb-4" />
        <h1 className="text-2xl font-bold">Procesando pago...</h1>
        <p className="text-zinc-500 text-sm mt-2">Estamos validando la transacción.</p>
    </div>
  );
}

// 2. Componente Principal: Envuelve todo en Suspense
export default function ConfirmacionPage() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
      {/* El Suspense le dice a Next.js qué mostrar mientras 'lee' la URL durante el build */}
      <Suspense fallback={
        <div className="text-white flex flex-col items-center">
            <Loader2 className="w-10 h-10 text-zinc-600 animate-spin mb-4" />
            <p>Cargando...</p>
        </div>
      }>
        <ContenidoConfirmacion />
      </Suspense>
    </div>
  );
}