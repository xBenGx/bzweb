"use client";
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle, Home } from 'lucide-react';

export default function ConfirmacionPage() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status');
  const orderId = searchParams.get('order');

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
      {status === 'success' ? (
        <div className="bg-zinc-900 border border-[#DAA520] p-8 rounded-2xl max-w-md w-full shadow-[0_0_50px_rgba(218,165,32,0.2)]">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
            <h1 className="text-3xl font-black text-white uppercase mb-2">¡Pago Exitoso!</h1>
            <p className="text-zinc-400 mb-6">Tu orden #{orderId} ha sido confirmada. Te esperamos en Boulevard Zapallar.</p>
            
            <Link href="/" className="block w-full bg-[#DAA520] text-black font-bold py-4 rounded-xl hover:bg-white transition-colors">
                VOLVER AL INICIO
            </Link>
        </div>
      ) : (
        <div className="text-white">
            <h1 className="text-2xl font-bold">Procesando pago...</h1>
        </div>
      )}
    </div>
  );
}