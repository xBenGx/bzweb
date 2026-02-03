"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    ArrowLeft, Calendar, MapPin, Clock, Minus, Plus, 
    ShoppingCart, Share2, AlertCircle, 
    Tag, CheckCircle, X, Loader2, AlertTriangle, Shield, Utensils
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
  // Usamos un objeto para la cantidad, similar a los tickets, aunque sea un solo producto
  const [quantity, setQuantity] = useState(0); 
  const [showTermsModal, setShowTermsModal] = useState(false);

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
                    title: data.title, // Ej: "2x1 Mojitos"
                    subtitle: data.subtitle || "Promoción Exclusiva Web",
                    price: data.price,
                    originalPrice: data.original_price, // Si quieres mostrar "Antes: $10.000"
                    validUntil: data.valid_until || "Hasta agotar stock", 
                    description: data.description || "Deliciosa promoción para compartir.",
                    image: data.image_url || "/placeholder-food.jpg",
                    tag: data.tag || "OFERTA LIMITADA",
                    terms: data.terms || "Promoción válida solo para consumo en el local o retiro.",
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
          id: `promo-${promo.id}`, // Prefijo para diferenciar de tickets
          name: promo.title,
          price: promo.price,
          quantity: quantity,
          image: promo.image,
          detail: "Promoción Web", // Detalle visible en el carrito
          category: "delivery" // O "shop", importante para diferenciar en el checkout
      });

      // Feedback visual o reset
      setQuantity(0);
      alert("¡Promoción agregada al carrito!");
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
      
      {/* --- HEADER PROMOCIÓN (HERO) --- */}
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
                <div className="inline-flex items-center gap-1 bg-red-600 text-white text-[10px] font-extrabold px-3 py-1 rounded mb-3 uppercase tracking-widest shadow-lg">
                    {promo.tag}
                </div>
            )}
            <h1 className="text-3xl md:text-4xl font-bold text-white uppercase leading-tight mb-2 drop-shadow-xl">{promo.title}</h1>
            <p className="text-lg text-zinc-300 font-medium mb-4">{promo.subtitle}</p>
            
            <div className="flex flex-col gap-2.5 text-sm text-zinc-300 bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                <div className="flex items-center gap-3"><Clock className="w-4 h-4 text-[#DAA520]"/> <span className="font-medium">Válido: {promo.validUntil}</span></div>
                <div className="flex items-center gap-3"><MapPin className="w-4 h-4 text-[#DAA520]"/> <span className="uppercase">{promo.location} <span className="text-zinc-500 mx-1">|</span> {promo.address}</span></div>
            </div>
        </div>
      </div>

      {/* --- SELECCIÓN DE CANTIDAD --- */}
      <div className="px-4 mt-6">
        <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-zinc-800 p-4 flex justify-between items-center border-b border-white/5">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-[#DAA520]" /> Selecciona Cantidad
                </h3>
            </div>

            <div className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                <div className="flex-1 pr-4">
                    <h4 className="font-bold text-white text-sm uppercase">{promo.title}</h4>
                    
                    <div className="flex items-baseline gap-2 mt-1">
                        <p className="text-[#DAA520] font-bold text-lg">
                            ${Number(promo.price).toLocaleString('es-CL')}
                        </p>
                        {promo.originalPrice && (
                            <p className="text-xs text-zinc-500 line-through">
                                ${Number(promo.originalPrice).toLocaleString('es-CL')}
                            </p>
                        )}
                    </div>
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

            <div className="bg-amber-500/10 p-4 flex items-start gap-3 border-t border-amber-500/20">
                <Tag className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                    <h4 className="text-xs font-bold text-amber-500 uppercase mb-1">Aprovecha esta oferta</h4>
                    <p className="text-[10px] text-amber-200/80 leading-relaxed">
                        Compra ahora online y canjea en el local mostrando tu código QR.
                    </p>
                </div>
            </div>
        </div>
      </div>

      {/* --- DESCRIPCIÓN --- */}
      <div className="px-6 py-8">
        <h3 className="text-lg font-bold text-white uppercase tracking-wide mb-4 border-l-4 border-[#DAA520] pl-3">Detalles del Producto</h3>
        <div className="text-zinc-400 text-sm leading-relaxed space-y-4">
            <p>{promo.description}</p>
            <p>Nuestros productos son preparados al momento con ingredientes frescos de la zona.</p>
        </div>
      </div>

      {/* --- TÉRMINOS Y CONDICIONES --- */}
      <div className="px-4 mb-8">
        <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3 text-zinc-300">
                <Shield className="w-4 h-4 text-[#DAA520]" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Condiciones de la Oferta</h4>
            </div>
            
            <div className="text-[10px] text-zinc-500 space-y-3 leading-relaxed text-justify">
                <p>{promo.terms}</p>
                <p>
                    Las imágenes son referenciales. Promoción no acumulable con otras ofertas o descuentos vigentes.
                </p>
                <p className="text-center pt-2 italic">Prohibida la venta de alcohol a menores de 18 años.</p>
            </div>
        </div>
      </div>

      {/* --- BARRA INFERIOR DE ACCIÓN --- */}
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
        </button>
      </div>

    </main>
  );
}