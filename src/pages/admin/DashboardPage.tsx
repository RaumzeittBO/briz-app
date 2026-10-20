import { useMemo } from 'react';
import { LayoutDashboard, Bike, Users, AlertTriangle, CalendarCheck, Package, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/context/StoreContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { toBoliviaDateString, addDaysToDateString } from '@/lib/dateUtils';

const statusColors: Record<string, string> = {
  'Pendiente': 'bg-yellow-500/15 text-yellow-500 border-0',
  'pending': 'bg-yellow-500/15 text-yellow-500 border-0',
  'Confirmado': 'bg-green-500/15 text-green-400 border-0',
  'confirmed': 'bg-green-500/15 text-green-400 border-0',
  'Entregado': 'bg-emerald-500/15 text-emerald-300 border-0',
  'delivered': 'bg-emerald-500/15 text-emerald-300 border-0',
  'Devuelto': 'bg-blue-500/15 text-blue-400 border-0',
  'returned': 'bg-blue-500/15 text-blue-400 border-0',
  'Cancelado': 'bg-red-500/15 text-red-400 border-0',
  'cancelled': 'bg-red-500/15 text-red-400 border-0',
  'expired': 'bg-zinc-500/15 text-zinc-400 border-0',
};

const statusTranslations: Record<string, string> = {
  'pending': 'Pendiente',
  'confirmed': 'Confirmado',
  'delivered': 'Entregado',
  'returned': 'Devuelto',
  'cancelled': 'Cancelado',
  'expired': 'Expirado',
  'Pendiente': 'Pendiente',
  'Confirmado': 'Confirmado',
  'Entregado': 'Entregado',
  'Devuelto': 'Devuelto',
  'Cancelado': 'Cancelado',
};

const isEffectiveRentalStatus = (status?: string) =>
  status === 'Confirmado' ||
  status === 'confirmed' ||
  status === 'Entregado' ||
  status === 'delivered' ||
  status === 'Devuelto' ||
  status === 'returned';

export default function DashboardPage() {
  const { inventory, combos, rentals, sales, serviceOrders, customers } = useStore();

  const todayStr = toBoliviaDateString();
  const weekAgoStr = addDaysToDateString(todayStr, -6);
  const monthAgoStr = addDaysToDateString(todayStr, -29);

  // Include confirmed, delivered AND returned rentals so completed rentals never disappear from revenue
  const effectiveRentals = useMemo(
    () => rentals.filter(r => isEffectiveRentalStatus(r.status)),
    [rentals]
  );
  const completedSales = useMemo(
    () => sales.filter(s => s.status === 'Completado'),
    [sales]
  );
  const completedServices = useMemo(
    () => (serviceOrders || []).filter(so => so.status === 'Entregado' || so.status === 'Listo' || (so.status as string) === 'Terminado'),
    [serviceOrders]
  );

  const getRentalBoliviaDate = (r: any) =>
    r.date && /^\d{4}-\d{2}-\d{2}$/.test(r.date)
      ? r.date
      : toBoliviaDateString(r.createdAt || r.createdDate || new Date());

  const getSaleBoliviaDate = (s: any) =>
    s.date && /^\d{4}-\d{2}-\d{2}$/.test(s.date)
      ? s.date
      : toBoliviaDateString(s.date || new Date());

  const getServiceBoliviaDate = (so: any) =>
    so.date && /^\d{4}-\d{2}-\d{2}$/.test(so.date)
      ? so.date
      : toBoliviaDateString(so.date || new Date());

  // Time-based stats (Bolivia UTC-4)
  const rentalsTodayList = effectiveRentals.filter(r => getRentalBoliviaDate(r) === todayStr);
  const salesTodayList = completedSales.filter(s => getSaleBoliviaDate(s) === todayStr);
  const servicesTodayList = completedServices.filter(so => getServiceBoliviaDate(so) === todayStr);
  const rentalsToday = rentalsTodayList.filter(r => !r.productId.startsWith('srv_')).length;
  const salesToday = salesTodayList.length;
  const incomeToday =
    rentalsTodayList.reduce((s, r) => s + (Number(r.total) || 0), 0) +
    salesTodayList.reduce((s, v) => s + (Number(v.total) || 0), 0) +
    servicesTodayList.reduce((s, so) => s + (Number(so.costEstimate ?? (so as any).price) || 0), 0);

  const rentalsWeekList = effectiveRentals.filter(r => {
    const d = getRentalBoliviaDate(r);
    return d >= weekAgoStr && d <= todayStr;
  });
  const salesWeekList = completedSales.filter(s => {
    const d = getSaleBoliviaDate(s);
    return d >= weekAgoStr && d <= todayStr;
  });
  const servicesWeekList = completedServices.filter(so => {
    const d = getServiceBoliviaDate(so);
    return d >= weekAgoStr && d <= todayStr;
  });
  const rentalsWeek = rentalsWeekList.filter(r => !r.productId.startsWith('srv_')).length;
  const salesWeek = salesWeekList.length;
  const incomeWeek =
    rentalsWeekList.reduce((s, r) => s + (Number(r.total) || 0), 0) +
    salesWeekList.reduce((s, v) => s + (Number(v.total) || 0), 0) +
    servicesWeekList.reduce((s, so) => s + (Number(so.costEstimate ?? (so as any).price) || 0), 0);

  const rentalsMonthList = effectiveRentals.filter(r => {
    const d = getRentalBoliviaDate(r);
    return d >= monthAgoStr && d <= todayStr;
  });
  const salesMonthList = completedSales.filter(s => {
    const d = getSaleBoliviaDate(s);
    return d >= monthAgoStr && d <= todayStr;
  });
  const servicesMonthList = completedServices.filter(so => {
    const d = getServiceBoliviaDate(so);
    return d >= monthAgoStr && d <= todayStr;
  });
  const rentalsMonth = rentalsMonthList.filter(r => !r.productId.startsWith('srv_')).length;
  const salesMonth = salesMonthList.length;
  const incomeMonth =
    rentalsMonthList.reduce((s, r) => s + (Number(r.total) || 0), 0) +
    salesMonthList.reduce((s, v) => s + (Number(v.total) || 0), 0) +
    servicesMonthList.reduce((s, so) => s + (Number(so.costEstimate ?? (so as any).price) || 0), 0);

  // Low stock items
  const lowStockItems = inventory.filter(i => {
    if (i.hasWheelSizes && i.wheelSizes) return i.wheelSizes.some(ws => ws.stock > 0 && ws.stock < 5);
    return (i.stock ?? 0) > 0 && (i.stock ?? 0) < 5;
  });

  // Most rented products (excluding transport services)
  const productRentCount = useMemo(() => {
    const counts: Record<string, { name: string; count: number }> = {};
    effectiveRentals.forEach(r => {
      if (r.productId.startsWith('srv_')) return;
      if (!counts[r.productName]) counts[r.productName] = { name: r.productName, count: 0 };
      counts[r.productName].count += r.quantity;
    });
    return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [effectiveRentals]);

  const topCustomers = useMemo(() => {
    const counts: Record<string, { name: string; rentals: number; spent: number }> = {};
    effectiveRentals.forEach(rental => {
      const key = rental.customerCI || rental.customerPhone || rental.customerName;
      if (!counts[key]) counts[key] = { name: rental.customerName, rentals: 0, spent: 0 };
      if (!rental.productId.startsWith('srv_')) {
        counts[key].rentals += rental.quantity;
      }
      counts[key].spent += Number(rental.total) || 0;
    });
    return Object.values(counts).sort((a, b) => b.rentals - a.rentals || b.spent - a.spent).slice(0, 5);
  }, [effectiveRentals]);

  // Recent rentals chart (last 7 days in Bolivia time)
  const chartData = useMemo(() => {
    const days: { name: string; alquileres: number; ingresos: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const ds = addDaysToDateString(todayStr, -i);
      const [y, m, d] = ds.split('-').map(Number);
      const label = new Date(y, m - 1, d).toLocaleDateString('es', { weekday: 'short' });
      const dayRentals = effectiveRentals.filter(r => getRentalBoliviaDate(r) === ds);
      days.push({
        name: label,
        alquileres: dayRentals.filter(r => !r.productId.startsWith('srv_')).length,
        ingresos: dayRentals.reduce((s, r) => s + (Number(r.total) || 0), 0)
      });
    }
    return days;
  }, [effectiveRentals, todayStr]);

  const hasData = rentals.length > 0 || sales.length > 0;
  const recentRentals = [...rentals]
    .filter(r => !r.productId.startsWith('srv_'))
    .sort((a, b) => new Date(b.createdAt || b.createdDate || '').getTime() - new Date(a.createdAt || a.createdDate || '').getTime())
    .slice(0, 5);

  const stats = [
    { label: 'Pendientes', value: rentals.filter(r => r.status === 'Pendiente' || r.status === 'pending').length, icon: CalendarCheck, color: 'text-yellow-400 bg-yellow-400/10' },
    { label: 'Efectivos / Históricos', value: effectiveRentals.filter(r => !r.productId.startsWith('srv_')).length, icon: Bike, color: 'text-green-400 bg-green-400/10' },
    { label: 'Productos', value: inventory.length + combos.length, icon: Package, color: 'text-blue-400 bg-blue-400/10' },
    { label: 'Clientes', value: customers.length, icon: Users, color: 'text-teal-400 bg-teal-400/10' },
  ];

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between border-b border-brand-yellow/25 pb-5">
        <div>
          <h1 className="text-3xl font-black text-brand-charcoal flex items-center gap-3 tracking-tight">
            <div className="p-2 bg-brand-yellow/25 rounded-xl"><LayoutDashboard className="w-6 h-6 text-brand-yellow-vibrant"/></div>
            Resumen
          </h1>
          <p className="text-brand-charcoal/55 text-sm font-medium">Lo importante de Tienda, alquileres, taller y clientes en un vistazo (Hora Bolivia UTC-4).</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <Card key={i} className="bg-white/75 backdrop-blur border-brand-yellow/20 rounded-2xl shadow-sm">
            <CardContent className="p-5 flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${s.color}`}><s.icon className="w-5 h-5"/></div>
              <div>
                <p className="text-3xl font-black text-brand-charcoal">{s.value}</p>
                <p className="text-[10px] font-bold text-brand-charcoal/50 uppercase tracking-wider">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Period stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { period: 'Hoy', r: rentalsToday, s: salesToday, i: incomeToday },
          { period: 'Últimos 7 días', r: rentalsWeek, s: salesWeek, i: incomeWeek },
          { period: 'Últimos 30 días', r: rentalsMonth, s: salesMonth, i: incomeMonth },
        ].map((p, idx) => (
          <Card key={idx} className="bg-white/70 backdrop-blur border-brand-yellow/20 rounded-2xl shadow-sm">
            <CardContent className="p-5 space-y-3">
              <p className="text-[10px] font-black text-brand-yellow uppercase tracking-widest">{p.period}</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div><p className="text-xl font-black text-brand-charcoal">{p.r}</p><p className="text-[9px] text-brand-charcoal/45 font-bold uppercase">Alquileres</p></div>
                <div><p className="text-xl font-black text-brand-charcoal">{p.s}</p><p className="text-[9px] text-brand-charcoal/45 font-bold uppercase">Ventas</p></div>
                <div><p className="text-xl font-black text-brand-charcoal">Bs.{p.i}</p><p className="text-[9px] text-brand-charcoal/45 font-bold uppercase">Ingresos</p></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart + Top products */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-[#1A1A1A] border-white/5 rounded-xl overflow-hidden">
          <CardHeader className="border-b border-white/5 pb-3">
            <CardTitle className="text-white text-sm font-bold"><TrendingUp className="w-4 h-4 inline mr-2 text-brand-yellow"/>Alquileres últimos 7 días</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 px-2">
            {hasData ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false}/>
                  <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false}/>
                  <Tooltip contentStyle={{background:'#2D2D2D',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'8px',color:'#fff'}}/>
                  <Bar dataKey="alquileres" fill="#F5B800" radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="py-12 text-center"><p className="text-white/20 text-sm font-bold">Sin datos todavía</p></div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-[#1A1A1A] border-white/5 rounded-xl overflow-hidden">
          <CardHeader className="border-b border-white/5 pb-3">
            <CardTitle className="text-white text-sm font-bold"><Package className="w-4 h-4 inline mr-2 text-brand-yellow"/>Más alquilados</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-2">
            {productRentCount.length > 0 ? productRentCount.map((p, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5">
                <span className="text-white text-sm font-bold">{p.name}</span>
                <Badge className="bg-brand-yellow/10 text-brand-yellow border-0 font-black text-xs">{p.count}x</Badge>
              </div>
            )) : (
              <div className="py-12 text-center"><p className="text-white/20 text-sm font-bold">Sin datos todavía</p></div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Low stock + Recent rentals */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-[#1A1A1A] border-white/5 rounded-xl overflow-hidden">
          <CardHeader className="border-b border-white/5 pb-3">
            <CardTitle className="text-white text-sm font-bold"><AlertTriangle className="w-4 h-4 inline mr-2 text-red-400"/>Bajo Stock</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-2">
            {lowStockItems.length > 0 ? lowStockItems.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5">
                <span className="text-white text-sm font-bold">{item.name}</span>
                <span className="text-red-400 font-black text-sm">
                  {item.hasWheelSizes && item.wheelSizes
                    ? item.wheelSizes.filter(ws=>ws.stock<5&&ws.stock>0).map(ws=>`Aro ${ws.size}: ${ws.stock}`).join(', ')
                    : item.stock
                  }
                </span>
              </div>
            )) : (
              <div className="py-12 text-center"><p className="text-white/20 text-sm font-bold">Sin alertas de stock</p></div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-[#1A1A1A] border-white/5 rounded-xl overflow-hidden">
          <CardHeader className="border-b border-white/5 pb-3">
            <CardTitle className="text-white text-sm font-bold"><CalendarCheck className="w-4 h-4 inline mr-2 text-brand-yellow"/>Últimos Alquileres</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-2">
            {recentRentals.length > 0 ? recentRentals.map(r => (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5">
                <div>
                  <p className="text-white text-sm font-bold">{r.customerName}</p>
                  <p className="text-white/40 text-xs">{r.productName} • {r.duration}</p>
                </div>
                <Badge className={`${statusColors[r.status] || 'bg-zinc-500/15 text-zinc-400 border-0'} px-2 py-0.5 font-bold rounded-full text-[10px]`}>
                  {statusTranslations[r.status] || r.status}
                </Badge>
              </div>
            )) : (
              <div className="py-12 text-center"><p className="text-white/20 text-sm font-bold">Sin datos todavía</p></div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white/75 backdrop-blur border-brand-yellow/20 rounded-2xl shadow-sm overflow-hidden">
        <CardHeader className="border-b border-brand-yellow/15 pb-3">
          <CardTitle className="text-brand-charcoal text-sm font-bold"><Users className="w-4 h-4 inline mr-2 text-brand-cyan"/>Clientes que más alquilan</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {topCustomers.length > 0 ? topCustomers.map((customer, index) => (
            <div key={`${customer.name}-${index}`} className="rounded-xl bg-[#FFF9E8] border border-brand-yellow/15 p-4">
              <p className="text-[10px] font-black text-brand-cyan uppercase tracking-widest">Top {index + 1}</p>
              <p className="mt-2 font-black text-brand-charcoal truncate">{customer.name}</p>
              <p className="mt-1 text-xs font-bold text-brand-charcoal/55">{customer.rentals} alquiler{customer.rentals === 1 ? '' : 'es'} · Bs. {customer.spent}</p>
            </div>
          )) : <p className="col-span-full py-6 text-center text-sm font-bold text-brand-charcoal/45">Aún no hay alquileres confirmados.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
