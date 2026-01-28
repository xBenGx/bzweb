"use client";

import { useCart } from "@/components/CartContext"; 
import { ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function FloatingCart() {
  const { items, toggleCart } = useCart();

  // Calculamos la cantidad total de items
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  // Si no hay items, no mostramos el botón
  if (totalItems === 0) return null;

  return (
    <AnimatePresence>
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleCart}
        className="fixed bottom-24 right-6 z-[90] bg-[#DAA520] text-black p-4 rounded-full shadow-[0_0_20px_rgba(218,165,32,0.6)] border-2 border-white/10 flex items-center justify-center cursor-pointer"
      >
        <ShoppingCart className="w-6 h-6" />
        
        {/* Badge con la cantidad */}
        <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-zinc-900 shadow-sm">
          {totalItems}
        </div>
      </motion.button>
    </AnimatePresence>
  );
}