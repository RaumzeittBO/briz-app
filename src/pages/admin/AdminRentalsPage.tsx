import { useState, useEffect, useRef, useMemo } from 'react';
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
  'expired': 'bg-zinc-500/10 text-zinc-400 border-white/5',
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

export interface GroupedRental {
  id: string;
  reservationCode: string;
  customerName: string;
  customerPhone: string;
  customerCI: string;
  paymentMethod: string;
  paymentStatus: Rental['paymentStatus'];
  status: Rental['status'];
  createdAt: string;
  createdDate?: string;
  updatedAt: string;
  lastUpdatedBy?: string;
  paymentProofUrl?: string;
  deliveryService?: boolean;
  pickupService?: boolean;
  mapsLink?: string;
  notes?: string;
  items: Rental[];
  total: number;
}

const getGroupedRentals = (rentalsList: Rental[]): GroupedRental[] => {
  const groups: Record<string, GroupedRental> = {};
  
  rentalsList.forEach(r => {
    const code = r.reservationCode || r.id;
    if (!groups[code]) {
      groups[code] = {
        id: code,
        reservationCode: r.reservationCode || '',
        customerName: r.customerName,
        customerPhone: r.customerPhone,
        customerCI: r.customerCI,
        paymentMethod: r.paymentMethod,
        paymentStatus: r.paymentStatus,
        status: r.status,
        createdAt: r.createdAt || r.createdDate || '',
        createdDate: r.createdDate,
        updatedAt: r.updatedAt || '',
        lastUpdatedBy: r.lastUpdatedBy,
        paymentProofUrl: r.paymentProofUrl,
        deliveryService: r.deliveryService,
        pickupService: r.pickupService,
        mapsLink: r.mapsLink,
        notes: r.notes,
        items: [],
        total: 0
      };
    }
    groups[code].items.push(r);
    groups[code].total += r.total || 0;
    
    if (r.deliveryService) groups[code].deliveryService = true;
    if (r.pickupService) groups[code].pickupService = true;
    if (r.mapsLink) groups[code].mapsLink = r.mapsLink;
    if (r.notes && !groups[code].notes?.includes(r.notes)) {
      groups[code].notes = groups[code].notes ? `${groups[code].notes} | ${r.notes}` : r.notes;
    }
    if (r.paymentProofUrl) groups[code].paymentProofUrl = r.paymentProofUrl;
    if (new Date(r.updatedAt || '').getTime() > new Date(groups[code].updatedAt).getTime()) {
      groups[code].updatedAt = r.updatedAt;
      groups[code].lastUpdatedBy = r.lastUpdatedBy;
    }
  });
  
  return Object.values(groups);
};

const comparePhones = (p1?: string, p2?: string): boolean => {
  if (!p1 || !p2) return false;
  const c1 = p1.replace(/\D/g, '').slice(-8);
  const c2 = p2.replace(/\D/g, '').slice(-8);
  return c1.length >= 7 && c1 === c2;
};

const compareCIs = (ci1?: string, ci2?: string): boolean => {
  if (!ci1 || !ci2) return false;
  const c1 = ci1.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const c2 = ci2.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  return c1 === c2;
};

function ReservationAge({ createdAt }: { createdAt?: string }) {
  const [minutes, setMinutes] = useState(0);

  useEffect(() => {
    if (!createdAt) return;
    const calculateMinutes = () => {
      const elapsedMs = Date.now() - new Date(createdAt).getTime();
      setMinutes(Math.max(0, Math.floor(elapsedMs / 60000)));
    };
    calculateMinutes();
    const interval = setInterval(calculateMinutes, 15000);
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
    inventory,
    customers
  } = useStore();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [selected, setSelected] = useState<GroupedRental | null>(null);
  const [showClientProfile, setShowClientProfile] = useState(false);

  useEffect(() => {
    setShowClientProfile(false);
  }, [selected]);
  
  // Real-time Sound Notification state
  const [soundEnabled, setSoundEnabled] = useState(true);
  const prevPendingCountRef = useRef(0);

  const playNotificationSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12);
      
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

  const groupedRentals = useMemo(() => {
    return getGroupedRentals(rentals);
  }, [rentals]);

  const currentPendingGroups = useMemo(() => {
    return groupedRentals.filter(g => g.status === 'pending' || g.status === 'Pendiente');
  }, [groupedRentals]);

  useEffect(() => {
    const prevCount = prevPendingCountRef.current;
    const currentCount = currentPendingGroups.length;
    
    if (currentCount > prevCount && soundEnabled) {
      playNotificationSound();
    }
    prevPendingCountRef.current = currentCount;
  }, [currentPendingGroups, soundEnabled]);

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const stats = {
    pendingToday: groupedRentals.filter(g => 
      (g.status === 'pending' || g.status === 'Pendiente') && 
      (g.createdAt?.startsWith(todayStr) || g.createdDate?.startsWith(todayStr))
    ).length,
    
    confirmedToday: groupedRentals.filter(g => 
      (g.status === 'confirmed' || g.status === 'Confirmado') && 
      (g.updatedAt?.startsWith(todayStr) || g.createdAt?.startsWith(todayStr))
    ).length,

    paidToday: groupedRentals.filter(g => 
      g.paymentStatus === 'paid' && 
      (g.updatedAt?.startsWith(todayStr) || g.createdAt?.startsWith(todayStr))
    ).length,

    expiredToday: groupedRentals.filter(g => 
      (g.status === 'expired') && 
      (g.updatedAt?.startsWith(todayStr) || g.createdAt?.startsWith(todayStr))
    ).length
  };

  const filteredGrouped = useMemo(() => {
    return groupedRentals
      .filter(g => {
        if (filter !== 'all') {
          if (filter === 'pending') return g.status === 'pending' || g.status === 'Pendiente';
          if (filter === 'confirmed') return g.status === 'confirmed' || g.status === 'Confirmado';
          if (filter === 'cancelled') return g.status === 'cancelled' || g.status === 'Cancelado';
          if (filter === 'expired') return g.status === 'expired';
          return g.status === filter;
        }
        return true;
      })
      .filter(g => {
        const q = search.toLowerCase();
        const matchItems = g.items.some(item => item.productName.toLowerCase().includes(q));
        return (
          g.customerName.toLowerCase().includes(q) || 
          g.reservationCode.toLowerCase().includes(q) ||
          matchItems
        );
      })
      .sort((a, b) => new Date(b.createdAt || b.createdDate || '').getTime() - new Date(a.createdAt || a.createdDate || '').getTime());
  }, [groupedRentals, filter, search]);

  const handleConfirmGroup = async (group: GroupedRental) => {
    let allOk = true;
    for (const item of group.items) {
      const ok = await confirmRental(item.id, 'admin');
      if (!ok) {
        allOk = false;
        alert(`Error: ¡No hay stock suficiente para confirmar ${item.quantity}x ${item.productName}!`);
        break;
      }
    }
    if (allOk && selected?.id === group.id) {
      const fresh = getGroupedRentals(rentals).find(g => g.id === group.id);
      if (fresh) setSelected(fresh);
    }
  };

  const handleCancelGroup = async (group: GroupedRental) => {
    if (!confirm('¿Seguro que deseas cancelar esta reserva de alquiler? El stock se restaurará.')) return;
    for (const item of group.items) {
      await cancelRental(item.id, 'admin');
    }
    if (selected?.id === group.id) setSelected(null);
  };

  const handleExpireGroup = async (group: GroupedRental) => {
    if (!confirm('¿Marcar esta reserva como expirada?')) return;
    for (const item of group.items) {
      await markRentalExpired(item.id, 'admin');
    }
    if (selected?.id === group.id) setSelected(null);
  };

  const handleMarkPaidGroup = async (group: GroupedRental, methodText: string) => {
    for (const item of group.items) {
      await updateRentalPaymentStatus(item.id, 'paid', `admin (${methodText})`);
    }
    const fresh = getGroupedRentals(rentals).find(g => g.id === group.id);
    if (fresh) setSelected(fresh);
  };

  const handleDeleteGroup = (group: GroupedRental) => {
    if (!confirm('¿Eliminar definitivamente este registro de la base de datos? Esta acción es irreversible.')) return;
    group.items.forEach(item => deleteRental(item.id));
    if (selected?.id === group.id) setSelected(null);
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

      {/* ⚡ MODO MOSTRADOR: RESERVAS PENDIENTES */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-wide">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-yellow opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-yellow"></span>
            </span>
            ⚡ Reservas Pendientes Entrantes (Agrupadas)
          </h2>
          <span className="text-white/40 text-xs font-bold uppercase">
            {currentPendingGroups.length} en cola
          </span>
        </div>

        {currentPendingGroups.length === 0 ? (
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
            {currentPendingGroups.map(g => {
              const elapsedMin = getAgeMinutes(g.createdAt || g.createdDate);
              const isExpiredWarning = elapsedMin >= 30;

              return (
                <Card 
                  key={g.id} 
                  className={`bg-[#151515] border rounded-2xl transition-all shadow-md overflow-hidden ${
                    isExpiredWarning 
                      ? 'border-red-500/50 shadow-red-500/5 bg-red-950/[0.03]' 
                      : 'border-white/5 hover:border-white/10'
                  }`}
                >
                  <CardContent className="p-5 space-y-4 flex flex-col justify-between h-full">
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-black text-brand-yellow bg-brand-yellow/10 px-2 py-0.5 rounded-lg border border-brand-yellow/20">
                            {g.reservationCode || `ID: ${g.id.slice(-8)}`}
                          </span>
                          <Badge className={`${paymentStatusColors[g.paymentStatus || 'unpaid']} rounded-lg text-[9px] font-bold uppercase border-0`}>
                            {paymentStatusLabels[g.paymentStatus || 'unpaid']}
                          </Badge>
                        </div>
                        <h3 className="text-white font-black text-base">{g.customerName}</h3>
                      </div>
                      <ReservationAge createdAt={g.createdAt || g.createdDate} />
                    </div>

                    {isExpiredWarning && (
                      <div className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-black uppercase">
                        <AlertTriangle className="w-4 h-4 animate-bounce shrink-0" />
                        <span>¡Alerta! Lleva más de 30 mins sin confirmación</span>
                      </div>
                    )}

                    {/* Group Items list */}
                    <div className="space-y-2 text-xs bg-black/30 p-3 rounded-xl border border-white/[0.02]">
                      <p className="text-white/30 font-bold uppercase text-[9px]">Productos contratados</p>
                      <div className="space-y-1 font-sans">
                        {g.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-white font-black">
                            <span>{item.quantity}x {item.productName}</span>
                            {item.selectedWheelSize && <span className="text-[10px] text-brand-yellow">Aro {item.selectedWheelSize}</span>}
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-white/5 text-[11px] text-white/50">
                        <p>📅 {g.items[0]?.date}</p>
                        <p>🕒 {g.items[0]?.pickupTime}</p>
                        <p>⏳ {g.items[0]?.duration}</p>
                        <p className="uppercase">💳 {g.paymentMethod}</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center gap-4">
                      <div>
                        <p className="text-[9px] text-white/30 font-bold uppercase">Monto Total</p>
                        <p className="text-2xl font-black text-brand-yellow">Bs. {g.total}</p>
                      </div>
                      {g.notes && (
                        <div className="text-right max-w-[60%]">
                          <p className="text-[9px] text-white/30 font-bold uppercase">Notas</p>
                          <p className="text-white/60 text-[11px] font-medium italic truncate">{g.notes}</p>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
                      <Button
                        size="sm"
                        onClick={() => handleConfirmGroup(g)}
                        className="bg-green-600 hover:bg-green-700 text-white rounded-full h-11 text-xs font-black uppercase flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Confirmar
                      </Button>

                      {g.paymentStatus !== 'paid' ? (
                        <Button
                          size="sm"
                          onClick={() => handleMarkPaidGroup(g, g.paymentMethod)}
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
                        onClick={() => window.open(generateAdminReplyWhatsAppLink(g.customerPhone, g.reservationCode || '', g.customerName, g.status), '_blank')}
                        className="border-green-500/20 text-green-400 hover:bg-green-500/10 rounded-full h-11 text-xs font-black uppercase flex items-center justify-center gap-1"
                      >
                        <Phone className="w-4 h-4" /> WhatsApp
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleCancelGroup(g)}
                        className="bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 rounded-full h-9 text-[10px] font-black uppercase flex items-center justify-center gap-1"
                      >
                        <Ban className="w-3.5 h-3.5" /> Cancelar
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => handleExpireGroup(g)}
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

      {/* GENERAL LOG LIST & SEARCH */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-t border-white/10 pt-6">
          <h2 className="text-lg font-black text-white uppercase tracking-wide">
            📋 Registro General de Alquileres (Agrupados)
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
          {filteredGrouped.length === 0 ? (
            <div className="text-center py-16">
              <CalendarClock className="w-12 h-12 text-white/10 mx-auto mb-3" />
              <p className="text-white/20 font-bold text-sm uppercase">Sin alquileres encontrados</p>
            </div>
          ) : (
            filteredGrouped.map(g => (
              <div 
                key={g.id} 
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-[#141414] rounded-2xl border border-white/5 hover:border-white/10 hover:bg-white/[0.01] transition-all"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[10px] font-black text-brand-yellow bg-brand-yellow/5 px-2 py-0.5 rounded border border-brand-yellow/10">
                      {g.reservationCode || `ID: ${g.id.slice(-8)}`}
                    </span>
                    <p className="text-white font-black text-sm">{g.customerName}</p>
                    <Badge className={`${statusColors[g.status]} rounded-full px-2 py-0.5 text-[9px] font-black uppercase border`}>
                      {statusLabels[g.status]}
                    </Badge>
                    <Badge className={`${paymentStatusColors[g.paymentStatus || 'unpaid']} rounded-full px-1.5 py-0.2 text-[8px] font-bold uppercase`}>
                      {paymentStatusLabels[g.paymentStatus || 'unpaid']}
                    </Badge>
                  </div>
                  <div className="text-white/50 text-xs font-bold mt-1 font-sans flex flex-wrap gap-1.5">
                    {g.items.map((item, idx) => (
                      <span key={idx} className="bg-white/[0.03] border border-white/5 px-2 py-0.5 rounded text-[11px]">
                        {item.quantity}x {item.productName} {item.selectedWheelSize ? `(Aro ${item.selectedWheelSize})` : ''}
                      </span>
                    ))}
                  </div>
                  <p className="text-white/30 text-[10px] font-bold mt-1.5 uppercase">
                    Agendado: {g.items[0]?.date} a las {g.items[0]?.pickupTime} • Duración: {g.items[0]?.duration} • Pago: {g.paymentMethod}
                  </p>
                </div>

                <div className="flex sm:flex-col items-end justify-between sm:justify-start w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-white/5 shrink-0">
                  <p className="text-brand-yellow font-black text-base">Bs. {g.total}</p>
                  <p className="text-[9px] text-white/20 font-bold">
                    Creado: {formatDateTime(g.createdAt)}
                  </p>
                </div>

                {/* Actions bar */}
                <div className="flex gap-1.5 shrink-0 w-full sm:w-auto justify-end">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="w-9 h-9 rounded-xl bg-white/5 text-white/40 hover:bg-brand-yellow hover:text-brand-black" 
                    onClick={() => setSelected(g)}
                  >
                    <Info className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="w-9 h-9 rounded-xl bg-white/5 text-red-400/40 hover:bg-red-500 hover:text-white" 
                    onClick={() => handleDeleteGroup(g)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RESERVATION DETAIL MODAL */}
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

                  {/* Expandable client profile search */}
                  {(() => {
                    const matchingCustomer = customers.find(
                      c => comparePhones(c.phone, selected.customerPhone) || 
                           compareCIs(c.ci, selected.customerCI)
                    );

                    if (!matchingCustomer) {
                      return (
                        <p className="text-[9px] text-white/20 italic mt-2 border-t border-white/5 pt-2">
                          Cliente no registrado en el sistema.
                        </p>
                      );
                    }

                    return (
                      <div className="border-t border-white/5 pt-2 mt-2 space-y-2">
                        <button
                          type="button"
                          onClick={() => setShowClientProfile(!showClientProfile)}
                          className="w-full flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-brand-yellow bg-brand-yellow/10 hover:bg-brand-yellow/20 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          <span>{showClientProfile ? '▲ Ocultar Ficha Cliente' : '▼ Ver Ficha de Registro del Cliente'}</span>
                          <Badge className="bg-brand-yellow text-brand-black text-[8px] font-black border-0">REGISTRADO</Badge>
                        </button>

                        {showClientProfile && (
                          <div className="bg-black/30 p-3 rounded-xl space-y-3 mt-2 border border-white/5 animate-in slide-in-from-top duration-200">
                            {/* Profile Pic preview */}
                            {matchingCustomer.autofotoUrl && (
                              <div className="flex flex-col items-center">
                                <p className="text-[8px] text-white/30 font-bold uppercase mb-1">Foto de Rostro</p>
                                <div className="w-24 h-24 rounded-full overflow-hidden border border-brand-yellow/30 bg-black/40 shadow-md">
                                  <a href={matchingCustomer.autofotoUrl} target="_blank" rel="noreferrer">
                                    <img src={matchingCustomer.autofotoUrl} className="w-full h-full object-cover hover:scale-105 transition-transform" alt="selfie" />
                                  </a>
                                </div>
                              </div>
                            )}
                            
                            <div className="grid grid-cols-1 gap-1 text-[11px] font-medium text-white/60">
                              {matchingCustomer.email && (
                                <p>📧 <span className="font-bold text-white">Email:</span> {matchingCustomer.email}</p>
                              )}
                              {matchingCustomer.nacionalidad && (
                                <p>🌍 <span className="font-bold text-white">Nac:</span> {matchingCustomer.nacionalidad} {matchingCustomer.departamento ? `(${matchingCustomer.departamento})` : ''}</p>
                              )}
                              {matchingCustomer.comoNosConociste && (
                                <p>📢 <span className="font-bold text-white">Referencia:</span> {matchingCustomer.comoNosConociste}</p>
                              )}
                            </div>

                            {/* Documento preview */}
                            {matchingCustomer.documentoUrl && (
                              <div className="flex flex-col items-center pt-2 border-t border-white/5 mt-1">
                                <p className="text-[8px] text-white/30 font-bold uppercase mb-1">Documento de Identidad</p>
                                {matchingCustomer.documentoUrl.toLowerCase().includes('.pdf') ? (
                                  <a 
                                    href={matchingCustomer.documentoUrl} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-brand-yellow bg-brand-yellow/10 hover:bg-brand-yellow/20 px-4 py-2 rounded-xl transition-all cursor-pointer"
                                  >
                                    📄 Ver Documento PDF
                                  </a>
                                ) : (
                                  <div className="max-w-xs h-36 rounded-xl overflow-hidden border border-white/10 bg-black/40 shadow-inner">
                                    <a href={matchingCustomer.documentoUrl} target="_blank" rel="noreferrer">
                                      <img src={matchingCustomer.documentoUrl} className="w-full h-full object-contain hover:scale-105 transition-transform" alt="documento" />
                                    </a>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Rental Products Snapshot Card */}
                <div className="bg-black/40 p-4 rounded-2xl border border-white/5 space-y-2">
                  <h4 className="text-[10px] text-brand-yellow font-black uppercase tracking-widest flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Detalle del Alquiler
                  </h4>
                  <div className="space-y-3 font-sans">
                    {selected.items.map((item, index) => (
                      <div key={index} className="border-b border-white/5 last:border-b-0 pb-2.5 last:pb-0">
                        <p className="text-white font-black text-sm">
                          {item.quantity}x {item.productNameSnapshot || item.productName}
                        </p>
                        {item.selectedWheelSize && (
                          <p className="text-brand-yellow text-xs font-black uppercase mt-0.5">
                            Tamaño Aro: Aro {item.selectedWheelSize}
                          </p>
                        )}
                        {item.componentSelections && item.componentSelections.length > 0 && (
                          <div className="space-y-1 mt-1.5 pl-3 border-l border-white/10">
                            <p className="text-[8px] text-white/30 font-bold uppercase">Componentes del Combo:</p>
                            {item.componentSelections.map((cs, i) => {
                              const invItem = inventory.find(inv => inv.id === cs.inventoryItemId);
                              return (
                                <p key={i} className="text-white/60 text-xs font-bold">
                                  • {invItem?.name || 'Item'} {cs.wheelSize ? `(Aro ${cs.wheelSize})` : ''}
                                </p>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Calendar Schedule Grid */}
                <div className="bg-black/40 p-4 rounded-2xl border border-white/5 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-[9px] text-white/30 font-bold uppercase">Fecha de Entrega</p>
                    <p className="text-white font-bold text-sm mt-0.5">{selected.items[0]?.date}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-white/30 font-bold uppercase">Hora Recogida</p>
                    <p className="text-white font-bold text-sm mt-0.5">{selected.items[0]?.pickupTime}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-white/30 font-bold uppercase">Duración Contratada</p>
                    <p className="text-white font-bold text-sm mt-0.5">{selected.items[0]?.duration}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-white/30 font-bold uppercase">Método Pago</p>
                    <p className="text-white font-bold text-sm mt-0.5 uppercase">{selected.paymentMethod}</p>
                  </div>
                </div>

                {/* Transportation Details (Delivery / Pickup Maps Link) */}
                {(selected.deliveryService || selected.pickupService || selected.mapsLink) && (
                  <div className="bg-brand-yellow/10 p-4 rounded-2xl border border-brand-yellow/20 space-y-2 text-xs">
                    <p className="text-[9px] text-brand-yellow font-black uppercase tracking-wider font-maiandra">
                      Servicio de Transporte a Domicilio
                    </p>
                    <div className="space-y-1 text-white/90 font-medium font-sans">
                      {selected.deliveryService && (
                        <p className="flex items-center gap-1.5 font-bold">
                          🚚 Requiere Servicio de Entrega (+Bs. 30)
                        </p>
                      )}
                      {selected.pickupService && (
                        <p className="flex items-center gap-1.5 font-bold">
                          🔄 Requiere Servicio de Recojo (+Bs. 30)
                        </p>
                      )}
                      {selected.mapsLink ? (
                        <div className="pt-1.5">
                          <a 
                            href={selected.mapsLink} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-brand-yellow hover:underline font-black flex items-center gap-1.5 bg-brand-yellow/20 px-3.5 py-2 rounded-xl w-fit transition-transform active:scale-95"
                          >
                            📍 Ver Dirección en Google Maps <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      ) : (
                        <p className="text-white/30 italic text-[11px] mt-1">Sin enlace de ubicación registrado.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Payment proof */}
                <div className="bg-black/40 p-4 rounded-2xl border border-white/5 space-y-1">
                  <p className="text-[9px] text-white/30 font-bold uppercase">Comprobante de Pago QR</p>
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
                  <p>Creado: {formatDateTime(selected.createdAt)}</p>
                  <p>Actualizado: {formatDateTime(selected.updatedAt)}</p>
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
                <div className="flex gap-2 pt-2 flex-wrap font-sans">
                  {(selected.status === 'pending' || selected.status === 'Pendiente') && (
                    <Button 
                      className="flex-1 h-11 bg-green-600 hover:bg-green-700 text-white font-black rounded-xl text-xs uppercase cursor-pointer" 
                      onClick={() => { handleConfirmGroup(selected); setSelected(null); }}
                    >
                      Confirmar Reserva
                    </Button>
                  )}

                  {selected.paymentStatus !== 'paid' && (
                    <Button 
                      className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs uppercase cursor-pointer" 
                      onClick={() => { handleMarkPaidGroup(selected, selected.paymentMethod); }}
                    >
                      Registrar Pago
                    </Button>
                  )}

                  {(selected.status === 'pending' || selected.status === 'Pendiente' || selected.status === 'confirmed' || selected.status === 'Confirmado') && (
                    <Button 
                      className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-xs uppercase cursor-pointer" 
                      onClick={() => { handleCancelGroup(selected); setSelected(null); }}
                    >
                      Cancelar Alquiler
                    </Button>
                  )}

                  <Button 
                    variant="ghost" 
                    className="w-full h-10 text-white/40 font-bold hover:bg-white/5 hover:text-white rounded-xl text-xs uppercase mt-2 cursor-pointer" 
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
