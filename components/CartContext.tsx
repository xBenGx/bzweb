"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

// Estructura Genérica de un Ítem (Sirve para Tickets, Comida, Merch)
export type CartItem = {
  id: string;        // ID único (ej: "ticket-101" o "burger-50")
  name: string;      // Ej: "Hernan Cattaneo - VIP" o "Hamburguesa Doble"
  price: number;     // Precio unitario
  quantity: number;  // Cantidad
  image?: string;    // Imagen referencia
  detail?: string;   // Ej: "Sáb 31 Ene" o "Sin Pepinillos"
  category?: "ticket" | "delivery" | "shop"; // Para diferenciar en el futuro
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

  // Calcular total global
  const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const addItem = (newItem: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === newItem.id);
      if (existing) {
        // Si ya existe, sumamos la cantidad
        return prev.map((i) =>
          i.id === newItem.id ? { ...i, quantity: i.quantity + newItem.quantity } : i
        );
      }
      // Si no existe, lo agregamos
      return [...prev, newItem];
    });
    setIsOpen(true); // Abrir carrito automáticamente al agregar algo
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
      }).filter(item => item.quantity > 0) // Eliminar si llega a 0
    );
  };

  const clearCart = () => setItems([]);
  const toggleCart = () => setIsOpen(!isOpen);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total, isOpen, toggleCart }}>
      {children}
      
      {/* --- SIDEBAR DEL CARRITO GLOBAL --- */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end font-sans">
            {/* Overlay oscuro */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={toggleCart} />
            
            {/* Panel Lateral */}
            <div className="relative w-full max-w-sm bg-zinc-900 h-full shadow-2xl p-6 flex flex-col border-l border-white/10 transform transition-transform duration-300">
                <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                    <h2 className="text-xl font-bold text-white uppercase tracking-wider">Tu Carrito</h2>
                    <button onClick={toggleCart} className="text-zinc-400 hover:text-white transition-colors p-2">✕</button>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
                            <p>Tu carrito está vacío.</p>
                            <p className="text-xs mt-2">Agrega tickets o productos.</p>
                        </div>
                    ) : (
                        items.map((item) => (
                            <div key={item.id} className="flex gap-3 bg-black/40 p-3 rounded-xl border border-white/5 relative group">
                                {item.image && <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />}
                                <div className="flex-1">
                                    <h4 className="text-sm font-bold text-white leading-tight line-clamp-2">{item.name}</h4>
                                    {item.detail && <p className="text-[10px] text-zinc-400 mt-1">{item.detail}</p>}
                                    <div className="flex justify-between items-center mt-2">
                                        <p className="text-[#DAA520] font-bold text-sm">${(item.price * item.quantity).toLocaleString("es-CL")}</p>
                                        
                                        {/* Control Mini Cantidad */}
                                        <div className="flex items-center gap-2 bg-zinc-800 rounded px-1">
                                            <button onClick={() => updateQuantity(item.id, -1)} className="text-zinc-400 px-1 hover:text-white">-</button>
                                            <span className="text-xs text-white font-bold">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.id, 1)} className="text-zinc-400 px-1 hover:text-white">+</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="border-t border-white/10 pt-4 mt-4">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-zinc-400 uppercase text-xs font-bold tracking-widest">Total Estimado</span>
                        <span className="text-2xl font-black text-white">${total.toLocaleString("es-CL")}</span>
                    </div>
                    <button className="w-full bg-[#DAA520] hover:bg-[#B8860B] text-black font-bold py-4 rounded-xl uppercase tracking-widest transition-all active:scale-95 shadow-lg">
                        Ir a Pagar
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