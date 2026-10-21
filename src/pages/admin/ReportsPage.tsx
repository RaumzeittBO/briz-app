import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
  TrendingUp,
  DollarSign,
  Bike,
  ShoppingBag,
  Wrench,
  Download,
  Printer,
  Clock,
  AlertTriangle,
  Calendar,
  Layers,
  CheckCircle2,
  MapPin
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import type { Rental } from '@/context/StoreContext';
import { toBoliviaDateString, addDaysToDateString, parseBoliviaDateTime } from '@/lib/dateUtils';
import { parseDurationToHours } from '@/lib/rentalPricing';
import { filterRentalMoneyByStore, summarizeRentalMoney } from '@/lib/rentalReportMoney';

type DateRangePreset = 'today' | 'yesterday' | 'last7' | 'thisMonth' | 'lastMonth' | 'custom' | 'all';

const isEffectiveRental = (status?: string) =>
  status === 'Confirmado' ||
  status === 'confirmed' ||
  status === 'Entregado' ||
  status === 'delivered' ||
  status === 'Devuelto' ||
  status === 'returned';

const isCancelledOrExpired = (status?: string) =>
  status === 'Cancelado' ||
  status === 'cancelled' ||
  status === 'expired' ||
  status === 'Expirado';

export default function ReportsPage() {
  const { rentals, sales, serviceOrders, inventory, combos } = useStore();

  const todayStr = toBoliviaDateString();
  const [preset, setPreset] = useState<DateRangePreset>('thisMonth');
  const [customStart, setCustomStart] = useState<string>(addDaysToDateString(todayStr, -29));
  const [customEnd, setCustomEnd] = useState<string>(todayStr);
  const [selectedStore, setSelectedStore] = useState<string>('all');

  const dateBounds = useMemo(() => {
    const [year, month] = todayStr.split('-').map(Number);
    if (preset === 'today') {
      return { start: todayStr, end: todayStr, label: `Hoy (${todayStr})` };
    }
    if (preset === 'yesterday') {
      const y = addDaysToDateString(todayStr, -1);
      return { start: y, end: y, label: `Ayer (${y})` };
    }
    if (preset === 'last7') {
      const s = addDaysToDateString(todayStr, -6);
      return { start: s, end: todayStr, label: `Últimos 7 días (${s} al ${todayStr})` };
    }
    if (preset === 'thisMonth') {
      const s = `${year}-${String(month).padStart(2, '0')}-01`;
      return { start: s, end: todayStr, label: `Este mes (${s} al ${todayStr})` };
    }
    if (preset === 'lastMonth') {
      const prevDate = new Date(year, month - 2, 1);
      const lastDayPrev = new Date(year, month - 1, 0);
      const s = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-01`;
      const e = `${lastDayPrev.getFullYear()}-${String(lastDayPrev.getMonth() + 1).padStart(2, '0')}-${String(lastDayPrev.getDate()).padStart(2, '0')}`;
      return { start: s, end: e, label: `Mes anterior (${s} al ${e})` };
    }
    if (preset === 'custom') {
      const s = customStart || todayStr;
      const e = customEnd || todayStr;
      return { start: s <= e ? s : e, end: s <= e ? e : s, label: `Rango (${s} al ${e})` };
    }
    return { start: '2000-01-01', end: '2099-12-31', label: 'Todo el historial' };
  }, [preset, customStart, customEnd, todayStr]);

  const getRentalDateStr = (r: Rental) =>
    r.date && /^\d{4}-\d{2}-\d{2}$/.test(r.date)
      ? r.date
      : toBoliviaDateString(r.createdAt || r.createdDate || new Date());

  const getSaleDateStr = (s: any) =>
    s.date && /^\d{4}-\d{2}-\d{2}$/.test(s.date)
      ? s.date
      : toBoliviaDateString(s.date || new Date());

  const getServiceDateStr = (so: any) =>
    so.date && /^\d{4}-\d{2}-\d{2}$/.test(so.date)
      ? so.date
      : toBoliviaDateString(so.date || new Date());

  // Available stores/branches
  const availableStores = useMemo(() => {
    const set = new Set<string>(['Cochabamba']);
    rentals.forEach(r => {
      if (r.store) set.add(r.store);
    });
    return Array.from(set);
  }, [rentals]);

  // Filtered datasets by date and store
  const periodRentals = useMemo(() => {
    return rentals.filter(r => {
      const d = getRentalDateStr(r);
      if (d < dateBounds.start || d > dateBounds.end) return false;
      if (selectedStore !== 'all') {
        const store = r.store || 'Cochabamba';
        if (store !== selectedStore) return false;
      }
      return true;
    });
  }, [rentals, dateBounds, selectedStore]);

  // Receipts are grouped by payment date, so this scope applies the branch
  // without restricting the rental's scheduled date to the report period.
  const storeRentals = useMemo(() => filterRentalMoneyByStore(rentals, selectedStore), [rentals, selectedStore]);

  const effectivePeriodRentals = useMemo(
    () => periodRentals.filter(r => isEffectiveRental(r.status)),
    [periodRentals]
  );

  const cancelledOrExpiredRentals = useMemo(
    () => periodRentals.filter(r => isCancelledOrExpired(r.status)),
    [periodRentals]
  );

  const periodSales = useMemo(() => {
    return sales.filter(s => {
      if (s.status !== 'Completado') return false;
      const d = getSaleDateStr(s);
      return d >= dateBounds.start && d <= dateBounds.end;
    });
  }, [sales, dateBounds]);

  const periodServices = useMemo(() => {
    return (serviceOrders || []).filter(so => {
      if (so.status !== 'Entregado' && so.status !== 'Listo' && (so.status as string) !== 'Terminado') return false;
      const d = getServiceDateStr(so);
      return d >= dateBounds.start && d <= dateBounds.end;
    });
  }, [serviceOrders, dateBounds]);

  // 1, 2, 3, 4: Financial metrics (Alquileres, Tienda, Taller, Cobrado vs Pendiente)
  const rentalMoney = useMemo(
    () => summarizeRentalMoney(storeRentals, dateBounds.start, dateBounds.end, preset === 'all'),
    [storeRentals, dateBounds, preset]
  );
  const rentalGrossIncome = rentalMoney.contracted;
  const rentalPaidIncome = rentalMoney.collected;
  const rentalPendingPaymentIncome = rentalMoney.pending;

  const salesIncome = useMemo(
    () => periodSales.reduce((sum, s) => sum + (Number(s.total) || 0), 0),
    [periodSales]
  );
  const serviceIncome = useMemo(
    () => periodServices.reduce((sum, so) => sum + (Number(so.costEstimate ?? (so as any).price) || 0), 0),
    [periodServices]
  );
  const totalConsolidatedIncome = rentalPaidIncome + rentalMoney.collectedDateUnknown + salesIncome + serviceIncome;

  // 5, 6, 7, 8: Bike rankings (most rented, least/zero rented, revenue per bike, hours/days rented)
  const bikePerformance = useMemo(() => {
    const bikeCatalog = inventory.filter(i => i.itemType === 'bike' && (!i.availableForSale || i.availableForRental));
    const statsMap = new Map<
      string,
      {
        id: string;
        name: string;
        category: string;
        directUnits: number;
        comboUnits: number;
        totalUnitsUsed: number;
        directRevenue: number;
        hoursRented: number;
      }
    >();

    bikeCatalog.forEach(b => {
      statsMap.set(b.id, {
        id: b.id,
        name: b.name,
        category: b.category || 'General',
        directUnits: 0,
        comboUnits: 0,
        totalUnitsUsed: 0,
        directRevenue: 0,
        hoursRented: 0,
      });
    });

    effectivePeriodRentals.forEach(r => {
      if (r.productId.startsWith('srv_')) return;
      const hours = parseDurationToHours(r.duration || '1 hora') * (Number(r.quantity) || 1);

      if (r.productType === 'single') {
        const entry = statsMap.get(r.productId);
        if (entry) {
          entry.directUnits += Number(r.quantity) || 1;
          entry.totalUnitsUsed += Number(r.quantity) || 1;
          entry.directRevenue += Number(r.total) || 0;
          entry.hoursRented += hours;
        }
      } else if (r.productType === 'combo') {
        const combo = combos.find(c => c.id === r.productId);
        if (combo) {
          combo.components.forEach(comp => {
            const entry = statsMap.get(comp.inventoryItemId);
            if (entry) {
              const compQty = (Number(comp.quantity) || 1) * (Number(r.quantity) || 1);
              entry.comboUnits += compQty;
              entry.totalUnitsUsed += compQty;
              entry.hoursRented += parseDurationToHours(r.duration || '1 hora') * compQty;
            }
          });
        }
      }
    });

    const allBikes = Array.from(statsMap.values());
    const mostRented = [...allBikes].sort((a, b) => b.totalUnitsUsed - a.totalUnitsUsed || b.directRevenue - a.directRevenue);
    const leastRented = [...allBikes].sort((a, b) => a.totalUnitsUsed - b.totalUnitsUsed || a.directRevenue - b.directRevenue);
    return { allBikes, mostRented, leastRented };
  }, [inventory, combos, effectivePeriodRentals]);

  // 9: Combos vs Individual Bikes (without double counting)
  const comboStats = useMemo(() => {
    const map = new Map<string, { id: string; name: string; count: number; revenue: number; hours: number }>();
    combos.forEach(c => {
      map.set(c.id, { id: c.id, name: c.name, count: 0, revenue: 0, hours: 0 });
    });

    effectivePeriodRentals.forEach(r => {
      if (r.productType !== 'combo') return;
      const current = map.get(r.productId) || { id: r.productId, name: r.productName, count: 0, revenue: 0, hours: 0 };
      current.count += Number(r.quantity) || 1;
      current.revenue += Number(r.total) || 0;
      current.hours += parseDurationToHours(r.duration || '1 hora') * (Number(r.quantity) || 1);
      map.set(r.productId, current);
    });

    return Array.from(map.values()).sort((a, b) => b.count - a.count || b.revenue - a.revenue);
  }, [combos, effectivePeriodRentals]);

  // 15: Accessories most rented (both direct & via combos)
  const accessoryStats = useMemo(() => {
    const accCatalog = inventory.filter(i => i.itemType === 'accessory' && (!i.availableForSale || i.availableForRental));
    const map = new Map<string, { id: string; name: string; directQty: number; comboQty: number; totalQty: number; directRevenue: number }>();

    accCatalog.forEach(a => {
      map.set(a.id, { id: a.id, name: a.name, directQty: 0, comboQty: 0, totalQty: 0, directRevenue: 0 });
    });

    effectivePeriodRentals.forEach(r => {
      if (r.productType === 'single') {
        const entry = map.get(r.productId);
        if (entry) {
          entry.directQty += Number(r.quantity) || 1;
          entry.totalQty += Number(r.quantity) || 1;
          entry.directRevenue += Number(r.total) || 0;
        }
      } else if (r.productType === 'combo') {
        const combo = combos.find(c => c.id === r.productId);
        if (combo) {
          combo.components.forEach(comp => {
            const entry = map.get(comp.inventoryItemId);
            if (entry) {
              const q = (Number(comp.quantity) || 1) * (Number(r.quantity) || 1);
              entry.comboQty += q;
              entry.totalQty += q;
            }
          });
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => b.totalQty - a.totalQty || b.directRevenue - a.directRevenue);
  }, [inventory, combos, effectivePeriodRentals]);

  // 10, 12, 13, 14: Reservation group counts, overdue returns, average duration
  const operationalMetrics = useMemo(() => {
    const nonServiceEffective = effectivePeriodRentals.filter(r => !r.productId.startsWith('srv_'));
    const uniqueConfirmedCodes = new Set(nonServiceEffective.map(r => r.reservationCode || r.id));
    const uniqueCancelledCodes = new Set(cancelledOrExpiredRentals.map(r => r.reservationCode || r.id));

    let totalHours = 0;
    let totalBikeUnits = 0;
    let overdueActiveCount = 0;
    let returnedLateCount = 0;

    const seenOverdueCodes = new Set<string>();

    nonServiceEffective.forEach(r => {
      const durHours = parseDurationToHours(r.duration || '1 hora');
      const qty = Number(r.quantity) || 1;
      totalHours += durHours * qty;
      totalBikeUnits += qty;

      const scheduledEnd = parseBoliviaDateTime(r.date, r.pickupTime) + durHours * 3600 * 1000;
      const code = r.reservationCode || r.id;

      if (r.status === 'confirmed' || r.status === 'Confirmado' || r.status === 'delivered' || r.status === 'Entregado') {
        if (scheduledEnd < Date.now() && !seenOverdueCodes.has(code)) {
          overdueActiveCount++;
          seenOverdueCodes.add(code);
        }
      } else if (r.status === 'returned' || r.status === 'Devuelto') {
        if (r.returnedAt) {
          const actualReturn = new Date(r.returnedAt).getTime();
          if (actualReturn > scheduledEnd + 15 * 60 * 1000 && !seenOverdueCodes.has(`ret_${code}`)) {
            returnedLateCount++;
            seenOverdueCodes.add(`ret_${code}`);
          }
        }
      }
    });

    const avgHours = totalBikeUnits > 0 ? +(totalHours / totalBikeUnits).toFixed(1) : 0;

    return {
      confirmedOrdersCount: uniqueConfirmedCodes.size,
      cancelledOrdersCount: uniqueCancelledCodes.size,
      totalHours,
      avgHours,
      overdueActiveCount,
      returnedLateCount,
    };
  }, [effectivePeriodRentals, cancelledOrExpiredRentals]);

  // Chart data across selected range (grouped by day)
  const timelineChartData = useMemo(() => {
    const dayMap = new Map<string, { date: string; alquileres: number; ventas: number; taller: number }>();

    storeRentals.forEach(r => {
      if (r.paymentStatus !== 'paid' || !r.paidAt) return;
      const d = toBoliviaDateString(r.paidAt);
      if (d < dateBounds.start || d > dateBounds.end) return;
      const curr = dayMap.get(d) || { date: d, alquileres: 0, ventas: 0, taller: 0 };
      curr.alquileres += Math.max(0, Number(r.amountPaid) || (r.paymentStatus === 'paid' ? Number(r.total) || 0 : 0));
      dayMap.set(d, curr);
    });

    periodSales.forEach(s => {
      const d = getSaleDateStr(s);
      const curr = dayMap.get(d) || { date: d, alquileres: 0, ventas: 0, taller: 0 };
      curr.ventas += Number(s.total) || 0;
      dayMap.set(d, curr);
    });

    periodServices.forEach(so => {
      const d = getServiceDateStr(so);
      const curr = dayMap.get(d) || { date: d, alquileres: 0, ventas: 0, taller: 0 };
      curr.taller += Number(so.costEstimate ?? (so as any).price) || 0;
      dayMap.set(d, curr);
    });

    return Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [storeRentals, dateBounds, periodSales, periodServices]);

  // 17: Export to CSV/Excel and Printable PDF
  const handleExportCSV = () => {
    const lines: string[] = [];
    const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;

    lines.push([esc('REPORTE INTEGRAL BRIZ'), esc(dateBounds.label), esc(`Sede: ${selectedStore === 'all' ? 'Todas' : selectedStore}`)].join(','));
    lines.push('');
    lines.push([esc('RESUMEN FINANCIERO'), esc('Monto (Bs.)')].join(','));
    lines.push([esc('Alquileres contratados por fecha de alquiler'), esc(rentalGrossIncome)].join(','));
    lines.push([esc('Cobrado con fecha de pago verificable'), esc(rentalPaidIncome)].join(','));
    lines.push([esc('Cobros históricos sin fecha verificable'), esc(rentalMoney.collectedDateUnknown)].join(','));
    lines.push([esc('Alquileres Pendientes de Cobro'), esc(rentalPendingPaymentIncome)].join(','));
    lines.push([esc('Ventas y servicios del período'), esc(salesIncome + serviceIncome)].join(','));
    lines.push([esc('Ventas Tienda (Completadas)'), esc(salesIncome)].join(','));
    lines.push([esc('Servicios Taller (Terminados)'), esc(serviceIncome)].join(','));
    lines.push('');

    lines.push([esc('RANKING DE BICICLETAS'), esc('Categoría'), esc('Alq. Directo (uds)'), esc('En Combos (uds)'), esc('Total Unidades Usadas'), esc('Horas Acumuladas'), esc('Días Eq.'), esc('Ingreso Directo (Bs.)')].join(','));
    bikePerformance.mostRented.forEach(b => {
      lines.push([
        esc(b.name),
        esc(b.category),
        esc(b.directUnits),
        esc(b.comboUnits),
        esc(b.totalUnitsUsed),
        esc(b.hoursRented),
        esc((b.hoursRented / 24).toFixed(1)),
        esc(b.directRevenue),
      ].join(','));
    });
    lines.push('');

    lines.push([esc('BICICLETAS COMBINADAS (COMBOS)'), esc('Veces Alquilado'), esc('Horas Acumuladas'), esc('Ingresos Combo (Bs.)')].join(','));
    comboStats.forEach(c => {
      lines.push([esc(c.name), esc(c.count), esc(c.hours), esc(c.revenue)].join(','));
    });
    lines.push('');

    lines.push([esc('ACCESORIOS ALQUILADOS'), esc('Directo (Wizard/Individual)'), esc('Incluido en Combos'), esc('Total Unidades'), esc('Ingreso Directo (Bs.)')].join(','));
    accessoryStats.forEach(a => {
      lines.push([esc(a.name), esc(a.directQty), esc(a.comboQty), esc(a.totalQty), esc(a.directRevenue)].join(','));
    });

    const csvContent = '\uFEFF' + lines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BRIZ_Reporte_${dateBounds.start}_a_${dateBounds.end}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-20 print:bg-white print:text-black">
      {/* Header & Export Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-tight">
            <div className="p-2 bg-brand-yellow/10 rounded-xl"><TrendingUp className="w-6 h-6 text-brand-yellow"/></div>
            Reportes y Analítica Operativa
          </h1>
          <p className="text-white/40 text-sm font-medium">
            Métricas financieras, rotación de flota, bicicletas combinadas y accesorios ({dateBounds.label})
          </p>
        </div>

        <div className="flex flex-wrap gap-2 print:hidden">
          <Button
            onClick={handleExportCSV}
            className="bg-brand-yellow text-brand-black hover:bg-brand-yellow/90 font-black text-xs uppercase rounded-xl h-10 px-4 flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Exportar Excel (CSV)
          </Button>
          <Button
            onClick={handlePrintPDF}
            variant="outline"
            className="border-white/15 bg-white/5 text-white hover:bg-white/10 font-black text-xs uppercase rounded-xl h-10 px-4 flex items-center gap-2"
          >
            <Printer className="w-4 h-4" /> Imprimir / Guardar PDF
          </Button>
        </div>
      </div>

      {/* Date Range & Store Filters */}
      <Card className="bg-[#1A1A1A] border-white/5 rounded-2xl p-4 print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black uppercase text-white/40 tracking-wider mr-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-brand-yellow" /> Periodo:
            </span>
            {[
              { id: 'today', label: 'Hoy' },
              { id: 'yesterday', label: 'Ayer' },
              { id: 'last7', label: 'Últimos 7 días' },
              { id: 'thisMonth', label: 'Este mes' },
              { id: 'lastMonth', label: 'Mes anterior' },
              { id: 'custom', label: 'Personalizado' },
              { id: 'all', label: 'Todo el historial' },
            ].map(p => (
              <Button
                key={p.id}
                size="sm"
                variant={preset === p.id ? 'default' : 'outline'}
                onClick={() => setPreset(p.id as DateRangePreset)}
                className={`rounded-xl text-xs font-black h-9 px-3 ${
                  preset === p.id
                    ? 'bg-brand-yellow text-brand-black hover:bg-brand-yellow/90'
                    : 'bg-black/30 text-white/60 border-white/10 hover:text-white'
                }`}
              >
                {p.label}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {preset === 'custom' && (
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={customStart}
                  onChange={e => setCustomStart(e.target.value)}
                  className="h-9 bg-black/40 border-white/10 text-white text-xs font-bold rounded-xl w-36"
                />
                <span className="text-white/40 text-xs font-bold">a</span>
                <Input
                  type="date"
                  value={customEnd}
                  onChange={e => setCustomEnd(e.target.value)}
                  className="h-9 bg-black/40 border-white/10 text-white text-xs font-bold rounded-xl w-36"
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-brand-yellow" />
              <select
                value={selectedStore}
                onChange={e => setSelectedStore(e.target.value)}
                className="h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-xs font-bold text-white outline-none focus:border-brand-yellow"
              >
                <option value="all" className="bg-brand-charcoal">Todas las Sedes</option>
                {availableStores.map(st => (
                  <option key={st} value={st} className="bg-brand-charcoal">Sede {st}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Primary Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#1A1A1A] border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Ingresos cobrados / completados</p>
            <DollarSign className="w-4 h-4 text-brand-yellow" />
          </div>
          <p className="text-3xl font-black text-brand-yellow">Bs. {totalConsolidatedIncome}</p>
          <p className="text-[11px] text-white/40 font-bold mt-1">
            Cobros de alquiler por paidAt + ventas y servicios completados
          </p>
        </Card>

        <Card className="bg-[#1A1A1A] border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Alquileres contratados</p>
            <Bike className="w-4 h-4 text-green-400" />
          </div>
          <p className="text-3xl font-black text-white">Bs. {rentalGrossIncome}</p>
          <p className="text-[10px] text-white/40">Por fecha programada del alquiler</p>
          <div className="flex items-center gap-2 mt-1 text-[10px] font-bold">
            <span className="text-emerald-400">Cobrado por fecha de pago: Bs. {rentalPaidIncome}</span>
            <span className="text-white/20">•</span>
            <span className="text-amber-400">Por cobrar: Bs. {rentalPendingPaymentIncome}</span>
          </div>
          {rentalMoney.collectedDateUnknown > 0 && (
            <p className="mt-2 text-xs text-amber-300">Bs. {rentalMoney.collectedDateUnknown} figuran pagados en registros históricos sin fecha de cobro verificable; se muestran solo en “Todo el historial”.</p>
          )}
        </Card>

        <Card className="bg-[#1A1A1A] border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Ventas Tienda</p>
            <ShoppingBag className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-3xl font-black text-white">Bs. {salesIncome}</p>
          <p className="text-[11px] text-white/40 font-bold mt-1">
            {periodSales.length} venta(s) completadas
          </p>
        </Card>

        <Card className="bg-[#1A1A1A] border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Servicios Taller</p>
            <Wrench className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-3xl font-black text-white">Bs. {serviceIncome}</p>
          <p className="text-[11px] text-white/40 font-bold mt-1">
            {periodServices.length} orden(es) terminadas
          </p>
        </Card>
      </div>

      {/* Operational KPIs (Orders, Duration, Overdue, Cancelled) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#151515] border-white/5 rounded-2xl p-4">
          <p className="text-[10px] font-black uppercase text-white/35 tracking-wider">Reservas Efectivas</p>
          <p className="text-2xl font-black text-emerald-400 mt-1">{operationalMetrics.confirmedOrdersCount}</p>
          <p className="text-[10px] text-white/40 font-bold mt-0.5">Confirmadas / Entregadas / Devueltas</p>
        </Card>

        <Card className="bg-[#151515] border-white/5 rounded-2xl p-4">
          <p className="text-[10px] font-black uppercase text-white/35 tracking-wider">Canceladas / Expiradas</p>
          <p className="text-2xl font-black text-red-400 mt-1">{operationalMetrics.cancelledOrdersCount}</p>
          <p className="text-[10px] text-white/40 font-bold mt-0.5">No suman ingresos ni bloquean stock</p>
        </Card>

        <Card className="bg-[#151515] border-white/5 rounded-2xl p-4">
          <p className="text-[10px] font-black uppercase text-white/35 tracking-wider flex items-center gap-1">
            <Clock className="w-3 h-3 text-brand-yellow" /> Duración Promedio
          </p>
          <p className="text-2xl font-black text-white mt-1">{operationalMetrics.avgHours} hrs</p>
          <p className="text-[10px] text-white/40 font-bold mt-0.5">
            Total: {operationalMetrics.totalHours} hrs ({(operationalMetrics.totalHours / 24).toFixed(1)} días eq.)
          </p>
        </Card>

        <Card className="bg-[#151515] border-white/5 rounded-2xl p-4">
          <p className="text-[10px] font-black uppercase text-white/35 tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-400" /> Devoluciones con Retraso
          </p>
          <p className="text-2xl font-black text-amber-400 mt-1">
            {operationalMetrics.overdueActiveCount + operationalMetrics.returnedLateCount}
          </p>
          <p className="text-[10px] text-white/40 font-bold mt-0.5">
            {operationalMetrics.overdueActiveCount} vencidas activas · {operationalMetrics.returnedLateCount} devueltas tarde
          </p>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-[#1A1A1A] border-white/5 rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-white/5 pb-3">
            <CardTitle className="text-white text-sm font-bold">Cobros de alquiler y ventas/servicios completados (Bs.)</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 px-2">
            {timelineChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={timelineChartData}>
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.35)" fontSize={10} tickLine={false} axisLine={false}/>
                  <YAxis stroke="rgba(255,255,255,0.35)" fontSize={10} tickLine={false} axisLine={false}/>
                  <Tooltip contentStyle={{background:'#222',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',color:'#fff'}}/>
                  <Bar dataKey="alquileres" fill="#F5B800" radius={[4,4,0,0]} name="Cobros de alquiler (paidAt)"/>
                  <Bar dataKey="ventas" fill="#60A5FA" radius={[4,4,0,0]} name="Tienda (Bs.)"/>
                  <Bar dataKey="taller" fill="#C084FC" radius={[4,4,0,0]} name="Taller (Bs.)"/>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="py-16 text-center"><p className="text-white/20 text-sm font-bold">Sin movimientos en este rango de fechas</p></div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-[#1A1A1A] border-white/5 rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-white/5 pb-3">
            <CardTitle className="text-white text-sm font-bold">Top Bicicletas por Unidades Alquiladas</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 px-2">
            {bikePerformance.mostRented.some(b => b.totalUnitsUsed > 0) ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={bikePerformance.mostRented.filter(b => b.totalUnitsUsed > 0).slice(0, 7)} layout="vertical">
                  <XAxis type="number" stroke="rgba(255,255,255,0.35)" fontSize={10} tickLine={false} axisLine={false}/>
                  <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.65)" fontSize={10} width={115} tickLine={false} axisLine={false}/>
                  <Tooltip contentStyle={{background:'#222',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',color:'#fff'}}/>
                  <Bar dataKey="totalUnitsUsed" fill="#F5B800" radius={[0,4,4,0]} name="Unidades (Directo + Combo)"/>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="py-16 text-center"><p className="text-white/20 text-sm font-bold">Sin bicicletas alquiladas en este periodo</p></div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table: Bike Performance (Most & Least Rented, Hours, Days, Revenue) */}
      <Card className="bg-[#1A1A1A] border-white/5 rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-white/5 pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-white text-base font-black flex items-center gap-2">
              <Bike className="w-4 h-4 text-brand-yellow" />
              Rendimiento Detallado por Bicicleta (Flota Real)
            </CardTitle>
            <p className="text-xs text-white/40 font-medium mt-0.5">
              Separa uso en alquiler individual vs. uso como bicicleta base dentro de un Combo para no duplicar unidades.
            </p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-black/30 text-white/50 font-black uppercase text-[10px]">
                  <th className="p-3.5">#</th>
                  <th className="p-3.5">Bicicleta</th>
                  <th className="p-3.5">Categoría</th>
                  <th className="p-3.5 text-center">Alq. Individual</th>
                  <th className="p-3.5 text-center">Usada en Combos</th>
                  <th className="p-3.5 text-center">Total Salidas</th>
                  <th className="p-3.5 text-center">Horas / Días Uso</th>
                  <th className="p-3.5 text-right">Ingreso Directo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white font-medium">
                {bikePerformance.mostRented.map((b, idx) => (
                  <tr key={b.id} className="hover:bg-white/[0.02]">
                    <td className="p-3.5 font-mono text-white/40">{idx + 1}</td>
                    <td className="p-3.5 font-black">{b.name}</td>
                    <td className="p-3.5 text-white/50">{b.category}</td>
                    <td className="p-3.5 text-center font-bold">{b.directUnits}</td>
                    <td className="p-3.5 text-center font-bold text-blue-400">{b.comboUnits}</td>
                    <td className="p-3.5 text-center">
                      <Badge className={`${b.totalUnitsUsed > 0 ? 'bg-brand-yellow/15 text-brand-yellow' : 'bg-white/5 text-white/30'} border-0 font-black`}>
                        {b.totalUnitsUsed} uds.
                      </Badge>
                    </td>
                    <td className="p-3.5 text-center text-white/70 font-bold">
                      {b.hoursRented} h <span className="text-white/35">({(b.hoursRented / 24).toFixed(1)} d)</span>
                    </td>
                    <td className="p-3.5 text-right font-black text-brand-yellow">Bs. {b.directRevenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Combos & Accessories Breakdown */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-[#1A1A1A] border-white/5 rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-white/5 pb-3">
            <CardTitle className="text-white text-sm font-black flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-yellow" />
              Bicicletas Combinadas (Paquetes / Combos)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-black/30 text-white/50 font-black uppercase text-[10px]">
                    <th className="p-3">Combo</th>
                    <th className="p-3 text-center">Alquileres</th>
                    <th className="p-3 text-center">Horas Uso</th>
                    <th className="p-3 text-right">Ingresos (Bs.)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-white">
                  {comboStats.map(c => (
                    <tr key={c.id} className="hover:bg-white/[0.02]">
                      <td className="p-3 font-bold">{c.name}</td>
                      <td className="p-3 text-center font-black">{c.count}</td>
                      <td className="p-3 text-center text-white/60">{c.hours} h</td>
                      <td className="p-3 text-right font-black text-brand-yellow">Bs. {c.revenue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1A1A1A] border-white/5 rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-white/5 pb-3">
            <CardTitle className="text-white text-sm font-black flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-brand-yellow" />
              Accesorios Más Alquilados (Extras + Combos)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-black/30 text-white/50 font-black uppercase text-[10px]">
                    <th className="p-3">Accesorio</th>
                    <th className="p-3 text-center">Extra Individual</th>
                    <th className="p-3 text-center">En Combos</th>
                    <th className="p-3 text-center">Total Usos</th>
                    <th className="p-3 text-right">Ingreso Extra</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-white">
                  {accessoryStats.map(a => (
                    <tr key={a.id} className="hover:bg-white/[0.02]">
                      <td className="p-3 font-bold">{a.name}</td>
                      <td className="p-3 text-center font-bold">{a.directQty}</td>
                      <td className="p-3 text-center text-blue-400 font-bold">{a.comboQty}</td>
                      <td className="p-3 text-center font-black">{a.totalQty}</td>
                      <td className="p-3 text-right font-black text-brand-yellow">Bs. {a.directRevenue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
