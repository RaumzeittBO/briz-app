import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useStore } from '@/context/StoreContext';
import type { Rental } from '@/context/StoreContext';
import { 
  Trash2, 
  CalendarClock, 
  Info, 
  Phone, 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  Search, 
  Volume2, 
  VolumeX, 
  Check, 
  Ban, 
  Calendar,
  Wallet,
  ExternalLink,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { generateAdminReplyWhatsAppLink } from '@/lib/whatsapp';

// Mappers for Spanish Translation
const statusLabels: Record<string, string> = {
  'pending': 'Pendiente',
  'Pendiente': 'Pendiente',
  'confirmed': 'Confirmado',
  'Confirmado': 'Confirmado',
  'cancelled': 'Cancelado',
  'Cancelado': 'Cancelado',
  'expired': 'Expirado',
};

const statusColors: Record<string, string> = {
  'pending': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  'Pendiente': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  'confirmed': 'bg-green-500/10 text-green-400 border-green-500/20',
  'Confirmado': 'bg-green-500/10 text-green-400 border-green-500/20',
  'cancelled': 'bg-red-500/10 text-red-400 border-red-500/20',
  'Cancelado': 'bg-red-500/10 text-red-400 border-red-500/20',
  'expired': 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

const paymentStatusLabels: Record<string, string> = {
  'unpaid': 'No Pagado',
  'pending_review': 'En Revisión (QR)',
  'paid': 'Pagado',
};

const paymentStatusColors: Record<string, string> = {
  'unpaid': 'bg-red-500/10 text-red-400 border-red-500/20',
  'pending_review': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'paid': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

// Simple visual timer/age component for the "Modo Mostrador" cards
function ReservationAge({ createdAt }: { createdAt?: string }) {
  const [minutes, setMinutes] = useState(0);

  useEffect(() => {
    if (!createdAt) return;
    const calculateMinutes = () => {
      const elapsedMs = Date.now() - new Date(createdAt).getTime();
      setMinutes(Math.max(0, Math.floor(elapsedMs / 60000)));
    };
    calculateMinutes();
    const interval = setInterval(calculateMinutes, 15000); // refresh every 15 seconds
    return () => clearInterval(interval);
  }, [createdAt]);

  const isOld = minutes >= 30;

  return (
    <Badge 
      className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase flex items-center gap-1 border ${
        isOld 
          ? 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse' 
          : minutes >= 15 
            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
            : 'bg-zinc-500/10 text-zinc-400 border-white/5'
      }`}
    >
      <Clock className="w-3 h-3" />
      Hace {minutes} min{minutes !== 1 ? 's' : ''} {isOld ? '⚠️' : ''}
    </Badge>
  );
}

export default function AdminRentalsPage() {
  const { 
    rentals, 
    confirmRental, 
    cancelRental, 
    deleteRental, 
    updateRentalPaymentStatus, 
    markRentalExpired, 
    inventory 
  } = useStore();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [selected, setSelected] = useState<Rental | null>(null);
  
  // Real-time Sound Notification state
  const [soundEnabled, setSoundEnabled] = useState(true);
  const prevPendingCountRef = useRef(0);

  // Play pleasant double-note chime on new pending order arrival
  const playNotificationSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12); // E5
      
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {
      console.warn('Audio contextual play blocked or unsupported', e);
    }
  };

  // Real-time pending checker
  const currentPendingRentals = rentals.filter(r => r.status === 'pending' || r.status === 'Pendiente');
  useEffect(() => {
    const prevCount = prevPendingCountRef.current;
    const currentCount = currentPendingRentals.length;
    
    // If the count of pending rentals increases, play a soft chime!
    if (currentCount > prevCount && soundEnabled) {
      playNotificationSound();
    }
    prevPendingCountRef.current = currentCount;
  }, [currentPendingRentals, soundEnabled]);

  // Today dates for metrics
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Daily statistics
  const stats = {
    pendingToday: rentals.filter(r => 
      (r.status === 'pending' || r.status === 'Pendiente') && 
      (r.createdAt?.startsWith(todayStr) || r.createdDate?.startsWith(todayStr))
    ).length,
    
    confirmedToday: rentals.filter(r => 
      (r.status === 'confirmed' || r.status === 'Confirmado') && 
      (r.updatedAt?.startsWith(todayStr) || r.createdAt?.startsWith(todayStr))
    ).length,

    paidToday: rentals.filter(r => 
      r.paymentStatus === 'paid' && 
      (r.updatedAt?.startsWith(todayStr) || r.createdAt?.startsWith(todayStr))
    ).length,

    expiredToday: rentals.filter(r => 
      (r.status === 'expired') && 
      (r.updatedAt?.startsWith(todayStr) || r.createdAt?.startsWith(todayStr))
    ).length
  };

  // Filter & Search results
  const filtered = rentals
    .filter(r => {
      if (filter !== 'all') {
        if (filter === 'pending') return r.status === 'pending' || r.status === 'Pendiente';
        if (filter === 'confirmed') return r.status === 'confirmed' || r.status === 'Confirmado';
        if (filter === 'cancelled') return r.status === 'cancelled' || r.status === 'Cancelado';
        if (filter === 'expired') return r.status === 'expired';
        return r.status === filter;
      }
      return true;
    })
    .filter(r => {
      const q = search.toLowerCase();
      return (
        r.customerName.toLowerCase().includes(q) || 
        r.productName.toLowerCase().includes(q) ||
        (r.reservationCode && r.reservationCode.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => new Date(b.createdAt || b.createdDate || '').getTime() - new Date(a.createdAt || a.createdDate || '').getTime());

  // Confirm reservation helper with stock verification
  const handleConfirm = async (id: string) => {
    const ok = await confirmRental(id, 'admin');
    if (!ok) {
      alert('Error: ¡No hay stock suficiente en el inventario para confirmar esta reserva!');
      return;
    }
    // Update selected details if modal is active
    if (selected?.id === id) {
      const updated = rentals.find(r => r.id === id);
      if (updated) setSelected(updated);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('¿Seguro que deseas cancelar esta reserva de alquiler? El stock reservado (si corresponde) se restaurará.')) return;
    await cancelRental(id, 'admin');
    if (selected?.id === id) setSelected(null);
  };

  const handleExpire = async (id: string) => {
    if (!confirm('¿Marcar esta reserva como expirada?')) return;
    await markRentalExpired(id, 'admin');
    if (selected?.id === id) setSelected(null);
  };

  const handleMarkPaid = async (id: string, methodText: string) => {
    await updateRentalPaymentStatus(id, 'paid', `admin (${methodText})`);
    if (selected?.id === id) {
      const updated = rentals.find(r => r.id === id);
      if (updated) setSelected(updated);
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm('¿Eliminar definitivamente este registro de la base de datos? Esta acción es irreversible.')) return;
    deleteRental(id);
    if (selected?.id === id) setSelected(null);
  };

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleString('es-ES', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  const getAgeMinutes = (createdAt?: string): number => {
    if (!createdAt) return 0;
    return Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header with sound toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <div className="p-2 bg-brand-yellow/10 rounded-xl">
              <CalendarClock className="w-6 h-6 text-brand-yellow" />
            </div>
            Alquileres
          </h1>
          <p className="text-white/40 text-sm font-medium">Control operativo y confirmación rápida de alquileres</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Real-time Notification Sound toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`rounded-xl text-xs font-black uppercase flex items-center gap-2 h-10 px-4 transition-all ${
              soundEnabled 
                ? 'bg-brand-yellow/10 text-brand-yellow border-brand-yellow/20 hover:bg-brand-yellow/20' 
                : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            {soundEnabled ? 'Sonido: Activado' : 'Sonido: Silenciado'}
          </Button>

          <div className="relative flex-1 sm:flex-initial sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input 
              placeholder="Buscar por cliente, código..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="pl-9 bg-brand-charcoal border-white/10 h-10 rounded-xl text-sm font-bold text-white focus-visible:ring-brand-yellow" 
            />
          </div>
        </div>
      </div>

      {/* KPI Cards section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Pendientes hoy', value: stats.pendingToday, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
          { label: 'Confirmados hoy', value: stats.confirmedToday, color: 'text-green-400 bg-green-500/10 border-green-500/20' },
          { label: 'Pagados hoy', value: stats.paidToday, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
          { label: 'Expirados hoy', value: stats.expiredToday, color: 'text-zinc-400 bg-zinc-500/10 border-white/5' },
        ].map((s, i) => (
          <Card key={i} className="bg-brand-charcoal border-white/5 rounded-xl">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-white/40 tracking-wider mb-1">{s.label}</p>
                <p className="text-2xl font-black text-white">{s.value}</p>
              </div>
              <Badge className={`rounded-lg px-2.5 py-1.5 text-xs font-black uppercase ${s.color}`}>
                Hoy
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ================================================== */}
      {/* ⚡ MODO MOSTRADOR: RESERVAS PENDIENTES */}
      {/* ================================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-wide">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-yellow opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-yellow"></span>
            </span>
            ⚡ Reservas Pendientes Entrantes
          </h2>
          <span className="text-white/40 text-xs font-bold uppercase">
            {currentPendingRentals.length} en cola
          </span>
        </div>

        {currentPendingRentals.length === 0 ? (
          <Card className="bg-brand-charcoal border-white/5 rounded-xl border-dashed">
            <CardContent className="p-10 text-center space-y-2">
              <div className="p-3 bg-green-500/15 text-green-400 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
                <Check className="w-6 h-6" />
              </div>
              <p className="text-white font-black text-sm uppercase">¡Todo al día!</p>
              <p className="text-white/40 text-xs font-bold">No hay reservas pendientes de confirmar en este momento.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentPendingRentals.map(r => {
              const elapsedMin = getAgeMinutes(r.createdAt || r.createdDate);
              const isExpiredWarning = elapsedMin >= 30;

              return (
                <Card 
                  key={r.id} 
                  className={`bg-[#151515] border rounded-2xl transition-all shadow-md overflow-hidden ${
                    isExpiredWarning 
                      ? 'border-red-500/50 shadow-red-500/5 bg-red-950/[0.03]' 
                      : 'border-white/5 hover:border-white/10'
                  }`}
                >
                  <CardContent className="p-5 space-y-4 flex flex-col justify-between h-full">
                    {/* Header line */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-brand-yellow bg-brand-yellow/10 px-2 py-0.5 rounded-lg border border-brand-yellow/20">
                            {r.reservationCode || `ID: ${r.id.slice(-8)}`}
                          </span>
                          <Badge className={`${paymentStatusColors[r.paymentStatus || 'unpaid']} rounded-lg text-[9px] font-bold uppercase border-0`}>
                            {paymentStatusLabels[r.paymentStatus || 'unpaid']}
                          </Badge>
                        </div>
                        <h3 className="text-white font-black text-base">{r.customerName}</h3>
                      </div>
                      <ReservationAge createdAt={r.createdAt || r.createdDate} />
                    </div>

                    {/* Expiration alert banner */}
                    {isExpiredWarning && (
                      <div className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-black uppercase">
                        <AlertTriangle className="w-4 h-4 animate-bounce shrink-0" />
                        <span>¡Alerta! Lleva más de 30 mins sin confirmación</span>
                      </div>
                    )}

                    {/* Rental Details Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-black/30 p-3 rounded-xl border border-white/[0.02]">
                      <div>
                        <p className="text-white/30 font-bold uppercase text-[9px]">Producto</p>
                        <p className="text-white font-black truncate">{r.quantity}x {r.productName}</p>
                        {r.selectedWheelSize && (
                          <span className="text-[10px] text-brand-yellow font-black">Aro {r.selectedWheelSize}</span>
                        )}
                      </div>
                      <div>
                        <p className="text-white/30 font-bold uppercase text-[9px]">Fecha y Hora</p>
                        <p className="text-white font-bold">{r.date} a las {r.pickupTime}</p>
                      </div>
                      <div>
                        <p className="text-white/30 font-bold uppercase text-[9px]">Duración</p>
                        <p className="text-white font-bold">{r.duration}</p>
                      </div>
                      <div>
                        <p className="text-white/30 font-bold uppercase text-[9px]">Método Pago</p>
                        <p className="text-white font-bold uppercase">{r.paymentMethod}</p>
                      </div>
                    </div>

                    {/* Total bs and Notes */}
                    <div className="flex justify-between items-center gap-4">
                      <div>
                        <p className="text-[9px] text-white/30 font-bold uppercase">Monto Total</p>
                        <p className="text-2xl font-black text-brand-yellow">Bs. {r.total}</p>
                      </div>
                      
                      {r.notes && (
                        <div className="text-right max-w-[60%]">
                          <p className="text-[9px] text-white/30 font-bold uppercase">Notas</p>
                          <p className="text-white/60 text-[11px] font-medium italic truncate">{r.notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Fast touch-friendly buttons */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
                      <Button
                        size="sm"
                        onClick={() => handleConfirm(r.id)}
                        className="bg-green-600 hover:bg-green-700 text-white rounded-full h-11 text-xs font-black uppercase flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Confirmar
                      </Button>

                      {r.paymentStatus !== 'paid' ? (
                        <Button
                          size="sm"
                          onClick={() => handleMarkPaid(r.id, r.paymentMethod)}
                          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full h-11 text-[11px] font-black uppercase flex items-center justify-center gap-1"
                        >
                          <Wallet className="w-3.5 h-3.5" /> Pagado
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          disabled
                          className="bg-white/5 text-white/30 rounded-full h-11 text-xs font-black uppercase"
                        >
                          ✓ Pagado
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(generateAdminReplyWhatsAppLink(r.customerPhone, r.reservationCode || '', r.customerName, r.status), '_blank')}
                        className="border-green-500/20 text-green-400 hover:bg-green-500/10 rounded-full h-11 text-xs font-black uppercase flex items-center justify-center gap-1"
                      >
                        <Phone className="w-4 h-4" /> WhatsApp
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleCancel(r.id)}
                        className="bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 rounded-full h-9 text-[10px] font-black uppercase flex items-center justify-center gap-1"
                      >
                        <Ban className="w-3.5 h-3.5" /> Cancelar
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => handleExpire(r.id)}
                        className="bg-[#2D2D2D] hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-full h-9 text-[10px] font-black uppercase flex items-center justify-center gap-1"
                      >
                        <Clock className="w-3.5 h-3.5" /> Expirar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ================================================== */}
      {/* GENERAL LOG LIST & SEARCH */}
      {/* ================================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-t border-white/10 pt-6">
          <h2 className="text-lg font-black text-white uppercase tracking-wide">
            📋 Registro General de Alquileres
          </h2>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {[
            { l: 'Todos', v: 'all' },
            { l: 'Pendientes', v: 'pending' },
            { l: 'Confirmados', v: 'confirmed' },
            { l: 'Cancelados', v: 'cancelled' },
            { l: 'Expirados', v: 'expired' }
          ].map(f => (
            <Button
              key={f.v}
              variant={filter === f.v ? 'default' : 'outline'}
              size="sm"
              className={`rounded-xl text-xs font-black ${
                filter === f.v 
                  ? 'bg-brand-yellow text-brand-black hover:bg-brand-yellow/90' 
                  : 'bg-[#151515] text-white/50 border-white/10 hover:bg-white/5 hover:text-white'
              }`}
              onClick={() => setFilter(f.v)}
            >
              {f.l}
            </Button>
          ))}
        </div>

        {/* General rentals table log */}
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <CalendarClock className="w-12 h-12 text-white/10 mx-auto mb-3" />
              <p className="text-white/20 font-bold text-sm uppercase">Sin alquileres encontrados</p>
            </div>
          ) : (
            filtered.map(r => (
              <div 
                key={r.id} 
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-[#141414] rounded-2xl border border-white/5 hover:border-white/10 hover:bg-white/[0.01] transition-all"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[10px] font-black text-brand-yellow bg-brand-yellow/5 px-2 py-0.5 rounded border border-brand-yellow/10">
                      {r.reservationCode || `ID: ${r.id.slice(-8)}`}
                    </span>
                    <p className="text-white font-black text-sm">{r.customerName}</p>
                    <Badge className={`${statusColors[r.status]} rounded-full px-2 py-0.5 text-[9px] font-black uppercase border`}>
                      {statusLabels[r.status]}
                    </Badge>
                    <Badge className={`${paymentStatusColors[r.paymentStatus || 'unpaid']} rounded-full px-1.5 py-0.2 text-[8px] font-bold uppercase`}>
                      {paymentStatusLabels[r.paymentStatus || 'unpaid']}
                    </Badge>
                  </div>
                  <p className="text-white/50 text-xs font-bold mt-1">
                    {r.quantity}x {r.productName}
                    {r.selectedWheelSize && <span className="text-brand-yellow ml-1">• Aro {r.selectedWheelSize}</span>}
                  </p>
                  <p className="text-white/30 text-[10px] font-bold mt-0.5 uppercase">
                    Agendado: {r.date} a las {r.pickupTime} • Duración: {r.duration} • Pago: {r.paymentMethod}
                  </p>
                </div>

                <div className="flex sm:flex-col items-end justify-between sm:justify-start w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-white/5 shrink-0">
                  <p className="text-brand-yellow font-black text-base">Bs. {r.total}</p>
                  <p className="text-[9px] text-white/20 font-bold">
                    Creado: {formatDateTime(r.createdAt || r.createdDate)}
                  </p>
                </div>

                {/* Actions bar */}
                <div className="flex gap-1.5 shrink-0 w-full sm:w-auto justify-end">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="w-9 h-9 rounded-xl bg-white/5 text-white/40 hover:bg-brand-yellow hover:text-brand-black" 
                    onClick={() => setSelected(r)}
                  >
                    <Info className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="w-9 h-9 rounded-xl bg-white/5 text-red-400/40 hover:bg-red-500 hover:text-white" 
                    onClick={() => handleDelete(r.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ================================================== */}
      {/* RESERVATION DETAIL MODAL */}
      {/* ================================================== */}
      <Dialog open={!!selected} onOpenChange={v => { if (!v) setSelected(null); }}>
        <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto bg-brand-charcoal border border-white/10 text-white p-0 rounded-3xl">
          {selected && (
            <>
              <DialogHeader className="p-6 border-b border-white/5 flex flex-row items-center justify-between">
                <div>
                  <DialogTitle className="text-lg font-black flex items-center gap-2">
                    Detalle de Reserva
                  </DialogTitle>
                  <p className="text-xs text-white/40 font-mono mt-0.5">
                    Cod: {selected.reservationCode || selected.id}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge className={`${statusColors[selected.status]} px-3 py-1 text-xs font-black uppercase rounded-full border`}>
                    {statusLabels[selected.status]}
                  </Badge>
                  <Badge className={`${paymentStatusColors[selected.paymentStatus || 'unpaid']} text-[9px] px-2 py-0.5 rounded-lg border-0`}>
                    {paymentStatusLabels[selected.paymentStatus || 'unpaid']}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="p-6 space-y-4">
                {/* Customer Information Card */}
                <div className="bg-black/40 p-4 rounded-2xl border border-white/5 space-y-2">
                  <h4 className="text-[10px] text-brand-yellow font-black uppercase tracking-widest flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Datos del Cliente
                  </h4>
                  <p className="text-white font-black text-sm">{selected.customerName}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-white/50 font-bold">
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-white/30" /> {selected.customerPhone}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-white/30" /> CI: {selected.customerCI}
                    </p>
                  </div>
                </div>

                {/* Rental Product Snapshot Card */}
                <div className="bg-black/40 p-4 rounded-2xl border border-white/5 space-y-2">
                  <h4 className="text-[10px] text-brand-yellow font-black uppercase tracking-widest flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Detalle del Alquiler
                  </h4>
                  <p className="text-white font-black text-sm">
                    {selected.quantity}x {selected.productNameSnapshot || selected.productName}
                  </p>
                  {selected.selectedWheelSize && (
                    <p className="text-brand-yellow text-xs font-black uppercase">
                      Tamaño Aro: Aro {selected.selectedWheelSize}
                    </p>
                  )}
                  {selected.componentSelections && selected.componentSelections.length > 0 && (
                    <div className="space-y-1 mt-2 pt-2 border-t border-white/5">
                      <p className="text-[9px] text-white/30 font-bold uppercase">Componentes del Combo:</p>
                      {selected.componentSelections.map((cs, i) => {
                        const item = inventory.find(inv => inv.id === cs.inventoryItemId);
                        return (
                          <p key={i} className="text-white/60 text-xs font-bold">
                            • {item?.name || 'Item'} {cs.wheelSize ? `(Aro ${cs.wheelSize})` : ''}
                          </p>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Calendar Schedule Grid */}
                <div className="bg-black/40 p-4 rounded-2xl border border-white/5 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-[9px] text-white/30 font-bold uppercase">Fecha de Entrega</p>
                    <p className="text-white font-bold text-sm mt-0.5">{selected.date}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-white/30 font-bold uppercase">Hora Recogida</p>
                    <p className="text-white font-bold text-sm mt-0.5">{selected.pickupTime}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-white/30 font-bold uppercase">Duración Contratada</p>
                    <p className="text-white font-bold text-sm mt-0.5">{selected.duration}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-white/30 font-bold uppercase">Método Pago</p>
                    <p className="text-white font-bold text-sm mt-0.5 uppercase">{selected.paymentMethod}</p>
                  </div>
                </div>

                {/* Optional payment proof mock preparation */}
                <div className="bg-black/40 p-4 rounded-2xl border border-white/5 space-y-1">
                  <p className="text-[9px] text-white/30 font-bold uppercase">Comprobante de Pago QR (Pre-aprobación)</p>
                  {selected.paymentProofUrl ? (
                    <a 
                      href={selected.paymentProofUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-brand-yellow font-bold text-xs flex items-center gap-1 hover:underline mt-1"
                    >
                      Ver Comprobante Guardado <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <p className="text-white/30 text-xs font-bold italic mt-0.5">
                      Sin comprobante digital cargado.
                    </p>
                  )}
                </div>

                {/* Notes if any */}
                {selected.notes && (
                  <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                    <p className="text-[9px] text-white/30 font-bold uppercase mb-1">Notas / Instrucciones Especiales</p>
                    <p className="text-white/60 text-xs italic">{selected.notes}</p>
                  </div>
                )}

                {/* Timestamps & Audit logs */}
                <div className="bg-black/20 p-3 rounded-xl border border-white/5 text-[9px] text-white/30 space-y-1 font-mono">
                  <p>Creado: {formatDateTime(selected.createdAt || selected.createdDate)}</p>
                  <p>Actualizado: {formatDateTime(selected.updatedAt || selected.createdAt)}</p>
                  {selected.lastUpdatedBy && (
                    <p className="text-brand-yellow/60">Modificado por última vez por: {selected.lastUpdatedBy}</p>
                  )}
                </div>

                {/* Total amount header */}
                <div className="bg-brand-yellow text-brand-black p-5 rounded-2xl text-center shadow-lg">
                  <p className="text-[10px] font-black uppercase tracking-wider mb-1">Monto Total Estimado</p>
                  <p className="text-4xl font-black">Bs. {selected.total}</p>
                </div>

                {/* Action buttons inside Modal */}
                <div className="flex gap-2 pt-2 flex-wrap">
                  {(selected.status === 'pending' || selected.status === 'Pendiente') && (
                    <Button 
                      className="flex-1 h-11 bg-green-600 hover:bg-green-700 text-white font-black rounded-xl text-xs uppercase" 
                      onClick={() => { handleConfirm(selected.id); setSelected(null); }}
                    >
                      Confirmar Reserva
                    </Button>
                  )}

                  {selected.paymentStatus !== 'paid' && (
                    <Button 
                      className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs uppercase" 
                      onClick={() => { handleMarkPaid(selected.id, selected.paymentMethod); }}
                    >
                      Registrar Pago
                    </Button>
                  )}

                  {(selected.status === 'pending' || selected.status === 'Pendiente' || selected.status === 'confirmed' || selected.status === 'Confirmado') && (
                    <Button 
                      className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-xs uppercase" 
                      onClick={() => { handleCancel(selected.id); setSelected(null); }}
                    >
                      Cancelar Alquiler
                    </Button>
                  )}

                  <Button 
                    variant="ghost" 
                    className="w-full h-10 text-white/40 font-bold hover:bg-white/5 hover:text-white rounded-xl text-xs uppercase mt-2" 
                    onClick={() => setSelected(null)}
                  >
                    Cerrar Detalle
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
