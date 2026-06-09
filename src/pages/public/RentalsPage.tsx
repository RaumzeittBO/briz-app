import { useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Minus, Bike, ChevronRight, ShoppingCart, Heart, Share2, ArrowLeft, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useStore } from '@/context/StoreContext';
import { useCart } from '@/context/CartContext';
import CustomerAuthModal from '@/components/layout/CustomerAuthModal';



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



// Helper to determine bike category based on name/description
function getBikeCategory(item: DisplayProduct): 'urban' | 'mountain' | 'road' | 'accessory' {
  if (item.type === 'single' && item.itemType === 'accessory') {
    return 'accessory';
  }
  const name = item.name.toLowerCase();
  const desc = item.description.toLowerCase();

  if (name.includes('ruta') || name.includes('pista') || name.includes('road') || name.includes('carrera') || desc.includes('ruta') || desc.includes('pista')) {
    return 'road';
  }
  if (name.includes('montaña') || name.includes('montañera') || name.includes('mtb') || name.includes('mountain') || name.includes('aro 26') || name.includes('aro 24') || name.includes('aro 29') || desc.includes('montaña') || desc.includes('montañera') || desc.includes('mtb')) {
    return 'mountain';
  }
  // Default is urban
  return 'urban';
}

export default function RentalsPage() {
  const { inventory, combos, calculatePrice, getComboAvailability } = useStore();
  const { totalItems } = useCart();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Bicicletas');
  const [selected, setSelected] = useState<DisplayProduct | null>(null);
  // Scroll Container Refs
  const urbanScrollRef = useRef<HTMLDivElement>(null);
  const mountainScrollRef = useRef<HTMLDivElement>(null);
  const roadScrollRef = useRef<HTMLDivElement>(null);
  const accessoryScrollRef = useRef<HTMLDivElement>(null);

  const scrollRight = (ref: HTMLDivElement | null) => {
    if (ref) {
      ref.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  const getAvailableStock = (p: DisplayProduct): number => {
    if (p.type === 'combo') return p.comboAvailability ?? 0;
    if (p.hasWheelSizes && p.wheelSizes) {
      return p.wheelSizes.reduce((s, ws) => s + ws.stock, 0);
    }
    return p.stock ?? 0;
  };

  // Detailed view local states
  const [detailDuration, setDetailDuration] = useState('1 hora');
  const [detailQty, setDetailQty] = useState(1);
  const [detailWheelSize, setDetailWheelSize] = useState('');
  const [authOpen, setAuthOpen] = useState(false);
  const [rentSuccess, setRentSuccess] = useState(false);
  const { currentCustomer } = useStore();

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
    return ['Bicicletas', 'Accesorios', 'Todas'];
  }, []);

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



  const openReservation = (p: DisplayProduct) => {
    setSelected(p);
    setDetailDuration('1 hora');
    setDetailQty(1);
    setDetailWheelSize(p.hasWheelSizes && p.wheelSizes && p.wheelSizes.length > 0 ? p.wheelSizes[0].size : '');
    setRentSuccess(false);
  };

  // Grouped products for sliders
  const urbanProducts = useMemo(() => {
    return filtered.filter(p => getBikeCategory(p) === 'urban');
  }, [filtered]);

  const mountainProducts = useMemo(() => {
    return filtered.filter(p => getBikeCategory(p) === 'mountain');
  }, [filtered]);

  const roadProducts = useMemo(() => {
    return filtered.filter(p => getBikeCategory(p) === 'road');
  }, [filtered]);

  const accessoryProducts = useMemo(() => {
    return filtered.filter(p => getBikeCategory(p) === 'accessory');
  }, [filtered]);

  // Render method for horizontal slider
  const renderCategorySlider = (
    title: string, 
    productsList: DisplayProduct[], 
    scrollRef: React.RefObject<HTMLDivElement | null>
  ) => {
    if (productsList.length === 0) return null;

    return (
      <div className="relative py-10 border-b border-gray-100 last:border-b-0">
        {/* Category Header */}
        <div className="flex justify-between items-end mb-6">
          <h2 className="font-tan text-2xl sm:text-4xl uppercase tracking-wider text-brand-yellow [-webkit-text-stroke:1.5px_#000] drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">
            {title}
          </h2>
          <button className="font-maiandra text-xs sm:text-sm text-gray-500 hover:text-brand-yellow hover:underline transition-all tracking-wide underline">
            Ver todo
          </button>
        </div>

        {/* Horizontal Slider Area */}
        <div className="relative group/slider">
          <div 
            ref={scrollRef}
            className="flex overflow-x-auto gap-6 pb-6 pt-2 scrollbar-none snap-x snap-mandatory scroll-smooth px-1"
          >
            {productsList.map((p) => {
              const avail = getAvailableStock(p);
              return (
                <motion.div 
                  key={p.id}
                  className="min-w-[270px] sm:min-w-[320px] max-w-[320px] snap-start flex-shrink-0"
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card 
                    className="bg-white border border-gray-100/80 rounded-[1.8rem] shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col overflow-hidden cursor-pointer"
                    onClick={() => openReservation(p)}
                  >
                    {/* Image Container - Rounded, full size, no overlay box covering the bike */}
                    <div className="relative aspect-[4/3] bg-gray-50/70 overflow-hidden rounded-t-[1.8rem]">
                      {p.imageUrl ? (
                        <img 
                          src={p.imageUrl} 
                          alt={p.name} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Bike className="w-12 h-12 text-brand-yellow/30" />
                        </div>
                      )}
                      
                      {/* Availability badge */}
                      {avail <= 0 ? (
                        <Badge className="absolute top-4 right-4 bg-brand-charcoal text-white text-[10px] font-black uppercase border-0">
                          Agotado
                        </Badge>
                      ) : (
                        <Badge className="absolute top-4 right-4 text-[9px] font-black uppercase px-2 py-1 border-0 bg-brand-yellow text-brand-black">
                          {p.type === 'combo' ? 'Combo' : p.itemType === 'bike' ? 'Bicicleta' : 'Accesorio'}
                        </Badge>
                      )}
                    </div>

                    <CardContent className="p-5 flex-1 flex flex-col justify-between bg-white">
                      <div>
                        {/* Title of bike in TAN Tangkiwood */}
                        <h3 className="font-tangkiwood text-lg sm:text-xl text-brand-black leading-tight truncate">
                          {p.name}
                        </h3>
                        <p className="text-xs font-cocon text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                          {p.description || 'Disponible para alquiler'}
                        </p>
                      </div>

                      {/* Pricing breakdown */}
                      <div className="pt-4 border-t border-gray-50 mt-4 flex justify-between items-end">
                        <div>
                          <span className="block font-maiandra text-[9px] text-gray-400 uppercase tracking-widest leading-none mb-1">
                            DESDE
                          </span>
                          <span className="font-tan text-xl text-brand-black leading-none">
                            Bs. {p.pricePerHour}
                          </span>
                          <span className="font-maiandra text-[10px] text-gray-500 font-bold ml-1">
                            / Hora
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-tangkiwood text-sm text-brand-black font-semibold">
                            Día: Bs. {p.pricePerDay}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Navigation right arrow - floating, premium style */}
          <button 
            onClick={() => scrollRight(scrollRef.current)}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-brand-black shadow-lg rounded-full w-11 h-11 flex items-center justify-center border border-gray-200 transition-transform active:scale-95 opacity-0 group-hover/slider:opacity-100 pointer-events-none group-hover/slider:pointer-events-auto duration-300"
            aria-label="Deslizar a la derecha"
          >
            <ChevronRight className="w-6 h-6 text-brand-black" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="pt-20 bg-[#FFFDF3] min-h-screen">
      {selected ? (
        <div className="max-w-xl mx-auto px-4 py-10">
          <button 
            onClick={() => { setSelected(null); setRentSuccess(false); }} 
            className="flex items-center gap-2 text-brand-charcoal/60 hover:text-brand-charcoal text-xs font-black uppercase tracking-wider mb-6 font-maiandra"
          >
            <ArrowLeft className="w-4 h-4" /> Volver a Alquileres
          </button>

          {rentSuccess ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border-2 border-brand-yellow rounded-[2.2rem] p-8 text-center space-y-6 shadow-xl"
            >
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto border border-green-500/20">
                <Check className="w-10 h-10 text-green-500" strokeWidth={3} />
              </div>
              <div className="space-y-2">
                <h2 className="font-tan text-2xl uppercase text-brand-black">¡Alquiler Iniciado!</h2>
                <p className="text-xs font-bold uppercase tracking-widest text-brand-yellow font-tangkiwood bg-brand-charcoal px-4 py-1.5 rounded-full inline-block">
                  Reserva en proceso
                </p>
              </div>
              
              <div className="bg-brand-charcoal/5 p-5 rounded-2xl text-left text-xs space-y-3 font-maiandra border border-black/5">
                <p className="text-brand-black/40 font-bold uppercase text-[9px] border-b border-black/5 pb-1">Resumen de Selección</p>
                <p className="font-bold text-brand-black">🚴 Producto: <span className="font-black text-sm">{selected.name}</span></p>
                <p className="font-bold text-brand-black">⏱️ Duración: <span className="font-black">{detailDuration}</span></p>
                {selected.hasWheelSizes && detailWheelSize && (
                  <p className="font-bold text-brand-black">⚙️ Aro: <span className="font-black">Aro {detailWheelSize}</span></p>
                )}
                <p className="font-bold text-brand-black">👥 Cliente: <span className="font-black">{currentCustomer?.name}</span></p>
                <p className="font-bold text-brand-black">💰 Total Estimado: <span className="font-black text-base text-brand-charcoal">Bs. {calculatePrice(selected.type, selected.id, detailDuration, detailQty)}</span></p>
              </div>

              <div className="p-4 bg-brand-yellow/15 border border-brand-yellow/30 text-brand-black text-xs font-bold rounded-2xl text-center leading-relaxed">
                Tus datos de registro se han asociado de forma segura. En el siguiente paso desarrollaremos la pantalla de especificaciones de tu alquiler.
              </div>

              <Button 
                onClick={() => { setSelected(null); setRentSuccess(false); }} 
                className="w-full bg-brand-black hover:bg-brand-black/90 text-brand-yellow font-black rounded-xl h-12 uppercase text-xs tracking-widest font-cocon"
              >
                Aceptar y Volver
              </Button>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {/* Product description */}
              <p className="text-xs sm:text-sm font-medium text-brand-black leading-relaxed text-justify font-cocon bg-white/50 p-5 rounded-2xl border border-black/5">
                {selected.description || 'La bicicleta urbana es ideal para cualquier ruta en la ciudad por caminos asfaltados. Pedalea con comfort, ergonomía y elegancia. Cuadro de acero alivianado. Aros disponibles: 26 y 27. El color mostrado es referencial. La bicicleta se entregará en el color disponible al momento de la entrega.'}
              </p>

              {/* Slideable Large Bike Image Card */}
              <div className="relative aspect-[4/3] bg-white border border-gray-100 rounded-[2.2rem] overflow-hidden shadow-md">
                <img src={selected.imageUrl || '/placeholder_bike.png'} alt={selected.name} className="w-full h-full object-cover" />
                
                {/* Overlay Action Buttons */}
                <div className="absolute bottom-5 right-5 flex gap-2">
                  <button 
                    className="w-10 h-10 rounded-full bg-white/90 hover:bg-white text-brand-black shadow-lg flex items-center justify-center transition-transform active:scale-90 border border-gray-100 cursor-pointer"
                    onClick={() => alert('¡Guardado en tus favoritos!')}
                  >
                    <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                  </button>
                  <button 
                    className="w-10 h-10 rounded-full bg-white/90 hover:bg-white text-brand-black shadow-lg flex items-center justify-center transition-transform active:scale-90 border border-gray-100 cursor-pointer"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      alert('¡Enlace de alquiler copiado al portapapeles!');
                    }}
                  >
                    <Share2 className="w-5 h-5 text-gray-700" />
                  </button>
                </div>
              </div>

              {/* Title & Badge */}
              <div className="flex justify-between items-center">
                <h2 className="font-tangkiwood text-2xl sm:text-3xl text-brand-black leading-none">{selected.name}</h2>
                <Badge className="bg-brand-yellow text-brand-black border-0 text-[10px] font-black uppercase rounded-lg px-2.5 py-1">
                  {selected.type === 'combo' ? 'Combo' : selected.itemType === 'bike' ? 'Bicicleta' : 'Accesorio'}
                </Badge>
              </div>

              {/* Wheel sizes selector */}
              {selected.hasWheelSizes && selected.wheelSizes && selected.wheelSizes.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-[10px] text-brand-black/50 font-bold uppercase tracking-widest font-maiandra">Selecciona Aro</Label>
                  <div className="flex gap-2 flex-wrap">
                    {selected.wheelSizes.map(ws => (
                      <button 
                        key={ws.size} 
                        type="button" 
                        disabled={ws.stock <= 0} 
                        onClick={() => setDetailWheelSize(ws.size)}
                        className={`px-4 py-2.5 text-xs font-black rounded-xl border transition-all cursor-pointer ${
                          ws.stock <= 0 
                            ? 'opacity-30 cursor-not-allowed border-gray-200 bg-gray-50' 
                            : detailWheelSize === ws.size 
                              ? 'bg-brand-yellow border-brand-charcoal text-brand-black shadow-sm' 
                              : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        Aro {ws.size} ({ws.stock} disp.)
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity selector */}
              <div className="space-y-2">
                <Label className="text-[10px] text-brand-black/50 font-bold uppercase tracking-widest font-maiandra">Cantidad</Label>
                <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-1.5 w-32 shadow-sm">
                  <button type="button" onClick={() => setDetailQty(Math.max(1, detailQty - 1))} className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 cursor-pointer"><Minus className="w-3.5 h-3.5" /></button>
                  <span className="flex-1 text-center font-black text-sm text-brand-black font-cocon">{detailQty}</span>
                  <button type="button" onClick={() => setDetailQty(detailQty + 1)} className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 cursor-pointer"><Plus className="w-3.5 h-3.5" /></button>
                </div>
              </div>

              {/* Pricing Grid */}
              <div className="space-y-3">
                <Label className="text-[10px] text-brand-black/50 font-bold uppercase tracking-widest font-maiandra">Selecciona la Duración</Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { l: '1 Hora', v: '1 hora' },
                    { l: '2 Horas', v: '2 horas' },
                    { l: '3 Horas', v: '3 horas' },
                    { l: '4 Horas', v: '4 horas' },
                    { l: '8 Horas', v: '8 horas' },
                    { l: '24 Horas', v: '24 horas' },
                    { l: '1 Semana', v: '1 semana' },
                    { l: '1 Mes', v: '1 mes' }
                  ].map(tier => {
                    const computed = calculatePrice(selected.type, selected.id, tier.v, 1);
                    const isSelected = detailDuration === tier.v;
                    return (
                      <button 
                        key={tier.v} 
                        type="button" 
                        onClick={() => setDetailDuration(tier.v)}
                        className={`p-4 border rounded-2xl text-left flex flex-col justify-center transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-brand-yellow border-brand-charcoal text-brand-black shadow-md scale-[1.01]' 
                            : 'bg-white border-gray-100 text-brand-black hover:border-gray-200'
                        }`}
                      >
                        <span className="font-tan text-lg leading-tight">Bs. {computed}</span>
                        <span className={`text-[10px] font-bold mt-0.5 uppercase font-maiandra ${isSelected ? 'text-brand-charcoal/80 font-black' : 'text-gray-400'}`}>
                          / {tier.l}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Alquilar CTA */}
              <Button 
                onClick={() => {
                  if (!currentCustomer) {
                    setAuthOpen(true);
                  } else {
                    setRentSuccess(true);
                  }
                }}
                className="w-full bg-brand-yellow hover:bg-brand-yellow-light text-brand-black font-black rounded-2xl h-14 uppercase text-sm tracking-widest transition-transform active:scale-[0.98] shadow-lg shadow-brand-yellow/10 font-cocon mt-6 cursor-pointer"
              >
                ALQUILAR
              </Button>
            </div>
          )}

          {/* Auth Modal Trigger */}
          <CustomerAuthModal 
            isOpen={authOpen} 
            onClose={() => setAuthOpen(false)} 
            onSuccess={() => setRentSuccess(true)}
          />
        </div>
      ) : (
        <>
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

      {/* Filters & Search Row */}
      <div className="sticky top-16 z-40 bg-background/90 backdrop-blur-md border-b border-gray-100/50 py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center gap-4">
            {/* Search Input Card */}
            <div className="flex-1 w-full max-w-xl relative">
              <div className="flex items-center bg-white border-2 border-brand-yellow rounded-full px-4 py-1.5 shadow-sm focus-within:ring-2 focus-within:ring-brand-yellow/30 transition-all">
                <Input 
                  type="text" 
                  placeholder="Buscar en Briz..." 
                  value={search} 
                  onChange={e => setSearch(e.target.value)}
                  className="border-0 bg-transparent h-10 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-gray-400 font-cocon font-medium text-base text-brand-black w-full"
                />
                <button className="bg-brand-yellow hover:bg-brand-yellow-light text-brand-black p-2.5 rounded-full flex items-center justify-center transition-colors">
                  <Search className="w-4 h-4" strokeWidth={2.5} />
                </button>
              </div>
            </div>
            
            {/* Category filters & Cart */}
            <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto flex-wrap">
              <div className="flex gap-2 overflow-x-auto py-1">
                {categories.map(c => (
                  <Button 
                    key={c} 
                    variant={category === c ? 'default' : 'outline'} 
                    size="sm"
                    className={`rounded-full px-6 h-10 font-cocon font-bold text-sm tracking-wide transition-all ${
                      category === c 
                        ? 'bg-brand-yellow text-brand-black border-brand-yellow shadow-md scale-105' 
                        : 'bg-white text-gray-500 border-gray-200 hover:border-brand-yellow hover:text-brand-black'
                    }`}
                    onClick={() => setCategory(c)}
                  >
                    {c}
                  </Button>
                ))}
              </div>

              <Link to="/shop" className="shrink-0">
                <Button 
                  variant="outline" 
                  className="relative rounded-full h-10 w-10 p-0 bg-brand-yellow hover:bg-brand-yellow-light text-brand-black border-0 shadow-md hover:scale-105 transition-transform flex items-center justify-center"
                >
                  <ShoppingCart className="w-5 h-5" strokeWidth={2.2} />
                  {totalItems > 0 && (
                    <Badge className="absolute -top-1 -right-1 bg-brand-black text-brand-yellow font-black text-[10px] min-w-4 h-4 flex items-center justify-center p-0 rounded-full shadow-sm">
                      {totalItems}
                    </Badge>
                  )}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Products Category Sliders */}
      <section className="py-10 min-h-[50vh] bg-background">
        <div className="max-w-7xl mx-auto px-4">
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-400 font-medium font-cocon">
              No hay productos disponibles para alquiler.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Category Sliders for Bikes (Urban, Mountain, Road) */}
              {(category === 'Bicicletas' || category === 'Todas') && (
                <>
                  {renderCategorySlider('Bicicletas Urbanas', urbanProducts, urbanScrollRef)}
                  {renderCategorySlider('Bicicletas Montañeras', mountainProducts, mountainScrollRef)}
                  {renderCategorySlider('Bicicletas de Ruta / Pista', roadProducts, roadScrollRef)}
                </>
              )}

              {/* Slider for Accessories */}
              {(category === 'Accesorios' || category === 'Todas') && (
                <>
                  {renderCategorySlider('Accesorios', accessoryProducts, accessoryScrollRef)}
                </>
              )}
            </div>
          )}
        </div>
      </section>

        </>
      )}
    </div>
  );
}
