import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, Edit, Trash2, Image as ImageIcon, Bike, Wrench, X, Settings, GripVertical } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import type { InventoryItem, WheelSizeEntry } from '@/context/StoreContext';

import { FileUploader } from '@/components/ui/file-uploader';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

const WHEEL_OPTIONS = ['12','16','20','24','26','27','28','29'];

function defaultShopBike(): InventoryItem {
  return {
    id: `shop_bike_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
    itemType: 'bike',
    name: '',
    description: '',
    imageUrl: '',
    additionalImageUrls: [],
    active: true,
    availableForRental: false,
    availableForSale: true,
    hasWheelSizes: true,
    wheelSizes: [{ size: '26', stock: 0 }],
    salePrice: 0,
    pricePerHour: 0, priceFrom5thHour: 0, pricePerDay: 0, pricePerWeek: 0, pricePerMonth: 0,
    price1Hour: 0, price2Hours: 0, price3Hours: 0, price4Hours: 0, price8Hours: 0, price24Hours: 0, price1Week: 0, price1Month: 0
  };
}

function defaultShopAccessory(): InventoryItem {
  return {
    id: `shop_acc_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
    itemType: 'accessory',
    name: '',
    description: '',
    imageUrl: '',
    additionalImageUrls: [],
    active: true,
    availableForRental: false,
    availableForSale: true,
    hasWheelSizes: false,
    stock: 0,
    salePrice: 0,
    pricePerHour: 0, priceFrom5thHour: 0, pricePerDay: 0, pricePerWeek: 0, pricePerMonth: 0,
    price1Hour: 0, price2Hours: 0, price3Hours: 0, price4Hours: 0, price8Hours: 0, price24Hours: 0, price1Week: 0, price1Month: 0
  };
}

const toEditableNumber = (value: unknown) => value === '' || value === undefined || value === null ? '' : Number(value);
const toStoredNumber = (value: unknown, fallback = 0) => value === '' || value === undefined || value === null ? fallback : Number(value);

function normalizeInventoryDraft(draft: any) {
  const numericKeys = [
    'stock',
    'salePrice',
  ];

  const normalized = { ...draft };
  numericKeys.forEach(key => {
    if (key in normalized) normalized[key] = toStoredNumber(normalized[key], 0);
  });
  if (Array.isArray(normalized.wheelSizes)) {
    normalized.wheelSizes = normalized.wheelSizes.map((ws: WheelSizeEntry) => ({
      ...ws,
      stock: toStoredNumber((ws as any).stock, 0),
    }));
  }
  return normalized;
}

export default function AdminShopPage() {
  const { 
    inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem, 
    shopCategories, addShopCategory, deleteShopCategory, updateShopCategory, reorderShopCategories
  } = useStore();

  const [tab, setTab] = useState('bikes');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{open:boolean; mode:'add'|'edit'; type:'bike'|'accessory'}>({open:false,mode:'add',type:'bike'});
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{id:string; name:string} | null>(null);

  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editingVal, setEditingVal] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const bikes = inventory.filter(i => i.itemType === 'bike' && i.availableForSale);
  const accessories = inventory.filter(i => i.itemType === 'accessory' && i.availableForSale);
  const q = search.toLowerCase();
  const filteredBikes = bikes.filter(b => b.name.toLowerCase().includes(q));
  const filteredAccessories = accessories.filter(a => a.name.toLowerCase().includes(q));

  const availableShopCategories = useMemo(() => {
    const list = [...shopCategories];
    inventory.forEach(item => {
      if (item.availableForSale && item.category && !list.includes(item.category)) {
        list.push(item.category);
      }
    });
    return list.filter(cat => cat.trim());
  }, [shopCategories, inventory]);

  const openAdd = (type: 'bike'|'accessory') => {
    setEditItem(type==='bike'?defaultShopBike():defaultShopAccessory());
    setModal({open:true,mode:'add',type});
  };
  const openEdit = (item: any, type: 'bike'|'accessory') => {
    setEditItem(JSON.parse(JSON.stringify(item)));
    setModal({open:true,mode:'edit',type});
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    try {
      const normalized = normalizeInventoryDraft(editItem);
      if (modal.mode === 'add') {
        await addInventoryItem(normalized);
      } else {
        await updateInventoryItem(normalized.id, normalized);
      }
      setModal({open:false,mode:'add',type:'bike'});
      setEditItem(null);
    } catch (err: any) {
      alert('Error al guardar producto: ' + (err.message || err));
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteInventoryItem(deleteConfirm.id);
      setDeleteConfirm(null);
    } catch (err: any) {
      alert('Error al eliminar producto: ' + (err.message || err));
    }
  };



  const addWheelSize = () => {
    const current = editItem.wheelSizes || [];
    setEditItem({
      ...editItem,
      wheelSizes: [...current, { size: '26', stock: 0 }]
    });
  };

  const updateWheelSize = (idx: number, field: keyof WheelSizeEntry, value: string|number) => {
    const list = [...(editItem.wheelSizes || [])];
    list[idx] = { ...list[idx], [field]: value };
    setEditItem({ ...editItem, wheelSizes: list });
  };

  const removeWheelSize = (idx: number) => {
    const list = [...(editItem.wheelSizes || [])];
    list.splice(idx, 1);
    setEditItem({ ...editItem, wheelSizes: list });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-brand-charcoal tracking-tight">Inventario de Tienda</h1>
          <p className="text-xs text-brand-charcoal/50 font-bold uppercase tracking-widest mt-1">Administra los productos de venta al público</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button 
            onClick={() => setCategoryManagerOpen(true)}
            className="bg-white border border-brand-yellow/30 text-brand-charcoal hover:bg-brand-yellow font-black h-12 px-5 rounded-2xl shadow-sm transition-all flex items-center gap-2"
          >
            <Settings className="w-4 h-4 text-brand-charcoal/50" />
            <span>Categorías</span>
          </Button>
          <Button 
            onClick={() => openAdd('bike')} 
            className="bg-brand-yellow text-brand-black hover:bg-brand-yellow/90 font-black h-12 px-5 rounded-2xl shadow-md transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>+ Bicicleta</span>
          </Button>
          <Button 
            onClick={() => openAdd('accessory')} 
            className="bg-brand-yellow text-brand-black hover:bg-brand-yellow/90 font-black h-12 px-5 rounded-2xl shadow-md transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>+ Accesorio/Repuesto</span>
          </Button>
        </div>
      </div>

      {/* Search & Tabs */}
      <div className="bg-white/60 backdrop-blur-md border border-brand-yellow/15 p-4 rounded-3xl shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Tabs */}
          <Tabs value={tab} onValueChange={setTab} className="w-full md:w-auto">
            <TabsList className="bg-[#FFF9E8] border border-brand-yellow/10 p-1 rounded-2xl">
              <TabsTrigger value="bikes" className="rounded-xl px-5 text-xs font-black uppercase tracking-wider data-[state=checked]:bg-brand-yellow data-[state=checked]:text-brand-black">
                <Bike className="w-4 h-4 mr-2" /> Bicicletas
              </TabsTrigger>
              <TabsTrigger value="accessories" className="rounded-xl px-5 text-xs font-black uppercase tracking-wider data-[state=checked]:bg-brand-yellow data-[state=checked]:text-brand-black">
                <Wrench className="w-4 h-4 mr-2" /> Accesorios y Repuestos
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Search bar */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-brand-charcoal/30" />
            <Input
              placeholder="Buscar por nombre..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 h-12 rounded-2xl bg-white border-brand-yellow/20 text-brand-charcoal placeholder-brand-charcoal/35 font-bold focus:ring-brand-yellow"
            />
          </div>
        </div>

        {/* Content lists */}
        <Tabs value={tab} className="w-full">
          <TabsContent value="bikes" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
            <div className="overflow-x-auto rounded-2xl border border-brand-yellow/10 bg-white">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-brand-yellow/10 bg-[#FFF9E8]/50 text-[10px] font-black uppercase tracking-widest text-brand-charcoal/45">
                    <th className="p-4">Imagen</th>
                    <th className="p-4">Nombre / Categoría</th>
                    <th className="p-4">Stock por Aro</th>
                    <th className="p-4">Precio Venta (Bs.)</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-yellow/5">
                  {filteredBikes.map(bike => {
                    return (
                      <tr key={bike.id} className="hover:bg-[#FFF9E8]/20 transition-colors">
                        <td className="p-4">
                          {bike.imageUrl ? (
                            <img src={bike.imageUrl} alt={bike.name} className="h-12 w-12 rounded-xl object-cover border border-brand-yellow/10" />
                          ) : (
                            <div className="h-12 w-12 rounded-xl bg-brand-yellow/5 border border-brand-yellow/10 flex items-center justify-center text-brand-charcoal/20">
                              <ImageIcon className="w-5 h-5" />
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          <p className="font-black text-brand-charcoal text-sm leading-tight">{bike.name}</p>
                          <Badge className="bg-brand-yellow/10 text-brand-charcoal hover:bg-brand-yellow/15 border-0 text-[10px] font-bold px-2 py-0.5 mt-1.5 uppercase">
                            {bike.category || 'Sin Categoría'}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1.5 max-w-xs">
                            {(bike.wheelSizes || []).map((ws, i) => (
                              <Badge key={i} className="bg-brand-charcoal/5 text-brand-charcoal border border-brand-charcoal/10 hover:bg-brand-charcoal/10 text-[10px] font-bold px-2 py-0.5 rounded-lg">
                                Aro {ws.size}: <span className="font-black text-brand-charcoal ml-1">{ws.stock} u.</span>
                              </Badge>
                            ))}
                            {(bike.wheelSizes || []).length === 0 && <span className="text-brand-charcoal/30">Sin stock</span>}
                          </div>
                        </td>
                        <td className="p-4 font-black text-brand-charcoal text-sm">
                          Bs. {bike.salePrice || 0}
                        </td>
                        <td className="p-4">
                          {bike.active ? (
                            <Badge className="bg-emerald-100 text-emerald-800 border-0 font-bold">Activo</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800 border-0 font-bold">Inactivo</Badge>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(bike, 'bike')} className="w-8 h-8 rounded-xl text-brand-charcoal/60 hover:bg-brand-yellow/15 hover:text-brand-charcoal">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm({id: bike.id, name: bike.name})} className="w-8 h-8 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredBikes.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-brand-charcoal/35 font-bold uppercase tracking-wider">No se encontraron bicicletas para venta</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="accessories" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
            <div className="overflow-x-auto rounded-2xl border border-brand-yellow/10 bg-white">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-brand-yellow/10 bg-[#FFF9E8]/50 text-[10px] font-black uppercase tracking-widest text-brand-charcoal/45">
                    <th className="p-4">Imagen</th>
                    <th className="p-4">Nombre / Categoría</th>
                    <th className="p-4">Stock</th>
                    <th className="p-4">Precio Venta (Bs.)</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-yellow/5">
                  {filteredAccessories.map(acc => (
                    <tr key={acc.id} className="hover:bg-[#FFF9E8]/20 transition-colors">
                      <td className="p-4">
                        {acc.imageUrl ? (
                          <img src={acc.imageUrl} alt={acc.name} className="h-12 w-12 rounded-xl object-cover border border-brand-yellow/10" />
                        ) : (
                          <div className="h-12 w-12 rounded-xl bg-brand-yellow/5 border border-brand-yellow/10 flex items-center justify-center text-brand-charcoal/20">
                            <ImageIcon className="w-5 h-5" />
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <p className="font-black text-brand-charcoal text-sm leading-tight">{acc.name}</p>
                        <Badge className="bg-brand-yellow/10 text-brand-charcoal hover:bg-brand-yellow/15 border-0 text-[10px] font-bold px-2 py-0.5 mt-1.5 uppercase">
                          {acc.category || 'Sin Categoría'}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <span className={`font-black text-sm ${acc.stock && acc.stock > 0 ? 'text-brand-charcoal' : 'text-red-500'}`}>
                          {acc.stock || 0} u.
                        </span>
                      </td>
                      <td className="p-4 font-black text-brand-charcoal text-sm">
                        Bs. {acc.salePrice || 0}
                      </td>
                      <td className="p-4">
                        {acc.active ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border-0 font-bold">Activo</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800 border-0 font-bold">Inactivo</Badge>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(acc, 'accessory')} className="w-8 h-8 rounded-xl text-brand-charcoal/60 hover:bg-brand-yellow/15 hover:text-brand-charcoal">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm({id: acc.id, name: acc.name})} className="w-8 h-8 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredAccessories.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-brand-charcoal/35 font-bold uppercase tracking-wider">No se encontraron accesorios o repuestos para venta</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ADD / EDIT MODAL */}
      {modal.open && editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/60 overflow-y-auto animate-fade-in">
          <form onSubmit={handleSave} className="bg-brand-charcoal border border-white/10 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/15">
              <div>
                <h3 className="text-xl font-black text-white">
                  {modal.mode === 'add' ? 'Nuevo Producto de Tienda' : 'Editar Producto de Tienda'}
                </h3>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">
                  {modal.type === 'bike' ? 'Bicicleta para venta' : 'Accesorio o repuesto para venta'}
                </p>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setModal({open:false,mode:'add',type:'bike'})} className="w-8 h-8 rounded-lg text-white/40 hover:text-white hover:bg-white/10">
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Modal Body */}
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {/* LEFT COLUMN — Basic Info */}
              <div className="p-6 space-y-4">
                <div>
                  <Label className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Nombre del Producto</Label>
                  <Input value={editItem.name} onChange={e=>setEditItem({...editItem,name:e.target.value})} className="bg-black/40 border-white/10 h-12 font-black text-lg rounded-xl mt-1 text-white" placeholder={modal.type==='bike'?'Ej: Urbana Aro 26 Bridgestone':'Ej: Inflador bombín de pie'} required/>
                </div>

                {/* Category Selection */}
                {editItem && (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <Label className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Categoría de Tienda</Label>
                      <button 
                        type="button" 
                        onClick={() => {
                          const newCat = prompt('Ingrese el nombre de la nueva categoría de tienda (ej. Accesorios para ciclistas, Herramientas):');
                          if (newCat && newCat.trim()) {
                            const trimmed = newCat.trim();
                            addShopCategory(trimmed).catch((err) => console.warn('No se pudo guardar la categoría:', err));
                            setEditItem({ ...editItem, category: trimmed });
                          }
                        }}
                        className="text-[9px] font-black uppercase text-brand-yellow hover:underline cursor-pointer"
                      >
                        + Crear Categoría
                      </button>
                    </div>
                    <Select 
                      value={editItem.category || ''} 
                      onValueChange={(val) => setEditItem({ ...editItem, category: val })}
                    >
                      <SelectTrigger className="h-12 bg-black/40 border-white/10 rounded-xl text-white">
                        <SelectValue placeholder="Seleccione una categoría" />
                      </SelectTrigger>
                      <SelectContent className="bg-brand-charcoal border-white/10 text-white">
                        {availableShopCategories.map((cat) => (
                          <SelectItem key={cat} value={cat} className="focus:bg-white/5 focus:text-white cursor-pointer">
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Descripción</Label>
                  <Textarea value={editItem.description} onChange={e=>setEditItem({...editItem,description:e.target.value})} className="bg-black/40 border-white/10 rounded-xl resize-none text-sm mt-1 text-white" rows={3}/>
                </div>

                <div>
                  <Label className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Detalles adicionales (Especificaciones)</Label>
                  <Textarea value={editItem.details} onChange={e=>setEditItem({...editItem,details:e.target.value})} className="bg-black/40 border-white/10 rounded-xl resize-none text-sm mt-1 text-white" rows={2}/>
                </div>

                {/* Toggles */}
                <div className="flex flex-wrap gap-5 bg-black/30 p-4 rounded-xl border border-white/5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={editItem.active} onCheckedChange={v=>setEditItem({...editItem,active:Boolean(v)})} className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"/>
                    <span className="text-xs font-bold text-white/60">Activo</span>
                  </label>
                </div>
              </div>

              {/* RIGHT COLUMN — Stock + Pricing */}
              <div className="p-6 space-y-5">
                {/* BIKE: Wheel sizes */}
                {modal.type === 'bike' && (
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                        <Bike className="w-4 h-4 text-brand-yellow/60"/> Stock por Aro
                      </h4>
                      <Button type="button" onClick={addWheelSize} className="bg-brand-yellow text-brand-black font-black h-8 px-3 text-xs rounded-lg">
                        <Plus className="w-3 h-3 mr-1"/> Agregar Aro
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(editItem.wheelSizes||[]).map((ws:WheelSizeEntry, idx:number)=>(
                        <div key={idx} className="flex gap-2 items-center bg-black/45 p-2 border border-white/5 rounded-xl">
                          <Select 
                            value={ws.size} 
                            onValueChange={(val)=>updateWheelSize(idx, 'size', val)}
                          >
                            <SelectTrigger className="w-20 h-9 bg-black/60 border-white/10 rounded-lg text-xs text-white">
                              <SelectValue placeholder="Aro" />
                            </SelectTrigger>
                            <SelectContent className="bg-brand-charcoal border-white/10 text-white">
                              {WHEEL_OPTIONS.map(opt => (
                                <SelectItem key={opt} value={opt} className="focus:bg-white/5 text-xs">{opt}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input 
                            type="number" 
                            min={0}
                            placeholder="Stock"
                            value={toEditableNumber(ws.stock)}
                            onChange={e=>updateWheelSize(idx, 'stock', e.target.value===''? '': Number(e.target.value))}
                            className="bg-black/60 border-white/10 h-9 rounded-lg text-xs text-white flex-1"
                          />
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            onClick={()=>removeWheelSize(idx)}
                            className="w-8 h-8 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <X className="w-3.5 h-3.5"/>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ACCESSORY: Plain Stock */}
                {modal.type === 'accessory' && (
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-3">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-brand-yellow/60"/> Control de Inventario (Stock)
                    </h4>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-white/40 font-bold uppercase">Stock disponible</Label>
                      <Input
                        type="number"
                        min={0}
                        value={toEditableNumber(editItem.stock)}
                        onChange={e => setEditItem({ ...editItem, stock: e.target.value === '' ? '' : Number(e.target.value) })}
                        className="bg-black/40 border-white/10 h-11 font-bold text-white rounded-xl"
                        placeholder="Ej: 15"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* PRICING */}
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-3">
                  <h4 className="text-xs font-black text-blue-400 uppercase tracking-widest">Precio de Venta (Bs.)</h4>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-white/40 font-bold uppercase">Precio final de venta</Label>
                    <Input
                      type="number"
                      min={0}
                      value={toEditableNumber(editItem.salePrice)}
                      onChange={e => setEditItem({ ...editItem, salePrice: e.target.value === '' ? '' : Number(e.target.value) })}
                      className="bg-black/40 border-white/10 h-11 font-bold text-blue-400 rounded-xl"
                      placeholder="Ej: 150"
                      required
                    />
                  </div>
                </div>

                {/* IMAGES */}
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-4">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">Imágenes del Producto</h4>
                  
                  {/* Main Image */}
                  <div className="space-y-1.5">
                    <Label className="text-[10px] text-white/40 font-bold uppercase">Imagen Principal</Label>
                    <div className="w-full h-32 bg-black/40 rounded-xl border border-dashed border-white/10 flex items-center justify-center overflow-hidden">
                      {editItem.imageUrl ? <img src={editItem.imageUrl} className="w-full h-full object-cover" alt="preview"/> : <ImageIcon className="w-8 h-8 text-white/10"/>}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Input placeholder="URL de imagen..." value={editItem.imageUrl||''} onChange={e=>setEditItem({...editItem,imageUrl:e.target.value})} className="bg-black/40 border-white/10 h-10 text-sm rounded-xl text-white flex-1"/>
                      <FileUploader onUpload={(url)=>setEditItem({...editItem,imageUrl:url})} folder="inventory" />
                    </div>
                  </div>

                  {/* Secondary Images */}
                  <div className="space-y-2">
                    <Label className="text-[10px] text-white/40 font-bold uppercase block">
                      Imágenes adicionales (Galería)
                    </Label>
                    {(() => {
                      const urls = editItem.additionalImageUrls || [];
                      return (
                        <div className="space-y-2">
                          {urls.map((url: string, index: number) => (
                            <div key={index} className="flex gap-2 items-center">
                              <Input
                                placeholder={`URL de imagen adicional #${index + 1}...`}
                                value={url}
                                onChange={e => {
                                  const updatedUrls = [...urls];
                                  updatedUrls[index] = e.target.value;
                                  setEditItem({ ...editItem, additionalImageUrls: updatedUrls });
                                }}
                                className="bg-black/40 border-white/10 h-10 text-xs rounded-xl text-white flex-1"
                              />
                              <FileUploader onUpload={(newUrl)=>{
                                const updatedUrls = [...urls];
                                updatedUrls[index] = newUrl;
                                setEditItem({ ...editItem, additionalImageUrls: updatedUrls });
                              }} folder="inventory" />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  const updatedUrls = urls.filter((_: any, idx: number) => idx !== index);
                                  setEditItem({ ...editItem, additionalImageUrls: updatedUrls });
                                }}
                                className="h-9 w-9 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 shrink-0 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            onClick={() => {
                              const updatedUrls = [...urls, ''];
                              setEditItem({ ...editItem, additionalImageUrls: updatedUrls });
                            }}
                            className="bg-white/5 border border-white/5 hover:bg-white/10 text-white/80 font-bold h-9 px-3 text-xs rounded-lg w-full"
                          >
                            + Agregar Imagen
                          </Button>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-white/10 flex justify-end gap-3 bg-black/15">
              <Button type="button" onClick={() => setModal({open:false,mode:'add',type:'bike'})} className="bg-white/5 border border-white/5 text-white/80 hover:bg-white/10 rounded-xl h-12 px-6 font-bold text-xs">
                Cancelar
              </Button>
              <Button type="submit" className="bg-brand-yellow text-brand-black hover:bg-brand-yellow/90 font-black rounded-xl h-12 px-6 text-xs">
                Guardar Producto
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* DELETE CONFIRM DIALOG */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/60">
          <div className="bg-brand-charcoal border border-white/10 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-white">¿Confirmar eliminación?</h3>
            <p className="text-sm text-white/60 leading-relaxed">
              ¿Estás seguro de que deseas eliminar el producto <span className="font-bold text-white">"{deleteConfirm.name}"</span>? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 pt-2">
              <Button onClick={() => setDeleteConfirm(null)} className="flex-1 bg-white/5 border border-white/5 text-white/80 hover:bg-white/10 rounded-xl h-12 font-bold text-xs">
                Cancelar
              </Button>
              <Button onClick={handleDelete} className="flex-1 h-12 rounded-xl font-bold bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-600/20 text-xs">
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORY MANAGER DIALOG */}
      {categoryManagerOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-md bg-black/60">
          <div className="bg-brand-charcoal border border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="text-xl font-black text-white">Administrar Categorías de Tienda</h3>
              <Button variant="ghost" size="icon" onClick={() => setCategoryManagerOpen(false)} className="w-8 h-8 rounded-lg text-white/40 hover:text-white hover:bg-white/10">
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Add Category Form */}
            <div className="flex gap-2">
              <Input
                placeholder="Nueva categoría tienda..."
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                className="bg-black/40 border-white/10 h-10 text-sm rounded-xl text-white flex-1 focus:ring-brand-yellow/50"
              />
              <Button
                onClick={async () => {
                  const trimmed = newCategoryName.trim();
                  if (!trimmed) return;
                  try {
                    await addShopCategory(trimmed);
                    setNewCategoryName("");
                  } catch (err: any) {
                    alert('Error al agregar categoría: ' + (err.message || err));
                  }
                }}
                className="bg-brand-yellow text-brand-black hover:bg-brand-yellow/90 font-black rounded-xl h-10 px-4 text-xs"
              >
                + Agregar
              </Button>
            </div>

            {/* List of categories with Drag and Drop */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {shopCategories.map((cat, idx) => {
                const isEditing = editingCat === cat;
                const isDragging = draggedIndex === idx;

                return (
                  <div 
                    key={cat}
                    draggable={!isEditing}
                    onDragStart={() => setDraggedIndex(idx)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={async () => {
                      if (draggedIndex === null || draggedIndex === idx) return;
                      const list = [...shopCategories];
                      const item = list[draggedIndex];
                      list.splice(draggedIndex, 1);
                      list.splice(idx, 0, item);
                      await reorderShopCategories(list);
                      setDraggedIndex(null);
                    }}
                    onDragEnd={() => setDraggedIndex(null)}
                    className={`flex items-center justify-between bg-white/5 border rounded-xl p-2.5 transition-all ${
                      isDragging 
                        ? 'border-brand-yellow border-dashed bg-brand-yellow/5 opacity-50' 
                        : 'border-white/5 hover:bg-white/10'
                    }`}
                  >
                    {isEditing ? (
                      <div className="flex gap-2 items-center w-full">
                        <Input
                          value={editingVal}
                          onChange={e => setEditingVal(e.target.value)}
                          className="bg-black/60 border-white/10 h-8 text-xs rounded-lg text-white flex-1 focus:ring-brand-yellow/50"
                          autoFocus
                          onKeyDown={async e => {
                            if (e.key === 'Enter') {
                              try {
                                await updateShopCategory(cat, editingVal);
                                setEditingCat(null);
                              } catch (err: any) {
                                alert('Error al actualizar categoría: ' + (err.message || err));
                              }
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          onClick={async () => {
                            try {
                              await updateShopCategory(cat, editingVal);
                              setEditingCat(null);
                            } catch (err: any) {
                              alert('Error al actualizar categoría: ' + (err.message || err));
                            }
                          }}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg h-8 px-2.5 text-xs font-bold"
                        >
                          Guardar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingCat(null)}
                          className="text-white/40 hover:text-white hover:bg-white/5 rounded-lg h-8 px-2.5 text-xs"
                        >
                          X
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          {/* Drag Handle */}
                          <div className="cursor-grab active:cursor-grabbing p-1 text-white/35 hover:text-white/60 transition-colors">
                            <GripVertical className="w-4 h-4" />
                          </div>
                          <span className="text-white text-sm font-bold truncate">{cat}</span>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingCat(cat);
                              setEditingVal(cat);
                            }}
                            className="w-7 h-7 rounded-lg text-brand-yellow hover:bg-brand-yellow/10"
                            title="Editar nombre"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={async () => {
                              if (confirm(`¿Estás seguro de eliminar la categoría "${cat}"?\nEsto no afectará los productos existentes, pero ya no aparecerá en los filtros.`)) {
                                try {
                                  await deleteShopCategory(cat);
                                } catch (err: any) {
                                  alert('Error al eliminar categoría: ' + (err.message || err));
                                }
                              }
                            }}
                            className="w-7 h-7 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
              {shopCategories.length === 0 && (
                <p className="text-center py-4 text-white/30 text-xs font-bold uppercase tracking-wider">No hay categorías agregadas</p>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-white/5">
              <Button onClick={() => setCategoryManagerOpen(false)} className="bg-white/5 border border-white/5 text-white/80 hover:bg-white/10 rounded-xl h-11 px-5 font-bold text-xs">
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
