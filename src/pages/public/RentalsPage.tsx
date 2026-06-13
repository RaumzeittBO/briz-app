import { useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, Bike, ChevronRight, ShoppingCart, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useStore } from '@/context/StoreContext';
import { useCart } from '@/context/CartContext';
import CustomerAuthModal from '@/components/layout/CustomerAuthModal';
import RentalCheckoutWizard from '@/components/rentals/RentalCheckoutWizard';
import type { RentalCartItem } from '@/components/rentals/RentalCheckoutWizard';
import { RENTAL_SEED_CATEGORIES } from '@/data/rentalSeedData';



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

const CATEGORY_PRIORITY = ['Urbanas', 'Montañeras'];

function sortCategories(a: string, b: string) {
  const aPriority = CATEGORY_PRIORITY.indexOf(a);
  const bPriority = CATEGORY_PRIORITY.indexOf(b);
  if (aPriority !== -1 || bPriority !== -1) {
    if (aPriority === -1) return 1;
    if (bPriority === -1) return -1;
    return aPriority - bPriority;
  }
  if (a === 'Accesorios') return 1;
  if (b === 'Accesorios') return -1;
  const seedA = RENTAL_SEED_CATEGORIES.indexOf(a);
  const seedB = RENTAL_SEED_CATEGORIES.indexOf(b);
  if (seedA !== -1 || seedB !== -1) {
    if (seedA === -1) return 1;
    if (seedB === -1) return -1;
    return seedA - seedB;
  }
  return a.localeCompare(b);
}

function productCategories(product: DisplayProduct) {
  const mainCategory = product.category || (product.itemType === 'accessory' ? 'Accesorios' : 'Otros');
  return [mainCategory, ...(product.secondaryCategories || [])];
}



export default function RentalsPage() {
  const { inventory, combos, getComboAvailability } = useStore();
  const { totalItems } = useCart();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todas');
  const [selected, setSelected] = useState<DisplayProduct | null>(null);
  
  // Dynamic Scroll Container Refs
  const scrollRefs = useRef<Record<string, HTMLDivElement | null>>({});

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
    return ['Todas', ...Array.from(productCategorySet).sort(sortCategories)];
  }, [products]);

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
          <div className="space-y-1">
            <h2 className="font-tan text-2xl sm:text-4xl uppercase tracking-wider text-brand-yellow [-webkit-text-stroke:1.5px_#000] drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">
              {title}
            </h2>
            <p className="text-[10px] sm:text-xs font-black uppercase text-gray-400 tracking-widest font-maiandra">
              Desde Bs. {displayMinPrice} / Hora
            </p>
          </div>
          <button className="font-maiandra text-xs sm:text-sm text-gray-500 hover:text-brand-yellow hover:underline transition-all tracking-wide underline">
            Ver todo
          </button>
        </div>

        {/* Horizontal Slider Area */}
        <div className="relative group/slider">
          <div 
            ref={(el) => { scrollRefs.current[catKey] = el; }}
            className="flex overflow-x-auto gap-6 pb-6 pt-2 scrollbar-none snap-x snap-mandatory scroll-smooth px-1"
          >
            {productsList.map((p) => {
              const avail = getAvailableStock(p);
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
                          {p.name}
                        </h3>
                        <p className="text-xs font-sans text-gray-400 mt-1 line-clamp-2 leading-relaxed">
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
    <div className="pt-[80px] lg:pt-[120px] bg-[#FFFDF3] min-h-screen">
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
      {/* Filters & Search Row */}
      <div className="sticky top-[80px] lg:top-[120px] z-40 bg-background/90 backdrop-blur-md border-b border-gray-100/50 py-5 overflow-hidden">
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
              <div className="flex flex-1 min-w-0 gap-2 overflow-x-auto overflow-y-hidden py-1 px-1 scrollbar-none scroll-smooth">
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
