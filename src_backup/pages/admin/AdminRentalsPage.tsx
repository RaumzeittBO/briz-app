import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Rental } from '@/context/StoreContext';
import { useStore } from '@/context/StoreContext';
import { Trash2, CalendarClock, Bike as BikeIcon, Wrench } from 'lucide-react';

const statusColors: Record<string, string> = {
    'Pendiente': 'bg-yellow-500/15 text-yellow-600 border-0',
    'Confirmado': 'bg-blue-500/15 text-blue-600 border-0',
    'Activo': 'bg-green-500/15 text-green-600 border-0',
    'Devuelto': 'bg-gray-500/15 text-gray-500 border-0',
    'Atrasado': 'bg-red-500/15 text-red-600 border-0',
    'Cancelado': 'bg-red-500/15 text-red-400 border-0',
};

export default function AdminRentalsPage() {
    const { rentals, updateRentalStatus, deleteRental, updateStock } = useStore();

    // Modal State
    const [selectedRental, setSelectedRental] = useState<Rental | null>(null);

    const handleDelete = (id: string) => {
        if (confirm('¿Estás seguro de eliminar este alquiler permanentemente?')) {
            deleteRental(id);
            if (selectedRental?.id === id) setSelectedRental(null);
        }
    };

    const handleStatusChange = (rental: Rental, newStatus: string) => {
        // Stock management logic based on status transition
        const itemsToUpdate = [
            { id: rental.bikeId, type: 'bike' as const, quantity: rental.bikeQty || 1 },
            ...rental.accessories.map(acc => ({ id: acc.id, type: 'accessory' as const, quantity: acc.quantity }))
        ];

        // Deduct stock if jumping from a non-active state to 'Activo'
        if (newStatus === 'Activo' && rental.status !== 'Activo') {
            updateStock(itemsToUpdate, 'deduct');
        }
        // Restore stock if it was 'Activo' and now it's returned or cancelled
        else if (rental.status === 'Activo' && ['Devuelto', 'Cancelado'].includes(newStatus)) {
            updateStock(itemsToUpdate, 'restore');
        }

        updateRentalStatus(rental.id, newStatus as any);
    };

    return (
        <div className="space-y-8 pb-20">
            <div className="flex items-center justify-between border-b border-white/10 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <CalendarClock className="w-8 h-8 text-brand-yellow" />
                        Gestión de Alquileres
                    </h1>
                    <p className="text-white/50 text-base mt-1">Administra reservas, entregas y devoluciones de bicicletas.</p>
                </div>
            </div>

            <Card className="bg-brand-charcoal/50 border-white/5">
                <CardContent className="p-0">
                    <div className="overflow-x-auto min-h-[50vh]">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-white/5 bg-white/[0.02]">
                                    <TableHead className="text-white/50 py-4">Fecha Creación</TableHead>
                                    <TableHead className="text-white/50 py-4">Cliente</TableHead>
                                    <TableHead className="text-white/50 py-4">Bicicleta</TableHead>
                                    <TableHead className="text-white/50 py-4">Día/Hora Recojo</TableHead>
                                    <TableHead className="text-white/50 py-4">Duración</TableHead>
                                    <TableHead className="text-white/50 py-4">Total</TableHead>
                                    <TableHead className="text-white/50 py-4">Estado</TableHead>
                                    <TableHead className="text-white/50 text-right py-4">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rentals.map(r => (
                                    <TableRow key={r.id} className="border-white/5 hover:bg-white/5 transition-colors">
                                        <TableCell className="text-white/70 text-sm py-4">{new Date(r.createdDate).toLocaleDateString()}</TableCell>
                                        <TableCell className="py-4">
                                            <p className="text-white font-medium">{r.customerName}</p>
                                        </TableCell>
                                        <TableCell className="text-white/80 py-4 font-medium flex items-center gap-2">
                                            <BikeIcon className="w-4 h-4 text-brand-yellow" />
                                            {(r as any).bikeQty || 1}x {r.bikeSnapshot.name}
                                        </TableCell>
                                        <TableCell className="text-white/70 py-4">{r.date} a las {r.pickupTime}</TableCell>
                                        <TableCell className="text-white/70 py-4">{r.duration}</TableCell>
                                        <TableCell className="py-4"><Badge variant="outline" className="border-brand-yellow/30 text-brand-yellow font-bold text-sm bg-brand-yellow/10">Bs. {r.total}</Badge></TableCell>
                                        <TableCell className="py-4">
                                            <select
                                                value={r.status}
                                                onChange={(e) => handleStatusChange(r, e.target.value)}
                                                className={`text-xs px-3 py-1.5 rounded-full outline-none appearance-none cursor-pointer font-medium ${statusColors[r.status]}`}
                                            >
                                                <option value="Pendiente">Pendiente</option>
                                                <option value="Confirmado">Confirmado</option>
                                                <option value="Activo">Activo</option>
                                                <option value="Devuelto">Devuelto</option>
                                                <option value="Atrasado">Atrasado</option>
                                                <option value="Cancelado">Cancelado</option>
                                            </select>
                                        </TableCell>
                                        <TableCell className="text-right py-4">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="sm" className="text-white hover:text-brand-yellow bg-white/5" onClick={() => setSelectedRental(r)}>Ver Detalle</Button>
                                                <Button variant="ghost" size="icon" className="text-red-400/60 hover:text-red-400 bg-white/5" onClick={() => handleDelete(r.id)}><Trash2 className="w-4 h-4" /></Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {rentals.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-16 text-white/50">
                                            <div className="flex flex-col items-center justify-center">
                                                <CalendarClock className="w-12 h-12 text-brand-yellow/20 mb-3" />
                                                <p className="text-lg font-medium text-white/70">No hay alquileres registrados.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={!!selectedRental} onOpenChange={(val) => { if (!val) setSelectedRental(null) }}>
                <DialogContent className="max-w-2xl bg-brand-charcoal border border-white/10 text-white">
                    <DialogHeader className="border-b border-white/10 pb-4 mb-2">
                        <DialogTitle className="text-2xl flex items-center gap-2">
                            <CalendarClock className="w-6 h-6 text-brand-yellow" />
                            Detalle del Alquiler
                        </DialogTitle>
                    </DialogHeader>
                    {selectedRental && (
                        <div className="space-y-6 pt-2">
                            <div className="grid grid-cols-2 gap-4 text-sm bg-black/20 p-5 rounded-xl border border-white/5">
                                <div className="space-y-1">
                                    <p className="text-brand-yellow text-xs uppercase tracking-wider font-bold mb-2">Cliente</p>
                                    <p className="font-bold text-lg text-white">{selectedRental.customerName}</p>
                                    <p className="text-white/70 flex items-center gap-2">📱 {selectedRental.customerPhone}</p>
                                    <p className="text-white/70 flex items-center gap-2">🪪 CI: {selectedRental.customerCI}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-brand-yellow text-xs uppercase tracking-wider font-bold mb-2">Horarios</p>
                                    <p className="text-white/70">Reserva: {new Date(selectedRental.createdDate).toLocaleDateString()}</p>
                                    <p className="font-bold text-white bg-white/5 rounded px-2 py-1 inline-block mt-1 mb-1">Retiro: {selectedRental.date} a las {selectedRental.pickupTime}</p>
                                    <p className="text-white/70 font-medium text-base">Duración: {selectedRental.duration}</p>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-bold text-white/80 uppercase tracking-wider mb-3">Ítems Reservados</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center bg-black/40 p-4 rounded-xl border border-brand-yellow/20">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-brand-yellow/10 text-brand-yellow rounded-lg flex items-center justify-center">
                                                <BikeIcon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-base text-white">{(selectedRental as any).bikeQty || 1}x {selectedRental.bikeSnapshot.name}</p>
                                                <p className="text-xs text-white/50">Bicicleta principal</p>
                                            </div>
                                        </div>
                                    </div>

                                    {selectedRental.accessories.map((acc, idx) => (
                                        <div key={idx} className="flex justify-between items-center bg-black/20 p-3 rounded-lg border border-white/5 ml-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center text-white/50">
                                                    <Wrench className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-sm text-white">{acc.name}</p>
                                                    <p className="text-xs text-white/50">{acc.quantity} x Bs. {acc.price} c/u</p>
                                                </div>
                                            </div>
                                            <div className="font-bold text-white/90">
                                                Bs. {acc.quantity * acc.price}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {selectedRental.notes && (
                                <div className="bg-brand-yellow/5 p-4 rounded-xl border border-brand-yellow/20 text-sm">
                                    <p className="text-brand-yellow font-bold text-xs uppercase tracking-wider mb-1">Notas del cliente</p>
                                    <p className="text-white/90 italic">"{selectedRental.notes}"</p>
                                </div>
                            )}

                            <div className="flex justify-between items-end pt-6 border-t border-white/10 mt-4">
                                <div>
                                    <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Estado del Alquiler</p>
                                    <Badge className={`${statusColors[selectedRental.status]} px-3 py-1 text-sm font-bold`}>{selectedRental.status}</Badge>
                                </div>
                                <div className="text-right">
                                    <p className="text-brand-yellow text-xs font-semibold uppercase tracking-wider mb-1">Total a Pagar</p>
                                    <span className="font-bold text-4xl text-brand-yellow">Bs. {selectedRental.total}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
