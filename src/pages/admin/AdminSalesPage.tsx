import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Sale } from '@/context/StoreContext';
import { useStore } from '@/context/StoreContext';
import { Trash2, ShoppingBag, Receipt, PackageOpen } from 'lucide-react';

const statusColors: Record<string, string> = {
    'Completado': 'bg-green-500/15 text-green-600 border-0',
    'Pendiente': 'bg-yellow-500/15 text-yellow-600 border-0',
    'Cancelado': 'bg-red-500/15 text-red-600 border-0',
};

export default function AdminSalesPage() {
    const { sales, updateSaleStatus, deleteSale } = useStore();

    // Modal State
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

    const handleDelete = (id: string) => {
        if (confirm('¿Estás seguro de eliminar este pedido permanentemente?')) {
            deleteSale(id);
            if (selectedSale?.id === id) setSelectedSale(null);
        }
    };

    const handleStatusChange = (sale: Sale, newStatus: string) => {
        updateSaleStatus(sale.id, newStatus as any);
    };

    return (
        <div className="space-y-8 pb-20">
            <div className="flex items-end justify-between border-b border-white/10 pb-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-white flex items-center gap-3 tracking-tight">
                        <div className="p-2 bg-brand-yellow/10 rounded-xl">
                            <ShoppingBag className="w-8 h-8 text-brand-yellow" strokeWidth={2.5} />
                        </div>
                        Ventas y Pedidos
                    </h1>
                    <p className="text-white/50 text-lg font-medium">Registros de compras, transacciones e ingresos en tienda.</p>
                </div>
            </div>

            <Card className="bg-[#1A1A1A] border-white/5 rounded-[1.5rem] overflow-hidden shadow-xl">
                <CardContent className="p-0">
                    <div className="overflow-x-auto min-h-[50vh]">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-white/5 bg-white/[0.02] hover:bg-white/[0.02]">
                                    <TableHead className="text-white/40 font-bold uppercase text-[10px] tracking-wider py-5 pl-6">Fecha</TableHead>
                                    <TableHead className="text-white/40 font-bold uppercase text-[10px] tracking-wider py-5">Cliente</TableHead>
                                    <TableHead className="text-white/40 font-bold uppercase text-[10px] tracking-wider py-5">Resumen</TableHead>
                                    <TableHead className="text-white/40 font-bold uppercase text-[10px] tracking-wider py-5">Total</TableHead>
                                    <TableHead className="text-white/40 font-bold uppercase text-[10px] tracking-wider py-5">Estado</TableHead>
                                    <TableHead className="text-white/40 font-bold uppercase text-[10px] tracking-wider py-5 text-right pr-6">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sales.map(s => (
                                    <TableRow key={s.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                                        <TableCell className="text-white/50 font-medium text-sm py-4 pl-6 whitespace-nowrap">{new Date(s.date).toLocaleDateString()}</TableCell>
                                        <TableCell className="py-4">
                                            <p className="text-white font-bold text-base">{s.customerName}</p>
                                        </TableCell>
                                        <TableCell className="py-4 font-medium flex items-center gap-2 text-white/80">
                                            <div className="w-8 h-8 rounded bg-brand-yellow/10 flex items-center justify-center shrink-0">
                                                <PackageOpen className="w-4 h-4 text-brand-yellow" />
                                            </div>
                                            <span className="text-white/90">{s.items.length} item(s)</span>
                                        </TableCell>
                                        <TableCell className="py-4"><Badge variant="outline" className="border-brand-yellow/30 text-brand-yellow font-black text-sm bg-brand-yellow/10 rounded-md py-1">Bs. {s.total}</Badge></TableCell>
                                        <TableCell className="py-4">
                                            <select
                                                value={s.status}
                                                onChange={(e) => handleStatusChange(s, e.target.value)}
                                                className={`text-xs px-4 py-2 flex items-center justify-between rounded-full outline-none appearance-none cursor-pointer font-bold transition-all border border-transparent hover:border-white/20 shadow-sm ${statusColors[s.status]}`}
                                                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', paddingRight: '2rem' }}
                                            >
                                                <option value="Pendiente">Pendiente</option>
                                                <option value="Completado">Completado</option>
                                                <option value="Cancelado">Cancelado</option>
                                            </select>
                                        </TableCell>
                                        <TableCell className="text-right py-4 pr-6">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="sm" className="h-9 px-4 rounded-full text-white hover:text-brand-charcoal hover:bg-white font-bold transition-all shadow-sm" onClick={() => setSelectedSale(s)}>Recibo</Button>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-red-400/80 hover:text-white hover:bg-red-500 transition-all shadow-sm" onClick={() => handleDelete(s.id)}><Trash2 className="w-4 h-4" /></Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {sales.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-20 text-white/50">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                                                    <ShoppingBag className="w-8 h-8 text-brand-yellow/50" />
                                                </div>
                                                <p className="text-xl font-bold text-white mb-1">Sin Ventas</p>
                                                <p className="font-medium text-white/40">No hay ventas registradas aún en el sistema.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={!!selectedSale} onOpenChange={(val) => { if (!val) setSelectedSale(null) }}>
                <DialogContent className="max-w-2xl bg-brand-charcoal border border-white/10 text-white">
                    <DialogHeader className="border-b border-white/10 pb-4 mb-2">
                        <DialogTitle className="text-2xl flex items-center gap-2">
                            <Receipt className="w-6 h-6 text-brand-yellow" />
                            Recibo de Venta
                        </DialogTitle>
                    </DialogHeader>
                    {selectedSale && (
                        <div className="space-y-6 pt-2">
                            <div className="grid grid-cols-2 gap-4 text-sm bg-black/20 p-5 rounded-xl border border-white/5">
                                <div className="space-y-1">
                                    <p className="text-brand-yellow text-xs uppercase tracking-wider font-bold mb-2">Cliente</p>
                                    <p className="font-bold text-lg text-white">{selectedSale.customerName}</p>
                                    <p className="text-white/70 flex items-center gap-2">📱 {selectedSale.customerPhone}</p>
                                    <p className="text-white/70 flex items-center gap-2">🪪 CI: {selectedSale.customerCI}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-brand-yellow text-xs uppercase tracking-wider font-bold mb-2">Información del Pedido</p>
                                    <p className="text-white/70 mt-1 mb-2">Fecha: {new Date(selectedSale.date).toLocaleString()}</p>
                                    <Badge className={`${statusColors[selectedSale.status]} px-3 py-1 font-bold`}>{selectedSale.status}</Badge>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-bold text-white/80 uppercase tracking-wider mb-3">Artículos Comprados</h3>
                                <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
                                    {selectedSale.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center bg-black/20 p-4 rounded-xl border border-white/5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center text-brand-yellow/80">
                                                    <span className="text-xl">🛒</span>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white text-base">{item.name}</p>
                                                    <p className="text-xs text-white/50">{item.quantity} x Bs. {item.price} c/u</p>
                                                </div>
                                            </div>
                                            <div className="font-bold text-white/90 text-lg">
                                                Bs. {item.quantity * item.price}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {selectedSale.notes && (
                                <div className="bg-brand-yellow/5 p-4 rounded-xl border border-brand-yellow/20 text-sm">
                                    <p className="text-brand-yellow font-bold text-xs uppercase tracking-wider mb-1">Notas del cliente</p>
                                    <p className="text-white/90 italic">"{selectedSale.notes}"</p>
                                </div>
                            )}

                            <div className="flex justify-between items-end pt-6 border-t border-white/10 mt-4">
                                <span className="font-bold text-white/50 uppercase tracking-wider text-sm">Total del Pedido</span>
                                <span className="font-bold text-4xl text-brand-yellow">Bs. {selectedSale.total}</span>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
