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
    const { sales, updateSaleStatus, deleteSale, updateStock } = useStore();

    // Modal State
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

    const handleDelete = (id: string) => {
        if (confirm('¿Estás seguro de eliminar este pedido permanentemente?')) {
            deleteSale(id);
            if (selectedSale?.id === id) setSelectedSale(null);
        }
    };

    const handleStatusChange = (sale: Sale, newStatus: string) => {
        if (newStatus === 'Completado' && sale.status !== 'Completado') {
            const itemsToUpdate = sale.items.map(item => ({
                id: item.id,
                type: item.itemType,
                quantity: item.quantity
            }));
            updateStock(itemsToUpdate, 'deduct');
        } else if (sale.status === 'Completado' && newStatus !== 'Completado') {
            const itemsToUpdate = sale.items.map(item => ({
                id: item.id,
                type: item.itemType,
                quantity: item.quantity
            }));
            updateStock(itemsToUpdate, 'restore');
        }

        updateSaleStatus(sale.id, newStatus as any);
    };

    return (
        <div className="space-y-8 pb-20">
            <div className="flex items-center justify-between border-b border-white/10 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <ShoppingBag className="w-8 h-8 text-brand-yellow" />
                        Ventas y Pedidos
                    </h1>
                    <p className="text-white/50 text-base mt-1">Registros de compras, transacciones e ingresos.</p>
                </div>
            </div>

            <Card className="bg-brand-charcoal/50 border-white/5">
                <CardContent className="p-0">
                    <div className="overflow-x-auto min-h-[50vh]">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-white/5 bg-white/[0.02]">
                                    <TableHead className="text-white/50 py-4">Fecha</TableHead>
                                    <TableHead className="text-white/50 py-4">Cliente</TableHead>
                                    <TableHead className="text-white/50 py-4">Resumen Items</TableHead>
                                    <TableHead className="text-white/50 py-4">Total</TableHead>
                                    <TableHead className="text-white/50 py-4">Estado</TableHead>
                                    <TableHead className="text-white/50 text-right py-4">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sales.map(s => (
                                    <TableRow key={s.id} className="border-white/5 hover:bg-white/5 transition-colors">
                                        <TableCell className="text-white/70 text-sm py-4">{new Date(s.date).toLocaleDateString()}</TableCell>
                                        <TableCell className="py-4">
                                            <p className="text-white font-medium">{s.customerName}</p>
                                        </TableCell>
                                        <TableCell className="py-4 flex items-center gap-2 text-white/80 font-medium">
                                            <PackageOpen className="w-4 h-4 text-brand-yellow" />
                                            {s.items.length} item(s)
                                        </TableCell>
                                        <TableCell className="py-4"><Badge variant="outline" className="border-brand-yellow/30 text-brand-yellow font-bold text-sm bg-brand-yellow/10">Bs. {s.total}</Badge></TableCell>
                                        <TableCell className="py-4">
                                            <select
                                                value={s.status}
                                                onChange={(e) => handleStatusChange(s, e.target.value)}
                                                className={`text-xs px-3 py-1.5 rounded-full outline-none appearance-none cursor-pointer font-medium ${statusColors[s.status]}`}
                                            >
                                                <option value="Pendiente">Pendiente</option>
                                                <option value="Completado">Completado</option>
                                                <option value="Cancelado">Cancelado</option>
                                            </select>
                                        </TableCell>
                                        <TableCell className="text-right py-4">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="sm" className="text-white hover:text-brand-yellow bg-white/5" onClick={() => setSelectedSale(s)}>Ver Recibo</Button>
                                                <Button variant="ghost" size="icon" className="text-red-400/60 hover:text-red-400 bg-white/5" onClick={() => handleDelete(s.id)}><Trash2 className="w-4 h-4" /></Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {sales.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-16 text-white/50">
                                            <div className="flex flex-col items-center justify-center">
                                                <ShoppingBag className="w-12 h-12 text-brand-yellow/20 mb-3" />
                                                <p className="text-lg font-medium text-white/70">No hay ventas registradas aún.</p>
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
                                                    <span className="text-xl">{item.itemType === 'bike' ? '🚲' : '🔧'}</span>
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
