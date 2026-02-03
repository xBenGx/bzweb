"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient"; 
import { 
    Plus, Trash2, ShoppingBag, X, ChevronLeft, 
    CreditCard, Upload, Copy, CheckCircle, Loader2, Globe 
} from "lucide-react";
import Image from "next/image";

// Estructura del Ítem
export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  detail?: string;
  category?: "ticket" | "delivery" | "shop" | "promo"; 
};

// --- DATOS BANCARIOS ---
const BANK_DETAILS = {
    bank: "Mercado Pago",
    accountType: "Cuenta Vista",
    accountNumber: "1058303781",
    rut: "77.186.391-4",
    email: "transferenciasbz@gmail.com",
    holder: "CENTRO GASTRONOMICO BOULEVARD ZAPALLAR SPA"
};

type PaymentMethod = 'manual' | 'getnet';

type CartContextType = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  total: number;
  isOpen: boolean;
  toggleCart: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [menuExtras, setMenuExtras] = useState<any[]>([]);
  
  // --- ESTADOS DEL CHECKOUT ---
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'payment'>('cart');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('getnet'); 
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Datos del cliente
  const [clientData, setClientData] = useState({ name: "", phone: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Cargar Menú de Complementos desde Supabase
  useEffect(() => {
    const fetchMenu = async () => {
      const { data } = await supabase
        .from('productos_reserva')
        .select('*')
        .eq('active', true)
        .order('category', { ascending: true });
      if (data) setMenuExtras(data);
    };
    fetchMenu();
    
    const channel = supabase
      .channel('cart-menu-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'productos_reserva' }, () => fetchMenu())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  // --- ACCIONES DEL CARRITO ---
  const addItem = (newItem: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === newItem.id);
      if (existing) {
        return prev.map((i) =>
          i.id === newItem.id ? { ...i, quantity: i.quantity + newItem.quantity } : i
        );
      }
      return [...prev, newItem];
    });
    setIsOpen(true);
    setCheckoutStep('cart');
  };

  const removeItem = (id: string) => setItems(p => p.filter(i => i.id !== id));

  const updateQuantity = (id: string, delta: number) => {
    setItems(p => p.map(item => {
        if (item.id === id) return { ...item, quantity: Math.max(0, item.quantity + delta) };
        return item;
      }).filter(i => i.quantity > 0)
    );
  };

  const clearCart = () => {
      setItems([]);
      setCheckoutStep('cart');
      setPaymentProof(null);
      setClientData({ name: "", phone: "" });
      setIsSubmitting(false);
  };

  const toggleCart = () => setIsOpen(!isOpen);

  const handleAddFromMenu = (product: any) => {
      addItem({
          id: `prod-${product.id}`,
          name: product.name,
          price: product.price,
          quantity: 1,
          image: product.image_url,
          detail: "Agregado desde el carrito",
          category: 'delivery'
      });
  };

  // --- LÓGICA DE SUBIDA (MANUAL) ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setPaymentProof(e.target.files[0]);
      }
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      alert("Copiado al portapapeles"); 
  };

  // --- LÓGICA DE PAGO 1: TRANSFERENCIA MANUAL ---
  const handleFinalizeReservationManual = async () => {
      if (!paymentProof) return alert("Debes subir el comprobante de transferencia.");
      if (!clientData.name || !clientData.phone) return alert("Completa tus datos de contacto.");
      
      setIsSubmitting(true);
      try {
          // 1. Subir Comprobante
          const fileName = `proof-${Date.now()}-${clientData.name.replace(/\s+/g, '')}`;
          const { error: uploadError } = await supabase.storage
              .from('comprobantes') 
              .upload(fileName, paymentProof);

          if (uploadError) throw uploadError;

          const { data: publicUrlData } = supabase.storage.from('comprobantes').getPublicUrl(fileName);
          const proofUrl = publicUrlData.publicUrl;

          // 2. Guardar Reserva
          const { error: dbError } = await supabase.from('reservas').insert([{
              name: clientData.name,
              phone: clientData.phone,
              total_pre_order: total, 
              status: 'pendiente_validacion', 
              payment_proof_url: proofUrl,
              details_json: items, 
              payment_method: 'manual', 
              date_reserva: new Date().toISOString().split('T')[0],
          }]);

          if (dbError) throw dbError;

          alert("✅ ¡Reserva enviada! Validaremos tu pago manual.");
          clearCart();
          toggleCart();

      } catch (error: any) {
          console.error("Error checkout manual:", error);
          alert("Hubo un error al procesar: " + error.message);
      } finally {
          setIsSubmitting(false);
      }
  };

  // --- LÓGICA DE PAGO 2: GETNET (ONLINE) ---
  const handleGetNetPayment = async () => {
    if (!clientData.name || !clientData.phone) return alert("Por favor, completa tus datos de contacto antes de pagar.");
    
    setIsSubmitting(true);
    try {
        const cartLite = items.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            category: item.category
        }));

        const response = await fetch('/api/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cart: cartLite, 
                total: total,
                customerDetails: clientData
            }),
        });

        const data = await response.json();

        if (response.ok && data.url) {
            window.location.href = data.url;
        } else {
            throw new Error(data.error || "Error iniciando pago");
        }

    } catch (error: any) {
        console.error("Error GetNet:", error);
        alert("Error al conectar con el banco: " + error.message);
        setIsSubmitting(false);
    }
  };

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total, isOpen, toggleCart }}>
      {children}
      
      {/* SIDEBAR */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end font-sans">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity" onClick={toggleCart} />
            
            <div className="relative w-full max-w-md bg-[#0a0a0a] h-full shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col border-l border-[#DAA520]/20 transform transition-transform duration-300">
                
                {/* --- HEADER --- */}
                <div className="flex items-center justify-between p-5 border-b border-white/10 bg-zinc-900/90">
                    {checkoutStep === 'payment' ? (
                        <button onClick={() => setCheckoutStep('cart')} className="flex items-center gap-1 text-zinc-400 hover:text-[#DAA520] transition-colors">
                            <ChevronLeft className="w-5 h-5" /> <span className="text-xs font-bold uppercase">Volver</span>
                        </button>
                    ) : (
                        <div className="flex items-center gap-3">
                            <ShoppingBag className="w-5 h-5 text-[#DAA520]" />
                            <h2 className="text-lg font-black text-white uppercase tracking-widest">TU CARRITO</h2>
                        </div>
                    )}
                    <button onClick={toggleCart} className="text-zinc-500 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                {/* --- CONTENIDO DINÁMICO --- */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-black/40">
                    
                    {/* VISTA 1: CARRITO Y MENÚ */}
                    {checkoutStep === 'cart' && (
                        <>
                            {/* LISTA DE ITEMS */}
                            <div className="p-5 space-y-4">
                                {items.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-zinc-600 border-2 border-dashed border-white/5 rounded-2xl bg-zinc-900/30">
                                            <ShoppingBag className="w-12 h-12 mb-3 opacity-30" />
                                            <p className="text-sm">Tu carrito está vacío.</p>
                                    </div>
                                ) : (
                                    items.map((item) => (
                                        <div key={item.id} className="flex gap-4 bg-zinc-900 p-3 rounded-2xl border border-white/5 relative group hover:border-[#DAA520]/40 transition-all">
                                            {item.image ? (
                                                <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-white/5">
                                                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                                                </div>
                                            ) : (
                                                <div className="w-20 h-20 bg-zinc-800 rounded-xl flex items-center justify-center shrink-0 text-[10px] text-zinc-500">Sin img</div>
                                            )}
                                            
                                            <div className="flex-1 flex flex-col justify-between py-1">
                                                <div>
                                                    <h4 className="text-sm font-bold text-white leading-tight line-clamp-2">{item.name}</h4>
                                                    <p className="text-[10px] text-[#DAA520] mt-1">{item.category === 'ticket' ? 'Entrada' : 'Producto'}</p>
                                                </div>
                                                
                                                <div className="flex justify-between items-center">
                                                    <p className="text-white font-bold text-sm">${(item.price * item.quantity).toLocaleString("es-CL")}</p>
                                                    <div className="flex items-center gap-3 bg-black rounded-lg border border-white/10 px-2 py-1">
                                                        <button onClick={() => updateQuantity(item.id, -1)} className="text-zinc-400 hover:text-white transition-colors"><div className="w-4 text-center">-</div></button>
                                                        <span className="text-xs text-white font-bold">{item.quantity}</span>
                                                        <button onClick={() => updateQuantity(item.id, 1)} className="text-zinc-400 hover:text-white transition-colors"><div className="w-4 text-center">+</div></button>
                                                    </div>
                                                </div>
                                            </div>
                                            <button onClick={() => removeItem(item.id)} className="absolute top-2 right-2 text-zinc-600 hover:text-red-500 p-1 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* SECCIÓN COMPLEMENTA (MENÚ) - TEXTO ACTUALIZADO */}
                            {menuExtras.length > 0 && (
                                <div className="px-5 pb-8">
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="h-px bg-gradient-to-r from-transparent via-[#DAA520]/50 to-transparent flex-1"></div>
                                        {/* --- CAMBIO AQUÍ --- */}
                                        <span className="text-[10px] font-bold text-[#DAA520] uppercase tracking-widest bg-[#DAA520]/10 px-3 py-1 rounded-full border border-[#DAA520]/20">
                                            ¡AGREGAR A TU COMPRA!
                                        </span>
                                        <div className="h-px bg-gradient-to-r from-transparent via-[#DAA520]/50 to-transparent flex-1"></div>
                                    </div>
                                    
                                    <div className="space-y-3">
                                            {menuExtras.map((product) => (
                                                <div key={product.id} className="flex items-center gap-3 bg-zinc-900/40 hover:bg-zinc-900 p-2.5 rounded-2xl border border-white/5 hover:border-[#DAA520]/30 transition-all cursor-pointer group" onClick={() => handleAddFromMenu(product)}>
                                                    <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-white/5">
                                                        {product.image_url ? (
                                                            <Image src={product.image_url} alt={product.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                                                        ) : (
                                                            <div className="w-full h-full bg-zinc-800 flex items-center justify-center"><ShoppingBag className="w-4 h-4 text-zinc-600"/></div>
                                                        )}
                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                            <Plus className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity scale-50 group-hover:scale-100" />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-start">
                                                            <h5 className="text-xs font-bold text-white line-clamp-1 group-hover:text-[#DAA520] transition-colors">{product.name}</h5>
                                                            <span className="text-xs font-bold text-[#DAA520] ml-2">${product.price.toLocaleString("es-CL")}</span>
                                                        </div>
                                                        <p className="text-[10px] text-zinc-500 line-clamp-2 mt-0.5 leading-tight">{product.description || "Sin descripción"}</p>
                                                    </div>
                                                    <button className="bg-zinc-800 text-zinc-400 group-hover:bg-[#DAA520] group-hover:text-black w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm">
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* VISTA 2: DATOS Y PAGO */}
                    {checkoutStep === 'payment' && (
                        <div className="p-6 space-y-6">
                            
                            {/* A. Resumen rápido */}
                            <div className="bg-zinc-900 rounded-xl p-4 border border-white/10 text-center">
                                <p className="text-zinc-400 text-xs uppercase mb-1">Total a Pagar</p>
                                <p className="text-3xl font-black text-[#DAA520]">${total.toLocaleString("es-CL")}</p>
                            </div>

                            {/* B. Datos del Cliente */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Tus Datos de Contacto</h4>
                                <div className="space-y-2">
                                    <input 
                                            type="text" 
                                            placeholder="Nombre Completo" 
                                            className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm text-white focus:border-[#DAA520] outline-none transition-colors"
                                            value={clientData.name}
                                            onChange={(e) => setClientData({...clientData, name: e.target.value})}
                                    />
                                    <input 
                                            type="tel" 
                                            placeholder="Teléfono / WhatsApp" 
                                            className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm text-white focus:border-[#DAA520] outline-none transition-colors"
                                            value={clientData.phone}
                                            onChange={(e) => setClientData({...clientData, phone: e.target.value})}
                                    />
                                </div>
                            </div>

                            {/* C. Selector de Método de Pago */}
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => setPaymentMethod('getnet')}
                                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${paymentMethod === 'getnet' ? 'bg-[#DAA520]/20 border-[#DAA520] text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600'}`}
                                >
                                    <Globe className="w-5 h-5" />
                                    <span className="text-xs font-bold uppercase">Pago Online</span>
                                </button>
                                <button 
                                    onClick={() => setPaymentMethod('manual')}
                                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${paymentMethod === 'manual' ? 'bg-[#DAA520]/20 border-[#DAA520] text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600'}`}
                                >
                                    <CreditCard className="w-5 h-5" />
                                    <span className="text-xs font-bold uppercase">Transferencia</span>
                                </button>
                            </div>

                            {/* D. Contenido según Método */}
                            {paymentMethod === 'getnet' ? (
                                <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4 space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-green-500/10 p-2 rounded-full">
                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                        </div>
                                        <div>
                                            <h5 className="text-sm font-bold text-white">Pago Seguro con GetNet</h5>
                                            <p className="text-xs text-zinc-400 mt-1">Paga con tarjetas de débito, crédito o prepago de forma instantánea. Tu reserva se confirmará automáticamente.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 justify-center pt-2 grayscale opacity-50">
                                        <div className="h-6 w-10 bg-white/10 rounded"></div>
                                        <div className="h-6 w-10 bg-white/10 rounded"></div>
                                        <div className="h-6 w-10 bg-white/10 rounded"></div>
                                    </div>
                                </div>
                            ) : (
                                /* BLOQUE MANUAL */
                                <>
                                    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                                            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                                <CreditCard className="w-4 h-4 text-[#DAA520]" /> Datos Bancarios
                                            </h4>
                                            <div className="bg-zinc-900 border border-white/10 rounded-xl p-4 text-xs text-zinc-300 space-y-2 relative overflow-hidden">
                                                <div className="grid grid-cols-[100px_1fr] gap-y-1">
                                                    <span className="text-zinc-500">Banco:</span> <span className="font-bold text-white">{BANK_DETAILS.bank}</span>
                                                    <span className="text-zinc-500">Tipo:</span> <span className="font-bold text-white">{BANK_DETAILS.accountType}</span>
                                                    <span className="text-zinc-500">N° Cuenta:</span> 
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-white">{BANK_DETAILS.accountNumber}</span>
                                                        <button onClick={() => copyToClipboard(BANK_DETAILS.accountNumber)} className="text-[#DAA520] hover:text-white"><Copy className="w-3 h-3"/></button>
                                                    </div>
                                                    <span className="text-zinc-500">RUT:</span> 
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-white">{BANK_DETAILS.rut}</span>
                                                        <button onClick={() => copyToClipboard(BANK_DETAILS.rut)} className="text-[#DAA520] hover:text-white"><Copy className="w-3 h-3"/></button>
                                                    </div>
                                                    <span className="text-zinc-500">Correo:</span> <span className="font-bold text-white truncate">{BANK_DETAILS.email}</span>
                                                </div>
                                            </div>
                                    </div>

                                    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4">
                                            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                                <Upload className="w-4 h-4 text-[#DAA520]" /> Subir Comprobante
                                            </h4>
                                            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*,.pdf" className="hidden" />
                                            
                                            <div 
                                                onClick={() => fileInputRef.current?.click()}
                                                className={`w-full h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${paymentProof ? 'border-green-500/50 bg-green-900/10' : 'border-zinc-700 hover:border-[#DAA520] hover:bg-zinc-900'}`}
                                            >
                                                {paymentProof ? (
                                                    <>
                                                        <CheckCircle className="w-8 h-8 text-green-500 mb-2" />
                                                        <p className="text-xs font-bold text-green-500">{paymentProof.name}</p>
                                                        <p className="text-[10px] text-zinc-500 mt-1">Click para cambiar</p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload className="w-8 h-8 text-zinc-500 mb-2" />
                                                        <p className="text-xs font-bold text-zinc-400">Adjuntar Comprobante</p>
                                                        <p className="text-[10px] text-zinc-600 mt-1">Imagen o PDF</p>
                                                    </>
                                                )}
                                            </div>
                                    </div>
                                </>
                            )}

                        </div>
                    )}
                </div>

                {/* --- FOOTER (BOTONES) --- */}
                <div className="p-6 border-t border-white/10 bg-zinc-900/90 backdrop-blur-md z-20">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-zinc-400 uppercase text-xs font-bold tracking-widest">Total Final</span>
                        <span className="text-2xl font-black text-[#DAA520]">${total.toLocaleString("es-CL")}</span>
                    </div>

                    {checkoutStep === 'cart' ? (
                        <button 
                            onClick={() => {
                                if (items.length === 0) return alert("Agrega productos primero");
                                setCheckoutStep('payment');
                            }}
                            disabled={items.length === 0}
                            className={`w-full py-4 rounded-xl uppercase tracking-widest font-black text-sm flex items-center justify-center gap-2 transition-all ${items.length > 0 ? 'bg-gradient-to-r from-[#DAA520] to-[#B8860B] text-black hover:shadow-[0_0_20px_rgba(218,165,32,0.4)] active:scale-95' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}`}
                        >
                            IR AL PAGO <ChevronLeft className="w-4 h-4 rotate-180" />
                        </button>
                    ) : (
                        // BOTÓN DE ACCIÓN FINAL
                        <button 
                            onClick={paymentMethod === 'getnet' ? handleGetNetPayment : handleFinalizeReservationManual}
                            disabled={isSubmitting}
                            className={`w-full font-black py-4 rounded-xl uppercase tracking-widest transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${paymentMethod === 'getnet' ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-green-600 hover:bg-green-500 text-white'}`}
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin"/> : (paymentMethod === 'getnet' ? "IR A PAGAR AHORA" : "ENVIAR COMPROBANTE")}
                        </button>
                    )}
                </div>

            </div>
        </div>
      )}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart debe usarse dentro de un CartProvider");
  return context;
};