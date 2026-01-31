"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient"; // Importamos Supabase
import { Plus, Trash2, ShoppingBag } from "lucide-react"; // Iconos para mejor UI
import Image from "next/image";

// Estructura Genérica de un Ítem
export type CartItem = {
  id: string;        // ID único (ej: "ticket-101" o "burger-50")
  name: string;      // Ej: "Hernan Cattaneo - VIP"
  price: number;     // Precio unitario
  quantity: number;  // Cantidad
  image?: string;    // Imagen referencia
  detail?: string;   // Ej: "Sáb 31 Ene"
  category?: "ticket" | "delivery" | "shop"; 
};

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
  
  // Estado para el Menú Express (Productos desde Supabase)
  const [menuExtras, setMenuExtras] = useState<any[]>([]);

  // 1. CARGAR MENÚ DESDE SUPABASE Y ACTIVAR REALTIME
  useEffect(() => {
    const fetchMenu = async () => {
      // Solo traemos los productos activos
      const { data } = await supabase
        .from('productos_reserva')
        .select('*')
        .eq('active', true)
        .order('category', { ascending: true });
      
      if (data) setMenuExtras(data);
    };

    fetchMenu();

    // Suscripción Realtime: Si cambias un precio en el dashboard, el cliente lo ve al tiro
    const channel = supabase
      .channel('cart-menu-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'productos_reserva' }, () => fetchMenu())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Calcular total global
  const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

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
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setItems((prev) => 
      prev.map(item => {
        if (item.id === id) {
          const newQuantity = Math.max(0, item.quantity + delta);
          return { ...item, quantity: newQuantity };
        }
        return item;
      }).filter(item => item.quantity > 0)
    );
  };

  const clearCart = () => setItems([]);
  const toggleCart = () => setIsOpen(!isOpen);

  // Función auxiliar para agregar productos del menú directamente
  const handleAddFromMenu = (product: any) => {
      addItem({
          id: `prod-${product.id}`,
          name: product.name,
          price: product.price,
          quantity: 1,
          image: product.image_url,
          detail: product.category, // Usamos la categoría como detalle
          category: 'delivery'
      });
  };

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total, isOpen, toggleCart }}>
      {children}
      
      {/* --- SIDEBAR DEL CARRITO GLOBAL --- */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end font-sans">
            {/* Overlay oscuro */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={toggleCart} />
            
            {/* Panel Lateral */}
            <div className="relative w-full max-w-md bg-[#111] h-full shadow-2xl flex flex-col border-l border-[#DAA520]/30 transform transition-transform duration-300">
                
                {/* Header del Carrito */}
                <div className="flex justify-between items-center p-6 border-b border-white/10 bg-zinc-900/50">
                    <div className="flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-[#DAA520]" />
                        <h2 className="text-xl font-bold text-white uppercase tracking-wider">Tu Reserva</h2>
                    </div>
                    <button onClick={toggleCart} className="text-zinc-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-full p-2 w-8 h-8 flex items-center justify-center">✕</button>
                </div>
                
                {/* Contenido Scrolleable */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    
                    {/* 1. LISTA DE ITEMS EN EL CARRITO */}
                    <div className="p-6 space-y-4">
                        {items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-zinc-500 border-2 border-dashed border-white/5 rounded-xl">
                                <ShoppingBag className="w-10 h-10 mb-2 opacity-50" />
                                <p>Tu carrito está vacío.</p>
                            </div>
                        ) : (
                            items.map((item) => (
                                <div key={item.id} className="flex gap-3 bg-zinc-900/80 p-3 rounded-xl border border-white/5 relative group hover:border-[#DAA520]/30 transition-all">
                                    {item.image ? (
                                        <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0">
                                            <Image src={item.image} alt={item.name} fill className="object-cover" />
                                        </div>
                                    ) : (
                                        <div className="w-16 h-16 bg-zinc-800 rounded-lg flex items-center justify-center shrink-0 text-xs text-zinc-600">Sin Foto</div>
                                    )}
                                    
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div>
                                            <h4 className="text-sm font-bold text-white leading-tight line-clamp-1">{item.name}</h4>
                                            {item.detail && <p className="text-[10px] text-[#DAA520] mt-0.5">{item.detail}</p>}
                                        </div>
                                        
                                        <div className="flex justify-between items-end">
                                            <p className="text-white font-bold text-sm">${(item.price * item.quantity).toLocaleString("es-CL")}</p>
                                            
                                            {/* Control Cantidad */}
                                            <div className="flex items-center gap-2 bg-black rounded-lg border border-white/10 px-1 py-0.5">
                                                <button onClick={() => updateQuantity(item.id, -1)} className="text-zinc-400 px-1.5 hover:text-white transition-colors">-</button>
                                                <span className="text-xs text-white font-bold min-w-[15px] text-center">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.id, 1)} className="text-zinc-400 px-1.5 hover:text-white transition-colors">+</button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Botón Eliminar (aparece en hover en desktop o siempre accesible) */}
                                    <button onClick={() => removeItem(item.id)} className="absolute top-2 right-2 text-zinc-600 hover:text-red-500 transition-colors">
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* 2. SECCIÓN DE PRODUCTOS DESTACADOS (MENÚ RESERVA) */}
                    {menuExtras.length > 0 && (
                        <div className="px-6 pb-6">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="h-px bg-white/10 flex-1"></div>
                                <span className="text-xs font-bold text-[#DAA520] uppercase tracking-widest">Complementa tu reserva</span>
                                <div className="h-px bg-white/10 flex-1"></div>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-3">
                                {menuExtras.map((product) => (
                                    <div key={product.id} className="flex items-center gap-3 bg-zinc-900/30 hover:bg-zinc-900/60 p-2 rounded-xl border border-white/5 hover:border-[#DAA520]/30 transition-all cursor-pointer group" onClick={() => handleAddFromMenu(product)}>
                                        <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-white/5">
                                            {product.image_url ? (
                                                <Image src={product.image_url} alt={product.name} fill className="object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-zinc-800 flex items-center justify-center"><ShoppingBag className="w-4 h-4 text-zinc-600"/></div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h5 className="text-xs font-bold text-white line-clamp-1 group-hover:text-[#DAA520] transition-colors">{product.name}</h5>
                                            <p className="text-[10px] text-zinc-500 line-clamp-1">{product.description}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-xs font-bold text-white">${product.price.toLocaleString("es-CL")}</span>
                                            <button className="bg-[#DAA520] text-black w-5 h-5 rounded-full flex items-center justify-center hover:bg-white transition-colors">
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer del Carrito (Total y Pagar) */}
                <div className="p-6 border-t border-white/10 bg-zinc-900/80 backdrop-blur-md">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-zinc-400 uppercase text-xs font-bold tracking-widest">Total Estimado</span>
                        <span className="text-3xl font-black text-[#DAA520]">${total.toLocaleString("es-CL")}</span>
                    </div>
                    <button className="w-full bg-gradient-to-r from-[#DAA520] to-[#B8860B] text-black font-black py-4 rounded-xl uppercase tracking-widest transition-all hover:shadow-[0_0_20px_rgba(218,165,32,0.4)] active:scale-95 flex items-center justify-center gap-2">
                        Confirmar Reserva
                    </button>
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