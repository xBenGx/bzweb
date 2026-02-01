"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    LayoutDashboard, Calendar, Music, FileText, Users, 
    LogOut, Plus, Search, Trash2, Edit2, 
    Image as ImageIcon, Flame, Gift, Upload, X, Save, 
    CheckCircle, Bell, Clock, MapPin, 
    Mail, Phone, Loader2, ShieldAlert, UserPlus, Cake, FileSpreadsheet,
    Utensils, ShoppingBag, Send, DollarSign, TrendingUp, CreditCard, Banknote,
    Ticket, Coffee, UserCheck
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Montserrat } from "next/font/google";
import { supabase } from "@/lib/supabaseClient";
// IMPORTANTE: Esta librería es la clave para generar la imagen en el cliente
import html2canvas from "html2canvas";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });

// --- TABS DE NAVEGACIÓN ---
const TABS = [
    { id: "resumen", label: "Resumen", icon: LayoutDashboard },
    { id: "ventas", label: "Finanzas", icon: DollarSign }, // NUEVO TAB
    { id: "reservas", label: "Reservas", icon: Calendar },
    { id: "menu_express", label: "Menú Reserva", icon: Utensils }, 
    { id: "clientes", label: "Clientes VIP", icon: UserPlus },
    { id: "shows", label: "Shows", icon: Music },
    { id: "promos", label: "Promociones", icon: Flame },
    { id: "eventos", label: "Cotizaciones", icon: FileText },
    { id: "rrhh", label: "Equipo", icon: Users },
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("resumen");
  const [isLoading, setIsLoading] = useState(false);
  
  // --- ESTADO PARA PROCESOS ASÍNCRONOS INDIVIDUALES (WHATSAPP) ---
  const [processingId, setProcessingId] = useState<string | number | null>(null);
  
  // --- ESTADOS DE DATOS ---
  const [promos, setPromos] = useState<any[]>([]);
  const [shows, setShows] = useState<any[]>([]);
  const [reservas, setReservas] = useState<any[]>([]);
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [candidatos, setCandidatos] = useState<any[]>([]); 
  const [clientes, setClientes] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]); 
  // NUEVO ESTADO: VENTAS
  const [ventas, setVentas] = useState<any[]>([]);

  // --- ESTADOS PARA CLIENTES ---
  const [birthdayFilterDate, setBirthdayFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState<any>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  
  // --- CARGA DE DATOS Y REALTIME (Conexión Supabase) ---
  useEffect(() => {
    fetchData();

    // Suscripción a cambios en tiempo real en las tablas críticas
    const channel = supabase
      .channel('realtime-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservas' }, () => fetchData()) 
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'productos_reserva' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ventas_generales' }, () => fetchData()) // Escuchar ventas
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

      // 3. Reservas (Incluye el JSON del pedido anticipado)
      const { data: reservasData } = await supabase.from('reservas').select('*').order('created_at', { ascending: false });
      if (reservasData) setReservas(reservasData);

      // 4. Solicitudes / Eventos
      const { data: solicitudesData } = await supabase.from('solicitudes').select('*').order('created_at', { ascending: false });
      if (solicitudesData) setSolicitudes(solicitudesData);

      // 5. Clientes
      const { data: clientesData } = await supabase.from('clientes').select('*').order('nombre', { ascending: true });
      if (clientesData) setClientes(clientesData);

      // 6. Menú Express (Productos que se muestran en la web)
      const { data: menuData } = await supabase.from('productos_reserva').select('*').order('name', { ascending: true });
      if (menuData) setMenuItems(menuData);

      // 7. Ventas Generales (NUEVO)
      const { data: ventasData } = await supabase.from('ventas_generales').select('*').order('created_at', { ascending: false });
      if (ventasData) setVentas(ventasData);
  };

  // --- CALCULOS FINANCIEROS (LÓGICA NUEVA INTEGRADA) ---
  // 1. Ingresos por Ventas Manuales
  const ingresosManuales = ventas.reduce((acc, curr) => acc + (curr.monto || 0), 0);
  // 2. Ingresos por Pre-orders de Reservas Web
  const ingresosPreOrder = reservas.reduce((acc, curr) => acc + (curr.total_pre_order || 0), 0);
  // 3. Total Global
  const totalIngresosGlobal = ingresosManuales + ingresosPreOrder;

  // 4. Desglose Específico
  const ventasEntradas = ventas.filter(v => v.tipo === 'entrada_manual').reduce((acc, curr) => acc + (curr.monto || 0), 0);
  const ventasMenuManual = ventas.filter(v => v.tipo === 'consumo_extra' || v.tipo === 'general').reduce((acc, curr) => acc + (curr.monto || 0), 0);
  const totalVentasMenu = ventasMenuManual + ingresosPreOrder;

  // 5. Generar Historial Unificado de Clientes (Reservas + Ventas)
  const getClientHistory = () => {
      const history: any[] = [];
      
      // A. Desde Reservas (Gente que reservó y quizás compró menú anticipado)
      reservas.forEach(res => {
          history.push({
              id: `res-${res.id}`,
              cliente: res.name,
              tipo: 'Reserva / Pre-order',
              detalle: res.pre_order && res.pre_order.length > 0 ? `${res.pre_order.length} items menú` : 'Solo Reserva',
              monto: res.total_pre_order || 0,
              fecha: res.created_at,
              estado: res.status,
              origen: 'Web'
          });
      });

      // B. Desde Ventas Manuales (Si se especificó cliente en la descripción)
      ventas.forEach(v => {
          // Intentamos extraer nombre si está en formato "Nombre - Descripcion" o usamos el campo cliente si existe en tu logica futura
          // Por ahora asumimos que descripcion trae info o es venta mostrador
          const parts = v.descripcion.split('-');
          const possibleName = parts.length > 1 ? parts[0].trim() : (v.tipo === 'entrada_manual' ? 'Venta Entrada' : 'Cliente Caja');
          
          history.push({
              id: `ven-${v.id}`,
              cliente: possibleName,
              tipo: v.tipo === 'entrada_manual' ? 'Ticket Acceso' : 'Consumo Local',
              detalle: v.descripcion,
              monto: v.monto,
              fecha: v.created_at,
              estado: 'pagado',
              origen: 'Caja'
          });
      });

      // Ordenar por fecha más reciente
      return history.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  };
  
  const clientHistory = getClientHistory();


  // --- ESTADOS DE MODALES Y ARCHIVOS ---
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [currentPromo, setCurrentPromo] = useState<any>(null);
  
  const [isShowModalOpen, setIsShowModalOpen] = useState(false);
  const [currentShow, setCurrentShow] = useState<any>(null);

  // MODAL PARA MENÚ EXPRESS
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [currentMenuItem, setCurrentMenuItem] = useState<any>(null);

  // MODAL PARA VENTAS
  const [isVentaModalOpen, setIsVentaModalOpen] = useState(false);
  const [currentVenta, setCurrentVenta] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // --- MANEJADOR DE IMAGEN (Unificado para todos los módulos) ---
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'promo' | 'show' | 'menu') => {
      const file = e.target.files?.[0];
      if (file) {
          setSelectedFile(file);
          const reader = new FileReader();
          reader.onloadend = () => {
              // Previsualización local
              if (type === 'promo') setCurrentPromo({ ...currentPromo, image_url: reader.result as string });
              if (type === 'show') setCurrentShow({ ...currentShow, image_url: reader.result as string });
              if (type === 'menu') setCurrentMenuItem({ ...currentMenuItem, image_url: reader.result as string });
          };
          reader.readAsDataURL(file);
      }
  };

  const uploadImageToSupabase = async (bucket: string = 'images', file: File | null = null) => {
      const fileToUpload = file || selectedFile;
      if (!fileToUpload) return null;
      
      const fileExt = fileToUpload.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      // Asegúrate de tener un bucket llamado 'images' en Supabase Storage
      const { error } = await supabase.storage.from(bucket).upload(fileName, fileToUpload);
      if (error) {
          console.error("Error subiendo imagen:", error);
          if (!file) alert("Error al subir imagen: " + error.message);
          return null;
      }
      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
      return data.publicUrl;
  };

  const triggerFileInput = () => {
      fileInputRef.current?.click();
  };

  // ---------------------------------------------------------
  // LÓGICA GESTIÓN DE VENTAS (NUEVO MODAL)
  // ---------------------------------------------------------
  const handleOpenVentaModal = () => {
      setCurrentVenta({ 
          descripcion: "", 
          cliente: "", // Campo para nombre cliente manual
          monto: 0, 
          tipo: "consumo_extra", 
          metodo_pago: "efectivo" 
      });
      setIsVentaModalOpen(true);
  };

  const handleSaveVenta = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      try {
          // Combinamos nombre cliente en descripción para mantener simple la tabla, o úsalo como prefieras
          const descFinal = currentVenta.cliente ? `${currentVenta.cliente} - ${currentVenta.descripcion}` : currentVenta.descripcion;

          const ventaData = {
              descripcion: descFinal,
              monto: currentVenta.monto,
              tipo: currentVenta.tipo,
              metodo_pago: currentVenta.metodo_pago,
              created_at: new Date().toISOString()
          };

          const { error } = await supabase.from('ventas_generales').insert([ventaData]);
          if (error) throw error;

          await fetchData();
          setIsVentaModalOpen(false);
      } catch (error: any) {
          alert("Error al registrar venta: " + error.message);
      } finally {
          setIsLoading(false);
      }
  };

  const handleDeleteVenta = async (id: number) => {
      if(confirm("¿Eliminar registro de venta? Esto afectará el arqueo.")) {
          await supabase.from('ventas_generales').delete().eq('id', id);
          fetchData();
      }
  };

  // ---------------------------------------------------------
  // LÓGICA GESTIÓN DE CLIENTES
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

          if (result.error) throw result.error;

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
          if (error) alert("Error al eliminar: " + error.message);
          else fetchData();
      }
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
          const text = event.target?.result as string;
          const lines = text.split('\n');
          const newClients = [];
          
          for (let i = 1; i < lines.length; i++) {
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

  const getBirthdays = () => {
      if (!birthdayFilterDate) return [];
      const filterDate = new Date(birthdayFilterDate);
      const filterMonth = filterDate.getMonth();
      const filterDay = filterDate.getDate() + 1; // Ajuste por zona horaria simple

      return clientes.filter(c => {
          if (!c.fecha_nacimiento) return false;
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
      setCurrentPromo(promo || { title: "", subtitle: "", category: "semana", day: "", price: 0, tag: "", active: true, desc_text: "", image_url: "" });
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
              title: currentPromo.title, subtitle: currentPromo.subtitle, category: currentPromo.category,
              day: currentPromo.day, price: currentPromo.price, tag: currentPromo.tag,
              desc_text: currentPromo.desc_text, active: currentPromo.active, image_url: finalImageUrl
          };
          if (currentPromo.id) await supabase.from('promociones').update(promoData).eq('id', currentPromo.id);
          else await supabase.from('promociones').insert([promoData]);
          await fetchData();
          setIsPromoModalOpen(false);
      } catch (error: any) { alert(error.message); } finally { setIsLoading(false); }
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
  // LÓGICA GESTIÓN DE MENÚ EXPRESS / RESERVA
  // ---------------------------------------------------------
  const handleOpenMenuModal = (item: any = null) => {
      setSelectedFile(null);
      setCurrentMenuItem(item || { 
          name: "", 
          description: "", 
          price: 0, 
          image_url: "", 
          active: true, 
          category: "General" 
      });
      setIsMenuModalOpen(true);
  };

  const handleSaveMenuItem = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      try {
          let finalImageUrl = currentMenuItem.image_url;
          if (selectedFile) {
              const uploadedUrl = await uploadImageToSupabase();
              if (uploadedUrl) finalImageUrl = uploadedUrl;
          }

          const menuData = {
              name: currentMenuItem.name,
              description: currentMenuItem.description,
              price: currentMenuItem.price,
              active: currentMenuItem.active,
              category: currentMenuItem.category,
              image_url: finalImageUrl
          };

          if (currentMenuItem.id) {
              await supabase.from('productos_reserva').update(menuData).eq('id', currentMenuItem.id);
          } else {
              await supabase.from('productos_reserva').insert([menuData]);
          }

          await fetchData();
          setIsMenuModalOpen(false);
      } catch (error: any) {
          console.error("Error guardando producto:", error);
          alert("Error: " + error.message);
      } finally {
          setIsLoading(false);
      }
  };

  const handleDeleteMenuItem = async (id: number) => {
      if(confirm("¿Estás seguro de eliminar este producto del menú?")) {
          await supabase.from('productos_reserva').delete().eq('id', id);
          fetchData();
      }
  };

  const toggleMenuStatus = async (id: number, currentStatus: boolean) => {
      await supabase.from('productos_reserva').update({ active: !currentStatus }).eq('id', id);
      fetchData();
  };

  // ---------------------------------------------------------
  // LÓGICA GESTIÓN DE SHOWS
  // ---------------------------------------------------------
  const handleOpenShowModal = (show: any = null) => {
      setSelectedFile(null);
      setCurrentShow(show || { title: "", subtitle: "", description: "", date_event: "", time_event: "", end_time: "", location: "Boulevard Zapallar, Curicó", sold: 0, total: 200, active: true, image_url: "", tag: "", is_adult: false, tickets: [] });
      setIsShowModalOpen(true);
  };

  const addTicketType = () => setCurrentShow({ ...currentShow, tickets: [...(currentShow.tickets || []), { id: Date.now().toString(), name: "", price: 0, desc: "" }] });
  const removeTicketType = (index: number) => { const nt = [...currentShow.tickets]; nt.splice(index, 1); setCurrentShow({ ...currentShow, tickets: nt }); };
  const updateTicketType = (index: number, field: string, value: any) => { const nt = [...currentShow.tickets]; nt[index] = { ...nt[index], [field]: field === 'price' ? (isNaN(value) ? 0 : value) : value }; setCurrentShow({ ...currentShow, tickets: nt }); };

  const handleSaveShow = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      try {
          let finalImageUrl = currentShow.image_url;
          if (selectedFile) {
              const uploadedUrl = await uploadImageToSupabase();
              if (uploadedUrl) finalImageUrl = uploadedUrl;
          }
          const showData = {
              title: currentShow.title, subtitle: currentShow.subtitle, description: currentShow.description,
              date_event: currentShow.date_event, time_event: currentShow.time_event, end_time: currentShow.end_time,
              location: currentShow.location, sold: currentShow.sold || 0, total: currentShow.total || 0,
              image_url: finalImageUrl, tag: currentShow.tag, is_adult: currentShow.is_adult, tickets: currentShow.tickets
          };
          if (currentShow.id) await supabase.from('shows').update(showData).eq('id', currentShow.id);
          else await supabase.from('shows').insert([showData]);
          await fetchData();
          setIsShowModalOpen(false);
      } catch (error: any) { alert(error.message); } finally { setIsLoading(false); }
  };

  const handleDeleteShow = async (id: number) => {
      if(confirm("¿Eliminar show?")) { await supabase.from('shows').delete().eq('id', id); fetchData(); }
  };

  // ---------------------------------------------------------
  // LÓGICA RESERVAS & SOLICITUDES (ACTUALIZADA CON WHATSAPP + IMAGEN)
  // ---------------------------------------------------------
  
  // Función SIMPLE para actualizar estado (usada para rechazar)
  const updateReservaStatus = async (id: number, status: string) => {
      await supabase.from('reservas').update({ status }).eq('id', id);
      fetchData();
  };

  const updateSolicitudStatus = async (id: number, status: string) => {
      await supabase.from('solicitudes').update({ status }).eq('id', id);
      fetchData();
  };

  // --- FUNCIÓN CLAVE: CONFIRMAR, GENERAR IMAGEN Y SINCRONIZAR CÓDIGO ---
  const handleConfirmReservation = async (reserva: any) => {
    if (!confirm(`¿Confirmar a ${reserva.name}, generar ticket y enviar WhatsApp?`)) return;

    setProcessingId(reserva.id); 

    try {
        // 1. DETERMINAR CÓDIGO FINAL (Prioridad: el que ya tiene > generar uno nuevo)
        const codigoFinal = reserva.reservation_code || `BZ-${Math.floor(1000 + Math.random() * 9000)}`;
        console.log("Generando ticket para código:", codigoFinal);

        // 2. CREAR ELEMENTO VISUAL (Ticket Negro y Dorado)
        const ticketElement = document.createElement("div");
        // Posicionamos fuera de pantalla pero visible para el render
        ticketElement.style.cssText = "position:fixed; top:-9999px; left:-9999px; width:1080px; height:1920px; font-family: 'Arial', sans-serif; color: white; text-align: center; background: #000;";
        
        // HTML del Ticket usando el CÓDIGO FINAL
        ticketElement.innerHTML = `
          <div style="width: 100%; height: 100%; position: relative; background: #000; display: flex; flex-direction: column; justify-content: center; align-items: center;">
              
              <img src="/ticket-bg.png" style="width:100%; height:100%; object-fit:cover; position:absolute; top:0; left:0; z-index:0; opacity: 0.6;" onerror="this.style.display='none'" />
              
              <div style="z-index: 10; width: 100%; display: flex; flex-direction: column; align-items: center; border: 20px solid #DAA520; height: 100%; box-sizing: border-box; justify-content: center;">
                  
                  <h1 style="font-size: 80px; color: #DAA520; margin: 0; letter-spacing: 10px; font-weight: bold; text-shadow: 2px 2px 10px rgba(0,0,0,0.8);">BOULEVARD</h1>
                  <h2 style="font-size: 50px; margin: 10px 0 60px 0; letter-spacing: 10px; color: #fff; text-shadow: 2px 2px 10px rgba(0,0,0,0.8);">ZAPALLAR</h2>
                  
                  <div style="font-size: 130px; font-weight: bold; color: #DAA520; margin: 60px 0; background: rgba(0,0,0,0.8); padding: 40px 80px; border: 4px solid #DAA520; border-radius: 40px; text-shadow: 0 0 20px #DAA520;">
                      ${codigoFinal}
                  </div>
                  
                  <div style="text-align: left; width: 80%; margin-top: 60px; font-size: 45px; line-height: 1.8; background: rgba(0,0,0,0.6); padding: 40px; border-radius: 30px; border: 1px solid #333;">
                      <p style="margin: 10px 0;"><strong style="color: #DAA520;">TITULAR:</strong> ${reserva.name}</p>
                      <p style="margin: 10px 0;"><strong style="color: #DAA520;">FECHA:</strong> ${reserva.date_reserva}</p>
                      <p style="margin: 10px 0;"><strong style="color: #DAA520;">HORA:</strong> ${reserva.time_reserva} HRS</p>
                      <p style="margin: 10px 0;"><strong style="color: #DAA520;">ZONA:</strong> ${reserva.zone}</p>
                      <p style="margin: 10px 0;"><strong style="color: #DAA520;">CANTIDAD:</strong> ${reserva.guests} PAX</p>
                  </div>

                  <p style="margin-top: 100px; font-size: 35px; color: #aaa; text-transform: uppercase; letter-spacing: 2px; text-shadow: 1px 1px 2px black;">Presenta este código en recepción</p>
              </div>
          </div>
        `;
        document.body.appendChild(ticketElement);

        // 3. GENERAR IMAGEN
        // Pequeña espera para cargar recursos
        await new Promise(resolve => setTimeout(resolve, 800));

        const canvas = await html2canvas(ticketElement, { 
            scale: 1, 
            useCORS: true, 
            allowTaint: true,
            backgroundColor: null 
        });
        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
        document.body.removeChild(ticketElement); // Limpieza

        let ticketPublicUrl = null;

        // 4. SUBIR A SUPABASE
        if (blob) {
            // Nombre único con el código
            const fileName = `ticket-${codigoFinal}-${Date.now()}.png`;
            // Subimos directamente usando uploadImageToSupabase modificado o lógica directa
            // Usamos lógica directa aquí para asegurar bucket 'tickets'
            const { error: uploadError } = await supabase.storage
                .from('tickets') // Asegúrate que este bucket es público
                .upload(fileName, blob, { contentType: 'image/png', upsert: true });
            
            if (!uploadError) {
                const { data } = supabase.storage.from('tickets').getPublicUrl(fileName);
                ticketPublicUrl = data.publicUrl;
                console.log("Ticket subido:", ticketPublicUrl);
            } else {
                 console.warn("Error subiendo ticket:", uploadError);
            }
        }

        // 5. ENVIAR A LA API (Sincronizando Código)
        // Enviamos 'codigoFinal' para forzar a la API a usar ESTE mismo código
        const response = await fetch("/api/admin/confirmar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                reservaId: reserva.id,
                ticketUrl: ticketPublicUrl,
                codigo: codigoFinal // <--- CLAVE DE LA SINCRONIZACIÓN
            }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
            alert(`✅ Reserva confirmada (Código: ${codigoFinal}).\nWhatsApp enviado.`);
            fetchData(); 
        } else {
            alert("⚠️ Confirmado en BD, pero error al enviar: " + (result.error || "Desconocido"));
            fetchData();
        }

    } catch (error: any) {
        console.error(error);
        alert("Error crítico al generar ticket: " + error.message);
    } finally {
        setProcessingId(null);
    }
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
        <nav className="flex-1 w-full space-y-2 px-2 overflow-y-auto custom-scrollbar">
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
                            { title: "Ingresos Global", value: `$${totalIngresosGlobal.toLocaleString('es-CL')}`, color: "bg-green-500" },
                            { title: "Clientes Total", value: clientes.length, color: "bg-purple-500" },
                        ].map((stat, i) => (
                            <div key={i} className="bg-zinc-900 border border-white/5 p-5 rounded-2xl shadow-lg">
                                <div className={`w-2 h-2 rounded-full mb-3 ${stat.color}`} />
                                <p className="text-xl md:text-2xl font-black text-white">{stat.value}</p>
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
                                    <div className="flex items-center gap-2">
                                        {res.total_pre_order > 0 && (
                                            <span className="text-[9px] font-bold text-[#DAA520] bg-[#DAA520]/10 px-2 py-1 rounded-full flex items-center gap-1">
                                                <ShoppingBag className="w-3 h-3"/> Pedido
                                            </span>
                                        )}
                                        <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${res.status === 'confirmada' ? 'bg-green-900/30 text-green-400' : 'bg-yellow-900/30 text-yellow-400'}`}>{res.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* --- 1.5 VISTA VENTAS / FINANZAS (NUEVO & EXTENDIDO) --- */}
            {activeTab === "ventas" && (
                <motion.div key="ventas" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {/* Header de Finanzas */}
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold">Gestión Financiera 360°</h3>
                        <button onClick={handleOpenVentaModal} className="bg-green-600 text-white px-6 py-3 rounded-xl text-xs font-bold uppercase flex items-center gap-2 hover:bg-green-700 transition-colors shadow-lg">
                            <DollarSign className="w-4 h-4" /> Registrar Venta Manual
                        </button>
                    </div>

                    {/* SECCIÓN 1: KPIs GLOBALES */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {/* INGRESO TOTAL */}
                        <div className="bg-zinc-900 border border-green-900/30 p-6 rounded-2xl relative overflow-hidden group hover:border-green-500/30 transition-all">
                            <div className="absolute top-0 right-0 p-4 opacity-10"><DollarSign className="w-24 h-24 text-green-500" /></div>
                            <p className="text-xs text-zinc-400 uppercase font-bold mb-2">Ingresos Totales (Global)</p>
                            <h2 className="text-4xl font-black text-white">${totalIngresosGlobal.toLocaleString('es-CL')}</h2>
                            <p className="text-[10px] text-zinc-500 mt-2">Incluye Pre-orders web y Ventas en caja</p>
                        </div>

                        {/* VENTA DE ENTRADAS */}
                        <div className="bg-zinc-900 border border-white/5 p-6 rounded-2xl relative overflow-hidden group hover:border-[#DAA520]/30 transition-all">
                            <div className="absolute top-0 right-0 p-4 opacity-10"><Ticket className="w-24 h-24 text-[#DAA520]" /></div>
                            <p className="text-xs text-zinc-400 uppercase font-bold mb-2">Venta de Entradas</p>
                            <h2 className="text-3xl font-black text-[#DAA520]">${ventasEntradas.toLocaleString('es-CL')}</h2>
                            <div className="w-full h-1 bg-zinc-800 rounded-full mt-4"><div style={{ width: `${(ventasEntradas/totalIngresosGlobal)*100}%` }} className="h-full bg-[#DAA520] rounded-full"></div></div>
                            <p className="text-[10px] text-zinc-500 mt-2">Tickets / Cover / Accesos</p>
                        </div>

                        {/* VENTA DE MENÚ */}
                        <div className="bg-zinc-900 border border-white/5 p-6 rounded-2xl relative overflow-hidden group hover:border-blue-500/30 transition-all">
                            <div className="absolute top-0 right-0 p-4 opacity-10"><Coffee className="w-24 h-24 text-blue-500" /></div>
                            <p className="text-xs text-zinc-400 uppercase font-bold mb-2">Venta de Menú / Carta</p>
                            <h2 className="text-3xl font-black text-blue-400">${totalVentasMenu.toLocaleString('es-CL')}</h2>
                            <div className="w-full h-1 bg-zinc-800 rounded-full mt-4"><div style={{ width: `${(totalVentasMenu/totalIngresosGlobal)*100}%` }} className="h-full bg-blue-500 rounded-full"></div></div>
                            <p className="text-[10px] text-zinc-500 mt-2">Consumo local + Pedidos anticipados</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* SECCIÓN 2: HISTORIAL DE CLIENTES (NUEVO) */}
                        <div className="bg-zinc-900 border border-white/5 rounded-3xl p-6 h-[500px] flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold flex items-center gap-2"><UserCheck className="w-5 h-5 text-zinc-400"/> Historial de Clientes</h3>
                                <span className="text-[10px] bg-zinc-800 px-2 py-1 rounded text-zinc-400">Reservas y Manuales</span>
                            </div>
                            <div className="overflow-y-auto custom-scrollbar flex-1">
                                <table className="w-full text-left text-sm text-zinc-400">
                                    <thead className="text-xs uppercase bg-black/40 text-zinc-500 sticky top-0 backdrop-blur-sm">
                                        <tr>
                                            <th className="px-4 py-3">Cliente</th>
                                            <th className="px-4 py-3">Origen</th>
                                            <th className="px-4 py-3 text-right">Consumo</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {clientHistory.map((item) => (
                                            <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-4 py-3">
                                                    <p className="font-bold text-white text-xs">{item.cliente}</p>
                                                    <p className="text-[10px] text-zinc-500">{new Date(item.fecha).toLocaleDateString()}</p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold ${item.tipo.includes('Reserva') ? 'bg-purple-900/30 text-purple-400' : 'bg-zinc-800 text-zinc-300'}`}>
                                                        {item.tipo}
                                                    </span>
                                                    <p className="text-[9px] text-zinc-500 mt-1 truncate max-w-[120px]">{item.detalle}</p>
                                                </td>
                                                <td className="px-4 py-3 text-right font-bold text-white">${item.monto.toLocaleString('es-CL')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {clientHistory.length === 0 && <div className="p-8 text-center text-zinc-600 text-xs">No hay historial de clientes aún.</div>}
                            </div>
                        </div>

                        {/* SECCIÓN 3: ÚLTIMAS TRANSACCIONES (REGISTRO CRUDO) */}
                        <div className="bg-zinc-900 border border-white/5 rounded-3xl p-6 h-[500px] flex flex-col">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-zinc-400"/> Transacciones en Caja</h3>
                            <div className="overflow-y-auto custom-scrollbar flex-1">
                                <table className="w-full text-left text-sm text-zinc-400">
                                    <thead className="text-xs uppercase bg-black/40 text-zinc-500 sticky top-0 backdrop-blur-sm">
                                        <tr>
                                            <th className="px-4 py-3">Desc.</th>
                                            <th className="px-4 py-3">Tipo</th>
                                            <th className="px-4 py-3 text-right">Monto</th>
                                            <th className="px-4 py-3 text-right"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {ventas.map((venta) => (
                                            <tr key={venta.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-4 py-3">
                                                    <p className="font-medium text-white text-xs truncate max-w-[150px]">{venta.descripcion}</p>
                                                    <p className="text-[10px] text-zinc-500">{venta.metodo_pago}</p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold ${
                                                        venta.tipo === 'entrada_manual' ? 'bg-[#DAA520]/20 text-[#DAA520]' : 'bg-blue-900/30 text-blue-400'
                                                    }`}>
                                                        {venta.tipo === 'entrada_manual' ? 'Entrada' : 'Menú'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right font-bold text-white">${venta.monto?.toLocaleString('es-CL')}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <button onClick={() => handleDeleteVenta(venta.id)} className="text-zinc-600 hover:text-red-500"><Trash2 className="w-3 h-3"/></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* 2. GESTIÓN DE RESERVAS */}
            {activeTab === "reservas" && (
                <motion.div key="reservas" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="space-y-3">
                        {reservas.length === 0 ? <p className="text-zinc-500">No hay reservas registradas.</p> : reservas.map((res) => (
                            <div key={res.id} className="bg-zinc-900 border border-white/5 p-4 rounded-xl">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
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
                                    <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto justify-end items-end">
                                        {res.status === "pendiente" ? (
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => handleConfirmReservation(res)} 
                                                    disabled={processingId === res.id}
                                                    className="px-4 py-2 bg-green-500/20 text-green-500 text-xs font-bold rounded-lg border border-green-500/30 hover:bg-green-500/30 flex items-center gap-2 transition-all disabled:opacity-50"
                                                >
                                                    {processingId === res.id ? (
                                                        <><Loader2 className="w-3 h-3 animate-spin" /> Generando...</>
                                                    ) : (
                                                        "Aceptar y Enviar"
                                                    )}
                                                </button>
                                                <button 
                                                    onClick={() => updateReservaStatus(res.id, 'rechazada')} 
                                                    disabled={!!processingId}
                                                    className="px-4 py-2 bg-red-500/20 text-red-500 text-xs font-bold rounded-lg border border-red-500/30 hover:bg-red-500/30 disabled:opacity-50"
                                                >
                                                    Rechazar
                                                </button>
                                            </div>
                                        ) : (
                                            <span className={`px-4 py-2 text-xs rounded-lg border font-bold uppercase tracking-wider ${res.status === 'confirmada' ? 'bg-zinc-800 text-green-400 border-green-900' : 'bg-zinc-800 text-red-400 border-red-900'}`}>
                                                {res.status === 'confirmada' ? 'Confirmado ✅' : res.status}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* SECCIÓN DE PEDIDO ANTICIPADO */}
                                {res.pre_order && res.pre_order.length > 0 && (
                                    <div className="mt-4 bg-black/40 rounded-lg p-3 border border-[#DAA520]/20">
                                            <div className="flex justify-between items-center mb-2">
                                                <p className="text-xs font-bold text-[#DAA520] uppercase flex items-center gap-2">
                                                    <ShoppingBag className="w-3 h-3" /> Pedido Anticipado
                                                </p>
                                                <span className="text-sm font-bold text-white">${res.total_pre_order?.toLocaleString() || 0}</span>
                                            </div>
                                            <div className="space-y-1">
                                                {res.pre_order.map((item: any, idx: number) => (
                                                    <div key={idx} className="flex justify-between text-[11px] text-zinc-400 border-b border-white/5 pb-1 last:border-0">
                                                        <span>{item.quantity}x {item.name}</span>
                                                        <span>${(item.price * item.quantity).toLocaleString()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* 3. MENÚ RESERVA / EXPRESS */}
            {activeTab === "menu_express" && (
                <motion.div key="menu_express" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold">Menú para Reservas (Pre-order)</h3>
                        <button onClick={() => handleOpenMenuModal()} className="bg-[#DAA520] text-black px-6 py-3 rounded-xl text-xs font-bold uppercase flex items-center gap-2 hover:bg-[#B8860B] transition-colors shadow-lg">
                            <Plus className="w-4 h-4" /> Nuevo Producto
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {menuItems.map((item) => (
                            <div key={item.id} className={`group bg-zinc-900 border ${item.active ? 'border-white/10' : 'border-red-900/30 opacity-60'} p-4 rounded-2xl relative transition-all hover:border-[#DAA520]/50`}>
                                <div className="relative w-full aspect-square bg-black rounded-xl overflow-hidden mb-4 border border-white/5">
                                    <Image src={item.image_url || "/placeholder.jpg"} alt={item.name} fill className="object-cover opacity-90" />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-lg font-bold text-white line-clamp-1">{item.name}</h3>
                                        <span className="text-xs font-bold text-[#DAA520] bg-black/50 px-2 py-1 rounded">${item.price.toLocaleString()}</span>
                                    </div>
                                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2 min-h-[2.5em]">{item.description}</p>
                                    <div className="flex justify-between items-center border-t border-white/10 pt-4 mt-2">
                                        <button onClick={() => toggleMenuStatus(item.id, item.active)} className={`text-[10px] font-bold uppercase ${item.active ? 'text-green-500' : 'text-zinc-500'}`}>{item.active ? "Disponible" : "Oculto"}</button>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleOpenMenuModal(item)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-zinc-300 transition-colors"><Edit2 className="w-4 h-4" /></button>
                                            <button onClick={() => handleDeleteMenuItem(item.id)} className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {activeTab === "clientes" && (
                <motion.div key="clientes" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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

            {activeTab === "promos" && (
                <motion.div key="promos" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold">Promociones Activas</h3>
                        <button onClick={() => handleOpenPromoModal()} className="bg-[#DAA520] text-black px-6 py-3 rounded-xl text-xs font-bold uppercase flex items-center gap-2 hover:bg-[#B8860B] transition-colors shadow-lg">
                            <Plus className="w-4 h-4" /> Nuevo Promo
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

        {/* --- MODALES --- */}

        {/* MODAL VENTA RÁPIDA (ACTUALIZADO CON CLIENTE Y TIPO) */}
        <AnimatePresence>
            {isVentaModalOpen && (
                 <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsVentaModalOpen(false)} />
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-sm relative z-70 shadow-2xl p-6">
                        <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-white uppercase flex items-center gap-2"><DollarSign className="w-5 h-5 text-green-500"/> Registrar Venta</h3><button onClick={() => setIsVentaModalOpen(false)} className="text-zinc-500 hover:text-white"><X className="w-5 h-5"/></button></div>
                        <form onSubmit={handleSaveVenta} className="space-y-4">
                            <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Nombre Cliente (Opcional)</label><input type="text" placeholder="Ej: Juan Pérez" className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none focus:border-green-500" value={currentVenta.cliente} onChange={e => setCurrentVenta({...currentVenta, cliente: e.target.value})} /></div>
                            <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Concepto / Detalle</label><input required type="text" placeholder="Ej: 2 Entradas VIP" className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none focus:border-green-500" value={currentVenta.descripcion} onChange={e => setCurrentVenta({...currentVenta, descripcion: e.target.value})} /></div>
                            <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Monto ($)</label><input required type="number" className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-xl font-bold outline-none focus:border-green-500" value={currentVenta.monto} onChange={e => setCurrentVenta({...currentVenta, monto: parseInt(e.target.value)})} /></div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Categoría</label>
                                    <select className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none focus:border-green-500" value={currentVenta.tipo} onChange={e => setCurrentVenta({...currentVenta, tipo: e.target.value})}>
                                        <option value="entrada_manual">🎫 Entrada / Ticket</option>
                                        <option value="consumo_extra">🍽️ Menú / Consumo</option>
                                        <option value="general">💰 Venta General</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Método Pago</label>
                                    <select className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none focus:border-green-500" value={currentVenta.metodo_pago} onChange={e => setCurrentVenta({...currentVenta, metodo_pago: e.target.value})}>
                                        <option value="efectivo">Efectivo</option>
                                        <option value="tarjeta">Tarjeta</option>
                                        <option value="transferencia">Transferencia</option>
                                    </select>
                                </div>
                            </div>
                            <button disabled={isLoading} type="submit" className="w-full bg-green-600 text-white font-bold uppercase tracking-widest py-3 rounded-xl mt-2 hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-900/20">{isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <><Save className="w-4 h-4"/> Confirmar Ingreso</>}</button>
                        </form>
                    </motion.div>
                 </div>
            )}
        </AnimatePresence>

        {/* CLIENTES */}
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

        {/* --- MODAL MENÚ EXPRESS (NUEVO) --- */}
        <AnimatePresence>
            {isMenuModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsMenuModalOpen(false)} />
                    <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-zinc-900 border border-white/10 rounded-3xl w-full max-w-4xl relative z-70 shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-[500px]">
                        <div className="w-full md:w-1/3 bg-black/50 border-r border-white/10 p-6 flex flex-col justify-center items-center relative group">
                            <input type="file" ref={fileInputRef} onChange={(e) => handleImageSelect(e, 'menu')} accept="image/*" className="hidden" />
                            <div onClick={triggerFileInput} className="relative w-full aspect-square rounded-2xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:border-[#DAA520] hover:bg-white/5 transition-all overflow-hidden">
                                {currentMenuItem.image_url ? (
                                    <>
                                        <Image src={currentMenuItem.image_url} alt="Preview" fill className="object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"><p className="text-xs font-bold text-white uppercase flex items-center gap-2"><ImageIcon className="w-4 h-4"/> Cambiar Imagen</p></div>
                                    </>
                                ) : (
                                    <div className="text-center text-zinc-500"><div className="p-4 bg-zinc-800 rounded-full mb-3 inline-block"><Upload className="w-6 h-6 text-zinc-400"/></div><p className="text-xs font-bold text-zinc-400 uppercase">Foto Producto</p><p className="text-[9px] text-zinc-600 mt-1">1080x1080 Rec.</p></div>
                                )}
                            </div>
                        </div>
                        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                            <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-white uppercase">{currentMenuItem.id ? "Editar" : "Nuevo"} Producto</h3><button onClick={() => setIsMenuModalOpen(false)} className="text-zinc-500 hover:text-white"><X className="w-6 h-6"/></button></div>
                            <form onSubmit={handleSaveMenuItem} className="space-y-4">
                                <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Nombre del Producto</label><input required type="text" placeholder="Ej: Tabla de Quesos" className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none focus:border-[#DAA520] transition-colors" value={currentMenuItem.name} onChange={e => setCurrentMenuItem({...currentMenuItem, name: e.target.value})} /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Categoría</label><select className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none focus:border-[#DAA520]" value={currentMenuItem.category} onChange={e => setCurrentMenuItem({...currentMenuItem, category: e.target.value})}><option value="Entradas">Entradas</option><option value="Tablas">Tablas</option><option value="Tragos">Tragos</option><option value="Bebidas">Bebidas</option><option value="General">General</option></select></div>
                                    <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Precio ($)</label><input type="number" className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none" value={currentMenuItem.price} onChange={e => setCurrentMenuItem({...currentMenuItem, price: parseInt(e.target.value)})} /></div>
                                </div>
                                <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Descripción</label><textarea rows={3} className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none resize-none" value={currentMenuItem.description || ""} onChange={e => setCurrentMenuItem({...currentMenuItem, description: e.target.value})} /></div>
                                <button disabled={isLoading} type="submit" className="w-full bg-[#DAA520] text-black font-bold uppercase tracking-widest py-4 rounded-xl mt-2 hover:bg-[#B8860B] transition-colors flex items-center justify-center gap-2">{isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <><Save className="w-4 h-4"/> Guardar Producto</>}</button>
                            </form>
                        </div>
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