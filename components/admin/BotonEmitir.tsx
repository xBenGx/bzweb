'use client';
import { useState } from 'react';

export default function BotonEmitir({ reserva }: { reserva: any }) {
  const [loading, setLoading] = useState(false);

  const handleEmitir = async () => {
    if (!confirm(`¿Confirmas que recibiste el pago de ${reserva.customer_name}?`)) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/tickets/emitir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: reserva.user_email,
          customerName: reserva.customer_name,
          customerPhone: reserva.phone || reserva.customer_phone, // <-- AGREGADO: Enviar teléfono
          eventId: reserva.event_id,
          paymentRef: `TRANSF-${reserva.id}`
        }),
      });

      if (!res.ok) throw new Error('Error al emitir');
      alert('✅ Ticket enviado al correo y WhatsApp del cliente');
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
      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-bold disabled:opacity-50"
    >
      {loading ? 'Emitiendo...' : '✅ Aprobar Transferencia'}
    </button>
  );
}