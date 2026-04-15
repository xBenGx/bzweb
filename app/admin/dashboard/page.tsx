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
    Ticket, UserCheck, AlertCircle,
    Presentation, Eye, EyeOff, MonitorPlay, QrCode, FileCheck, Globe, RefreshCw, Archive, Briefcase, FileSignature, Receipt, FileDown
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Montserrat } from "next/font/google";
import { supabase } from "@/lib/supabaseClient";
import html2canvas from "html2canvas";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "900"] });

// --- TABS DE NAVEGACIÓN ---
const TABS = [
    { id: "resumen", label: "Resumen", icon: LayoutDashboard },
    { id: "ventas_show", label: "Ventas Show", icon: Ticket },
    { id: "reservas", label: "Reservas Mesa", icon: Calendar },
    { id: "pagos_web", label: "Pagos Web", icon: Globe },
    { id: "finanzas", label: "Finanzas ERP", icon: TrendingUp }, 
    { id: "shows", label: "Shows", icon: Music },
    { id: "promos", label: "Promociones", icon: Flame },
    { id: "menu_express", label: "Menú Reserva", icon: Utensils }, 
    { id: "clientes", label: "Clientes Boulevard", icon: UserPlus },
    { id: "eventos", label: "Cotizaciones", icon: FileText },
    { id: "carrusel", label: "Carrusel", icon: Presentation },
    { id: "rrhh", label: "Equipo", icon: Users },
];

const FINANZAS_TABS = [
    { id: "ingresos", label: "Ingresos / POS" },
    { id: "compras", label: "Compras Generales" },
    { id: "inventario", label: "Control Inventario" },
    { id: "gastos", label: "Gastos Fijos/Var." },
    { id: "sueldos", label: "Remuneraciones" },
    { id: "tributario", label: "Impuestos" }
];

export default function DashboardPage() {
  // --- 1. ESTADOS DE SEGURIDAD (AÑADIDOS PARA EL CAJERO) ---
  const [isCajero, setIsCajero] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState("resumen");
  const [sendingGiftId, setSendingGiftId] = useState<number | null>(null);
  const [activeFinanzasTab, setActiveFinanzasTab] = useState("ingresos");
  const [isLoading, setIsLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | number | null>(null);
  
  // --- ESTADOS DE DATOS BASE ---
  const [promos, setPromos] = useState<any[]>([]);
  const [shows, setShows] = useState<any[]>([]);
  const [reservas, setReservas] = useState<any[]>([]);
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [candidatos, setCandidatos] = useState<any[]>([]); 
  const [clientes, setClientes] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]); 
  const [ventas, setVentas] = useState<any[]>([]);

  // --- NUEVOS ESTADOS PARA PAGOS WEB ---
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("todos"); // "todos", "getnet", "transferencia", "manual", "puerta"
  const [isBoletaModalOpen, setIsBoletaModalOpen] = useState(false);
  const [currentBoletaData, setCurrentBoletaData] = useState<any>(null);
  const [isComprobanteModalOpen, setIsComprobanteModalOpen] = useState(false);
  const [currentComprobanteUrl, setCurrentComprobanteUrl] = useState<string | null>(null);
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  const [newManualPayment, setNewManualPayment] = useState({ cliente: "", email: "", monto: 0, metodo: "Transferencia", detalle: "" });

  // --- ESTADOS PARA VENTA DE ENTRADAS EN PUERTA ---
  const [isVentaPuertaModalOpen, setIsVentaPuertaModalOpen] = useState(false);
  const [ventaPuertaData, setVentaPuertaData] = useState({
      showId: "",
      ticketIndex: 0,
      quantity: 1,
      cliente: "",
      whatsapp: "",
      email: "",
      metodo_pago: "efectivo"
  });

  // --- NUEVOS ESTADOS ERP FINANZAS ---
  const [compras, setCompras] = useState<any[]>([]);
  const [inventario, setInventario] = useState<any[]>([]);
  const [gastos, setGastos] = useState<any[]>([]);
  const [trabajadores, setTrabajadores] = useState<any[]>([]);
  const [tributario, setTributario] = useState<any[]>([]);

  // --- FILTROS ---
  const [reservaFilterStatus, setReservaFilterStatus] = useState("todos");
  const [reservaSearch, setReservaSearch] = useState("");
  const [reservaDateFilter, setReservaDateFilter] = useState("");
  const [webPaymentSearch, setWebPaymentSearch] = useState("");
  const [birthdayFilterDate, setBirthdayFilterDate] = useState(new Date().toISOString().split('T')[0]);

  // --- ESTADOS DE MODALES ---
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState<any>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [currentPromo, setCurrentPromo] = useState<any>(null);
  
  const [isShowModalOpen, setIsShowModalOpen] = useState(false);
  const [currentShow, setCurrentShow] = useState<any>(null);

  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [currentMenuItem, setCurrentMenuItem] = useState<any>(null);

  const [isVentaModalOpen, setIsVentaModalOpen] = useState(false);
  const [currentVenta, setCurrentVenta] = useState<any>(null);

  // Modales Finanzas
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
  const [financeModalType, setFinanceModalType] = useState("");
  const [currentFinanceRecord, setCurrentFinanceRecord] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // --- 2. VERIFICACIÓN DE USUARIO AL INICIO ---
  useEffect(() => {
    const initSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || null);
        // Si detectamos que es el cajero, activamos su modo y lo enviamos a su pestaña
        if (user.email === "cajero@boulevardzapallar.cl") {
          setIsCajero(true);
          setActiveTab("ventas_show"); 
        }
      }
    };

    initSession();
  }, []);

  const formatDateSafe = (dateString: string) => {
      if (!dateString) return "Sin Fecha";
      const date = new Date(`${dateString}T12:00:00`); 
      if (isNaN(date.getTime())) return dateString; 
      return date.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const handleResetTable = async (tableName: string, displayName: string) => {
      const confirm1 = window.confirm(`⚠️ ADVERTENCIA CRÍTICA ⚠️\n\n¿Estás seguro de que deseas ELIMINAR TODOS los registros de ${displayName}? Esta acción NO se puede deshacer y empezarás desde 0.`);
      if (!confirm1) return;
      const confirm2 = window.prompt(`Para confirmar la eliminación total, escribe la palabra "BORRAR" en mayúsculas:`);
      if (confirm2 !== "BORRAR") {
          alert("Acción cancelada de seguridad.");
          return;
      }
      setIsLoading(true);
      try {
          const { error } = await supabase.from(tableName).delete().neq('id', -1);
          if (error) throw error;
          alert(`✅ ÉXITO. Todos los registros de ${displayName} han sido eliminados. El módulo se ha reseteado.`);
      } catch (error: any) {
          alert("Error al vaciar la tabla: " + error.message);
      } finally {
          setIsLoading(false);
      }
  };

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('realtime-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservas' }, () => fetchData()) 
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'productos_reserva' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ventas_generales' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'promociones' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shows' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'solicitudes' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'candidatos' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'finanzas_compras' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'finanzas_gastos' }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchData = async () => {
      const { data: promosData } = await supabase.from('promociones').select('*').order('id', { ascending: false });
      if (promosData) setPromos(promosData);

      const { data: showsData } = await supabase.from('shows').select('*').order('created_at', { ascending: false });
      if (showsData) setShows(showsData);

      const { data: reservasData } = await supabase.from('reservas').select('*').order('created_at', { ascending: false });
      if (reservasData) setReservas(reservasData);

      const { data: solicitudesData } = await supabase.from('solicitudes').select('*').order('created_at', { ascending: false });
      if (solicitudesData) setSolicitudes(solicitudesData);

      const { data: candsData } = await supabase.from('candidatos').select('*').order('created_at', { ascending: false });
      if (candsData) setCandidatos(candsData);

      const { data: clientesData } = await supabase.from('clientes').select('*').order('nombre', { ascending: true });
      if (clientesData) setClientes(clientesData);

      const { data: menuData } = await supabase.from('productos_reserva').select('*').order('name', { ascending: true });
      if (menuData) setMenuItems(menuData);

      const { data: ventasData } = await supabase.from('ventas_generales').select('*').order('created_at', { ascending: false });
      if (ventasData) setVentas(ventasData);

      const { data: comprasData } = await supabase.from('finanzas_compras').select('*').order('created_at', { ascending: false });
      if (comprasData) setCompras(comprasData);

      const { data: inventarioData } = await supabase.from('finanzas_inventario').select('*').order('created_at', { ascending: false });
      if (inventarioData) setInventario(inventarioData);

      const { data: gastosData } = await supabase.from('finanzas_gastos').select('*').order('created_at', { ascending: false });
      if (gastosData) setGastos(gastosData);

      const { data: trabData } = await supabase.from('finanzas_trabajadores').select('*').order('created_at', { ascending: false });
      if (trabData) setTrabajadores(trabData);

      const { data: tribData } = await supabase.from('finanzas_tributario').select('*').order('created_at', { ascending: false });
      if (tribData) setTributario(tribData);
  };

  const getCarouselItems = () => {
      const mappedPromos = promos.map(p => ({...p, type: 'promo', sourceId: p.id}));
      const mappedShows = shows.map(s => ({...s, type: 'show', sourceId: s.id}));
      return [...mappedShows, ...mappedPromos].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };
  const carouselItems = getCarouselItems();
  const carouselItemsActiveCount = carouselItems.filter(i => i.active).length;

  const toggleVisibility = async (item: any) => {
      const table = item.type === 'promo' ? 'promociones' : 'shows';
      await supabase.from(table).update({ active: !item.active }).eq('id', item.sourceId);
  };

  // --- CÁLCULOS FINANCIEROS AVANZADOS ---
  const ingresosManuales = ventas.reduce((acc, curr) => acc + (curr.monto || 0), 0);
  const ingresosPreOrder = reservas.reduce((acc, curr) => acc + (curr.total_pre_order || 0), 0);
  const totalIngresosGlobal = ingresosManuales + ingresosPreOrder;

  const ventasEfectivo = ventas.filter(v => v.metodo_pago === 'efectivo').reduce((acc, c) => acc + c.monto, 0);
  const ventasDebito = ventas.filter(v => v.metodo_pago === 'debito').reduce((acc, c) => acc + c.monto, 0);
  const ventasCredito = ventas.filter(v => v.metodo_pago === 'credito').reduce((acc, c) => acc + c.monto, 0);
  const ventasTransferencia = ventas.filter(v => v.metodo_pago === 'transferencia').reduce((acc, c) => acc + c.monto, 0);

  // SEPARACIÓN DE RESERVAS vs TICKETS SHOW
  const getTicketDetails = (pre_order: any) => {
      const tickets = pre_order?.filter((i:any) => i.category === 'ticket') || [];
      const menu = pre_order?.filter((i:any) => i.category !== 'ticket') || [];
      return { tickets, menu, hasTickets: tickets.length > 0 };
  };

  // --- PAGOS WEB DETALLADOS (MOVIDO ARRIBA PARA EVITAR ERROR TS2304) ---
  const getWebPayments = () => {
      return reservas.filter(r => r.total_pre_order > 0 || r.payment_id).map(r => {
          const { tickets, menu } = getTicketDetails(r.pre_order);
          let detalleArr = [];
          if(tickets.length > 0) detalleArr.push(`${tickets.reduce((a:any,c:any) => a+c.quantity, 0)} Tickets`);
          if(menu.length > 0) detalleArr.push(`${menu.reduce((a:any,c:any) => a+c.quantity, 0)} Platos`);

          // Lógica mejorada para leer el método de pago real
          let metodoCalculado = 'Transferencia';
          if (r.payment_id) {
              if (r.payment_id.toLowerCase().includes('puerta')) {
                  metodoCalculado = r.payment_id.split('-')[1]?.trim().toUpperCase() || 'PUERTA';
              } else if (r.payment_id.includes('MANUAL')) {
                  metodoCalculado = r.payment_id.split('-')[1]?.trim().toUpperCase() || 'MANUAL';
              } else {
                  metodoCalculado = 'GETNET';
              }
          }

          return {
              id: r.id, cliente: r.name, email: r.email, fecha: r.created_at, monto: r.total_pre_order,
              ref_getnet: r.payment_id || 'Transferencia/Otro',
              status_pago: (r.status === 'confirmada' || r.status === 'pagado' || r.status === 'realizado') ? 'APROBADO' : (r.status === 'rechazada' ? 'RECHAZADO' : 'PENDIENTE'),
              detalle: detalleArr.join(' + ') || 'Reserva Normal', 
              metodo: metodoCalculado,
              reserva_obj: r,
              comprobante_url: r.comprobante_url || null, 
              detalle_completo: r.pre_order || []
          }
      }).filter(p => {
          const matchSearch = p.cliente.toLowerCase().includes(webPaymentSearch.toLowerCase()) || p.ref_getnet.toLowerCase().includes(webPaymentSearch.toLowerCase());
          const matchMethod = paymentMethodFilter === "todos" ? true : p.metodo.toLowerCase() === paymentMethodFilter.toLowerCase();
          return matchSearch && matchMethod;
      }).sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  };
  
  const webPayments = getWebPayments();
  const totalWebApproved = webPayments.filter(p => p.status_pago === 'APROBADO').reduce((acc, curr) => acc + curr.monto, 0);
  const totalWebPending = webPayments.filter(p => p.status_pago === 'PENDIENTE').reduce((acc, curr) => acc + curr.monto, 0);

  const reservasTicketsOnly = reservas.filter(r => getTicketDetails(r.pre_order).hasTickets);
  const reservasNormalesOnly = reservas.filter(r => !getTicketDetails(r.pre_order).hasTickets);

  // Calcular rendimiento de shows diferenciando entradas vs comida web
  const getShowPerformance = () => {
    return shows.map(show => {
        const matchReservas = reservas.filter(r => r.date_reserva === show.date_event && r.status !== 'rechazada');
        const totalPax = matchReservas.reduce((acc, curr) => acc + parseInt(curr.guests || 0), 0);
        
        let ticketsAmount = 0;
        let foodAmount = 0;
        
        matchReservas.forEach(r => {
            if(r.pre_order) {
                r.pre_order.forEach((item:any) => {
                    if(item.category === 'ticket') ticketsAmount += (item.price * item.quantity);
                    else foodAmount += (item.price * item.quantity);
                });
            }
        });

        return { ...show, paxReal: totalPax, recaudacionTickets: ticketsAmount, recaudacionComida: foodAmount };
    });
  };
  const showPerformance = getShowPerformance();
  
  // --- MANEJADOR DE IMAGEN ---
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'promo' | 'show' | 'menu') => {
      const file = e.target.files?.[0];
      if (file) {
          setSelectedFile(file);
          const reader = new FileReader();
          reader.onloadend = () => {
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
      const { error } = await supabase.storage.from(bucket).upload(fileName, fileToUpload);
      if (error) { console.error(error); return null; }
      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
      return data.publicUrl;
  };
  const triggerFileInput = () => fileInputRef.current?.click();

  // --- SINCRONIZACIÓN AUTOMÁTICA DE CLIENTES ---
  const syncClientToDB = async (reserva: any) => {
      try {
          const { data: existing } = await supabase.from('clientes').select('id').eq('whatsapp', reserva.phone).single();
          if(!existing) {
              await supabase.from('clientes').insert([{ 
                  nombre: reserva.name, 
                  email: reserva.email || null, 
                  whatsapp: reserva.phone, 
                  fecha_nacimiento: null 
              }]);
          }
      } catch(e) { console.error("Error silencioso al sincronizar cliente", e); }
  };

  // --- CRUD FINANZAS (VENTAS POS) ---
  const handleOpenVentaModal = () => {
      setCurrentVenta({ descripcion: "", cliente: "", monto: 0, tipo: "consumo_extra", metodo_pago: "efectivo", origen: "caja_pos" });
      setIsVentaModalOpen(true);
  };

  const handleSaveVenta = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      try {
          const descFinal = currentVenta.cliente ? `${currentVenta.cliente} - ${currentVenta.descripcion}` : currentVenta.descripcion;
          const ventaData = {
              descripcion: descFinal, monto: currentVenta.monto, tipo: currentVenta.tipo, 
              metodo_pago: currentVenta.metodo_pago, origen: currentVenta.origen, created_at: new Date().toISOString()
          };
          const { error } = await supabase.from('ventas_generales').insert([ventaData]);
          if (error) throw error;
          await fetchData();
          setIsVentaModalOpen(false);
      } catch (error: any) { alert("Error al registrar venta: " + error.message); } finally { setIsLoading(false); }
  };
  const handleDeleteVenta = async (id: number) => {
      if(confirm("¿Eliminar registro de venta? Esto afectará el arqueo.")) { await supabase.from('ventas_generales').delete().eq('id', id); fetchData(); }
  };

  // --- CRUD GENÉRICO FINANZAS (COMPRAS, GASTOS, ETC) ---
  const openFinanceModal = (type: string, record: any = null) => {
      setFinanceModalType(type);
      setCurrentFinanceRecord(record || {});
      setIsFinanceModalOpen(true);
  };

  const handleSaveFinanceRecord = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      try {
          let table = "";
          if(financeModalType === 'compras') table = 'finanzas_compras';
          if(financeModalType === 'gastos') table = 'finanzas_gastos';
          if(financeModalType === 'inventario') table = 'finanzas_inventario';
          if(financeModalType === 'trabajadores') table = 'finanzas_trabajadores';
          if(financeModalType === 'tributario') table = 'finanzas_tributario';

          if (currentFinanceRecord.id) {
              await supabase.from(table).update(currentFinanceRecord).eq('id', currentFinanceRecord.id);
          } else {
              await supabase.from(table).insert([currentFinanceRecord]);
          }
          await fetchData();
          setIsFinanceModalOpen(false);
      } catch (err:any) { alert(`Error guardando en ${financeModalType}: Verifica que la tabla en Supabase exista. Detalle: ${err.message}`); } finally { setIsLoading(false); }
  };

  const handleDeleteFinanceRecord = async (table: string, id: number) => {
      if(confirm("¿Eliminar registro financiero?")) { await supabase.from(table).delete().eq('id', id); fetchData(); }
  };

  // --- CRUD CLIENTES BOULEVARD ---
  const handleOpenClientModal = (client: any = null) => {
      setCurrentClient(client || { nombre: "", email: "", whatsapp: "", fecha_nacimiento: "" });
      setIsClientModalOpen(true);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      try {
          const clientData = { nombre: currentClient.nombre, email: currentClient.email, whatsapp: currentClient.whatsapp, fecha_nacimiento: currentClient.fecha_nacimiento };
          if (currentClient.id) await supabase.from('clientes').update(clientData).eq('id', currentClient.id);
          else await supabase.from('clientes').insert([clientData]);
          await fetchData();
          setIsClientModalOpen(false);
      } catch (error: any) { alert("Error al guardar: " + error.message); } finally { setIsLoading(false); }
  };
  const handleDeleteClient = async (id: number) => {
      if(confirm("¿Estás seguro de eliminar este cliente?")) { await supabase.from('clientes').delete().eq('id', id); fetchData(); }
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
              const [nombre, email, whatsapp, fecha] = lines[i].split(',');
              if (nombre && whatsapp) {
                  newClients.push({ nombre: nombre.trim(), email: email?.trim(), whatsapp: whatsapp.trim(), fecha_nacimiento: fecha ? fecha.trim() : null });
              }
          }
          if (newClients.length > 0) {
              const { error } = await supabase.from('clientes').insert(newClients);
              if (error) alert("Error importando: " + error.message);
              else { alert(`Se importaron ${newClients.length} clientes correctamente.`); fetchData(); }
          }
      };
      reader.readAsText(file);
  };

  // --- OTRAS FUNCIONES (PROMOS, MENU, SHOWS) ---
  const handleOpenPromoModal = (promo: any = null) => { setSelectedFile(null); setCurrentPromo(promo || { title: "", subtitle: "", category: "semana", day: "", price: 0, tag: "", active: true, desc_text: "", image_url: "" }); setIsPromoModalOpen(true); };
  const handleSavePromo = async (e: React.FormEvent) => { e.preventDefault(); setIsLoading(true); try { let finalImageUrl = currentPromo.image_url; if (selectedFile) { const uploadedUrl = await uploadImageToSupabase(); if (uploadedUrl) finalImageUrl = uploadedUrl; } const promoData = { ...currentPromo, image_url: finalImageUrl }; if (currentPromo.id) await supabase.from('promociones').update(promoData).eq('id', currentPromo.id); else await supabase.from('promociones').insert([promoData]); await fetchData(); setIsPromoModalOpen(false); } catch (error: any) { alert(error.message); } finally { setIsLoading(false); } };
  const handleDeletePromo = async (id: number) => { if(confirm("¿Eliminar promoción?")) { await supabase.from('promociones').delete().eq('id', id); fetchData(); } };
  const togglePromoStatus = async (id: number, currentStatus: boolean) => { await supabase.from('promociones').update({ active: !currentStatus }).eq('id', id); fetchData(); };

  const handleOpenMenuModal = (item: any = null) => { setSelectedFile(null); setCurrentMenuItem(item || { name: "", description: "", price: 0, image_url: "", active: true, category: "General" }); setIsMenuModalOpen(true); };
  const handleSaveMenuItem = async (e: React.FormEvent) => { e.preventDefault(); setIsLoading(true); try { let finalImageUrl = currentMenuItem.image_url; if (selectedFile) { const uploadedUrl = await uploadImageToSupabase(); if (uploadedUrl) finalImageUrl = uploadedUrl; } const menuData = { ...currentMenuItem, image_url: finalImageUrl }; if (currentMenuItem.id) await supabase.from('productos_reserva').update(menuData).eq('id', currentMenuItem.id); else await supabase.from('productos_reserva').insert([menuData]); await fetchData(); setIsMenuModalOpen(false); } catch (error: any) { alert("Error: " + error.message); } finally { setIsLoading(false); } };
  const handleDeleteMenuItem = async (id: number) => { if(confirm("¿Eliminar producto?")) { await supabase.from('productos_reserva').delete().eq('id', id); fetchData(); } };
  const toggleMenuStatus = async (id: number, currentStatus: boolean) => { await supabase.from('productos_reserva').update({ active: !currentStatus }).eq('id', id); fetchData(); };

  const handleOpenShowModal = (show: any = null) => { setSelectedFile(null); setCurrentShow(show || { title: "", subtitle: "", description: "", date_event: "", time_event: "", end_time: "", location: "Boulevard Zapallar, Curicó", sold: 0, total: 200, active: true, image_url: "", tag: "", is_adult: false, tickets: [] }); setIsShowModalOpen(true); };
  const addTicketType = () => setCurrentShow({ ...currentShow, tickets: [...(currentShow.tickets || []), { id: Date.now().toString(), name: "", price: 0, desc: "" }] });
  const removeTicketType = (index: number) => { const nt = [...currentShow.tickets]; nt.splice(index, 1); setCurrentShow({ ...currentShow, tickets: nt }); };
  const updateTicketType = (index: number, field: string, value: any) => { const nt = [...currentShow.tickets]; nt[index] = { ...nt[index], [field]: field === 'price' ? (isNaN(value) ? 0 : value) : value }; setCurrentShow({ ...currentShow, tickets: nt }); };
  const handleSaveShow = async (e: React.FormEvent) => { e.preventDefault(); setIsLoading(true); try { let finalImageUrl = currentShow.image_url; if (selectedFile) { const uploadedUrl = await uploadImageToSupabase(); if (uploadedUrl) finalImageUrl = uploadedUrl; } const showData = { ...currentShow, image_url: finalImageUrl }; if (currentShow.id) await supabase.from('shows').update(showData).eq('id', currentShow.id); else await supabase.from('shows').insert([showData]); await fetchData(); setIsShowModalOpen(false); } catch (error: any) { alert(error.message); } finally { setIsLoading(false); } };
  const handleDeleteShow = async (id: number) => { if(confirm("¿Eliminar show?")) { await supabase.from('shows').delete().eq('id', id); fetchData(); } };

  // --- ACTUALIZAR ESTADO DE PAGOS WEB ---
  const handleUpdatePaymentStatus = async (reservaId: number, newStatus: string) => {
    setIsLoading(true);
    try {
        await supabase.from('reservas').update({ status: newStatus }).eq('id', reservaId);
        await fetchData();
    } catch(e) {
        console.error(e);
        alert("Error al actualizar el estado");
    } finally {
        setIsLoading(false);
    }
  };

  // --- FUNCIONES NUEVAS PAGOS WEB ---
  const handleOpenBoleta = (payment: any) => {
      setCurrentBoletaData(payment);
      setIsBoletaModalOpen(true);
  };

  const generatePDFBoleta = async () => {
      const element = document.getElementById('boleta-imprimible');
      if(!element) return;
      
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: [80, 200]
      });
      
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`boleta-${currentBoletaData.ref_getnet}-${currentBoletaData.cliente}.pdf`);
  };

  const handleSaveManualPayment = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      try {
          // 1. Subir comprobante si el cliente seleccionó uno
          let comprobanteUrl = null;
          if (selectedFile) {
              comprobanteUrl = await uploadImageToSupabase('tickets'); 
          }

          const fakeCode = `MANUAL-${Math.floor(1000 + Math.random() * 9000)}`;
          const finalPaymentId = newManualPayment.metodo === 'Getnet' ? fakeCode : `MANUAL - ${newManualPayment.metodo}`;

          const { error } = await supabase.from('reservas').insert([{
              name: newManualPayment.cliente,
              email: newManualPayment.email,
              total_pre_order: newManualPayment.monto,
              status: 'confirmada',
              payment_id: finalPaymentId,
              reservation_code: fakeCode,
              pre_order: [{ name: newManualPayment.detalle, price: newManualPayment.monto, quantity: 1, category: 'general' }],
              comprobante_url: comprobanteUrl 
          }]);
          
          if (error) throw error;
          await fetchData();
          setIsAddPaymentModalOpen(false);
          setNewManualPayment({ cliente: "", email: "", monto: 0, metodo: "Transferencia", detalle: "" });
          setSelectedFile(null);
      } catch (error: any) {
          alert("Error al registrar pago manual: " + error.message);
      } finally {
          setIsLoading(false);
      }
  };

  // --- REGISTRAR VENTA DE ENTRADA MANUAL (PUERTA) ---
  const handleSaveVentaPuerta = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      try {
          const show = shows.find(s => s.id.toString() === ventaPuertaData.showId);
          if (!show) throw new Error("Debes seleccionar un show válido.");
          
          const ticket = show.tickets[ventaPuertaData.ticketIndex];
          if (!ticket) throw new Error("Debes seleccionar un tipo de ticket válido.");

          // 1. Subir comprobante si el cliente seleccionó uno
          let comprobanteUrl = null;
          if (selectedFile) {
              comprobanteUrl = await uploadImageToSupabase('tickets');
          }

          const total = ticket.price * ventaPuertaData.quantity;
          const fakeCode = `PUERTA-${Math.floor(10000 + Math.random() * 90000)}`;

          const preOrderData = [{
              category: "ticket",
              name: ticket.name,
              price: ticket.price,
              quantity: ventaPuertaData.quantity,
              show_id: show.id
          }];

          const { error: reservaError } = await supabase.from('reservas').insert([{
              name: ventaPuertaData.cliente,
              phone: ventaPuertaData.whatsapp,
              email: ventaPuertaData.email,
              date_reserva: show.date_event,
              time_reserva: show.time_event,
              guests: ventaPuertaData.quantity,
              status: 'pendiente', 
              total_pre_order: total,
              payment_id: `Puerta - ${ventaPuertaData.metodo_pago}`,
              reservation_code: fakeCode,
              pre_order: preOrderData,
              comprobante_url: comprobanteUrl 
          }]);

          if (reservaError) throw reservaError;

          await supabase.from('ventas_generales').insert([{
              descripcion: `TKT Puerta: ${show.title} (${ventaPuertaData.quantity}x ${ticket.name})`,
              monto: total,
              tipo: 'entrada_manual',
              metodo_pago: ventaPuertaData.metodo_pago,
              origen: 'caja_pos'
          }]);

          alert("✅ Venta registrada con éxito.");
          await fetchData();
          setIsVentaPuertaModalOpen(false);
          setVentaPuertaData({ showId: "", ticketIndex: 0, quantity: 1, cliente: "", whatsapp: "", email: "", metodo_pago: "efectivo" });
          setSelectedFile(null);
      } catch (error: any) {
          alert("Error: " + error.message);
      } finally {
          setIsLoading(false);
      }
  };

  // --- CONFIRMACIÓN RESERVAS NORMALES ---
  const handleConfirmReservation = async (reserva: any) => {
    if (!confirm(`¿Confirmar Reserva de Mesa a ${reserva.name} y enviar WhatsApp?`)) return;
    setProcessingId(reserva.id); 
    try {
        await syncClientToDB(reserva);

        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const codigoFinal = reserva.code || `BZ-${randomNum}`;

        const ticketElement = document.createElement("div");
        ticketElement.style.cssText = "position:fixed; top:-9999px; left:-9999px; width:1080px; height:1920px; font-family: 'Arial', sans-serif; color: white; text-align: center; background: #000;";
        ticketElement.innerHTML = `
          <div style="width: 100%; height: 100%; position: relative; background: #000; display: flex; flex-direction: column; justify-content: center; align-items: center;">
              <img src="/ticket-bg.png" style="width:100%; height:100%; object-fit:cover; position:absolute; top:0; left:0; z-index:0; opacity: 0.6;" onerror="this.style.display='none'" />
              <div style="z-index: 10; width: 100%; display: flex; flex-direction: column; align-items: center; border: 20px solid #DAA520; height: 100%; box-sizing: border-box; justify-content: center;">
                  <h1 style="font-size: 80px; color: #DAA520; margin: 0; letter-spacing: 10px; font-weight: bold; text-shadow: 2px 2px 10px rgba(0,0,0,0.8);">BOULEVARD</h1>
                  <h2 style="font-size: 50px; margin: 10px 0 60px 0; letter-spacing: 10px; color: #fff; text-shadow: 2px 2px 10px rgba(0,0,0,0.8);">ZAPALLAR</h2>
                  <div style="font-size: 130px; font-weight: bold; color: #DAA520; margin: 60px 0; background: rgba(0,0,0,0.8); padding: 40px 80px; border: 4px solid #DAA520; border-radius: 40px; text-shadow: 0 0 20px #DAA520;">${codigoFinal}</div>
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
        await new Promise(resolve => setTimeout(resolve, 800));
        const canvas = await html2canvas(ticketElement, { scale: 1, useCORS: true, allowTaint: true, backgroundColor: null });
        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
        document.body.removeChild(ticketElement);

        let ticketPublicUrl = null;
        if (blob) {
            const fileName = `reserva-${codigoFinal}-${Date.now()}.png`;
            const { error: uploadError } = await supabase.storage.from('tickets').upload(fileName, blob, { contentType: 'image/png', upsert: true });
            if (!uploadError) {
                const { data } = supabase.storage.from('tickets').getPublicUrl(fileName);
                ticketPublicUrl = data.publicUrl;
            }
        }

        const customMessage = `Hola ${reserva.name} 👋,\n\n¡Tu reserva de mesa en *Boulevard Zapallar* está CONFIRMADA! 🥂\n\n🔑 *CÓDIGO DE ACCESO: ${codigoFinal}*\n\n📅 Fecha: ${reserva.date_reserva}\n👥 Personas: ${reserva.guests}\n\n👇 *IMPORTANTE: TICKET DE INGRESO*\nLa imagen adjunta es tu pase de reserva. Por favor muéstralo en recepción al llegar.\n\n¡Te esperamos!`;

        const response = await fetch("/api/admin/confirmar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                reservaId: reserva.id, 
                ticketUrl: ticketPublicUrl, 
                reservation_code: codigoFinal, 
                phone: reserva.phone,
                customMessage: customMessage
            }),
        });

        const result = await response.json();
        if (response.ok && result.success) { alert(`✅ Reserva de Mesa confirmada.\nWhatsApp enviado.`); fetchData(); } 
        else { alert("⚠️ Error: " + (result.error || "Desconocido")); fetchData(); }
    } catch (error: any) { alert("Error crítico al generar ticket: " + error.message); } finally { setProcessingId(null); }
  };

  // --- CONFIRMACIÓN ENTRADAS SHOW (TIPO PASSLINE CON QR REAL) ---
  const handleConfirmShowTicket = async (reserva: any) => {
    if (!confirm(`¿Confirmar COMPRA DE ENTRADA a ${reserva.name}, generar ticket E-Pass y enviar WhatsApp?`)) return;
    setProcessingId(reserva.id); 
    try {
        await syncClientToDB(reserva);

        const randomNum = Math.floor(100000 + Math.random() * 900000); 
        const codigoFinal = reserva.code || `TKT-${randomNum}`;
        const { tickets, menu } = getTicketDetails(reserva.pre_order);
        const ticketNames = tickets.map((t:any) => `${t.quantity}x ${t.name}`).join(', ');
        
        // URL CORREGIDA: Apunta a /admin/validar-ticket/ para evitar el 404
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://bzweb.vercel.app';
        const qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${origin}/admin/validar-ticket/${reserva.id}`;

        const ticketElement = document.createElement("div");
        ticketElement.style.cssText = "position:fixed; top:-9999px; left:-9999px; width:800px; height:1400px; font-family: 'Arial', sans-serif; color: black; text-align: center; background: #fff;";
        ticketElement.innerHTML = `
            <div style="width: 100%; height: 100%; display: flex; flex-direction: column; border: 4px solid #000; box-sizing: border-box; position: relative;">
                <div style="background: #000; padding: 60px 20px; color: #DAA520;">
                    <h1 style="font-size: 70px; margin: 0; letter-spacing: 5px; font-weight: 900;">BOULEVARD ZAPALLAR</h1>
                    <h2 style="font-size: 30px; margin: 10px 0 0 0; color: #fff; letter-spacing: 10px;">E-TICKET OFICIAL</h2>
                </div>
                <div style="padding: 60px; flex: 1; display: flex; flex-direction: column; justify-content: space-between; text-align: left;">
                    <div>
                        <p style="font-size: 24px; color: #666; margin-bottom: 5px;">TITULAR DE LA ENTRADA</p>
                        <p style="font-size: 50px; font-weight: 900; margin: 0; text-transform: uppercase;">${reserva.name}</p>
                    </div>
                    <div style="margin-top: 40px; border-top: 2px dashed #ccc; border-bottom: 2px dashed #ccc; padding: 40px 0;">
                        <p style="font-size: 24px; color: #666; margin-bottom: 5px;">TIPO DE ENTRADA</p>
                        <p style="font-size: 40px; font-weight: bold; margin: 0; color: #000;">${ticketNames || 'Entrada General'}</p>
                        <p style="font-size: 24px; color: #666; margin-top: 30px; margin-bottom: 5px;">FECHA Y HORA DE ACCESO</p>
                        <p style="font-size: 35px; font-weight: bold; margin: 0; color: #000;">${reserva.date_reserva} - ${reserva.time_reserva} HRS</p>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 40px;">
                        <div style="flex: 1;">
                            <p style="font-size: 20px; color: #666; margin-bottom: 5px;">CÓDIGO ÚNICO DE INGRESO</p>
                            <p style="font-size: 45px; font-weight: 900; margin: 0; letter-spacing: 2px;">${codigoFinal}</p>
                            ${menu.length > 0 ? `<div style="margin-top: 20px; background: #DAA520; padding: 10px 20px; border-radius: 10px; display: inline-block;"><p style="font-size: 18px; margin: 0; color: #000; font-weight:bold;">+ INCLUYE MENÚ ANTICIPADO (${menu.reduce((a:any,c:any)=>a+c.quantity,0)} Items)</p></div>` : ''}
                        </div>
                        <div style="width: 250px; height: 250px; display: flex; align-items: center; justify-content: center; border-radius: 20px; overflow: hidden;">
                            <img src="${qrDataUrl}" crossorigin="anonymous" style="width: 250px; height: 250px;" />
                        </div>
                    </div>
                </div>
                <div style="background: #f5f5f5; padding: 30px; text-align: center; border-top: 4px solid #000;">
                    <p style="font-size: 20px; color: #333; margin: 0; font-weight: bold;">Este ticket es al portador y válido para ingreso. Presentar directamente en puerta para validación QR.</p>
                </div>
            </div>
        `;
        document.body.appendChild(ticketElement);
        await new Promise(resolve => setTimeout(resolve, 1500)); 
        const canvas = await html2canvas(ticketElement, { scale: 1, useCORS: true, allowTaint: true });
        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
        document.body.removeChild(ticketElement);

        let ticketPublicUrl = null;
        if (blob) {
            const fileName = `ticket-show-${codigoFinal}-${Date.now()}.png`;
            const { error: uploadError } = await supabase.storage.from('tickets').upload(fileName, blob, { contentType: 'image/png', upsert: true });
            if (!uploadError) {
                const { data } = supabase.storage.from('tickets').getPublicUrl(fileName);
                ticketPublicUrl = data.publicUrl;
            }
        }

        const customMessage = `Hola ${reserva.name} 👋,\n\n¡Tu compra de entradas en *Boulevard Zapallar* está CONFIRMADA! 🥂\n\n🔑 *CÓDIGO DE ACCESO: ${codigoFinal}*\n\n📅 Fecha: ${reserva.date_reserva}\n👥 Tickets comprados: ${reserva.guests}\n\n👇 *IMPORTANTE: TICKET DE INGRESO*\nEste código QR es tu pase de entrada. Por favor muéstralo en recepción para ser escaneado.\n\n¡Te esperamos!`;

        const response = await fetch("/api/admin/confirmar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                reservaId: reserva.id, 
                ticketUrl: ticketPublicUrl, 
                reservation_code: codigoFinal, 
                phone: reserva.phone,
                customMessage: customMessage
            }),
        });

        const result = await response.json();
        if (response.ok && result.success) { alert(`✅ ENTRADA SHOW generada.\nWhatsApp enviado con éxito.`); fetchData(); } 
        else { alert("⚠️ Error al conectar con API de WhatsApp: " + (result.error || "Desconocido")); fetchData(); }
    } catch (error: any) { alert("Error crítico al generar ticket E-Pass: " + error.message); } finally { setProcessingId(null); }
  };

  // --- FUNCIÓN PARA ENVIAR GIFT CARD DE CUMPLEAÑOS AUTOMÁTICA ---
  const handleSendBirthdayGift = async (cliente: any) => {
      if (!confirm(`¿Enviar Gift Card de 2 Pisco Sour a ${cliente.nombre} por WhatsApp?`)) return;
      setSendingGiftId(cliente.id);
      
      try {
          const giftCode = `BZ-GIFT-${Math.floor(1000 + Math.random() * 9000)}`;
          const origin = typeof window !== 'undefined' ? window.location.origin : 'https://bzweb.vercel.app';
          
          // RUTA CORREGIDA: Apuntando a /admin/validar-ticket/ para evitar el 404
          const qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${origin}/admin/validar-ticket/gift-${cliente.id}`;

          const giftElement = document.createElement("div");
          giftElement.style.cssText = "position:fixed; top:-9999px; left:-9999px; width:800px; height:1200px; font-family: 'Arial', sans-serif; color: white; text-align: center; background: #0a0a0a;";
          giftElement.innerHTML = `
              <div style="width: 100%; height: 100%; display: flex; flex-direction: column; border: 15px solid #DAA520; box-sizing: border-box; position: relative;">
                  <div style="padding: 60px 20px; background: #000;">
                      <h1 style="font-size: 60px; margin: 0; color: #DAA520; letter-spacing: 8px; font-weight: 900;">¡FELIZ CUMPLEAÑOS!</h1>
                      <h2 style="font-size: 45px; margin: 20px 0 0 0; text-transform: uppercase;">${cliente.nombre}</h2>
                  </div>
                  <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; background: #111;">
                      <p style="font-size: 30px; color: #ccc; margin-bottom: 20px;">Boulevard Zapallar te regala:</p>
                      <div style="background: #DAA520; color: black; padding: 30px 60px; border-radius: 20px; font-size: 50px; font-weight: 900; margin-bottom: 50px; box-shadow: 0 10px 30px rgba(218,165,32,0.3);">
                          🍸 2X PISCO SOUR
                      </div>
                      <div style="background: white; padding: 25px; border-radius: 20px;">
                          <img src="${qrDataUrl}" crossorigin="anonymous" style="width: 300px; height: 300px;" />
                      </div>
                      <p style="font-size: 35px; font-weight: bold; color: #DAA520; margin-top: 30px; letter-spacing: 5px;">${giftCode}</p>
                  </div>
                  <div style="background: #000; padding: 30px; border-top: 2px dashed #DAA520;">
                      <p style="font-size: 20px; color: #888; margin: 0;">Presenta este código QR en barra. Válido por 15 días.</p>
                  </div>
              </div>
          `;
          document.body.appendChild(giftElement);
          await new Promise(resolve => setTimeout(resolve, 1500)); // Esperar carga del QR
          
          const canvas = await html2canvas(giftElement, { scale: 1, useCORS: true, allowTaint: true });
          const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
          document.body.removeChild(giftElement);

          let giftUrl = null;
          if (blob) {
              const fileName = `gift-${cliente.id}-${Date.now()}.png`;
              const { error: uploadError } = await supabase.storage.from('tickets').upload(fileName, blob, { contentType: 'image/png', upsert: true });
              if (!uploadError) {
                  const { data } = supabase.storage.from('tickets').getPublicUrl(fileName);
                  giftUrl = data.publicUrl;
              }
          }

          const res = await fetch("/api/admin/enviar-regalo", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                  phone: cliente.whatsapp, 
                  imageUrl: giftUrl, 
                  message: `¡Feliz cumpleaños ${cliente.nombre}! 🎂🎉\n\nDe parte de todo el equipo de *Boulevard Zapallar* te enviamos esta *Gift Card válida por 2 Pisco Sour* 🍹🍹 para celebrar tu día.\n\nSimplemente muestra la imagen adjunta en barra para validarla.\n\n¡Te esperamos!`
              })
          });

          const result = await res.json();
          if (result.success) {
              alert("✅ Gift Card enviada exitosamente por WhatsApp.");
          } else {
              alert("⚠️ Error al enviar el regalo: " + result.error);
          }
      } catch (error) {
          console.error(error);
          alert("Error crítico al generar Gift Card.");
      } finally {
          setSendingGiftId(null);
      }
  };

  const handleManualCheckIn = async (reservaId: number) => {
      if(!confirm("¿Registrar el ingreso del cliente (Escanear Entrada)?")) return;
      await supabase.from('reservas').update({ status: 'realizado', check_in_time: new Date().toISOString() }).eq('id', reservaId);
      fetchData();
  };
  const handleDeleteReserva = async (id: number) => {
      if(confirm("¿ELIMINAR ESTE REGISTRO? Esta acción es irreversible.")) { await supabase.from('reservas').delete().eq('id', id); fetchData(); }
  };

  // Filtros aplicados sobre Reservas de Mesa (Excluye Tickets)
  const filteredReservasMesa = reservasNormalesOnly.filter(r => {
      const searchLower = reservaSearch.toLowerCase();
      const codeMatch = (r.reservation_code || r.code || "").toLowerCase().includes(searchLower);
      const matchText = (r.name || "").toLowerCase().includes(searchLower) || codeMatch || (r.email || "").toLowerCase().includes(searchLower);
      const matchStatus = reservaFilterStatus === "todos" ? true : reservaFilterStatus === "pendientes" ? r.status === "pendiente" : reservaFilterStatus === "confirmadas" ? r.status === "confirmada" : r.status === reservaFilterStatus;
      const matchDate = reservaDateFilter ? r.date_reserva === reservaDateFilter : true;
      return matchText && matchStatus && matchDate;
  });

  // Filtros aplicados sobre Ventas Show (Tickets)
  const filteredReservasShow = reservasTicketsOnly.filter(r => {
    const searchLower = reservaSearch.toLowerCase();
    const codeMatch = (r.reservation_code || r.code || "").toLowerCase().includes(searchLower);
    const matchText = (r.name || "").toLowerCase().includes(searchLower) || codeMatch || (r.email || "").toLowerCase().includes(searchLower);
    const matchStatus = reservaFilterStatus === "todos" ? true : reservaFilterStatus === "pendientes" ? r.status === "pendiente" : reservaFilterStatus === "confirmadas" ? r.status === "confirmada" : r.status === reservaFilterStatus;
    const matchDate = reservaDateFilter ? r.date_reserva === reservaDateFilter : true;
    return matchText && matchStatus && matchDate;
  });

  const updateSolicitudStatus = async (id: number, status: string) => { await supabase.from('solicitudes').update({ status }).eq('id', id); fetchData(); };

  // --- BOTONES DE CONTACTO DIRECTO ---
  const openWhatsApp = (phone: string, msg: string) => {
      if(!phone) return;
      const cleanPhone = phone.replace(/\D/g, '');
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };
  const openMail = (email: string, subject: string) => {
      window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}`, '_blank');
  };
  
  const getBirthdays = () => {
      if (!birthdayFilterDate) return [];
      const filterDate = new Date(birthdayFilterDate);
      const filterMonth = filterDate.getMonth();
      const filterDay = filterDate.getDate() + 1;

      return clientes.filter(c => {
          if (!c.fecha_nacimiento) return false;
          const dParts = c.fecha_nacimiento.split('-');
          const dMonth = parseInt(dParts[1]) - 1;
          const dDay = parseInt(dParts[2]);
          return dMonth === filterMonth && dDay === filterDay;
      });
  };
  const birthdays = getBirthdays();

  return (
    <div className={`min-h-screen bg-black text-white flex ${montserrat.className}`}>
      
      {/* SIDEBAR */}
      <aside className="fixed left-0 top-0 h-full w-20 md:w-64 bg-zinc-900 border-r border-white/10 z-40 flex flex-col items-center md:items-start py-6 transition-all overflow-hidden hover:overflow-y-auto">
        <div className="px-0 md:px-6 mb-8 w-full flex justify-center md:justify-start shrink-0">
            <div className="relative w-32 h-12">
                <Image src="/logo.png" alt="BZ Logo" fill className="object-contain" priority />
            </div>
        </div>
        <nav className="flex-1 w-full space-y-1.5 px-2 overflow-y-auto custom-scrollbar pb-10">
            {TABS.filter((tab) => {
                // El cajero solo puede ver estas 3 secciones
                if (isCajero) {
                    return ['ventas_show', 'reservas', 'pagos_web'].includes(tab.id);
                }
                // Si no es cajero (es admin), ve todo el menú
                return true;
            }).map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center justify-center md:justify-start gap-3 p-3 rounded-xl transition-all ${activeTab === tab.id ? 'bg-[#DAA520] text-black font-bold shadow-lg' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}
                >
                    <tab.icon className="w-5 h-5 shrink-0" />
                    <span className="hidden md:block text-xs uppercase tracking-wide truncate">{tab.label}</span>
                </button>
            ))}
        </nav>
        <div className="p-2 w-full mt-auto shrink-0 bg-zinc-900 pt-2 border-t border-white/10">
            <Link href="/" className="flex items-center justify-center md:justify-start gap-3 p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors">
                <LogOut className="w-5 h-5 shrink-0" />
                <span className="hidden md:block text-xs font-bold uppercase tracking-wider">Cerrar Sesión</span>
            </Link>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 ml-20 md:ml-64 p-4 md:p-8 bg-black min-h-screen w-[calc(100%-5rem)] md:w-[calc(100%-16rem)]">
        <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
            <div>
                <h1 className="text-2xl font-bold text-white uppercase tracking-wide">{TABS.find(t => t.id === activeTab)?.label}</h1>
                <p className="text-xs text-zinc-500">Panel de Administración BZ</p>
            </div>
            <div className="flex items-center gap-4 self-end md:self-auto">
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
            {/* 1. VISTA RESUMEN (BLOQUEADO PARA CAJERO) */}
            {activeTab === "resumen" && !isCajero && (
                <motion.div key="resumen" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {[
                            { title: "Reservas Totales", value: reservasNormalesOnly.length, color: "bg-blue-500" },
                            { title: "Entradas Show (Vendidas)", value: reservasTicketsOnly.length, color: "bg-purple-500" },
                            { title: "Ingresos Global", value: `$${totalIngresosGlobal.toLocaleString('es-CL')}`, color: "bg-green-500" },
                            { title: "Clientes Total CRM", value: clientes.length, color: "bg-[#DAA520]" },
                        ].map((stat, i) => (
                            <div key={i} className="bg-zinc-900 border border-white/5 p-4 md:p-5 rounded-2xl shadow-lg flex flex-col justify-center">
                                <div className={`w-2 h-2 rounded-full mb-2 md:mb-3 ${stat.color}`} />
                                <p className="text-xl md:text-2xl font-black text-white break-words">{stat.value}</p>
                                <p className="text-[10px] md:text-xs text-zinc-500 uppercase font-bold">{stat.title}</p>
                            </div>
                        ))}
                    </div>
                    <div className="bg-zinc-900 border border-white/5 rounded-3xl p-4 md:p-6 overflow-x-auto">
                        <h3 className="text-lg font-bold mb-4">Últimas Interacciones (Web)</h3>
                        <div className="space-y-3 min-w-[300px]">
                            {reservas.length === 0 ? <p className="text-zinc-500 text-sm">No hay actividad reciente.</p> : reservas.slice(0, 5).map(res => (
                                <div key={res.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5 gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                                            {getTicketDetails(res.pre_order).hasTickets ? <Ticket className="w-4 h-4 text-purple-400"/> : <CheckCircle className="w-4 h-4 text-blue-400"/>}
                                        </div>
                                        <div>
                                            <p className="text-xs text-white font-bold">{res.name}</p>
                                            <p className="text-[10px] text-zinc-500">{formatDateSafe(res.date_reserva)} • {getTicketDetails(res.pre_order).hasTickets ? 'Venta Entrada' : 'Reserva Mesa'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 self-end sm:self-auto">
                                        {res.total_pre_order > 0 && (
                                            <span className="text-[9px] font-bold text-[#DAA520] bg-[#DAA520]/10 px-2 py-1 rounded-full flex items-center gap-1">
                                                <DollarSign className="w-3 h-3"/> Pagó Web
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

            {/* 1.5 NUEVO: VENTAS SHOW (PERMITIDO PARA CAJERO) */}
            {activeTab === "ventas_show" && (
                <motion.div key="ventas_show" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h2 className="text-xl font-black text-white flex items-center gap-2"><Ticket className="w-6 h-6 text-purple-500"/> Entradas Show y Eventos</h2>
                            <p className="text-xs text-zinc-400">Administra únicamente las ventas de entradas, genera pases E-Ticket y envíalos.</p>
                        </div>
                        <button onClick={() => { setIsVentaPuertaModalOpen(true); setSelectedFile(null); }} className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase flex items-center gap-2 transition-all shadow-lg">
                            <Plus className="w-4 h-4" /> Vender en Puerta
                        </button>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 shrink-0">
                        <div className="bg-zinc-900 border border-white/5 p-4 rounded-2xl flex flex-col justify-center">
                            <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Entradas Vendidas Web</span>
                            <span className="text-2xl md:text-3xl font-bold text-white mt-1">{reservasTicketsOnly.length}</span>
                        </div>
                        <div className="bg-zinc-900 border border-yellow-500/20 p-4 rounded-2xl flex flex-col justify-center relative overflow-hidden">
                            <div className="absolute right-0 top-0 p-3 opacity-10"><AlertCircle className="w-12 h-12 text-yellow-500"/></div>
                            <span className="text-yellow-500 text-[10px] font-bold uppercase tracking-wider">Por Enviar Ticket</span>
                            <span className="text-2xl md:text-3xl font-bold text-white mt-1">{reservasTicketsOnly.filter(r => r.status === 'pendiente').length}</span>
                        </div>
                        <div className="bg-zinc-900 border border-purple-500/20 p-4 rounded-2xl flex flex-col justify-center relative overflow-hidden">
                            <div className="absolute right-0 top-0 p-3 opacity-10"><Ticket className="w-12 h-12 text-purple-500"/></div>
                            <span className="text-purple-500 text-[10px] font-bold uppercase tracking-wider">Tickets Enviados</span>
                            <span className="text-2xl md:text-3xl font-bold text-white mt-1">{reservasTicketsOnly.filter(r => r.status === 'confirmada').length}</span>
                        </div>
                        <div className="bg-green-600/10 border border-green-500/50 p-4 rounded-2xl flex flex-col justify-center relative overflow-hidden shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                            <div className="absolute right-0 top-0 p-3 opacity-20"><QrCode className="w-12 h-12 text-green-400"/></div>
                            <span className="text-green-400 text-[10px] font-bold uppercase tracking-wider">ESCANEADOS (En Local)</span>
                            <span className="text-2xl md:text-3xl font-black text-white mt-1">{reservasTicketsOnly.filter(r => r.status === 'realizado' || r.status === 'ingresado').length}</span>
                        </div>
                    </div>

                    <div className="bg-zinc-900 border border-white/10 p-4 rounded-2xl mb-6 flex flex-col xl:flex-row gap-4 justify-between items-center sticky top-0 z-30 shadow-2xl shrink-0">
                        <div className="relative w-full xl:w-1/3 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-purple-500 transition-colors" />
                            <input type="text" placeholder="Buscar comprador o ticket..." className="w-full bg-black border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-purple-500 transition-colors" value={reservaSearch} onChange={(e) => setReservaSearch(e.target.value)} />
                        </div>
                        <div className="flex gap-2 overflow-x-auto w-full xl:w-auto pb-2 xl:pb-0 custom-scrollbar snap-x">
                            {[{ id: 'todos', label: 'Todos' }, { id: 'pendientes', label: 'Por Enviar' }, { id: 'confirmadas', label: 'Enviados' }, { id: 'realizado', label: 'Escaneados' }].map(filter => (
                                <button key={filter.id} onClick={() => setReservaFilterStatus(filter.id)} className={`snap-start px-4 py-2.5 rounded-xl text-xs font-bold uppercase whitespace-nowrap transition-all border ${reservaFilterStatus === filter.id ? 'bg-purple-600 text-white border-purple-500 shadow-lg scale-105' : 'bg-black text-zinc-400 border-white/10 hover:bg-white/5'}`}>{filter.label}</button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden flex-1 min-h-[500px] flex flex-col">
                        <div className="overflow-x-auto custom-scrollbar flex-1">
                            <table className="w-full text-left text-sm text-zinc-400">
                                <thead className="bg-black/80 text-zinc-500 text-[10px] uppercase font-bold tracking-wider sticky top-0 z-20 backdrop-blur-md">
                                    <tr>
                                        <th className="px-4 py-4 whitespace-nowrap">Código Ticket</th>
                                        <th className="px-4 py-4 min-w-[150px]">Comprador</th>
                                        <th className="px-4 py-4">Detalle Compra</th>
                                        <th className="px-4 py-4 text-center">Estado</th>
                                        <th className="px-4 py-4 text-right">Controles Ticket</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredReservasShow.length === 0 ? (
                                        <tr><td colSpan={5} className="px-6 py-20 text-center"><Ticket className="w-8 h-8 text-zinc-700 mx-auto mb-2"/><span className="text-zinc-500 font-medium">No hay venta de entradas recientes.</span></td></tr>
                                    ) : (
                                        filteredReservasShow.map((res) => {
                                            const { tickets, menu } = getTicketDetails(res.pre_order);
                                            return (
                                            <tr key={res.id} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-4 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-mono font-black text-purple-400 tracking-widest text-xs bg-purple-900/20 px-2 py-0.5 rounded w-fit border border-purple-500/20">{res.reservation_code || res.code || "TKT-PEND"}</span>
                                                        <span className="text-white font-bold flex items-center gap-1.5 mt-1"><Clock className="w-3 h-3 text-zinc-500"/> Show: {res.date_reserva}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-white text-sm truncate">{res.name}</span>
                                                        <span className="text-xs text-zinc-500 mt-0.5 truncate">{res.phone}</span>
                                                        <span className="text-[10px] text-zinc-600 mt-1 flex items-center gap-1"><Mail className="w-3 h-3"/> {res.email || 'Sin mail'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        {tickets.map((t:any, i:number) => (
                                                            <span key={i} className="text-xs font-bold text-white"><span className="text-purple-400">{t.quantity}x</span> {t.name}</span>
                                                        ))}
                                                        {menu.length > 0 && <span className="text-[10px] text-[#DAA520] font-bold uppercase mt-1">+ {menu.reduce((a:any,c:any)=>a+c.quantity,0)} Items de Menú Anticipado</span>}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    {res.status === 'pendiente' && <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-full text-[10px] font-bold uppercase"><div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"/> Por Enviar</span>}
                                                    {res.status === 'confirmada' && <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-[10px] font-bold uppercase"><CheckCircle className="w-3 h-3"/> APROBADO</span>}
                                                    {(res.status === 'realizado' || res.status === 'ingresado') && <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[10px] font-bold uppercase"><QrCode className="w-3 h-3"/> Escaneado Local</span>}
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <div className="flex flex-wrap justify-end gap-2 items-center">
                                                        {res.status === 'pendiente' && (
                                                            <button onClick={() => handleConfirmShowTicket(res)} disabled={processingId === res.id} className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-all text-xs font-bold uppercase shadow-lg shadow-green-900/20">
                                                                {processingId === res.id ? <Loader2 className="w-3 h-3 animate-spin"/> : <CheckCircle className="w-3 h-3"/>} <span className="hidden xl:inline">Aprobar</span>
                                                            </button>
                                                        )}
                                                        {res.status === 'confirmada' && (
                                                            <button onClick={() => handleManualCheckIn(res.id)} className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all text-xs font-bold uppercase shadow-lg">
                                                                <QrCode className="w-3 h-3"/> <span className="hidden xl:inline">ESCANEAR / INGRESAR</span>
                                                            </button>
                                                        )}
                                                        <button onClick={() => handleDeleteReserva(res.id)} className="p-2 bg-zinc-800 hover:bg-red-500/20 text-zinc-500 hover:text-red-500 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                                                    </div>
                                                </td>
                                            </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* 2. GESTIÓN DE RESERVAS DE MESA (PERMITIDO PARA CAJERO) */}
            {activeTab === "reservas" && (
                <motion.div key="reservas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h2 className="text-xl font-black text-white flex items-center gap-2"><Calendar className="w-6 h-6 text-blue-400"/> Reservas de Mesa Normales</h2>
                            <p className="text-xs text-zinc-400">Panel para gestionar ubicaciones y pedidos web de comida sin tickets asociados.</p>
                        </div>
                        <button onClick={() => handleResetTable('reservas', 'Reservas')} className="bg-red-900/30 text-red-500 border border-red-500/50 hover:bg-red-600 hover:text-white px-4 py-2 rounded-xl text-xs font-bold uppercase flex items-center gap-2 transition-all">
                            <Trash2 className="w-4 h-4" /> Resetear Reservas
                        </button>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 shrink-0">
                        <div className="bg-zinc-900 border border-white/5 p-4 rounded-2xl flex flex-col justify-center">
                            <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Total Reservas</span>
                            <span className="text-2xl md:text-3xl font-bold text-white mt-1">{reservasNormalesOnly.length}</span>
                        </div>
                        <div className="bg-zinc-900 border border-yellow-500/20 p-4 rounded-2xl flex flex-col justify-center relative overflow-hidden">
                            <div className="absolute right-0 top-0 p-3 opacity-10"><AlertCircle className="w-12 h-12 text-yellow-500"/></div>
                            <span className="text-yellow-500 text-[10px] font-bold uppercase tracking-wider">Pendientes</span>
                            <span className="text-2xl md:text-3xl font-bold text-white mt-1">{reservasNormalesOnly.filter(r => r.status === 'pendiente').length}</span>
                        </div>
                        <div className="bg-zinc-900 border border-green-500/20 p-4 rounded-2xl flex flex-col justify-center relative overflow-hidden">
                            <div className="absolute right-0 top-0 p-3 opacity-10"><CheckCircle className="w-12 h-12 text-green-500"/></div>
                            <span className="text-green-500 text-[10px] font-bold uppercase tracking-wider">Confirmados</span>
                            <span className="text-2xl md:text-3xl font-bold text-white mt-1">{reservasNormalesOnly.filter(r => r.status === 'confirmada').length}</span>
                        </div>
                        <div className="bg-blue-600/10 border border-blue-500/50 p-4 rounded-2xl flex flex-col justify-center relative overflow-hidden shadow-[0_0_15px_rgba(37,99,235,0.2)]">
                            <div className="absolute right-0 top-0 p-3 opacity-20"><UserCheck className="w-12 h-12 text-blue-400"/></div>
                            <span className="text-blue-400 text-[10px] font-bold uppercase tracking-wider">EN LOCAL</span>
                            <span className="text-2xl md:text-3xl font-black text-white mt-1">{reservasNormalesOnly.filter(r => r.status === 'realizado' || r.status === 'ingresado').length}</span>
                        </div>
                    </div>

                    <div className="bg-zinc-900 border border-white/10 p-4 rounded-2xl mb-6 flex flex-col xl:flex-row gap-4 justify-between items-center sticky top-0 z-30 shadow-2xl shrink-0">
                        <div className="relative w-full xl:w-1/3 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-[#DAA520] transition-colors" />
                            <input type="text" placeholder="Buscar reserva..." className="w-full bg-black border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-[#DAA520] transition-colors" value={reservaSearch} onChange={(e) => setReservaSearch(e.target.value)} />
                        </div>
                        <div className="flex gap-2 overflow-x-auto w-full xl:w-auto pb-2 xl:pb-0 custom-scrollbar snap-x">
                            {[{ id: 'todos', label: 'Todos' }, { id: 'pendientes', label: 'Pendientes' }, { id: 'confirmadas', label: 'Confirmadas' }, { id: 'realizado', label: 'Ingresados' }].map(filter => (
                                <button key={filter.id} onClick={() => setReservaFilterStatus(filter.id)} className={`snap-start px-4 py-2.5 rounded-xl text-xs font-bold uppercase whitespace-nowrap transition-all border ${reservaFilterStatus === filter.id ? 'bg-[#DAA520] text-black border-[#DAA520] shadow-lg scale-105' : 'bg-black text-zinc-400 border-white/10 hover:bg-white/5'}`}>{filter.label}</button>
                            ))}
                        </div>
                        <input type="date" className="w-full xl:w-auto bg-black border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#DAA520] scheme-dark font-bold uppercase tracking-wider" value={reservaDateFilter} onChange={(e) => setReservaDateFilter(e.target.value)} />
                    </div>

                    <div className="bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden flex-1 min-h-[500px] flex flex-col">
                        <div className="overflow-x-auto custom-scrollbar flex-1">
                            <table className="w-full text-left text-sm text-zinc-400">
                                <thead className="bg-black/80 text-zinc-500 text-[10px] uppercase font-bold tracking-wider sticky top-0 z-20 backdrop-blur-md">
                                    <tr>
                                        <th className="px-4 py-4 whitespace-nowrap">Código / Hora</th>
                                        <th className="px-4 py-4 min-w-[150px]">Cliente</th>
                                        <th className="px-4 py-4 text-center">Pax</th>
                                        <th className="px-4 py-4 text-center">Estado</th>
                                        <th className="px-4 py-4 text-center">Consumo Web</th>
                                        <th className="px-4 py-4 text-right">Controles</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredReservasMesa.length === 0 ? (
                                        <tr><td colSpan={6} className="px-6 py-20 text-center"><Search className="w-8 h-8 text-zinc-700 mx-auto mb-2"/><span className="text-zinc-500 font-medium">No hay reservas de mesa que coincidan.</span></td></tr>
                                    ) : (
                                        filteredReservasMesa.map((res) => (
                                            <tr key={res.id} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-4 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-mono font-black text-[#DAA520] tracking-widest text-xs bg-[#DAA520]/10 px-2 py-0.5 rounded w-fit border border-[#DAA520]/20">{res.reservation_code || res.code || "SIN-CODIGO"}</span>
                                                        <span className="text-white font-bold flex items-center gap-1.5 mt-1"><Clock className="w-3 h-3 text-zinc-500"/> {res.time_reserva}</span>
                                                        <span className="text-[10px] text-zinc-500 font-medium uppercase">{formatDateSafe(res.date_reserva)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-white text-sm truncate">{res.name}</span>
                                                        <span className="text-xs text-zinc-500 mt-0.5 truncate">{res.phone}</span>
                                                        <span className="text-[10px] text-zinc-600 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3"/> {res.zone || "General"}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-800 text-white font-bold text-xs border border-white/5">{res.guests}</div>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    {res.status === 'pendiente' && <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-full text-[10px] font-bold uppercase"><div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"/> Pendiente</span>}
                                                    {res.status === 'confirmada' && <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-500 border border-green-500/20 rounded-full text-[10px] font-bold uppercase"><CheckCircle className="w-3 h-3"/> Confirmada</span>}
                                                    {(res.status === 'realizado' || res.status === 'ingresado') && <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[10px] font-bold uppercase"><QrCode className="w-3 h-3"/> Ingresado</span>}
                                                    {res.status === 'rechazada' && <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full text-[10px] font-bold uppercase"><X className="w-3 h-3"/> Cancelada</span>}
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    {res.total_pre_order > 0 ? (
                                                        <div className="flex flex-col items-center gap-1">
                                                            <span className="text-green-400 font-bold text-xs bg-green-900/20 px-2 py-0.5 rounded border border-green-500/20">${res.total_pre_order.toLocaleString()}</span>
                                                            <span className="text-[9px] text-zinc-500 font-medium">{res.pre_order?.length} prod.</span>
                                                        </div>
                                                    ) : <span className="text-zinc-700 font-bold">·</span>}
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <div className="flex flex-wrap justify-end gap-2 items-center">
                                                        {res.status === 'pendiente' && (
                                                            <button onClick={() => handleConfirmReservation(res)} disabled={processingId === res.id} className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-all text-xs font-bold uppercase">
                                                                {processingId === res.id ? <Loader2 className="w-3 h-3 animate-spin"/> : <CheckCircle className="w-3 h-3"/>} <span className="hidden xl:inline">Aprobar</span>
                                                            </button>
                                                        )}
                                                        {res.status === 'confirmada' && (
                                                            <button onClick={() => handleManualCheckIn(res.id)} className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all text-xs font-bold uppercase">
                                                                <UserCheck className="w-3 h-3"/> <span className="hidden xl:inline">INGRESO</span>
                                                            </button>
                                                        )}
                                                        <button onClick={() => handleDeleteReserva(res.id)} className="p-2 bg-zinc-800 hover:bg-red-500/20 text-zinc-500 hover:text-red-500 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* 3. PAGOS WEB (PERMITIDO PARA CAJERO) */}
            {activeTab === "pagos_web" && (
                <motion.div key="pagos_web" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                     <div className="flex justify-end mb-4 gap-2">
                         <button onClick={() => { setIsAddPaymentModalOpen(true); setSelectedFile(null); }} className="bg-[#DAA520] text-black border border-[#DAA520] hover:bg-[#B8860B] px-4 py-2 rounded-xl text-xs font-bold uppercase flex items-center gap-2 transition-all shadow-lg">
                             <Plus className="w-4 h-4" /> Añadir Pago Manual
                         </button>
                         <button onClick={() => handleResetTable('reservas', 'Pagos y Reservas Web')} className="bg-red-900/30 text-red-500 border border-red-500/50 hover:bg-red-600 hover:text-white px-4 py-2 rounded-xl text-xs font-bold uppercase flex items-center gap-2 transition-all">
                             <Trash2 className="w-4 h-4" /> Resetear Todo
                         </button>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-zinc-900 border border-green-500/20 p-5 rounded-2xl relative overflow-hidden">
                            <div className="absolute right-0 top-0 p-4 opacity-10"><CheckCircle className="w-20 h-20 text-green-500"/></div>
                            <p className="text-xs text-zinc-500 uppercase font-bold">Total Aprobado Web</p>
                            <h2 className="text-2xl lg:text-3xl font-black text-white mt-1">${totalWebApproved.toLocaleString('es-CL')}</h2>
                        </div>
                        <div className="bg-zinc-900 border border-yellow-500/20 p-5 rounded-2xl relative overflow-hidden">
                            <div className="absolute right-0 top-0 p-4 opacity-10"><Clock className="w-20 h-20 text-yellow-500"/></div>
                            <p className="text-xs text-zinc-500 uppercase font-bold">Pendientes</p>
                            <h2 className="text-2xl lg:text-3xl font-black text-yellow-500 mt-1">${totalWebPending.toLocaleString('es-CL')}</h2>
                        </div>
                        <div className="bg-zinc-900 border border-white/10 p-5 rounded-2xl flex items-center justify-center">
                            <button onClick={fetchData} className="flex flex-col items-center gap-2 text-zinc-400 hover:text-white transition-colors">
                                <RefreshCw className="w-6 h-6"/> <span className="text-xs font-bold uppercase">Actualizar</span>
                            </button>
                        </div>
                     </div>

                     <div className="bg-zinc-900 border border-white/5 rounded-3xl p-4 lg:p-6 min-h-[500px] flex flex-col overflow-hidden">
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                            <h3 className="text-lg font-bold flex items-center gap-2"><Globe className="w-5 h-5 text-blue-400"/> Libro de Transacciones Web</h3>
                            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                                <div className="flex gap-2 overflow-x-auto custom-scrollbar snap-x">
                                    {[{ id: 'todos', label: 'Todos' }, { id: 'getnet', label: 'Getnet' }, { id: 'transferencia', label: 'Transf.' }, { id: 'puerta', label: 'Puerta' }, { id: 'manual', label: 'Manual' }].map(filter => (
                                        <button key={filter.id} onClick={() => setPaymentMethodFilter(filter.id)} className={`snap-start px-4 py-2 rounded-xl text-xs font-bold uppercase whitespace-nowrap transition-all border ${paymentMethodFilter === filter.id ? 'bg-blue-600 text-white border-blue-500 shadow-lg' : 'bg-black text-zinc-400 border-white/10 hover:bg-white/5'}`}>{filter.label}</button>
                                    ))}
                                </div>
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <input type="text" placeholder="Buscar cliente o ref..." className="w-full bg-black border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs text-white outline-none focus:border-blue-500" value={webPaymentSearch} onChange={e => setWebPaymentSearch(e.target.value)} />
                                </div>
                            </div>
                        </div>
                        <div className="overflow-x-auto custom-scrollbar flex-1">
                            <table className="w-full text-left text-sm text-zinc-400">
                                <thead className="text-[10px] uppercase font-bold tracking-wider bg-black/40 text-zinc-500 sticky top-0 backdrop-blur-sm z-10">
                                    <tr>
                                        <th className="px-4 py-3 whitespace-nowrap">Ref / Fecha</th>
                                        <th className="px-4 py-3 min-w-[120px]">Cliente</th>
                                        <th className="px-4 py-3">Detalle Compra</th>
                                        <th className="px-4 py-3 text-center">Método Pago</th>
                                        <th className="px-4 py-3 text-right">Monto</th>
                                        <th className="px-4 py-3 text-right">Estado / Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {webPayments.length === 0 ? <tr className="text-center"><td colSpan={6} className="py-10 text-zinc-500">No hay pagos que coincidan con la búsqueda.</td></tr> : webPayments.map((p) => (
                                        <tr key={p.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-4 py-3">
                                                <p className="font-mono text-xs text-zinc-300">{p.ref_getnet}</p>
                                                <p className="text-[10px] text-zinc-600">{new Date(p.fecha).toLocaleString()}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="font-bold text-white text-xs truncate">{p.cliente}</p>
                                                {p.email && <p className="text-[9px] text-zinc-500 truncate">{p.email}</p>}
                                            </td>
                                            <td className="px-4 py-3 text-xs font-bold text-white">
                                                {p.detalle}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold ${p.metodo === 'GETNET' ? 'bg-red-900/30 text-red-400' : p.metodo === 'PUERTA' ? 'bg-purple-900/30 text-purple-400' : 'bg-zinc-800 text-zinc-300'}`}>{p.metodo}</span>
                                                    {p.comprobante_url && (
                                                        <button onClick={() => { setCurrentComprobanteUrl(p.comprobante_url); setIsComprobanteModalOpen(true); }} className="text-[9px] text-blue-400 hover:text-blue-300 flex items-center gap-1 underline mt-1">
                                                            <Eye className="w-3 h-3"/> Comprobante
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right font-black text-green-400">${p.monto.toLocaleString('es-CL')}</td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end gap-2 items-center flex-wrap">
                                                    <button onClick={() => handleOpenBoleta(p)} className="bg-zinc-800 hover:bg-zinc-700 text-white px-2.5 py-2 rounded-lg text-[10px] font-bold uppercase transition-colors flex items-center gap-1">
                                                        <Receipt className="w-3 h-3"/> Boleta
                                                    </button>
                                                    <select 
                                                        className={`bg-zinc-900 text-xs px-3 py-2 rounded-lg outline-none font-bold uppercase border ${p.reserva_obj.status === 'confirmada' ? 'text-green-500 border-green-500/30' : p.reserva_obj.status === 'pendiente' ? 'text-yellow-500 border-yellow-500/30' : 'text-red-500 border-red-500/30'}`}
                                                        value={p.reserva_obj.status}
                                                        onChange={(e) => handleUpdatePaymentStatus(p.reserva_obj.id, e.target.value)}
                                                    >
                                                        <option value="pendiente">Pendiente</option>
                                                        <option value="confirmada">Aprobado</option>
                                                        <option value="rechazada">Rechazado</option>
                                                    </select>
                                                    
                                                    {p.reserva_obj.status === 'confirmada' && (
                                                        <button 
                                                            onClick={() => getTicketDetails(p.reserva_obj.pre_order).hasTickets ? handleConfirmShowTicket(p.reserva_obj) : handleConfirmReservation(p.reserva_obj)} 
                                                            className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-2 rounded-lg text-[10px] font-bold uppercase transition-colors shadow-lg flex items-center gap-1"
                                                        >
                                                            <Send className="w-3 h-3"/> Enviar
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                     </div>
                </motion.div>
            )}

            {/* 4. FINANZAS / ERP AVANZADO (BLOQUEADO PARA CAJERO) */}
            {activeTab === "finanzas" && !isCajero && (
                <motion.div key="finanzas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-wider flex items-center gap-2"><TrendingUp className="w-6 h-6 text-green-500"/> ERP Financiero</h3>
                            <p className="text-xs text-zinc-500 mt-1">Control integral de ingresos, egresos, inventario y tributos.</p>
                        </div>
                        <div className="flex gap-2">
                             <button onClick={() => handleResetTable('ventas_generales', 'Finanzas (Ingresos)')} className="bg-red-900/30 text-red-500 border border-red-500/50 hover:bg-red-600 hover:text-white px-3 py-2 rounded-xl text-[10px] font-bold uppercase flex items-center gap-2 transition-all">
                                 <Trash2 className="w-4 h-4" /> Reset
                             </button>
                            <button onClick={handleOpenVentaModal} className="bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase flex items-center gap-2 hover:bg-green-700 transition-colors shadow-lg">
                                <DollarSign className="w-4 h-4" /> Ingreso Manual (POS)
                            </button>
                        </div>
                    </div>

                    {/* SUB-NAVEGACIÓN ERP */}
                    <div className="flex overflow-x-auto custom-scrollbar gap-2 mb-6 pb-2 border-b border-white/10 shrink-0">
                        {FINANZAS_TABS.map(tab => (
                            <button 
                                key={tab.id} 
                                onClick={() => setActiveFinanzasTab(tab.id)}
                                className={`whitespace-nowrap px-4 py-2 rounded-t-xl text-xs font-bold uppercase transition-all ${activeFinanzasTab === tab.id ? 'bg-white/10 text-white border-b-2 border-[#DAA520]' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* ERP: 4.1 INGRESOS */}
                    {activeFinanzasTab === "ingresos" && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-zinc-900 border border-green-900/30 p-5 rounded-2xl">
                                    <p className="text-[10px] text-zinc-400 uppercase font-bold mb-1">Ingresos Totales (Mes)</p>
                                    <h2 className="text-2xl font-black text-white">${totalIngresosGlobal.toLocaleString('es-CL')}</h2>
                                </div>
                                <div className="bg-zinc-900 border border-white/5 p-5 rounded-2xl">
                                    <p className="text-[10px] text-zinc-400 uppercase font-bold mb-1 flex items-center gap-1"><Banknote className="w-3 h-3 text-green-400"/> Efectivo POS</p>
                                    <h2 className="text-xl font-bold text-white">${ventasEfectivo.toLocaleString('es-CL')}</h2>
                                </div>
                                <div className="bg-zinc-900 border border-white/5 p-5 rounded-2xl">
                                    <p className="text-[10px] text-zinc-400 uppercase font-bold mb-1 flex items-center gap-1"><CreditCard className="w-3 h-3 text-blue-400"/> Débito / Crédito</p>
                                    <h2 className="text-xl font-bold text-white">${(ventasDebito + ventasCredito).toLocaleString('es-CL')}</h2>
                                </div>
                                <div className="bg-zinc-900 border border-white/5 p-5 rounded-2xl">
                                    <p className="text-[10px] text-zinc-400 uppercase font-bold mb-1 flex items-center gap-1"><Globe className="w-3 h-3 text-purple-400"/> Transferencia / Web</p>
                                    <h2 className="text-xl font-bold text-white">${(ventasTransferencia + ingresosPreOrder).toLocaleString('es-CL')}</h2>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-zinc-900 border border-white/5 rounded-3xl p-6 h-[400px] flex flex-col">
                                    <h3 className="text-sm font-bold flex items-center gap-2 mb-4"><Ticket className="w-4 h-4 text-[#DAA520]"/> Rendimiento por Show</h3>
                                    <div className="overflow-y-auto custom-scrollbar flex-1">
                                        <table className="w-full text-left text-xs text-zinc-400">
                                            <thead className="uppercase bg-black/40 sticky top-0 backdrop-blur-sm">
                                                <tr><th>Show</th><th className="text-right">TKT Web</th><th className="text-right">Menú Web</th></tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {showPerformance.map(s => (
                                                    <tr key={s.id}>
                                                        <td className="py-3 text-white font-bold">{s.title}</td>
                                                        <td className="py-3 text-right text-[#DAA520]">${s.recaudacionTickets.toLocaleString()}</td>
                                                        <td className="py-3 text-right text-blue-400">${s.recaudacionComida.toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div className="bg-zinc-900 border border-white/5 rounded-3xl p-6 h-[400px] flex flex-col">
                                    <h3 className="text-sm font-bold flex items-center gap-2 mb-4"><Receipt className="w-4 h-4 text-zinc-400"/> Libro de Ventas POS</h3>
                                    <div className="overflow-y-auto custom-scrollbar flex-1">
                                        <table className="w-full text-left text-xs text-zinc-400">
                                            <thead className="uppercase bg-black/40 sticky top-0 backdrop-blur-sm">
                                                <tr><th>Detalle</th><th>Método</th><th className="text-right">Monto</th><th></th></tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {ventas.map(v => (
                                                    <tr key={v.id}>
                                                        <td className="py-3 text-white truncate max-w-[100px]">{v.descripcion}</td>
                                                        <td className="py-3 uppercase text-[9px]">{v.metodo_pago}</td>
                                                        <td className="py-3 text-right font-bold text-green-400">${v.monto.toLocaleString()}</td>
                                                        <td className="py-3 text-right"><button onClick={() => handleDeleteVenta(v.id)} className="text-zinc-600 hover:text-red-500"><Trash2 className="w-3 h-3"/></button></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ERP: 4.2 COMPRAS */}
                    {activeFinanzasTab === "compras" && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex justify-between items-center">
                                <div><h3 className="font-bold text-lg">Registro de Compras</h3><p className="text-xs text-zinc-500">Proveedores, insumos y mercadería.</p></div>
                                <button onClick={() => openFinanceModal('compras')} className="bg-white text-black px-4 py-2 rounded-xl text-xs font-bold uppercase">+ Nueva Compra</button>
                            </div>
                            <div className="bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm text-zinc-400">
                                        <thead className="bg-black/40 text-[10px] uppercase">
                                            <tr><th className="p-4">Fecha</th><th className="p-4">Proveedor</th><th className="p-4">Descripción</th><th className="p-4">Categoría</th><th className="p-4 text-right">Monto Neto</th><th className="p-4 text-right">Acciones</th></tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {compras.length === 0 ? <tr><td colSpan={6} className="text-center p-10">Sin registros de compras.</td></tr> : compras.map(c => (
                                                <tr key={c.id} className="hover:bg-white/5">
                                                    <td className="p-4">{c.fecha}</td>
                                                    <td className="p-4 font-bold text-white">{c.proveedor}</td>
                                                    <td className="p-4 text-xs">{c.descripcion}</td>
                                                    <td className="p-4"><span className="bg-zinc-800 px-2 py-1 rounded text-[10px] uppercase">{c.categoria}</span></td>
                                                    <td className="p-4 text-right text-red-400 font-bold">${c.monto?.toLocaleString('es-CL')}</td>
                                                    <td className="p-4 text-right"><button onClick={() => openFinanceModal('compras', c)} className="p-1"><Edit2 className="w-4 h-4"/></button><button onClick={() => handleDeleteFinanceRecord('finanzas_compras', c.id)} className="p-1 text-red-500"><Trash2 className="w-4 h-4"/></button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ERP: 4.3 INVENTARIO */}
                    {activeFinanzasTab === "inventario" && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex justify-between items-center">
                                <div><h3 className="font-bold text-lg">Control de Inventario</h3><p className="text-xs text-zinc-500">Cálculo de Costo de Ventas y Mermas.</p></div>
                                <button onClick={() => openFinanceModal('inventario')} className="bg-white text-black px-4 py-2 rounded-xl text-xs font-bold uppercase">+ Registrar Producto</button>
                            </div>
                            <div className="bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm text-zinc-400">
                                        <thead className="bg-black/40 text-[10px] uppercase">
                                            <tr><th className="p-4">Mes</th><th className="p-4">Producto/Ítem</th><th className="p-4 text-center">Inv. Inicial</th><th className="p-4 text-center">Compras</th><th className="p-4 text-center text-red-400">Mermas</th><th className="p-4 text-center">Inv. Final</th><th className="p-4 text-right">Costo de Venta</th><th className="p-4"></th></tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {inventario.length === 0 ? <tr><td colSpan={8} className="text-center p-10">Sin registros de inventario.</td></tr> : inventario.map(i => {
                                                const costoVentaCalculado = (Number(i.inventario_inicial) + Number(i.compras)) - Number(i.inventario_final) - Number(i.mermas);
                                                return (
                                                <tr key={i.id} className="hover:bg-white/5">
                                                    <td className="p-4 font-bold text-white">{i.mes}</td>
                                                    <td className="p-4">{i.producto}</td>
                                                    <td className="p-4 text-center">{i.inventario_inicial}</td>
                                                    <td className="p-4 text-center">{i.compras}</td>
                                                    <td className="p-4 text-center text-red-400">{i.mermas}</td>
                                                    <td className="p-4 text-center font-bold text-white">{i.inventario_final}</td>
                                                    <td className="p-4 text-right text-blue-400 font-bold">${i.costo_total?.toLocaleString('es-CL')} (u: {costoVentaCalculado})</td>
                                                    <td className="p-4 text-right"><button onClick={() => openFinanceModal('inventario', i)} className="p-1"><Edit2 className="w-4 h-4"/></button></td>
                                                </tr>
                                            )})}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ERP: 4.4 GASTOS */}
                    {activeFinanzasTab === "gastos" && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex justify-between items-center">
                                <div><h3 className="font-bold text-lg">Gastos Operativos</h3><p className="text-xs text-zinc-500">Fijos (Arriendo, Luz) y Variables (Marketing, Comisiones).</p></div>
                                <button onClick={() => openFinanceModal('gastos')} className="bg-white text-black px-4 py-2 rounded-xl text-xs font-bold uppercase">+ Registrar Gasto</button>
                            </div>
                            <div className="bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm text-zinc-400">
                                        <thead className="bg-black/40 text-[10px] uppercase">
                                            <tr><th className="p-4">Fecha</th><th className="p-4">Descripción</th><th className="p-4">Tipo</th><th className="p-4">Subtipo</th><th className="p-4 text-right">Monto</th><th className="p-4 text-right">Acciones</th></tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {gastos.length === 0 ? <tr><td colSpan={6} className="text-center p-10">Sin gastos registrados.</td></tr> : gastos.map(g => (
                                                <tr key={g.id} className="hover:bg-white/5">
                                                    <td className="p-4">{g.fecha}</td>
                                                    <td className="p-4 font-bold text-white">{g.descripcion}</td>
                                                    <td className="p-4"><span className={`px-2 py-1 rounded text-[9px] uppercase font-bold ${g.categoria === 'Fijo' ? 'bg-blue-900/30 text-blue-400' : 'bg-orange-900/30 text-orange-400'}`}>{g.categoria}</span></td>
                                                    <td className="p-4 text-xs">{g.subtipo}</td>
                                                    <td className="p-4 text-right text-red-400 font-bold">${g.monto?.toLocaleString('es-CL')}</td>
                                                    <td className="p-4 text-right"><button onClick={() => openFinanceModal('gastos', g)} className="p-1"><Edit2 className="w-4 h-4"/></button><button onClick={() => handleDeleteFinanceRecord('finanzas_gastos', g.id)} className="p-1 text-red-500"><Trash2 className="w-4 h-4"/></button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ERP: 4.5 SUELDOS */}
                    {activeFinanzasTab === "sueldos" && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex justify-between items-center">
                                <div><h3 className="font-bold text-lg flex items-center gap-2"><Briefcase className="w-5 h-5"/> Remuneraciones</h3><p className="text-xs text-zinc-500">Sueldos, bonos y propinas del equipo.</p></div>
                                <button onClick={() => openFinanceModal('trabajadores')} className="bg-white text-black px-4 py-2 rounded-xl text-xs font-bold uppercase">+ Agregar Planilla</button>
                            </div>
                            <div className="bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm text-zinc-400">
                                        <thead className="bg-black/40 text-[10px] uppercase">
                                            <tr><th className="p-4">Mes</th><th className="p-4">Trabajador</th><th className="p-4">Cargo</th><th className="p-4 text-right">Sueldo Base</th><th className="p-4 text-right">H. Extras</th><th className="p-4 text-right text-green-400">Propinas</th><th className="p-4 text-right">Total Pagar</th><th className="p-4 text-right"></th></tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {trabajadores.length === 0 ? <tr><td colSpan={8} className="text-center p-10">Sin planillas registradas.</td></tr> : trabajadores.map(t => {
                                                const totalPagar = Number(t.sueldo_base) + Number(t.horas_extras) + Number(t.propinas);
                                                return (
                                                <tr key={t.id} className="hover:bg-white/5">
                                                    <td className="p-4 font-bold text-white">{t.mes}</td>
                                                    <td className="p-4 font-bold text-white">{t.nombre}</td>
                                                    <td className="p-4 text-xs">{t.cargo}</td>
                                                    <td className="p-4 text-right">${t.sueldo_base?.toLocaleString('es-CL')}</td>
                                                    <td className="p-4 text-right">${t.horas_extras?.toLocaleString('es-CL')}</td>
                                                    <td className="p-4 text-right text-green-400">${t.propinas?.toLocaleString('es-CL')}</td>
                                                    <td className="p-4 text-right text-[#DAA520] font-black">${totalPagar.toLocaleString('es-CL')}</td>
                                                    <td className="p-4 text-right"><button onClick={() => openFinanceModal('trabajadores', t)} className="p-1"><Edit2 className="w-4 h-4"/></button></td>
                                                </tr>
                                            )})}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ERP: 4.6 TRIBUTARIO */}
                    {activeFinanzasTab === "tributario" && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex justify-between items-center">
                                <div><h3 className="font-bold text-lg flex items-center gap-2"><Archive className="w-5 h-5"/> Impuestos y Declaraciones</h3><p className="text-xs text-zinc-500">Control de F29, IVA y F22.</p></div>
                                <button onClick={() => openFinanceModal('tributario')} className="bg-white text-black px-4 py-2 rounded-xl text-xs font-bold uppercase">+ Registro Tributario</button>
                            </div>
                            <div className="bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm text-zinc-400">
                                        <thead className="bg-black/40 text-[10px] uppercase">
                                            <tr><th className="p-4">Periodo</th><th className="p-4">Documento</th><th className="p-4 text-right">Monto a Pagar</th><th className="p-4 text-center">Estado</th><th className="p-4 text-right">Acciones</th></tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {tributario.length === 0 ? <tr><td colSpan={5} className="text-center p-10">No hay registros de impuestos.</td></tr> : tributario.map(t => (
                                                <tr key={t.id} className="hover:bg-white/5">
                                                    <td className="p-4 font-bold text-white">{t.periodo}</td>
                                                    <td className="p-4 uppercase font-mono text-xs">{t.documento}</td>
                                                    <td className="p-4 text-right font-black text-red-400">${t.monto_pagar?.toLocaleString('es-CL')}</td>
                                                    <td className="p-4 text-center">
                                                        <span className={`px-2 py-1 rounded text-[9px] uppercase font-bold ${t.estado === 'pagado' ? 'bg-green-900/30 text-green-400' : 'bg-yellow-900/30 text-yellow-400'}`}>{t.estado}</span>
                                                    </td>
                                                    <td className="p-4 text-right"><button onClick={() => openFinanceModal('tributario', t)} className="p-1"><Edit2 className="w-4 h-4"/></button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            )}

            {/* 5. MENÚ RESERVA / EXPRESS (BLOQUEADO PARA CAJERO) */}
            {activeTab === "menu_express" && !isCajero && (
                <motion.div key="menu_express" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <div>
                            <h3 className="text-lg font-bold">Catálogo de Productos</h3>
                            <p className="text-xs text-zinc-500">Productos disponibles para compra anticipada en la web.</p>
                        </div>
                        <div className="flex gap-2">
                             <button onClick={() => handleResetTable('productos_reserva', 'Catálogo del Menú')} className="bg-red-900/30 text-red-500 border border-red-500/50 hover:bg-red-600 hover:text-white px-4 py-2 rounded-xl text-xs font-bold uppercase flex items-center gap-2 transition-all">
                                 <Trash2 className="w-4 h-4" /> Resetear Menú
                             </button>
                            <button onClick={() => handleOpenMenuModal()} className="bg-[#DAA520] text-black px-4 py-2 rounded-xl text-xs font-bold uppercase flex items-center gap-2 hover:bg-[#B8860B] transition-colors shadow-lg">
                                <Plus className="w-4 h-4" /> Nuevo Producto
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {menuItems.map((item) => (
                            <div key={item.id} className={`group bg-zinc-900 border ${item.active ? 'border-white/10' : 'border-red-900/30 opacity-60'} p-4 rounded-2xl relative transition-all hover:border-[#DAA520]/50 flex flex-col h-full`}>
                                <div className="relative w-full aspect-square bg-black rounded-xl overflow-hidden mb-4 border border-white/5 shrink-0">
                                    <Image src={item.image_url || "/placeholder.jpg"} alt={item.name} fill className="object-cover opacity-90 group-hover:scale-105 transition-transform duration-500" />
                                </div>
                                <div className="relative z-10 flex flex-col flex-1">
                                    <div className="flex justify-between items-start gap-2 mb-1">
                                        <h3 className="text-md font-bold text-white line-clamp-2 leading-tight">{item.name}</h3>
                                        <span className="text-xs font-bold text-[#DAA520] bg-black/50 px-2 py-1 rounded shrink-0">${item.price.toLocaleString()}</span>
                                    </div>
                                    <span className="text-[10px] text-zinc-500 uppercase mb-2 block">{item.category}</span>
                                    <p className="text-xs text-zinc-400 line-clamp-2 min-h-[2.5em] flex-1">{item.description}</p>
                                    <div className="flex justify-between items-center border-t border-white/10 pt-4 mt-4 shrink-0">
                                            <button onClick={() => toggleMenuStatus(item.id, item.active)} className={`text-[10px] font-bold uppercase ${item.active ? 'text-green-500' : 'text-zinc-500'}`}>{item.active ? "Disponible Web" : "Oculto"}</button>
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

            {/* 6. CLIENTES BOULEVARD (BLOQUEADO PARA CAJERO) */}
            {activeTab === "clientes" && !isCajero && (
                <motion.div key="clientes" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* Cumpleaños */}
                        <div className="bg-gradient-to-br from-zinc-900 to-black border border-[#DAA520]/30 p-6 rounded-3xl relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 p-4 opacity-10"><Cake className="w-32 h-32 text-[#DAA520]" /></div>
                            <h3 className="text-lg font-black text-white mb-2 flex items-center gap-2 uppercase tracking-wider"><Gift className="w-5 h-5 text-[#DAA520]"/> Filtro Cumpleañeros</h3>
                            <div className="flex gap-4 items-center mb-6 relative z-10">
                                <input type="date" className="bg-zinc-800 text-white text-xs p-3 rounded-xl border border-white/10 outline-none focus:border-[#DAA520] scheme-dark" value={birthdayFilterDate} onChange={(e) => setBirthdayFilterDate(e.target.value)} />
                                <span className="text-xs text-zinc-400">Revisa quién está de cumpleaños</span>
                            </div>
                            <div className="space-y-3 max-h-40 overflow-y-auto custom-scrollbar pr-2 relative z-10">
                                {birthdays.length > 0 ? birthdays.map(c => (
                                    <div key={c.id} className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-[#DAA520]/20 flex items-center justify-center text-[#DAA520] font-bold"><Cake className="w-4 h-4"/></div>
                                            <div><span className="text-xs font-bold text-white block">{c.nombre}</span><span className="text-[10px] text-zinc-500">{c.whatsapp}</span></div>
                                        </div>
                                        <div className="flex gap-2">
                                            {/* Botón de envío automatizado con QR */}
                                            <button 
                                                onClick={() => handleSendBirthdayGift(c)} 
                                                disabled={sendingGiftId === c.id}
                                                className="bg-[#DAA520]/10 text-[#DAA520] hover:bg-[#DAA520] hover:text-black p-2 rounded-lg transition-colors flex items-center justify-center" 
                                                title="Enviar Gift Card QR Automática"
                                            >
                                                {sendingGiftId === c.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Gift className="w-4 h-4"/>}
                                            </button>
                                            
                                            {/* Botón clásico manual de WhatsApp de respaldo */}
                                            <button 
                                                onClick={() => openWhatsApp(c.whatsapp, `¡Hola ${c.nombre}! De parte de Boulevard Zapallar te deseamos un muy feliz cumpleaños 🎂. Te tenemos un regalo especial...`)} 
                                                className="bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white p-2 rounded-lg transition-colors" 
                                                title="Abrir Chat Manual"
                                            >
                                                <Send className="w-4 h-4"/>
                                            </button>
                                        </div>
                                    </div>
                                )) : <div className="text-center py-6 border border-dashed border-zinc-800 rounded-xl"><p className="text-xs text-zinc-500 font-medium">No hay cumpleaños registrados para esta fecha.</p></div>}
                            </div>
                        </div>

                        {/* Importador */}
                        <div className="bg-zinc-900 border border-white/5 p-6 rounded-3xl flex flex-col justify-center items-center text-center shadow-lg">
                            <input type="file" accept=".csv" ref={csvInputRef} onChange={handleCSVUpload} className="hidden" />
                            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-4 border border-green-500/20">
                                <FileSpreadsheet className="w-10 h-10 text-green-500" />
                            </div>
                            <h3 className="text-lg font-black text-white uppercase tracking-wider mb-2">Importar Base (CSV)</h3>
                            <p className="text-xs text-zinc-500 mb-6 max-w-sm">Sube un archivo .csv con las columnas exactas: <br/><strong className="text-zinc-300">Nombre, Email, Whatsapp, Fecha Nacimiento</strong> (Formato fecha: YYYY-MM-DD)</p>
                            <button onClick={() => csvInputRef.current?.click()} className="bg-white text-black px-6 py-3 rounded-xl text-xs font-bold uppercase flex items-center gap-2 hover:bg-zinc-200 transition-all shadow-xl">
                                <Upload className="w-4 h-4" /> Seleccionar Archivo
                            </button>
                        </div>
                    </div>

                    <div className="bg-zinc-900 border border-white/5 rounded-3xl p-6 min-h-[500px] flex flex-col">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                            <div>
                                <h3 className="text-lg font-black uppercase tracking-wider flex items-center gap-2">Base de Clientes <span className="text-[#DAA520]">({clientes.length})</span></h3>
                                <p className="text-xs text-zinc-500 mt-1">Directorio oficial para fidelización y marketing. (Alimentado por reservas web y compras POS).</p>
                            </div>
                            <div className="flex gap-2">
                                 <button onClick={() => handleResetTable('clientes', 'Todos los Clientes')} className="bg-red-900/30 text-red-500 border border-red-500/50 hover:bg-red-600 hover:text-white px-4 py-2 rounded-xl text-xs font-bold uppercase flex items-center gap-2 transition-all">
                                     <Trash2 className="w-4 h-4" /> Vaciar BD
                                 </button>
                                <button onClick={() => handleOpenClientModal()} className="bg-[#DAA520] text-black px-4 py-2 rounded-xl text-xs font-bold uppercase flex items-center gap-2 hover:bg-[#B8860B] transition-colors shadow-lg">
                                    <UserPlus className="w-4 h-4" /> Nuevo
                                </button>
                            </div>
                        </div>
                        <div className="overflow-x-auto custom-scrollbar flex-1">
                            <table className="w-full text-left text-sm text-zinc-400">
                                <thead className="text-[10px] uppercase font-bold tracking-wider bg-black/40 text-zinc-500 sticky top-0 backdrop-blur-md z-10">
                                    <tr>
                                        <th className="px-4 py-4 min-w-[150px]">Nombre Completo</th>
                                        <th className="px-4 py-4">Datos de Contacto</th>
                                        <th className="px-4 py-4 text-center">Cumpleaños</th>
                                        <th className="px-4 py-4 text-right">Comunicación Directa / Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {clientes.map((client) => (
                                        <tr key={client.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-4 py-4 font-bold text-white text-xs">{client.nombre}</td>
                                            <td className="px-4 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="flex items-center gap-1.5 text-xs"><Phone className="w-3 h-3 text-zinc-500"/> {client.whatsapp}</span>
                                                    {client.email && <span className="flex items-center gap-1.5 text-[10px] text-zinc-500"><Mail className="w-3 h-3"/> {client.email}</span>}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                {client.fecha_nacimiento ? <span className="bg-zinc-800 text-zinc-300 px-3 py-1 rounded-full text-[10px] font-bold">{client.fecha_nacimiento}</span> : <span className="text-zinc-700 font-bold">---</span>}
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <div className="flex justify-end items-center gap-2">
                                                    <button onClick={() => openWhatsApp(client.whatsapp, `Hola ${client.nombre}, te contactamos de Boulevard Zapallar...`)} className="p-2 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white rounded-lg transition-colors" title="Enviar WhatsApp"><Send className="w-4 h-4"/></button>
                                                    {client.email && <button onClick={() => openMail(client.email, "Promoción Especial Boulevard Zapallar")} className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg transition-colors" title="Enviar Correo"><Mail className="w-4 h-4"/></button>}
                                                    <div className="w-px h-6 bg-white/10 mx-2"></div>
                                                    <button onClick={() => handleOpenClientModal(client)} className="p-2 hover:bg-white/10 rounded-lg text-zinc-500 hover:text-white transition-colors" title="Editar"><Edit2 className="w-4 h-4"/></button>
                                                    <button onClick={() => handleDeleteClient(client.id)} className="p-2 hover:bg-red-500/20 rounded-lg text-zinc-500 hover:text-red-500 transition-colors" title="Eliminar"><Trash2 className="w-4 h-4"/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {clientes.length === 0 && <tr><td colSpan={4} className="py-16 text-center text-zinc-500">Base de datos de clientes vacía.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* 7. SHOWS (BLOQUEADO PARA CAJERO) */}
            {activeTab === "shows" && !isCajero && (
                <motion.div key="shows" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <div className="relative w-full sm:w-64 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-[#DAA520]" />
                            <input type="text" placeholder="Buscar show..." className="w-full bg-zinc-900 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-[#DAA520] transition-colors" />
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                             <button onClick={() => handleResetTable('shows', 'Todos los Shows')} className="flex-1 sm:flex-none bg-red-900/30 text-red-500 border border-red-500/50 hover:bg-red-600 hover:text-white px-4 py-3 sm:py-2 rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-2 transition-all">
                                 <Trash2 className="w-4 h-4" /> Reset
                             </button>
                            <button onClick={() => handleOpenShowModal()} className="flex-1 sm:flex-none bg-[#DAA520] text-black px-6 py-3 sm:py-2 rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-2 hover:bg-[#B8860B] transition-colors shadow-lg">
                                <Plus className="w-4 h-4" /> Nuevo Show
                            </button>
                        </div>
                    </div>
                    <div className="grid gap-4">
                        {shows.length === 0 ? <div className="text-center py-20 bg-zinc-900 rounded-3xl border border-dashed border-zinc-800 text-zinc-500">No hay shows programados.</div> : shows.map((show) => (
                            <div key={show.id} className="bg-zinc-900 border border-white/5 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-[#DAA520]/30 transition-all shadow-lg">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6 w-full md:w-auto">
                                    <div className="w-full sm:w-28 aspect-video sm:aspect-square sm:h-28 bg-black rounded-xl relative overflow-hidden shrink-0 shadow-inner border border-white/10">
                                        <Image src={show.image_url || "/placeholder.jpg"} alt={show.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <h3 className="font-black text-white text-xl uppercase tracking-wide">{show.title}</h3>
                                            {show.tag && <span className="text-[9px] bg-white text-black px-2 py-0.5 rounded font-bold uppercase">{show.tag}</span>}
                                            {show.is_adult && <span className="text-[9px] bg-red-900 text-red-200 px-2 py-0.5 rounded font-bold border border-red-500/30">+18</span>}
                                        </div>
                                        <p className="text-sm text-[#DAA520] font-medium mb-3">{show.subtitle}</p>
                                        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-1">
                                            <span className="text-xs text-zinc-400 flex items-center gap-1.5 bg-black/50 px-3 py-1.5 rounded-lg border border-white/5"><Calendar className="w-3.5 h-3.5 text-zinc-500"/> <strong className="text-zinc-300">{show.date_event}</strong> • {show.time_event} a {show.end_time}</span>
                                            <span className="text-xs text-zinc-400 flex items-center gap-1.5 bg-black/50 px-3 py-1.5 rounded-lg border border-white/5"><MapPin className="w-3.5 h-3.5 text-zinc-500"/> {show.location}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex md:flex-col items-center justify-end gap-2 w-full md:w-auto border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6 shrink-0">
                                    <div className="text-center w-full md:w-auto mb-2 md:mb-4 hidden sm:block">
                                        <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Aforo / Entradas</p>
                                        <p className="text-white font-mono text-sm"><strong className="text-green-400">{show.sold}</strong> / {show.total}</p>
                                        <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden"><div style={{ width: `${(show.sold/show.total)*100}%` }} className="h-full bg-green-500"></div></div>
                                    </div>
                                    <div className="flex w-full gap-2">
                                        <button onClick={() => handleOpenShowModal(show)} className="flex-1 p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-zinc-300 transition-colors flex justify-center items-center gap-2"><Edit2 className="w-4 h-4" /> <span className="text-[10px] font-bold uppercase sm:hidden">Editar</span></button>
                                        <button onClick={() => handleDeleteShow(show.id)} className="flex-1 p-2.5 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-red-500 transition-colors flex justify-center items-center gap-2"><Trash2 className="w-4 h-4" /> <span className="text-[10px] font-bold uppercase sm:hidden">Borrar</span></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* 8. PROMOCIONES (BLOQUEADO PARA CAJERO) */}
            {activeTab === "promos" && !isCajero && (
                <motion.div key="promos" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold">Promociones Activas</h3>
                        <div className="flex gap-2">
                             <button onClick={() => handleResetTable('promociones', 'Promociones')} className="bg-red-900/30 text-red-500 border border-red-500/50 hover:bg-red-600 hover:text-white px-4 py-2 rounded-xl text-xs font-bold uppercase flex items-center gap-2 transition-all">
                                 <Trash2 className="w-4 h-4" /> Reset
                             </button>
                            <button onClick={() => handleOpenPromoModal()} className="bg-[#DAA520] text-black px-6 py-2 rounded-xl text-xs font-bold uppercase flex items-center gap-2 hover:bg-[#B8860B] transition-colors shadow-lg">
                                <Plus className="w-4 h-4" /> Nueva Promo
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {promos.map((promo) => (
                            <div key={promo.id} className={`group bg-zinc-900 border ${promo.active ? 'border-white/10' : 'border-red-900/30 opacity-60'} p-4 rounded-3xl relative transition-all hover:border-[#DAA520]/50 shadow-lg flex flex-col h-full`}>
                                <div className="relative w-full aspect-square bg-black rounded-2xl overflow-hidden mb-4 border border-white/5 shrink-0">
                                    <Image src={promo.image_url || "/placeholder.jpg"} alt={promo.title} fill className="object-cover opacity-90 group-hover:scale-105 transition-transform duration-500" />
                                    <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
                                        <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full uppercase shadow-lg ${promo.category === 'pack' ? 'bg-[#8338EC] text-white' : 'bg-blue-600 text-white'}`}>{promo.category}</span>
                                        {promo.tag && <span className="text-[9px] font-bold px-2.5 py-1 rounded-full uppercase bg-white text-black shadow-lg">{promo.tag}</span>}
                                    </div>
                                    <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/90 to-transparent">
                                        <span className="text-xl font-black text-[#DAA520] drop-shadow-md">${promo.price?.toLocaleString()}</span>
                                    </div>
                                </div>
                                <div className="relative z-10 flex flex-col flex-1">
                                    <h3 className="text-lg font-black text-white line-clamp-1 uppercase tracking-tight">{promo.title}</h3>
                                    <p className="text-xs text-[#DAA520] font-medium mb-2 line-clamp-1">{promo.subtitle}</p>
                                    <p className="text-xs text-zinc-400 line-clamp-2 min-h-[2.5em] flex-1 leading-relaxed">{promo.desc_text}</p>
                                    
                                    <div className="flex justify-between items-center border-t border-white/10 pt-4 mt-4 shrink-0">
                                        <button onClick={() => togglePromoStatus(promo.id, promo.active)} className={`flex items-center gap-1.5 text-[10px] font-bold uppercase transition-colors ${promo.active ? 'text-green-500 hover:text-green-400' : 'text-zinc-500 hover:text-zinc-400'}`}>
                                            <div className={`w-2 h-2 rounded-full ${promo.active ? 'bg-green-500 animate-pulse' : 'bg-zinc-600'}`}></div>
                                            {promo.active ? "Visible" : "Oculto"}
                                        </button>
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

            {/* 9. EVENTOS / COTIZACIONES (BLOQUEADO PARA CAJERO) */}
            {activeTab === "eventos" && !isCajero && (
                <motion.div key="eventos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-wider flex items-center gap-2"><FileText className="w-6 h-6 text-[#DAA520]"/> Cotizaciones</h3>
                            <p className="text-xs text-zinc-500 mt-1">Solicitudes de eventos (Matrimonios, Cumpleaños, Empresas)</p>
                        </div>
                        <button onClick={() => handleResetTable('solicitudes', 'Cotizaciones')} className="bg-red-900/30 text-red-500 border border-red-500/50 hover:bg-red-600 hover:text-white px-4 py-2 rounded-xl text-xs font-bold uppercase flex items-center gap-2 transition-all">
                            <Trash2 className="w-4 h-4" /> Limpiar Historial
                        </button>
                    </div>
                    <div className="grid gap-4 flex-1 content-start">
                        {solicitudes.length === 0 ? <div className="text-center py-20 bg-zinc-900 rounded-3xl border border-dashed border-zinc-800 text-zinc-500">Bandeja de solicitudes vacía.</div> : solicitudes.map((req) => (
                            <div key={req.id} className={`bg-zinc-900 border p-5 rounded-3xl relative overflow-hidden group transition-all shadow-lg ${req.status === 'nueva' ? 'border-[#DAA520]/50 shadow-[#DAA520]/5' : 'border-white/5 opacity-80'}`}>
                                {req.status === 'nueva' && <div className="absolute top-0 right-0 w-20 h-20 bg-[#DAA520]/10 rounded-bl-full pointer-events-none"></div>}
                                
                                <div className="flex justify-between items-start mb-3 relative z-10">
                                    <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 ${req.status === 'nueva' ? 'bg-[#DAA520] text-black shadow-md' : 'bg-zinc-800 text-zinc-400'}`}>
                                        {req.status === 'nueva' && <div className="w-1.5 h-1.5 bg-black rounded-full animate-pulse"></div>}
                                        {req.status === 'nueva' ? 'Nueva Solicitud' : 'Atendida'}
                                    </span>
                                    <span className="text-[10px] text-zinc-500 font-mono bg-black/50 px-2 py-1 rounded-lg border border-white/5">{new Date(req.created_at).toLocaleDateString()}</span>
                                </div>
                                
                                <div className="relative z-10">
                                    <h4 className="font-black text-white text-2xl uppercase tracking-tight">{req.type}</h4>
                                    <p className="text-sm text-[#DAA520] font-bold mt-0.5">A nombre de: <span className="text-white">{req.name}</span></p>
                                    
                                    <div className="flex flex-wrap gap-x-6 gap-y-3 mt-5 text-xs text-zinc-300 bg-black/60 p-4 rounded-2xl border border-white/5">
                                        <div className="flex items-center gap-2"><div className="p-1.5 bg-white/10 rounded-lg"><Users className="w-4 h-4 text-white"/></div> <span><strong className="text-white text-sm">{req.guests}</strong> pax</span></div>
                                        <div className="flex items-center gap-2"><div className="p-1.5 bg-white/10 rounded-lg"><Calendar className="w-4 h-4 text-white"/></div> <span><strong className="text-white text-sm">{req.date_event}</strong> a las {req.time_event}</span></div>
                                        <div className="flex items-center gap-2"><div className="p-1.5 bg-blue-500/20 rounded-lg"><Phone className="w-4 h-4 text-blue-400"/></div> <span className="font-mono text-white">{req.phone}</span></div>
                                        <div className="flex items-center gap-2"><div className="p-1.5 bg-zinc-800 rounded-lg"><Mail className="w-4 h-4 text-zinc-400"/></div> <span className="text-white">{req.email}</span></div>
                                    </div>
                                    
                                    <div className="mt-6 flex flex-col sm:flex-row gap-3">
                                        <button 
                                            onClick={() => updateSolicitudStatus(req.id, 'cotizada')} 
                                            className={`flex-1 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border flex items-center justify-center gap-2 ${req.status === 'cotizada' ? 'bg-transparent border-zinc-800 text-zinc-600 cursor-not-allowed' : 'bg-white text-black border-white hover:bg-zinc-200 shadow-xl'}`}
                                            disabled={req.status === 'cotizada'}
                                        >
                                            {req.status === 'cotizada' ? <><CheckCircle className="w-4 h-4"/> Ya Cotizada</> : 'Marcar como Atendida'}
                                        </button>
                                        <div className="flex flex-1 gap-2">
                                            <button onClick={() => openWhatsApp(req.phone, `Hola ${req.name}, recibimos tu solicitud para celebrar un ${req.type} en Boulevard Zapallar...`)} className="flex-1 py-3.5 bg-[#25D366]/10 border border-[#25D366]/50 text-[#25D366] rounded-xl text-xs font-bold uppercase hover:bg-[#25D366] hover:text-black transition-colors flex items-center justify-center gap-2 shadow-lg">
                                                <Send className="w-4 h-4"/> WhatsApp
                                            </button>
                                            <button onClick={() => openMail(req.email, `Propuesta para tu ${req.type} en BZ`)} className="w-14 flex items-center justify-center bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-xl hover:bg-zinc-700 transition-colors">
                                                <Mail className="w-4 h-4"/>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* 10. CARRUSEL (BLOQUEADO PARA CAJERO) */}
            {activeTab === "carrusel" && !isCajero && (
                <motion.div key="carrusel" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="bg-zinc-900 border border-white/5 p-6 rounded-3xl mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-wider flex items-center gap-2"><Presentation className="w-6 h-6 text-[#DAA520]"/> Gestión de Carrusel</h3>
                            <p className="text-sm text-zinc-500 mt-1">Visualización en vivo de la portada principal de la web.</p>
                        </div>
                        <div className="flex items-center gap-4 bg-black/50 py-2 px-4 rounded-2xl border border-white/5">
                            <span className="text-xs uppercase font-bold text-zinc-400">Total Activos:</span>
                            <span className="text-2xl font-black text-[#DAA520]">{carouselItemsActiveCount}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {carouselItems.length === 0 ? (
                            <div className="col-span-full py-20 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-3xl">
                                <MonitorPlay className="w-16 h-16 mx-auto mb-4 opacity-50"/>
                                <p className="text-lg font-bold">No hay contenido en el sistema.</p>
                                <p className="text-xs mt-2">Crea un Show o Promoción para verlos aquí.</p>
                            </div>
                        ) : (
                            carouselItems.map((item) => (
                                <div key={item.id} className={`group relative bg-black border ${item.active ? 'border-[#DAA520]/50 shadow-[0_0_30px_rgba(218,165,32,0.1)]' : 'border-white/5 opacity-60 grayscale'} rounded-3xl overflow-hidden transition-all duration-300 flex flex-col h-[400px]`}>
                                    <div className="absolute top-4 left-4 z-20">
                                        <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl border ${item.type === 'show' ? 'bg-[#8338EC]/90 text-white border-[#8338EC]' : 'bg-[#DAA520]/90 text-black border-[#DAA520]'}`}>
                                            {item.type === 'show' ? 'Eventos' : 'Promociones'}
                                        </span>
                                    </div>
                                    <div className="absolute top-4 right-4 z-20 flex gap-1">
                                        <button onClick={() => toggleVisibility(item)} className={`p-2 rounded-xl backdrop-blur-md transition-all shadow-xl ${item.active ? 'bg-red-500/80 text-white hover:bg-red-600' : 'bg-green-500/80 text-white hover:bg-green-600'}`} title={item.active ? "Ocultar de la portada" : "Mostrar en portada"}>
                                            {item.active ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                                        </button>
                                    </div>
                                    
                                    <div className="relative w-full h-3/4 bg-zinc-900 shrink-0">
                                        <Image src={item.image_url || "/placeholder.jpg"} alt={item.title} fill className={`object-cover transition-transform duration-700 ${item.active ? 'group-hover:scale-105' : ''}`} />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                                        <div className="absolute bottom-0 left-0 w-full p-5">
                                            <h3 className="text-2xl font-black text-white uppercase italic leading-none mb-1 drop-shadow-lg">{item.title}</h3>
                                            <p className="text-sm text-zinc-300 line-clamp-1 drop-shadow-md">{item.subtitle}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex-1 flex justify-between items-center px-5 bg-zinc-900 border-t border-white/5">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2.5 h-2.5 rounded-full ${item.active ? 'bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]' : 'bg-red-500'}`} />
                                            <span className="text-[10px] font-black tracking-widest uppercase text-zinc-400">{item.active ? 'Publicado' : 'Oculto'}</span>
                                        </div>
                                        <button onClick={() => item.type === 'show' ? handleOpenShowModal(shows.find(s => s.id === item.sourceId)) : handleOpenPromoModal(promos.find(p => p.id === item.sourceId))} className="text-[10px] font-bold uppercase text-white bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white hover:text-black transition-colors flex items-center gap-1">
                                            <Edit2 className="w-3 h-3"/> Editar
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>
            )}

            {/* 11. RRHH / EQUIPO (BLOQUEADO PARA CAJERO) */}
            {activeTab === "rrhh" && !isCajero && (
                <motion.div key="rrhh" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-wider flex items-center gap-2"><Users className="w-6 h-6 text-blue-400"/> Reclutamiento</h3>
                            <p className="text-xs text-zinc-500 mt-1">Gestión de CVs y postulaciones web.</p>
                        </div>
                        <button onClick={() => handleResetTable('candidatos', 'Postulantes')} className="bg-red-900/30 text-red-500 border border-red-500/50 hover:bg-red-600 hover:text-white px-4 py-2 rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-2 transition-all">
                            <Trash2 className="w-4 h-4" /> Limpiar Postulantes
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 content-start">
                        {candidatos.length === 0 ? <div className="col-span-full text-center py-20 bg-zinc-900 rounded-3xl border border-dashed border-zinc-800 text-zinc-500">No hay postulaciones nuevas.</div> : candidatos.map((cand) => (
                            <div key={cand.id} className="bg-zinc-900 border border-white/5 p-6 rounded-3xl flex flex-col justify-between hover:border-blue-500/30 transition-all shadow-xl group">
                                <div>
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-900 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg transform group-hover:-rotate-3 transition-transform">
                                            {cand.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-[9px] bg-blue-900/30 text-blue-400 px-3 py-1 rounded-full font-black uppercase tracking-widest border border-blue-500/20">
                                            {cand.role}
                                        </span>
                                    </div>
                                    <h4 className="font-black text-white text-xl uppercase tracking-tight mb-1">{cand.name}</h4>
                                    <div className="space-y-1.5 mb-4">
                                        <span className="flex items-center gap-2 text-xs text-zinc-400"><Mail className="w-3.5 h-3.5 text-zinc-500"/> {cand.email}</span>
                                        <span className="flex items-center gap-2 text-xs text-zinc-400"><Phone className="w-3.5 h-3.5 text-zinc-500"/> {cand.phone}</span>
                                    </div>
                                    <div className="bg-black/50 p-4 rounded-2xl border border-white/5 mb-6 relative">
                                        <FileSignature className="absolute top-3 right-3 w-4 h-4 text-zinc-700"/>
                                        <p className="text-xs text-zinc-300 italic leading-relaxed line-clamp-3">"{cand.experience}"</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-4 border-t border-white/5">
                                    {cand.cv_url && (
                                        <a href={cand.cv_url} target="_blank" rel="noopener noreferrer" className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-[10px] font-bold uppercase flex items-center justify-center gap-2 transition-colors">
                                            <FileCheck className="w-4 h-4"/> Ver CV
                                        </a>
                                    )}
                                    <button onClick={() => openWhatsApp(cand.phone, `Hola ${cand.name}, somos del equipo de Boulevard Zapallar. Hemos revisado tu perfil para el cargo de ${cand.role}...`)} className="flex-1 py-3 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-black rounded-xl text-[10px] font-bold uppercase flex items-center justify-center gap-2 transition-colors">
                                        <Send className="w-4 h-4"/> Citar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
       </AnimatePresence>

        {/* --- MODALES COMPARTIDOS --- */}
        {/* Renderizamos todos los modales ANTES del cierre del main, pero SIN el AnimatePresence exterior que causaba conflictos */}

        {/* MODAL BOLETA DE PAGO WEB */}
        {isBoletaModalOpen && currentBoletaData && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsBoletaModalOpen(false)} />
                <div className="bg-zinc-900 border border-white/10 rounded-3xl w-full max-w-sm relative z-50 shadow-2xl p-6 flex flex-col max-h-[90vh]">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-black text-white uppercase flex items-center gap-2"><Receipt className="w-4 h-4"/> Detalle y Boleta</h3>
                        <button onClick={() => setIsBoletaModalOpen(false)} className="text-zinc-500 hover:text-white"><X className="w-5 h-5"/></button>
                    </div>
                    
                    <div className="overflow-y-auto custom-scrollbar mb-4 bg-white text-black p-4 rounded-lg flex-1" id="boleta-imprimible">
                        <div className="text-center mb-4 border-b-2 border-black/20 pb-4">
                            <h2 className="font-black text-xl tracking-widest">BOULEVARD</h2>
                            <h3 className="font-bold text-sm tracking-widest">ZAPALLAR</h3>
                            <p className="text-[10px] mt-1 font-bold">RUT: 76.000.000-K</p>
                            <p className="text-[10px]">Giro: Restaurant y Espectáculos</p>
                            <p className="text-[10px]">Curicó, Maule, Chile</p>
                        </div>
                        
                        <div className="text-[10px] mb-4 space-y-1">
                            <p><strong>BOLETA ELECTRÓNICA N°:</strong> {currentBoletaData.id}</p>
                            <p><strong>FECHA:</strong> {new Date(currentBoletaData.fecha).toLocaleString('es-CL')}</p>
                            <p><strong>CLIENTE:</strong> {currentBoletaData.cliente}</p>
                            <p><strong>MÉTODO:</strong> {currentBoletaData.metodo} ({currentBoletaData.ref_getnet})</p>
                        </div>

                        <table className="w-full text-[10px] mb-4">
                            <thead className="border-b border-black/20">
                                <tr><th className="text-left py-1">Cant</th><th className="text-left py-1">Detalle</th><th className="text-right py-1">Total</th></tr>
                            </thead>
                            <tbody className="border-b border-black/20">
                                {currentBoletaData.detalle_completo?.map((item:any, i:number) => (
                                    <tr key={i}>
                                        <td className="py-1 font-bold">{item.quantity}</td>
                                        <td className="py-1 pr-2 truncate max-w-[120px]">{item.name}</td>
                                        <td className="text-right py-1">${(item.price * item.quantity).toLocaleString('es-CL')}</td>
                                    </tr>
                                ))}
                                {(!currentBoletaData.detalle_completo || currentBoletaData.detalle_completo.length === 0) && (
                                    <tr><td colSpan={3} className="py-1 text-center italic text-zinc-500">Detalle genérico (Venta Manual)</td></tr>
                                )}
                            </tbody>
                        </table>

                        <div className="text-right mb-6">
                            <p className="text-sm font-black">TOTAL: ${currentBoletaData.monto.toLocaleString('es-CL')}</p>
                            <p className="text-[8px] text-gray-500 mt-1">El IVA se encuentra incluido en el precio</p>
                        </div>
                        
                        <div className="text-center text-[9px] border-t border-black/20 pt-2">
                            <p>GRACIAS POR SU COMPRA</p>
                            <p className="font-bold mt-1 tracking-widest">TIMBRE ELECTRÓNICO SII</p>
                        </div>
                    </div>

                    <button onClick={generatePDFBoleta} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg">
                        <FileDown className="w-4 h-4"/> Descargar PDF
                    </button>
                </div>
            </div>
        )}

        {/* MODAL COMPROBANTE DE TRANSFERENCIA */}
        {isComprobanteModalOpen && currentComprobanteUrl && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsComprobanteModalOpen(false)} />
                <div className="bg-zinc-900 border border-white/10 rounded-3xl w-full max-w-lg relative z-50 shadow-2xl p-6">
                        <div className="flex justify-between items-center mb-4">
                        <h3 className="font-black text-white uppercase flex items-center gap-2"><Eye className="w-4 h-4 text-blue-400"/> Comprobante Subido</h3>
                        <button onClick={() => setIsComprobanteModalOpen(false)} className="text-zinc-500 hover:text-white"><X className="w-5 h-5"/></button>
                    </div>
                    <div className="relative w-full min-h-[400px] bg-black rounded-xl overflow-hidden flex items-center justify-center border border-white/5 p-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={currentComprobanteUrl} alt="Comprobante de Transferencia" className="max-w-full max-h-[70vh] object-contain rounded-lg" />
                    </div>
                    <a href={currentComprobanteUrl} target="_blank" rel="noreferrer" className="w-full mt-4 bg-white/10 hover:bg-white/20 text-white font-bold uppercase py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                        Abrir Imagen Original
                    </a>
                </div>
            </div>
        )}

        {/* MODAL INGRESAR PAGO MANUAL WEB */}
        {isAddPaymentModalOpen && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsAddPaymentModalOpen(false)} />
                <div className="bg-zinc-900 border border-white/10 rounded-3xl w-full max-w-md relative z-50 shadow-2xl p-6 md:p-8">
                    <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                        <h3 className="font-black text-white uppercase flex items-center gap-2"><Plus className="w-5 h-5 text-[#DAA520]"/> Añadir Pago Externo</h3>
                        <button onClick={() => setIsAddPaymentModalOpen(false)} className="text-zinc-500 hover:text-white"><X className="w-5 h-5"/></button>
                    </div>
                    <form onSubmit={handleSaveManualPayment} className="space-y-4">
                        <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Nombre Comprador</label><input required type="text" placeholder="Ej: Roberto Alfaro" className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none focus:border-[#DAA520]" value={newManualPayment.cliente} onChange={e => setNewManualPayment({...newManualPayment, cliente: e.target.value})} /></div>
                        <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Email Cliente (Para BD)</label><input type="email" placeholder="correo@ejemplo.com" className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none focus:border-[#DAA520]" value={newManualPayment.email} onChange={e => setNewManualPayment({...newManualPayment, email: e.target.value})} /></div>
                        <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Detalle Exacto</label><input required type="text" placeholder="Ej: 2 Entradas General + Botella Ramazzotti" className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none focus:border-[#DAA520]" value={newManualPayment.detalle} onChange={e => setNewManualPayment({...newManualPayment, detalle: e.target.value})} /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Medio Efectivo</label>
                                <select className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none focus:border-[#DAA520]" value={newManualPayment.metodo} onChange={e => setNewManualPayment({...newManualPayment, metodo: e.target.value})}>
                                    <option value="Transferencia">Transferencia a Cuenta</option>
                                    <option value="Getnet">Link Getnet</option>
                                </select>
                            </div>
                            <div><label className="block text-[10px] uppercase font-bold text-green-500 mb-1">Monto Pagado ($)</label><input required type="number" className="w-full bg-black border border-green-900/50 rounded-xl p-3 text-green-400 font-bold text-lg outline-none text-right" value={newManualPayment.monto || ''} onChange={e => setNewManualPayment({...newManualPayment, monto: parseInt(e.target.value)})} /></div>
                        </div>
                        
                        {newManualPayment.metodo === 'Transferencia' && (
                            <div className="col-span-2 mt-2">
                                <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Subir Comprobante (Opcional)</label>
                                <input type="file" accept="image/*" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="w-full bg-black border border-zinc-800 rounded-xl p-2 text-white text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#DAA520] file:text-black hover:file:bg-[#B8860B] transition-colors outline-none cursor-pointer" />
                            </div>
                        )}

                        <button disabled={isLoading} type="submit" className="w-full bg-[#DAA520] text-black font-bold uppercase tracking-widest py-4 rounded-xl mt-4 hover:bg-[#B8860B] transition-colors flex items-center justify-center gap-2 shadow-lg">
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : <><Save className="w-5 h-5"/> Registrar e Ingresar</>}
                        </button>
                    </form>
                </div>
            </div>
        )}

        {/* MODAL VENTA ENTRADAS PUERTA */}
        {isVentaPuertaModalOpen && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsVentaPuertaModalOpen(false)} />
                <div className="bg-zinc-900 border border-purple-500/30 rounded-3xl w-full max-w-lg relative z-50 shadow-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
                    <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                        <h3 className="font-black text-white uppercase flex items-center gap-2"><Ticket className="w-5 h-5 text-purple-500"/> Venta de Entrada Manual</h3>
                        <button onClick={() => setIsVentaPuertaModalOpen(false)} className="text-zinc-500 hover:text-white"><X className="w-5 h-5"/></button>
                    </div>
                    
                    <form onSubmit={handleSaveVentaPuerta} className="space-y-4">
                        {/* Selección de Show y Ticket */}
                        <div className="bg-black/50 p-4 rounded-2xl border border-white/5 space-y-4">
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Seleccionar Show</label>
                                <select required className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none focus:border-purple-500" value={ventaPuertaData.showId} onChange={e => setVentaPuertaData({...ventaPuertaData, showId: e.target.value, ticketIndex: 0})}>
                                    <option value="">-- Elige un Evento --</option>
                                    {shows.map(s => <option key={s.id} value={s.id}>{s.title} ({s.date_event})</option>)}
                                </select>
                            </div>

                            {ventaPuertaData.showId && (() => {
                                const selectedShow = shows.find(s => s.id.toString() === ventaPuertaData.showId);
                                const tickets = selectedShow?.tickets || [];
                                const currentTicketPrice = tickets[ventaPuertaData.ticketIndex]?.price || 0;
                                const calcTotal = currentTicketPrice * ventaPuertaData.quantity;

                                return (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Tipo de Entrada</label>
                                                <select required className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none focus:border-purple-500" value={ventaPuertaData.ticketIndex} onChange={e => setVentaPuertaData({...ventaPuertaData, ticketIndex: parseInt(e.target.value)})}>
                                                    {tickets.length === 0 && <option value="">Sin tickets creados</option>}
                                                    {tickets.map((t:any, i:number) => <option key={i} value={i}>{t.name} - ${t.price}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Cantidad</label>
                                                <input type="number" min="1" required className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none focus:border-purple-500 text-center" value={ventaPuertaData.quantity} onChange={e => setVentaPuertaData({...ventaPuertaData, quantity: parseInt(e.target.value)})} />
                                            </div>
                                        </div>
                                        <div className="text-right pt-2 border-t border-white/5">
                                            <span className="text-[10px] text-zinc-500 uppercase font-bold mr-2">Total a cobrar:</span>
                                            <span className="text-xl font-black text-purple-400">${calcTotal.toLocaleString('es-CL')}</span>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>

                        {/* Datos del Cliente y Pago */}
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Nombre</label><input required type="text" placeholder="Ej: Roberto Alfaro" className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none focus:border-purple-500" value={ventaPuertaData.cliente} onChange={e => setVentaPuertaData({...ventaPuertaData, cliente: e.target.value})} /></div>
                            <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">WhatsApp</label><input required type="text" placeholder="+569..." className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none focus:border-purple-500" value={ventaPuertaData.whatsapp} onChange={e => setVentaPuertaData({...ventaPuertaData, whatsapp: e.target.value})} /></div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Email (Opcional)</label><input type="email" placeholder="correo@ejemplo.com" className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none focus:border-purple-500" value={ventaPuertaData.email} onChange={e => setVentaPuertaData({...ventaPuertaData, email: e.target.value})} /></div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Medio de Pago</label>
                                <select className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none focus:border-purple-500" value={ventaPuertaData.metodo_pago} onChange={e => setVentaPuertaData({...ventaPuertaData, metodo_pago: e.target.value})}>
                                    <option value="efectivo">💵 Efectivo</option>
                                    <option value="debito">💳 Débito / Tarjeta</option>
                                    <option value="transferencia">📲 Transferencia</option>
                                </select>
                            </div>
                        </div>

                        {ventaPuertaData.metodo_pago === 'transferencia' && (
                            <div className="col-span-2 mt-2">
                                <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Subir Comprobante de Transferencia</label>
                                <input type="file" accept="image/*" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="w-full bg-black border border-zinc-800 rounded-xl p-2 text-white text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-purple-600 file:text-white hover:file:bg-purple-500 transition-colors outline-none cursor-pointer" />
                            </div>
                        )}

                        <button disabled={isLoading || !ventaPuertaData.showId} type="submit" className="w-full bg-purple-600 text-white font-bold uppercase tracking-widest py-4 rounded-xl mt-4 hover:bg-purple-500 transition-colors flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : <><Ticket className="w-5 h-5"/> Generar Ticket</>}
                        </button>
                    </form>
                </div>
            </div>
        )}

        {/* MODAL FINANZAS GENÉRICO (COMPRAS, GASTOS, INVENTARIO, ETC) */}
        {isFinanceModalOpen && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsFinanceModalOpen(false)} />
                <div className="bg-zinc-900 border border-white/10 rounded-3xl w-full max-w-lg relative z-50 shadow-2xl p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
                    <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                        <h3 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2"><TrendingUp className="w-5 h-5 text-green-500"/> Gestión de {financeModalType}</h3>
                        <button onClick={() => setIsFinanceModalOpen(false)} className="bg-black p-2 rounded-full text-zinc-500 hover:text-white"><X className="w-5 h-5"/></button>
                    </div>
                    <form onSubmit={handleSaveFinanceRecord} className="space-y-4">
                        
                        {/* CAMPOS PARA COMPRAS */}
                        {financeModalType === 'compras' && (
                            <>
                                <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Fecha</label><input type="date" required className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none scheme-dark" value={currentFinanceRecord.fecha || ''} onChange={e => setCurrentFinanceRecord({...currentFinanceRecord, fecha: e.target.value})} /></div>
                                <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Proveedor / Tienda</label><input type="text" required placeholder="Ej: Macro Frío" className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none" value={currentFinanceRecord.proveedor || ''} onChange={e => setCurrentFinanceRecord({...currentFinanceRecord, proveedor: e.target.value})} /></div>
                                <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Descripción de la compra</label><input type="text" required placeholder="Ej: Bebidas, Cervezas, Hielo" className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none" value={currentFinanceRecord.descripcion || ''} onChange={e => setCurrentFinanceRecord({...currentFinanceRecord, descripcion: e.target.value})} /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Categoría</label>
                                        <select className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none" value={currentFinanceRecord.categoria || 'Alimentos'} onChange={e => setCurrentFinanceRecord({...currentFinanceRecord, categoria: e.target.value})}>
                                            <option value="Alimentos">Alimentos</option><option value="Bebidas/Alcohol">Bebidas/Alcohol</option><option value="Insumos">Insumos (Aseo/Cocina)</option><option value="Equipamiento">Equipamiento</option>
                                        </select>
                                    </div>
                                    <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Monto Total ($)</label><input type="number" required className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-red-400 font-bold text-lg outline-none" value={currentFinanceRecord.monto || ''} onChange={e => setCurrentFinanceRecord({...currentFinanceRecord, monto: parseInt(e.target.value)})} /></div>
                                </div>
                            </>
                        )}

                        {/* CAMPOS PARA GASTOS */}
                        {financeModalType === 'gastos' && (
                            <>
                                <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Fecha</label><input type="date" required className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none scheme-dark" value={currentFinanceRecord.fecha || ''} onChange={e => setCurrentFinanceRecord({...currentFinanceRecord, fecha: e.target.value})} /></div>
                                <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Descripción del Gasto</label><input type="text" required placeholder="Ej: Arriendo Local" className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none" value={currentFinanceRecord.descripcion || ''} onChange={e => setCurrentFinanceRecord({...currentFinanceRecord, descripcion: e.target.value})} /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Tipo de Gasto</label>
                                        <select className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none" value={currentFinanceRecord.categoria || 'Fijo'} onChange={e => setCurrentFinanceRecord({...currentFinanceRecord, categoria: e.target.value})}>
                                            <option value="Fijo">Gasto Fijo</option><option value="Variable">Gasto Variable</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Categoría</label>
                                        <select className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none" value={currentFinanceRecord.subtipo || 'Servicios'} onChange={e => setCurrentFinanceRecord({...currentFinanceRecord, subtipo: e.target.value})}>
                                            <option value="Servicios">Servicios (Luz/Agua/Net)</option><option value="Arriendo">Arriendo</option><option value="Marketing">Marketing / RRSS</option><option value="Software">Software (POS/Vercel)</option><option value="Seguridad">Seguridad</option><option value="Otro">Otro</option>
                                        </select>
                                    </div>
                                </div>
                                <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Monto ($)</label><input type="number" required className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-red-400 font-bold text-lg outline-none" value={currentFinanceRecord.monto || ''} onChange={e => setCurrentFinanceRecord({...currentFinanceRecord, monto: parseInt(e.target.value)})} /></div>
                            </>
                        )}

                        {/* CAMPOS PARA INVENTARIO */}
                        {financeModalType === 'inventario' && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Mes Registro</label><input type="month" required className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none scheme-dark" value={currentFinanceRecord.mes || ''} onChange={e => setCurrentFinanceRecord({...currentFinanceRecord, mes: e.target.value})} /></div>
                                    <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Producto / Insumo</label><input type="text" required placeholder="Ej: Cerveza Corona" className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none" value={currentFinanceRecord.producto || ''} onChange={e => setCurrentFinanceRecord({...currentFinanceRecord, producto: e.target.value})} /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Inv. Inicial (Unidades)</label><input type="number" required className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none" value={currentFinanceRecord.inventario_inicial || ''} onChange={e => setCurrentFinanceRecord({...currentFinanceRecord, inventario_inicial: parseInt(e.target.value)})} /></div>
                                    <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Compras (Unidades)</label><input type="number" required className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none" value={currentFinanceRecord.compras || ''} onChange={e => setCurrentFinanceRecord({...currentFinanceRecord, compras: parseInt(e.target.value)})} /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-[10px] uppercase font-bold text-red-500 mb-1">Mermas / Pérdidas (Un)</label><input type="number" required className="w-full bg-black border border-red-900/50 rounded-xl p-3 text-red-400 text-sm outline-none" value={currentFinanceRecord.mermas || ''} onChange={e => setCurrentFinanceRecord({...currentFinanceRecord, mermas: parseInt(e.target.value)})} /></div>
                                    <div><label className="block text-[10px] uppercase font-bold text-green-500 mb-1">Inv. Final (Unidades)</label><input type="number" required className="w-full bg-black border border-green-900/50 rounded-xl p-3 text-green-400 font-bold text-sm outline-none" value={currentFinanceRecord.inventario_final || ''} onChange={e => setCurrentFinanceRecord({...currentFinanceRecord, inventario_final: parseInt(e.target.value)})} /></div>
                                </div>
                                <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Costo Total Asociado ($)</label><input type="number" required placeholder="Costo en dinero de las compras" className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white font-bold text-lg outline-none" value={currentFinanceRecord.costo_total || ''} onChange={e => setCurrentFinanceRecord({...currentFinanceRecord, costo_total: parseInt(e.target.value)})} /></div>
                            </>
                        )}

                        {/* CAMPOS PARA TRABAJADORES */}
                        {financeModalType === 'trabajadores' && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Mes (Liquidación)</label><input type="month" required className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none scheme-dark" value={currentFinanceRecord.mes || ''} onChange={e => setCurrentFinanceRecord({...currentFinanceRecord, mes: e.target.value})} /></div>
                                    <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Trabajador</label><input type="text" required placeholder="Nombre Empleado" className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none" value={currentFinanceRecord.nombre || ''} onChange={e => setCurrentFinanceRecord({...currentFinanceRecord, nombre: e.target.value})} /></div>
                                </div>
                                <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Cargo</label><input type="text" required placeholder="Ej: Bartender, Garzón, Guardia" className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none" value={currentFinanceRecord.cargo || ''} onChange={e => setCurrentFinanceRecord({...currentFinanceRecord, cargo: e.target.value})} /></div>
                                <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Sueldo Base Acordado ($)</label><input type="number" required className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-lg font-bold outline-none" value={currentFinanceRecord.sueldo_base || ''} onChange={e => setCurrentFinanceRecord({...currentFinanceRecord, sueldo_base: parseInt(e.target.value)})} /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Horas Extras ($)</label><input type="number" className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none" value={currentFinanceRecord.horas_extras || 0} onChange={e => setCurrentFinanceRecord({...currentFinanceRecord, horas_extras: parseInt(e.target.value)})} /></div>
                                    <div><label className="block text-[10px] uppercase font-bold text-green-500 mb-1">Propinas ($)</label><input type="number" className="w-full bg-black border border-green-900/50 rounded-xl p-3 text-green-400 font-bold text-sm outline-none" value={currentFinanceRecord.propinas || 0} onChange={e => setCurrentFinanceRecord({...currentFinanceRecord, propinas: parseInt(e.target.value)})} /></div>
                                </div>
                            </>
                        )}

                        {/* CAMPOS PARA TRIBUTARIO */}
                        {financeModalType === 'tributario' && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Periodo (Mes/Año)</label><input type="month" required className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none scheme-dark" value={currentFinanceRecord.periodo || ''} onChange={e => setCurrentFinanceRecord({...currentFinanceRecord, periodo: e.target.value})} /></div>
                                    <div>
                                        <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Tipo de Declaración</label>
                                        <select className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none" value={currentFinanceRecord.documento || 'F29 (IVA)'} onChange={e => setCurrentFinanceRecord({...currentFinanceRecord, documento: e.target.value})}>
                                            <option value="F29 (IVA)">F29 (IVA Mensual)</option><option value="F22 (Renta)">F22 (Renta Anual)</option><option value="Previred">Previred (Leyes Sociales)</option><option value="Patente">Patente Municipal</option>
                                        </select>
                                    </div>
                                </div>
                                <div><label className="block text-[10px] uppercase font-bold text-red-500 mb-1">Monto a Pagar ($)</label><input type="number" required className="w-full bg-black border border-red-900/50 rounded-xl p-3 text-red-400 text-2xl font-black outline-none" value={currentFinanceRecord.monto_pagar || ''} onChange={e => setCurrentFinanceRecord({...currentFinanceRecord, monto_pagar: parseInt(e.target.value)})} /></div>
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Estado de Pago</label>
                                    <select className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none" value={currentFinanceRecord.estado || 'pendiente'} onChange={e => setCurrentFinanceRecord({...currentFinanceRecord, estado: e.target.value})}>
                                        <option value="pendiente">Pendiente de Pago</option><option value="pagado">Pagado y Declarado</option>
                                    </select>
                                </div>
                            </>
                        )}

                        <button disabled={isLoading} type="submit" className="w-full bg-green-600 text-white font-bold uppercase tracking-widest py-4 rounded-xl mt-4 hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-lg">
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : <><Save className="w-5 h-5"/> Guardar Registro</>}
                        </button>
                    </form>
                </div>
            </div>
        )}

        {/* MODAL VENTA POS RÁPIDA */}
        {isVentaModalOpen && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsVentaModalOpen(false)} />
                <div className="bg-zinc-900 border border-white/10 rounded-3xl w-full max-w-sm relative z-50 shadow-2xl p-8">
                    <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4"><h3 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2"><DollarSign className="w-6 h-6 text-green-500"/> Caja POS</h3><button onClick={() => setIsVentaModalOpen(false)} className="text-zinc-500 hover:text-white"><X className="w-5 h-5"/></button></div>
                    <form onSubmit={handleSaveVenta} className="space-y-4">
                        <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Cliente Asociado (Opcional)</label><input type="text" placeholder="Ej: Mesa 4 / Juan P." className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none focus:border-green-500" value={currentVenta.cliente} onChange={e => setCurrentVenta({...currentVenta, cliente: e.target.value})} /></div>
                        <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Concepto de Venta</label><input required type="text" placeholder="Ej: 2 Pisco Sour + Tabla" className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none focus:border-green-500" value={currentVenta.descripcion} onChange={e => setCurrentVenta({...currentVenta, descripcion: e.target.value})} /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Categoría</label>
                                <select className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-xs outline-none focus:border-green-500" value={currentVenta.tipo} onChange={e => setCurrentVenta({...currentVenta, tipo: e.target.value})}>
                                        <option value="consumo_extra">🍽️ Menú / Tragos</option>
                                        <option value="entrada_manual">🎫 Entrada Puerta</option>
                                        <option value="general">💰 Otro Ingreso</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Medio Pago</label>
                                <select className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-xs outline-none focus:border-green-500" value={currentVenta.metodo_pago} onChange={e => setCurrentVenta({...currentVenta, metodo_pago: e.target.value})}>
                                        <option value="efectivo">💵 Efectivo</option>
                                        <option value="debito">💳 Débito</option>
                                        <option value="credito">💳 Crédito</option>
                                        <option value="transferencia">📲 Transferencia</option>
                                </select>
                            </div>
                        </div>
                        <div className="pt-2"><label className="block text-[10px] uppercase font-bold text-green-500 mb-1">Monto Pagado ($)</label><input required type="number" className="w-full bg-black border border-green-900/50 rounded-xl p-4 text-green-400 text-3xl font-black text-center outline-none" value={currentVenta.monto || ''} onChange={e => setCurrentVenta({...currentVenta, monto: parseInt(e.target.value)})} /></div>
                        <button disabled={isLoading} type="submit" className="w-full bg-green-600 text-white font-bold uppercase tracking-widest py-4 rounded-xl mt-4 hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-xl shadow-green-900/20">{isLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : <><CheckCircle className="w-5 h-5"/> Procesar Pago</>}</button>
                    </form>
                </div>
            </div>
        )}

        {/* MODAL CLIENTES (AÑADIDO EMAIL Y FECHA OPCIONAL) */}
        {isClientModalOpen && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsClientModalOpen(false)} />
                <div className="bg-zinc-900 border border-white/10 rounded-3xl w-full max-w-md relative z-50 shadow-2xl p-8">
                    <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                        <h3 className="text-xl font-black text-white uppercase tracking-wider">{currentClient.id ? "Editar Cliente" : "Nuevo Cliente"}</h3>
                        <button onClick={() => setIsClientModalOpen(false)} className="bg-black p-2 rounded-full text-zinc-500 hover:text-white"><X className="w-5 h-5"/></button>
                    </div>
                    <form onSubmit={handleSaveClient} className="space-y-4">
                        <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Nombre Completo</label><input required type="text" className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none focus:border-[#DAA520]" value={currentClient.nombre} onChange={e => setCurrentClient({...currentClient, nombre: e.target.value})} /></div>
                        <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">WhatsApp</label><input required type="text" placeholder="+569..." className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none focus:border-[#DAA520]" value={currentClient.whatsapp} onChange={e => setCurrentClient({...currentClient, whatsapp: e.target.value})} /></div>
                        <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Email (Opcional)</label><input type="email" placeholder="cliente@correo.com" className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none focus:border-[#DAA520]" value={currentClient.email || ""} onChange={e => setCurrentClient({...currentClient, email: e.target.value})} /></div>
                        <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Fecha de Nacimiento</label><input type="date" className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none focus:border-[#DAA520] scheme-dark" value={currentClient.fecha_nacimiento || ""} onChange={e => setCurrentClient({...currentClient, fecha_nacimiento: e.target.value})} /></div>
                        <button disabled={isLoading} type="submit" className="w-full bg-[#DAA520] text-black font-bold uppercase tracking-widest py-4 rounded-xl mt-4 hover:bg-[#B8860B] transition-colors flex items-center justify-center gap-2 shadow-lg">
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : <><Save className="w-5 h-5"/> Guardar en Base</>}
                        </button>
                    </form>
                </div>
            </div>
        )}

        {/* MODAL MENÚ EXPRESS */}
        {isMenuModalOpen && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsMenuModalOpen(false)} />
                <div className="bg-zinc-900 border border-white/10 rounded-3xl w-full max-w-4xl relative z-50 shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
                    <div className="w-full md:w-1/3 bg-black/50 border-r border-white/10 p-6 flex flex-col justify-center items-center relative group h-48 md:h-auto shrink-0">
                        <input type="file" ref={fileInputRef} onChange={(e) => handleImageSelect(e, 'menu')} accept="image/*" className="hidden" />
                        <div onClick={triggerFileInput} className="relative w-full h-full max-w-[250px] max-h-[250px] aspect-square rounded-3xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:border-[#DAA520] hover:bg-white/5 transition-all overflow-hidden">
                            {currentMenuItem.image_url ? (
                                <>
                                    <Image src={currentMenuItem.image_url} alt="Preview" fill className="object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"><p className="text-xs font-bold text-white uppercase flex items-center gap-2"><ImageIcon className="w-4 h-4"/> Cambiar Imagen</p></div>
                                </>
                            ) : (
                                <div className="text-center text-zinc-500"><div className="p-4 bg-zinc-800 rounded-full mb-3 inline-block"><Upload className="w-6 h-6 text-zinc-400"/></div><p className="text-xs font-bold text-zinc-400 uppercase">Foto Producto</p><p className="text-[9px] text-zinc-600 mt-1">Formato Cuadrado</p></div>
                            )}
                        </div>
                    </div>
                    <div className="flex-1 p-6 md:p-10 overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4"><h3 className="text-xl font-black text-white uppercase tracking-wider">{currentMenuItem.id ? "Editar Producto" : "Nuevo Producto"}</h3><button type="button" onClick={() => setIsMenuModalOpen(false)} className="bg-black p-2 rounded-full text-zinc-500 hover:text-white"><X className="w-5 h-5"/></button></div>
                        <form onSubmit={handleSaveMenuItem} className="space-y-5">
                            <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Nombre del Producto</label><input required type="text" placeholder="Ej: Tabla Mar y Tierra" className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-white text-sm outline-none focus:border-[#DAA520] transition-colors" value={currentMenuItem.name} onChange={e => setCurrentMenuItem({...currentMenuItem, name: e.target.value})} /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Categoría Web</label><select className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-white text-sm outline-none focus:border-[#DAA520]" value={currentMenuItem.category} onChange={e => setCurrentMenuItem({...currentMenuItem, category: e.target.value})}><option value="Entradas">Entradas</option><option value="Tablas">Tablas</option><option value="Tragos">Tragos de Autor</option><option value="Botellas">Botellas</option><option value="Bebidas">Bebidas/Mocktails</option></select></div>
                                <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Precio de Venta ($)</label><input type="number" required className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-[#DAA520] font-bold text-lg outline-none" value={currentMenuItem.price || ''} onChange={e => setCurrentMenuItem({...currentMenuItem, price: parseInt(e.target.value)})} /></div>
                            </div>
                            <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Descripción Corta (Ingredientes)</label><textarea rows={3} placeholder="Describa el producto para tentar al cliente..." className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-white text-sm outline-none resize-none" value={currentMenuItem.description || ""} onChange={e => setCurrentMenuItem({...currentMenuItem, description: e.target.value})} /></div>
                            <button disabled={isLoading} type="submit" className="w-full bg-[#DAA520] text-black font-black uppercase tracking-widest py-4 rounded-xl mt-4 hover:bg-[#B8860B] transition-colors flex items-center justify-center gap-2 shadow-xl">{isLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : <><Save className="w-5 h-5"/> Publicar en Web</>}</button>
                        </form>
                    </div>
                </div>
            </div>
        )}

        {/* MODAL EDICIÓN PROMOCIONES */}
        {isPromoModalOpen && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsPromoModalOpen(false)} />
                <div className="bg-zinc-900 border border-white/10 rounded-3xl w-full max-w-4xl relative z-50 shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
                    <div className="w-full md:w-1/3 bg-black/50 border-r border-white/10 p-6 flex flex-col justify-center items-center relative group h-48 md:h-auto shrink-0">
                        <input type="file" ref={fileInputRef} onChange={(e) => handleImageSelect(e, 'promo')} accept="image/*" className="hidden" />
                        <div onClick={triggerFileInput} className="relative w-full h-full max-w-[250px] max-h-[250px] aspect-square rounded-3xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:border-[#DAA520] hover:bg-white/5 transition-all overflow-hidden">
                            {currentPromo.image_url ? (
                                <>
                                    <Image src={currentPromo.image_url} alt="Preview" fill className="object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"><p className="text-xs font-bold text-white uppercase flex items-center gap-2"><ImageIcon className="w-4 h-4"/> Cambiar</p></div>
                                </>
                            ) : (
                                <div className="text-center text-zinc-500"><div className="p-4 bg-zinc-800 rounded-full mb-3 inline-block"><Upload className="w-6 h-6 text-zinc-400"/></div><p className="text-xs font-bold text-zinc-400 uppercase">Banner Promo</p></div>
                            )}
                        </div>
                    </div>
                    <div className="flex-1 p-6 md:p-10 overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4"><h3 className="text-xl font-black text-white uppercase tracking-wider">{currentPromo.id ? "Editar Promoción" : "Crear Promoción"}</h3><button type="button" onClick={() => setIsPromoModalOpen(false)} className="bg-black p-2 rounded-full text-zinc-500 hover:text-white"><X className="w-5 h-5"/></button></div>
                        <form onSubmit={handleSavePromo} className="space-y-4">
                            <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Título Gigante</label><input required type="text" placeholder="Ej: HAPPY HOUR 2x1" className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-white text-sm outline-none focus:border-[#DAA520] transition-colors" value={currentPromo.title} onChange={e => setCurrentPromo({...currentPromo, title: e.target.value})} /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Tipo de Promoción</label><select className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-white text-sm outline-none focus:border-[#DAA520]" value={currentPromo.category} onChange={e => setCurrentPromo({...currentPromo, category: e.target.value})}><option value="semana">Promoción Semanal</option><option value="pack">Pack / Cumpleaños</option><option value="banner">Banner Informativo</option></select></div>
                                <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Precio Referencia ($)</label><input type="number" className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-[#DAA520] font-bold text-lg outline-none" value={currentPromo.price || ''} onChange={e => setCurrentPromo({...currentPromo, price: parseInt(e.target.value)})} /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Día de la semana</label><select className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-white text-sm outline-none focus:border-[#DAA520]" value={currentPromo.day} onChange={e => setCurrentPromo({...currentPromo, day: e.target.value})} disabled={currentPromo.category === 'pack'}><option value="">No Aplica</option><option value="todos">Todos los días</option>{["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"].map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                                <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Etiqueta Visual</label><input type="text" placeholder="Ej: IMPERDIBLE" className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-white text-sm outline-none" value={currentPromo.tag || ""} onChange={e => setCurrentPromo({...currentPromo, tag: e.target.value})} /></div>
                            </div>
                            <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Bajada / Subtítulo</label><input required type="text" placeholder="Ej: Válido hasta las 21:00 hrs" className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-white text-sm outline-none" value={currentPromo.subtitle} onChange={e => setCurrentPromo({...currentPromo, subtitle: e.target.value})} /></div>
                            <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Condiciones o Descripción Larga</label><textarea rows={2} className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-white text-sm outline-none resize-none" value={currentPromo.desc_text || ""} onChange={e => setCurrentPromo({...currentPromo, desc_text: e.target.value})} /></div>
                            <button disabled={isLoading} type="submit" className="w-full bg-[#DAA520] text-black font-black uppercase tracking-widest py-4 rounded-xl mt-4 hover:bg-[#B8860B] transition-colors flex items-center justify-center gap-2 shadow-xl">{isLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : <><Save className="w-5 h-5"/> Lanzar Promoción</>}</button>
                        </form>
                    </div>
                </div>
            </div>
        )}

        {/* MODAL EDICIÓN SHOWS */}
        {isShowModalOpen && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 py-6" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsShowModalOpen(false)} />
                <div className="bg-zinc-900 border border-white/10 rounded-3xl w-full max-w-5xl relative z-50 shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] md:max-h-[85vh]">
                    <div className="w-full md:w-1/3 bg-black/50 border-r border-white/10 p-6 md:p-10 flex flex-col justify-center items-center relative group h-48 md:h-auto shrink-0">
                        <input type="file" ref={fileInputRef} onChange={(e) => handleImageSelect(e, 'show')} accept="image/*" className="hidden" />
                        <div onClick={triggerFileInput} className="relative w-full h-full max-w-[200px] md:max-w-[300px] aspect-[3/4] rounded-3xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:border-[#DAA520] hover:bg-white/5 transition-all overflow-hidden shadow-2xl">
                            {currentShow.image_url ? (
                                <>
                                    <Image src={currentShow.image_url} alt="Preview" fill className="object-cover opacity-80 group-hover:opacity-100 transition-all duration-500" />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"><p className="text-xs font-bold text-white uppercase flex items-center gap-2"><ImageIcon className="w-4 h-4"/> Cambiar Flyer</p></div>
                                </>
                            ) : (
                                <div className="text-center text-zinc-500"><ImageIcon className="w-10 h-10 mx-auto mb-3 opacity-50"/><p className="text-xs font-black tracking-widest text-zinc-400 uppercase">Flyer Vertical</p><p className="text-[10px] mt-1 text-zinc-600">1080x1350px Rec.</p></div>
                            )}
                        </div>
                    </div>
                    <div className="flex-1 p-6 md:p-10 overflow-y-auto custom-scrollbar bg-zinc-900">
                        <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4"><h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-wider">{currentShow.id ? "Configurar Evento" : "Crear Nuevo Evento"}</h3><button type="button" onClick={() => setIsShowModalOpen(false)} className="bg-black p-2 rounded-full text-zinc-500 hover:text-white"><X className="w-6 h-6"/></button></div>
                        <form onSubmit={handleSaveShow} className="space-y-6">
                            
                            <div className="space-y-4">
                                <div><label className="block text-[10px] uppercase font-bold text-[#DAA520] mb-1 tracking-wider">Nombre del Show</label><input required type="text" placeholder="Ej: Fiesta de los 80s" className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-white text-lg font-bold outline-none focus:border-[#DAA520]" value={currentShow.title} onChange={e => setCurrentShow({...currentShow, title: e.target.value})} /></div>
                                <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Subtítulo o Artistas</label><input type="text" placeholder="Ej: Banda en vivo + DJ Invitado" className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-white text-sm outline-none" value={currentShow.subtitle || ""} onChange={e => setCurrentShow({...currentShow, subtitle: e.target.value})} /></div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-black/30 p-4 rounded-2xl border border-white/5">
                                    <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3"/> Fecha Exacta</label><input type="date" required className="w-full bg-black border border-zinc-800 rounded-xl p-3.5 text-white text-sm outline-none focus:border-[#DAA520] scheme-dark" value={currentShow.date_event} onChange={e => setCurrentShow({...currentShow, date_event: e.target.value})} /></div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 flex items-center gap-1"><Clock className="w-3 h-3"/> Inicio</label><input type="time" required className="w-full bg-black border border-zinc-800 rounded-xl p-3.5 text-white text-sm outline-none focus:border-[#DAA520] scheme-dark" value={currentShow.time_event} onChange={e => setCurrentShow({...currentShow, time_event: e.target.value})} /></div>
                                        <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Término</label><input type="time" required className="w-full bg-black border border-zinc-800 rounded-xl p-3.5 text-white text-sm outline-none focus:border-[#DAA520] scheme-dark" value={currentShow.end_time || ""} onChange={e => setCurrentShow({...currentShow, end_time: e.target.value})} /></div>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Ubicación</label><input type="text" readOnly className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-zinc-400 text-sm outline-none cursor-not-allowed" value={currentShow.location} /></div>
                                    <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Etiqueta Visual</label><input type="text" placeholder="Ej: SOLD OUT" className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-white text-sm outline-none focus:border-[#DAA520]" value={currentShow.tag || ""} onChange={e => setCurrentShow({...currentShow, tag: e.target.value})} /></div>
                                </div>
                                
                                <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Descripción Web</label><textarea rows={3} placeholder="Describa el ambiente del evento..." className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-white text-sm outline-none resize-none focus:border-[#DAA520]" value={currentShow.description || ""} onChange={e => setCurrentShow({...currentShow, description: e.target.value})} /></div>
                                
                                <div className="flex items-center gap-3 bg-red-900/10 p-4 rounded-xl border border-red-500/20">
                                    <input type="checkbox" id="adult" checked={currentShow.is_adult || false} onChange={e => setCurrentShow({...currentShow, is_adult: e.target.checked})} className="w-5 h-5 accent-red-500 rounded" />
                                    <label htmlFor="adult" className="text-xs font-bold text-red-400 uppercase flex items-center gap-2 cursor-pointer"><ShieldAlert className="w-4 h-4"/> Evento exclusivo para mayores de 18 años</label>
                                </div>
                            </div>

                            <div className="border-t border-white/10 pt-6">
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2"><Ticket className="w-4 h-4 text-[#DAA520]"/> Entradas Web</h4>
                                        <p className="text-[10px] text-zinc-500">Crea los tickets que la gente podrá comprar online.</p>
                                    </div>
                                    <button type="button" onClick={addTicketType} className="text-xs bg-white text-black px-4 py-2 rounded-xl hover:bg-zinc-200 transition-colors font-bold shadow-lg">+ Añadir Ticket</button>
                                </div>
                                <div className="space-y-3">
                                    {currentShow.tickets && currentShow.tickets.map((ticket: any, index: number) => (
                                        <div key={index} className="flex flex-col sm:flex-row gap-3 items-center bg-black/60 p-4 rounded-2xl border border-white/5">
                                            <div className="w-full sm:flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <input type="text" placeholder="Ej: General Fase 1" className="w-full bg-transparent border-b border-zinc-700 text-sm text-white p-2 outline-none focus:border-[#DAA520]" value={ticket.name} onChange={(e) => updateTicketType(index, 'name', e.target.value)} />
                                                <input type="text" placeholder="Ej: Ingreso válido hasta las 00:00" className="w-full bg-transparent border-b border-zinc-700 text-xs text-zinc-400 p-2 outline-none focus:border-[#DAA520]" value={ticket.desc} onChange={(e) => updateTicketType(index, 'desc', e.target.value)} />
                                            </div>
                                            <div className="w-full sm:w-32 flex items-center gap-3">
                                                <input type="number" placeholder="$ Valor" className="w-full bg-transparent border-b border-zinc-700 text-lg text-[#DAA520] font-black p-2 outline-none text-right placeholder:text-zinc-600" value={ticket.price || ''} onChange={(e) => updateTicketType(index, 'price', e.target.value === '' ? 0 : parseInt(e.target.value))} />
                                                <button type="button" onClick={() => removeTicketType(index)} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"><Trash2 className="w-5 h-5"/></button>
                                            </div>
                                        </div>
                                    ))}
                                    {(!currentShow.tickets || currentShow.tickets.length === 0) && <div className="text-center py-6 border border-dashed border-zinc-800 rounded-2xl"><p className="text-xs text-zinc-500 font-medium">Si no creas tickets, el evento se considerará "Solo con Reserva de Mesa".</p></div>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
                                <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Aforo / Capacidad Total</label><input type="number" required className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-white text-lg font-bold outline-none text-center focus:border-[#DAA520]" value={currentShow.total || ''} onChange={e => setCurrentShow({...currentShow, total: parseInt(e.target.value)})} /></div>
                                <div><label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Cortesías / Vendidas Manual</label><input type="number" className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-zinc-400 text-lg font-bold outline-none text-center focus:border-green-500" value={currentShow.sold || ''} onChange={e => setCurrentShow({...currentShow, sold: parseInt(e.target.value)})} /></div>
                            </div>
                            
                            <button disabled={isLoading} type="submit" className="w-full bg-[#DAA520] text-black font-black uppercase tracking-widest py-5 rounded-xl hover:bg-[#B8860B] transition-colors flex items-center justify-center gap-2 shadow-[0_10px_20px_rgba(218,165,32,0.2)] mt-6">
                                {isLoading ? <Loader2 className="w-6 h-6 animate-spin"/> : <><Save className="w-6 h-6"/> Publicar Evento</>}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        )}

      </main>
    </div>
  );
}