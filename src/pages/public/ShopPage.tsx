import { useState, useMemo, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ShoppingCart, MessageCircle, X, Plus, Minus, ChevronRight, Bike, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { useStore } from '@/context/StoreContext';
import { useCart } from '@/context/CartContext';

import { generateShopWhatsAppLink } from '@/lib/whatsapp';

const fadeUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 },
};

type ShopItem = {
    id: string;
    itemType: 'bike' | 'product' | 'accessory';
    name: string;
    category: string;
    price: number;
    description: string;
    image: string;
};

function sortShopCategories(a: string, b: string) {
    if (a === 'Bicicletas') return -1;
    if (b === 'Bicicletas') return 1;
    if (a === 'Accesorios') return 1;
    if (b === 'Accesorios') return -1;
    return a.localeCompare(b);
}

export default function ShopPage() {
    const { inventory, combos, addSale, addOrUpdateCustomer } = useStore();
    const { items: cartItems, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice } = useCart();

    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('Todas');
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
    const [showCart, setShowCart] = useState(false);
    const [checkoutStep, setCheckoutStep] = useState<'cart' | 'checkout'>('cart');

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

    const scrollRight = (catKey: string) => {
        const ref = scrollRefs.current[catKey];
        if (ref) {
            ref.scrollBy({ left: 320, behavior: 'smooth' });
        }
    };

    // Form state
    const [name, setName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [ci, setCi] = useState('');
    const [notes, setNotes] = useState('');

    const productItems: ShopItem[] = inventory
        .filter(i => i.availableForSale && i.active)
        .map(i => ({
            id: i.id,
            itemType: i.itemType,
            name: i.name,
            category: i.category || (i.itemType === 'bike' ? 'Bicicletas' : 'Accesorios'),
            price: i.salePrice ?? 0,
            description: i.description,
            image: i.imageUrl,
        }));

    const comboItems: ShopItem[] = combos
        .filter((c: any) => c.availableForSale && c.active)
        .map((c: any) => ({
            id: c.id,
            itemType: 'product' as any,
            name: c.name,
            category: c.category || 'Bicicletas',
            price: c.salePrice ?? 0,
            description: c.description,
            image: c.imageUrl,
        }));

    const allItems: ShopItem[] = [...productItems, ...comboItems];

    const productCategories = useMemo(() => {
        const categorySet = new Set<string>();
        allItems.forEach(item => {
            categorySet.add(item.category || (item.itemType === 'bike' ? 'Bicicletas' : 'Accesorios'));
        });
        return ['Todas', ...Array.from(categorySet).sort(sortShopCategories)];
    }, [allItems]);

    const filtered = useMemo(() => {
        return allItems.filter(item => {
            const q = search.toLowerCase();
            const matchSearch = item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
            if (category === 'Todas') return matchSearch;
            return item.category === category && matchSearch;
        });
    }, [allItems, category, search]);

    // Group products dynamically by their category field
    const productsByCategory = useMemo(() => {
        const groups: Record<string, ShopItem[]> = {};
        filtered.forEach(p => {
            const cat = p.category || (p.itemType === 'accessory' ? 'Accesorios' : 'Otros');
            if (!groups[cat]) {
                groups[cat] = [];
            }
            groups[cat].push(p);
        });
        return groups;
    }, [filtered]);

    const categoriesToRender = useMemo(() => {
        return Object.keys(productsByCategory).sort((a, b) => {
            return sortShopCategories(a, b);
        });
    }, [productsByCategory]);

    const expandedProducts = useMemo(() => {
        if (!expandedCategory) return [];
        return allItems.filter(item => {
            if (item.category !== expandedCategory) return false;
            const q = search.toLowerCase();
            return item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
        });
    }, [allItems, expandedCategory, search]);

    const openCategoryView = (catName: string) => {
        setExpandedCategory(catName);
        setCategory(catName);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const closeCategoryView = () => {
        setExpandedCategory(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCheckout = (e: React.FormEvent) => {
        e.preventDefault();

        const customerFullName = `${name} ${lastName}`.trim();

        addOrUpdateCustomer({ name: customerFullName, phone, ci }, true);

        const sale = {
            customerName: customerFullName,
            customerPhone: phone,
            customerCI: ci,
            items: cartItems.map(item => ({
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                image: item.image || '',
            })),
            total: totalPrice,
            paymentMethod: 'Por definir (WhatsApp)',
            notes
        };

        addSale(sale);

        const fullSaleRecord = { ...sale, id: 'temp', status: 'Pendiente', date: new Date().toISOString() };
        const link = generateShopWhatsAppLink(fullSaleRecord as any);
        window.open(link, '_blank');

        clearCart();
        setShowCart(false);
        setCheckoutStep('cart');
        setName('');
        setLastName('');
        setPhone('');
        setNotes('');
    };

    const renderCategorySlider = (
        title: string, 
        productsList: ShopItem[], 
        catKey: string
    ) => {
        if (productsList.length === 0) return null;

        return (
            <div className="relative py-10 border-b border-gray-100 last:border-b-0">
                {/* Category Header */}
                <div className="flex justify-between items-end mb-6">
                    <div className="space-y-3 sm:space-y-1">
                        <h2 
                            className="font-tan text-[0.77rem] xs:text-[0.875rem] sm:text-[1.85rem] sm:leading-[1.22] lg:text-[2.2rem] uppercase tracking-normal text-brand-yellow [-webkit-text-stroke:1px_#000] drop-shadow-[1.2px_1.2px_0_rgba(0,0,0,1)] whitespace-nowrap sm:whitespace-normal"
                        >
                            {title}
                        </h2>
                        <p className="text-[10px] sm:text-xs font-black uppercase text-gray-400 tracking-widest font-maiandra">
                            {productsList.length} {productsList.length === 1 ? 'Producto' : 'Productos'}
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
                        {productsList.map((item) => (
                            <motion.div 
                                key={item.id}
                                className="min-w-[270px] sm:min-w-[320px] max-w-[320px] snap-start flex-shrink-0"
                                whileHover={{ y: -6 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Card 
                                    className="bg-white border border-gray-100/80 rounded-[1.8rem] shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col overflow-hidden"
                                >
                                    {/* Image Container */}
                                    <div className="relative aspect-[4/3] bg-white overflow-hidden rounded-t-[1.8rem] flex items-center justify-center">
                                        {item.image ? (
                                            <img 
                                                src={item.image} 
                                                alt={item.name} 
                                                className="w-full h-full object-contain p-4" 
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-50">
                                                {item.itemType === 'bike' ? (
                                                    <Bike className="w-12 h-12 text-brand-yellow/30" />
                                                ) : (
                                                    <Wrench className="w-12 h-12 text-brand-yellow/30" />
                                                )}
                                            </div>
                                        )}
                                        
                                        <Badge className="absolute top-4 right-4 text-[9px] font-black uppercase px-2 py-1 border-0 bg-brand-yellow text-brand-black">
                                            {item.itemType === 'bike' ? 'Bicicleta' : 'Accesorio'}
                                        </Badge>
                                    </div>

                                    <CardContent className="p-5 flex-1 flex flex-col justify-between bg-white">
                                        <div>
                                            <h3 className="font-tangkiwood text-lg sm:text-xl text-brand-black leading-tight truncate">
                                                {item.name}
                                            </h3>
                                            <p className="text-xs font-sans text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                                                {item.description || 'Disponible para compra'}
                                            </p>
                                        </div>

                                        {/* Pricing and Buttons */}
                                        <div className="pt-4 border-t border-gray-50 mt-4">
                                            <div className="flex items-baseline gap-1 mb-4">
                                                <span className="text-xs font-bold text-gray-400">Bs.</span>
                                                <span className="font-tan text-2xl text-brand-black leading-none">
                                                    {item.price}
                                                </span>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-2">
                                                <Button 
                                                    className="h-10 bg-brand-yellow text-brand-black hover:bg-brand-yellow-light shadow-md hover:-translate-y-0.5 transition-all rounded-full border-0 font-black text-xs flex items-center justify-center gap-1"
                                                    onClick={() => addToCart({ id: item.id, name: item.name, price: item.price, itemType: item.itemType, image: item.image })}
                                                >
                                                    <ShoppingCart className="w-3.5 h-3.5" strokeWidth={2} /> Añadir
                                                </Button>
                                                <a 
                                                    href="https://wa.me/59177860277" 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="block"
                                                >
                                                    <Button 
                                                        variant="outline" 
                                                        className="w-full h-10 text-brand-charcoal border-gray-100 hover:border-brand-yellow hover:bg-brand-yellow/5 transition-all rounded-full font-black text-xs flex items-center justify-center gap-1"
                                                    >
                                                        <MessageCircle className="w-3.5 h-3.5" strokeWidth={2} /> Consultar
                                                    </Button>
                                                </a>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>

                    {/* Navigation right arrow */}
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

    const renderGridCard = (item: ShopItem) => (
        <Card key={item.id} className="bg-white border border-gray-100/80 rounded-[1.8rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col overflow-hidden">
            <div className="relative aspect-[4/3] bg-white overflow-hidden rounded-t-[1.8rem] flex items-center justify-center">
                {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-contain p-4" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50">
                        {item.itemType === 'bike' ? <Bike className="w-12 h-12 text-brand-yellow/30" /> : <Wrench className="w-12 h-12 text-brand-yellow/30" />}
                    </div>
                )}
                <Badge className="absolute top-4 right-4 text-[9px] font-black uppercase px-2 py-1 border-0 bg-brand-yellow text-brand-black">
                    {item.itemType === 'bike' ? 'Bicicleta' : 'Accesorio'}
                </Badge>
            </div>
            <CardContent className="p-5 flex-1 flex flex-col justify-between bg-white">
                <div>
                    <h3 className="font-tangkiwood text-lg sm:text-xl text-brand-black leading-tight">
                        {item.name}
                    </h3>
                    <p className="text-xs font-sans text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                        {item.description || 'Disponible para compra'}
                    </p>
                </div>
                <div className="pt-4 border-t border-gray-50 mt-4">
                    <div className="flex items-baseline gap-1 mb-4">
                        <span className="text-xs font-bold text-gray-400">Bs.</span>
                        <span className="font-tan text-2xl text-brand-black leading-none">{item.price}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            className="h-10 bg-brand-yellow text-brand-black hover:bg-brand-yellow-light shadow-md hover:-translate-y-0.5 transition-all rounded-full border-0 font-black text-xs flex items-center justify-center gap-1"
                            onClick={() => addToCart({ id: item.id, name: item.name, price: item.price, itemType: item.itemType, image: item.image })}
                        >
                            <ShoppingCart className="w-3.5 h-3.5" strokeWidth={2} /> AÃ±adir
                        </Button>
                        <a href="https://wa.me/59177860277" target="_blank" rel="noopener noreferrer" className="block">
                            <Button variant="outline" className="w-full h-10 text-brand-charcoal border-gray-100 hover:border-brand-yellow hover:bg-brand-yellow/5 transition-all rounded-full font-black text-xs flex items-center justify-center gap-1">
                                <MessageCircle className="w-3.5 h-3.5" strokeWidth={2} /> Consultar
                            </Button>
                        </a>
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="pt-[80px] lg:pt-[120px] bg-[#FFFDF3] min-h-screen flex flex-col">
            <div className="relative sm:sticky top-[80px] lg:top-[120px] z-40 bg-[#FFFDF3]/95 backdrop-blur-md border-b border-gray-100">
                <section className="pt-6 pb-6">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <motion.div {...fadeUp} className="max-w-4xl mx-auto relative z-30 mb-6">
                            <Card className="rounded-[2.5rem] shadow-2xl border-0 overflow-hidden bg-white">
                                <CardContent className="p-4 sm:p-2">
                                    <div className="flex flex-col sm:flex-row items-center gap-2">
                                        <div className="relative flex-1 w-full group">
                                            <div className="absolute left-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-focus-within:bg-brand-yellow/10 group-focus-within:text-brand-yellow transition-colors">
                                                <Search className="w-5 h-5" strokeWidth={1.5} />
                                            </div>
                                            <Input
                                                placeholder="Buscar repuestos, accesorios..."
                                                className="h-16 pl-18 border-0 bg-transparent text-lg focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-gray-400 font-medium"
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                            />
                                        </div>
                                        <div className="w-px h-10 bg-gray-100 hidden sm:block" />
                                        <div className="px-4 w-full sm:w-auto pb-4 sm:pb-0 flex flex-col sm:flex-row items-center gap-2">
                                            <Button variant="outline" className="relative group w-full sm:w-auto rounded-full h-12 px-6 border-gray-200 bg-white shadow-sm hover:border-brand-yellow hover:bg-brand-yellow/5 transition-all text-brand-charcoal font-bold" onClick={() => setShowCart(true)}>
                                                <ShoppingCart className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" strokeWidth={1.5} /> 
                                                Carrito
                                                {totalItems > 0 && <Badge className="absolute -top-1 -right-1 bg-brand-yellow text-brand-black font-black text-xs min-w-5 h-5 flex items-center justify-center p-0 rounded-full shadow-md animate-in zoom-in">{totalItems}</Badge>}
                                            </Button>
                                            <Button className="w-full sm:w-auto h-12 px-8 rounded-full bg-brand-yellow text-brand-black hover:bg-brand-yellow-light transition-all font-black text-base shadow-lg hover:shadow-xl hover:-translate-y-0.5 border-0">
                                                Buscar
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="briz-horizontal-slider flex gap-2 overflow-x-auto pb-2 sm:pb-0 w-full justify-start snap-x px-4 py-1 scroll-ps-4">
                            {productCategories.map(c => (
                                <Button key={c} variant={category === c ? 'default' : 'outline'} size="sm"
                                    className={`rounded-full px-6 h-10 font-bold tracking-wide shadow-sm whitespace-nowrap snap-start flex-shrink-0 transition-all ${category === c ? 'bg-brand-yellow text-brand-black border-brand-yellow shadow-[0_4px_14px_rgba(255,210,0,0.4)] scale-105' : 'bg-white text-gray-600 border-gray-200 hover:border-brand-charcoal hover:text-brand-charcoal hover:bg-gray-50'}`}
                                    onClick={() => {
                                        setExpandedCategory(null);
                                        setCategory(c);
                                    }}>{c}</Button>
                            ))}
                        </motion.div>
                    </div>
                </section>
            </div>

            {/* Product Sliders */}
            <section className="py-12 sm:py-16 min-h-[50vh] bg-background flex-1">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
                    {expandedCategory ? (
                        <div className="py-6">
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
                                        className="font-tan text-[0.875rem] xs:text-[1rem] sm:text-[2.2rem] sm:leading-[1.18] lg:text-[2.6rem] uppercase tracking-normal text-brand-yellow [-webkit-text-stroke:1.1px_#000] drop-shadow-[1.5px_1.5px_0_rgba(0,0,0,1)] whitespace-nowrap sm:whitespace-normal"
                                    >
                                        {expandedCategory}
                                    </h1>
                                    <p className="mt-3.5 sm:mt-2 text-[10px] sm:text-xs font-black uppercase text-gray-400 tracking-widest font-maiandra">
                                        {expandedProducts.length} {expandedProducts.length === 1 ? 'producto' : 'productos'}
                                    </p>
                                </div>
                            </div>
                            {expandedProducts.length === 0 ? (
                                <div className="rounded-3xl bg-white p-10 text-center text-gray-400 font-medium font-sans shadow-sm">
                                    No encontramos productos en esta categoría.
                                </div>
                            ) : (
                                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {expandedProducts.map(item => renderGridCard(item))}
                                </div>
                            )}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center flex items-center justify-center h-full py-24">
                            <p className="text-gray-500 font-medium text-lg">No encontramos productos que coincidan con tu búsqueda.</p>
                        </div>
                    ) : (
                        <div className="space-y-10">
                            {categoriesToRender.map(catName => (
                                <div key={catName}>
                                    {renderCategorySlider(catName, productsByCategory[catName], catName)}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Cart Modal */}
            <Dialog open={showCart} onOpenChange={(val) => { setShowCart(val); if (!val) setCheckoutStep('cart'); }}>
                <DialogContent className="max-w-2xl rounded-[2.5rem] border-0 shadow-2xl overflow-hidden p-0">
                    <div className="bg-brand-yellow p-8">
                        <DialogHeader>
                            <DialogTitle className="text-3xl font-black text-brand-black">
                                {checkoutStep === 'cart' ? 'Tu Carrito' : 'Detalles de Compra'}
                            </DialogTitle>
                            <p className="text-brand-black/70 font-medium">
                                {checkoutStep === 'cart' ? 'Revisa tus productos antes de finalizar.' : 'Completa tus datos para procesar el pedido.'}
                            </p>
                        </DialogHeader>
                    </div>
                    
                    <div className="p-8">
                        {cartItems.length === 0 ? (
                            <div className="text-center py-16 space-y-4">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                                    <ShoppingCart className="w-10 h-10 text-gray-300" strokeWidth={1.5} />
                                </div>
                                <p className="text-gray-400 font-bold text-lg uppercase tracking-widest">Tu carrito está vacío</p>
                                <Button onClick={() => setShowCart(false)} variant="outline" className="rounded-full border-gray-200 font-bold">Explorar Tienda</Button>
                            </div>
                        ) : (
                            checkoutStep === 'cart' ? (
                                <div className="space-y-6">
                                    <div className="max-h-[40vh] overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                                        {cartItems.map((item) => (
                                            <div key={item.id} className="flex gap-5 p-4 rounded-3xl bg-gray-50 border border-gray-100 group transition-all hover:bg-white hover:shadow-md hover:border-brand-yellow/30">
                                                <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shrink-0 border border-gray-100 shadow-sm overflow-hidden">
                                                    {item.image ? (
                                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-2xl">{item.itemType === 'bike' ? '🚲' : '🔧'}</span>
                                                    )}
                                                </div>
                                                <div className="flex-1 flex flex-col justify-between">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h4 className="font-extrabold text-brand-charcoal leading-tight">{item.name}</h4>
                                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{item.itemType}</p>
                                                        </div>
                                                        <button onClick={() => removeFromCart(item.id)} className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                                                            <X className="w-4 h-4" strokeWidth={2} />
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center justify-between mt-3">
                                                        <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-full px-3 py-1.5 shadow-sm">
                                                            <button onClick={() => updateQuantity(item.id, -1)} disabled={item.quantity <= 1} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-brand-charcoal disabled:opacity-30 transition-colors"><Minus className="w-3 h-3" strokeWidth={3} /></button>
                                                            <span className="text-sm font-black w-4 text-center">{item.quantity}</span>
                                                            <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-brand-charcoal transition-colors"><Plus className="w-3 h-3" strokeWidth={3} /></button>
                                                        </div>
                                                        <span className="font-black text-lg text-brand-charcoal">Bs. {item.price * item.quantity}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-6 border-t border-gray-100 space-y-6">
                                        <div className="flex justify-between items-center bg-brand-yellow/5 p-6 rounded-[2rem] border border-brand-yellow/10">
                                            <span className="font-bold text-brand-charcoal/60 uppercase tracking-widest text-xs">Total a Pagar</span>
                                            <span className="font-black text-4xl text-brand-charcoal">Bs. {totalPrice}</span>
                                        </div>
                                        <Button className="w-full h-16 bg-brand-yellow text-brand-black hover:bg-brand-yellow-light transition-all font-black text-lg rounded-full shadow-xl hover:shadow-brand-yellow/20 hover:-translate-y-1 border-0"
                                            onClick={() => setCheckoutStep('checkout')}>
                                            Proceder al Pago
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleCheckout} className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="font-bold text-xs uppercase tracking-widest text-gray-400 ml-1">Nombre</Label>
                                            <Input className="h-12 rounded-2xl border-gray-200 bg-gray-50/50" value={name} onChange={e => setName(e.target.value)} required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="font-bold text-xs uppercase tracking-widest text-gray-400 ml-1">Apellido</Label>
                                            <Input className="h-12 rounded-2xl border-gray-200 bg-gray-50/50" value={lastName} onChange={e => setLastName(e.target.value)} required />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="font-bold text-xs uppercase tracking-widest text-gray-400 ml-1">WhatsApp</Label>
                                            <Input className="h-12 rounded-2xl border-gray-200 bg-gray-50/50" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="+591..." />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="font-bold text-xs uppercase tracking-widest text-gray-400 ml-1">CI / Carnet</Label>
                                            <Input className="h-12 rounded-2xl border-gray-200 bg-gray-50/50" value={ci} onChange={e => setCi(e.target.value)} required />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="font-bold text-xs uppercase tracking-widest text-gray-400 ml-1">Notas (Opcional)</Label>
                                        <Textarea className="rounded-2xl border-gray-200 bg-gray-50/50 resize-none" value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Alguna instrucción especial..." />
                                    </div>

                                    <div className="flex gap-4 pt-4 border-t border-gray-50">
                                        <Button type="button" variant="outline" className="w-1/3 h-14 rounded-full font-bold border-gray-200" onClick={() => setCheckoutStep('cart')}>Atrás</Button>
                                        <Button type="submit" className="w-2/3 h-14 bg-green-500 hover:bg-green-600 text-white font-black text-lg rounded-full shadow-lg hover:shadow-green-500/20 hover:-translate-y-1 transition-all">
                                            <MessageCircle className="w-5 h-5 mr-3" strokeWidth={1.5} /> Enviar WhatsApp
                                        </Button>
                                    </div>
                                </form>
                            )
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
