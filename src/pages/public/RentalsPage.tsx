import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bike, ChevronRight, ChevronLeft, ShoppingCart, ShoppingBag, Image as ImageIcon } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useStore } from '@/context/StoreContext';
import { useCart } from '@/context/CartContext';
import CustomerAuthModal from '@/components/layout/CustomerAuthModal';
import RentalCheckoutWizard from '@/components/rentals/RentalCheckoutWizard';
import type { RentalCartItem } from '@/components/rentals/RentalCheckoutWizard';
import { useLanguage } from '@/context/LanguageContext';




type DisplayProduct = {
  id: string; name: string; description: string; details?: string; imageUrl: string;
  type: 'single' | 'combo';
  itemType?: 'bike' | 'accessory';
  category?: string;
  secondaryCategories?: string[];
  hasWheelSizes: boolean;
  wheelSizes?: { size: string; stock: number }[];
  stock?: number;
  comboAvailability?: number;
  components?: { name: string; qty: number; requiresWheelSize: boolean }[];
  pricePerHour: number; priceFrom5thHour: number; pricePerDay: number; pricePerWeek: number; pricePerMonth: number;
};



function productCategories(product: DisplayProduct) {
  const mainCategory = product.category || (product.itemType === 'accessory' ? 'Accesorios' : 'Otros');
  return [mainCategory, ...(product.secondaryCategories || [])];
}

function getRentalPriceTiers(product: DisplayProduct) {
  return [
    { label: '1 Hora', value: product.pricePerHour, accent: false },
    { label: '2 Horas', value: product.pricePerHour * 2, accent: false },
    { label: 'Dia', value: product.pricePerDay, accent: false },
    { label: 'Semana', value: product.pricePerWeek, accent: true },
    { label: 'Mes', value: product.pricePerMonth, accent: true },
  ].filter(tier => Number(tier.value) > 0);
}



const translateCategory = (cat: string, lang: string) => {
  if (lang === 'es') return cat;
  switch (cat) {
    case 'Todas': return 'All';
    case 'Urbanas': return 'Urban';
    case 'Montañeras': return 'Mountain';
    case 'Antiguas': return 'Vintage';
    case 'Accesorios': return 'Accessories';
    case 'Bicicletas': return 'Bikes';
    case 'Otros': return 'Others';
    default: return cat;
  }
};

const translateProductName = (name: string, lang: string) => {
  if (lang === 'es') return name;
  return name.replace(/\bAntigua\b/g, 'Vintage')
             .replace(/\bAntiguas\b/g, 'Vintage')
             .replace(/\bMontañera\b/g, 'Mountain')
             .replace(/\bUrbana\b/g, 'Urban');
};

export default function RentalsPage() {
  const { language } = useLanguage();
  const { inventory, combos, getComboAvailability, currentCustomer, events, bikeCategories } = useStore();

  const sortCategories = (a: string, b: string) => {
    const indexA = bikeCategories.indexOf(a);
    const indexB = bikeCategories.indexOf(b);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.localeCompare(b);
  };
  const { totalItems } = useCart();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todas');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [selected, setSelected] = useState<DisplayProduct | null>(null);

  const [searchParams] = useSearchParams();

  // Initialize and update selected category from URL search params
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) {
      const decodedCat = decodeURIComponent(cat);
      setCategory(decodedCat);
      setExpandedCategory(decodedCat);
    } else {
      setCategory('Todas');
      setExpandedCategory(null);
    }
  }, [searchParams]);
  
  // Dynamic Scroll Container Refs
  const scrollRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const selectedEvent = useMemo(() => {
    const activeCat = expandedCategory || category;
    return (events || []).find(e => e.name === activeCat);
  }, [events, category, expandedCategory]);

  const scrollRight = (catKey: string) => {
    const ref = scrollRefs.current[catKey];
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

  // Rental Cart state and wizard checkout steps
  const [rentalCart, setRentalCart] = useState<RentalCartItem[]>([]);
  const [checkoutStep, setCheckoutStep] = useState<number>(1);
  const [authOpen, setAuthOpen] = useState(false);

  // Build display list
  const products = useMemo((): DisplayProduct[] => {
    const items: DisplayProduct[] = [];

    // Single inventory items available for rental
    inventory.filter(i => i.active && i.availableForRental).forEach(i => {
      items.push({
        id: i.id, name: i.name, description: i.description, details: i.details, imageUrl: i.imageUrl,
        type: 'single', itemType: i.itemType,
        category: i.category,
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
        id: c.id, name: c.name, description: c.description, details: c.details, imageUrl: c.imageUrl,
        type: 'combo', hasWheelSizes: hasWS, wheelSizes: ws,
        category: c.category || 'Bicicletas',
        secondaryCategories: c.secondaryCategories,
        comboAvailability: avail, components: comps,
        pricePerHour: c.pricePerHour, priceFrom5thHour: c.priceFrom5thHour,
        pricePerDay: c.pricePerDay, pricePerWeek: c.pricePerWeek, pricePerMonth: c.pricePerMonth,
      });
    });

    return items;
  }, [inventory, combos, getComboAvailability]);

  const categories = useMemo(() => {
    const productCategorySet = new Set<string>();
    products.forEach(product => {
      productCategories(product).forEach(cat => productCategorySet.add(cat));
    });
    if ((events || []).length > 0) {
      productCategorySet.add('Eventos');
    }
    return ['Todas', ...Array.from(productCategorySet).sort(sortCategories)];
  }, [products, events, bikeCategories]);

  const filtered = useMemo(() => {
    return products.filter(p => {
      if (category !== 'Todas') {
        if (!productCategories(p).includes(category)) return false;
      }
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || (p.details || '').toLowerCase().includes(q);
    });
  }, [products, category, search]);



  const openReservation = (p: DisplayProduct) => {
    setSelected(p);
    setCheckoutStep(1);
  };

  // Group products dynamically by their category field
  const productsByCategory = useMemo(() => {
    const groups: Record<string, DisplayProduct[]> = {};
    filtered.forEach(p => {
      const cats = category === 'Todas' ? productCategories(p) : [category];
      cats.forEach(groupName => {
        if (!groups[groupName]) {
          groups[groupName] = [];
        }
        groups[groupName].push(p);
      });
    });
    return groups;
  }, [filtered, category]);

  const categoriesToRender = useMemo(() => {
    return Object.keys(productsByCategory).sort(sortCategories);
  }, [productsByCategory]);

  const expandedProducts = useMemo(() => {
    if (!expandedCategory) return [];
    return products.filter(p => {
      if (!productCategories(p).includes(expandedCategory)) return false;
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || (p.details || '').toLowerCase().includes(q);
    });
  }, [products, expandedCategory, search]);

  const openCategoryView = (catName: string) => {
    setExpandedCategory(catName);
    setCategory(catName);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeCategoryView = () => {
    if (selectedEvent) {
      setExpandedCategory('Eventos');
      setCategory('Eventos');
    } else {
      setExpandedCategory(null);
      setCategory('Todas');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Render method for horizontal slider
  const renderCategorySlider = (
    title: string, 
    productsList: DisplayProduct[], 
    catKey: string
  ) => {
    if (productsList.length === 0) return null;

    const minPrice = Math.min(...productsList.map(p => p.pricePerHour));
    const displayMinPrice = minPrice !== Infinity ? minPrice : 0;

    return (
      <div className="relative py-10 border-b border-gray-100 last:border-b-0">
        {/* Category Header */}
        <div className="flex justify-between items-end mb-6">
          <div className="space-y-3 sm:space-y-1">
            <h2 
              className="font-tan text-[0.77rem] xs:text-[0.875rem] sm:text-[1.85rem] sm:leading-[1.22] lg:text-[2.2rem] uppercase tracking-normal text-brand-yellow [-webkit-text-stroke:1px_#000] drop-shadow-[1.2px_1.2px_0_rgba(0,0,0,1)] whitespace-nowrap sm:whitespace-normal"
            >
              <span translate="no">{translateCategory(title, language)}</span>
            </h2>
            <p className="text-[10px] sm:text-xs font-black uppercase text-gray-400 tracking-widest font-maiandra">
              Desde Bs. {displayMinPrice} / Hora
            </p>
          </div>
          <button
            type="button"
            onClick={() => openCategoryView(catKey)}
            className="font-maiandra text-xs sm:text-sm text-gray-500 hover:text-brand-yellow hover:underline transition-all tracking-wide underline"
          >
            Ver todo
          </button>
        </div>

        {/* Horizontal Slider Area */}
        <div className="relative group/slider">
          <div 
            ref={(el) => { scrollRefs.current[catKey] = el; }}
            className="briz-horizontal-slider flex overflow-x-auto gap-6 pb-6 pt-2 snap-x snap-mandatory scroll-smooth px-1"
          >
            {productsList.map((p) => {
              const avail = getAvailableStock(p);
              const tiers = getRentalPriceTiers(p);
              return (
                <motion.div 
                  key={p.id}
                  className="min-w-[270px] sm:min-w-[320px] max-w-[320px] snap-start flex-shrink-0"
                  whileHover={avail > 0 ? { y: -6 } : undefined}
                  transition={{ duration: 0.3 }}
                >
                  <Card 
                    className={`bg-white border border-gray-100/80 rounded-[1.8rem] shadow-sm transition-all duration-300 h-full flex flex-col overflow-hidden ${avail > 0 ? 'cursor-pointer hover:shadow-xl' : 'cursor-not-allowed opacity-75'}`}
                    onClick={() => {
                      if (avail > 0) openReservation(p);
                    }}
                  >
                    {/* Image Container - Rounded, full size, no overlay box covering the bike */}
                    <div className="relative aspect-[4/3] bg-white overflow-hidden rounded-t-[1.8rem] flex items-center justify-center">
                      {p.imageUrl ? (
                        <img 
                          src={p.imageUrl} 
                          alt={p.name} 
                          className="w-full h-full object-contain p-4" 
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
                          <span translate="no">{translateProductName(p.name, language)}</span>
                        </h3>
                        <p className="text-xs font-sans text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                          {p.description || 'Disponible para alquiler'}
                        </p>
                      </div>

                      {/* Pricing breakdown */}
                      <div className="pt-4 border-t border-gray-50 mt-4">
                        <div className="grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-3">
                          {tiers.map(tier => (
                            <div key={tier.label} className="min-w-0">
                              <span className={`block font-black leading-none text-base sm:text-lg ${tier.accent ? 'text-red-600' : 'text-brand-black'}`}>
                                Bs. {tier.value}
                              </span>
                              <span className={`block font-maiandra text-[9px] font-black uppercase leading-none ${tier.accent ? 'text-red-300' : 'text-gray-300'}`}>
                                / {tier.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="hidden">
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
            onClick={() => scrollRight(catKey)}
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
    <div className="pt-[64px] lg:pt-[86px] bg-[#FFFDF3] min-h-screen">
      {selected ? (
        <div className="max-w-3xl mx-auto px-4 py-10">
          <RentalCheckoutWizard 
            selectedProduct={selected}
            setSelectedProduct={setSelected}
            cart={rentalCart}
            setCart={setRentalCart}
            step={checkoutStep}
            setStep={setCheckoutStep}
            onClose={() => setSelected(null)}
            setAuthOpen={setAuthOpen}
          />
          
          {/* Auth Modal Trigger */}
          <CustomerAuthModal 
            isOpen={authOpen} 
            onClose={() => setAuthOpen(false)} 
            onSuccess={() => setCheckoutStep(4)}
          />
        </div>
      ) : (
        <>
      {/* Welcome Banner for logged-in customers */}
      {currentCustomer && (
        <div className="w-full bg-brand-yellow/10 border-b border-brand-yellow/20 py-3 px-4">
          <p className="text-center text-sm font-black text-brand-black font-maiandra tracking-wide">
            ¡Gracias <span className="uppercase">{currentCustomer.name.split(' ')[0]}</span>!
            {' '}Bienvenid@ nuevamente 💛🚲
          </p>
        </div>
      )}

      {/* Filters & Search Row */}
      <div className="sticky top-[64px] lg:top-[86px] z-40 bg-background/90 backdrop-blur-md border-b border-gray-100/50 py-5 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
          <div className="flex flex-col md:flex-row md:flex-nowrap items-stretch md:items-center gap-4 min-w-0">
            {/* Search Input Card */}
            <div className="w-full md:w-[320px] lg:w-[360px] shrink-0 relative">
              <div className="flex items-center bg-white border-2 border-brand-yellow rounded-full px-4 py-1.5 shadow-sm focus-within:ring-2 focus-within:ring-brand-yellow/30 transition-all">
                <Input 
                  type="text" 
                  placeholder="Buscar en Briz..." 
                  value={search} 
                  onChange={e => setSearch(e.target.value)}
                  className="border-0 bg-transparent h-10 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-gray-400 font-sans font-medium text-base text-brand-black w-full"
                />
                <button className="bg-brand-yellow hover:bg-brand-yellow-light text-brand-black p-2.5 rounded-full flex items-center justify-center transition-colors">
                  <Search className="w-4 h-4" strokeWidth={2.5} />
                </button>
              </div>
            </div>
            
            {/* Category filters & Cart */}
            <div className="flex items-center gap-3 w-full md:flex-1 md:min-w-0">
              <div className="briz-horizontal-slider flex flex-1 min-w-0 gap-2 overflow-x-auto overflow-y-hidden py-1 px-1 scroll-smooth">
                {categories.map(c => (
                  <Button 
                    key={c} 
                    variant={category === c ? 'default' : 'outline'} 
                    size="sm"
                    className={`shrink-0 whitespace-nowrap rounded-full px-6 h-10 font-sans font-bold text-sm tracking-wide transition-all ${
                      category === c 
                        ? 'bg-brand-yellow text-brand-black border-brand-yellow shadow-md scale-105' 
                        : 'bg-white text-gray-500 border-gray-200 hover:border-brand-yellow hover:text-brand-black'
                    }`}
                    onClick={() => {
                      setExpandedCategory(null);
                      setCategory(c);
                    }}
                  >
                    <span translate="no">{translateCategory(c, language)}</span>
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

      {/* Products Category Sliders or Event View */}
      <section className="py-10 min-h-[50vh] bg-background">
        <div className="max-w-7xl mx-auto px-4">

          {/* ── SPECIAL EVENTS SECTION (always visible at top when not in event view) ── */}
          {!selectedEvent && !expandedCategory && (events || []).length > 0 && (
            <div className="mb-12 pb-10 border-b border-gray-100">
              <div className="flex items-end justify-between mb-6">
                <div className="space-y-1">
                  <h2 className="font-tan text-[0.77rem] xs:text-[0.875rem] sm:text-[1.85rem] sm:leading-[1.22] lg:text-[2.2rem] uppercase tracking-normal text-brand-yellow [-webkit-text-stroke:1px_#000] drop-shadow-[1.2px_1.2px_0_rgba(0,0,0,1)]">
                    Eventos Especiales
                  </h2>
                  <p className="text-[10px] sm:text-xs font-black uppercase text-gray-400 tracking-widest font-maiandra">
                    Paquetes para cumpleaños, bodas y eventos corporativos
                  </p>
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {(events || []).map(ev => {
                  const firstImg = ev.subcategories?.[0]?.images?.[0] || ev.images?.[0] || '';
                  return (
                    <motion.div
                      key={ev.id}
                      whileHover={{ y: -5 }}
                      transition={{ duration: 0.25 }}
                      onClick={() => openCategoryView(ev.name)}
                      className="cursor-pointer group rounded-[1.8rem] overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300"
                    >
                      <div className="relative aspect-[16/9] bg-gray-50 overflow-hidden">
                        {firstImg ? (
                          <img src={firstImg} alt={ev.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-10 h-10 text-gray-200" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute bottom-4 left-4 right-4">
                          <h3 className="font-tan text-white text-xl uppercase drop-shadow-md leading-tight">{ev.name}</h3>
                          {ev.price !== undefined && (
                            <span className="inline-block mt-1 bg-brand-yellow text-brand-black text-[10px] font-black px-2 py-0.5 rounded-md uppercase">Desde Bs. {ev.price}</span>
                          )}
                        </div>
                      </div>
                      <div className="p-5 flex items-center justify-between">
                        <p className="text-xs text-gray-500 font-medium line-clamp-2 flex-1 pr-4">{ev.description}</p>
                        <span className="shrink-0 bg-brand-yellow text-brand-black text-[10px] font-black px-3 py-2 rounded-full uppercase tracking-wide group-hover:bg-brand-black group-hover:text-brand-yellow transition-colors">
                          Ver fotos →
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {selectedEvent ? (
            <EventSpecialView event={selectedEvent} onClose={closeCategoryView} language={language} />
          ) : expandedCategory === 'Eventos' ? (
            <div className="py-8">
              <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <button
                    type="button"
                    onClick={closeCategoryView}
                    className="mb-3 inline-flex rounded-full border border-brand-yellow/40 bg-white px-4 py-2 text-xs font-black text-brand-black shadow-sm hover:bg-brand-yellow"
                  >
                    ← Volver a categorías
                  </button>
                  <h1 
                    className="font-tan text-[1.5rem] xs:text-[1.8rem] sm:text-[2.2rem] sm:leading-[1.18] lg:text-[2.6rem] uppercase tracking-normal text-brand-yellow [-webkit-text-stroke:1.1px_#000] drop-shadow-[1.5px_1.5px_0_rgba(0,0,0,1)] whitespace-normal break-words"
                  >
                    Eventos Especiales
                  </h1>
                  <p className="mt-3.5 sm:mt-2 text-[10px] sm:text-xs font-black uppercase text-gray-400 tracking-widest font-maiandra">
                    {(events || []).length} {(events || []).length === 1 ? 'evento disponible' : 'eventos disponibles'}
                  </p>
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {(events || []).map(ev => {
                  const firstImg = ev.subcategories?.[0]?.images?.[0] || ev.images?.[0] || '';
                  return (
                    <motion.div
                      key={ev.id}
                      whileHover={{ y: -5 }}
                      transition={{ duration: 0.25 }}
                      onClick={() => openCategoryView(ev.name)}
                      className="cursor-pointer group rounded-[1.8rem] overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300"
                    >
                      <div className="relative aspect-[16/9] bg-gray-50 overflow-hidden">
                        {firstImg ? (
                          <img src={firstImg} alt={ev.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-10 h-10 text-gray-200" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute bottom-4 left-4 right-4">
                          <h3 className="font-tan text-white text-xl uppercase drop-shadow-md leading-tight">{ev.name}</h3>
                          {ev.price !== undefined && (
                            <span className="inline-block mt-1 bg-brand-yellow text-brand-black text-[10px] font-black px-2 py-0.5 rounded-md uppercase">Desde Bs. {ev.price}</span>
                          )}
                        </div>
                      </div>
                      <div className="p-5 flex items-center justify-between">
                        <p className="text-xs text-gray-500 font-medium line-clamp-2 flex-1 pr-4">{ev.description}</p>
                        <span className="shrink-0 bg-brand-yellow text-brand-black text-[10px] font-black px-3 py-2 rounded-full uppercase tracking-wide group-hover:bg-brand-black group-hover:text-brand-yellow transition-colors">
                          Ver fotos →
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ) : expandedCategory ? (
            <div className="py-8">
              <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <button
                    type="button"
                    onClick={closeCategoryView}
                    className="mb-3 inline-flex rounded-full border border-brand-yellow/40 bg-white px-4 py-2 text-xs font-black text-brand-black shadow-sm hover:bg-brand-yellow"
                  >
                    ← Volver a categorías
                  </button>
                  <h1 
                    className="font-tan text-[1.5rem] xs:text-[1.8rem] sm:text-[2.2rem] sm:leading-[1.18] lg:text-[2.6rem] uppercase tracking-normal text-brand-yellow [-webkit-text-stroke:1.1px_#000] drop-shadow-[1.5px_1.5px_0_rgba(0,0,0,1)] whitespace-normal break-words"
                  >
                    {expandedCategory}
                  </h1>
                  <p className="mt-3.5 sm:mt-2 text-[10px] sm:text-xs font-black uppercase text-gray-400 tracking-widest font-maiandra">
                    {expandedProducts.length} {expandedProducts.length === 1 ? 'producto' : 'productos'} disponibles
                  </p>
                </div>
              </div>
              {expandedProducts.length === 0 ? (
                <div className="rounded-3xl bg-white p-10 text-center text-gray-400 font-medium font-sans shadow-sm">
                  No hay productos en esta categoría.
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {expandedProducts.map(p => {
                    const avail = getAvailableStock(p);
                    return (
                      <Card
                        key={p.id}
                        className={`bg-white border border-gray-100/80 rounded-[1.8rem] shadow-sm transition-all duration-300 h-full flex flex-col overflow-hidden ${avail > 0 ? 'cursor-pointer hover:shadow-xl hover:-translate-y-1' : 'cursor-not-allowed opacity-75'}`}
                        onClick={() => {
                          if (avail > 0) openReservation(p);
                        }}
                      >
                        <div className="relative aspect-[4/3] bg-white overflow-hidden rounded-t-[1.8rem] flex items-center justify-center">
                          {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-contain p-4" /> : <Bike className="w-12 h-12 text-brand-yellow/30" />}
                          <Badge className={`absolute top-4 right-4 text-[9px] font-black uppercase px-2 py-1 border-0 ${avail <= 0 ? 'bg-brand-charcoal text-white' : 'bg-brand-yellow text-brand-black'}`}>
                            {avail <= 0 ? 'Agotado' : p.type === 'combo' ? 'Combo' : p.itemType === 'bike' ? 'Bicicleta' : 'Accesorio'}
                          </Badge>
                        </div>
                        <CardContent className="p-5 flex-1 flex flex-col justify-between bg-white">
                          <div>
                            <h3 className="font-tangkiwood text-lg sm:text-xl text-brand-black leading-tight">
                              <span translate="no">{translateProductName(p.name, language)}</span>
                            </h3>
                            <p className="text-xs font-sans text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                              {p.description || 'Disponible para alquiler'}
                            </p>
                          </div>
                          <div className="pt-4 border-t border-gray-50 mt-4">
                            <span className="block font-maiandra text-[9px] text-gray-400 uppercase tracking-widest leading-none mb-1">Desde</span>
                            <span className="font-tan text-xl text-brand-black leading-none">Bs. {p.pricePerHour}</span>
                            <span className="font-maiandra text-[10px] text-gray-500 font-bold ml-1">/ Hora</span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-400 font-medium font-sans">
              No hay productos disponibles para alquiler.
            </div>
          ) : (
              categoriesToRender.map(catName => (
                <div key={catName}>
                  {renderCategorySlider(catName, productsByCategory[catName], catName)}
                </div>
              ))
          )}
        </div>
      </section>

        </>
      )}

      {/* Floating Rental Cart Indicator */}
      {!selected && rentalCart.length > 0 && (
        <motion.button 
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onClick={() => {
            setSelected(rentalCart[0].product);
            setCheckoutStep(2);
          }}
          className="fixed bottom-6 right-6 z-50 bg-brand-yellow hover:bg-brand-yellow-light text-brand-black w-16 h-16 rounded-full flex items-center justify-center shadow-2xl hover:scale-105 transition-all cursor-pointer group"
          title="Ver Carrito de Alquiler"
        >
          <div className="relative">
            <ShoppingBag className="w-7 h-7" strokeWidth={2.2} />
            <Badge className="absolute -top-2.5 -right-2.5 bg-brand-black text-brand-yellow font-black text-[10px] min-w-5 h-5 flex items-center justify-center p-0 rounded-full border border-brand-yellow/20">
              {rentalCart.reduce((sum, item) => sum + item.quantity, 0)}
            </Badge>
          </div>
        </motion.button>
      )}
    </div>
  );
}

function EventSpecialView({ event, onClose, language }: { event: any; onClose: () => void; language: string }) {
    const [activeSubIndex, setActiveSubIndex] = useState(0);
    const [activeIndex, setActiveIndex] = useState(0);

    const subcategories = event.subcategories || [];
    const hasSubcategories = subcategories.length > 0;

    const currentImages = hasSubcategories
        ? (subcategories[activeSubIndex]?.images || [])
        : (event.images || []);

    // Reset carousel image index when subcategory changes
    useEffect(() => {
        setActiveIndex(0);
    }, [activeSubIndex]);

    const handlePrev = () => {
        if (currentImages.length === 0) return;
        setActiveIndex((prev) => (prev === 0 ? currentImages.length - 1 : prev - 1));
    };

    const handleNext = () => {
        if (currentImages.length === 0) return;
        setActiveIndex((prev) => (prev === currentImages.length - 1 ? 0 : prev + 1));
    };

    const waLink = `https://wa.me/59177860277?text=${encodeURIComponent(
        language === 'es' 
            ? `Hola Briz, deseo consultar sobre el evento especial de alquiler: ${event.name} (Subcategoría: ${hasSubcategories ? subcategories[activeSubIndex]?.name : 'General'})`
            : `Hello Briz, I want to inquire about the special rental event: ${event.name} (Subcategory: ${hasSubcategories ? subcategories[activeSubIndex]?.name : 'General'})`
    )}`;

    return (
        <div className="py-6">
            <button
                type="button"
                onClick={onClose}
                className="mb-8 inline-flex rounded-full border border-brand-yellow/40 bg-white px-5 py-2 text-xs font-black text-brand-black shadow-sm hover:bg-brand-yellow transition-all cursor-pointer"
            >
                {language === 'es' ? '← Volver a categorías' : '← Back to categories'}
            </button>

            {/* Subcategory selection tabs - Horizontal scrollable container for mobile */}
            {hasSubcategories && (
                <div className="w-full flex overflow-x-auto gap-2 mb-8 bg-white border border-gray-100/85 rounded-2xl sm:rounded-[1.8rem] p-2.5 shadow-sm no-scrollbar">
                    {subcategories.map((sub: any, idx: number) => {
                        const isSelected = activeSubIndex === idx;
                        return (
                            <button
                                key={idx}
                                onClick={() => setActiveSubIndex(idx)}
                                className={`px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                                    isSelected 
                                        ? 'bg-brand-yellow text-brand-black shadow-sm scale-102' 
                                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-brand-black'
                                }`}
                            >
                                {sub.name}
                            </button>
                        );
                    })}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 bg-white rounded-3xl lg:rounded-[2.5rem] border border-gray-100 p-4 sm:p-10 shadow-lg overflow-hidden w-full max-w-full">
                {/* Left Side: Photo Carousel */}
                <div className="lg:col-span-7 flex flex-col gap-4 w-full min-w-0">
                    {/* Main Active Image Display */}
                    <div className="relative w-full h-[280px] xs:h-[350px] sm:h-[450px] md:h-[500px] bg-gray-50 rounded-2xl overflow-hidden group border border-gray-100">
                        {currentImages.length > 0 ? (
                            <>
                                <div className="absolute inset-0 flex items-center justify-center p-2 z-0">
                                    <AnimatePresence mode="wait">
                                        <motion.img
                                            key={`${activeSubIndex}-${activeIndex}`}
                                            src={currentImages[activeIndex]}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="max-w-full max-h-full object-contain pointer-events-none"
                                        />
                                    </AnimatePresence>
                                </div>

                                {/* Navigation Arrows */}
                                {currentImages.length > 1 && (
                                    <>
                                        <button
                                            onClick={handlePrev}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black text-white p-2 sm:p-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={handleNext}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black text-white p-2 sm:p-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center gap-2 text-gray-300">
                                <ImageIcon className="w-12 h-12" />
                                <span className="text-xs font-bold">No hay fotos disponibles</span>
                            </div>
                        )}
                    </div>

                    {/* Thumbnails Row */}
                    {currentImages.length > 1 && (
                        <div className="w-full flex gap-2 overflow-x-auto py-1 scroll-smooth no-scrollbar">
                            {currentImages.map((img: string, idx: number) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveIndex(idx)}
                                    className={`relative aspect-[4/3] w-16 sm:w-24 rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                                        activeIndex === idx ? 'border-brand-yellow scale-102 shadow-md' : 'border-transparent hover:border-gray-200'
                                    }`}
                                >
                                    <img src={img} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Side: Details & CTA */}
                <div className="lg:col-span-5 flex flex-col justify-between gap-6 py-2 w-full min-w-0">
                    <div className="space-y-4">
                        <span className="inline-block px-3 py-1 rounded-md bg-brand-yellow/10 text-brand-yellow-vibrant text-[10px] font-black uppercase tracking-wider">
                            {language === 'es' ? 'Paquete Especial Alquiler' : 'Special Rental Package'}
                        </span>
                        <h2 className="font-tan text-2xl sm:text-4xl uppercase leading-tight text-brand-charcoal tracking-wide break-words whitespace-normal">
                            {event.name}
                        </h2>
                        
                        {event.price !== undefined && (
                            <div className="pt-2">
                                <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">
                                    {language === 'es' ? 'Precio estimado' : 'Estimated Price'}
                                </span>
                                <span className="font-tan text-2xl sm:text-3xl text-brand-black">Bs. {event.price}</span>
                            </div>
                        )}

                        <div className="pt-4 border-t border-gray-100">
                            <h4 className="text-xs font-black uppercase tracking-widest text-brand-charcoal/60 mb-2">
                                {language === 'es' ? 'Detalles del Evento' : 'Event Details'}
                            </h4>
                            <p className="text-gray-600 text-sm sm:text-base font-medium leading-relaxed whitespace-pre-line break-words">
                                {event.description}
                            </p>
                        </div>
                    </div>

                    <a href={waLink} target="_blank" rel="noopener noreferrer" className="block w-full pt-4">
                        <Button className="w-full min-h-14 h-auto py-3 px-4 bg-brand-yellow hover:bg-brand-yellow-light text-brand-black font-black uppercase tracking-wider rounded-xl shadow-lg transition-transform hover:scale-[1.01] text-xs sm:text-sm cursor-pointer flex items-center justify-center text-center leading-tight whitespace-normal">
                            {language === 'es' ? 'Reservar / Cotizar por WhatsApp' : 'Book / Inquire via WhatsApp'}
                        </Button>
                    </a>
                </div>
            </div>
        </div>
    );
}
