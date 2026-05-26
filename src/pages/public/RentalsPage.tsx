import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Minus, Info, Bike, Wrench, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useStore } from '@/context/StoreContext';

import { generateRentalWhatsAppLink } from '@/lib/whatsapp';

type DisplayProduct = {
  id: string; name: string; description: string; imageUrl: string;
  type: 'single' | 'combo';
  itemType?: 'bike' | 'accessory';
  hasWheelSizes: boolean;
  wheelSizes?: { size: string; stock: number }[];
  stock?: number;
  comboAvailability?: number;
  components?: { name: string; qty: number; requiresWheelSize: boolean }[];
  pricePerHour: number; priceFrom5thHour: number; pricePerDay: number; pricePerWeek: number; pricePerMonth: number;
};

const DURATIONS = ['1 hora', '2 horas', '3 horas', '4 horas', '1 día', '1 semana', '1 mes'];

export default function RentalsPage() {
  const { inventory, combos, addRental, addOrUpdateCustomer, calculatePrice, getComboAvailability } = useStore();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Bicicletas');
  const [selected, setSelected] = useState<DisplayProduct | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [ci, setCi] = useState('');
  const [date, setDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [duration, setDuration] = useState('1 hora');
  const [qty, setQty] = useState(1);
  const [wheelSize, setWheelSize] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [notes, setNotes] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [customHours, setCustomHours] = useState('');

  // Build display list
  const products = useMemo((): DisplayProduct[] => {
    const items: DisplayProduct[] = [];

    // Single inventory items available for rental
    inventory.filter(i => i.active && i.availableForRental).forEach(i => {
      const totalStock = i.hasWheelSizes && i.wheelSizes
        ? i.wheelSizes.reduce((s, ws) => s + ws.stock, 0)
        : (i.stock ?? 0);
      if (totalStock <= 0) return;

      items.push({
        id: i.id, name: i.name, description: i.description, imageUrl: i.imageUrl,
        type: 'single', itemType: i.itemType,
        hasWheelSizes: i.hasWheelSizes,
        wheelSizes: i.wheelSizes,
        stock: i.hasWheelSizes ? undefined : (i.stock ?? 0),
        pricePerHour: i.pricePerHour, priceFrom5thHour: i.priceFrom5thHour,
        pricePerDay: i.pricePerDay, pricePerWeek: i.pricePerWeek, pricePerMonth: i.pricePerMonth,
      });
    });

    // Combos
    combos.filter(c => c.active && c.availableForRental).forEach(c => {
      const avail = getComboAvailability(c.id);
      if (avail <= 0) return;

      const comps = c.components.map(comp => {
        const item = inventory.find(i => i.id === comp.inventoryItemId);
        return { name: item?.name || '?', qty: comp.quantity, requiresWheelSize: comp.requiresWheelSize };
      });

      // Check if any component requires wheel size
      const hasWS = c.components.some(comp => {
        const item = inventory.find(i => i.id === comp.inventoryItemId);
        return item?.hasWheelSizes;
      });

      // Get wheel sizes from the bike component, adjusted by other components' stock
      let ws: { size: string; stock: number }[] | undefined;
      if (hasWS) {
        const bikeComp = c.components.find(comp => {
          const item = inventory.find(i => i.id === comp.inventoryItemId);
          return item?.hasWheelSizes;
        });

        if (bikeComp) {
          const bikeItem = inventory.find(i => i.id === bikeComp.inventoryItemId);
          
          // Calculate limiting stock from all OTHER components (non-bike)
          let othersMinAvail = Infinity;
          c.components.forEach(comp => {
            if (comp.inventoryItemId === bikeComp.inventoryItemId) return; // Skip the bike itself
            const item = inventory.find(i => i.id === comp.inventoryItemId);
            if (!item) return;
            const stock = item.hasWheelSizes ? 0 : (item.stock ?? 0); // Non-bike items usually don't have wheel sizes
            othersMinAvail = Math.min(othersMinAvail, Math.floor(stock / comp.quantity));
          });

          // Map wheel sizes and cap them by othersMinAvail
          ws = bikeItem?.wheelSizes?.map(w => ({
            size: w.size,
            stock: Math.min(Math.floor(w.stock / bikeComp.quantity), othersMinAvail)
          }));
        }
      }

      items.push({
        id: c.id, name: c.name, description: c.description, imageUrl: c.imageUrl,
        type: 'combo', hasWheelSizes: hasWS, wheelSizes: ws,
        comboAvailability: avail, components: comps,
        pricePerHour: c.pricePerHour, priceFrom5thHour: c.priceFrom5thHour,
        pricePerDay: c.pricePerDay, pricePerWeek: c.pricePerWeek, pricePerMonth: c.pricePerMonth,
      });
    });

    return items;
  }, [inventory, combos, getComboAvailability]);

  const categories = useMemo(() => {
    const cats = ['Bicicletas', 'Accesorios'];
    return [...cats, 'Todas'];
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter(p => {
      if (category !== 'Todas') {
        const cat = p.type === 'combo' ? 'Bicicletas' : (p.itemType === 'bike' ? 'Bicicletas' : 'Accesorios');
        if (cat !== category) return false;
      }
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
    });
  }, [products, category, search]);

  const total = useMemo(() => {
    if (!selected) return 0;
    return calculatePrice(selected.type, selected.id, duration, qty);
  }, [selected, duration, qty, calculatePrice]);

  const getAvailableStock = (p: DisplayProduct): number => {
    if (p.type === 'combo') return p.comboAvailability ?? 0;
    if (p.hasWheelSizes && p.wheelSizes) {
      if (wheelSize) return p.wheelSizes.find(ws => ws.size === wheelSize)?.stock ?? 0;
      return p.wheelSizes.reduce((s, ws) => s + ws.stock, 0);
    }
    return p.stock ?? 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !accepted || loading) return;

    // Validate wheel size
    if (selected.hasWheelSizes && !wheelSize) {
      alert('Por favor selecciona un tamaño de aro.');
      return;
    }

    // Validate stock
    const avail = getAvailableStock(selected);
    if (avail < qty) {
      alert(`Solo hay ${avail} unidades disponibles.`);
      return;
    }

    setLoading(true);

    try {
      const customerFullName = `${name} ${lastName}`.trim();

      // Build component selections for combos
      let componentSelections;
      if (selected.type === 'combo') {
        const combo = combos.find(c => c.id === selected.id);
        if (combo) {
          componentSelections = combo.components.map(comp => {
            const item = inventory.find(i => i.id === comp.inventoryItemId);
            return {
              inventoryItemId: comp.inventoryItemId,
              wheelSize: item?.hasWheelSizes ? wheelSize : undefined,
            };
          });
        }
      }

      const rental = {
        customerName: customerFullName,
        customerPhone: phone,
        customerCI: ci,
        productType: selected.type as 'single' | 'combo',
        productId: selected.id,
        productName: selected.name,
        productNameSnapshot: selected.name,
        selectedWheelSize: selected.hasWheelSizes ? wheelSize : undefined,
        componentSelections,
        quantity: qty,
        duration,
        date,
        pickupTime,
        total,
        paymentMethod,
        notes,
      };

      // Generate rental object with reservation code (instant, no DB call)
      const savedRental = await addRental(rental);

      // Open WhatsApp immediately — no blocking
      const link = generateRentalWhatsAppLink({
        reservationCode: savedRental.reservationCode,
        customerName: customerFullName,
        customerPhone: phone,
        customerCI: ci,
        productName: selected.name,
        quantity: qty,
        duration,
        date,
        pickupTime,
        selectedWheelSize: selected.hasWheelSizes ? wheelSize : undefined,
        total,
        paymentMethod,
        notes,
      });
      
      window.open(link, '_blank');

      // Fire customer save in background (don't block or throw)
      addOrUpdateCustomer({ name: customerFullName, phone, ci }, false).catch(err => {
        console.warn('Background customer save failed (non-critical):', err);
      });

      // Reset & Close
      setShowForm(false);
      setName(''); setLastName(''); setPhone(''); setCi(''); setDate(''); setPickupTime('');
      setDuration('1 hora'); setQty(1); setWheelSize(''); setNotes(''); setAccepted(false); setPaymentMethod('Efectivo'); setCustomHours('');
      
      alert('¡Reserva enviada con éxito! Se ha abierto WhatsApp para tu confirmación.');
    } catch (err) {
      console.error(err);
      alert('No se pudo registrar la reserva, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const openReservation = (p: DisplayProduct) => {
    setSelected(p);
    setShowForm(true);
    setQty(1);
    setWheelSize('');
  };

  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="bg-brand-charcoal pt-28 pb-20 relative overflow-hidden">
        <div className="absolute inset-0">
          {/* Desktop Image */}
          <img src="/hero-alquiler-computadora.jpg" alt="" className="hidden sm:block w-full h-full object-cover" />
          {/* Mobile Image */}
          <img src="/hero-alquiler-celular.jpg" alt="" className="block sm:hidden w-full h-full object-cover" />
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-brand-black/60 via-brand-black/40 to-brand-black/70" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 text-center z-10">
          <motion.div initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} transition={{duration:0.6}}>
            <h1 className="text-3xl sm:text-5xl font-tan text-white tracking-tight leading-tight uppercase">
              TU AVENTURA EN <span className="text-brand-yellow">MOVIMIENTO</span>
            </h1>
            <p className="text-white/60 text-lg sm:text-xl font-maiandra max-w-2xl mx-auto mt-4">
              Explora nuestros productos de alquiler. Calidad, estilo y libertad.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
              <Input placeholder="Buscar producto..." value={search} onChange={e=>setSearch(e.target.value)}
                className="h-12 pl-12 border-gray-200 rounded-xl text-base focus-visible:ring-brand-yellow"/>
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map(c => (
                <Button key={c} variant={category===c?'default':'outline'} size="sm"
                  className={`rounded-full px-5 font-bold ${category===c?'bg-brand-yellow text-brand-black':'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                  onClick={()=>setCategory(c)}>{c}</Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <section className="py-10 min-h-[50vh] bg-background">
        <div className="max-w-7xl mx-auto px-4">
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-400 font-medium">No hay productos disponibles para alquiler.</div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((p, i) => {
                const avail = getAvailableStock(p);
                const icon = p.type === 'combo' ? Layers : p.itemType === 'bike' ? Bike : Wrench;
                const Icon = icon;

                return (
                  <motion.div key={p.id} initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}}
                    viewport={{once:true}} transition={{delay:(i%8)*0.05,duration:0.4}}>
                    <Card className="group bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-lg transition-all h-full flex flex-col overflow-hidden hover:-translate-y-1">
                      <div className="relative h-[220px] sm:h-[240px] bg-gray-50 flex items-center justify-center overflow-hidden">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"/>
                        ) : (
                          <Icon className="w-12 h-12 text-brand-yellow/30"/>
                        )}
                        <Badge className="absolute top-3 right-3 text-[9px] font-black uppercase px-2 py-1 border-0 bg-brand-yellow text-brand-black">
                          {p.type === 'combo' ? 'Combo' : p.itemType === 'bike' ? 'Bicicleta' : 'Accesorio'}
                        </Badge>
                      </div>

                      <CardContent className="p-5 flex-1 flex flex-col">
                        <div className="flex-1">
                          <h3 className="font-black text-brand-black text-lg leading-tight">{p.name}</h3>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-4">{p.description || 'Disponible para alquiler'}</p>

                          {/* Components for combos */}
                          {p.components && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {p.components.map((c, idx) => (
                                <Badge key={idx} variant="secondary" className="bg-gray-50 text-[9px] font-bold text-gray-400 border-0">{c.qty}x {c.name}</Badge>
                              ))}
                            </div>
                          )}

                          {/* Wheel sizes preview */}
                          {p.hasWheelSizes && p.wheelSizes && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {p.wheelSizes.filter(ws=>ws.stock>0).map(ws => (
                                <Badge key={ws.size} className="bg-brand-yellow/10 text-brand-yellow/80 text-[9px] font-bold border-0">Aro {ws.size}</Badge>
                              ))}
                            </div>
                          )}

                          {/* Stock */}
                          {p.hasWheelSizes && p.wheelSizes ? (
                            <div className="flex flex-col gap-1 mt-2">
                              {p.wheelSizes.map(ws => (
                                <p key={ws.size} className="text-[10px] text-gray-400 font-bold uppercase">
                                  Aro {ws.size}: {ws.stock > 0 ? `${ws.stock} disp.` : 'Sin stock'}
                                </p>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[10px] text-gray-400 font-bold mt-2 uppercase">
                              {avail > 0 ? `${avail} disponible${avail !== 1 ? 's' : ''}` : 'Sin stock'}
                            </p>
                          )}
                        </div>

                        <div className="pt-4 border-t border-gray-100 mt-3 space-y-3">
                          <div className="flex justify-between items-end">
                            <div>
                              <p className="text-[10px] text-gray-400 font-bold uppercase">Desde</p>
                              <p className="font-black text-xl text-brand-black">Bs. {p.pricePerHour}<span className="text-xs text-gray-400 font-bold ml-1">/hr</span></p>
                            </div>
                            <p className="text-sm text-gray-400 font-bold">Día: Bs. {p.pricePerDay}</p>
                          </div>

                          <Button className="w-full h-11 rounded-xl font-black text-sm bg-brand-black text-brand-yellow hover:bg-brand-yellow hover:text-brand-black"
                            disabled={avail <= 0} onClick={()=>openReservation(p)}>
                            {avail > 0 ? 'Reservar' : 'No Disponible'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="reservation-modal max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto bg-brand-charcoal border-white/10 p-0 rounded-2xl text-white">
          <DialogHeader className="p-5 border-b border-white/5">
            <DialogTitle className="text-lg sm:text-xl font-tan uppercase">RESERVAR — {selected?.name}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
            {/* Personal info */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-brand-yellow uppercase tracking-widest">1. Datos personales</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div><Label className="text-[10px] text-white/40 font-bold uppercase">Nombre</Label>
                  <Input value={name} onChange={e=>setName(e.target.value)} required className="bg-black/40 border-white/5 h-10 text-white font-bold rounded-xl mt-1"/></div>
                <div><Label className="text-[10px] text-white/40 font-bold uppercase">Apellido</Label>
                  <Input value={lastName} onChange={e=>setLastName(e.target.value)} required className="bg-black/40 border-white/5 h-10 text-white font-bold rounded-xl mt-1"/></div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div><Label className="text-[10px] text-white/40 font-bold uppercase">WhatsApp</Label>
                  <Input value={phone} onChange={e=>setPhone(e.target.value)} required placeholder="+591..." className="bg-black/40 border-white/5 h-10 text-white font-bold rounded-xl mt-1"/></div>
                <div><Label className="text-[10px] text-white/40 font-bold uppercase">CI</Label>
                  <Input value={ci} onChange={e=>setCi(e.target.value)} required className="bg-black/40 border-white/5 h-10 text-white font-bold rounded-xl mt-1"/></div>
              </div>
            </div>

            {/* Schedule */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-brand-yellow uppercase tracking-widest">2. Fecha y hora</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div><Label className="text-[10px] text-white/40 font-bold uppercase">Fecha</Label>
                  <Input type="date" value={date} onChange={e=>setDate(e.target.value)} required className="bg-black/40 border-white/5 h-10 text-white font-bold rounded-xl mt-1"/></div>
                <div><Label className="text-[10px] text-white/40 font-bold uppercase">Hora</Label>
                  <Input type="time" value={pickupTime} onChange={e=>setPickupTime(e.target.value)} required className="bg-black/40 border-white/5 h-10 text-white font-bold rounded-xl mt-1"/></div>
              </div>
            </div>

            {/* Duration + Qty */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-brand-yellow uppercase tracking-widest">3. Duración y cantidad</h4>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {DURATIONS.map(d => (
                  <button key={d} type="button" onClick={() => { setDuration(d); setCustomHours(''); }}
                    className={`h-9 rounded-xl text-[10px] font-black uppercase border transition-all ${duration===d && !customHours?'bg-brand-yellow text-brand-black border-brand-yellow':'bg-black/20 border-white/5 text-white/50 hover:border-white/20'}`}>{d}</button>
                ))}
              </div>
              
              {/* Custom hours input */}
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Label className="text-[10px] text-white/40 font-bold uppercase">Horas personalizadas (5+)</Label>
                  <Input 
                    type="number" 
                    min="5" 
                    max="24"
                    placeholder="Ej: 5, 6, 8..."
                    value={customHours}
                    onChange={e => {
                      const val = e.target.value;
                      setCustomHours(val);
                      if (val && parseInt(val, 10) >= 1) {
                        setDuration(`${val} horas`);
                      }
                    }}
                    className="bg-black/40 border-white/5 h-10 text-white font-bold rounded-xl mt-1 w-full"
                  />
                </div>
                {customHours && parseInt(customHours, 10) >= 5 && selected && (
                  <div className="flex-1 bg-black/30 border border-white/5 rounded-xl p-3 mt-5">
                    <p className="text-[9px] text-white/30 font-bold uppercase">Desglose</p>
                    <p className="text-[10px] text-white/60 font-bold">
                      4 hrs × Bs.{selected.pricePerHour} = Bs.{selected.pricePerHour * 4}
                    </p>
                    <p className="text-[10px] text-brand-yellow font-bold">
                      +{parseInt(customHours, 10) - 4} hrs × Bs.{selected.priceFrom5thHour} = Bs.{(parseInt(customHours, 10) - 4) * selected.priceFrom5thHour}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 bg-black/40 border border-white/5 rounded-xl p-2">
                <button type="button" onClick={()=>setQty(Math.max(1,qty-1))} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/50"><Minus className="w-4 h-4"/></button>
                <span className="flex-1 text-center font-black text-lg">{qty}</span>
                <button type="button" onClick={()=>setQty(qty+1)} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/50"><Plus className="w-4 h-4"/></button>
              </div>
            </div>

            {/* Wheel size */}
            {selected?.hasWheelSizes && selected.wheelSizes && (
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-brand-yellow uppercase tracking-widest flex items-center gap-1"><Info className="w-3 h-3"/> Selecciona aro</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {selected.wheelSizes.map(ws => (
                    <button key={ws.size} type="button" disabled={ws.stock<=0} onClick={()=>setWheelSize(ws.size)}
                      className={`p-3 rounded-xl border transition-all text-center flex flex-col items-center justify-center min-w-[80px] ${ws.stock<=0?'opacity-30 cursor-not-allowed border-white/5':wheelSize===ws.size?'bg-brand-yellow/10 border-brand-yellow text-brand-yellow':'bg-black/20 border-white/5 text-white/60 hover:border-white/20'}`}>
                      <span className="text-sm font-black whitespace-nowrap">Aro {ws.size}</span>
                      <span className="block text-[9px] font-bold opacity-50 uppercase whitespace-nowrap">{ws.stock} disp.</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Payment */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-brand-yellow uppercase tracking-widest">4. Método de pago</h4>
              <div className="flex gap-2">
                {['Efectivo', 'QR'].map(m => (
                  <button key={m} type="button" onClick={()=>setPaymentMethod(m)}
                    className={`flex-1 h-10 rounded-xl text-xs font-black uppercase border transition-all ${paymentMethod===m?'bg-brand-yellow text-brand-black border-brand-yellow':'bg-black/20 border-white/5 text-white/50'}`}>{m}</button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label className="text-[10px] text-white/40 font-bold uppercase">Observaciones (opcional)</Label>
              <Textarea value={notes} onChange={e=>setNotes(e.target.value)} className="bg-black/40 border-white/5 h-16 rounded-xl resize-none text-sm mt-1"/>
            </div>

            {/* Total + Submit */}
            <div className="bg-brand-yellow text-brand-black p-5 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest">Total Estimado</p>
                  <p className="text-3xl font-black">Bs. {total}</p>
                </div>
                <p className="text-[9px] font-bold uppercase opacity-60">Pago en local</p>
              </div>

              <div className="flex items-start gap-2 bg-brand-charcoal/10 p-3 rounded-xl">
                <Checkbox id="terms" checked={accepted} onCheckedChange={v=>setAccepted(Boolean(v))} required className="mt-0.5 border-brand-charcoal"/>
                <Label htmlFor="terms" className="text-[10px] font-bold uppercase text-brand-charcoal/80 leading-relaxed">Acepto los términos y condiciones de alquiler</Label>
              </div>

              <Button type="submit" disabled={!accepted || (selected?.hasWheelSizes && !wheelSize) || loading}
                className="w-full bg-brand-black text-brand-yellow hover:bg-brand-black/90 font-black rounded-xl h-12 uppercase text-xs tracking-widest disabled:opacity-30">
                {loading ? 'Registrando...' : 'Confirmar Reserva vía WhatsApp'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
