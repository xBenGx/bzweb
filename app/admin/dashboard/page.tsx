"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    LayoutDashboard, Calendar, Music, FileText, Users, 
    LogOut, Plus, Search, Trash2, Edit2, 
    Image as ImageIcon, Flame, Gift, Upload, X, Save, 
    CheckCircle, Bell, Clock, MapPin, 
    Mail, Phone, Loader2, ShieldAlert, UserPlus, Cake, FileSpreadsheet
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Montserrat } from "next/font/google";
import { supabase } from "@/lib/supabaseClient";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });

// --- TABS DE NAVEGACIÓN ---
const TABS = [
    { id: "resumen", label: "Resumen", icon: LayoutDashboard },
    { id: "reservas", label: "Reservas", icon: Calendar },
    { id: "clientes", label: "Clientes VIP", icon: UserPlus }, // NUEVA PESTAÑA
    { id: "shows", label: "Shows", icon: Music },
    { id: "promos", label: "Promociones", icon: Flame },
    { id: "eventos", label: "Cotizaciones", icon: FileText },
    { id: "rrhh", label: "Equipo", icon: Users },
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("resumen");
  const [isLoading, setIsLoading] = useState(false);
  
  // --- ESTADOS DE DATOS ---
  const [promos, setPromos] = useState<any[]>([]);
  const [shows, setShows] = useState<any[]>([]);
  const [reservas, setReservas] = useState<any[]>([]);
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [candidatos, setCandidatos] = useState<any[]>([]); 
  const [clientes, setClientes] = useState<any[]>([]); // ESTADO CLIENTES

  // --- ESTADOS PARA CLIENTES ---
  const [birthdayFilterDate, setBirthdayFilterDate] = useState(new Date().toISOString().split('T')[0]); // Fecha para filtrar cumpleaños
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState<any>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  
  // --- CARGA DE DATOS Y REALTIME ---
  useEffect(() => {
    fetchData();

    // SUSCRIPCIÓN REALTIME: Escucha cambios en la tabla 'clientes' para actualizar auto
    const channel = supabase
      .channel('realtime-clientes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, () => {
        fetchData(); // Recarga los datos si hay cambios (insert/update/delete)
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
      // 1. Promociones
      const { data: promosData } = await supabase.from('promociones').select('*').order('id', { ascending: false });
      if (promosData) setPromos(promosData);

      // 2. Shows
      const { data: showsData } = await supabase.from('shows').select('*').order('created_at', { ascending: false });
      if (showsData) setShows(showsData);

      // 3. Reservas
      const { data: reservasData } = await supabase.from('reservas').select('*').order('created_at', { ascending: false });
      if (reservasData) setReservas(reservasData);

      // 4. Solicitudes
      const { data: solicitudesData } = await supabase.from('solicitudes').select('*').order('created_at', { ascending: false });
      if (solicitudesData) setSolicitudes(solicitudesData);

      // 5. Clientes (NUEVO)
      const { data: clientesData } = await supabase.from('clientes').select('*').order('nombre', { ascending: true });
      if (clientesData) setClientes(clientesData);
  };

  // --- ESTADOS DE MODALES Y ARCHIVOS ---
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [currentPromo, setCurrentPromo] = useState<any>(null);
  
  const [isShowModalOpen, setIsShowModalOpen] = useState(false);
  const [currentShow, setCurrentShow] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // --- MANEJADOR DE IMAGEN ---
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'promo' | 'show') => {
      const file = e.target.files?.[0];
      if (file) {
          setSelectedFile(file);
          const reader = new FileReader();
          reader.onloadend = () => {
              if (type === 'promo') setCurrentPromo({ ...currentPromo, image_url: reader.result as string });
              if (type === 'show') setCurrentShow({ ...currentShow, image_url: reader.result as string });
          };
          reader.readAsDataURL(file);
      }
  };

  const uploadImageToSupabase = async () => {
      if (!selectedFile) return null;
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage.from('images').upload(fileName, selectedFile);
      if (error) {
          console.error("Error subiendo imagen:", error);
          alert("Error al subir imagen: " + error.message);
          return null;
      }
      const { data } = supabase.storage.from('images').getPublicUrl(fileName);
      return data.publicUrl;
  };

  const triggerFileInput = () => {
      fileInputRef.current?.click();
  };

  // ---------------------------------------------------------
  // LÓGICA GESTIÓN DE CLIENTES (CORREGIDA Y CONECTADA)
  // ---------------------------------------------------------
  const handleOpenClientModal = (client: any = null) => {
      setCurrentClient(client || { nombre: "", whatsapp: "", fecha_nacimiento: "" });
      setIsClientModalOpen(true);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      try {
          const clientData = {
              nombre: currentClient.nombre,
              whatsapp: currentClient.whatsapp,
              fecha_nacimiento: currentClient.fecha_nacimiento
          };

          let result;
          if (currentClient.id) {
              result = await supabase.from('clientes').update(clientData).eq('id', currentClient.id);
          } else {
              result = await supabase.from('clientes').insert([clientData]);
          }

          // Verificamos explícitamente si hubo error en la base de datos
          if (result.error) throw result.error;

          // Si todo sale bien, recargamos y cerramos
          await fetchData();
          setIsClientModalOpen(false);
      } catch (error: any) {
          console.error("Error al guardar cliente:", error);
          alert("Error al guardar: " + error.message);
      } finally {
          setIsLoading(false);
      }
  };

  const handleDeleteClient = async (id: number) => {
      if(confirm("¿Estás seguro de eliminar este cliente?")) {
          const { error } = await supabase.from('clientes').delete().eq('id', id);
          if (error) {
            alert("Error al eliminar: " + error.message);
          } else {
            fetchData();
          }
      }
  };

  // Función para procesar CSV
  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
          const text = event.target?.result as string;
          // Asumimos formato CSV simple: Nombre,Whatsapp,Fecha(YYYY-MM-DD)
          const lines = text.split('\n');
          const newClients = [];
          
          for (let i = 1; i < lines.length; i++) { // Saltar cabecera
              const [nombre, whatsapp, fecha] = lines[i].split(',');
              if (nombre && whatsapp) {
                  newClients.push({
                      nombre: nombre.trim(),
                      whatsapp: whatsapp.trim(),
                      fecha_nacimiento: fecha ? fecha.trim() : null
                  });
              }
          }

          if (newClients.length > 0) {
              const { error } = await supabase.from('clientes').insert(newClients);
              if (error) alert("Error importando: " + error.message);
              else {
                  alert(`Se importaron ${newClients.length} clientes correctamente.`);
                  fetchData();
              }
          }
      };
      reader.readAsText(file);
  };

  // Filtrar cumpleañeros
  const getBirthdays = () => {
      if (!birthdayFilterDate) return [];
      const filterDate = new Date(birthdayFilterDate);
      const filterMonth = filterDate.getMonth(); // 0-11
      const filterDay = filterDate.getDate() + 1; // Ajuste por zona horaria simple

      return clientes.filter(c => {
          if (!c.fecha_nacimiento) return false;
          // Crear fecha sin ajuste horario forzado para comparar solo dia/mes
          const dParts = c.fecha_nacimiento.split('-');
          const dMonth = parseInt(dParts[1]) - 1;
          const dDay = parseInt(dParts[2]);
          
          return dMonth === filterMonth && dDay === filterDay;
      });
  };

  const birthdays = getBirthdays();

  // ---------------------------------------------------------
  // LÓGICA GESTIÓN DE PROMOCIONES
  // ---------------------------------------------------------
  const handleOpenPromoModal = (promo: any = null) => {
      setSelectedFile(null);
      setCurrentPromo(promo || { 
          title: "", subtitle: "", category: "semana", day: "", 
          price: 0, tag: "", active: true, desc_text: "", image_url: "" 
      });
      setIsPromoModalOpen(true);
  };

  const handleSavePromo = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);

      try {
          let finalImageUrl = currentPromo.image_url;
          if (selectedFile) {
              const uploadedUrl = await uploadImageToSupabase();
              if (uploadedUrl) finalImageUrl = uploadedUrl;
          }

          const promoData = {
              title: currentPromo.title,
              subtitle: currentPromo.subtitle,
              category: currentPromo.category,
              day: currentPromo.day,
              price: currentPromo.price,
              tag: currentPromo.tag,
              desc_text: currentPromo.desc_text,
              active: currentPromo.active,
              image_url: finalImageUrl
          };

          if (currentPromo.id) {
              await supabase.from('promociones').update(promoData).eq('id', currentPromo.id);
          } else {
              await supabase.from('promociones').insert([promoData]);
          }

          await fetchData();
          setIsPromoModalOpen(false);
      } catch (error: any) {
          console.error("Error guardando promo:", error);
          alert(error.message);
      } finally {
          setIsLoading(false);
      }
  };

  const handleDeletePromo = async (id: number) => {
      if(confirm("¿Eliminar promoción?")) {
          await supabase.from('promociones').delete().eq('id', id);
          fetchData();
      }
  };

  const togglePromoStatus = async (id: number, currentStatus: boolean) => {
      await supabase.from('promociones').update({ active: !currentStatus }).eq('id', id);
      fetchData();
  };

  // ---------------------------------------------------------
  // LÓGICA GESTIÓN AVANZADA DE SHOWS (TICKETS)
  // ---------------------------------------------------------
  const handleOpenShowModal = (show: any = null) => {
      setSelectedFile(null);
      setCurrentShow(show || { 
          title: "", subtitle: "", description: "", 
          date_event: "", time_event: "", end_time: "", 
          location: "Boulevard Zapallar, Curicó", 
          sold: 0, total: 200, active: true, image_url: "",
          tag: "", is_adult: false,
          tickets: [] 
      });
      setIsShowModalOpen(true);
  };

  const addTicketType = () => {
      const newTicket = { id: Date.now().toString(), name: "", price: 0, desc: "" };
      setCurrentShow({ ...currentShow, tickets: [...(currentShow.tickets || []), newTicket] });
  };

  const removeTicketType = (index: number) => {
      const newTickets = [...currentShow.tickets];
      newTickets.splice(index, 1);
      setCurrentShow({ ...currentShow, tickets: newTickets });
  };

  const updateTicketType = (index: number, field: string, value: any) => {
      const newTickets = [...currentShow.tickets];
      let safeValue = value;
      if (field === 'price') {
          safeValue = isNaN(value) ? 0 : value;
      }
      newTickets[index] = { ...newTickets[index], [field]: safeValue };
      setCurrentShow({ ...currentShow, tickets: newTickets });
  };

  const handleSaveShow = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);

      try {
          let finalImageUrl = currentShow.image_url;
          if (selectedFile) {
              const uploadedUrl = await uploadImageToSupabase();
              if (uploadedUrl) finalImageUrl = uploadedUrl;
              else throw new Error("Falló la subida de imagen");
          }

          const showData = {
              title: currentShow.title,
              subtitle: currentShow.subtitle,
              description: currentShow.description,
              date_event: currentShow.date_event,
              time_event: currentShow.time_event,
              end_time: currentShow.end_time,
              location: currentShow.location,
              sold: currentShow.sold || 0,
              total: currentShow.total || 0,
              image_url: finalImageUrl,
              tag: currentShow.tag,
              is_adult: currentShow.is_adult,
              tickets: currentShow.tickets
          };

          let result;
          if (currentShow.id) {
              result = await supabase.from('shows').update(showData).eq('id', currentShow.id);
          } else {
              result = await supabase.from('shows').insert([showData]);
          }

          if (result.error) throw result.error;

          await fetchData();
          setIsShowModalOpen(false);

      } catch (error: any) {
          console.error("Error al guardar show:", error);
          alert(error.message);
      } finally {
          setIsLoading(false);
      }
  };

  const handleDeleteShow = async (id: number) => {
      if(confirm("¿Eliminar show?")) {
          await supabase.from('shows').delete().eq('id', id);
          fetchData();
      }
  };

  // ---------------------------------------------------------
  // LÓGICA RESERVAS & SOLICITUDES
  // ---------------------------------------------------------
  const updateReservaStatus = async (id: number, status: string) => {
      await supabase.from('reservas').update({ status }).eq('id', id);
      fetchData();
  };

  const updateSolicitudStatus = async (id: number, status: string) => {
      await supabase.from('solicitudes').update({ status }).eq('id', id);
      fetchData();
  };

  return (
    <div className={`min-h-screen bg-black text-white flex ${montserrat.className}`}>
      
      {/* SIDEBAR */}
      <aside className="fixed left-0 top-0 h-full w-20 md:w-64 bg-zinc-900 border-r border-white/10 z-40 flex flex-col items-center md:items-start py-6 transition-all">
        <div className="px-0 md:px-6 mb-8 w-full flex justify-center md:justify-start">
            <div className="relative w-32 h-12">
                <Image src="/logo.png" alt="BZ Logo" fill className="object-contain" priority />
            </div>
        </div>
        <nav className="flex-1 w-full space-y-2 px-2">
            {TABS.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center justify-center md:justify-start gap-3 p-3 rounded-xl transition-all ${activeTab === tab.id ? 'bg-[#DAA520] text-black font-bold shadow-lg' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}
                >
                    <tab.icon className="w-5 h-5" />
                    <span className="hidden md:block text-sm uppercase tracking-wide">{tab.label}</span>
                </button>
            ))}
        </nav>
        <div className="p-2 w-full mt-auto">
            <Link href="/" className="flex items-center justify-center md:justify-start gap-3 p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors">
                <LogOut className="w-5 h-5" />
                <span className="hidden md:block text-xs font-bold uppercase tracking-wider">Cerrar Sesión</span>
            </Link>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 ml-20 md:ml-64 p-4 md:p-8 bg-black min-h-screen">
        <header className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-2xl font-bold text-white uppercase tracking-wide">{TABS.find(t => t.id === activeTab)?.label}</h1>
                <p className="text-xs text-zinc-500">Panel de Administración Avanzado</p>
            </div>
            <div className="flex items-center gap-4">
                <button className="p-2 bg-zinc-900 rounded-full hover:bg-zinc-800 transition-colors relative">
                    <Bell className="w-5 h-5 text-zinc-400" />
                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-black" />
                </button>
                <div className="flex items-center gap-3 pl-4 border-l border-zinc-800">
                    <div className="w-10 h-10 rounded-full bg-[#DAA520] flex items-center justify-center text-black font-bold shadow-lg">A</div>
                    <div className="hidden md:block">
                        <p className="text-sm font-bold text-white">Admin</p>
                        <p className="text-[10px] text-zinc-400">Online</p>
                    </div>
                </div>
            </div>
        </header>

        <AnimatePresence mode="wait">
            {/* 1. VISTA RESUMEN */}
            {activeTab === "resumen" && (
                <motion.div key="resumen" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {[
                            { title: "Reservas Totales", value: reservas.length, color: "bg-blue-500" },
                            { title: "Shows Activos", value: shows.length, color: "bg-[#DAA520]" },
                            { title: "Clientes Total", value: clientes.length, color: "bg-purple-500" },
                            { title: "Solicitudes", value: solicitudes.length, color: "bg-green-500" }
                        ].map((stat, i) => (
                            <div key={i} className="bg-zinc-900 border border-white/5 p-5 rounded-2xl shadow-lg">
                                <div className={`w-2 h-2 rounded-full mb-3 ${stat.color}`} />
                                <p className="text-2xl font-black text-white">{stat.value}</p>
                                <p className="text-xs text-zinc-500 uppercase font-bold">{stat.title}</p>
                            </div>
                        ))}
                    </div>
                    <div className="bg-zinc-900 border border-white/5 rounded-3xl p-6">
                        <h3 className="text-lg font-bold mb-4">Últimas Reservas</h3>
                        <div className="space-y-4">
                            {reservas.length === 0 ? <p className="text-zinc-500 text-sm">No hay reservas recientes.</p> : reservas.slice(0, 5).map(res => (
                                <div key={res.id} className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><CheckCircle className="w-4 h-4 text-green-500"/></div>
                                        <div><p className="text-xs text-white">Reserva de {res.name}</p><p className="text-[10px] text-zinc-500">{res.date_reserva} • {res.zone}</p></div>
                                    </div>
                                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${res.status === 'confirmada' ? 'bg-green-900/30 text-green-400' : 'bg-yellow-900/30 text-yellow-400'}`}>{res.status}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* 2. GESTIÓN DE RESERVAS */}
            {activeTab === "reservas" && (
                <motion.div key="reservas" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="space-y-3">
                        {reservas.length === 0 ? <p className="text-zinc-500">No hay reservas registradas.</p> : reservas.map((res) => (
                            <div key={res.id} className="bg-zinc-900 border border-white/5 p-4 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="flex items-center gap-4 w-full md:w-auto">
                                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-[#DAA520]">{res.guests}</div>
                                    <div>
                                        <h4 className="font-bold text-white text-sm">{res.name}</h4>
                                        <div className="flex gap-2 text-xs text-zinc-400">
                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {res.date_reserva} - {res.time_reserva}</span>
                                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/> {res.zone}</span>
                                        </div>
                                        <p className="text-[10px] text-zinc-500 mt-1">{res.phone} • {res.email} • {res.code}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 w-full md:w-auto justify-end">
                                    {res.status === "pendiente" ? (
                                        <>
                                            <button onClick={() => updateReservaStatus(res.id, 'confirmada')} className="px-4 py-2 bg-green-500/20 text-green-500 text-xs font-bold rounded-lg border border-green-500/30 hover:bg-green-500/30">Aceptar</button>
                                            <button onClick={() => updateReservaStatus(res.id, 'rechazada')} className="px-4 py-2 bg-red-500/20 text-red-500 text-xs font-bold rounded-lg border border-red-500/30 hover:bg-red-500/30">Rechazar</button>
                                        </>
                                    ) : (
                                        <span className={`px-4 py-2 text-xs rounded-lg border font-bold uppercase tracking-wider ${res.status === 'confirmada' ? 'bg-zinc-800 text-green-400' : 'bg-zinc-800 text-red-400'}`}>{res.status}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* --- NUEVA PESTAÑA: CLIENTES (Optimizado) --- */}
            {activeTab === "clientes" && (
                <motion.div key="clientes" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {/* Header Clientes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* Panel Cumpleaños */}
                        <div className="bg-gradient-to-br from-zinc-900 to-black border border-[#DAA520]/30 p-6 rounded-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10"><Cake className="w-20 h-20 text-[#DAA520]" /></div>
                            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2"><Gift className="w-5 h-5 text-[#DAA520]"/> Cumpleañeros</h3>
                            <div className="flex gap-4 items-center mb-4">
                                <input type="date" className="bg-zinc-800 text-white text-xs p-2 rounded-lg border border-white/10" value={birthdayFilterDate} onChange={(e) => setBirthdayFilterDate(e.target.value)} />
                                <span className="text-xs text-zinc-400">Selecciona fecha para revisar</span>
                            </div>
                            <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                                {birthdays.length > 0 ? birthdays.map(c => (
                                    <div key={c.id} className="flex items-center gap-2 bg-white/5 p-2 rounded-lg">
                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                        <span className="text-xs font-bold text-white">{c.nombre}</span>
                                        <span className="text-[10px] text-zinc-400 ml-auto">{c.whatsapp}</span>
                                    </div>
                                )) : <p className="text-xs text-zinc-500">No hay cumpleaños registrados para esta fecha.</p>}
                            </div>
                        </div>

                        {/* Panel Importar */}
                        <div className="bg-zinc-900 border border-white/5 p-6 rounded-2xl flex flex-col justify-center items-center text-center">
                            <input type="file" accept=".csv" ref={csvInputRef} onChange={handleCSVUpload} className="hidden" />
                            <FileSpreadsheet className="w-10 h-10 text-green-500 mb-3" />
                            <h3 className="text-sm font-bold text-white">Importar Base de Datos</h3>
                            <p className="text-[10px] text-zinc-500 mb-4 max-w-xs">Sube un archivo .csv con las columnas: Nombre, Whatsapp, Fecha Nacimiento (YYYY-MM-DD)</p>
                            <button onClick={() => csvInputRef.current?.click()} className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all">
                                <Upload className="w-3 h-3" /> Seleccionar Archivo
                            </button>
                        </div>
                    </div>

                    {/* Lista Clientes */}
                    <div className="bg-zinc-900 border border-white/5 rounded-3xl p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">Base de Clientes ({clientes.length})</h3>
                            <button onClick={() => handleOpenClientModal()} className="bg-[#DAA520] text-black px-4 py-2 rounded-xl text-xs font-bold uppercase flex items-center gap-2 hover:bg-[#B8860B] transition-colors shadow-lg">
                                <UserPlus className="w-4 h-4" /> Nuevo Cliente
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-zinc-400">
                                <thead className="text-xs uppercase bg-black/40 text-zinc-500">
                                    <tr>
                                        <th className="px-4 py-3">Nombre</th>
                                        <th className="px-4 py-3">WhatsApp</th>
                                        <th className="px-4 py-3">Cumpleaños</th>
                                        <th className="px-4 py-3 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {clientes.map((client) => (
                                        <tr key={client.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-4 py-3 font-medium text-white">{client.nombre}</td>
                                            <td className="px-4 py-3">{client.whatsapp}</td>
                                            <td className="px-4 py-3">{client.fecha_nacimiento || "---"}</td>
                                            <td className="px-4 py-3 text-right flex justify-end gap-2">
                                                <button onClick={() => handleOpenClientModal(client)} className="p-1.5 hover:bg-white/10 rounded text-zinc-300"><Edit2 className="w-3 h-3"/></button>
                                                <button onClick={() => handleDeleteClient(client.id)} className="p-1.5 hover:bg-red-500/20 rounded text-red-500"><Trash2 className="w-3 h-3"/></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* 3. SHOWS (CRUD AVANZADO) */}
            {activeTab === "shows" && (
                <motion.div key="shows" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="flex justify-between mb-4">
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <input type="text" placeholder="Buscar show..." className="w-full bg-zinc-900 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#DAA520]" />
                        </div>
                        <button onClick={() => handleOpenShowModal()} className="bg-[#DAA520] text-black px-4 py-2 rounded-xl text-xs font-bold uppercase flex items-center gap-2 hover:bg-[#B8860B] transition-colors shadow-lg">
                            <Plus className="w-4 h-4" /> Nuevo Show
                        </button>
                    </div>
                    <div className="grid gap-4">
                        {shows.map((show) => (
                            <div key={show.id} className="bg-zinc-900 border border-white/5 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-[#DAA520]/30 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-20 h-24 bg-black rounded-xl relative overflow-hidden shrink-0 shadow-lg border border-white/10">
                                        <Image src={show.image_url || "/placeholder.jpg"} alt={show.title} fill className="object-cover" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-white text-lg">{show.title}</h3>
                                            {show.is_adult && <span className="text-[9px] bg-red-900 text-red-200 px-1.5 rounded font-bold">+18</span>}
                                        </div>
                                        <p className="text-xs text-zinc-400">{show.subtitle}</p>
                                        <div className="flex flex-col gap-1 mt-1">
                                            <span className="text-xs text-zinc-400 flex items-center gap-1"><Calendar className="w-3 h-3 text-[#DAA520]"/> {show.date_event} | {show.time_event} - {show.end_time} hrs</span>
                                            <span className="text-xs text-zinc-400 flex items-center gap-1"><MapPin className="w-3 h-3 text-[#DAA520]"/> {show.location}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleOpenShowModal(show)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-zinc-300 transition-colors"><Edit2 className="w-4 h-4" /></button>
                                    <button onClick={() => handleDeleteShow(show.id)} className="p-2 bg-white/5 hover:bg-red-900/50 rounded-lg text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* 4. PROMOCIONES */}
            {activeTab === "promos" && (
                <motion.div key="promos" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold">Promociones Activas</h3>
                        <button onClick={() => handleOpenPromoModal()} className="bg-[#DAA520] text-black px-6 py-3 rounded-xl text-xs font-bold uppercase flex items-center gap-2 hover:bg-[#B8860B] transition-colors shadow-lg">
                            <Plus className="w-4 h-4" /> Nueva Promo
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {promos.map((promo) => (
                            <div key={promo.id} className={`group bg-zinc-900 border ${promo.active ? 'border-white/10' : 'border-red-900/30 opacity-60'} p-4 rounded-2xl relative transition-all hover:border-[#DAA520]/50`}>
                                <div className="relative w-full aspect-square bg-black rounded-xl overflow-hidden mb-4 border border-white/5">
                                    <Image src={promo.image_url || "/placeholder.jpg"} alt={promo.title} fill className="object-cover opacity-90" />
                                    <div className="absolute top-2 right-2"><span className={`text-[9px] font-bold px-2 py-1 rounded uppercase shadow-sm ${promo.category === 'pack' ? 'bg-purple-500 text-white' : 'bg-blue-500 text-white'}`}>{promo.category}</span></div>
                                </div>
                                <div className="relative z-10">
                                    <h3 className="text-lg font-bold text-white line-clamp-1">{promo.title}</h3>
                                    <p className="text-xs text-zinc-400">{promo.subtitle}</p>
                                    <div className="flex justify-between items-center border-t border-white/10 pt-4 mt-2">
                                        <button onClick={() => togglePromoStatus(promo.id, promo.active)} className={`text-[10px] font-bold uppercase ${promo.active ? 'text-green-500' : 'text-zinc-500'}`}>{promo.active ? "Visible" : "Oculto"}</button>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleOpenPromoModal(promo)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-zinc-300 transition-colors"><Edit2 className="w-4 h-4" /></button>
                                            <button onClick={() => handleDeletePromo(promo.id)} className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* 5. COTIZACIONES */}
            {activeTab === "eventos" && (
                <motion.div key="eventos" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="space-y-3">
                        {solicitudes.length === 0 ? <p className="text-zinc-500">No hay cotizaciones.</p> : solicitudes.map((req) => (
                            <div key={req.id} className="bg-zinc-900 border border-white/5 p-4 rounded-xl">
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-[10px] font-bold text-black px-2 py-0.5 rounded uppercase ${req.status === 'nueva' ? 'bg-[#DAA520]' : 'bg-zinc-500'}`}>{req.status === 'nueva' ? 'Nueva Solicitud' : req.status}</span>
                                    <span className="text-[10px] text-zinc-500">{new Date(req.created_at).toLocaleDateString()}</span>
                                </div>
                                <h4 className="font-bold text-white text-lg">{req.type} - {req.name}</h4>
                                <div className="flex flex-wrap gap-4 mt-2 text-xs text-zinc-400">
                                    <span className="flex items-center gap-1"><Users className="w-3 h-3"/> {req.guests} pax</span>
                                    <span className="flex items-center gap-1"><Mail className="w-3 h-3"/> {req.email}</span>
                                    <span className="flex items-center gap-1"><Phone className="w-3 h-3"/> {req.phone}</span>
                                </div>
                                <div className="mt-4 flex gap-2">
                                    <button onClick={() => updateSolicitudStatus(req.id, 'cotizada')} className="flex-1 py-2 bg-white text-black rounded-lg text-xs font-bold hover:bg-zinc-200 transition-colors">Marcar como Cotizada</button>
                                    <button className="flex-1 py-2 border border-white/10 text-white rounded-lg text-xs hover:bg-white/5 transition-colors">Contactar WhatsApp</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* 6. EQUIPO (RRHH) */}
            {activeTab === "rrhh" && (
                <motion.div key="rrhh" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="grid gap-3">
                        {candidatos.length === 0 ? <p className="text-zinc-500">No hay equipo registrado.</p> : candidatos.map((cand) => (
                            <div key={cand.id} className="bg-zinc-900 border border-white/5 p-4 rounded-xl flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-500 font-bold">{cand.name.charAt(0)}</div>
                                    <div>
                                        <h4 className="font-bold text-white text-sm">{cand.name}</h4>
                                        <p className="text-xs text-zinc-400">{cand.role} • {cand.exp}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* --- MODAL CLIENTES (NUEVO) --- */}
        <AnimatePresence>
            {isClientModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsClientModalOpen(false)} />
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md relative z-70 shadow-2xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white uppercase">{currentClient.id ? "Editar" : "Nuevo"} Cliente</h3>
                            <button onClick={() => setIsClientModalOpen(false)} className="text-zinc-500 hover:text-white"><X className="w-5 h-5"/></button>
                        </div>
                        <form onSubmit={handleSaveClient} className="space-y-4">
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Nombre Completo</label>
                                <input required type="text" className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none focus:border-[#DAA520]" value={currentClient.nombre} onChange={e => setCurrentClient({...currentClient, nombre: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">WhatsApp</label>
                                <input required type="text" placeholder="+569..." className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none focus:border-[#DAA520]" value={currentClient.whatsapp} onChange={e => setCurrentClient({...currentClient, whatsapp: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Fecha de Nacimiento</label>
                                <input type="date" className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none focus:border-[#DAA520] scheme-dark" value={currentClient.fecha_nacimiento || ""} onChange={e => setCurrentClient({...currentClient, fecha_nacimiento: e.target.value})} />
                            </div>
                            <button disabled={isLoading} type="submit" className="w-full bg-[#DAA520] text-black font-bold uppercase tracking-widest py-3 rounded-xl mt-2 hover:bg-[#B8860B] transition-colors flex items-center justify-center gap-2">
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <><Save className="w-4 h-4"/> Guardar Cliente</>}
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

        {/* --- MODAL EDICIÓN PROMOCIONES --- */}
        <AnimatePresence>
            {isPromoModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsPromoModalOpen(false)} />
                    <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-zinc-900 border border-white/10 rounded-3xl w-full max-w-4xl relative z-70 shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-[600px]">
                        <div className="w-full md:w-1/3 bg-black/50 border-r border-white/10 p-6 flex flex-col justify-center items-center relative group">
                            <input type="file" ref={fileInputRef} onChange={(e) => handleImageSelect(e, 'promo')} accept="image/*" className="hidden" />
                            <div onClick={triggerFileInput} className="relative w-full aspect-square rounded-2xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:border-[#DAA520] hover:bg-white/5 transition-all overflow-hidden">
                                {currentPromo.image_url ? (
                                    <>
                                        <Image src={currentPromo.image_url} alt="Preview" fill className="object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"><p className="text-xs font-bold text-white uppercase flex items-center gap-2"><ImageIcon className="w-4 h-4"/> Cambiar Imagen</p></div>
                                    </>
                                ) : (
                                    <div className="text-center text-zinc-500"><div className="p-4 bg-zinc-800 rounded-full mb-3 inline-block"><Upload className="w-6 h-6 text-zinc-400"/></div><p className="text-xs font-bold text-zinc-400 uppercase">Subir Imagen</p><p className="text-[9px] text-zinc-600 mt-1">1080x1080 Rec.</p></div>
                                )}
                            </div>
                        </div>
                        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                            <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-white uppercase">{currentPromo.id ? "Editar" : "Crear"} Promoción</h3><button onClick={() => setIsPromoModalOpen(false)} className="text-zinc-500 hover:text-white"><X className="w-6 h-6"/></button></div>
                            <form onSubmit={handleSavePromo} className="space-y-4">
                                <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Título Principal</label><input required type="text" placeholder="Ej: Happy Hour 2x1" className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none focus:border-[#DAA520] transition-colors" value={currentPromo.title} onChange={e => setCurrentPromo({...currentPromo, title: e.target.value})} /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Categoría</label><select className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none focus:border-[#DAA520]" value={currentPromo.category} onChange={e => setCurrentPromo({...currentPromo, category: e.target.value})}><option value="semana">Semanal</option><option value="pack">Pack / Gift Card</option></select></div>
                                    <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Precio</label><input type="number" className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none" value={currentPromo.price} onChange={e => setCurrentPromo({...currentPromo, price: parseInt(e.target.value)})} /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Día</label><select className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none focus:border-[#DAA520]" value={currentPromo.day} onChange={e => setCurrentPromo({...currentPromo, day: e.target.value})} disabled={currentPromo.category === 'pack'}><option value="">Seleccionar</option>{["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"].map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                                    <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Etiqueta</label><input type="text" placeholder="Ej: NUEVO" className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none" value={currentPromo.tag || ""} onChange={e => setCurrentPromo({...currentPromo, tag: e.target.value})} /></div>
                                </div>
                                <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Subtítulo</label><input required type="text" className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none" value={currentPromo.subtitle} onChange={e => setCurrentPromo({...currentPromo, subtitle: e.target.value})} /></div>
                                <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Descripción</label><textarea rows={3} className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none resize-none" value={currentPromo.desc_text || ""} onChange={e => setCurrentPromo({...currentPromo, desc_text: e.target.value})} /></div>
                                <button disabled={isLoading} type="submit" className="w-full bg-[#DAA520] text-black font-bold uppercase tracking-widest py-4 rounded-xl mt-2 hover:bg-[#B8860B] transition-colors flex items-center justify-center gap-2">{isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <><Save className="w-4 h-4"/> Guardar</>}</button>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

        {/* --- MODAL EDICIÓN SHOWS (AVANZADO) --- */}
        <AnimatePresence>
            {isShowModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsShowModalOpen(false)} />
                    <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-zinc-900 border border-white/10 rounded-3xl w-full max-w-5xl relative z-70 shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-[700px]">
                        
                        {/* Panel Izquierdo: Imagen */}
                        <div className="w-full md:w-1/3 bg-black/50 border-r border-white/10 p-6 flex flex-col justify-center items-center relative group">
                            <input type="file" ref={fileInputRef} onChange={(e) => handleImageSelect(e, 'show')} accept="image/*" className="hidden" />
                            <div onClick={triggerFileInput} className="relative w-full aspect-[3/4] rounded-2xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:border-[#DAA520] hover:bg-white/5 transition-all overflow-hidden">
                                {currentShow.image_url ? <Image src={currentShow.image_url} alt="Preview" fill className="object-cover opacity-70 group-hover:opacity-100" /> : <div className="text-center text-zinc-500"><ImageIcon className="w-8 h-8 mx-auto mb-2"/><p className="text-xs font-bold text-zinc-400 uppercase">Poster Show</p></div>}
                            </div>
                        </div>

                        {/* Panel Derecho: Formulario Completo */}
                        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                            <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-white uppercase">{currentShow.id ? "Editar Show" : "Nuevo Show"}</h3><button onClick={() => setIsShowModalOpen(false)}><X className="w-6 h-6 text-zinc-500 hover:text-white"/></button></div>
                            <form onSubmit={handleSaveShow} className="space-y-6">
                                
                                {/* Información Básica */}
                                <div className="space-y-4">
                                    <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Título del Evento</label><input required type="text" className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none focus:border-[#DAA520]" value={currentShow.title} onChange={e => setCurrentShow({...currentShow, title: e.target.value})} /></div>
                                    <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Subtítulo (Corto)</label><input type="text" className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none" value={currentShow.subtitle || ""} onChange={e => setCurrentShow({...currentShow, subtitle: e.target.value})} /></div>
                                    
                                    {/* FECHA (CALENDARIO) Y HORA */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Fecha</label>
                                            <input 
                                                type="date" 
                                                className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none focus:border-[#DAA520] scheme-dark" 
                                                value={currentShow.date_event} 
                                                onChange={e => setCurrentShow({...currentShow, date_event: e.target.value})} 
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Inicio</label>
                                                <input 
                                                    type="time" 
                                                    className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none focus:border-[#DAA520] scheme-dark" 
                                                    value={currentShow.time_event} 
                                                    onChange={e => setCurrentShow({...currentShow, time_event: e.target.value})} 
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Término</label>
                                                <input 
                                                    type="time" 
                                                    className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none focus:border-[#DAA520] scheme-dark" 
                                                    value={currentShow.end_time || ""} 
                                                    onChange={e => setCurrentShow({...currentShow, end_time: e.target.value})} 
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* UBICACIÓN FIJA */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Ubicación</label>
                                            <input 
                                                type="text" 
                                                readOnly 
                                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-zinc-400 text-sm outline-none cursor-not-allowed" 
                                                value={currentShow.location} 
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Etiqueta</label><input type="text" placeholder="Ej: DESTACADO" className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none" value={currentShow.tag || ""} onChange={e => setCurrentShow({...currentShow, tag: e.target.value})} />
                                        </div>
                                    </div>

                                    <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Descripción Detallada</label><textarea rows={3} className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none resize-none" value={currentShow.description || ""} onChange={e => setCurrentShow({...currentShow, description: e.target.value})} /></div>
                                    
                                    <div className="flex items-center gap-3 py-2">
                                        <input type="checkbox" id="adult" checked={currentShow.is_adult || false} onChange={e => setCurrentShow({...currentShow, is_adult: e.target.checked})} className="w-4 h-4 accent-[#DAA520]" />
                                        <label htmlFor="adult" className="text-xs font-bold text-white uppercase flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-red-500"/> Evento para mayores de 18 años</label>
                                    </div>
                                </div>

                                {/* Configuración de Tickets (Dinámico) */}
                                <div className="border-t border-white/10 pt-4">
                                    <div className="flex justify-between items-center mb-3">
                                        <label className="block text-[10px] uppercase font-bold text-[#DAA520]">Configuración de Entradas</label>
                                        <button type="button" onClick={addTicketType} className="text-[10px] bg-zinc-800 px-3 py-1 rounded hover:bg-white hover:text-black transition-colors font-bold">+ Agregar Tipo</button>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        {currentShow.tickets && currentShow.tickets.map((ticket: any, index: number) => (
                                            <div key={index} className="flex gap-2 items-start bg-black/40 p-2 rounded-lg border border-white/5">
                                                <div className="flex-1 space-y-2">
                                                    <input type="text" placeholder="Nombre (Ej: General)" className="w-full bg-transparent border-b border-zinc-700 text-xs text-white p-1 outline-none" value={ticket.name} onChange={(e) => updateTicketType(index, 'name', e.target.value)} />
                                                    <input type="text" placeholder="Descripción (Ej: Ingreso hasta 00:00)" className="w-full bg-transparent border-b border-zinc-700 text-[10px] text-zinc-400 p-1 outline-none" value={ticket.desc} onChange={(e) => updateTicketType(index, 'desc', e.target.value)} />
                                                </div>
                                                <div className="w-24">
                                                    <input 
                                                        type="number" 
                                                        placeholder="Precio" 
                                                        className="w-full bg-transparent border-b border-zinc-700 text-xs text-[#DAA520] font-bold p-1 outline-none" 
                                                        value={ticket.price} 
                                                        onChange={(e) => updateTicketType(index, 'price', e.target.value === '' ? 0 : parseInt(e.target.value))} 
                                                    />
                                                </div>
                                                <button type="button" onClick={() => removeTicketType(index)} className="p-2 text-zinc-600 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                                            </div>
                                        ))}
                                        {(!currentShow.tickets || currentShow.tickets.length === 0) && <p className="text-[10px] text-zinc-600 text-center py-2">No hay tickets configurados. Se usará entrada general por defecto.</p>}
                                    </div>
                                </div>

                                {/* Totales Generales */}
                                <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
                                    <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Entradas Vendidas (Manual)</label><input type="number" className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none" value={currentShow.sold} onChange={e => setCurrentShow({...currentShow, sold: parseInt(e.target.value)})} /></div>
                                    <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Capacidad Total</label><input type="number" className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none" value={currentShow.total} onChange={e => setCurrentShow({...currentShow, total: parseInt(e.target.value)})} /></div>
                                </div>

                                <button disabled={isLoading} type="submit" className="w-full bg-[#DAA520] text-black font-bold uppercase tracking-widest py-4 rounded-xl hover:bg-[#B8860B] transition-colors flex items-center justify-center gap-2">{isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <><Save className="w-4 h-4"/> Guardar Show</>}</button>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

      </main>
    </div>
  );
}