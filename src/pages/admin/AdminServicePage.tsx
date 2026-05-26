import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useStore } from '@/context/StoreContext';
import type { ServiceOrder } from '@/context/StoreContext';
import { Plus, Trash2, Wrench, Calendar, DollarSign, Pen } from 'lucide-react';

const statusColors: Record<string, string> = {
    'Recibido': 'bg-blue-500/15 text-blue-500 border-blue-500/20 text-xs',
    'En revisión': 'bg-brand-yellow/15 text-brand-yellow border-brand-yellow/20 text-xs',
    'En reparación': 'bg-orange-500/15 text-orange-400 border-orange-500/20 text-xs',
    'Listo': 'bg-green-500/15 text-green-400 border-green-500/20 text-xs',
    'Entregado': 'bg-gray-500/15 text-gray-400 border-gray-500/20 text-xs',
};

export default function AdminServicePage() {
    const { serviceOrders, addServiceOrder, updateServiceOrder, deleteServiceOrder } = useStore();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Initial State for a new Service Order
    const initialState: Partial<ServiceOrder> = {
        customer: '',
        phone: '',
        bikeType: '',
        issue: '',
        status: 'Recibido',
        estimatedDelivery: new Date().toISOString().split('T')[0],
        costEstimate: 0,
        notes: ''
    };

    const [currentOrder, setCurrentOrder] = useState<Partial<ServiceOrder>>(initialState);

    const handleOpenModal = (order?: ServiceOrder) => {
        if (order) {
            setCurrentOrder(order);
            setIsEditing(true);
        } else {
            setCurrentOrder(initialState);
            setIsEditing(false);
        }
        setIsModalOpen(true);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEditing && currentOrder.id) {
            updateServiceOrder(currentOrder.id, currentOrder);
        } else {
            addServiceOrder(currentOrder as Omit<ServiceOrder, 'id' | 'date'>);
        }
        setIsModalOpen(false);
    };

    const handleDelete = (id: string) => {
        if (window.confirm("¿Seguro que deseas eliminar esta orden de servicio?")) {
            deleteServiceOrder(id);
        }
    };

    const statusPipeline = ['Recibido', 'En revisión', 'En reparación', 'Listo', 'Entregado'];

    return (
        <div className="space-y-8 pb-20">
            <div className="flex items-end justify-between border-b border-white/10 pb-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-white flex items-center gap-3 tracking-tight">
                        <div className="p-2 bg-brand-yellow/10 rounded-xl">
                            <Wrench className="w-8 h-8 text-brand-yellow" strokeWidth={2.5} />
                        </div>
                        Taller & Servicio
                    </h1>
                    <p className="text-white/50 text-lg font-medium">Gestión integral del taller de reparación y mantenimiento.</p>
                </div>
                <Button
                    onClick={() => handleOpenModal()}
                    className="bg-white text-brand-black hover:bg-brand-yellow font-bold h-12 px-8 rounded-full shadow-lg transition-all hover:scale-105"
                >
                    <Plus className="w-5 h-5 mr-2" strokeWidth={3} /> Nueva Orden
                </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {statusPipeline.map(status => {
                    const count = serviceOrders.filter(so => so.status === status).length;
                    return (
                        <Card key={status} className="bg-[#1A1A1A] border-white/5 rounded-2xl relative overflow-hidden group hover:border-white/10 transition-all">
                            <div className={`absolute top-0 left-0 w-full h-[3px] opacity-50 ${statusColors[status].split(' ')[0]}`} />
                            <CardContent className="p-5 flex flex-col items-center justify-center text-center space-y-1">
                                <p className="text-4xl font-black text-white group-hover:scale-110 transition-transform duration-300">{count}</p>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">{status}</p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Table */}
            <Card className="bg-[#1A1A1A] border-white/5 rounded-[1.5rem] overflow-hidden shadow-xl">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-white/5 bg-white/[0.02] hover:bg-white/[0.02]">
                                    <TableHead className="text-white/40 font-bold uppercase text-[10px] tracking-wider py-5 pl-6">Cliente</TableHead>
                                    <TableHead className="text-white/40 font-bold uppercase text-[10px] tracking-wider py-5">Vehículo / Problema</TableHead>
                                    <TableHead className="text-white/40 font-bold uppercase text-[10px] tracking-wider py-5">Estado</TableHead>
                                    <TableHead className="text-white/40 font-bold uppercase text-[10px] tracking-wider py-5">Entrega Est.</TableHead>
                                    <TableHead className="text-white/40 font-bold uppercase text-[10px] tracking-wider py-5 text-right pr-6">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {serviceOrders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="py-20 text-center text-white/40 font-medium">
                                            No hay órdenes de servicio activas.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    serviceOrders.map(so => (
                                        <TableRow key={so.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                                            <TableCell className="pl-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-white font-bold text-base">{so.customer}</span>
                                                    <span className="text-white/40 text-xs font-bold leading-none mt-1">{so.phone}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-brand-yellow font-black text-sm uppercase tracking-wide">{so.bikeType}</span>
                                                    <span className="text-white/60 text-sm mt-1 line-clamp-1 max-w-[250px] italic">"{so.issue}"</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <Badge variant="outline" className={`${statusColors[so.status]} px-4 py-1.5 rounded-full font-bold border-0`}>
                                                    {so.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="flex items-center gap-2 text-white/70 font-bold">
                                                    <Calendar className="w-4 h-4 text-brand-yellow/50" />
                                                    <span className="text-sm">{so.estimatedDelivery}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right pr-6 py-4">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleOpenModal(so)}
                                                        className="h-9 px-4 rounded-full text-white hover:text-brand-charcoal hover:bg-brand-yellow font-bold transition-all shadow-sm"
                                                    >
                                                        Editar
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(so.id)}
                                                        className="h-9 w-9 rounded-full text-red-400/80 hover:text-white hover:bg-red-500 transition-all shadow-sm"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Modal Add/Edit */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="bg-brand-charcoal border-white/10 text-white max-w-2xl p-0 overflow-hidden">
                    <DialogHeader className="p-8 pb-6 border-b border-white/5 bg-[#1A1A1A]">
                        <DialogTitle className="text-3xl font-black text-white flex items-center gap-3 tracking-tight">
                            <div className="p-2 bg-brand-yellow/10 rounded-xl">
                                <Pen className="w-6 h-6 text-brand-yellow" strokeWidth={2.5} />
                            </div>
                            {isEditing ? 'Editar Orden' : 'Nueva Orden'}
                        </DialogTitle>
                        <DialogDescription className="text-white/40 text-lg font-medium mt-1">
                            {isEditing ? 'Actualiza los detalles técnicos y estado de la reparación.' : 'Registra un nuevo ingreso al taller de mantenimiento.'}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSave} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">

                        {/* Status override section */}
                        {isEditing && (
                            <div className="bg-brand-yellow/5 border border-brand-yellow/10 p-6 rounded-[1.25rem] flex items-center gap-6">
                                <Label className="text-brand-yellow font-black uppercase tracking-widest text-[10px] shrink-0">Estado de reparación</Label>
                                <select
                                    value={currentOrder.status}
                                    onChange={e => setCurrentOrder({ ...currentOrder, status: e.target.value as ServiceOrder['status'] })}
                                    className="flex-1 bg-black/40 border border-white/10 rounded-xl h-12 px-5 text-white font-bold hover:bg-black/60 transition-all focus:ring-2 focus:ring-brand-yellow/50 outline-none appearance-none"
                                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23F5B800' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', paddingRight: '3rem' }}
                                >
                                    {statusPipeline.map(s => <option key={s} value={s} className="bg-brand-charcoal">{s}</option>)}
                                </select>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Customer Info */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 border-b border-white/10 pb-2 mb-4">
                                    <h3 className="text-white/80 font-semibold uppercase tracking-wider text-sm">Info del Cliente</h3>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-white/70">Nombre Completo</Label>
                                    <Input
                                        value={currentOrder.customer}
                                        onChange={e => setCurrentOrder({ ...currentOrder, customer: e.target.value })}
                                        className="bg-black/40 border-white/10 h-11 focus-visible:ring-brand-yellow text-white"
                                        placeholder="Ej. Juan Pérez"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-white/70">Teléfono (WhatsApp)</Label>
                                    <Input
                                        value={currentOrder.phone}
                                        onChange={e => setCurrentOrder({ ...currentOrder, phone: e.target.value })}
                                        className="bg-black/40 border-white/10 h-11 focus-visible:ring-brand-yellow text-white"
                                        placeholder="Ej. 76543210"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Service Details */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 border-b border-white/10 pb-2 mb-4">
                                    <h3 className="text-white/80 font-semibold uppercase tracking-wider text-sm">Detalles Técnicos</h3>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-white/70">Tipo de Bicicleta</Label>
                                    <Input
                                        value={currentOrder.bikeType}
                                        onChange={e => setCurrentOrder({ ...currentOrder, bikeType: e.target.value })}
                                        className="bg-black/40 border-white/10 h-11 focus-visible:ring-brand-yellow text-white"
                                        placeholder="Ej. Mountain Bike 29''"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-white/70">Costo Estimado (Bs.)</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"><DollarSign className="w-4 h-4" /></span>
                                        <Input
                                            type="number"
                                            value={currentOrder.costEstimate}
                                            onChange={e => setCurrentOrder({ ...currentOrder, costEstimate: parseFloat(e.target.value) })}
                                            className="pl-9 bg-black/40 border-white/10 h-11 focus-visible:ring-brand-yellow text-brand-yellow font-bold"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                            <div className="space-y-2">
                                <Label className="text-white/70">Problema Reportado</Label>
                                <Textarea
                                    value={currentOrder.issue}
                                    onChange={e => setCurrentOrder({ ...currentOrder, issue: e.target.value })}
                                    className="bg-black/40 border-white/10 h-24 resize-none focus-visible:ring-brand-yellow text-white"
                                    placeholder="Describe el problema que el cliente reporta..."
                                    required
                                />
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-white/70">Notas Adicionales (Interno)</Label>
                                    <Textarea
                                        value={currentOrder.notes}
                                        onChange={e => setCurrentOrder({ ...currentOrder, notes: e.target.value })}
                                        className="bg-black/40 border-white/10 h-[52px] resize-none focus-visible:ring-brand-yellow text-white"
                                        placeholder="Repuestos necesarios, consideraciones..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-white/70 flex items-center gap-2"><Calendar className="w-4 h-4 text-brand-yellow" /> Fecha de Entrega Estimada</Label>
                                    <Input
                                        type="date"
                                        value={currentOrder.estimatedDelivery}
                                        onChange={e => setCurrentOrder({ ...currentOrder, estimatedDelivery: e.target.value })}
                                        className="bg-black/40 border-white/10 h-11 focus-visible:ring-brand-yellow [color-scheme:dark] text-white"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="pt-6 mt-4 border-t border-white/5 flex gap-3">
                            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="hover:bg-white/5 h-12 px-6">Cancelar</Button>
                            <Button type="submit" className="bg-brand-yellow text-brand-black hover:bg-brand-yellow-light font-bold h-12 px-8 flex-1 sm:flex-none">Guardar Cambios</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
