"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Mail, Lock, User, ArrowRight, Eye, EyeOff, 
    ShieldCheck, ChevronLeft 
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });

export default function AdminLoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Datos del formulario
  const [formData, setFormData] = useState({ email: "", password: "", name: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulación de validación y login
    setTimeout(() => {
        setIsLoading(false);
        // REDIRECCIÓN AUTOMÁTICA AL DASHBOARD
        router.push("/admin/dashboard"); 
    }, 1500);
  };

  return (
    <main className={`min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden ${montserrat.className}`}>
      
      {/* Fondo Animado */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] bg-[#DAA520]/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[500px] h-[500px] bg-red-900/10 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        
        {/* Header Logo */}
        <div className="flex flex-col items-center mb-8">
            <Link href="/" className="mb-6 relative w-64 h-20 hover:scale-105 transition-transform duration-500">
                <Image src="/logo.png" alt="Boulevard Zapallar" fill className="object-contain" priority />
            </Link>
            <div className="flex items-center gap-2 px-4 py-1.5 bg-zinc-900/50 rounded-full border border-white/10 backdrop-blur-md">
                <ShieldCheck className="w-3 h-3 text-[#DAA520]" />
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Acceso Administrativo</span>
            </div>
        </div>

        {/* Tarjeta de Login */}
        <motion.div 
            layout
            className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
        >
            {/* Efecto de borde brillante superior */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#DAA520] to-transparent opacity-50" />

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white mb-1">
                    {isLogin ? "Bienvenido de nuevo" : "Crear Cuenta Staff"}
                </h1>
                <p className="text-sm text-zinc-500">
                    {isLogin ? "Ingresa tus credenciales para gestionar BZ." : "Solicita acceso al panel de administración."}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Nombre (Solo Registro) */}
                <AnimatePresence>
                    {!isLogin && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }} 
                            animate={{ height: "auto", opacity: 1 }} 
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-[#DAA520] transition-colors" />
                                <input 
                                    type="text" 
                                    placeholder="Nombre Completo" 
                                    className="w-full bg-black/50 border border-zinc-700 rounded-xl py-4 pl-12 pr-4 text-sm text-white placeholder-zinc-600 focus:border-[#DAA520] focus:ring-1 focus:ring-[#DAA520] outline-none transition-all"
                                    required={!isLogin}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Email */}
                <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-[#DAA520] transition-colors" />
                    <input 
                        type="email" 
                        placeholder="correo@boulevardzapallar.cl" 
                        className="w-full bg-black/50 border border-zinc-700 rounded-xl py-4 pl-12 pr-4 text-sm text-white placeholder-zinc-600 focus:border-[#DAA520] focus:ring-1 focus:ring-[#DAA520] outline-none transition-all"
                        required
                    />
                </div>

                {/* Password */}
                <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-[#DAA520] transition-colors" />
                    <input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="Contraseña" 
                        className="w-full bg-black/50 border border-zinc-700 rounded-xl py-4 pl-12 pr-12 text-sm text-white placeholder-zinc-600 focus:border-[#DAA520] focus:ring-1 focus:ring-[#DAA520] outline-none transition-all"
                        required
                    />
                    <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                    >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>

                {/* Botón Submit */}
                <button 
                    disabled={isLoading}
                    className="w-full bg-white text-black font-bold uppercase tracking-widest py-4 rounded-xl mt-6 hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg"
                >
                    {isLoading ? (
                        <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"/>
                    ) : (
                        <>
                            {isLogin ? "Iniciar Sesión" : "Registrarse"} <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                </button>

            </form>

            {/* Switch Login/Register */}
            <div className="mt-6 pt-6 border-t border-white/5 text-center">
                <p className="text-xs text-zinc-500 mb-2">
                    {isLogin ? "¿No tienes cuenta?" : "¿Ya tienes acceso?"}
                </p>
                <button 
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-xs font-bold text-[#DAA520] hover:text-[#B8860B] uppercase tracking-wider transition-colors"
                >
                    {isLogin ? "Solicitar Registro" : "Volver al Login"}
                </button>
            </div>

        </motion.div>

        <Link href="/" className="flex items-center justify-center gap-2 mt-8 text-xs text-zinc-600 hover:text-white transition-colors uppercase tracking-widest">
            <ChevronLeft className="w-4 h-4" /> Volver al Sitio
        </Link>

      </div>
    </main>
  );
}