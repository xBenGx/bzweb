"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    ArrowLeft, Calendar, MapPin, Clock, Minus, Plus, 
    ShoppingCart, Share2, AlertCircle, 
    Tag, CheckCircle, X, Loader2, AlertTriangle, Shield, Utensils, Star,
    Armchair // Icono para la reserva
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { Montserrat } from "next/font/google";
import { supabase } from "@/lib/supabaseClient";
import { useCart } from "@/components/CartContext"; 

const montserrat = Montserrat({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });

export default function PromotionDetailPage() {
  const params = useParams();
  const id = params?.id; 
  const router = useRouter();
  
  const { addItem } = useCart();

  // --- ESTADOS ---
  const [promo, setPromo] = useState<any>(null); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Estados de interacción
  const [quantity, setQuantity] = useState(1); // Por defecto 1 para incentivar compra

  // --- 1. CARGAR DATOS DESDE SUPABASE ---
  useEffect(() => {
    const fetchPromo = async () => {
        if (!id) return;

        try {
            // Conectamos a la tabla 'promociones'
            const { data, error } = await supabase
                .from('promociones') 
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            if (data) {
                setPromo({
                    id: data.id,
                    title: data.title,
                    subtitle: data.subtitle || "Promoción Exclusiva",
                    price: Number(data.price),
                    image: data.image_url || "/placeholder.jpg",
                    description: data.desc_text || "Disfruta de esta increíble promoción en Boulevard Zapallar.",
                    day: data.day || "Todos los días", 
                    category: data.category,
                    tag: data.tag || "OFERTA",
                    location: "Boulevard Zapallar, Curicó",
                    address: "Av. Manuel Labra Lillo 430",
                });
            } else {
                setError(true);
            }
        } catch (err) {
            console.error("Error al cargar promoción:", err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    fetchPromo();
  }, [id]);

  // --- LÓGICA DEL CARRITO ---
  const handleAddToCart = () => {
      if (!promo || quantity === 0) return;

      addItem({
          id: `promo-${promo.id}`, 
          name: promo.title,
          price: promo.price,
          quantity: quantity,
          image: promo.image,
          detail: `Promo ${promo.day}`, 
          category: "delivery" // Usamos 'delivery' o 'shop' para que entre en la lógica del carrito
      });
      
      // Feedback visual opcional
      // alert("Agregado al carrito");
  };

  // --- LÓGICA PARA RESERVAR ---
  const handleReserve = () => {
      // Redirigir a la página de reservas
      // Opcional: Podrías pasar el ID de la promo por query param si quisieras pre-seleccionarla
      // router.push(`/reservas?promo=${promo.id}`);
      router.push('/reservas');
  };

  // --- RENDERIZADO DE CARGA / ERROR ---
  if (loading) {
      return (
          <div className="min-h-screen bg-black flex items-center justify-center text-[#DAA520]">
              <Loader2 className="w-10 h-10 animate-spin" />
          </div>
      );
  }

  if (error || !promo) {
      return (
          <div className={`min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 ${montserrat.className}`}>
              <AlertTriangle className="w-16 h-16 text-zinc-600 mb-4" />
              <h2 className="text-2xl font-bold uppercase mb-2">Promoción no encontrada</h2>
              <p className="text-zinc-500 mb-8 text-center">Esta oferta ha expirado o no existe.</p>
              <Link href="/promociones" className="bg-[#DAA520] text-black px-8 py-3 rounded-full font-bold uppercase tracking-widest hover:bg-white transition-colors">
                  Ver otras promos
              </Link>
          </div>
      );
  }

  // Cálculos de UI
  const total = promo.price * quantity;

  return (
    <main className={`min-h-screen bg-black text-white pb-40 overflow-x-hidden ${montserrat.className}`}>
      
      {/* --- HERO SECTION (IGUAL A TICKETS) --- */}
      <div className="relative h-[450px] w-full">
        <Image src={promo.image} alt={promo.title} fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black" />
        
        <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-20">
            <Link href="/promociones" className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black transition-colors">
                <ArrowLeft className="w-6 h-6" />
            </Link>
            <button className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black transition-colors">
                <Share2 className="w-5 h-5" />
            </button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 pt-12 bg-gradient-to-t from-black via-black/90 to-transparent">
            {promo.tag && (
                <div className="inline-flex items-center gap-1 bg-[#DAA520] text-black text-[10px] font-extrabold px-3 py-1 rounded mb-3 uppercase tracking-widest shadow-lg">
                    {promo.tag}
                </div>
            )}
            <h1 className="text-3xl md:text-4xl font-bold text-white uppercase leading-tight mb-2 drop-shadow-xl">{promo.title}</h1>
            
            <div className="flex flex-col gap-2.5 text-sm text-zinc-300 bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm mt-4">
                <div className="flex items-center gap-3"><Calendar className="w-4 h-4 text-[#DAA520]"/> <span className="font-medium text-white">Disponibilidad: {promo.day}</span></div>
                <div className="flex items-center gap-3"><MapPin className="w-4 h-4 text-[#DAA520]"/> <span className="uppercase">{promo.location} <span className="text-zinc-500 mx-1">|</span> {promo.address}</span></div>
            </div>
        </div>
      </div>

      {/* --- SELECCIÓN DE CANTIDAD (ESTILO TICKET) --- */}
      <div className="px-4 mt-6">
        <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-zinc-800 p-4 flex justify-between items-center border-b border-white/5">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-[#DAA520]" /> Selecciona tu Promo
                </h3>
            </div>

            <div className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                <div className="flex-1 pr-4">
                    <h4 className="font-bold text-white text-sm uppercase">{promo.title}</h4>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{promo.subtitle}</p>
                    <p className="text-[#DAA520] font-bold text-lg mt-1">
                        ${promo.price.toLocaleString('es-CL')}
                    </p>
                </div>
                
                <div className="flex items-center gap-3 bg-black rounded-lg p-1 border border-white/10">
                    <button 
                        onClick={() => setQuantity(Math.max(0, quantity - 1))} 
                        className="w-8 h-8 flex items-center justify-center bg-zinc-800 rounded text-white active:scale-90 disabled:opacity-30 hover:bg-zinc-700 transition-all" 
                        disabled={quantity === 0}
                    >
                        <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-bold text-white text-lg">{quantity}</span>
                    <button 
                        onClick={() => setQuantity(quantity + 1)} 
                        className="w-8 h-8 flex items-center justify-center bg-[#DAA520] text-black rounded active:scale-90 hover:bg-[#B8860B] transition-all"
                    >
                        <Plus className="w-3 h-3" />
                    </button>
                </div>
            </div>

            {/* AVISO VISUAL */}
            <div className="bg-[#DAA520]/10 p-4 flex items-start gap-3 border-t border-[#DAA520]/20">
                <Tag className="w-5 h-5 text-[#DAA520] shrink-0 mt-0.5" />
                <div>
                    <h4 className="text-xs font-bold text-[#DAA520] uppercase mb-1">Oferta Web</h4>
                    <p className="text-[10px] text-zinc-400 leading-relaxed">
                        Compra ahora online y asegura tu promoción al llegar al local.
                    </p>
                </div>
            </div>
        </div>
      </div>

      {/* --- INFORMACIÓN DEL EVENTO / DETALLES --- */}
      <div className="px-6 py-8">
        <h3 className="text-lg font-bold text-white uppercase tracking-wide mb-4 border-l-4 border-[#DAA520] pl-3">Detalles</h3>
        <div className="text-zinc-400 text-sm leading-relaxed space-y-4">
            <p>{promo.description}</p>
            <p>Nuestros productos son preparados al momento con ingredientes frescos. Las imágenes son referenciales.</p>
        </div>
      </div>

      {/* --- HORARIOS DE ATENCIÓN (SOLICITADO) --- */}
      <div className="px-4 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-4 text-white">
                <Clock className="w-5 h-5 text-[#DAA520]" />
                <h4 className="text-sm font-bold uppercase tracking-wider">Horarios de Atención</h4>
            </div>
            
            <div className="space-y-3 text-xs text-zinc-400">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="font-bold text-white">Lunes a Jueves</span>
                    <span>05:00pm a 12:30am</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="font-bold text-white">Viernes y Sábado</span>
                    <span>05:00pm a 02:30am</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="font-bold text-white">Domingos</span>
                    <span>04:00pm a 12:00am</span>
                </div>
            </div>
        </div>
      </div>

      {/* --- POLÍTICAS DE COMPRA (ESTILO TICKETS) --- */}
      <div className="px-4 mb-8">
        <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3 text-zinc-300">
                <Shield className="w-4 h-4 text-[#DAA520]" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Políticas de Compra</h4>
            </div>
            
            <div className="text-[10px] text-zinc-500 space-y-3 leading-relaxed text-justify">
                <p>
                    Esta promoción es válida únicamente para consumo o retiro en los días indicados: <strong>{promo.day}</strong>.
                </p>
                <p>
                    <strong>Devoluciones:</strong> No se realizan devoluciones de dinero una vez procesada la compra, salvo falta de stock.
                </p>
                <p>
                    Prohibida la venta de alcohol a menores de 18 años. Se exigirá cédula de identidad.
                </p>
                <div className="bg-[#DAA520]/10 border border-[#DAA520]/20 p-2 rounded text-[#DAA520] font-bold text-center mt-2">
                    AVISO: Promoción sujeta a stock diario.
                </div>
            </div>
        </div>
      </div>

      {/* --- BARRA INFERIOR DE ACCIÓN (FIXED) --- */}
      <div className="fixed bottom-0 left-0 w-full bg-zinc-900 border-t border-white/10 p-4 pb-6 shadow-[0_-5px_30px_rgba(0,0,0,0.5)] z-50 flex items-center gap-3 safe-area-bottom">
        
        {/* BOTÓN RESERVAR (NUEVO) */}
        <button 
            onClick={handleReserve}
            className="flex-1 bg-zinc-800 text-white px-4 py-3.5 rounded-xl font-bold uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 border border-zinc-700 hover:bg-zinc-700 hover:border-[#DAA520]"
        >
            Reservar <Armchair className="w-4 h-4" />
        </button>

        {/* BOTÓN AGREGAR (CON PRECIO) */}
        <button 
            onClick={handleAddToCart}
            disabled={total === 0}
            className={`flex-[2] px-4 py-3.5 rounded-xl font-bold uppercase tracking-widest shadow-lg flex flex-col items-center justify-center transition-all active:scale-95 ${total > 0 ? 'bg-[#DAA520] hover:bg-[#B8860B] text-black cursor-pointer' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}`}
        >
            <div className="flex items-center gap-2">
                <span>Agregar</span>
                <ShoppingCart className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-normal opacity-80">${total.toLocaleString('es-CL')}</span>
        </button>
      </div>

    </main>
  );
}