import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { revenueByArea, rentalTrend, bestSellingProducts } from '@/data/mockData';
import { BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#F5B800', '#FFD54F', '#C49000', '#60A5FA', '#34D399'];

export default function ReportsPage() {
    return (
        <div className="space-y-6">
            <div><h1 className="text-2xl font-bold text-white">Reportes</h1><p className="text-white/50 text-sm">Análisis y visualización de datos</p></div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Revenue by area */}
                <Card className="bg-brand-charcoal/50 border-white/5">
                    <CardHeader><CardTitle className="text-white text-sm">Ingresos por Área (Bs.)</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={280}>
                            <AreaChart data={revenueByArea}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={12} />
                                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} />
                                <Tooltip contentStyle={{ background: '#2D2D2D', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                                <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }} />
                                <Area type="monotone" dataKey="alquileres" stroke="#F5B800" fill="#F5B800" fillOpacity={0.2} name="Alquileres" />
                                <Area type="monotone" dataKey="ventas" stroke="#60A5FA" fill="#60A5FA" fillOpacity={0.15} name="Ventas" />
                                <Area type="monotone" dataKey="servicio" stroke="#34D399" fill="#34D399" fillOpacity={0.1} name="Servicio" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Rental trend */}
                <Card className="bg-brand-charcoal/50 border-white/5">
                    <CardHeader><CardTitle className="text-white text-sm">Alquileres por Día</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={rentalTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={12} />
                                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} />
                                <Tooltip contentStyle={{ background: '#2D2D2D', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                                <Bar dataKey="cantidad" fill="#F5B800" radius={[4, 4, 0, 0]} name="Cantidad" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Best sellers */}
                <Card className="bg-brand-charcoal/50 border-white/5">
                    <CardHeader><CardTitle className="text-white text-sm">Productos Más Vendidos</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={bestSellingProducts} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis type="number" stroke="rgba(255,255,255,0.3)" fontSize={12} />
                                <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.3)" fontSize={11} width={100} />
                                <Tooltip contentStyle={{ background: '#2D2D2D', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                                <Bar dataKey="ventas" fill="#FFD54F" radius={[0, 4, 4, 0]} name="Ventas" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Distribution */}
                <Card className="bg-brand-charcoal/50 border-white/5">
                    <CardHeader><CardTitle className="text-white text-sm">Distribución de Ingresos</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Alquileres', value: 34200 },
                                        { name: 'Ventas', value: 21700 },
                                        { name: 'Servicio', value: 10900 },
                                    ]}
                                    cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                                    paddingAngle={5} dataKey="value"
                                    label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                >
                                    {[0, 1, 2].map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ background: '#2D2D2D', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Inventory alerts */}
            <Card className="bg-brand-charcoal/50 border-white/5">
                <CardHeader><CardTitle className="text-white text-sm">Alertas de Inventario</CardTitle></CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[
                            { product: 'Inflador de Piso Pro', stock: 8, min: 10, status: 'Bajo' },
                            { product: 'Alforjas Impermeables', stock: 10, min: 12, status: 'Bajo' },
                            { product: 'Cámara 700c', stock: 50, min: 15, status: 'OK' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                <div>
                                    <p className="text-sm text-white font-medium">{item.product}</p>
                                    <p className="text-xs text-white/40">Stock: {item.stock} | Mínimo: {item.min}</p>
                                </div>
                                <div className={`w-24 h-2 rounded-full ${item.stock < item.min ? 'bg-red-500/30' : 'bg-green-500/30'}`}>
                                    <div className={`h-full rounded-full ${item.stock < item.min ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${Math.min((item.stock / (item.min * 2)) * 100, 100)}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
