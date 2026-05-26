import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, Bike, ShoppingBag } from 'lucide-react';
import { useStore } from '@/context/StoreContext';

export default function ReportsPage() {
    const { rentals, sales } = useStore();

    const confirmedRentals = rentals.filter(r => r.status === 'Confirmado' || r.status === 'confirmed');
    const completedSales = sales.filter(s => s.status === 'Completado');

    const totalRentalIncome = confirmedRentals.reduce((s, r) => s + r.total, 0);
    const totalSalesIncome = completedSales.reduce((s, v) => s + v.total, 0);
    const totalIncome = totalRentalIncome + totalSalesIncome;

    // Product demand
    const productDemand = useMemo(() => {
        const counts: Record<string, { name: string; cantidad: number }> = {};
        confirmedRentals.forEach(r => {
            if (!counts[r.productName]) counts[r.productName] = { name: r.productName, cantidad: 0 };
            counts[r.productName].cantidad += r.quantity;
        });
        return Object.values(counts).sort((a, b) => b.cantidad - a.cantidad).slice(0, 7);
    }, [confirmedRentals]);

    // Weekly trend
    const weeklyData = useMemo(() => {
        const now = new Date();
        const days: { name: string; alquileres: number; ventas: number }[] = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const ds = d.toISOString().split('T')[0];
            const label = d.toLocaleDateString('es', { weekday: 'short' });
            days.push({
                name: label,
                alquileres: confirmedRentals.filter(r => (r.createdAt || r.createdDate || '').startsWith(ds)).reduce((s, r) => s + r.total, 0),
                ventas: completedSales.filter(s => s.date?.startsWith(ds)).reduce((s, v) => s + v.total, 0),
            });
        }
        return days;
    }, [confirmedRentals, completedSales]);

    const hasData = confirmedRentals.length > 0 || completedSales.length > 0;

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-end justify-between border-b border-white/10 pb-5">
                <div>
                    <h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-tight">
                        <div className="p-2 bg-brand-yellow/10 rounded-xl"><TrendingUp className="w-6 h-6 text-brand-yellow"/></div>
                        Reportes
                    </h1>
                    <p className="text-white/40 text-sm font-medium">Análisis basado en datos reales del negocio</p>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { label: 'Ingresos Totales', value: `Bs. ${totalIncome}`, icon: DollarSign, color: 'text-brand-yellow' },
                    { label: 'Alquileres Confirmados', value: confirmedRentals.length, icon: Bike, color: 'text-green-400' },
                    { label: 'Ventas Completadas', value: completedSales.length, icon: ShoppingBag, color: 'text-blue-400' },
                ].map((s, i) => (
                    <Card key={i} className="bg-[#1A1A1A] border-white/5 rounded-xl p-5">
                        <p className="text-[10px] font-black uppercase text-white/30 tracking-widest mb-2">{s.label}</p>
                        <p className={`text-3xl font-black text-white`}>{s.value}</p>
                    </Card>
                ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Weekly income */}
                <Card className="bg-[#1A1A1A] border-white/5 rounded-xl overflow-hidden">
                    <CardHeader className="border-b border-white/5 pb-3">
                        <CardTitle className="text-white text-sm font-bold">Ingresos últimos 7 días (Bs.)</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 px-2">
                        {hasData ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={weeklyData}>
                                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false}/>
                                    <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false}/>
                                    <Tooltip contentStyle={{background:'#2D2D2D',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'8px',color:'#fff'}}/>
                                    <Bar dataKey="alquileres" fill="#F5B800" radius={[4,4,0,0]} name="Alquileres"/>
                                    <Bar dataKey="ventas" fill="#60A5FA" radius={[4,4,0,0]} name="Ventas"/>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="py-16 text-center"><p className="text-white/20 text-sm font-bold">Sin datos todavía</p></div>
                        )}
                    </CardContent>
                </Card>

                {/* Product demand */}
                <Card className="bg-[#1A1A1A] border-white/5 rounded-xl overflow-hidden">
                    <CardHeader className="border-b border-white/5 pb-3">
                        <CardTitle className="text-white text-sm font-bold">Demanda de Productos</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 px-2">
                        {productDemand.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={productDemand} layout="vertical">
                                    <XAxis type="number" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false}/>
                                    <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.5)" fontSize={10} width={100} tickLine={false} axisLine={false}/>
                                    <Tooltip contentStyle={{background:'#2D2D2D',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'8px',color:'#fff'}}/>
                                    <Bar dataKey="cantidad" fill="#F5B800" radius={[0,4,4,0]}/>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="py-16 text-center"><p className="text-white/20 text-sm font-bold">Sin datos todavía</p></div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
