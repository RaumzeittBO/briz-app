import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useStore } from '@/context/StoreContext';
import type { Customer } from '@/context/StoreContext';
import { Search, Edit, User, UserPlus } from 'lucide-react';

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
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-white/10 pb-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-white flex items-center gap-3 tracking-tight">
                        <div className="p-2 bg-brand-yellow/10 rounded-xl">
                            <User className="w-8 h-8 text-brand-yellow" strokeWidth={2.5} />
                        </div>
                        Clientes
                    </h1>
                    <p className="text-white/50 text-lg font-medium">Directorio centralizado de perfiles y actividad.</p>
                </div>
                <Button 
                    onClick={() => openModal('add')} 
                    className="bg-white text-brand-black hover:bg-brand-yellow font-bold h-12 px-8 rounded-full shadow-lg transition-all hover:scale-105 shrink-0"
                >
                    <UserPlus className="w-5 h-5 mr-2" strokeWidth={3} /> Nuevo Cliente
                </Button>
            </div>

            <div className="relative max-w-2xl">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                <Input 
                    placeholder="Busca por nombre, CI o teléfono..." 
                    className="pl-14 h-14 rounded-full bg-[#1A1A1A] border-white/5 text-white placeholder:text-white/20 text-lg shadow-inner focus-visible:ring-brand-yellow/30"
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)} 
                />
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filtered.map(c => {
                    const custRentals = rentals.filter(r => r.customerPhone === c.phone || r.customerCI === c.ci);
                    const custSales = sales.filter(s => s.customerPhone === c.phone || s.customerCI === c.ci);

                    const lastR = custRentals.length ? Math.max(...custRentals.map(r => new Date(r.createdAt || r.createdDate || '').getTime())) : 0;
                    const lastS = custSales.length ? Math.max(...custSales.map(s => new Date(s.date).getTime())) : 0;
                    const lastInteraction = Math.max(lastR, lastS);

                    return (
                        <Card key={c.id} className="bg-[#1A1A1A] border-white/5 rounded-[1.5rem] hover:border-white/10 transition-all duration-300 shadow-xl flex flex-col group overflow-hidden">
                            <CardContent className="p-0 flex-1 flex flex-col">
                                <div className="p-6 flex flex-col items-center text-center relative border-b border-white/5 bg-white/[0.01] flex-1">
                                    <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-2 border-brand-yellow/30 group-hover:scale-105 transition-transform flex items-center justify-center bg-brand-yellow/10">
                                        {c.autofotoUrl ? (
                                            <img src={c.autofotoUrl} className="w-full h-full object-cover" alt={c.name} />
                                        ) : (
                                            <span className="text-brand-yellow text-2xl font-black">{c.name.substring(0, 2).toUpperCase()}</span>
                                        )}
                                    </div>
                                    <h3 className="text-white font-black text-xl mb-1 truncate w-full">{c.name}</h3>
                                    
                                    <div className="space-y-1.5 w-full text-xs font-medium text-white/60">
                                        <p className="text-white/40 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-brand-yellow/60" /> {c.phone}
                                        </p>
                                        <p className="text-white/40 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-white/20" /> CI: {c.ci}
                                        </p>
                                        {c.email && (
                                            <p className="truncate text-white/50 text-[11px] font-mono">{c.email}</p>
                                        )}
                                        {c.nacionalidad && (
                                            <p className="text-[10px] text-white/40 uppercase font-bold">
                                                🌍 {c.nacionalidad} {c.departamento ? `(${c.departamento})` : ''}
                                            </p>
                                        )}
                                        {c.comoNosConociste && (
                                            <p className="text-[10px] text-brand-yellow/60 font-semibold uppercase">
                                                📢 {c.comoNosConociste}
                                            </p>
                                        )}
                                        {c.documentoUrl && (
                                            <a 
                                                href={c.documentoUrl} 
                                                target="_blank" 
                                                rel="noreferrer" 
                                                className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-brand-yellow bg-brand-yellow/10 hover:bg-brand-yellow/20 px-3 py-1 rounded-full mt-2 transition-all cursor-pointer"
                                            >
                                                📄 Ver Documento
                                            </a>
                                        )}
                                    </div>

                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-white/40 hover:text-white hover:bg-white/5" onClick={() => openModal('edit', c)}>
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="p-6 grid grid-cols-2 gap-3 bg-black/20">
                                    <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5 flex flex-col items-center">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Rentas</p>
                                        <p className="font-black text-2xl text-white">{custRentals.length}</p>
                                    </div>
                                    <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5 flex flex-col items-center">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Tienda</p>
                                        <p className="font-black text-2xl text-white">{custSales.length}</p>
                                    </div>
                                </div>

                                <div className="px-6 py-4 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest border-t border-white/5 bg-white/[0.01]">
                                    <span className="text-white/20">Visto</span>
                                    <span className="text-brand-yellow/60">
                                        {lastInteraction > 0 ? new Date(lastInteraction).toLocaleDateString() : 'N/A'}
                                    </span>
                                </div>

                                <button 
                                    onClick={() => handleDelete(c.id, c.name)} 
                                    className="w-full py-4 text-white/20 hover:text-red-400 hover:bg-red-500/5 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-t border-white/5"
                                >
                                    Eliminar Perfil
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
                <DialogContent className="max-w-md bg-brand-charcoal border-white/10 text-white p-0 overflow-hidden">
                    <DialogHeader className="p-8 pb-6 border-b border-white/5 bg-[#1A1A1A]">
                        <DialogTitle className="text-3xl font-black text-white flex items-center gap-3 tracking-tight">
                            <div className="p-2 bg-brand-yellow/10 rounded-xl">
                                {modalMode === 'add' ? <UserPlus className="w-6 h-6 text-brand-yellow" strokeWidth={2.5} /> : <Edit className="w-6 h-6 text-brand-yellow" strokeWidth={2.5} />}
                            </div>
                            {modalMode === 'add' ? 'Nuevo Cliente' : 'Editar Perfil'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSave} className="p-8 space-y-6">
                        <div className="space-y-2">
                            <Label className="text-white/40 font-bold uppercase tracking-widest text-[10px]">Nombre Completo</Label>
                            <Input required value={current.name || ''} onChange={e => setCurrent({ ...current, name: e.target.value })} className="h-12 bg-black/40 border-white/10 rounded-xl focus:ring-brand-yellow/50 text-white" placeholder="Ej. Juan Pérez" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-white/40 font-bold uppercase tracking-widest text-[10px]">WhatsApp</Label>
                                <Input required value={current.phone || ''} onChange={e => setCurrent({ ...current, phone: e.target.value })} className="h-12 bg-black/40 border-white/10 rounded-xl focus:ring-brand-yellow/50 text-white" placeholder="77889900" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-white/40 font-bold uppercase tracking-widest text-[10px]">CI / Carnet</Label>
                                <Input required value={current.ci || ''} onChange={e => setCurrent({ ...current, ci: e.target.value })} className="h-12 bg-black/40 border-white/10 rounded-xl focus:ring-brand-yellow/50 text-white" placeholder="1234567" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-white/40 font-bold uppercase tracking-widest text-[10px]">Correo Electrónico</Label>
                            <Input type="email" value={current.email || ''} onChange={e => setCurrent({ ...current, email: e.target.value })} className="h-12 bg-black/40 border-white/10 rounded-xl focus:ring-brand-yellow/50 text-white" placeholder="juan@gmail.com" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-white/40 font-bold uppercase tracking-widest text-[10px]">Contraseña</Label>
                            <Input type="text" value={current.password || ''} onChange={e => setCurrent({ ...current, password: e.target.value })} className="h-12 bg-black/40 border-white/10 rounded-xl focus:ring-brand-yellow/50 text-white" placeholder="Contraseña de cliente" />
                        </div>
                        <DialogFooter className="pt-6 border-t border-white/5 flex gap-3">
                            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="h-12 px-6 rounded-xl hover:bg-white/5 font-bold">Cancelar</Button>
                            <Button type="submit" className="h-12 px-8 bg-brand-yellow text-brand-black hover:bg-white font-black rounded-full shadow-lg transition-all flex-1">
                                {modalMode === 'add' ? 'Crear Perfil' : 'Actualizar'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

        </div>
    );
}
