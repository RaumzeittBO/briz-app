import { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useStore } from '@/context/StoreContext';
import { FileUploader } from '@/components/ui/file-uploader';
import type { Rental } from '@/context/StoreContext';
import { toBoliviaDateString } from '@/lib/dateUtils';
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
  AlertTriangle,
  Edit3,
  Save,
  Minus,
  Plus,
  ShoppingBag,
  Users,
  Bike,
  RotateCcw
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { generateAdminReplyWhatsAppLink } from '@/lib/whatsapp';
import { runAdminRentalAction, updateRentalGroup } from '@/lib/backend';

// Mappers for Spanish Translation
const statusLabels: Record<string, string> = {
  'pending': 'Pendiente',
  'Pendiente': 'Pendiente',
  'confirmed': 'Confirmado',
  'Confirmado': 'Confirmado',
  'delivered': 'Entregado (En Uso)',
  'Entregado': 'Entregado (En Uso)',
  'cancelled': 'Cancelado',
  'Cancelado': 'Cancelado',
  'expired': 'Expirado',
  'returned': 'Devuelto',
  'Devuelto': 'Devuelto',
};

const statusColors: Record<string, string> = {
  'pending': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  'Pendiente': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  'confirmed': 'bg-green-500/10 text-green-400 border-green-500/20',
  'Confirmado': 'bg-green-500/10 text-green-400 border-green-500/20',
  'delivered': 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  'Entregado': 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  'cancelled': 'bg-red-500/10 text-red-400 border-red-500/20',
  'Cancelado': 'bg-red-500/10 text-red-400 border-red-500/20',
  'expired': 'bg-zinc-500/10 text-zinc-400 border-white/5',
  'returned': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Devuelto': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
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
  deliveredAt?: string;
  returnedAt?: string;
  damagedOnReturn?: boolean;
  returnConditionNotes?: string;
  lateFee?: number;
  items: Rental[];
  total: number;
}

type RentalEditItem = {
  id: string;
  isNew?: boolean;
  productId: string;
  productName: string;
  productType: 'single' | 'combo';
  selectedWheelSize?: string;
  quantity: number;
  total: number;
};

type RentalEditForm = {
  date: string;
  pickupTime: string;
  duration: string;
  deliveryService: boolean;
  pickupService: boolean;
  mapsLink: string;
  notes: string;
  items: RentalEditItem[];
};

const buildEditForm = (group: GroupedRental): RentalEditForm => ({
  date: group.items[0]?.date || '',
  pickupTime: group.items[0]?.pickupTime || '',
  duration: group.items[0]?.duration || '',
  deliveryService: Boolean(group.deliveryService),
  pickupService: Boolean(group.pickupService),
  mapsLink: group.mapsLink || '',
  notes: group.notes || '',
  items: group.items.map(item => ({
    id: item.id,
    productId: item.productId,
    productName: item.productNameSnapshot || item.productName,
    productType: item.productType || 'single',
    selectedWheelSize: item.selectedWheelSize || '',
    quantity: item.quantity,
    total: item.total || 0,
  })),
});

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
        deliveredAt: r.deliveredAt,
        returnedAt: r.returnedAt,
        damagedOnReturn: r.damagedOnReturn,
        returnConditionNotes: r.returnConditionNotes,
        lateFee: r.lateFee,
        items: [],
        total: 0
      };
    }
    groups[code].items.push(r);
    groups[code].total += r.total || 0;
    
    if (r.deliveryService) groups[code].deliveryService = true;
    if (r.pickupService) groups[code].pickupService = true;
    if (r.mapsLink) groups[code].mapsLink = r.mapsLink;
    if (r.deliveredAt) groups[code].deliveredAt = r.deliveredAt;
    if (r.returnedAt) groups[code].returnedAt = r.returnedAt;
    if (r.damagedOnReturn) groups[code].damagedOnReturn = true;
    if (r.returnConditionNotes) groups[code].returnConditionNotes = r.returnConditionNotes;
    if (r.lateFee && (!groups[code].lateFee || r.lateFee > groups[code].lateFee!)) {
      groups[code].lateFee = r.lateFee;
    }
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

const getReturnDateTime = (dateStr: string, pickupTimeStr: string, durationStr: string): Date => {
  const [year, month, day] = (dateStr || '2026-01-01').split('-').map(Number);
  const [hours, minutes] = (pickupTimeStr || '09:00').split(':').map(Number);
  const startDate = new Date(year, month - 1, day, hours || 9, minutes || 0, 0, 0);
  
  let durationHours = 24;
  const norm = (durationStr || '').toLowerCase();
  if (norm.includes('semana') || norm.includes('week')) durationHours = 24 * 7;
  else if (norm.includes('mes') || norm.includes('month')) durationHours = 24 * 30;
  else {
    const match = norm.match(/\d+/);
    if (match) durationHours = Number(match[0]);
  }
  
  startDate.setHours(startDate.getHours() + durationHours);
  return startDate;
};

const isPastDue = (group: GroupedRental): boolean => {
  const firstItem = group.items[0];
  if (!firstItem) return false;
  const isActive =
    group.status === 'confirmed' ||
    group.status === 'Confirmado' ||
    group.status === 'delivered' ||
    group.status === 'Entregado';
  if (!isActive) return false;
  
  const returnDate = getReturnDateTime(firstItem.date, firstItem.pickupTime, firstItem.duration);
  return returnDate.getTime() < Date.now();
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
    inventory,
    combos,
    customers,
    calculatePrice,
    createRentalGroup,
    bikeCategories
  } = useStore();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [selected, setSelected] = useState<GroupedRental | null>(null);
  const [showClientProfile, setShowClientProfile] = useState(false);
  const [editingOrder, setEditingOrder] = useState(false);
  const [editForm, setEditForm] = useState<RentalEditForm | null>(null);
  const [searchProductQuery, setSearchProductQuery] = useState('');

  // Return modal state (for damaged units / condition notes / late fees)
  const [returnModalGroup, setReturnModalGroup] = useState<GroupedRental | null>(null);
  const [returnDamagedUnits, setReturnDamagedUnits] = useState(0);
  const [returnNotes, setReturnNotes] = useState('');
  const actionLockRef = useRef(new Set<string>());
  const [busyActionKey, setBusyActionKey] = useState<string | null>(null);

  // Manual Rental Wizard States
  const [newRentalModalOpen, setNewRentalModalOpen] = useState(false);
  const manualCreateLockRef = useRef(false);
  const [creatingManualRental, setCreatingManualRental] = useState(false);
  const [newRentalStep, setNewRentalStep] = useState(1);
  const [newRentalCart, setNewRentalCart] = useState<any[]>([]);
  const [newRentalForm, setNewRentalForm] = useState({
      date: toBoliviaDateString(),
      pickupTime: new Date().toTimeString().slice(0, 5),
      duration: '1 hora',
      deliveryService: false,
      pickupService: false,
      mapsLink: '',
      notes: '',
      paymentMethod: 'efectivo',
      paymentStatus: 'paid' as 'unpaid' | 'paid',
      status: 'confirmed' as 'confirmed' | 'pending'
  });
  const [newRentalCustomerMode, setNewRentalCustomerMode] = useState<'existing' | 'new'>('existing');
  const [newRentalSelectedCustomerId, setNewRentalSelectedCustomerId] = useState<string | null>(null);
  const [newRentalCustomerSearchQuery, setNewRentalCustomerSearchQuery] = useState('');
  const [newRentalCustomerData, setNewRentalCustomerData] = useState({
      name: '',
      phone: '',
      ci: '',
      email: '',
      nacionalidad: '',
      departamento: '',
      comoNosConociste: '',
      autofotoUrl: '',
      documentoUrl: '',
      documentoReversoUrl: ''
  });

  useEffect(() => {
    setShowClientProfile(false);
    setEditingOrder(false);
    setEditForm(selected ? buildEditForm(selected) : null);
    setSearchProductQuery('');
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

  const todayStr = toBoliviaDateString();

  const stats = {
    pendingToday: groupedRentals.filter(g => 
      (g.status === 'pending' || g.status === 'Pendiente') && 
      (toBoliviaDateString(g.createdAt || g.createdDate || '') === todayStr || g.items[0]?.date === todayStr)
    ).length,
    
    confirmedToday: groupedRentals.filter(g => 
      (g.status === 'confirmed' || g.status === 'Confirmado' || g.status === 'delivered' || g.status === 'Entregado') && 
      (toBoliviaDateString(g.updatedAt || g.createdAt || '') === todayStr || g.items[0]?.date === todayStr)
    ).length,

    paidToday: groupedRentals.filter(g => 
      g.paymentStatus === 'paid' && 
      (toBoliviaDateString(g.updatedAt || g.createdAt || '') === todayStr || g.items[0]?.date === todayStr)
    ).length,

    expiredToday: groupedRentals.filter(g => 
      (g.status === 'expired') && 
      (toBoliviaDateString(g.updatedAt || g.createdAt || '') === todayStr)
    ).length
  };

  const filteredGrouped = useMemo(() => {
    return groupedRentals
      .filter(g => {
        if (filter !== 'all') {
          if (filter === 'pending') return g.status === 'pending' || g.status === 'Pendiente';
          if (filter === 'confirmed') return g.status === 'confirmed' || g.status === 'Confirmado';
          if (filter === 'delivered') return g.status === 'delivered' || g.status === 'Entregado';
          if (filter === 'returned') return g.status === 'returned' || g.status === 'Devuelto';
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

  const runExclusiveAction = async (key: string, operation: () => Promise<void>) => {
    if (actionLockRef.current.has(key)) return false;
    actionLockRef.current.add(key);
    setBusyActionKey(key);
    try { await operation(); return true; }
    finally {
      actionLockRef.current.delete(key);
      setBusyActionKey(current => current === key ? null : current);
    }
  };

  const handleConfirmGroup = async (group: GroupedRental) => {
    const ids = group.items.map(item => item.id);
    try {
      const completed = await runExclusiveAction(`confirm:${group.id}`, async () => {
        await runAdminRentalAction('confirm', ids);
        if (selected?.id === group.id) setSelected(prev => prev?.id === group.id ? {
          ...prev, status: 'confirmed', items: prev.items.map(item => ({ ...item, status: 'confirmed' }))
        } : prev);
      });
      return completed;
    } catch (error) {
      alert(`Error al confirmar la reserva:\n${error instanceof Error ? error.message : 'No hay stock disponible para todos los componentes.'}`);
      return false;
    }
  };

  const handleDeliverGroup = async (group: GroupedRental) => {
    const ids = group.items.map(item => item.id);
    await runExclusiveAction(`deliver:${group.id}`, async () => { await runAdminRentalAction('deliver', ids); });
    if (selected?.id === group.id) {
      setSelected(prev => {
        if (!prev || prev.id !== group.id) return prev;
        return {
          ...prev,
          status: 'delivered',
          deliveredAt: new Date().toISOString(),
          items: prev.items.map(item => ({ ...item, status: 'delivered' }))
        };
      });
    }
  };

  const handleCancelGroup = async (group: GroupedRental) => {
    if (!confirm('¿Seguro que deseas cancelar esta reserva de alquiler? Si estaba confirmada, el stock se restaurará automáticamente.')) return;
    const ids = group.items.map(item => item.id);
    await runExclusiveAction(`cancel:${group.id}`, async () => { await runAdminRentalAction('cancel', ids); });
    if (selected?.id === group.id) setSelected(null);
  };

  const openReturnDialog = (group: GroupedRental) => {
    setReturnModalGroup(group);
    setReturnDamagedUnits(0);
    setReturnNotes('');
  };

  const handleConfirmReturnGroup = async () => {
    if (!returnModalGroup) return;
    const ids = returnModalGroup.items.map(item => item.id);
    await runExclusiveAction(`return:${returnModalGroup.id}`, async () => { await runAdminRentalAction('return', ids, { damagedUnits: returnDamagedUnits, conditionNotes: returnNotes.trim() || undefined }); });

    setReturnModalGroup(null);
    if (selected?.id === returnModalGroup.id) setSelected(null);
    alert(
      returnDamagedUnits > 0
        ? 'Devolución registrada. Las unidades dañadas quedaron apartadas en Mantenimiento/Taller y los demás accesorios fueron liberados.'
        : '¡Devolución registrada con éxito! Todas las bicicletas y accesorios volvieron al stock disponible.'
    );
  };

  const handleExpireGroup = async (group: GroupedRental) => {
    if (!confirm('¿Marcar esta reserva como expirada?')) return;
    await runAdminRentalAction('expire', group.items.map(item => item.id));
    if (selected?.id === group.id) setSelected(null);
  };

  const handleMarkPaidGroup = async (group: GroupedRental, methodText: string) => {
    await runExclusiveAction(`payment:${group.id}`, async () => { await runAdminRentalAction('payment', group.items.map(item => item.id), { paymentStatus: 'paid', paymentMethodNote: methodText }); });
    if (selected?.id === group.id) {
      setSelected(prev => {
        if (!prev || prev.id !== group.id) return prev;
        return {
          ...prev,
          paymentStatus: 'paid',
          items: prev.items.map(item => ({ ...item, paymentStatus: 'paid' }))
        };
      });
    }
  };

  const handleDeleteGroup = async (group: GroupedRental) => {
    if (!confirm('¿Cancelar este alquiler? El registro y su historial de pagos se conservarán.')) return;
    const ids = group.items.map(item => item.id);
    await runAdminRentalAction('cancel', ids);
    if (selected?.id === group.id) setSelected(null);
  };

  const recalcEditItemPrice = (productType: 'single' | 'combo', productId: string, durationStr: string, qty: number, fallbackTotal: number) => {
    if (productId.startsWith('srv_')) return fallbackTotal;
    const computed = calculatePrice(productType, productId, durationStr, qty);
    return computed > 0 ? computed : fallbackTotal;
  };

  const handleEditDurationChange = (newDuration: string) => {
    setEditForm(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        duration: newDuration,
        items: prev.items.map(item => ({
          ...item,
          total: recalcEditItemPrice(item.productType, item.productId, newDuration, item.quantity, item.total)
        }))
      };
    });
  };

  const updateEditItem = (id: string, updates: Partial<RentalEditItem>) => {
    setEditForm(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map(item => {
          if (item.id !== id) return item;
          const next = { ...item, ...updates };
          if (updates.quantity !== undefined && updates.total === undefined) {
            next.total = recalcEditItemPrice(next.productType, next.productId, prev.duration, next.quantity, next.total);
          }
          return next;
        })
      };
    });
  };

  const removeEditItem = (id: string) => {
    setEditForm(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.filter(item => item.id !== id)
      };
    });
  };

  const handleSaveEditedGroup = async () => {
    if (!selected || !editForm) return;
    await runExclusiveAction(`edit:${selected.id}`, async () => { await updateRentalGroup({
      reservationCode: selected.reservationCode || selected.id,
      rentalIds: selected.items.map(item => item.id),
      date: editForm.date, pickupTime: editForm.pickupTime, duration: editForm.duration,
      deliveryService: editForm.deliveryService, pickupService: editForm.pickupService,
      mapsLink: editForm.mapsLink, notes: editForm.notes,
      items: editForm.items.map(item => ({ id: item.isNew ? '' : item.id, productId: item.productId, productType: item.productType, quantity: Math.max(1, item.quantity), selectedWheelSize: item.selectedWheelSize || '' })),
    }); });

    setEditingOrder(false);
    setSelected(null);
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

  // Manual Rental Wizard Helpers
  const [wizardSearch, setWizardSearch] = useState('');
  const [wizardCategory, setWizardCategory] = useState('all');
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});

  const getCartTotal = () => {
    return newRentalCart.reduce((total, item) => {
      const isCombo = item.product.components !== undefined;
      const price = calculatePrice(
        isCombo ? 'combo' : 'single',
        item.product.id,
        newRentalForm.duration,
        1
      );
      return total + price * item.quantity;
    }, 0);
  };

  const wizardBikesAndCombos = useMemo(() => {
    const bList = inventory.filter(i => (i.itemType === 'bike' || i.itemType === 'accessory') && (!i.availableForSale || i.availableForRental));
    const cList = combos.filter(c => !c.availableForSale || c.availableForRental);
    
    const combined = [
      ...bList.map(b => ({ ...b, type: 'single' })),
      ...cList.map(c => ({ ...c, type: 'combo' }))
    ];

    return combined.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(wizardSearch.toLowerCase());
      const matchesCat = wizardCategory === 'all' || item.category === wizardCategory;
      return matchesSearch && matchesCat;
    });
  }, [inventory, combos, wizardSearch, wizardCategory]);

  const filteredCustomersForWizard = useMemo(() => {
    if (!newRentalCustomerSearchQuery.trim()) return [];
    const query = newRentalCustomerSearchQuery.toLowerCase();
    return customers.filter(c => 
      c.name.toLowerCase().includes(query) || 
      c.phone.includes(query) || 
      c.ci.toLowerCase().includes(query)
    );
  }, [customers, newRentalCustomerSearchQuery]);

  const addToCart = (product: any, isCombo = false) => {
    let size = '';
    if (!isCombo && product.hasWheelSizes && product.wheelSizes) {
      size = selectedSizes[product.id] || product.wheelSizes.find((w: any) => w.stock > 0)?.size || '';
      if (!size) {
        alert('No hay tallas/aros disponibles para este producto.');
        return;
      }
    }

    const componentSelections: any[] = [];
    if (isCombo && product.components) {
      product.components.forEach((comp: any) => {
        const inventoryItem = inventory.find(inv => inv.id === comp.inventoryItemId);
        if (inventoryItem?.hasWheelSizes && inventoryItem.wheelSizes) {
          const compSize = selectedSizes[`${product.id}_${comp.inventoryItemId}`] || 
                           inventoryItem.wheelSizes.find(w => w.stock > 0)?.size || '';
          componentSelections.push({
            inventoryItemId: comp.inventoryItemId,
            wheelSize: compSize
          });
        } else {
          componentSelections.push({
            inventoryItemId: comp.inventoryItemId
          });
        }
      });
    }

    const existingIdx = newRentalCart.findIndex(item => 
      item.product.id === product.id && 
      item.selectedWheelSize === size &&
      JSON.stringify(item.componentSelections || []) === JSON.stringify(componentSelections)
    );

    if (existingIdx >= 0) {
      const cartCopy = [...newRentalCart];
      cartCopy[existingIdx].quantity += 1;
      setNewRentalCart(cartCopy);
    } else {
      setNewRentalCart([...newRentalCart, {
        product,
        quantity: 1,
        selectedWheelSize: size,
        componentSelections
      }]);
    }
  };

  const handleWizardSubmit = async () => {
    if (manualCreateLockRef.current) return;
    let finalCustomer: any = null;
    if (newRentalCustomerMode === 'existing') {
      finalCustomer = customers.find(c => c.id === newRentalSelectedCustomerId);
      if (!finalCustomer) { alert('Por favor selecciona un cliente registrado.'); return; }
    } else {
      const customer = newRentalCustomerData;
      if (!customer.name.trim() || !customer.phone.trim() || !customer.ci.trim()) {
        alert('Por favor completa los campos obligatorios del cliente (Nombre, Teléfono, CI).');
        return;
      }
      finalCustomer = {
        name: customer.name.trim(), phone: customer.phone.trim(), ci: customer.ci.trim(),
        email: customer.email.trim(), nacionalidad: customer.nacionalidad.trim(),
        departamento: customer.departamento.trim(), comoNosConociste: customer.comoNosConociste.trim(),
      };
    }
    if (newRentalCart.length === 0) { alert('El carrito del alquiler está vacío.'); return; }

    const rentalCartItems = newRentalCart.filter(item => item.product.itemType !== 'accessory');
    const accessoryCartItems = newRentalCart.filter(item => item.product.itemType === 'accessory');
    if (rentalCartItems.length === 0) { alert('Agrega al menos una bicicleta o un combo al alquiler.'); return; }

    const lines = rentalCartItems.map(item => ({
      productId: item.product.id,
      productType: (item.product.components !== undefined ? 'combo' : 'single') as 'combo' | 'single',
      quantity: item.quantity,
      ...(item.selectedWheelSize ? { wheelSize: item.selectedWheelSize } : {}),
      ...(item.componentSelections?.length ? { componentSelections: item.componentSelections } : {}),
    }));
    const accessories = accessoryCartItems.map(item => ({ itemId: item.product.id, quantity: item.quantity }));
    const paymentMethod: 'QR' | 'Transferencia' | 'Efectivo' = newRentalForm.paymentMethod.toLowerCase().includes('qr')
      ? 'QR' : newRentalForm.paymentMethod.toLowerCase().includes('transfer') ? 'Transferencia' : 'Efectivo';
    const adminCustomer = {
      ...(newRentalCustomerMode === 'existing' ? { id: finalCustomer.id } : {}),
      name: finalCustomer.name, phone: finalCustomer.phone, ci: finalCustomer.ci,
      email: finalCustomer.email || '', nacionalidad: finalCustomer.nacionalidad || '',
      departamento: finalCustomer.departamento || '', comoNosConociste: finalCustomer.comoNosConociste || '',
    };
    const booking = {
      adminManual: true,
      adminCustomer,
      adminNotes: newRentalForm.notes,
      adminPaymentStatus: newRentalForm.paymentStatus,
      adminDeliveryService: newRentalForm.deliveryService,
      adminPickupService: newRentalForm.pickupService,
      adminMapsLink: newRentalForm.mapsLink,
      lines,
      accessories,
      date: newRentalForm.date,
      pickupTime: newRentalForm.pickupTime,
      duration: newRentalForm.duration,
      paymentMethod,
    };

    manualCreateLockRef.current = true;
    setCreatingManualRental(true);
    try {
      const fingerprint = JSON.stringify(booking);
      const storageKey = 'briz_admin_checkout_idempotency';
      const saved = JSON.parse(sessionStorage.getItem(storageKey) || 'null') as { fingerprint?: string; key?: string } | null;
      const idempotencyKey = saved?.fingerprint === fingerprint && saved.key ? saved.key : `admin_${crypto.randomUUID()}`;
      sessionStorage.setItem(storageKey, JSON.stringify({ fingerprint, key: idempotencyKey }));
      const result = await createRentalGroup({ ...booking, idempotencyKey });
      if (newRentalForm.status === 'confirmed') {
        await runAdminRentalAction('confirm', result.rentalIds);
      }
      sessionStorage.removeItem(storageKey);
      alert(`Alquiler manual creado con éxito. Código: ${result.reservationCode}`);
      setNewRentalModalOpen(false);
    } catch (error) {
      console.error('Error creating manual rental:', error);
      alert(error instanceof Error ? error.message : 'Ocurrió un error al crear el alquiler.');
    } finally {
      manualCreateLockRef.current = false;
      setCreatingManualRental(false);
    }
  };
  const renderStep1 = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans text-white h-[60vh] overflow-hidden">
        {/* Left Side: Product selection grid */}
        <div className="lg:col-span-2 flex flex-col space-y-4 h-full overflow-hidden">
          <div className="flex gap-2 shrink-0">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <Input
                placeholder="Buscar bicicleta, combo o accesorio..."
                value={wizardSearch}
                onChange={e => setWizardSearch(e.target.value)}
                className="pl-9 bg-black/35 border-white/10 h-10 rounded-xl text-xs font-bold text-white focus-visible:ring-brand-yellow"
              />
            </div>
            <select
              value={wizardCategory}
              onChange={e => setWizardCategory(e.target.value)}
              className="bg-black/35 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:border-brand-yellow outline-none"
            >
              <option value="all" className="bg-brand-charcoal text-white">Todas las Categorías</option>
              {bikeCategories.map((cat: string) => (
                <option key={cat} value={cat} className="bg-brand-charcoal text-white">{cat}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 md:grid-cols-2 gap-4 pb-10">
            {wizardBikesAndCombos.map(rawItem => {
              const item = rawItem as any;
              const isCombo = item.type === 'combo';
              const imgUrl = item.imageUrl || '/images/placeholder_bike.png';

              let stock = 0;
              if (!isCombo) {
                if (item.hasWheelSizes && item.wheelSizes) {
                  stock = item.wheelSizes.reduce((s: number, w: any) => s + w.stock, 0);
                } else {
                  stock = item.stock ?? 0;
                }
              } else {
                const components = item.components || [];
                const avails = components.map((comp: any) => {
                  const invItem = inventory.find(inv => inv.id === comp.inventoryItemId);
                  if (!invItem) return 0;
                  if (invItem.hasWheelSizes && invItem.wheelSizes) {
                    return invItem.wheelSizes.reduce((s, w) => s + w.stock, 0);
                  }
                  return invItem.stock ?? 0;
                });
                stock = avails.length > 0 ? Math.min(...avails) : 0;
              }

              const hasSizes = !isCombo && item.hasWheelSizes && item.wheelSizes;
              const cardSizeKey = item.id;
              const activeSize = selectedSizes[cardSizeKey] || (hasSizes ? item.wheelSizes.find((w: any) => w.stock > 0)?.size : '');

              return (
                <div key={item.id} className="bg-black/20 border border-white/5 rounded-2xl p-4 flex flex-col justify-between hover:border-brand-yellow/30 transition-all">
                  <div className="space-y-2">
                    <span className="text-[9px] font-black uppercase text-brand-yellow-vibrant tracking-widest">{item.category || 'Alquiler'}</span>
                    <div className="aspect-[4/3] rounded-xl overflow-hidden bg-black/35 relative">
                      <img src={imgUrl} alt={item.name} className="w-full h-full object-cover" />
                      {stock === 0 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="text-red-500 text-xs font-black uppercase tracking-wider">Agotado</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white">{item.name}</h4>
                      <p className="text-[10px] text-white/40 mt-0.5 line-clamp-2">{item.description}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-bold text-white/50">
                      <span>Stock disponible:</span>
                      <span className={stock > 0 ? 'text-green-400' : 'text-red-400'}>{stock} uds.</span>
                    </div>

                    {hasSizes && (
                      <div className="space-y-1">
                        <label className="text-[9px] text-white/30 font-bold uppercase tracking-wider">Seleccionar Aro</label>
                        <select
                          value={activeSize}
                          onChange={e => setSelectedSizes({ ...selectedSizes, [cardSizeKey]: e.target.value })}
                          className="w-full bg-black/35 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white outline-none focus:border-brand-yellow"
                        >
                          {item.wheelSizes.map((w: any) => (
                            <option key={w.size} value={w.size} disabled={w.stock <= 0} className="bg-brand-charcoal text-white">
                              Aro {w.size} ({w.stock} disponibles)
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {isCombo && item.components && (
                      <div className="space-y-1">
                        <label className="text-[9px] text-white/30 font-bold uppercase tracking-wider">Configurar Componentes</label>
                        <div className="space-y-1">
                          {item.components.map((comp: any) => {
                            const invItem = inventory.find(i => i.id === comp.inventoryItemId);
                            if (!invItem?.hasWheelSizes || !invItem.wheelSizes) return null;
                            const comboCompKey = `${item.id}_${comp.inventoryItemId}`;
                            const compSize = selectedSizes[comboCompKey] || invItem.wheelSizes.find(w => w.stock > 0)?.size || '';
                            return (
                              <div key={comp.inventoryItemId} className="flex items-center justify-between gap-2 text-[10px]">
                                <span className="text-white/60 truncate max-w-[120px]">{invItem.name}:</span>
                                <select
                                  value={compSize}
                                  onChange={e => setSelectedSizes({ ...selectedSizes, [comboCompKey]: e.target.value })}
                                  className="bg-black/35 border border-white/10 rounded px-1.5 py-1 text-[10px] font-bold text-white outline-none"
                                >
                                  {invItem.wheelSizes.map((w: any) => (
                                    <option key={w.size} value={w.size} disabled={w.stock <= 0} className="bg-brand-charcoal text-white">
                                      Aro {w.size}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <Button
                      type="button"
                      disabled={stock === 0}
                      onClick={() => addToCart(item, isCombo)}
                      className="w-full h-9 bg-brand-yellow hover:bg-brand-yellow-light text-brand-black text-xs font-black uppercase rounded-xl cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" strokeWidth={3} /> Agregar
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Cart Summary */}
        <div className="bg-black/25 border border-white/5 rounded-2xl p-4 flex flex-col justify-between h-full overflow-hidden">
          <div className="flex flex-col h-full overflow-hidden">
            <h3 className="text-sm font-black uppercase tracking-wider border-b border-white/10 pb-2 mb-3 text-brand-yellow-vibrant">
              Resumen de Alquiler ({newRentalCart.reduce((s, c) => s + c.quantity, 0)})
            </h3>

            {newRentalCart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-white/30 space-y-2">
                <ShoppingBag className="w-8 h-8 opacity-40" />
                <p className="text-xs font-black uppercase tracking-wider">Carrito Vacío</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 pb-4">
                {newRentalCart.map((item, idx) => {
                  const isCombo = item.product.components !== undefined;
                  const price = calculatePrice(
                    isCombo ? 'combo' : 'single',
                    item.product.id,
                    newRentalForm.duration,
                    1
                  );
                  return (
                    <div key={idx} className="bg-white/5 border border-white/5 rounded-xl p-3 space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <h5 className="text-xs font-black text-white truncate">{item.product.name}</h5>
                          {item.selectedWheelSize && (
                            <Badge className="bg-brand-yellow text-brand-black text-[9px] font-black rounded-md px-1 py-0 mt-0.5 border-0">
                              Aro {item.selectedWheelSize}
                            </Badge>
                          )}
                          {item.componentSelections && item.componentSelections.length > 0 && (
                            <div className="flex gap-1 flex-wrap mt-0.5">
                              {item.componentSelections.filter((cs: any) => cs.wheelSize).map((cs: any) => {
                                const subItem = inventory.find(i => i.id === cs.inventoryItemId);
                                return (
                                  <Badge key={cs.inventoryItemId} className="bg-white/10 text-white/80 text-[8px] font-bold rounded px-1 py-0 border-0">
                                    {subItem?.name}: Aro {cs.wheelSize}
                                  </Badge>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            const cartCopy = [...newRentalCart];
                            cartCopy.splice(idx, 1);
                            setNewRentalCart(cartCopy);
                          }}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex justify-between items-center pt-1.5 border-t border-white/5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const cartCopy = [...newRentalCart];
                              if (cartCopy[idx].quantity > 1) {
                                cartCopy[idx].quantity -= 1;
                                setNewRentalCart(cartCopy);
                              }
                            }}
                            className="bg-white/5 text-white hover:bg-white/10 w-6 h-6 flex items-center justify-center rounded-lg"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-black text-white w-4 text-center">{item.quantity}</span>
                          <button
                            onClick={() => {
                              const cartCopy = [...newRentalCart];
                              cartCopy[idx].quantity += 1;
                              setNewRentalCart(cartCopy);
                            }}
                            className="bg-white/5 text-white hover:bg-white/10 w-6 h-6 flex items-center justify-center rounded-lg"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="text-xs font-black text-brand-yellow">
                          Bs. {price * item.quantity}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="border-t border-white/10 pt-3 mt-2 space-y-3 shrink-0">
              <div className="flex justify-between items-center text-sm font-black">
                <span>Total Estimado:</span>
                <span className="text-brand-yellow">Bs. {getCartTotal()}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setNewRentalModalOpen(false)}
                  variant="ghost"
                  className="flex-1 h-10 border border-white/10 hover:bg-white/5 text-white font-bold rounded-xl text-xs uppercase cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button
                  disabled={newRentalCart.length === 0}
                  onClick={() => setNewRentalStep(2)}
                  className="flex-1 h-10 bg-brand-yellow hover:bg-brand-yellow-light text-brand-black font-black rounded-xl text-xs uppercase cursor-pointer"
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStep2 = () => {
    return (
      <div className="space-y-4 font-sans text-white max-w-xl mx-auto py-4">
        <h3 className="text-base font-black uppercase tracking-wider text-brand-yellow-vibrant mb-4 text-center">
          Detalles de Tiempos, Pago y Servicios
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] text-white/40 font-bold uppercase">Fecha de Inicio</label>
            <input
              type="date"
              value={newRentalForm.date}
              onChange={e => setNewRentalForm({ ...newRentalForm, date: e.target.value })}
              className="w-full bg-black/35 border border-white/10 rounded-xl px-3 h-10 text-xs font-bold text-white focus:border-brand-yellow outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-white/40 font-bold uppercase">Hora de Retiro</label>
            <input
              type="time"
              value={newRentalForm.pickupTime}
              onChange={e => setNewRentalForm({ ...newRentalForm, pickupTime: e.target.value })}
              className="w-full bg-black/35 border border-white/10 rounded-xl px-3 h-10 text-xs font-bold text-white focus:border-brand-yellow outline-none"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-white/40 font-bold uppercase">Duración de Alquiler</label>
          <select
            value={newRentalForm.duration}
            onChange={e => setNewRentalForm({ ...newRentalForm, duration: e.target.value })}
            className="w-full bg-black/35 border border-white/10 rounded-xl px-3 h-10 text-xs font-bold text-white focus:border-brand-yellow outline-none"
          >
            {['1 hora', '2 horas', '3 horas', '4 horas', '8 horas', '24 horas', '1 semana', '1 mes'].map(d => (
              <option key={d} value={d} className="bg-brand-charcoal text-white">{d}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <label className="flex items-center gap-2 rounded-xl bg-black/25 p-3 text-xs font-bold text-white/70 cursor-pointer select-none border border-white/5 hover:border-white/10">
            <input
              type="checkbox"
              checked={newRentalForm.deliveryService}
              onChange={e => setNewRentalForm({ ...newRentalForm, deliveryService: e.target.checked })}
              className="rounded border-white/10 bg-black/35 text-brand-yellow focus:ring-0"
            />
            Entrega a domicilio
          </label>
          <label className="flex items-center gap-2 rounded-xl bg-black/25 p-3 text-xs font-bold text-white/70 cursor-pointer select-none border border-white/5 hover:border-white/10">
            <input
              type="checkbox"
              checked={newRentalForm.pickupService}
              onChange={e => setNewRentalForm({ ...newRentalForm, pickupService: e.target.checked })}
              className="rounded border-white/10 bg-black/35 text-brand-yellow focus:ring-0"
            />
            Recojo de retorno
          </label>
        </div>

        {(newRentalForm.deliveryService || newRentalForm.pickupService) && (
          <div className="space-y-1">
            <label className="text-[10px] text-white/40 font-bold uppercase">Enlace Google Maps (Dirección)</label>
            <Input
              placeholder="Pegue el enlace de ubicación de Google Maps..."
              value={newRentalForm.mapsLink}
              onChange={e => setNewRentalForm({ ...newRentalForm, mapsLink: e.target.value })}
              className="h-10 rounded-xl bg-black/35 border-white/10 text-white text-xs font-bold"
            />
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="space-y-1">
            <label className="text-[10px] text-white/40 font-bold uppercase">Método de Pago</label>
            <select
              value={newRentalForm.paymentMethod}
              onChange={e => setNewRentalForm({ ...newRentalForm, paymentMethod: e.target.value })}
              className="w-full bg-black/35 border border-white/10 rounded-xl px-3 h-10 text-xs font-bold text-white outline-none focus:border-brand-yellow"
            >
              <option value="efectivo" className="bg-brand-charcoal text-white">Efectivo</option>
              <option value="qr" className="bg-brand-charcoal text-white">QR</option>
              <option value="transferencia" className="bg-brand-charcoal text-white">Transferencia</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-white/40 font-bold uppercase">Estado de Pago</label>
            <select
              value={newRentalForm.paymentStatus}
              onChange={e => setNewRentalForm({ ...newRentalForm, paymentStatus: e.target.value as any })}
              className="w-full bg-black/35 border border-white/10 rounded-xl px-3 h-10 text-xs font-bold text-white outline-none focus:border-brand-yellow"
            >
              <option value="paid" className="bg-brand-charcoal text-white">Pagado</option>
              <option value="unpaid" className="bg-brand-charcoal text-white">No Pagado</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-white/40 font-bold uppercase">Estado de Alquiler</label>
            <select
              value={newRentalForm.status}
              onChange={e => setNewRentalForm({ ...newRentalForm, status: e.target.value as any })}
              className="w-full bg-black/35 border border-white/10 rounded-xl px-3 h-10 text-xs font-bold text-white outline-none focus:border-brand-yellow"
            >
              <option value="confirmed" className="bg-brand-charcoal text-white">Confirmado</option>
              <option value="pending" className="bg-brand-charcoal text-white">Pendiente</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-white/40 font-bold uppercase">Notas u Observaciones</label>
          <textarea
            placeholder="Escriba alguna nota sobre este alquiler manual..."
            value={newRentalForm.notes}
            onChange={e => setNewRentalForm({ ...newRentalForm, notes: e.target.value })}
            className="w-full bg-black/35 border border-white/10 rounded-xl p-3 h-20 text-xs font-bold text-white outline-none focus:border-brand-yellow resize-none"
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            onClick={() => setNewRentalStep(1)}
            variant="ghost"
            className="flex-1 h-10 border border-white/10 hover:bg-white/5 text-white font-bold rounded-xl text-xs uppercase cursor-pointer"
          >
            Atrás
          </Button>
          <Button
            onClick={() => setNewRentalStep(3)}
            className="flex-1 h-10 bg-brand-yellow hover:bg-brand-yellow-light text-brand-black font-black rounded-xl text-xs uppercase cursor-pointer"
          >
            Siguiente
          </Button>
        </div>
      </div>
    );
  };

  const renderStep3 = () => {
    const isModeExisting = newRentalCustomerMode === 'existing';
    const selectedCustomer = customers.find(c => c.id === newRentalSelectedCustomerId);

    return (
      <div className="space-y-4 font-sans text-white max-w-xl mx-auto py-4">
        <h3 className="text-base font-black uppercase tracking-wider text-brand-yellow-vibrant mb-4 text-center">
          Asociar Cliente
        </h3>

        <div className="grid grid-cols-2 p-1 bg-black/35 rounded-xl border border-white/5">
          <button
            type="button"
            onClick={() => setNewRentalCustomerMode('existing')}
            className={`py-2.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
              isModeExisting
                ? 'bg-brand-yellow text-brand-black shadow-md'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            Cliente Registrado
          </button>
          <button
            type="button"
            onClick={() => setNewRentalCustomerMode('new')}
            className={`py-2.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
              !isModeExisting
                ? 'bg-brand-yellow text-brand-black shadow-md'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            Nuevo Cliente
          </button>
        </div>

        {isModeExisting ? (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] text-white/40 font-bold uppercase">Buscar Cliente</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input
                  placeholder="Buscar por nombre, teléfono o CI..."
                  value={newRentalCustomerSearchQuery}
                  onChange={e => setNewRentalCustomerSearchQuery(e.target.value)}
                  className="pl-9 bg-black/35 border-white/10 h-10 rounded-xl text-xs font-bold text-white focus-visible:ring-brand-yellow"
                />
              </div>
            </div>

            {newRentalCustomerSearchQuery.trim() !== '' && (
              <div className="bg-black/25 border border-white/5 rounded-xl max-h-40 overflow-y-auto p-2 space-y-1">
                {filteredCustomersForWizard.length === 0 ? (
                  <p className="text-center py-4 text-white/30 text-xs font-bold">No se encontraron clientes</p>
                ) : (
                  filteredCustomersForWizard.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setNewRentalSelectedCustomerId(c.id);
                        setNewRentalCustomerSearchQuery('');
                      }}
                      className={`w-full text-left p-2.5 rounded-lg text-xs font-bold transition-all hover:bg-white/5 flex justify-between items-center ${
                        newRentalSelectedCustomerId === c.id ? 'bg-brand-yellow/10 text-brand-yellow border border-brand-yellow/20' : 'text-white/80'
                      }`}
                    >
                      <div>
                        <p className="font-black text-white">{c.name}</p>
                        <p className="text-[10px] text-white/50">Telf: {c.phone} | CI: {c.ci}</p>
                      </div>
                      {newRentalSelectedCustomerId === c.id && <Check className="w-4 h-4 text-brand-yellow" />}
                    </button>
                  ))
                )}
              </div>
            )}

            {selectedCustomer ? (
              <div className="bg-brand-yellow/5 border border-brand-yellow/20 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-brand-yellow">{selectedCustomer.name}</h4>
                  <Badge className="bg-brand-yellow text-brand-black text-[9px] font-black rounded border-0">
                    Cliente Registrado
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-white/70 font-sans">
                  <p><strong>Teléfono:</strong> {selectedCustomer.phone}</p>
                  <p><strong>Documento (CI):</strong> {selectedCustomer.ci}</p>
                  <p><strong>Nacionalidad:</strong> {selectedCustomer.nacionalidad || 'No definida'}</p>
                  <p><strong>Departamento:</strong> {selectedCustomer.departamento || 'No definido'}</p>
                  <p><strong>Visitas:</strong> {selectedCustomer.rentalsCount || 0} rentas</p>
                  <p><strong>Última visita:</strong> {selectedCustomer.lastVisit ? new Date(selectedCustomer.lastVisit).toLocaleDateString() : 'Nunca'}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-white/30 border border-white/5 border-dashed rounded-2xl">
                <Users className="w-8 h-8 mx-auto opacity-30 mb-1" />
                <p className="text-xs font-black uppercase tracking-wider">Ningún cliente seleccionado</p>
                <p className="text-[10px] text-white/40">Busca arriba o marca "Nuevo Cliente" para registrarlo.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto pr-1 pb-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-white/40 font-bold uppercase">Nombre Completo *</label>
                <Input
                  required
                  value={newRentalCustomerData.name}
                  onChange={e => setNewRentalCustomerData({...newRentalCustomerData, name: e.target.value})}
                  className="bg-black/35 border-white/10 h-10 text-xs font-bold text-white rounded-xl"
                  placeholder="Nombre y apellido..."
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-white/40 font-bold uppercase">Teléfono / WhatsApp *</label>
                <Input
                  required
                  value={newRentalCustomerData.phone}
                  onChange={e => setNewRentalCustomerData({...newRentalCustomerData, phone: e.target.value})}
                  className="bg-black/35 border-white/10 h-10 text-xs font-bold text-white rounded-xl"
                  placeholder="Número de contacto..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-white/40 font-bold uppercase">Cédula de Identidad (CI) *</label>
                <Input
                  required
                  value={newRentalCustomerData.ci}
                  onChange={e => setNewRentalCustomerData({...newRentalCustomerData, ci: e.target.value})}
                  className="bg-black/35 border-white/10 h-10 text-xs font-bold text-white rounded-xl"
                  placeholder="Nº de carnet o pasaporte..."
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-white/40 font-bold uppercase">Correo Electrónico</label>
                <Input
                  value={newRentalCustomerData.email}
                  onChange={e => setNewRentalCustomerData({...newRentalCustomerData, email: e.target.value})}
                  className="bg-black/35 border-white/10 h-10 text-xs font-bold text-white rounded-xl"
                  placeholder="ejemplo@correo.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-white/40 font-bold uppercase">Nacionalidad</label>
                <Input
                  value={newRentalCustomerData.nacionalidad}
                  onChange={e => setNewRentalCustomerData({...newRentalCustomerData, nacionalidad: e.target.value})}
                  className="bg-black/35 border-white/10 h-10 text-xs font-bold text-white rounded-xl"
                  placeholder="Boliviana, etc."
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-white/40 font-bold uppercase">Departamento</label>
                <Input
                  value={newRentalCustomerData.departamento}
                  onChange={e => setNewRentalCustomerData({...newRentalCustomerData, departamento: e.target.value})}
                  className="bg-black/35 border-white/10 h-10 text-xs font-bold text-white rounded-xl"
                  placeholder="Cochabamba, etc."
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-white/40 font-bold uppercase">¿Cómo nos conoció?</label>
                <select
                  value={newRentalCustomerData.comoNosConociste}
                  onChange={e => setNewRentalCustomerData({...newRentalCustomerData, comoNosConociste: e.target.value})}
                  className="w-full bg-black/35 border border-white/10 rounded-xl px-2.5 h-10 text-xs font-bold text-white outline-none"
                >
                  <option value="" className="bg-brand-charcoal text-white">Seleccionar...</option>
                  <option value="Redes Sociales" className="bg-brand-charcoal text-white">Redes Sociales</option>
                  <option value="Recomendación" className="bg-brand-charcoal text-white">Recomendación</option>
                  <option value="Pasó por el local" className="bg-brand-charcoal text-white">Pasó por el local</option>
                  <option value="Otro" className="bg-brand-charcoal text-white">Otro</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="space-y-1 bg-white/5 p-3 rounded-xl border border-white/5">
                <label className="text-[9px] text-white/40 font-bold uppercase block text-center mb-1">Foto Rostro</label>
                <FileUploader
                  onUpload={url => setNewRentalCustomerData(prev => ({...prev, autofotoUrl: url}))}
                  folder="customers"
                  className="h-10 px-2 flex items-center justify-center gap-1 bg-black/40 border border-white/10 hover:border-brand-yellow/50 rounded-lg text-[9px] font-black text-white cursor-pointer w-full"
                />
                {newRentalCustomerData.autofotoUrl && (
                  <span className="text-[9px] text-emerald-400 font-bold block text-center mt-1">✓ Cargada</span>
                )}
              </div>
              <div className="space-y-1 bg-white/5 p-3 rounded-xl border border-white/5">
                <label className="text-[9px] text-white/40 font-bold uppercase block text-center mb-1">CI Anverso</label>
                <FileUploader
                  onUpload={url => setNewRentalCustomerData(prev => ({...prev, documentoUrl: url}))}
                  folder="customers"
                  className="h-10 px-2 flex items-center justify-center gap-1 bg-black/40 border border-white/10 hover:border-brand-yellow/50 rounded-lg text-[9px] font-black text-white cursor-pointer w-full"
                />
                {newRentalCustomerData.documentoUrl && (
                  <span className="text-[9px] text-emerald-400 font-bold block text-center mt-1">✓ Cargada</span>
                )}
              </div>
              <div className="space-y-1 bg-white/5 p-3 rounded-xl border border-white/5">
                <label className="text-[9px] text-white/40 font-bold uppercase block text-center mb-1">CI Reverso</label>
                <FileUploader
                  onUpload={url => setNewRentalCustomerData(prev => ({...prev, documentoReversoUrl: url}))}
                  folder="customers"
                  className="h-10 px-2 flex items-center justify-center gap-1 bg-black/40 border border-white/10 hover:border-brand-yellow/50 rounded-lg text-[9px] font-black text-white cursor-pointer w-full"
                />
                {newRentalCustomerData.documentoReversoUrl && (
                  <span className="text-[9px] text-emerald-400 font-bold block text-center mt-1">✓ Cargada</span>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-4">
          <Button
            onClick={() => setNewRentalStep(2)}
            variant="ghost"
            className="flex-1 h-10 border border-white/10 hover:bg-white/5 text-white font-bold rounded-xl text-xs uppercase cursor-pointer"
          >
            Atrás
          </Button>
          <Button
            disabled={isModeExisting ? !selectedCustomer : (!newRentalCustomerData.name.trim() || !newRentalCustomerData.phone.trim() || !newRentalCustomerData.ci.trim())}
            onClick={() => setNewRentalStep(4)}
            className="flex-1 h-10 bg-brand-yellow hover:bg-brand-yellow-light text-brand-black font-black rounded-xl text-xs uppercase cursor-pointer"
          >
            Siguiente
          </Button>
        </div>
      </div>
    );
  };

  const renderStep4 = () => {
    const isModeExisting = newRentalCustomerMode === 'existing';
    const customerName = isModeExisting 
      ? customers.find(c => c.id === newRentalSelectedCustomerId)?.name 
      : newRentalCustomerData.name;
    const customerPhone = isModeExisting 
      ? customers.find(c => c.id === newRentalSelectedCustomerId)?.phone 
      : newRentalCustomerData.phone;
    const customerCI = isModeExisting 
      ? customers.find(c => c.id === newRentalSelectedCustomerId)?.ci 
      : newRentalCustomerData.ci;

    const cartTotal = getCartTotal();

    return (
      <div className="space-y-4 font-sans text-white max-w-xl mx-auto py-4">
        <h3 className="text-base font-black uppercase tracking-wider text-brand-yellow-vibrant mb-4 text-center">
          Resumen de Confirmación
        </h3>

        <div className="bg-black/25 border border-white/5 rounded-2xl p-4 space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-white/50 border-b border-white/5 pb-1">
            Datos del Cliente
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <p><strong>Nombre:</strong> {customerName}</p>
            <p><strong>Teléfono:</strong> {customerPhone}</p>
            <p><strong>CI:</strong> {customerCI}</p>
            <p><strong>Tipo registro:</strong> {isModeExisting ? 'Existente' : 'Nuevo Registro'}</p>
          </div>
        </div>

        <div className="bg-black/25 border border-white/5 rounded-2xl p-4 space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-white/50 border-b border-white/5 pb-1">
            Detalles Operativos
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <p><strong>Fecha:</strong> {newRentalForm.date}</p>
            <p><strong>Hora:</strong> {newRentalForm.pickupTime}</p>
            <p><strong>Duración:</strong> {newRentalForm.duration}</p>
            <p><strong>Método de pago:</strong> {newRentalForm.paymentMethod.toUpperCase()}</p>
            <p><strong>Estado de pago:</strong> {newRentalForm.paymentStatus === 'paid' ? 'PAGADO' : 'PENDIENTE'}</p>
            <p><strong>Estado operativo:</strong> {newRentalForm.status === 'confirmed' ? 'CONFIRMADO' : 'PENDIENTE'}</p>
            {newRentalForm.notes && (
              <p className="col-span-2"><strong>Notas:</strong> {newRentalForm.notes}</p>
            )}
          </div>
        </div>

        <div className="bg-black/25 border border-white/5 rounded-2xl p-4 space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-white/50 border-b border-white/5 pb-1">
            Detalle de Artículos
          </h4>
          <div className="space-y-2">
            {newRentalCart.map((item, idx) => {
              const isCombo = item.product.components !== undefined;
              const price = calculatePrice(
                isCombo ? 'combo' : 'single',
                item.product.id,
                newRentalForm.duration,
                1
              );
              return (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold">{item.product.name} x {item.quantity}</p>
                    {item.selectedWheelSize && (
                      <p className="text-[10px] text-white/40">Aro {item.selectedWheelSize}</p>
                    )}
                    {item.componentSelections && item.componentSelections.length > 0 && (
                      <p className="text-[9px] text-white/30">
                        {item.componentSelections.filter((cs: any) => cs.wheelSize).map((cs: any) => `Aro ${cs.wheelSize}`).join(', ')}
                      </p>
                    )}
                  </div>
                  <span className="font-black text-brand-yellow">Bs. {price * item.quantity}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-brand-yellow text-brand-black p-5 rounded-2xl text-center shadow-lg shadow-brand-yellow/10">
          <p className="text-[10px] font-black uppercase tracking-wider mb-0.5">Monto Total a Cobrar</p>
          <p className="text-3xl font-black">Bs. {cartTotal}</p>
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            onClick={() => setNewRentalStep(3)}
            variant="ghost"
            className="flex-1 h-10 border border-white/10 hover:bg-white/5 text-white font-bold rounded-xl text-xs uppercase cursor-pointer"
          >
            Atrás
          </Button>
          <Button
            onClick={handleWizardSubmit}
            disabled={creatingManualRental}
            className="flex-1 h-10 bg-brand-yellow hover:bg-brand-yellow-light text-brand-black font-black rounded-xl text-xs uppercase cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5" /> {creatingManualRental ? 'Creando alquiler…' : 'Crear Alquiler'}
          </Button>
        </div>
      </div>
    );
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
          <p className="text-white/40 text-sm font-medium">Control operativo, entrega y devolución de alquileres</p>
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

          <Button
            onClick={() => {
              setNewRentalCart([]);
              setNewRentalStep(1);
              setNewRentalForm({
                date: toBoliviaDateString(),
                pickupTime: new Date().toTimeString().slice(0, 5),
                duration: '1 hora',
                deliveryService: false,
                pickupService: false,
                mapsLink: '',
                notes: '',
                paymentMethod: 'efectivo',
                paymentStatus: 'paid',
                status: 'confirmed'
              });
              setNewRentalCustomerMode('existing');
              setNewRentalSelectedCustomerId(null);
              setNewRentalCustomerSearchQuery('');
              setNewRentalCustomerData({
                name: '',
                phone: '',
                ci: '',
                email: '',
                nacionalidad: '',
                departamento: '',
                comoNosConociste: '',
                autofotoUrl: '',
                documentoUrl: '',
                documentoReversoUrl: ''
              });
              setNewRentalModalOpen(true);
            }}
            className="bg-brand-yellow text-brand-black hover:bg-brand-yellow/90 font-black text-xs uppercase rounded-xl h-10 px-4 flex items-center gap-2 shadow-lg shadow-brand-yellow/15"
          >
            <Plus className="w-4 h-4" strokeWidth={3} />
            <span>Nuevo Alquiler</span>
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
          { label: 'Activos hoy', value: stats.confirmedToday, color: 'text-green-400 bg-green-500/10 border-green-500/20' },
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
                        disabled={busyActionKey === `confirm:${g.id}`}
                        onClick={() => handleConfirmGroup(g)}
                        className="bg-green-600 hover:bg-green-700 text-white rounded-full h-11 text-xs font-black uppercase flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" /> {busyActionKey === `confirm:${g.id}` ? 'Confirmando…' : 'Confirmar'}
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
            { l: 'Entregados (En Uso)', v: 'delivered' },
            { l: 'Devueltos', v: 'returned' },
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
                    <Badge className={`${statusColors[g.status] || 'bg-white/10 text-white'} rounded-full px-2 py-0.5 text-[9px] font-black uppercase border`}>
                      {statusLabels[g.status] || g.status}
                    </Badge>
                    <Badge className={`${paymentStatusColors[g.paymentStatus || 'unpaid']} rounded-full px-1.5 py-0.2 text-[8px] font-bold uppercase`}>
                      {paymentStatusLabels[g.paymentStatus || 'unpaid']}
                    </Badge>
                    {isPastDue(g) && (
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30 rounded-full px-2 py-0.5 text-[9px] font-black uppercase border animate-pulse">
                        ⚠️ Devolución Vencida
                      </Badge>
                    )}
                    {g.damagedOnReturn && (
                      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 rounded-full px-2 py-0.5 text-[9px] font-black uppercase border">
                        🔧 Con daño reportado
                      </Badge>
                    )}
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
                <div className="flex gap-1.5 shrink-0 w-full sm:w-auto justify-end items-center">
                  {(g.status === 'confirmed' || g.status === 'Confirmado') && (
                    <Button
                      size="sm"
                      onClick={() => handleDeliverGroup(g)}
                      className="h-9 px-3 rounded-xl bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600 hover:text-white text-[10px] font-black uppercase border border-emerald-500/30"
                      title="Marcar bicicleta como entregada físicamente al cliente"
                    >
                      <Bike className="w-3.5 h-3.5 mr-1" /> Entregar
                    </Button>
                  )}
                  {(g.status === 'delivered' || g.status === 'Entregado') && (
                    <Button
                      size="sm"
                      onClick={() => openReturnDialog(g)}
                      className="h-9 px-3 rounded-xl bg-blue-600/20 text-blue-300 hover:bg-blue-600 hover:text-white text-[10px] font-black uppercase border border-blue-500/30"
                      title="Registrar devolución y liberar stock"
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1" /> Devolver
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="w-9 h-9 rounded-xl bg-white/5 text-white/40 hover:bg-brand-yellow hover:text-brand-black" 
                    onClick={() => setSelected(g)}
                  >
                    <Info className="w-4 h-4" />
                  </Button>
                  {(g.status === 'pending' || g.status === 'Pendiente' || g.status === 'confirmed' || g.status === 'Confirmado') && (
                    <Button
                      variant="ghost" size="icon"
                      className="w-9 h-9 rounded-xl bg-white/5 text-red-400/60 hover:bg-red-500 hover:text-white"
                      onClick={() => handleDeleteGroup(g)} title="Cancelar y conservar historial"
                    >
                      <Ban className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RETURN MODAL (WITH OPTIONAL DAMAGE / MAINTENANCE / LATE FEE) */}
      <Dialog open={!!returnModalGroup} onOpenChange={v => { if (!v) setReturnModalGroup(null); }}>
        <DialogContent className="max-w-md bg-brand-charcoal border border-white/10 text-white rounded-3xl p-6 font-sans">
          {returnModalGroup && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-lg font-black flex items-center gap-2 text-white">
                  <RotateCcw className="w-5 h-5 text-brand-yellow" />
                  Registrar Devolución ({returnModalGroup.reservationCode || returnModalGroup.id.slice(-6)})
                </DialogTitle>
              </DialogHeader>

              <div className="bg-black/30 p-3.5 rounded-2xl border border-white/5 text-xs space-y-1.5">
                <p className="text-white/50 font-bold uppercase text-[9px]">Cliente: {returnModalGroup.customerName}</p>
                {returnModalGroup.items.map((item, idx) => (
                  <p key={idx} className="text-white font-black">
                    • {item.quantity}x {item.productName} {item.selectedWheelSize ? `(Aro ${item.selectedWheelSize})` : ''}
                  </p>
                ))}
              </div>

              <div className="space-y-1 rounded-2xl bg-amber-500/10 border border-amber-500/25 p-3.5">
                <label className="text-xs font-black text-amber-300 uppercase">Bicicletas dañadas o que requieren mantenimiento</label>
                <Input
                  type="number" min={0} step={1} value={returnDamagedUnits}
                  onChange={e => setReturnDamagedUnits(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
                  className="mt-2 bg-black/40 border-white/10 h-10 text-sm font-black text-brand-yellow rounded-xl"
                />
                <p className="text-[11px] text-amber-200/70 mt-1">Indica la cantidad exacta. Esas unidades irán a mantenimiento y no volverán al stock disponible.</p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-white/40 font-bold uppercase">Observaciones de recepción / Estado físico</label>
                <textarea
                  placeholder="Ej. Todo entregado en buen estado / Freno trasero requiere ajuste..."
                  value={returnNotes}
                  onChange={e => setReturnNotes(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 h-20 text-xs font-bold text-white outline-none focus:border-brand-yellow resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setReturnModalGroup(null)}
                  className="flex-1 h-11 rounded-xl border border-white/10 text-white/60 hover:text-white font-bold text-xs uppercase"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmReturnGroup}
                  className="flex-1 h-11 rounded-xl bg-brand-yellow hover:bg-brand-yellow-light text-brand-black font-black text-xs uppercase"
                >
                  Confirmar Devolución
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* RESERVATION DETAIL MODAL */}
      <Dialog open={!!selected} onOpenChange={v => { if (!v) setSelected(null); }}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto bg-brand-charcoal border border-white/10 text-white p-0 rounded-3xl">
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
                  <Badge className={`${statusColors[selected.status] || 'bg-white/10 text-white'} px-3 py-1 text-xs font-black uppercase rounded-full border`}>
                    {statusLabels[selected.status] || selected.status}
                  </Badge>
                  <Badge className={`${paymentStatusColors[selected.paymentStatus || 'unpaid']} text-[9px] px-2 py-0.5 rounded-lg border-0`}>
                    {paymentStatusLabels[selected.paymentStatus || 'unpaid']}
                  </Badge>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setEditForm(buildEditForm(selected));
                      setEditingOrder(!editingOrder);
                    }}
                    className="mt-1 h-8 rounded-lg bg-white/10 px-3 text-[10px] font-black uppercase text-white hover:bg-brand-yellow hover:text-brand-black"
                  >
                    <Edit3 className="mr-1.5 h-3.5 w-3.5" />
                    {editingOrder ? 'Ver detalle' : 'Editar pedido'}
                  </Button>
                </div>
              </DialogHeader>

              <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                {/* COLUMNA IZQUIERDA: Detalles del Alquiler */}
                <div className="md:col-span-7 space-y-4">
                  {/* Customer Information Card */}
                  <div className="bg-black/40 p-4 rounded-2xl border border-white/5 space-y-3">
                    <h4 className="text-[10px] text-brand-yellow font-black uppercase tracking-widest flex items-center gap-1 mb-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Datos del Cliente
                    </h4>
                    
                    {(() => {
                      const matchingCustomer = customers.find(
                        c => comparePhones(c.phone, selected.customerPhone) || 
                             compareCIs(c.ci, selected.customerCI)
                      );
                      
                      return (
                        <div className="flex items-center gap-4">
                          {matchingCustomer?.autofotoUrl ? (
                            <a href={matchingCustomer.autofotoUrl} target="_blank" rel="noreferrer" className="shrink-0 group/avatar">
                              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-brand-yellow/30 bg-black/40 shadow-lg relative">
                                <img src={matchingCustomer.autofotoUrl} className="w-full h-full object-cover group-hover/avatar:scale-110 transition-transform duration-300" alt="Selfie" />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center">
                                  <ExternalLink className="w-3 h-3 text-white" />
                                </div>
                              </div>
                            </a>
                          ) : (
                            <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                              <ShieldCheck className="w-6 h-6 text-white/30" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-extrabold text-base truncate leading-tight">{selected.customerName}</p>
                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/50 font-bold mt-1">
                              <span className="flex items-center gap-1.5 shrink-0">
                                <Phone className="w-3.5 h-3.5 text-white/30" /> {selected.customerPhone}
                              </span>
                              <span className="flex items-center gap-1.5 shrink-0">
                                <CreditCard className="w-3.5 h-3.5 text-white/30" /> CI: {selected.customerCI}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

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
                  <div className="bg-black/40 p-4 rounded-2xl border border-white/5 space-y-3">
                    <h4 className="text-[10px] text-brand-yellow font-black uppercase tracking-widest flex items-center gap-1 mb-1">
                      <Calendar className="w-3.5 h-3.5" /> Equipamiento Alquilado
                    </h4>
                    <div className="space-y-3 font-sans">
                      {selected.items.map((item, index) => (
                        <div 
                          key={index} 
                          className="bg-[#141414] p-4 rounded-xl border border-white/5 hover:border-white/10 transition-all flex flex-col gap-2"
                        >
                          <div className="flex justify-between items-start gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-yellow/10 text-brand-yellow font-black text-base border border-brand-yellow/20 shrink-0">
                                {item.quantity}x
                              </span>
                              <p className="text-white font-black text-base truncate leading-tight">
                                {item.productNameSnapshot || item.productName}
                              </p>
                            </div>
                            <span className="text-brand-yellow font-black text-base shrink-0">
                              Bs. {item.total}
                            </span>
                          </div>

                          {item.selectedWheelSize && (
                            <div className="mt-0.5">
                              <span className="inline-flex items-center gap-1 bg-brand-yellow/10 text-brand-yellow border border-brand-yellow/20 px-2 py-0.5 rounded-md text-[10px] font-black uppercase">
                                Aro {item.selectedWheelSize}
                              </span>
                            </div>
                          )}

                          {item.componentSelections && item.componentSelections.length > 0 && (
                            <div className="mt-2 pl-3 border-l-2 border-white/10 space-y-1.5">
                              <p className="text-[9px] text-white/30 font-black uppercase tracking-wider">
                                Componentes del Combo:
                              </p>
                              {item.componentSelections.map((cs, i) => {
                                const invItem = inventory.find(inv => inv.id === cs.inventoryItemId);
                                return (
                                  <p key={i} className="text-white/60 text-xs font-bold flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-brand-yellow/50"></span>
                                    {invItem?.name || 'Item'} {cs.wheelSize ? `(Aro ${cs.wheelSize})` : ''}
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
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-[#141414] p-4 rounded-xl border border-white/5 flex flex-col justify-between">
                      <span className="text-[9.5px] text-white/30 font-black uppercase tracking-wider">📅 Fecha de Entrega</span>
                      <p className="text-white font-extrabold text-sm mt-1.5">{selected.items[0]?.date}</p>
                    </div>
                    <div className="bg-[#141414] p-4 rounded-xl border border-white/5 flex flex-col justify-between">
                      <span className="text-[9.5px] text-white/30 font-black uppercase tracking-wider">⏰ Hora Recogida</span>
                      <p className="text-white font-extrabold text-sm mt-1.5">{selected.items[0]?.pickupTime}</p>
                    </div>
                    <div className="bg-[#141414] p-4 rounded-xl border border-white/5 flex flex-col justify-between">
                      <span className="text-[9.5px] text-white/30 font-black uppercase tracking-wider">⌛ Duración</span>
                      <p className="text-white font-extrabold text-sm mt-1.5">{selected.items[0]?.duration}</p>
                    </div>
                    <div className="bg-[#141414] p-4 rounded-xl border border-white/5 flex flex-col justify-between">
                      <span className="text-[9.5px] text-white/30 font-black uppercase tracking-wider">💳 Método Pago</span>
                      <p className="text-white font-extrabold text-sm mt-1.5 uppercase">{selected.paymentMethod}</p>
                    </div>
                  </div>

                  {/* Transportation Details (Delivery / Pickup Maps Link) */}
                  {(selected.deliveryService || selected.pickupService || selected.mapsLink) && (
                    <div className="bg-brand-yellow/10 p-4 rounded-2xl border border-brand-yellow/20 space-y-2 text-xs">
                      <p className="text-[9px] text-brand-yellow font-black uppercase tracking-wider font-maiandra">
                        Servicio de Transporte a Domicilio
                      </p>
                      <div className="space-y-1 text-white/90 font-medium font-sans">
                        {selected.deliveryService && (() => {
                          const deliveryItem = selected.items.find(item => item.productId === 'srv_delivery');
                          const price = deliveryItem ? deliveryItem.total : 0;
                          return (
                            <p className="flex items-center gap-1.5 font-bold">
                              🚚 Requiere Servicio de Entrega ({price > 0 ? `+Bs. ${price}` : 'A coordinar / Bs. 0'})
                            </p>
                          );
                        })()}
                        {selected.pickupService && (() => {
                          const pickupItem = selected.items.find(item => item.productId === 'srv_pickup');
                          const price = pickupItem ? pickupItem.total : 0;
                          return (
                            <p className="flex items-center gap-1.5 font-bold">
                              🔄 Requiere Servicio de Recojo ({price > 0 ? `+Bs. ${price}` : 'A coordinar / Bs. 0'})
                            </p>
                          );
                        })()}
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

                  {selected.returnConditionNotes && (
                    <div className="bg-amber-500/10 p-4 rounded-2xl border border-amber-500/20">
                      <p className="text-[9px] text-amber-400 font-bold uppercase mb-1">Reporte de Devolución</p>
                      <p className="text-amber-200/80 text-xs">{selected.returnConditionNotes}</p>
                    </div>
                  )}

                  {/* Timestamps & Audit logs */}
                  <div className="bg-black/20 p-3 rounded-xl border border-white/5 text-[9px] text-white/30 space-y-1 font-mono">
                    <p>Creado: {formatDateTime(selected.createdAt)}</p>
                    <p>Actualizado: {formatDateTime(selected.updatedAt)}</p>
                    {selected.deliveredAt && <p className="text-emerald-400/70">Entregado: {formatDateTime(selected.deliveredAt)}</p>}
                    {selected.returnedAt && <p className="text-blue-400/70">Devuelto: {formatDateTime(selected.returnedAt)}</p>}
                    {selected.lastUpdatedBy && (
                      <p className="text-brand-yellow/60">Modificado por última vez por: {selected.lastUpdatedBy}</p>
                    )}
                  </div>
                </div>

                {/* COLUMNA DERECHA: Edición y Acciones */}
                <div className="md:col-span-5 space-y-4">
                  {isPastDue(selected) && (
                    <div className="bg-red-500/10 p-4 rounded-2xl border border-red-500/20 text-xs text-red-400 space-y-1">
                      <p className="font-extrabold uppercase flex items-center gap-1.5 animate-pulse">
                        🚨 Plazo de Alquiler Vencido
                      </p>
                      <p className="font-medium text-[11px] text-red-300/80 leading-normal">
                        El tiempo programado de este alquiler ha terminado. Recibe las bicicletas e ítems y haz clic en **"Registrar Devolución"** abajo para reintegrar los productos al stock.
                      </p>
                    </div>
                  )}

                  {editingOrder && editForm && (
                    <div className="bg-brand-yellow/10 p-4 rounded-2xl border border-brand-yellow/25 space-y-4">
                      <h4 className="text-[10px] text-brand-yellow font-black uppercase tracking-widest flex items-center gap-1">
                        <Edit3 className="w-3.5 h-3.5" /> Editar pedido del cliente
                      </h4>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <p className="text-[9px] text-white/35 font-bold uppercase mb-1">Nueva fecha</p>
                          <Input
                            type="date"
                            value={editForm.date}
                            onChange={e => setEditForm(prev => prev ? { ...prev, date: e.target.value } : prev)}
                            className="h-10 rounded-xl bg-black/35 border-white/10 text-white text-xs font-bold"
                          />
                        </div>
                        <div>
                          <p className="text-[9px] text-white/35 font-bold uppercase mb-1">Hora</p>
                          <Input
                            type="time"
                            value={editForm.pickupTime}
                            onChange={e => setEditForm(prev => prev ? { ...prev, pickupTime: e.target.value } : prev)}
                            className="h-10 rounded-xl bg-black/35 border-white/10 text-white text-xs font-bold"
                          />
                        </div>
                        <div>
                          <p className="text-[9px] text-white/35 font-bold uppercase mb-1">Duración</p>
                          <select
                            value={editForm.duration}
                            onChange={e => handleEditDurationChange(e.target.value)}
                            className="h-10 w-full rounded-xl border border-white/10 bg-black/35 px-2 text-xs font-bold text-white outline-none"
                          >
                            {['1 hora', '2 horas', '3 horas', '4 horas', '8 horas', '24 horas', '1 semana', '1 mes'].map(value => (
                              <option key={value} value={value}>{value}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[9px] text-white/35 font-bold uppercase">Bicicletas / productos</p>
                        
                        {editForm.items.map(editable => (
                          <div key={editable.id} className="grid grid-cols-1 gap-2 rounded-xl border border-white/5 bg-black/25 p-3 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                            <div className="min-w-0">
                              <p className="truncate text-xs font-black text-white">{editable.productName}</p>
                              
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {(() => {
                                  const invItem = inventory.find(inv => inv.id === editable.productId);
                                  if (invItem && invItem.hasWheelSizes && invItem.wheelSizes && invItem.wheelSizes.length > 0) {
                                    return (
                                      <select
                                        value={editable.selectedWheelSize}
                                        onChange={e => updateEditItem(editable.id, { selectedWheelSize: e.target.value })}
                                        className="h-6 rounded bg-black/40 border border-white/10 px-1 text-[9px] font-bold text-white outline-none"
                                      >
                                        {invItem.wheelSizes.map(w => (
                                          <option key={w.size} value={w.size}>Aro {w.size}</option>
                                        ))}
                                      </select>
                                    );
                                  }
                                  return (
                                    <p className="text-[9px] font-bold uppercase text-white/30">
                                      {editable.selectedWheelSize ? `Aro ${editable.selectedWheelSize}` : 'Sin aro'}
                                    </p>
                                  );
                                })()}
                                
                                {editable.isNew && (
                                  <Badge className="bg-brand-yellow/20 text-brand-yellow text-[8px] font-black uppercase rounded py-0 border-0">Nuevo</Badge>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Button type="button" size="icon" className="h-8 w-8 rounded-lg bg-white/10 text-white hover:bg-white/20" onClick={() => updateEditItem(editable.id, { quantity: Math.max(1, editable.quantity - 1) })}>
                                <Minus className="h-3.5 w-3.5" />
                              </Button>
                              <span className="w-8 text-center text-sm font-black text-white">{editable.quantity}</span>
                              <Button type="button" size="icon" className="h-8 w-8 rounded-lg bg-brand-yellow text-brand-black hover:bg-brand-yellow-light" onClick={() => updateEditItem(editable.id, { quantity: editable.quantity + 1 })}>
                                <Plus className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                            
                            <div className="flex items-center gap-2 justify-between sm:justify-start w-full sm:w-auto">
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] font-black uppercase text-white/35">Bs.</span>
                                <Input
                                  type="number"
                                  min="0"
                                  value={editable.total}
                                  onChange={e => updateEditItem(editable.id, { total: Math.max(0, Number(e.target.value) || 0) })}
                                  className="h-9 w-16 rounded-lg bg-black/35 border-white/10 text-white text-xs font-bold"
                                />
                              </div>
                              
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer"
                                onClick={() => removeEditItem(editable.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Search and add new item to edit form */}
                      <div className="space-y-2 border-t border-white/5 pt-3 mt-2">
                        <p className="text-[9px] text-brand-yellow font-black uppercase tracking-wider">
                          Agregar producto al alquiler
                        </p>
                        <div className="relative">
                          <Input
                            placeholder="Buscar por nombre (ej. Mountain Bike, Casco...)"
                            value={searchProductQuery}
                            onChange={e => setSearchProductQuery(e.target.value)}
                            className="h-9 rounded-xl bg-black/40 border-white/10 text-white text-xs font-bold pl-8"
                          />
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-white/30" />
                        </div>

                        {searchProductQuery.trim().length > 0 && (() => {
                          const query = searchProductQuery.toLowerCase();
                          const matchingInventory = inventory.filter(item => 
                            item.active && 
                            item.availableForRental && 
                            item.name.toLowerCase().includes(query) &&
                            !editForm.items.some(editItem => editItem.productId === item.id)
                          );

                          const matchingCombos = combos.filter(combo => 
                            combo.name.toLowerCase().includes(query) &&
                            !editForm.items.some(editItem => editItem.productId === combo.id)
                          );

                          if (matchingInventory.length === 0 && matchingCombos.length === 0) {
                            return (
                              <p className="text-[10px] text-white/30 italic py-1 pl-1">
                                No se encontraron productos disponibles.
                              </p>
                            );
                          }

                          return (
                            <div className="max-h-40 overflow-y-auto border border-white/5 bg-black/40 rounded-xl divide-y divide-white/5 p-1">
                              {matchingCombos.map(combo => (
                                <div key={combo.id} className="flex items-center justify-between p-2 text-xs">
                                  <div>
                                    <p className="font-bold text-white">{combo.name}</p>
                                    <p className="text-[9px] text-brand-yellow font-bold uppercase">Combo</p>
                                  </div>
                                  <Button
                                    type="button"
                                    size="sm"
                                    className="h-7 rounded-lg bg-brand-yellow text-brand-black font-black uppercase text-[10px] px-2.5 cursor-pointer"
                                    onClick={() => {
                                      const price = calculatePrice('combo', combo.id, editForm.duration, 1);
                                      setEditForm(prev => {
                                        if (!prev) return prev;
                                        return {
                                          ...prev,
                                          items: [
                                            ...prev.items,
                                            {
                                              id: 'new_' + Math.random().toString(36).substring(2, 9),
                                              isNew: true,
                                              productId: combo.id,
                                              productName: combo.name,
                                              productType: 'combo',
                                              quantity: 1,
                                              total: price
                                            }
                                          ]
                                        };
                                      });
                                      setSearchProductQuery('');
                                    }}
                                  >
                                    + Agregar
                                  </Button>
                                </div>
                              ))}

                              {matchingInventory.map(item => (
                                <div key={item.id} className="flex flex-col p-2 gap-1 text-xs">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-bold text-white">{item.name}</p>
                                      <p className="text-[9px] text-white/40 font-bold uppercase">
                                        {item.itemType === 'bike' ? 'Bicicleta' : 'Accesorio'} {item.category ? `• ${item.category}` : ''}
                                      </p>
                                    </div>
                                    <Button
                                      type="button"
                                      size="sm"
                                      className="h-7 rounded-lg bg-brand-yellow text-brand-black font-black uppercase text-[10px] px-2.5 cursor-pointer"
                                      onClick={() => {
                                        const price = calculatePrice('single', item.id, editForm.duration, 1);
                                        setEditForm(prev => {
                                          if (!prev) return prev;
                                          return {
                                            ...prev,
                                            items: [
                                              ...prev.items,
                                              {
                                                id: 'new_' + Math.random().toString(36).substring(2, 9),
                                                isNew: true,
                                                productId: item.id,
                                                productName: item.name,
                                                productType: 'single',
                                                selectedWheelSize: item.hasWheelSizes && item.wheelSizes && item.wheelSizes.length > 0 ? item.wheelSizes[0].size : '',
                                                quantity: 1,
                                                total: price
                                              }
                                            ]
                                          };
                                        });
                                        setSearchProductQuery('');
                                      }}
                                    >
                                      + Agregar
                                    </Button>
                                  </div>

                                  {item.hasWheelSizes && item.wheelSizes && item.wheelSizes.length > 0 && (
                                    <div className="flex items-center gap-1.5 pl-1.5 border-l border-white/10 mt-0.5">
                                      <span className="text-[9px] text-white/30 font-bold uppercase">Medidas:</span>
                                      <span className="text-[10px] text-white/70 font-semibold bg-white/5 px-2 py-0.5 rounded border border-white/5">
                                        Aros disp: {item.wheelSizes.map(w => w.size).join(', ')}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <label className="flex items-center gap-2 rounded-xl bg-black/25 p-3 text-xs font-bold text-white/70 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={editForm.deliveryService}
                            onChange={e => setEditForm(prev => prev ? { ...prev, deliveryService: e.target.checked } : prev)}
                          />
                          Entrega a domicilio
                        </label>
                        <label className="flex items-center gap-2 rounded-xl bg-black/25 p-3 text-xs font-bold text-white/70 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={editForm.pickupService}
                            onChange={e => setEditForm(prev => prev ? { ...prev, pickupService: e.target.checked } : prev)}
                          />
                          Recojo a domicilio
                        </label>
                      </div>

                      <Input
                        placeholder="Nuevo enlace de Google Maps"
                        value={editForm.mapsLink}
                        onChange={e => setEditForm(prev => prev ? { ...prev, mapsLink: e.target.value } : prev)}
                        className="h-10 rounded-xl bg-black/35 border-white/10 text-white text-xs font-bold"
                      />

                      <textarea
                        placeholder="Notas del pedido, cambios o instrucciones"
                        value={editForm.notes}
                        onChange={e => setEditForm(prev => prev ? { ...prev, notes: e.target.value } : prev)}
                        className="min-h-20 w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-xs font-bold text-white outline-none focus:border-brand-yellow"
                      />

                      <Button
                        type="button"
                        onClick={handleSaveEditedGroup}
                        className="h-11 w-full rounded-xl bg-brand-yellow text-xs font-black uppercase text-brand-black hover:bg-brand-yellow-light cursor-pointer"
                      >
                        <Save className="mr-2 h-4 w-4" /> Guardar cambios del pedido
                      </Button>
                    </div>
                  )}

                  {/* Total amount header */}
                  <div className="bg-brand-yellow text-brand-black p-5 rounded-2xl text-center shadow-lg">
                    <p className="text-[10px] font-black uppercase tracking-wider mb-1">Monto Total Estimado</p>
                    <p className="text-4xl font-black">Bs. {selected.total}</p>
                    {selected.lateFee && selected.lateFee > 0 ? (
                      <p className="text-[10px] font-black uppercase mt-1 text-red-900">
                        (Incluye Bs. {selected.lateFee} de recargo por retraso)
                      </p>
                    ) : null}
                  </div>

                  {/* Action buttons inside Modal */}
                  <div className="flex gap-2 pt-2 flex-wrap font-sans">
                    {(selected.status === 'pending' || selected.status === 'Pendiente') && (
                      <Button 
                        className="flex-1 h-11 bg-green-600 hover:bg-green-700 text-white font-black rounded-xl text-xs uppercase cursor-pointer" 
                        disabled={busyActionKey === `confirm:${selected.id}`}
                        onClick={async () => { if (await handleConfirmGroup(selected)) setSelected(null); }}
                      >
                        {busyActionKey === `confirm:${selected.id}` ? 'Confirmando…' : 'Confirmar Reserva'}
                      </Button>
                    )}

                    {(selected.status === 'confirmed' || selected.status === 'Confirmado') && (
                      <Button 
                        className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs uppercase cursor-pointer" 
                        onClick={() => { handleDeliverGroup(selected); }}
                      >
                        Marcar como Entregado
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

                    {(selected.status === 'delivered' || selected.status === 'Entregado') && (
                      <Button 
                        className="flex-1 h-11 bg-blue-500 hover:bg-blue-600 text-white font-black rounded-xl text-xs uppercase cursor-pointer" 
                        onClick={() => { openReturnDialog(selected); }}
                      >
                        Registrar Devolución
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
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Manual Rental Creation Dialog */}
      <Dialog open={newRentalModalOpen} onOpenChange={setNewRentalModalOpen}>
        <DialogContent className="max-w-5xl bg-brand-charcoal border-white/10 text-white rounded-3xl p-6 font-sans select-none overflow-y-auto max-h-[90vh]">
          <DialogHeader className="border-b border-white/10 pb-4 mb-4">
            <DialogTitle className="text-2xl font-black text-white flex items-center gap-2">
              <CalendarClock className="w-6 h-6 text-brand-yellow" />
              Nuevo Alquiler Manual
            </DialogTitle>
          </DialogHeader>

          {/* Steps Progress Indicator */}
          <div className="grid grid-cols-4 gap-2 mb-6">
            {[
              { step: 1, label: '1. Productos' },
              { step: 2, label: '2. Tiempos' },
              { step: 3, label: '3. Cliente' },
              { step: 4, label: '4. Confirmación' }
            ].map(s => (
              <div
                key={s.step}
                className={`py-2 text-center rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${
                  newRentalStep === s.step
                    ? 'bg-brand-yellow text-brand-black border-brand-yellow shadow-[0_4px_15px_rgba(255,210,0,0.15)]'
                    : newRentalStep > s.step
                      ? 'bg-brand-yellow/10 text-brand-yellow border-brand-yellow/20'
                      : 'bg-black/20 text-white/40 border-white/5'
                }`}
              >
                {s.label}
              </div>
            ))}
          </div>

          {/* Steps Content */}
          {newRentalStep === 1 && renderStep1()}
          {newRentalStep === 2 && renderStep2()}
          {newRentalStep === 3 && renderStep3()}
          {newRentalStep === 4 && renderStep4()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
