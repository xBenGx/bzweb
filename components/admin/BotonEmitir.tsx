'use client';
import { useState } from 'react';

export default function BotonEmitir({ reserva }: { reserva: any }) {
  const [loading, setLoading] = useState(false);

  const handleEmitir = async () => {
    if (!confirm(`¿Confirmas que recibiste el pago de ${reserva.customer_name}?`)) return;
    
    setLoading(true);
    try {
      // Llamamos a tu API de emisión que ya creamos
      const res = await fetch('/api/tickets/emitir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: reserva.user_email, // Ajusta según tus columnas reales
          customerName: reserva.customer_name,
          eventId: reserva.event_id,
          paymentRef: `TRANSF-${reserva.id}`
        }),
      });

      if (!res.ok) throw new Error('Error al emitir');
      alert('✅ Ticket enviado al correo del cliente');
      // Aquí podrías recargar la página: window.location.reload();
    } catch (error) {
      alert('❌ Error: No se pudo enviar el ticket');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleEmitir} 
      disabled={loading}
      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-bold"
    >
      {loading ? 'Emitiendo...' : '✅ Aprobar Transferencia'}
    </button>
  );
}