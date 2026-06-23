import { useMemo } from 'react';
import { LayoutDashboard, Bike, Users, AlertTriangle, CalendarCheck, Package, TrendingUp, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useStore } from '@/context/StoreContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const statusColors: Record<string, string> = {
  'Pendiente': 'bg-yellow-500/15 text-yellow-500 border-0',
  'pending': 'bg-yellow-500/15 text-yellow-500 border-0',
  'Confirmado': 'bg-green-500/15 text-green-400 border-0',
  'confirmed': 'bg-green-500/15 text-green-400 border-0',
  'Cancelado': 'bg-red-500/15 text-red-400 border-0',
  'cancelled': 'bg-red-500/15 text-red-400 border-0',
  'expired': 'bg-zinc-500/15 text-zinc-400 border-0',
};

const statusTranslations: Record<string, string> = {
  'pending': 'Pendiente',
  'confirmed': 'Confirmado',
  'cancelled': 'Cancelado',
  'expired': 'Expirado',
  'Pendiente': 'Pendiente',
  'Confirmado': 'Confirmado',
  'Cancelado': 'Cancelado',
};

export default function DashboardPage() {
  const { inventory, combos, rentals, sales, customers, resetAllData } = useStore();

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const confirmedRentals = rentals.filter(r => r.status === 'Confirmado' || r.status === 'confirmed');
  const completedSales = sales.filter(s => s.status === 'Completado');

  // Time-based stats
  const rentalsToday = confirmedRentals.filter(r => (r.createdAt || r.createdDate || '').startsWith(todayStr)).length;
  const salesToday = completedSales.filter(s => s.date?.startsWith(todayStr)).length;
  const incomeToday = confirmedRentals.filter(r => (r.createdAt || r.createdDate || '').startsWith(todayStr)).reduce((s, r) => s + r.total, 0)
    + completedSales.filter(s => s.date?.startsWith(todayStr)).reduce((s, v) => s + v.total, 0);

  const rentalsWeek = confirmedRentals.filter(r => new Date(r.createdAt || r.createdDate || '') >= weekAgo).length;
  const salesWeek = completedSales.filter(s => new Date(s.date) >= weekAgo).length;
  const incomeWeek = confirmedRentals.filter(r => new Date(r.createdAt || r.createdDate || '') >= weekAgo).reduce((s, r) => s + r.total, 0)
    + completedSales.filter(s => new Date(s.date) >= weekAgo).reduce((s, v) => s + v.total, 0);

  const rentalsMonth = confirmedRentals.filter(r => new Date(r.createdAt || r.createdDate || '') >= monthAgo).length;
  const salesMonth = completedSales.filter(s => new Date(s.date) >= monthAgo).length;
  const incomeMonth = confirmedRentals.filter(r => new Date(r.createdAt || r.createdDate || '') >= monthAgo).reduce((s, r) => s + r.total, 0)
    + completedSales.filter(s => new Date(s.date) >= monthAgo).reduce((s, v) => s + v.total, 0);

  // Low stock items
  const lowStockItems = inventory.filter(i => {
    if (i.hasWheelSizes && i.wheelSizes) return i.wheelSizes.some(ws => ws.stock > 0 && ws.stock < 5);
    return (i.stock ?? 0) > 0 && (i.stock ?? 0) < 5;
  });

  // Most rented products
  const productRentCount = useMemo(() => {
    const counts: Record<string, { name: string; count: number }> = {};
    confirmedRentals.forEach(r => {
      if (!counts[r.productName]) counts[r.productName] = { name: r.productName, count: 0 };
      counts[r.productName].count += r.quantity;
    });
    return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [confirmedRentals]);

  const topCustomers = useMemo(() => {
    const counts: Record<string, { name: string; rentals: number; spent: number }> = {};
    confirmedRentals.forEach(rental => {
      const key = rental.customerCI || rental.customerPhone || rental.customerName;
      if (!counts[key]) counts[key] = { name: rental.customerName, rentals: 0, spent: 0 };
      counts[key].rentals += rental.quantity;
      counts[key].spent += rental.total;
    });
    return Object.values(counts).sort((a, b) => b.rentals - a.rentals || b.spent - a.spent).slice(0, 5);
  }, [confirmedRentals]);

  // Recent rentals chart (last 7 days)
  const chartData = useMemo(() => {
    const days: { name: string; alquileres: number; ingresos: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const ds = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('es', { weekday: 'short' });
      const dayRentals = confirmedRentals.filter(r => (r.createdAt || r.createdDate || '').startsWith(ds));
      days.push({ name: label, alquileres: dayRentals.length, ingresos: dayRentals.reduce((s, r) => s + r.total, 0) });
    }
    return days;
  }, [confirmedRentals]);

  const hasData = rentals.length > 0 || sales.length > 0;
  const recentRentals = [...rentals].sort((a, b) => new Date(b.createdAt || b.createdDate || '').getTime() - new Date(a.createdAt || a.createdDate || '').getTime()).slice(0, 5);

  const stats = [
    { label: 'Pendientes', value: rentals.filter(r => r.status === 'Pendiente' || r.status === 'pending').length, icon: CalendarCheck, color: 'text-yellow-400 bg-yellow-400/10' },
    { label: 'Confirmados', value: confirmedRentals.length, icon: Bike, color: 'text-green-400 bg-green-400/10' },
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
          <p className="text-brand-charcoal/55 text-sm font-medium">Lo importante de Tienda, alquileres y clientes en un vistazo.</p>
        </div>
        <Button variant="ghost" size="sm" className="text-red-400/40 hover:text-red-400 hover:bg-red-400/10 rounded-lg text-[10px] font-bold uppercase"
          onClick={() => { if (confirm('¿Resetear TODOS los datos?')) resetAllData(); }}>
          <RotateCcw className="w-3 h-3 mr-1"/> Reset
        </Button>
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
          { period: 'Semana', r: rentalsWeek, s: salesWeek, i: incomeWeek },
          { period: 'Mes', r: rentalsMonth, s: salesMonth, i: incomeMonth },
        ].map((p, idx) => (
          <Card key={idx} className="bg-white/70 backdrop-blur border-brand-yellow/20 rounded-2xl shadow-sm">
            <CardContent className="p-5 space-y-3">
              <p className="text-[10px] font-black text-brand-yellow uppercase tracking-widest">{p.period}</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div><p className="text-xl font-black text-brand-charcoal">{p.r}</p><p className="text-[9px] text-brand-charcoal/45 font-bold uppercase">Alquileres</p></div>
                <div><p className="text-xl font-black text-brand-charcoal">{p.s}</p><p className="text-[9px] text-brand-charcoal/45 font-bold uppercase">Ventas</p></div>
                <div><p className="text-xl font-black text-brand-yellow">Bs.{p.i}</p><p className="text-[9px] text-white/30 font-bold uppercase">Ingresos</p></div>
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
            <div key={customer.name} className="rounded-xl bg-[#FFF9E8] border border-brand-yellow/15 p-4">
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
