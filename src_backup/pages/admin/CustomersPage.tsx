import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useStore } from '@/context/StoreContext';
import type { Customer } from '@/context/StoreContext';
import { Search, Bike, ShoppingCart, Edit, User, UserPlus } from 'lucide-react';

export default function CustomersPage() {
    const { customers, updateCustomer, addOrUpdateCustomer, deleteCustomer, sales, rentals } = useStore();
    const [search, setSearch] = useState('');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [current, setCurrent] = useState<Partial<Customer>>({});

    const filtered = customers.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search) ||
        c.ci.includes(search)
    );

    const handleDelete = (id: string, name: string) => {
        if (confirm(`¿Estás seguro de eliminar a ${name} permanentemente?`)) {
            deleteCustomer(id);
        }
    };

    const openModal = (mode: 'add' | 'edit', cust?: Customer) => {
        setModalMode(mode);
        if (mode === 'edit' && cust) {
            setCurrent(cust);
        } else {
            setCurrent({ name: '', phone: '', ci: '', notes: '' });
        }
        setIsModalOpen(true);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (modalMode === 'add') {
            addOrUpdateCustomer({ name: current.name || '', phone: current.phone || '', ci: current.ci || '' }, false);
        } else if (current.id) {
            updateCustomer(current.id, current);
        }
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-8 pb-20">
            {/* Header section with larger spacing */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <User className="w-8 h-8 text-brand-yellow" />
                        Directorio de Clientes
                    </h1>
                    <p className="text-white/50 mt-1">Gestiona perfiles, historiales de alquiler y compras.</p>
                </div>
                <Button onClick={() => openModal('add')} className="bg-brand-yellow text-brand-black hover:bg-brand-yellow-light font-bold h-12 px-6 rounded-xl shadow-lg shadow-brand-yellow/20">
                    <UserPlus className="w-5 h-5 mr-2" /> Nuevo Cliente
                </Button>
            </div>

            {/* Expansive Search bar */}
            <div className="relative max-w-xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <Input placeholder="Buscar por nombre, CI o teléfono..." className="pl-12 h-14 rounded-2xl bg-brand-charcoal/50 border-white/10 text-white placeholder:text-white/30 text-lg shadow-sm focus-visible:ring-brand-yellow/50"
                    value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            {/* Profile Card Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filtered.map(c => {
                    const custRentals = rentals.filter(r => r.customerPhone === c.phone || r.customerCI === c.ci);
                    const custSales = sales.filter(s => s.customerPhone === c.phone || s.customerCI === c.ci);

                    const lastR = custRentals.length ? Math.max(...custRentals.map(r => new Date(r.createdDate).getTime())) : 0;
                    const lastS = custSales.length ? Math.max(...custSales.map(s => new Date(s.date).getTime())) : 0;
                    const lastInteraction = Math.max(lastR, lastS);

                    return (
                        <Card key={c.id} className="bg-brand-charcoal/40 border border-white/5 hover:border-brand-yellow/30 transition-all duration-300 hover:shadow-lg hover:shadow-brand-yellow/5 overflow-hidden flex flex-col group">
                            <CardContent className="p-0 flex-1 flex flex-col">
                                {/* Profile Header */}
                                <div className="p-5 flex gap-4 items-start relative border-b border-white/5 pb-5">
                                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-yellow/30 to-brand-yellow/10 flex items-center justify-center shrink-0 border border-brand-yellow/20">
                                        <span className="text-brand-yellow text-xl font-bold">{c.name.substring(0, 2).toUpperCase()}</span>
                                    </div>
                                    <div className="flex-1 min-w-0 pr-8">
                                        <h3 className="text-white font-bold text-lg truncate group-hover:text-brand-yellow transition-colors">{c.name}</h3>
                                        <p className="text-white/60 text-sm mt-0.5 truncate flex items-center gap-2">
                                            <span>📱 {c.phone}</span>
                                        </p>
                                        <p className="text-white/60 text-sm truncate flex items-center gap-2">
                                            <span>🪪 CI: {c.ci}</span>
                                        </p>
                                    </div>

                                    {/* Action dropdown replacement with explicit quick buttons */}
                                    <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-white/50 hover:text-white bg-white/5" onClick={() => openModal('edit', c)}>
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Stats Section */}
                                <div className="p-5 flex-1 bg-white/[0.02]">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-black/20 rounded-xl p-3 border border-white/5">
                                            <div className="flex items-center gap-2 justify-center mb-1 text-white/50 text-xs uppercase tracking-wider font-semibold">
                                                <Bike className="w-3.5 h-3.5 text-brand-yellow" /> Alquileres
                                            </div>
                                            <p className="text-center font-bold text-2xl text-white">{custRentals.length}</p>
                                        </div>
                                        <div className="bg-black/20 rounded-xl p-3 border border-white/5">
                                            <div className="flex items-center gap-2 justify-center mb-1 text-white/50 text-xs uppercase tracking-wider font-semibold">
                                                <ShoppingCart className="w-3.5 h-3.5 text-blue-400" /> Compras
                                            </div>
                                            <p className="text-center font-bold text-2xl text-white">{custSales.length}</p>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-white/50">
                                        <span>Última act:</span>
                                        <span className="font-medium text-white/70 bg-white/5 px-2 py-1 rounded-md">
                                            {lastInteraction > 0 ? new Date(lastInteraction).toLocaleDateString() : 'Ninguna'}
                                        </span>
                                    </div>
                                </div>

                                <button onClick={() => handleDelete(c.id, c.name)} className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold uppercase tracking-wider transition-colors">
                                    Eliminar
                                </button>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {filtered.length === 0 && (
                <div className="text-center py-20 px-4 bg-brand-charcoal/30 rounded-2xl border border-white/5">
                    <User className="w-16 h-16 mx-auto text-white/20 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No se encontraron clientes</h3>
                    <p className="text-white/50">Prueba con otro término de búsqueda o agrega uno nuevo.</p>
                </div>
            )}

            {/* Modal de Cliente */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-md bg-brand-charcoal text-white border-white/10">
                    <DialogHeader>
                        <DialogTitle className="text-2xl flex items-center gap-2">
                            {modalMode === 'add' ? <UserPlus className="w-6 h-6 text-brand-yellow" /> : <Edit className="w-6 h-6 text-brand-yellow" />}
                            {modalMode === 'add' ? 'Nuevo Cliente' : 'Editar Cliente'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSave} className="space-y-5 pt-4">
                        <div className="space-y-1.5">
                            <Label className="text-white/80">Nombre Completo</Label>
                            <Input required value={current.name || ''} onChange={e => setCurrent({ ...current, name: e.target.value })} className="h-12 bg-black/40 border-white/10 rounded-xl" placeholder="Ej. Juan Pérez" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-white/80">Celular / WhatsApp</Label>
                                <Input required value={current.phone || ''} onChange={e => setCurrent({ ...current, phone: e.target.value })} className="h-12 bg-black/40 border-white/10 rounded-xl" placeholder="Ej. 77889900" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-white/80">CI / Carnet</Label>
                                <Input required value={current.ci || ''} onChange={e => setCurrent({ ...current, ci: e.target.value })} className="h-12 bg-black/40 border-white/10 rounded-xl" placeholder="Ej. 1234567" />
                            </div>
                        </div>
                        <DialogFooter className="pt-4 border-t border-white/10">
                            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="h-12 hover:bg-white/5">Cancelar</Button>
                            <Button type="submit" className="h-12 px-6 bg-brand-yellow text-brand-black hover:bg-brand-yellow-light font-bold rounded-xl shadow-lg">Guardar Cliente</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

        </div>
    );
}
