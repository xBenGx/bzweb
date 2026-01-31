"use client";

import { useCart } from "@/components/CartContext"; 
import { ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function FloatingCart() {
  const { items, toggleCart } = useCart();

  // Calculamos la cantidad total de items
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <AnimatePresence>
      {(totalItems > 0) && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleCart}
          className="fixed bottom-6 right-6 z-[90] bg-gradient-to-br from-[#DAA520] to-[#B8860B] text-black p-4 rounded-full shadow-[0_0_20px_rgba(218,165,32,0.6)] border-2 border-white/20 flex items-center justify-center cursor-pointer hover:shadow-[0_0_30px_rgba(218,165,32,0.8)] transition-shadow"
        >
          <ShoppingCart className="w-6 h-6" />
          
          <div className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-black shadow-sm">
            {totalItems}
          </div>
        </motion.button>
      )}
    </AnimatePresence>
  );
}