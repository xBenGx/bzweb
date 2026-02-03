"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    ArrowLeft, Calendar, MapPin, Clock, Minus, Plus, 
    ShoppingCart, Share2, AlertCircle, 
    Tag, CheckCircle, X, Loader2, AlertTriangle, Shield, Utensils, Star
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Montserrat } from "next/font/google";
import { supabase } from "@/lib/supabaseClient";
import { useCart } from "@/components/CartContext"; 

const montserrat = Montserrat({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });

export default function PromotionDetailPage() {
  const params = useParams();
  const id = params?.id; 
  
  const { addItem } = useCart();

  // --- ESTADOS ---
  const [promo, setPromo] = useState<any>(null); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Estados de interacción
  const [quantity, setQuantity] = useState(1); // Iniciamos en 1 para incentivar la compra

  // --- 1. CARGAR DATOS DESDE SUPABASE ---
  useEffect(() => {
    const fetchPromo = async () => {
        if (!id) return;

        try {
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
                    subtitle: data.subtitle || "Promoción Especial",
                    price: Number(data.price),
                    image: data.image_url || "/placeholder.jpg",
                    description: data.desc_text || "Disfruta de esta increíble promoción en Boulevard Zapallar.",
                    day: data.day || "Todos los días", 
                    category: data.category, // 'semana' o 'pack'
                    tag: data.tag || "OFERTA",
                    location: "Boulevard Zapallar",
                    address: "Av. Manuel Labra Lillo 430, Curicó",
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
          category: "shop" // Usamos 'shop' para que no tengas errores de TypeScript
      });

      // Resetear o dar feedback
      // setQuantity(1);
      // alert("Agregado al carrito"); 
  };

  // --- RENDERIZADO CONDICIONAL ---

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
      
      {/* --- HEADER (HERO IMAGE) --- */}
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
                    <Star className="w-3 h-3 fill-black"/> {promo.tag}
                </div>
            )}
            <h1 className="text-3xl md:text-4xl font-bold text-white uppercase leading-tight mb-2 drop-shadow-xl">{promo.title}</h1>
            <p className="text-lg text-zinc-300 font-medium mb-4">{promo.subtitle}</p>
            
            <div className="flex flex-col gap-2.5 text-sm text-zinc-300 bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                <div className="flex items-center gap-3"><Calendar className="w-4 h-4 text-[#DAA520]"/> <span className="font-medium text-white">Disponibilidad: {promo.day}</span></div>
                <div className="flex items-center gap-3"><MapPin className="w-4 h-4 text-[#DAA520]"/> <span className="uppercase">{promo.location}</span></div>
            </div>
        </div>
      </div>

      {/* --- SELECCIÓN DE CANTIDAD (SIMILAR A TICKETS) --- */}
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
                    <p className="text-[10px] text-zinc-500 mt-0.5">Precio Unitario</p>
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

      {/* --- DESCRIPCIÓN DEL PRODUCTO --- */}
      <div className="px-6 py-8">
        <h3 className="text-lg font-bold text-white uppercase tracking-wide mb-4 border-l-4 border-[#DAA520] pl-3">Detalles</h3>
        <div className="text-zinc-400 text-sm leading-relaxed space-y-4">
            <p>{promo.description}</p>
            <p>Nuestros productos son preparados al momento con ingredientes frescos de la zona.</p>
        </div>
      </div>

      {/* --- HORARIOS DE ATENCIÓN (SOLICITADO) --- */}
      <div className="px-4 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 relative overflow-hidden">
            {/* Fondo decorativo sutil */}
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-[#DAA520]/10 rounded-full blur-xl pointer-events-none"></div>
            
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

      {/* --- POLÍTICAS --- */}
      <div className="px-4 mb-8">
        <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3 text-zinc-300">
                <Shield className="w-4 h-4 text-[#DAA520]" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Condiciones</h4>
            </div>
            
            <div className="text-[10px] text-zinc-500 space-y-3 leading-relaxed text-justify">
                <p>
                    Esta promoción es válida únicamente para los días indicados: <strong>{promo.day}</strong>.
                </p>
                <p>
                    Nos reservamos el derecho de finalizar la promoción sin previo aviso en caso de agotar stock.
                </p>
                <p className="text-center pt-2 italic">Prohibida la venta de alcohol a menores de 18 años.</p>
            </div>
        </div>
      </div>

      {/* --- BARRA INFERIOR DE ACCIÓN (FIXED) --- */}
      <div className="fixed bottom-0 left-0 w-full bg-zinc-900 border-t border-white/10 p-4 pb-6 shadow-[0_-5px_30px_rgba(0,0,0,0.5)] z-50 flex items-center justify-between safe-area-bottom">
        
        <div className="flex flex-col">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Total a Pagar</span>
            <span className="text-2xl font-black text-white">${total.toLocaleString('es-CL')}</span>
        </div>
        
        <button 
            onClick={handleAddToCart}
            disabled={total === 0}
            className={`px-8 py-3.5 rounded-xl font-bold uppercase tracking-widest shadow-lg flex items-center gap-2 transition-all active:scale-95 ${total > 0 ? 'bg-[#DAA520] hover:bg-[#B8860B] text-black cursor-pointer' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}`}
        >
            Agregar <ShoppingCart className="w-4 h-4" />
            {quantity > 0 && <span className="bg-black text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center ml-1">{quantity}</span>}
        </button>
      </div>

    </main>
  );
}