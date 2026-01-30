"use client";

import { motion, Variants } from "framer-motion";
import { 
  Utensils, CalendarCheck, Ticket, ShoppingBag, 
  MapPin, PartyPopper, Briefcase, Star, 
  Instagram, Facebook, ExternalLink, 
  ArrowUpRight, Flame, Crown, ChefHat, Music
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
// 1. IMPORTAMOS LA FUENTE MONTSERRAT
import { Montserrat } from "next/font/google";

// Configuramos la fuente
const montserrat = Montserrat({ 
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"]
});

// --- 1. ICONOS PERSONALIZADOS (SVG) ---

const CustomBadgePercentIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3.85 8.62a4 4 0 0 1 4.77-4.77 4 4 0 0 1 6.76 0 4 4 0 0 1 4.77 4.77 4 4 0 0 1 0 6.76 4 4 0 0 1-4.77 4.77 4 4 0 0 1-6.76 0 4 4 0 0 1-4.77-4.77 4 4 0 0 1 0-6.76Z" />
    <path d="m15 9-6 6" />
    <path d="M9 9h.01" />
    <path d="M15 15h.01" />
  </svg>
);

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

// --- 2. CONFIGURACIÓN DE TARJETAS GRANDES (TOP 4) ---
const LARGE_LINKS = [
  { 
    id: "carta", 
    title: "Nuestra Carta", 
    icon: Utensils, 
    href: "/carta", 
    image: "/menu.jpeg",
    overlay: "from-[#FF4500]/80 via-black/50 via-25% to-transparent",
    iconStyle: "bg-white/20 text-white border-white/30",
    borderGlow: "group-hover:border-[#FF4500]/50 group-hover:shadow-[0_0_30px_rgba(255,69,0,0.3)]"
  },
  { 
    id: "promos", 
    title: "Promociones", 
    icon: CustomBadgePercentIcon, 
    href: "/promociones", 
    // RUTA EXACTA PARA public/promos.jpeg
    image: "/promos.jpeg",
    overlay: "from-[#FFCC00]/80 via-black/50 via-25% to-transparent",
    iconStyle: "bg-white/20 text-white border-white/30",
    textColor: "text-white",
    borderGlow: "group-hover:border-[#FFCC00]/50 group-hover:shadow-[0_0_30px_rgba(255,204,0,0.4)]"
  },
  { 
    id: "reserva", 
    title: "Reservar Mesa", 
    icon: CalendarCheck, 
    href: "/reservas", 
    image: "/reservas.jpg",
    overlay: "from-[#28A745]/80 via-black/50 via-25% to-transparent",
    iconStyle: "bg-white/20 text-white border-white/30",
    borderGlow: "group-hover:border-[#28A745]/50 group-hover:shadow-[0_0_30px_rgba(40,167,69,0.3)]"
  },
  { 
    id: "show", 
    title: "Show Musicales", 
    icon: Music, 
    href: "/tickets", 
    image: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?q=80&w=1470&auto=format&fit=crop",
    overlay: "from-[#8338EC]/80 via-black/50 via-25% to-transparent",
    iconStyle: "bg-white/20 text-white border-white/30",
    borderGlow: "group-hover:border-[#8338EC]/50 group-hover:shadow-[0_0_30px_rgba(131,56,236,0.3)]"
  },
];

// --- 3. CONFIGURACIÓN DE CUADRITOS (BENTO GRID) ---
const BENTO_LINKS = [
  { 
    id: "delivery", 
    title: "Delivery", 
    href: "/delivery", 
    image: "/delivery.jpeg",
    overlay: "from-[#F3722C]/80 via-black/50 via-40% to-transparent",
    colorClass: "text-[#F3722C] bg-[#F3722C]/20 border-[#F3722C]/30"
  },
  { 
    id: "eventos", 
    title: "Cotiza tu Evento", 
    href: "/eventos", 
    image: "/cotizatuevento.jpeg",
    overlay: "from-[#B8860B]/90 via-black/80 via-40% to-transparent", 
    colorClass: "text-[#B8860B] bg-[#B8860B]/20 border-[#B8860B]/30"
  },
  { 
    id: "trabajo", 
    title: "Únete al Equipo", 
    href: "/trabajo", 
    image: "/unetealequipo.jpg",
    overlay: "from-[#2A9D8F]/90 via-black/80 via-40% to-transparent",
    colorClass: "text-[#2A9D8F] bg-[#2A9D8F]/20 border-[#2A9D8F]/30"
  },
  { 
    id: "ubicacion", 
    title: "Ubicación", 
    href: "/ubicacion", 
    image: "https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1474&auto=format&fit=crop",
    overlay: "from-zinc-900/90 via-black/80 via-40% to-transparent",
    colorClass: "text-white bg-white/20 border-white/30"
  },
];

// Animaciones
const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};
const itemAnim: Variants = {
  hidden: { y: 30, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 80 } }
};

export default function MainHub() {
  return (
    <main className={`min-h-screen w-full bg-black relative flex flex-col items-center pb-16 overflow-x-hidden ${montserrat.className}`}>
      
      {/* --- FONDO GLOBAL --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Image 
            src="/fondo-boulevard.jpg" 
            alt="Background Atmosphere" fill className="object-cover opacity-50 blur-sm scale-105" 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black" />
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
      </div>

      <div className="relative z-10 w-full max-w-md px-5 flex flex-col items-center">
        
        {/* 1. LOGO PRINCIPAL */}
        <motion.div 
          initial={{ opacity: 0, y: -30, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 1 }}
          className="pt-0 pb-6 flex flex-col items-center text-center w-full"
        >
          <div className="relative w-60 h-60 mb-0 drop-shadow-2xl"> 
             <Image 
                src="/logo.png" alt="Boulevard Zapallar Logo" fill className="object-contain" priority
             />
          </div>
          <div className="flex items-center gap-2 opacity-90 mt-[-40px] w-full justify-center">
             <div className="h-[1px] w-4 bg-gradient-to-r from-transparent to-boulevard-red shrink-0" />
             <p className="text-[10px] text-white font-bold tracking-[0.2em] uppercase glow-text whitespace-nowrap">
                CREAMOS MOMENTOS FELICES
             </p>
             <div className="h-[1px] w-4 bg-gradient-to-l from-transparent to-boulevard-red shrink-0" />
          </div>
        </motion.div>

        {/* 2. SECCIÓN TOP 4 (TARJETAS GRANDES) */}
        <motion.div variants={container} initial="hidden" animate="show" className="w-full flex flex-col gap-4 mb-6">
          {LARGE_LINKS.map((link) => (
            <motion.div key={link.id} variants={itemAnim} className="w-full">
              <Link 
                  href={link.href} 
                  className={`group relative block w-full h-24 rounded-3xl overflow-hidden border border-white/5 transition-all duration-500 active:scale-[0.97] shadow-xl backdrop-blur-sm ${link.borderGlow}`}
              >
                <div className="absolute inset-0 z-0">
                   <Image src={link.image} alt={link.title} fill className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-[1.5s]" />
                   <div className={`absolute inset-0 bg-gradient-to-r ${link.overlay}`} />
                </div>
                
                <div className="relative z-10 h-full p-5 flex items-center">
                    {/* ICONO A LA IZQUIERDA - w-10 */}
                    <div className="shrink-0 mr-4">
                        <div className={`p-3 rounded-2xl backdrop-blur-md border shadow-lg ${link.iconStyle}`}>
                            <link.icon className="w-10 h-10 drop-shadow" />
                        </div>
                    </div>
                    
                    {/* TEXTO CENTRADO */}
                    <div className="flex-1 text-center pr-10">
                        <h3 className={`text-lg font-medium uppercase tracking-wide drop-shadow-md leading-none mb-0 ${link.textColor || 'text-white'}`}>{link.title}</h3>
                    </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* 3. SECCIÓN BENTO GRID (CUADRITOS PEQUEÑOS CENTRADOS) */}
        <motion.div variants={container} initial="hidden" animate="show" className="w-full grid grid-cols-2 gap-3 pb-8">
            {BENTO_LINKS.map((widget) => (
                <motion.div key={widget.id} variants={itemAnim}>
                    <Link href={widget.href} className="group relative block h-36 rounded-3xl overflow-hidden border border-white/10 active:scale-[0.98] hover:border-white/30 transition-all">
                        <div className="absolute inset-0 z-0">
                            <Image src={widget.image} alt={widget.title} fill className="object-cover opacity-50 group-hover:scale-110 transition-transform duration-[2s]"/>
                            <div className={`absolute inset-0 bg-gradient-to-t ${widget.overlay}`} />
                        </div>
                        
                        {/* CONTENIDO CENTRADO TOTALMENTE */}
                        <div className="relative z-10 p-4 h-full flex flex-col justify-center items-center text-center">
                            <h3 className="text-xs font-medium text-white leading-tight uppercase drop-shadow-sm whitespace-nowrap">{widget.title}</h3>
                        </div>
                    </Link>
                </motion.div>
            ))}
        </motion.div>

        {/* 4. INSTAGRAM REAL */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
            className="w-full mb-10"
        >
            <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 rounded-lg">
                        <Instagram className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-bold text-white">@boulevardzapallar</span>
                </div>
                <a href="https://www.instagram.com/boulevardzapallar/?hl=es" target="_blank" className="text-[10px] font-bold text-gray-400 hover:text-white uppercase tracking-wider flex items-center gap-1">
                    Abrir App <ArrowUpRight className="w-3 h-3" />
                </a>
            </div>
            
            <div className="relative w-full h-[420px] rounded-3xl overflow-hidden border border-white/10 bg-zinc-900/50 backdrop-blur-xl">
                <div className="absolute inset-0 flex items-center justify-center -z-10">
                    <Instagram className="w-10 h-10 text-white/10 animate-pulse" />
                </div>
                
                <iframe 
                    src="https://www.instagram.com/boulevardzapallar/embed" 
                    className="w-full h-full border-none"
                    loading="lazy"
                ></iframe>
                
                <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />
            </div>
        </motion.div>

        {/* 5. FOOTER */}
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
            className="mt-auto flex flex-col items-center gap-6"
        >
            <div className="flex gap-8 items-center justify-center p-4 rounded-full bg-white/5 border border-white/5 backdrop-blur-md shadow-lg">
                <a href="https://www.instagram.com/boulevardzapallar/?hl=es" target="_blank" className="text-gray-400 hover:text-boulevard-red hover:scale-110 transition-all"><Instagram className="w-6 h-6"/></a>
                <a href="#" className="text-gray-400 hover:text-blue-500 hover:scale-110 transition-all"><Facebook className="w-6 h-6"/></a>
                {/* Waze Link Actualizado a Curicó */}
                <a href="https://waze.com/ul?q=Av.+Manuel+Labra+Lillo+430,+Curicó" target="_blank" className="text-gray-400 hover:text-green-500 hover:scale-110 transition-all"><MapPin className="w-6 h-6"/></a>
            </div>

            <div className="flex flex-col items-center gap-4 text-center">
                <Link href="/admin/login" className="text-[9px] text-zinc-600 hover:text-zinc-400 uppercase tracking-[0.2em] transition-colors border border-white/5 px-4 py-1.5 rounded-full hover:bg-white/5">
                    Staff Access
                </Link>
                
                <p className="text-[10px] text-zinc-500 font-bold tracking-[0.3em] uppercase">
                    Powered By <span className="text-boulevard-red glow-text">BAYX</span>
                </p>
            </div>
        </motion.div>

      </div>

      {/* --- GLOBO FLOTANTE DE WHATSAPP --- */}
      <motion.a
        href="https://wa.me/56995051248?text=Hola%20Boulevard%20Zapallar%2C%20tengo%20una%20consulta%20o%20pedido."
        target="_blank"
        rel="noopener noreferrer"
        initial={{ scale: 0, rotate: 180 }}
        animate={{ scale: 1, rotate: 0 }}
        whileHover={{ scale: 1.1, rotate: 10 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="fixed bottom-8 right-6 z-50 p-4 bg-[#25D366] rounded-full shadow-[0_4px_20px_rgba(37,211,102,0.4)] hover:shadow-[0_6px_25px_rgba(37,211,102,0.6)] transition-shadow group flex items-center justify-center border border-white/10"
      >
        <WhatsAppIcon className="w-8 h-8 text-white drop-shadow-md" />
        
        {/* Efecto de onda (pulse) */}
        <div className="absolute inset-0 rounded-full bg-white opacity-20 animate-ping" />
      </motion.a>

    </main>
  );
}