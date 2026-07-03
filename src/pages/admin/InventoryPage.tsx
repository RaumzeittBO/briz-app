import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, Edit, Trash2, Image as ImageIcon, Bike, Wrench, Layers, X, Settings, GripVertical } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import type { InventoryItem, ComboProduct, WheelSizeEntry, ComboComponent } from '@/context/StoreContext';

import { FileUploader } from '@/components/ui/file-uploader';

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

const WHEEL_OPTIONS = ['12','16','20','24','26','27','28','29'];
const NON_BIKE_CATEGORIES = new Set(['Accesorios', 'Combinados']);


function defaultBike(): InventoryItem {
  return { id: `inv_${Date.now()}_${Math.random().toString(36).slice(2,7)}`, itemType:'bike', name:'', description:'', imageUrl:'', additionalImageUrls:[], active:true, availableForRental:true, availableForSale:false, hasWheelSizes:true, wheelSizes:[{size:'26',stock:0}], pricePerHour:0, priceFrom5thHour:0, pricePerDay:0, pricePerWeek:0, pricePerMonth:0, price1Hour:0, price2Hours:0, price3Hours:0, price4Hours:0, price8Hours:0, price24Hours:0, price1Week:0, price1Month:0 };
}
function defaultAccessory(): InventoryItem {
  return { id: `inv_${Date.now()}_${Math.random().toString(36).slice(2,7)}`, itemType:'accessory', name:'', description:'', imageUrl:'', additionalImageUrls:[], active:true, availableForRental:true, availableForSale:false, hasWheelSizes:false, stock:0, pricePerHour:0, priceFrom5thHour:0, pricePerDay:0, pricePerWeek:0, pricePerMonth:0, price1Hour:0, price2Hours:0, price3Hours:0, price4Hours:0, price8Hours:0, price24Hours:0, price1Week:0, price1Month:0 };
}
function defaultCombo(): ComboProduct {
  return { id: `combo_${Date.now()}_${Math.random().toString(36).slice(2,7)}`, name:'', description:'', imageUrl:'', additionalImageUrls:[], active:true, availableForRental:true, availableForSale:false, components:[], pricePerHour:0, priceFrom5thHour:0, pricePerDay:0, pricePerWeek:0, pricePerMonth:0, price1Hour:0, price2Hours:0, price3Hours:0, price4Hours:0, price8Hours:0, price24Hours:0, price1Week:0, price1Month:0 };
}

const toEditableNumber = (value: unknown) => value === '' || value === undefined || value === null ? '' : Number(value);
const toStoredNumber = (value: unknown, fallback = 0) => value === '' || value === undefined || value === null ? fallback : Number(value);

function PriceFields({ editItem, setEditItem }: any) {
  const handlePriceChange = (key: string, rawValue: string) => {
    const value = rawValue === '' ? '' : Number(rawValue);
    const updates: any = { [key]: value };
    if (key === 'price1Hour') updates.pricePerHour = value;
    else if (key === 'price24Hours') updates.pricePerDay = value;
    else if (key === 'price1Week') updates.pricePerWeek = value;
    else if (key === 'price1Month') updates.pricePerMonth = value;
    setEditItem({ ...editItem, ...updates });
  };

  const fields = [
    { l: '1 Hora', k: 'price1Hour' },
    { l: '2 Horas', k: 'price2Hours' },
    { l: '3 Horas', k: 'price3Hours' },
    { l: '4 Horas', k: 'price4Hours' },
    { l: '8 Horas', k: 'price8Hours' },
    { l: '24 Horas (1 Día)', k: 'price24Hours' },
    { l: '1 Semana', k: 'price1Week' },
    { l: '1 Mes', k: 'price1Month' },
    { l: 'Hora adicional (5ta+)', k: 'priceFrom5thHour' }
  ];

  return (
    <div className="space-y-4">
      {editItem.availableForRental && (
        <div className="space-y-3">
          <h4 className="text-xs font-black text-brand-yellow uppercase tracking-widest">Precios de Alquiler (Bs.)</h4>
          <div className="grid grid-cols-2 gap-3">
            {fields.map(p => (
              <div key={p.k} className="space-y-1">
                <Label className="text-[10px] text-white/40 font-bold uppercase">{p.l}</Label>
                <Input
                  type="number"
                  min={0}
                  value={toEditableNumber((editItem as any)[p.k])}
                  onChange={e => handlePriceChange(p.k, e.target.value)}
                  className="bg-black/40 border-white/10 h-10 font-bold text-brand-yellow rounded-xl"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {editItem.availableForSale && (
        <div className="space-y-2 pt-2 border-t border-white/5">
          <h4 className="text-xs font-black text-blue-400 uppercase tracking-widest">Precio de Venta (Bs.)</h4>
          <div className="space-y-1">
            <Label className="text-[10px] text-white/40 font-bold uppercase">Precio final de venta</Label>
            <Input
              type="number"
              min={0}
              value={toEditableNumber(editItem.salePrice)}
              onChange={e => setEditItem({ ...editItem, salePrice: e.target.value === '' ? '' : Number(e.target.value) })}
              className="bg-black/40 border-white/10 h-10 font-bold text-blue-400 rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function normalizeInventoryDraft(draft: any) {
  const numericKeys = [
    'stock',
    'salePrice',
    'pricePerHour',
    'priceFrom5thHour',
    'pricePerDay',
    'pricePerWeek',
    'pricePerMonth',
    'price1Hour',
    'price2Hours',
    'price3Hours',
    'price4Hours',
    'price8Hours',
    'price24Hours',
    'price1Week',
    'price1Month',
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
  if (Array.isArray(normalized.components)) {
    normalized.components = normalized.components.map((component: ComboComponent) => ({
      ...component,
      quantity: toStoredNumber((component as any).quantity, 1),
    }));
  }
  return normalized;
}

export default function InventoryPage() {
  const { 
    inventory, combos, addInventoryItem, updateInventoryItem, deleteInventoryItem, 
    addCombo, updateCombo, deleteCombo, getComboAvailability, 
    bikeCategories, addBikeCategory, deleteBikeCategory, updateBikeCategory, reorderBikeCategories,
    shopCategories, addShopCategory, deleteShopCategory, updateShopCategory, reorderShopCategories
  } = useStore();

  const [tab, setTab] = useState('bikes');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{open:boolean; mode:'add'|'edit'; type:'bike'|'accessory'|'combo'}>({open:false,mode:'add',type:'bike'});
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{id:string; type:string; name:string} | null>(null);

  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editingVal, setEditingVal] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [catManagerTab, setCatManagerTab] = useState<'rental' | 'shop'>('rental');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const bikes = inventory.filter(i => i.itemType === 'bike');
  const accessories = inventory.filter(i => i.itemType === 'accessory');
  const q = search.toLowerCase();
  const filteredBikes = bikes.filter(b => b.name.toLowerCase().includes(q));
  const filteredAccessories = accessories.filter(a => a.name.toLowerCase().includes(q));
  const filteredCombos = combos.filter(c => c.name.toLowerCase().includes(q));
  const availableBikeCategories = useMemo(() => {
    const list = [...bikeCategories];
    inventory.forEach(item => {
      if (item.availableForRental && item.category && !list.includes(item.category)) {
        list.push(item.category);
      }
    });
    combos.forEach(combo => {
      if (combo.availableForRental && combo.category && !list.includes(combo.category)) {
        list.push(combo.category);
      }
    });
    return list.filter(cat => cat.trim() && !NON_BIKE_CATEGORIES.has(cat));
  }, [bikeCategories, inventory, combos]);

  const availableShopCategories = useMemo(() => {
    const list = [...shopCategories];
    inventory.forEach(item => {
      if (item.availableForSale && item.category && !list.includes(item.category)) {
        list.push(item.category);
      }
    });
    combos.forEach(combo => {
      if (combo.availableForSale && combo.category && !list.includes(combo.category)) {
        list.push(combo.category);
      }
    });
    return list.filter(cat => cat.trim());
  }, [shopCategories, inventory, combos]);

  const openAdd = (type: 'bike'|'accessory'|'combo') => {
    setEditItem(type==='bike'?defaultBike():type==='accessory'?defaultAccessory():defaultCombo());
    setModal({open:true,mode:'add',type});
  };
  const openEdit = (item: any, type: 'bike'|'accessory'|'combo') => {
    setEditItem(JSON.parse(JSON.stringify(item)));
    setModal({open:true,mode:'edit',type});
  };

  const handleSave = () => {
    if (!editItem) return;
    const draft = normalizeInventoryDraft(editItem);
    if (modal.type === 'combo') {
      modal.mode === 'add' ? addCombo(draft) : updateCombo(draft.id, draft);
    } else {
      modal.mode === 'add' ? addInventoryItem(draft) : updateInventoryItem(draft.id, draft);
    }
    setModal({...modal, open:false});
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    const { id, type } = deleteConfirm;
    if (type === 'combo') {
      deleteCombo(id);
    } else {
      deleteInventoryItem(id);
    }
    setDeleteConfirm(null);
  };


  // Wheel size helpers
  const addWheelSize = () => {
    const ws = editItem.wheelSizes || [];
    const used = ws.map((w:WheelSizeEntry)=>w.size);
    const next = WHEEL_OPTIONS.find(o => !used.includes(o)) || String(Number(ws[ws.length-1]?.size||26)+1);
    setEditItem({...editItem, wheelSizes:[...ws, {size:next, stock:0}]});
  };
  const removeWheelSize = (idx:number) => {
    const ws = [...(editItem.wheelSizes||[])];
    ws.splice(idx,1);
    setEditItem({...editItem, wheelSizes:ws});
  };
  const updateWS = (idx:number, field:string, val:any) => {
    const ws = [...(editItem.wheelSizes||[])].map((w:WheelSizeEntry)=>({...w}));
    (ws[idx] as any)[field] = val;
    setEditItem({...editItem, wheelSizes:ws});
  };

  // Combo component helpers
  const addComponent = () => {
    setEditItem({...editItem, components:[...editItem.components, {inventoryItemId:'', quantity:1, requiresWheelSize:false}]});
  };
  const removeComponent = (idx:number) => {
    const c = [...editItem.components]; c.splice(idx,1);
    setEditItem({...editItem, components:c});
  };
  const updateComponent = (idx:number, updates:Partial<ComboComponent>) => {
    const c = editItem.components.map((comp:ComboComponent, i:number) => i===idx ? {...comp,...updates} : comp);
    setEditItem({...editItem, components:c});
  };

  const ItemRow = ({item, type, openEdit, setDeleteConfirm}:{item:InventoryItem; type:'bike'|'accessory'; openEdit:any; setDeleteConfirm:any}) => (
    <div className="flex items-center gap-4 p-4 bg-white/75 backdrop-blur rounded-2xl border border-brand-yellow/20 hover:border-brand-yellow/60 transition-all shadow-sm">
      <div className="w-14 h-14 bg-[#FFF9E8] rounded-xl overflow-hidden flex items-center justify-center border border-brand-yellow/20 shrink-0">
        {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover"/> : <ImageIcon className="w-5 h-5 text-brand-charcoal/30"/>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-brand-charcoal font-black text-sm truncate">{item.name}</p>
        <div className="flex flex-wrap gap-1 mt-1">
          {item.hasWheelSizes && item.wheelSizes ? item.wheelSizes.map(ws=>(
            <Badge key={ws.size} className="bg-brand-yellow/10 text-brand-yellow border-brand-yellow/20 text-[9px] font-bold rounded-md">Aro {ws.size}: {ws.stock}</Badge>
          )) : (
            <span className="text-brand-charcoal font-black text-lg">Stock: {item.stock ?? 0}</span>
          )}
        </div>
      </div>
      <Badge className={`shrink-0 rounded-full px-3 py-1 text-[9px] font-black uppercase ${item.active?'bg-green-500/10 text-green-400 border-green-500/20':'bg-red-500/10 text-red-400 border-red-500/20'}`}>
        {item.active?'Activo':'Inactivo'}
      </Badge>
      <div className="flex gap-1 shrink-0">
        <Button variant="ghost" size="icon" className="w-9 h-9 rounded-xl bg-brand-yellow/15 text-brand-charcoal hover:bg-brand-yellow" onClick={()=>openEdit(item,type)}><Edit className="w-4 h-4"/></Button>
        <Button variant="ghost" size="icon" className="w-9 h-9 rounded-xl bg-white/5 text-red-400/60 hover:bg-red-500 hover:text-white" onClick={()=>setDeleteConfirm({id:item.id, type, name:item.name})}><Trash2 className="w-4 h-4"/></Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-brand-yellow/25 pb-5">
        <div>
          <h1 className="text-3xl font-black text-brand-charcoal tracking-tight">Inventario</h1>
          <p className="text-brand-charcoal/55 text-sm font-medium">Consulta stock, categoría y disponibilidad de un vistazo.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-charcoal/35"/>
          <Input placeholder="Buscar producto..." value={search} onChange={e=>setSearch(e.target.value)} className="pl-9 bg-white/75 border-brand-yellow/25 h-11 rounded-xl text-sm font-bold text-brand-charcoal"/>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="bg-white/70 border border-brand-yellow/25 p-1.5 rounded-xl h-auto flex flex-wrap gap-1">
          <TabsTrigger value="bikes" className="rounded-lg px-4 py-2 text-xs font-black text-brand-charcoal/60 data-[state=active]:bg-brand-yellow data-[state=active]:text-brand-black flex items-center gap-2">
            <Bike className="w-4 h-4"/> Bicicletas ({bikes.length})
          </TabsTrigger>
          <TabsTrigger value="accessories" className="rounded-lg px-4 py-2 text-xs font-black text-brand-charcoal/60 data-[state=active]:bg-brand-yellow data-[state=active]:text-brand-black flex items-center gap-2">
            <Wrench className="w-4 h-4"/> Accesorios ({accessories.length})
          </TabsTrigger>
          <TabsTrigger value="combos" className="rounded-lg px-4 py-2 text-xs font-black text-brand-charcoal/60 data-[state=active]:bg-brand-yellow data-[state=active]:text-brand-black flex items-center gap-2">
            <Layers className="w-4 h-4"/> Combinados ({combos.length})
          </TabsTrigger>
        </TabsList>

        {/* BIKES */}
        <TabsContent value="bikes" className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button onClick={()=>openAdd('bike')} className="bg-brand-yellow text-brand-black font-black rounded-xl h-10 px-5 hover:bg-brand-yellow/90">
              <Plus className="w-4 h-4 mr-2"/> Nueva Bicicleta
            </Button>
            <Button onClick={()=>setCategoryManagerOpen(true)} variant="outline" className="border-brand-yellow text-brand-yellow hover:bg-brand-yellow/10 font-black rounded-xl h-10 px-5 cursor-pointer">
              <Settings className="w-4 h-4 mr-2"/> Administrar Categorías
            </Button>
          </div>
          {filteredBikes.length===0 ? <p className="text-center py-16 text-white/20 font-bold text-sm">No hay bicicletas registradas</p> : filteredBikes.map(b=><ItemRow key={b.id} item={b} type="bike" openEdit={openEdit} setDeleteConfirm={setDeleteConfirm}/>)}
        </TabsContent>

        {/* ACCESSORIES */}
        <TabsContent value="accessories" className="space-y-3">
          <Button onClick={()=>openAdd('accessory')} className="bg-brand-yellow text-brand-black font-black rounded-xl h-10 px-5 hover:bg-brand-yellow/90">
            <Plus className="w-4 h-4 mr-2"/> Nuevo Accesorio
          </Button>
          {filteredAccessories.length===0 ? <p className="text-center py-16 text-white/20 font-bold text-sm">No hay accesorios registrados</p> : filteredAccessories.map(a=><ItemRow key={a.id} item={a} type="accessory" openEdit={openEdit} setDeleteConfirm={setDeleteConfirm}/>)}
        </TabsContent>

        {/* COMBOS */}
        <TabsContent value="combos" className="space-y-3">
          <Button onClick={()=>openAdd('combo')} className="bg-brand-yellow text-brand-black font-black rounded-xl h-10 px-5 hover:bg-brand-yellow/90">
            <Plus className="w-4 h-4 mr-2"/> Nuevo Combinado
          </Button>
          {filteredCombos.length===0 ? <p className="text-center py-16 text-white/20 font-bold text-sm">No hay productos combinados</p> : filteredCombos.map(c=>{
            const avail = getComboAvailability(c.id);
            return (
              <div key={c.id} className="flex items-center gap-4 p-4 bg-white/[0.02] rounded-2xl border border-white/5 hover:border-white/10 transition-all">
                <div className="w-14 h-14 bg-black/40 rounded-xl overflow-hidden flex items-center justify-center border border-white/10 shrink-0">
                  {c.imageUrl ? <img src={c.imageUrl} alt={c.name} className="w-full h-full object-cover"/> : <Layers className="w-5 h-5 text-white/20"/>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-black text-sm truncate">{c.name}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {c.components.map((comp,i)=>{
                      const item = inventory.find(inv=>inv.id===comp.inventoryItemId);
                      return <Badge key={i} className="bg-white/5 text-white/50 text-[9px] font-bold border-0 rounded-md">{comp.quantity}x {item?.name||'?'}</Badge>;
                    })}
                  </div>
                </div>
                <div className="text-center shrink-0">
                  <p className="text-brand-yellow font-black text-lg">{avail}</p>
                  <p className="text-[9px] text-white/30 font-bold uppercase">disponible</p>
                </div>
                <Badge className={`shrink-0 rounded-full px-3 py-1 text-[9px] font-black uppercase ${c.active?'bg-green-500/10 text-green-400 border-green-500/20':'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                  {c.active?'Activo':'Inactivo'}
                </Badge>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="w-9 h-9 rounded-xl bg-white/5 text-white/50 hover:bg-brand-yellow hover:text-brand-black" onClick={()=>openEdit(c,'combo')}><Edit className="w-4 h-4"/></Button>
                  <Button variant="ghost" size="icon" className="w-9 h-9 rounded-xl bg-white/5 text-red-400/60 hover:bg-red-500 hover:text-white" onClick={()=>setDeleteConfirm({id:c.id, type:'combo', name:c.name})}><Trash2 className="w-4 h-4"/></Button>
                </div>
              </div>
            );
          })}
        </TabsContent>
      </Tabs>

      {/* FULL-PAGE EDIT PANEL — replaces old dialog, no scrolling needed */}
      {modal.open && editItem && (
        <div className="fixed inset-0 z-50 flex items-stretch">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={()=>setModal({...modal,open:false})} />

          {/* Panel */}
          <div className="relative mx-auto my-4 w-full max-w-5xl bg-brand-charcoal border border-white/10 rounded-2xl flex flex-col z-10 shadow-2xl overflow-hidden" style={{maxHeight:'calc(100vh - 32px)'}}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-yellow rounded-xl text-brand-black">
                  {modal.mode==='add'?<Plus className="w-5 h-5"/>:<Edit className="w-5 h-5"/>}
                </div>
                <h2 className="text-xl font-black text-white">
                  {modal.mode==='add'?'Crear':'Editar'} {modal.type==='bike'?'Bicicleta':modal.type==='accessory'?'Accesorio':'Combinado'}
                </h2>
              </div>
              <Button variant="ghost" size="icon" onClick={()=>setModal({...modal,open:false})} className="w-9 h-9 rounded-xl text-white/40 hover:text-white hover:bg-white/10">
                <X className="w-5 h-5"/>
              </Button>
            </div>

            {/* Body — two-column layout, fills available space */}
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 h-full">
                {/* LEFT COLUMN — Identity */}
                <div className="p-6 space-y-5 border-b lg:border-b-0 lg:border-r border-white/5">
                  {/* Image preview */}
                  <div>
                    <Label className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Imagen del producto</Label>
                    <div className="w-full h-40 bg-black/40 rounded-xl border border-dashed border-white/10 flex items-center justify-center overflow-hidden mt-2">
                      {editItem.imageUrl ? <img src={editItem.imageUrl} className="w-full h-full object-cover" alt="preview"/> : <ImageIcon className="w-10 h-10 text-white/10"/>}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Input placeholder="URL de imagen..." value={editItem.imageUrl||''} onChange={e=>setEditItem({...editItem,imageUrl:e.target.value})} className="bg-black/40 border-white/10 h-10 text-sm rounded-xl text-white flex-1"/>
                      <FileUploader onUpload={(url)=>setEditItem({...editItem,imageUrl:url})} folder="inventory" />
                    </div>
                  </div>

                  {/* Additional images */}
                  <div className="space-y-2">
                    <Label className="text-[10px] text-white/40 font-bold uppercase tracking-wider block">
                      Imágenes adicionales de la galería (URLs)
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
                            variant="outline"
                            className="w-full h-9 rounded-xl border border-white/10 hover:border-brand-yellow hover:bg-brand-yellow/5 text-xs font-black uppercase text-white transition-colors cursor-pointer"
                            onClick={() => {
                              setEditItem({ ...editItem, additionalImageUrls: [...urls, ''] });
                            }}
                          >
                            + Agregar otra URL de imagen
                          </Button>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Name */}
                  <div>
                    <Label className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Nombre</Label>
                    <Input value={editItem.name} onChange={e=>setEditItem({...editItem,name:e.target.value})} className="bg-black/40 border-white/10 h-12 font-black text-lg rounded-xl mt-1 text-white" placeholder={modal.type==='bike'?'Ej: Urbana':'Ej: Canasta metálica'} required/>
                  </div>

                  {/* Category Selection for all items */}
                  {editItem && (
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <Label className="text-[10px] text-white/40 font-bold uppercase tracking-wider">
                          {editItem.availableForSale ? 'Categoría de Tienda' : 'Categoría de Alquiler'}
                        </Label>
                        <button 
                          type="button" 
                          onClick={() => {
                            const isSale = editItem.availableForSale;
                            const newCat = prompt(isSale 
                              ? 'Ingrese el nombre de la nueva categoría de tienda (ej. Repuestos, Accesorios):' 
                              : 'Ingrese el nombre de la nueva categoría de alquiler (ej. Urbana, Montañera):'
                            );
                            if (newCat && newCat.trim()) {
                              const trimmed = newCat.trim();
                              if (isSale) {
                                addShopCategory(trimmed).catch((err) => console.warn('No se pudo guardar la categoría:', err));
                              } else {
                                addBikeCategory(trimmed).catch((err) => console.warn('No se pudo guardar la categoría:', err));
                              }
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
                          {(editItem.availableForSale ? availableShopCategories : availableBikeCategories).map((cat) => (
                            <SelectItem key={cat} value={cat} className="focus:bg-white/5 focus:text-white cursor-pointer">
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Description */}
                  <div>
                    <Label className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Descripción</Label>
                    <Textarea value={editItem.description} onChange={e=>setEditItem({...editItem,description:e.target.value})} className="bg-black/40 border-white/10 rounded-xl resize-none text-sm mt-1 text-white" rows={3}/>
                  </div>

                  {/* Toggles */}
                  <div className="flex flex-wrap gap-5 bg-black/30 p-4 rounded-xl border border-white/5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox checked={editItem.active} onCheckedChange={v=>setEditItem({...editItem,active:Boolean(v)})} className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"/>
                      <span className="text-xs font-bold text-white/60">Activo</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox checked={editItem.availableForRental} onCheckedChange={v=>setEditItem({...editItem,availableForRental:Boolean(v)})} className="data-[state=checked]:bg-brand-yellow data-[state=checked]:border-brand-yellow data-[state=checked]:text-brand-black"/>
                      <span className="text-xs font-bold text-white/60">Disponible para alquiler</span>
                    </label>
                    {modal.type !== 'combo' && (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox checked={editItem.availableForSale} onCheckedChange={v=>setEditItem({...editItem,availableForSale:Boolean(v)})} className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"/>
                        <span className="text-xs font-bold text-white/60">Disponible para venta</span>
                      </label>
                    )}
                  </div>
                </div>

                {/* RIGHT COLUMN — Stock / Components + Pricing */}
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
                          <div key={idx} className="flex items-center gap-2 bg-black/40 p-3 rounded-xl border border-white/5">
                            <div className="flex-1">
                              <Label className="text-[9px] text-white/30 font-bold uppercase">Aro</Label>
                              <select value={ws.size} onChange={e=>updateWS(idx,'size',e.target.value)} className="w-full bg-transparent border-0 border-b border-white/10 text-white font-black text-sm py-1 focus:outline-none">
                                {WHEEL_OPTIONS.map(o=><option key={o} value={o} className="bg-brand-charcoal">Aro {o}</option>)}
                                <option value="otro" className="bg-brand-charcoal">Otro</option>
                              </select>
                            </div>
                            <div className="w-20">
                              <Label className="text-[9px] text-white/30 font-bold uppercase">Stock</Label>
                              <Input type="number" min={0} value={toEditableNumber(ws.stock)} onChange={e=>updateWS(idx,'stock',e.target.value === '' ? '' : Number(e.target.value))} className="bg-transparent border-0 border-b border-white/10 h-8 font-black text-brand-yellow text-center text-lg p-0"/>
                            </div>
                            <Button type="button" variant="ghost" size="icon" className="text-red-400/40 hover:text-red-400 w-7 h-7 rounded-lg mt-3" onClick={()=>removeWheelSize(idx)}>
                              <X className="w-3 h-3"/>
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ACCESSORY: Simple stock */}
                  {modal.type === 'accessory' && (
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                      <Label className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Stock Disponible</Label>
                      <Input type="number" min={0} value={toEditableNumber(editItem.stock)} onChange={e=>setEditItem({...editItem,stock:e.target.value === '' ? '' : Number(e.target.value)})} className="bg-black/40 border-white/10 h-16 font-black text-4xl text-brand-yellow text-center rounded-xl mt-2"/>
                    </div>
                  )}

                  {/* COMBO: Components */}
                  {modal.type === 'combo' && (
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                          <Layers className="w-4 h-4 text-brand-yellow/60"/> Componentes
                        </h4>
                        <Button type="button" onClick={addComponent} className="bg-brand-yellow text-brand-black font-black h-8 px-3 text-xs rounded-lg">
                          <Plus className="w-3 h-3 mr-1"/> Agregar
                        </Button>
                      </div>
                      {editItem.components.length === 0 && <p className="text-center py-4 text-white/20 text-xs font-bold">Agrega al menos un componente</p>}
                      {editItem.components.map((comp:ComboComponent, idx:number) => {
                        const selectedItem = inventory.find(i=>i.id===comp.inventoryItemId);
                        return (
                          <div key={idx} className="flex items-center gap-3 bg-black/40 p-3 rounded-xl border border-white/5">
                            <select value={comp.inventoryItemId} onChange={e=>{
                              const item = inventory.find(i=>i.id===e.target.value);
                              updateComponent(idx, {inventoryItemId:e.target.value, requiresWheelSize: item?.hasWheelSizes||false});
                            }} className="flex-1 bg-transparent border-0 border-b border-white/10 text-white font-bold text-sm py-1 focus:outline-none">
                              <option value="" className="bg-brand-charcoal text-white/40">Seleccionar producto...</option>
                              {inventory.filter(i=>i.active).map(i=><option key={i.id} value={i.id} className="bg-brand-charcoal">{i.name} ({i.itemType==='bike'?'Bici':'Acc.'})</option>)}
                            </select>
                            <div className="relative flex-1 max-w-[80px]">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-white/20 uppercase">Cant.</span>
                              <Input type="number" min={1} value={toEditableNumber(comp.quantity)} onChange={e=>updateComponent(idx,{quantity:e.target.value === '' ? '' as any : Number(e.target.value)})} className="bg-black/20 border-white/5 h-10 pl-10 pr-2 font-black text-brand-yellow rounded-xl text-right" />
                            </div>
                            {selectedItem?.hasWheelSizes && <Badge className="bg-brand-yellow/10 text-brand-yellow text-[8px] font-bold border-0">Requiere aro</Badge>}
                            <Button type="button" variant="ghost" size="icon" className="text-red-400/40 hover:text-red-400 w-7 h-7 rounded-lg" onClick={()=>removeComponent(idx)}>
                              <X className="w-3 h-3"/>
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Pricing */}
                  <PriceFields editItem={editItem} setEditItem={setEditItem} />
                </div>
              </div>
            </div>

            {/* Footer — always visible */}
            <div className="flex gap-3 px-6 py-4 border-t border-white/5 shrink-0 bg-black/20">
              <Button type="button" variant="ghost" onClick={()=>setModal({...modal,open:false})} className="flex-1 h-12 text-white/40 font-bold rounded-xl hover:bg-white/5 border border-white/5">Cancelar</Button>
              <Button type="button" onClick={handleSave} className="flex-1 h-12 bg-brand-yellow text-brand-black font-black rounded-xl hover:bg-brand-yellow/90 text-base">Guardar</Button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-md bg-black/60">
          <div className="bg-brand-charcoal border border-white/10 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-500"/>
              </div>
              <h3 className="text-xl font-black text-white">¿Eliminar producto?</h3>
              <p className="text-white/40 text-sm font-medium">Estás por eliminar <span className="text-white font-bold">"{deleteConfirm.name}"</span>. Esta acción no se puede deshacer.</p>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={()=>setDeleteConfirm(null)} className="flex-1 h-12 rounded-xl font-bold bg-white/5 text-white/50 hover:bg-white/10 hover:text-white">
                Cancelar
              </Button>
              <Button onClick={handleDelete} className="flex-1 h-12 rounded-xl font-bold bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-600/20">
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
              <h3 className="text-xl font-black text-white">Administrar Categorías</h3>
              <Button variant="ghost" size="icon" onClick={() => setCategoryManagerOpen(false)} className="w-8 h-8 rounded-lg text-white/40 hover:text-white hover:bg-white/10">
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Tab Selector */}
            <div className="grid grid-cols-2 p-1 bg-black/35 rounded-xl border border-white/5">
              <button
                onClick={() => {
                  setCatManagerTab('rental');
                  setEditingCat(null);
                }}
                className={`py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                  catManagerTab === 'rental' 
                    ? 'bg-brand-yellow text-brand-black shadow-md' 
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                Alquileres
              </button>
              <button
                onClick={() => {
                  setCatManagerTab('shop');
                  setEditingCat(null);
                }}
                className={`py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                  catManagerTab === 'shop' 
                    ? 'bg-brand-yellow text-brand-black shadow-md' 
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                Tienda
              </button>
            </div>

            {/* Add Category Form */}
            <div className="flex gap-2">
              <Input
                placeholder={catManagerTab === 'rental' ? 'Nueva categoría alquiler...' : 'Nueva categoría tienda...'}
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                className="bg-black/40 border-white/10 h-10 text-sm rounded-xl text-white flex-1 focus:ring-brand-yellow/50"
              />
              <Button
                onClick={async () => {
                  const trimmed = newCategoryName.trim();
                  if (!trimmed) return;
                  try {
                    if (catManagerTab === 'rental') {
                      await addBikeCategory(trimmed);
                    } else {
                      await addShopCategory(trimmed);
                    }
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
              {(catManagerTab === 'rental' ? bikeCategories : shopCategories).map((cat, idx) => {
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
                      const list = [...(catManagerTab === 'rental' ? bikeCategories : shopCategories)];
                      const item = list[draggedIndex];
                      list.splice(draggedIndex, 1);
                      list.splice(idx, 0, item);
                      if (catManagerTab === 'rental') {
                        await reorderBikeCategories(list);
                      } else {
                        await reorderShopCategories(list);
                      }
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
                                if (catManagerTab === 'rental') {
                                  await updateBikeCategory(cat, editingVal);
                                } else {
                                  await updateShopCategory(cat, editingVal);
                                }
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
                              if (catManagerTab === 'rental') {
                                await updateBikeCategory(cat, editingVal);
                              } else {
                                await updateShopCategory(cat, editingVal);
                              }
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
                                  if (catManagerTab === 'rental') {
                                    await deleteBikeCategory(cat);
                                  } else {
                                    await deleteShopCategory(cat);
                                  }
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
              {(catManagerTab === 'rental' ? bikeCategories : shopCategories).length === 0 && (
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
