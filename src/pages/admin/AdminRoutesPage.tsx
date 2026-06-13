import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStore } from '@/context/StoreContext';
import type { CyclingRoute } from '@/data/mockData';
import { Search, Edit, MapPinned, Plus, Trash2, ExternalLink } from 'lucide-react';

export default function AdminRoutesPage() {
    const { routes, addRoute, updateRoute, deleteRoute } = useStore();
    const [search, setSearch] = useState('');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [currentId, setCurrentId] = useState<string | null>(null);

    // Form states
    const [name, setName] = useState('');
    const [difficulty, setDifficulty] = useState<'Fácil' | 'Moderado' | 'Difícil'>('Fácil');
    const [distance, setDistance] = useState('');
    const [duration, setDuration] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState('');
    const [mapUrl, setMapUrl] = useState('');
    const [highlightsStr, setHighlightsStr] = useState('');

    const filtered = routes.filter(r =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.description.toLowerCase().includes(search.toLowerCase())
    );

    const handleDelete = (id: string, name: string) => {
        if (confirm(`¿Estás seguro de eliminar la ruta "${name}" permanentemente?`)) {
            deleteRoute(id);
        }
    };

    const openModal = (mode: 'add' | 'edit', route?: CyclingRoute) => {
        setModalMode(mode);
        if (mode === 'edit' && route) {
            setCurrentId(route.id);
            setName(route.name);
            setDifficulty(route.difficulty);
            setDistance(route.distance);
            setDuration(route.duration);
            setDescription(route.description);
            setImage(route.image || '');
            setMapUrl(route.mapUrl || '');
            setHighlightsStr(route.highlights ? route.highlights.join(', ') : '');
        } else {
            setCurrentId(null);
            setName('');
            setDifficulty('Fácil');
            setDistance('');
            setDuration('');
            setDescription('');
            setImage('');
            setMapUrl('');
            setHighlightsStr('');
        }
        setIsModalOpen(true);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();

        const highlights = highlightsStr
            .split(',')
            .map(item => item.trim())
            .filter(Boolean);

        const routeData: CyclingRoute = {
            id: currentId || `r-${Date.now()}`,
            name,
            difficulty,
            distance,
            duration,
            description,
            highlights,
            image,
            mapUrl
        };

        if (modalMode === 'add') {
            addRoute(routeData);
        } else if (currentId) {
            updateRoute(currentId, routeData);
        }
        setIsModalOpen(false);
    };

    const getDifficultyColor = (diff: CyclingRoute['difficulty']) => {
        switch (diff) {
            case 'Fácil':
                return 'bg-green-500/10 text-green-400 border border-green-500/20';
            case 'Moderado':
                return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
            case 'Difícil':
                return 'bg-red-500/10 text-red-400 border border-red-500/20';
            default:
                return 'bg-white/10 text-white/60';
        }
    };

    return (
        <div className="space-y-8 pb-20">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-white/10 pb-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-white flex items-center gap-3 tracking-tight">
                        <div className="p-2 bg-brand-yellow/10 rounded-xl">
                            <MapPinned className="w-8 h-8 text-brand-yellow" strokeWidth={2.5} />
                        </div>
                        Ciclotours
                    </h1>
                    <p className="text-white/50 text-lg font-medium">Gestiona las rutas, tours y recorridos públicos en Briz.</p>
                </div>
                <Button 
                    onClick={() => openModal('add')} 
                    className="bg-white text-brand-black hover:bg-brand-yellow font-bold h-12 px-8 rounded-full shadow-lg transition-all hover:scale-105 shrink-0"
                >
                    <Plus className="w-5 h-5 mr-2" strokeWidth={3} /> Nueva Ruta
                </Button>
            </div>

            <div className="relative max-w-2xl">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                <Input 
                    placeholder="Busca por nombre o descripción..." 
                    className="pl-14 h-14 rounded-full bg-[#1A1A1A] border-white/5 text-white placeholder:text-white/20 text-lg shadow-inner focus-visible:ring-brand-yellow/30"
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)} 
                />
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filtered.map(r => (
                    <Card key={r.id} className="bg-[#1A1A1A] border-white/5 rounded-[1.5rem] hover:border-white/10 transition-all duration-300 shadow-xl flex flex-col group overflow-hidden">
                        <CardContent className="p-0 flex-1 flex flex-col">
                            {/* Route Image / Fallback Container */}
                            <div className="relative aspect-[16/10] bg-black/40 overflow-hidden">
                                {r.image ? (
                                    <img src={r.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={r.name} />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-brand-yellow/5">
                                        <MapPinned className="w-12 h-12 text-brand-yellow/20" />
                                    </div>
                                )}
                                <span className={`absolute top-4 left-4 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${getDifficultyColor(r.difficulty)}`}>
                                    {r.difficulty}
                                </span>
                            </div>

                            <div className="p-6 flex-1 flex flex-col">
                                <h3 className="text-white font-black text-xl mb-2 group-hover:text-brand-yellow transition-colors truncate">{r.name}</h3>
                                <p className="text-white/50 text-xs font-medium line-clamp-3 leading-relaxed mb-4 flex-1">{r.description}</p>
                                
                                <div className="grid grid-cols-2 gap-3 mb-4 py-3 border-y border-white/5">
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Distancia</p>
                                        <p className="text-sm font-bold text-white mt-0.5">{r.distance || 'N/D'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Duración</p>
                                        <p className="text-sm font-bold text-white mt-0.5">{r.duration || 'N/D'}</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {r.highlights && r.highlights.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {r.highlights.slice(0, 3).map((h, i) => (
                                                <span key={i} className="text-[10px] font-bold text-white/40 bg-white/[0.03] px-2 py-0.5 rounded-md">
                                                    {h}
                                                </span>
                                            ))}
                                            {r.highlights.length > 3 && (
                                                <span className="text-[10px] font-bold text-brand-yellow/60">
                                                    +{r.highlights.length - 3} más
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {r.mapUrl && (
                                        <a 
                                            href={r.mapUrl} 
                                            target="_blank" 
                                            rel="noreferrer" 
                                            className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-brand-yellow hover:text-white transition-colors"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" /> Ver en Google Maps
                                        </a>
                                    )}
                                </div>
                            </div>

                            <div className="p-4 bg-black/20 border-t border-white/5 grid grid-cols-2 gap-2">
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-10 rounded-xl text-white/60 hover:text-white hover:bg-white/5 font-bold text-xs" 
                                    onClick={() => openModal('edit', r)}
                                >
                                    <Edit className="w-4 h-4 mr-2" /> Editar
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-10 rounded-xl text-red-400/50 hover:text-red-400 hover:bg-red-400/5 font-bold text-xs" 
                                    onClick={() => handleDelete(r.id, r.name)}
                                >
                                    <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {filtered.length === 0 && (
                <div className="text-center py-20 px-4 bg-brand-charcoal/30 rounded-2xl border border-white/5">
                    <MapPinned className="w-16 h-16 mx-auto text-white/20 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No se encontraron rutas</h3>
                    <p className="text-white/50">Prueba con otro término de búsqueda o crea una nueva ruta.</p>
                </div>
            )}

            {/* Save Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-lg bg-brand-charcoal border-white/10 text-white p-0 overflow-hidden">
                    <DialogHeader className="p-8 pb-6 border-b border-white/5 bg-[#1A1A1A]">
                        <DialogTitle className="text-3xl font-black text-white flex items-center gap-3 tracking-tight">
                            <div className="p-2 bg-brand-yellow/10 rounded-xl">
                                <MapPinned className="w-6 h-6 text-brand-yellow" strokeWidth={2.5} />
                            </div>
                            {modalMode === 'add' ? 'Nueva Ruta' : 'Editar Ruta'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSave} className="p-8 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        <div className="space-y-2">
                            <Label className="text-white/40 font-bold uppercase tracking-widest text-[10px]">Nombre de la Ruta</Label>
                            <Input required value={name} onChange={e => setName(e.target.value)} className="h-12 bg-black/40 border-white/10 rounded-xl focus:ring-brand-yellow/50 text-white" placeholder="Ej. Ruta de los Valles" />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label className="text-white/40 font-bold uppercase tracking-widest text-[10px]">Dificultad</Label>
                                <Select value={difficulty} onValueChange={(val: any) => setDifficulty(val)}>
                                    <SelectTrigger className="h-12 bg-black/40 border-white/10 rounded-xl text-white">
                                        <SelectValue placeholder="Dificultad" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-brand-charcoal border-white/10 text-white">
                                        <SelectItem value="Fácil" className="focus:bg-white/5 focus:text-white cursor-pointer">Fácil</SelectItem>
                                        <SelectItem value="Moderado" className="focus:bg-white/5 focus:text-white cursor-pointer">Moderado</SelectItem>
                                        <SelectItem value="Difícil" className="focus:bg-white/5 focus:text-white cursor-pointer">Difícil</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-white/40 font-bold uppercase tracking-widest text-[10px]">Distancia</Label>
                                <Input required value={distance} onChange={e => setDistance(e.target.value)} className="h-12 bg-black/40 border-white/10 rounded-xl focus:ring-brand-yellow/50 text-white" placeholder="Ej. 15 km" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-white/40 font-bold uppercase tracking-widest text-[10px]">Duración</Label>
                                <Input required value={duration} onChange={e => setDuration(e.target.value)} className="h-12 bg-black/40 border-white/10 rounded-xl focus:ring-brand-yellow/50 text-white" placeholder="Ej. 1.5 horas" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-white/40 font-bold uppercase tracking-widest text-[10px]">Enlace de Imagen (URL)</Label>
                            <Input value={image} onChange={e => setImage(e.target.value)} className="h-12 bg-black/40 border-white/10 rounded-xl focus:ring-brand-yellow/50 text-white" placeholder="Ej. https://images.unsplash.com/... o /vive.webp" />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-white/40 font-bold uppercase tracking-widest text-[10px]">Google Maps URL (Link de Ruta)</Label>
                            <Input value={mapUrl} onChange={e => setMapUrl(e.target.value)} className="h-12 bg-black/40 border-white/10 rounded-xl focus:ring-brand-yellow/50 text-white" placeholder="Ej. https://maps.app.goo.gl/..." />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-white/40 font-bold uppercase tracking-widest text-[10px]">Puntos Clave / Destacados (Separados por coma)</Label>
                            <Input value={highlightsStr} onChange={e => setHighlightsStr(e.target.value)} className="h-12 bg-black/40 border-white/10 rounded-xl focus:ring-brand-yellow/50 text-white" placeholder="Ej. Mirador, Río, Plaza Principal" />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-white/40 font-bold uppercase tracking-widest text-[10px]">Descripción</Label>
                            <Textarea required value={description} onChange={e => setDescription(e.target.value)} className="bg-black/40 border-white/10 rounded-xl focus:ring-brand-yellow/50 text-white resize-none" rows={3} placeholder="Describe los detalles de la ruta..." />
                        </div>

                        <DialogFooter className="pt-6 border-t border-white/5 flex gap-3">
                            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="h-12 px-6 rounded-xl hover:bg-white/5 font-bold">Cancelar</Button>
                            <Button type="submit" className="h-12 px-8 bg-brand-yellow text-brand-black hover:bg-white font-black rounded-full shadow-lg transition-all flex-1">
                                {modalMode === 'add' ? 'Crear Ruta' : 'Actualizar'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
