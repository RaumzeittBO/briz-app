import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useStore, type EventItem } from '@/context/StoreContext';
import { Search, Edit, Calendar, Plus, Trash2, Image as ImageIcon, X } from 'lucide-react';
import { FileUploader } from '@/components/ui/file-uploader';

export default function AdminEventsPage() {
    const { events, addEvent, updateEvent, deleteEvent } = useStore();
    const [search, setSearch] = useState('');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [currentId, setCurrentId] = useState<string | null>(null);

    // Form states
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [priceStr, setPriceStr] = useState('');
    const [images, setImages] = useState<string[]>([]);

    const filtered = (events || []).filter(e =>
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.description.toLowerCase().includes(search.toLowerCase())
    );

    const handleDelete = (id: string, name: string) => {
        if (confirm(`¿Estás seguro de eliminar el evento "${name}" permanentemente?`)) {
            deleteEvent(id);
        }
    };

    const openModal = (mode: 'add' | 'edit', eventItem?: EventItem) => {
        setModalMode(mode);
        if (mode === 'edit' && eventItem) {
            setCurrentId(eventItem.id);
            setName(eventItem.name);
            setDescription(eventItem.description);
            setPriceStr(eventItem.price !== undefined ? String(eventItem.price) : '');
            setImages(eventItem.images || []);
        } else {
            setCurrentId(null);
            setName('');
            setDescription('');
            setPriceStr('');
            setImages([]);
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return alert('El nombre es requerido');
        if (!description.trim()) return alert('La descripción es requerida');
        if (images.length === 0) return alert('Debes subir al menos una foto para este evento');

        try {
            const eventData: EventItem = {
                id: currentId || `event-${Date.now()}`,
                name,
                description,
                images,
                price: priceStr.trim() ? Number(priceStr) : undefined
            };

            if (modalMode === 'add') {
                await addEvent(eventData);
            } else if (currentId) {
                await updateEvent(currentId, eventData);
            }
            setIsModalOpen(false);
        } catch (error: any) {
            console.error('Error saving event:', error);
            alert(`Error al guardar el evento: ${error.message || error}`);
        }
    };

    const removeImage = (index: number) => {
        setImages(current => current.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-8 pb-20">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-white/10 pb-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-white flex items-center gap-3 tracking-tight">
                        <div className="p-2 bg-brand-yellow/10 rounded-xl">
                            <Calendar className="w-8 h-8 text-brand-yellow" strokeWidth={2.5} />
                        </div>
                        Eventos Especiales
                    </h1>
                    <p className="text-white/50 text-lg font-medium">Administra paquetes de eventos, cumpleaños, bodas y alquileres corporativos.</p>
                </div>
                <Button 
                    onClick={() => openModal('add')} 
                    className="bg-white text-brand-black hover:bg-brand-yellow font-bold h-12 px-8 rounded-full shadow-lg transition-all hover:scale-105 shrink-0 cursor-pointer"
                >
                    <Plus className="w-5 h-5 mr-2" strokeWidth={3} /> Nuevo Evento
                </Button>
            </div>

            <div className="relative max-w-2xl">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                <Input 
                    placeholder="Busca eventos por nombre o descripción..." 
                    className="pl-14 h-14 rounded-full bg-[#1A1A1A] border-white/5 text-white placeholder:text-white/20 text-lg shadow-inner focus-visible:ring-brand-yellow/30"
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)} 
                />
            </div>

            {filtered.length === 0 ? (
                <div className="text-center py-20 bg-white/[0.01] border border-white/5 rounded-3xl">
                    <p className="text-white/20 font-bold text-lg">No se encontraron eventos</p>
                    <Button onClick={() => openModal('add')} variant="link" className="text-brand-yellow mt-2">Crea el primer evento haciendo clic aquí</Button>
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map(e => (
                        <Card key={e.id} className="bg-[#1A1A1A] border-white/5 rounded-[1.5rem] hover:border-white/10 transition-all duration-300 shadow-xl flex flex-col group overflow-hidden">
                            <CardContent className="p-0 flex-1 flex flex-col">
                                {/* Images Grid Preview */}
                                <div className="relative aspect-[16/10] bg-black/40 overflow-hidden flex items-center justify-center">
                                    {e.images && e.images.length > 0 ? (
                                        <img src={e.images[0]} alt={e.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                    ) : (
                                        <ImageIcon className="w-12 h-12 text-white/10" />
                                    )}
                                    {e.images && e.images.length > 1 && (
                                        <div className="absolute bottom-3 right-3 bg-black/75 px-2.5 py-1 rounded-md text-[10px] font-black uppercase text-brand-yellow border border-brand-yellow/20">
                                            +{e.images.length - 1} Fotos
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 flex-1 flex flex-col justify-between">
                                    <div className="space-y-3">
                                        <div className="flex items-start justify-between gap-4">
                                            <h3 className="text-xl font-black text-white truncate leading-none">{e.name}</h3>
                                            {e.price !== undefined ? (
                                                <span className="text-sm font-black text-brand-yellow whitespace-nowrap bg-brand-yellow/10 px-2.5 py-1 rounded-md">Bs. {e.price}</span>
                                            ) : (
                                                <span className="text-[10px] font-black text-white/40 uppercase whitespace-nowrap bg-white/5 px-2 py-0.5 rounded-md">Exhibición</span>
                                            )}
                                        </div>
                                        <p className="text-white/60 text-xs font-bold leading-relaxed line-clamp-3">{e.description}</p>
                                    </div>

                                    <div className="flex gap-2.5 pt-6 border-t border-white/5 mt-6">
                                        <Button 
                                            variant="ghost" 
                                            onClick={() => openModal('edit', e)}
                                            className="flex-1 rounded-xl bg-white/5 text-white/70 hover:bg-brand-yellow hover:text-brand-black font-black text-xs h-11"
                                        >
                                            <Edit className="w-4 h-4 mr-2" /> Editar
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            onClick={() => handleDelete(e.id, e.name)}
                                            className="rounded-xl bg-white/5 text-red-400/60 hover:bg-red-500 hover:text-white w-11 h-11 p-0 shrink-0"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* CREATE / EDIT DIALOG */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="bg-[#151515] border-white/10 text-white rounded-3xl max-w-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-white flex items-center gap-2">
                            <Calendar className="w-6 h-6 text-brand-yellow" />
                            {modalMode === 'add' ? 'Registrar Paquete de Evento' : 'Editar Paquete de Evento'}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSave} className="space-y-6 pt-4">
                        <div className="space-y-2">
                            <Label className="text-white/60 font-black text-xs uppercase tracking-widest">Nombre del Evento (Categoría)</Label>
                            <Input 
                                value={name} 
                                onChange={e => setName(e.target.value)} 
                                placeholder="Ej: Cumpleaños Briz, Boda Vintage, Evento Corporativo" 
                                required 
                                className="h-12 bg-white/5 border-white/10 text-white rounded-xl placeholder:text-white/20 focus-visible:ring-brand-yellow/30"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 sm:col-span-1 space-y-2">
                                <Label className="text-white/60 font-black text-xs uppercase tracking-widest">Precio de Alquiler (Bs. - Opcional)</Label>
                                <Input 
                                    type="number"
                                    value={priceStr} 
                                    onChange={e => setPriceStr(e.target.value)} 
                                    placeholder="Ej: 350 (dejar en blanco para no mostrar)" 
                                    className="h-12 bg-white/5 border-white/10 text-white rounded-xl placeholder:text-white/20 focus-visible:ring-brand-yellow/30"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-white/60 font-black text-xs uppercase tracking-widest">Descripción del Paquete</Label>
                            <Textarea 
                                value={description} 
                                onChange={e => setDescription(e.target.value)} 
                                placeholder="Describe detalladamente qué incluye este paquete de evento..." 
                                rows={4}
                                required 
                                className="bg-white/5 border-white/10 text-white rounded-xl placeholder:text-white/20 focus-visible:ring-brand-yellow/30 resize-none p-4"
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-white/60 font-black text-xs uppercase tracking-widest">Galería de Fotos (Subir Varias)</Label>
                                <FileUploader 
                                    folder="events" 
                                    onUpload={(url) => setImages(current => [...current, url])} 
                                    className="h-9 px-4 flex items-center justify-center gap-1.5 rounded-xl border border-brand-yellow bg-brand-yellow/5 hover:bg-brand-yellow/10 text-[10px] font-black uppercase text-brand-yellow transition-all cursor-pointer"
                                />
                            </div>

                            {images.length === 0 ? (
                                <div className="border border-dashed border-white/10 rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-2">
                                    <ImageIcon className="w-10 h-10 text-white/10" />
                                    <p className="text-white/30 text-xs font-bold">No hay fotos en la galería de este evento</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                                    {images.map((url, index) => (
                                        <div key={index} className="relative aspect-square rounded-xl overflow-hidden group border border-white/10 bg-black/40">
                                            <img src={url} className="w-full h-full object-cover" alt="" />
                                            <button 
                                                type="button" 
                                                onClick={() => removeImage(index)}
                                                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-400 hover:text-red-300 transition-opacity"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <DialogFooter className="pt-4 border-t border-white/5 gap-2">
                            <Button 
                                type="button" 
                                variant="ghost" 
                                onClick={() => setIsModalOpen(false)}
                                className="rounded-xl hover:bg-white/5 text-white/50 h-12 px-6 font-bold"
                            >
                                Cancelar
                            </Button>
                            <Button 
                                type="submit" 
                                className="bg-brand-yellow text-brand-black hover:bg-brand-yellow/90 rounded-xl h-12 px-8 font-black uppercase tracking-wider cursor-pointer"
                            >
                                {modalMode === 'add' ? 'Registrar Evento' : 'Guardar Cambios'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
