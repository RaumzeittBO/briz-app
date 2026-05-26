import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, Edit, Trash2, Image as ImageIcon, Bike, PackageOpen, Wrench, Package } from 'lucide-react';
import type { Bike as BikeType, Product, Accessory } from '@/context/StoreContext';
import { useStore } from '@/context/StoreContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';



export default function InventoryPage() {
    const {
        bikes, addBike, updateBike, deleteBike,
        products, addProduct, updateProduct, deleteProduct,
        accessories, addAccessory, updateAccessory, deleteAccessory
    } = useStore();

    const [activeTab, setActiveTab] = useState('bikes');
    const [searchQuery, setSearchQuery] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [currentEntity, setCurrentEntity] = useState<any>(null);

    const filteredBikes = bikes.filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const filteredAccessories = accessories.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const openModal = (mode: 'add' | 'edit', entity?: any) => {
        setModalMode(mode);
        if (mode === 'edit' && entity) {
            setCurrentEntity(entity);
        } else {
            // Default blank states
            if (activeTab === 'bikes') {
                setCurrentEntity({ id: Date.now().toString(), name: '', category: 'Urbana', type: 'Urbana', wheelSize: '700c', description: '', pricePerHour: 0, pricePerDay: 0, pricePerWeek: 0, saleable: false, salePrice: 0, available: true, stock: 1, condition: 'Excelente', image: '', active: true, accessories: [] });
            } else if (activeTab === 'products') {
                setCurrentEntity({ id: Date.now().toString(), name: '', category: 'Repuestos', price: 0, stock: 0, description: '', image: '', active: true });
            } else {
                setCurrentEntity({ id: Date.now().toString(), name: '', category: 'Accesorios', price: 0, stock: 0, description: '', image: '', usageType: 'both', active: true });
            }
        }
        setIsModalOpen(true);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (activeTab === 'bikes') {
            if (modalMode === 'add') addBike(currentEntity as BikeType);
            else updateBike(currentEntity.id, currentEntity as BikeType);
        } else if (activeTab === 'products') {
            if (modalMode === 'add') addProduct(currentEntity as Product);
            else updateProduct(currentEntity.id, currentEntity as Product);
        } else {
            if (modalMode === 'add') addAccessory(currentEntity as Accessory);
            else updateAccessory(currentEntity.id, currentEntity as Accessory);
        }
        setIsModalOpen(false);
    };

    const handleDelete = (id: string, type: string) => {
        if (!confirm('¿Estás seguro de eliminar este registro?')) return;
        if (type === 'bikes') deleteBike(id);
        if (type === 'products') deleteProduct(id);
        if (type === 'accessories') deleteAccessory(id);
    };

    return (
        <div className="space-y-8 pb-20">
            <div className="flex items-center justify-between border-b border-white/10 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Package className="w-8 h-8 text-brand-yellow" />
                        Inventario
                    </h1>
                    <p className="text-white/50 text-base mt-1">Gestiona bicicletas, repuestos y accesorios del sistema.</p>
                </div>
                <Button onClick={() => openModal('add')} className="bg-brand-yellow text-brand-black hover:bg-brand-yellow-light font-bold px-6">
                    <Plus className="w-5 h-5 mr-2" /> Agregar Item
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="bg-brand-charcoal/50 border border-white/5">
                    <TabsTrigger value="bikes" className="data-[state=active]:bg-brand-yellow data-[state=active]:text-brand-black">Bicicletas ({bikes.length})</TabsTrigger>
                    <TabsTrigger value="products" className="data-[state=active]:bg-brand-yellow data-[state=active]:text-brand-black">Productos ({products.length})</TabsTrigger>
                    <TabsTrigger value="accessories" className="data-[state=active]:bg-brand-yellow data-[state=active]:text-brand-black">Accesorios ({accessories.length})</TabsTrigger>
                </TabsList>

                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <Input placeholder="Buscar por nombre..." className="pl-10 bg-brand-charcoal/50 border-white/10 text-white placeholder:text-white/30"
                        value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>

                <TabsContent value="bikes">
                    <Card className="bg-brand-charcoal/50 border-white/5">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-white/5 bg-white/[0.02]">
                                            <TableHead className="text-white/50 py-4 w-16">Img</TableHead>
                                            <TableHead className="text-white/50 py-4">Nombre</TableHead>
                                            <TableHead className="text-white/50 py-4">Tarifas (h/d/s)</TableHead>
                                            <TableHead className="text-white/50 py-4">Venta</TableHead>
                                            <TableHead className="text-white/50 py-4">Stock</TableHead>
                                            <TableHead className="text-white/50 py-4">Disponible</TableHead>
                                            <TableHead className="text-white/50 py-4">Estado</TableHead>
                                            <TableHead className="text-white/50 text-right py-4">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredBikes.map(b => (
                                            <TableRow key={b.id} className="border-white/5 hover:bg-white/5 transition-colors">
                                                <TableCell className="py-4">
                                                    <div className="w-12 h-12 bg-white/5 rounded-md overflow-hidden flex items-center justify-center border border-white/10">
                                                        {b.image ? <img src={b.image} alt={b.name} className="w-full h-full object-cover" /> : <Bike className="w-6 h-6 text-white/20" />}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <p className="text-white text-base font-bold">{b.name} <Badge className="ml-2 bg-brand-yellow/10 text-brand-yellow border-0 hover:bg-brand-yellow/20" variant="outline">{b.category}</Badge></p>
                                                    <p className="text-xs text-white/50 mt-1 font-medium">{b.condition} • {b.wheelSize}</p>
                                                </TableCell>
                                                <TableCell className="text-white/80 font-medium py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-xs text-brand-yellow font-bold">1h: Bs. {b.pricePerHour} {b.priceExtraHour ? <span className="text-white/40 text-[10px] font-normal">(+{b.priceExtraHour}/h ex)</span> : ''}</span>
                                                        <span className="text-xs text-white/60">Día: Bs. {b.pricePerDay} | Sem: Bs. {b.pricePerWeek}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-white py-4 font-bold">
                                                    {b.saleable ? `Bs. ${b.salePrice}` : <Badge variant="secondary" className="bg-white/5 text-white/40 border-0">No</Badge>}
                                                </TableCell>
                                                <TableCell className="text-white font-bold py-4">{b.stock ?? 1}</TableCell>
                                                <TableCell className="py-4"><Badge className={b.available ? 'bg-green-500/15 text-green-500 border-0' : 'bg-red-500/15 text-red-500 border-0'}>{b.available ? 'Sí' : 'No'}</Badge></TableCell>
                                                <TableCell className="py-4"><Badge variant="outline" className={b.active !== false ? 'border-brand-yellow/30 text-brand-yellow bg-brand-yellow/10' : 'text-white/40 border-white/10'}>{b.active !== false ? 'Activo' : 'Oculto'}</Badge></TableCell>
                                                <TableCell className="text-right py-4">
                                                    <div className="flex justify-end gap-1">
                                                        <Button variant="ghost" size="icon" className="text-white/60 hover:text-brand-yellow hover:bg-brand-yellow/10" onClick={() => openModal('edit', b)}><Edit className="w-4 h-4" /></Button>
                                                        <Button variant="ghost" size="icon" className="text-red-400/60 hover:text-red-400 hover:bg-red-400/10" onClick={() => handleDelete(b.id, 'bikes')}><Trash2 className="w-4 h-4" /></Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="products">
                    <Card className="bg-brand-charcoal/50 border-white/5">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-white/5 bg-white/[0.02]">
                                            <TableHead className="text-white/50 py-4 w-16">Img</TableHead>
                                            <TableHead className="text-white/50 py-4">Producto</TableHead>
                                            <TableHead className="text-white/50 py-4">Categoría</TableHead>
                                            <TableHead className="text-white/50 py-4">Precio</TableHead>
                                            <TableHead className="text-white/50 py-4">Stock</TableHead>
                                            <TableHead className="text-white/50 py-4">Estado</TableHead>
                                            <TableHead className="text-white/50 text-right py-4">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredProducts.map(p => (
                                            <TableRow key={p.id} className="border-white/5 hover:bg-white/5 transition-colors">
                                                <TableCell className="py-4">
                                                    <div className="w-10 h-10 bg-white/5 rounded-md overflow-hidden flex items-center justify-center border border-white/10">
                                                        {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : <PackageOpen className="w-5 h-5 text-white/20" />}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4"><p className="text-white text-base font-bold">{p.name}</p></TableCell>
                                                <TableCell className="py-4"><Badge variant="secondary" className="bg-white/10 text-white/80 border-0 text-xs">{p.category}</Badge></TableCell>
                                                <TableCell className="text-brand-yellow font-bold text-base py-4">Bs. {p.price}</TableCell>
                                                <TableCell className="text-white font-bold py-4">{p.stock}</TableCell>
                                                <TableCell className="py-4"><Badge variant="outline" className={p.active !== false ? 'border-brand-yellow/30 text-brand-yellow bg-brand-yellow/10' : 'text-white/40 border-white/10'}>{p.active !== false ? 'Activo' : 'Oculto'}</Badge></TableCell>
                                                <TableCell className="text-right py-4">
                                                    <div className="flex justify-end gap-1">
                                                        <Button variant="ghost" size="icon" className="text-white/60 hover:text-brand-yellow hover:bg-brand-yellow/10" onClick={() => openModal('edit', p)}><Edit className="w-4 h-4" /></Button>
                                                        <Button variant="ghost" size="icon" className="text-red-400/60 hover:text-red-400 hover:bg-red-400/10" onClick={() => handleDelete(p.id, 'products')}><Trash2 className="w-4 h-4" /></Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="accessories">
                    <Card className="bg-brand-charcoal/50 border-white/5">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-white/5 bg-white/[0.02]">
                                            <TableHead className="text-white/50 py-4 w-16">Img</TableHead>
                                            <TableHead className="text-white/50 py-4">Accesorio</TableHead>
                                            <TableHead className="text-white/50 py-4">Precio</TableHead>
                                            <TableHead className="text-white/50 py-4">Stock</TableHead>
                                            <TableHead className="text-white/50 py-4">Uso Permitido</TableHead>
                                            <TableHead className="text-white/50 py-4">Estado</TableHead>
                                            <TableHead className="text-white/50 text-right py-4">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredAccessories.map(a => (
                                            <TableRow key={a.id} className="border-white/5 hover:bg-white/5 transition-colors">
                                                <TableCell className="py-4">
                                                    <div className="w-10 h-10 bg-white/5 rounded-md overflow-hidden flex items-center justify-center border border-white/10">
                                                        {a.image ? <img src={a.image} alt={a.name} className="w-full h-full object-cover" /> : <Wrench className="w-5 h-5 text-white/20" />}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4"><p className="text-white text-base font-bold">{a.name}</p></TableCell>
                                                <TableCell className="text-brand-yellow font-bold text-base py-4">Bs. {a.price}</TableCell>
                                                <TableCell className="text-white font-bold py-4">{a.stock}</TableCell>
                                                <TableCell className="py-4"><Badge variant="secondary" className="bg-white/10 text-white/80 border-0 text-xs">{a.usageType === 'both' ? 'Tienda + Alquiler' : a.usageType === 'shop' ? 'Solo Tienda' : 'Solo Alquiler'}</Badge></TableCell>
                                                <TableCell className="py-4"><Badge variant="outline" className={a.active !== false ? 'border-brand-yellow/30 text-brand-yellow bg-brand-yellow/10' : 'text-white/40 border-white/10'}>{a.active !== false ? 'Activo' : 'Oculto'}</Badge></TableCell>
                                                <TableCell className="text-right py-4">
                                                    <div className="flex justify-end gap-1">
                                                        <Button variant="ghost" size="icon" className="text-white/60 hover:text-brand-yellow hover:bg-brand-yellow/10" onClick={() => openModal('edit', a)}><Edit className="w-4 h-4" /></Button>
                                                        <Button variant="ghost" size="icon" className="text-red-400/60 hover:text-red-400 hover:bg-red-400/10" onClick={() => handleDelete(a.id, 'accessories')}><Trash2 className="w-4 h-4" /></Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Combined CRUD Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto w-full bg-brand-charcoal border border-white/10 text-white p-6 sm:p-8">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-2xl flex items-center gap-2">
                            {modalMode === 'add' ? <Plus className="w-6 h-6 text-brand-yellow" /> : <Edit className="w-6 h-6 text-brand-yellow" />}
                            {modalMode === 'add' ? 'Registrar' : 'Editar'} {activeTab === 'bikes' ? 'Bicicleta' : activeTab === 'products' ? 'Producto' : 'Accesorio'}
                        </DialogTitle>
                    </DialogHeader>
                    {currentEntity && (
                        <form onSubmit={handleSave} className="space-y-6">

                            {/* Image Preview & URL Section */}
                            <div className="flex flex-col sm:flex-row gap-6 bg-black/20 p-5 rounded-xl border border-white/5">
                                <div className="shrink-0">
                                    <div className="w-32 h-32 bg-white/5 rounded-lg border border-white/10 overflow-hidden flex flex-col items-center justify-center text-white/30 relative">
                                        {currentEntity.image ? (
                                            <img src={currentEntity.image} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <>
                                                <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                                                <span className="text-xs font-medium">Sin Imagen</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="flex-1 space-y-4 justify-center flex flex-col">
                                    <div className="space-y-2">
                                        <Label className="text-white/80 font-bold uppercase tracking-wider text-xs">URL de Imagen (Recomendado)</Label>
                                        <Input value={currentEntity.image || ''} onChange={e => setCurrentEntity({ ...currentEntity, image: e.target.value })} className="bg-black/40 border-white/10 h-12" placeholder="https://ejemplo.com/imagen.jpg" />
                                        <p className="text-xs text-white/40">Pega un enlace directo a una imagen pública para usarla como foto principal.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2"><Label className="text-white/80 font-bold">Nombre del Ítem</Label><Input value={currentEntity.name} onChange={e => setCurrentEntity({ ...currentEntity, name: e.target.value })} className="bg-white/5 border-white/10 h-12 font-medium text-lg" placeholder="Ej. Bicicleta Trek Marlin 5" required /></div>
                                {(activeTab === 'bikes' || activeTab === 'products') && (
                                    <div className="space-y-2"><Label className="text-white/80 font-bold">Categoría</Label><Input value={currentEntity.category} onChange={e => setCurrentEntity({ ...currentEntity, category: e.target.value })} className="bg-white/5 border-white/10 h-12" placeholder="Ej. Urbana, Montaña, Componente" required /></div>
                                )}
                            </div>

                            <div className="space-y-2"><Label className="text-white/80 font-bold">Descripción (Opcional)</Label><Textarea value={currentEntity.description} onChange={e => setCurrentEntity({ ...currentEntity, description: e.target.value })} className="bg-white/5 border-white/10 resize-none h-24" placeholder="Agrega detalles técnicos o una descripción llamativa para los clientes..." /></div>

                            {activeTab === 'bikes' && (
                                <>
                                    <div className="bg-brand-yellow/5 border border-brand-yellow/20 p-5 rounded-xl space-y-5">
                                        <h4 className="font-bold text-brand-yellow text-sm uppercase tracking-wider mb-2 flex items-center gap-2"><Bike className="w-4 h-4" /> Tarifas de Alquiler de Bicicleta</h4>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-white/80 font-bold text-xs uppercase">Por Hora</Label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 text-sm">Bs.</span>
                                                    <Input type="number" min="0" value={(currentEntity as BikeType).pricePerHour || 0} onChange={e => setCurrentEntity({ ...currentEntity, pricePerHour: parseFloat(e.target.value) })} className="pl-9 bg-white/5 border-white/10 h-11 font-bold text-lg" required />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-white/80 font-bold text-xs uppercase flex items-center gap-1">Hora Extra <span className="text-brand-yellow/70 text-[10px]">(Dscto)</span></Label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 text-sm">Bs.</span>
                                                    <Input type="number" className="pl-9 bg-black/40 border-white/10 h-11" value={(currentEntity as BikeType).priceExtraHour || ''} onChange={(e) => setCurrentEntity({ ...currentEntity, priceExtraHour: parseFloat(e.target.value) } as BikeType)} placeholder="Opcional" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-white/80 font-bold text-xs uppercase">Por Día</Label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 text-sm">Bs.</span>
                                                    <Input type="number" min="0" value={(currentEntity as BikeType).pricePerDay || 0} onChange={e => setCurrentEntity({ ...currentEntity, pricePerDay: parseFloat(e.target.value) })} className="pl-9 bg-white/5 border-white/10 h-11" required />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-white/80 font-bold text-xs uppercase">Por Semana</Label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 text-sm">Bs.</span>
                                                    <Input type="number" min="0" value={(currentEntity as BikeType).pricePerWeek || 0} onChange={e => setCurrentEntity({ ...currentEntity, pricePerWeek: parseFloat(e.target.value) })} className="pl-9 bg-white/5 border-white/10 h-11" required />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 p-5 bg-white/5 rounded-xl border border-white/5">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-white/80 font-bold">Stock Disponible / Unds.</Label>
                                                <Input type="number" min="0" value={currentEntity.stock ?? 1} onChange={e => setCurrentEntity({ ...currentEntity, stock: parseInt(e.target.value, 10) })} className="bg-black/30 border-white/10 h-11" required />
                                            </div>
                                            <div className="space-y-2"><Label className="text-white/80 font-bold">Estado / Condición</Label>
                                                <select value={currentEntity.condition} onChange={e => setCurrentEntity({ ...currentEntity, condition: e.target.value })} className="w-full h-11 rounded-md border border-white/10 bg-black/30 px-3 text-sm text-white focus-visible:outline-none">
                                                    <option value="Excelente">Excelente</option><option value="Bueno">Bueno</option><option value="Regular">Regular</option><option value="En Mantenimiento">En Mantenimiento</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="space-y-5">
                                            <div className="space-y-3 bg-black/20 p-4 rounded-lg">
                                                <div className="flex items-center space-x-3">
                                                    <Checkbox id="available-check" checked={currentEntity.available} onCheckedChange={(v: any) => setCurrentEntity({ ...currentEntity, available: Boolean(v) })} className="w-5 h-5 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500" />
                                                    <Label htmlFor="available-check" className="font-bold cursor-pointer">Activa para Alquiler</Label>
                                                </div>
                                                <div className="flex items-center space-x-3">
                                                    <Checkbox id="saleable-check" checked={currentEntity.saleable} onCheckedChange={(v: any) => setCurrentEntity({ ...currentEntity, saleable: Boolean(v) })} className="w-5 h-5 data-[state=checked]:bg-brand-yellow data-[state=checked]:border-brand-yellow data-[state=checked]:text-black" />
                                                    <Label htmlFor="saleable-check" className="font-bold cursor-pointer text-white">Disponible en Tienda (Venta)</Label>
                                                </div>
                                                {currentEntity.saleable && (
                                                    <div className="pt-2">
                                                        <Label className="text-xs text-white/50 mb-1 block">Precio de Venta</Label>
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 text-sm">Bs.</span>
                                                            <Input type="number" min="0" value={currentEntity.salePrice || 0} onChange={e => setCurrentEntity({ ...currentEntity, salePrice: parseFloat(e.target.value) })} className="pl-9 bg-white/5 border-white/10" required />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {(activeTab === 'products' || activeTab === 'accessories') && (
                                <div className="grid grid-cols-2 gap-6 bg-white/5 p-5 rounded-xl border border-white/10">
                                    <div className="space-y-2">
                                        <Label className="text-white/80 font-bold">Precio Unitario</Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-yellow font-bold text-lg">Bs.</span>
                                            <Input type="number" min="0" value={currentEntity.price} onChange={e => setCurrentEntity({ ...currentEntity, price: parseFloat(e.target.value) })} className="pl-12 bg-black/40 border-white/10 h-14 text-xl font-bold text-brand-yellow" required />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-white/80 font-bold">Stock Inicial / Cantidad</Label>
                                        <Input type="number" min="0" value={currentEntity.stock} onChange={e => setCurrentEntity({ ...currentEntity, stock: parseInt(e.target.value, 10) })} className="bg-black/40 border-white/10 h-14 text-xl font-bold" required />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'accessories' && (
                                <div className="space-y-2 bg-brand-yellow/5 p-4 rounded-xl border border-brand-yellow/20"><Label className="text-brand-yellow font-bold text-xs uppercase tracking-wider mb-2 block">Reglas de Uso del Accesorio</Label>
                                    <select value={currentEntity.usageType} onChange={e => setCurrentEntity({ ...currentEntity, usageType: e.target.value })} className="w-full h-12 rounded-lg border border-white/10 bg-black/40 px-3 text-sm text-white focus-visible:outline-none focus:border-brand-yellow transition-colors font-medium">
                                        <option value="both">Alquiler (Con una bici) y Venta (Tienda)</option>
                                        <option value="shop">Solo Venta (Catálogo de Tienda)</option>
                                        <option value="rental">Solo Alquiler (Complemento de Reserva)</option>
                                    </select>
                                    <p className="text-xs text-white/50 mt-2">Esto determina si el accesorio aparecerá en el carrito del cliente al hacer una reserva o si se vende individualmente.</p>
                                </div>
                            )}

                            <div className="p-4 bg-brand-charcoal border border-white/10 rounded-xl mt-6 flex items-start space-x-3">
                                <Checkbox id="visibility-check" checked={currentEntity.active !== false} onCheckedChange={(v: any) => setCurrentEntity({ ...currentEntity, active: Boolean(v) })} className="mt-1 w-5 h-5 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500" />
                                <div>
                                    <Label htmlFor="visibility-check" className="font-bold text-base cursor-pointer">Visible en la Tienda Pública</Label>
                                    <p className="text-xs text-white/50">Si lo desactivas, este elemento se ocultará de la web pública pero seguirá en tu inventario sin borrarse.</p>
                                </div>
                            </div>

                            <DialogFooter className="pt-6 mt-6 flex gap-3">
                                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="hover:bg-white/5 h-12 px-6">Cancelar</Button>
                                <Button type="submit" className="bg-brand-yellow text-brand-black hover:bg-brand-yellow-light font-bold h-12 px-8 flex-1 sm:flex-none">Guardar Cambios</Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div >
    );
}
