import { motion } from 'framer-motion';
import { LayoutDashboard, Bike, Package, ShoppingCart, Wrench, Users, AlertTriangle, CalendarCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/context/StoreContext';
import { useAuth } from '@/context/AuthContext';
import { rentalTrend, revenueByArea } from '@/data/mockData';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const statusColors: Record<string, string> = {
    'Pendiente': 'bg-yellow-500/15 text-yellow-600 border-0',
    'Confirmado': 'bg-blue-500/15 text-blue-600 border-0',
    'Activo': 'bg-green-500/15 text-green-600 border-0',
    'Devuelto': 'bg-gray-500/15 text-gray-500 border-0',
    'Atrasado': 'bg-red-500/15 text-red-600 border-0',
    'Cancelado': 'bg-red-500/15 text-red-400 border-0',
    'Recibido': 'bg-blue-500/15 text-blue-600 border-0',
    'En revisión': 'bg-yellow-500/15 text-yellow-600 border-0',
    'En reparación': 'bg-orange-500/15 text-orange-600 border-0',
    'Listo': 'bg-green-500/15 text-green-600 border-0',
    'Entregado': 'bg-gray-500/15 text-gray-500 border-0',
    'Completado': 'bg-green-500/15 text-green-600 border-0',
};

export default function DashboardPage() {
    const { bikes, products, rentals, sales, customers, serviceOrders } = useStore();
    const { } = useAuth(); // kept for future or removed

    const stats = [
        { label: 'Alquileres Activos', value: rentals.filter(r => r.status === 'Activo').length, icon: Bike, color: 'text-brand-yellow bg-brand-yellow/10' },
        { label: 'Bicis Disponibles', value: bikes.filter(b => b.available).length, icon: Package, color: 'text-green-400 bg-green-400/10' },
        { label: 'En Mantenimiento', value: bikes.filter(b => b.condition === 'En Mantenimiento').length, icon: Wrench, color: 'text-orange-400 bg-orange-400/10' },
        { label: 'Ventas Totales', value: sales.reduce((acc, sale) => acc + sale.total, 0), icon: ShoppingCart, color: 'text-blue-400 bg-blue-400/10' },
        { label: 'Órdenes Servicio', value: serviceOrders.length, icon: Wrench, color: 'text-purple-400 bg-purple-400/10' },
        { label: 'Stock Bajo', value: products.filter(p => p.stock < 5).length, icon: AlertTriangle, color: 'text-red-400 bg-red-400/10' },
        { label: 'Reservas Pendientes', value: rentals.filter(r => r.status === 'Pendiente').length, icon: CalendarCheck, color: 'text-brand-yellow bg-brand-yellow/10' },
        { label: 'Total Clientes', value: customers.length, icon: Users, color: 'text-teal-400 bg-teal-400/10' },
    ];

    const recentRentals = [...rentals].sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()).slice(0, 5);

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between border-b border-white/10 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <LayoutDashboard className="w-8 h-8 text-brand-yellow" />
                        Dashboard
                    </h1>
                    <p className="text-white/50 text-base mt-1">Resumen general y métricas de Briz — Cochabamba.</p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                        <Card className="bg-brand-charcoal/50 border-white/5">
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center shrink-0`}>
                                    <stat.icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                                    <p className="text-xs text-white/50">{stat.label}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Charts (Mock data kept for visual aesthetics since we don't have historical data generation yet) */}
            <div className="grid lg:grid-cols-2 gap-6">
                <Card className="bg-brand-charcoal/50 border-white/5">
                    <CardHeader><CardTitle className="text-white text-sm">Ingresos Mensuales</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <AreaChart data={revenueByArea}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={12} />
                                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} />
                                <Tooltip contentStyle={{ background: '#2D2D2D', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                                <Area type="monotone" dataKey="alquileres" stackId="1" stroke="#F5B800" fill="#F5B800" fillOpacity={0.3} />
                                <Area type="monotone" dataKey="ventas" stackId="1" stroke="#60A5FA" fill="#60A5FA" fillOpacity={0.2} />
                                <Area type="monotone" dataKey="servicio" stackId="1" stroke="#34D399" fill="#34D399" fillOpacity={0.15} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="bg-brand-charcoal/50 border-white/5">
                    <CardHeader><CardTitle className="text-white text-sm">Días con Mayor Demanda</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={rentalTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={12} />
                                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} />
                                <Tooltip contentStyle={{ background: '#2D2D2D', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                                <Bar dataKey="cantidad" fill="#F5B800" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Recent Rentals */}
                <Card className="bg-brand-charcoal/50 border-white/5">
                    <CardHeader><CardTitle className="text-white text-sm">Últimas Reservas Confirmadas</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        {recentRentals.length > 0 ? recentRentals.map(r => (
                            <div key={r.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                <div>
                                    <p className="text-sm text-white font-medium">{r.customerName}</p>
                                    <p className="text-xs text-white/40">{r.bikeSnapshot.name} • {r.duration}</p>
                                </div>
                                <Badge className={statusColors[r.status]}>{r.status}</Badge>
                            </div>
                        )) : (
                            <p className="text-sm text-white/40 py-4 text-center">No hay alquileres recientes.</p>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Service */}
                <Card className="bg-brand-charcoal/50 border-white/5">
                    <CardHeader><CardTitle className="text-white text-sm">Órdenes de Servicio</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        {serviceOrders.slice(0, 5).map(so => (
                            <div key={so.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                <div>
                                    <p className="text-sm text-white font-medium">{so.customer}</p>
                                    <p className="text-xs text-white/40">{so.issue}</p>
                                </div>
                                <Badge className={statusColors[so.status]}>{so.status}</Badge>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
