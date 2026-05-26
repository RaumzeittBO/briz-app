import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ShoppingCart, MessageCircle, X, Plus, Minus } from 'lucide-react';
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

const productCategories = ['Bicicletas', 'Accesorios', 'Todos'];

export default function ShopPage() {
    const { inventory, combos, addSale, addOrUpdateCustomer } = useStore();
    const { items: cartItems, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice } = useCart();

    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('Bicicletas');
    const [showCart, setShowCart] = useState(false);
    const [checkoutStep, setCheckoutStep] = useState<'cart' | 'checkout'>('cart');

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
            category: i.itemType === 'bike' ? 'Bicicletas' : 'Accesorios',
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
            category: 'Bicicletas',
            price: c.salePrice ?? 0,
            description: c.description,
            image: c.imageUrl,
        }));

    const allItems: ShopItem[] = [...productItems, ...comboItems];

    const filtered = allItems.filter(item => {
        const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
        if (category === 'Todos') return matchSearch;
        return item.category === category && matchSearch;
    });

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


    return (
        <div className="pt-20 bg-background min-h-screen flex flex-col">
            {/* Hero */}
            <section className="bg-brand-charcoal py-24 sm:py-32 relative overflow-hidden flex items-center min-h-[50vh]">
                <div className="absolute inset-0 pointer-events-none">
                    <img src="/hero-tienda-computadora.jpg" alt="" className="hidden sm:block w-full h-full object-cover" />
                    <img src="/hero-tienda-celular.jpg" alt="" className="block sm:hidden w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-brand-black/40 mix-blend-multiply" />
                    <div className="absolute inset-0 bg-gradient-to-b from-brand-black/60 via-brand-black/20 to-brand-charcoal" />
                </div>
                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center w-full">
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }} className="space-y-6">
                        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-tan text-white tracking-tight drop-shadow-sm leading-tight uppercase">
                            Tu equipo <span className="text-brand-yellow">perfecto.</span>
                        </h1>
                        <p className="text-xl sm:text-3xl text-white/70 max-w-2xl mx-auto font-cocon font-bold">
                            Bicicletas, equipo de seguridad y repuestos de alta calidad. Lo que necesitas para las calles.
                        </p>
                    </motion.div>
                </div>
            </section>

            <div className="sticky top-16 sm:top-[72px] z-40 bg-background/95 backdrop-blur-md border-b border-gray-100">
                <section className="pt-12 pb-8">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <motion.div {...fadeUp} className="max-w-4xl mx-auto -mt-20 sm:-mt-24 relative z-30 mb-8">
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
                                            <Button className="w-full sm:w-auto h-12 px-8 rounded-full bg-brand-charcoal text-white hover:bg-brand-yellow hover:text-brand-black transition-all font-black text-base shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                                                Buscar
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 w-full justify-center hide-scrollbar snap-x px-1 py-1">
                            {productCategories.map(c => (
                                <Button key={c} variant={category === c ? 'default' : 'outline'} size="sm"
                                    className={`rounded-full px-6 h-10 font-bold tracking-wide shadow-sm whitespace-nowrap snap-start flex-shrink-0 transition-all ${category === c ? 'bg-brand-yellow text-brand-black border-brand-yellow shadow-[0_4px_14px_rgba(255,210,0,0.4)] scale-105' : 'bg-white text-gray-600 border-gray-200 hover:border-brand-charcoal hover:text-brand-charcoal hover:bg-gray-50'}`}
                                    onClick={() => setCategory(c)}>{c}</Button>
                            ))}
                        </motion.div>
                    </div>
                </section>
            </div>

            {/* Product Grid */}
            <section className="py-12 sm:py-16 min-h-[50vh] bg-gray-50/50 flex-1">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
                    {filtered.length === 0 ? (
                        <div className="text-center flex items-center justify-center h-full py-24">
                            <p className="text-gray-500 font-medium text-lg">No encontramos productos que coincidan con tu búsqueda.</p>
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8 pb-12">                            {filtered.map((item, i) => {
                                const itemCategory = item.itemType === 'bike' ? 'Bicicleta' : item.category;
                                return (
                                    <motion.div 
                                        key={item.id} 
                                        initial={{ opacity: 0, y: 30 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: (i % 8) * 0.05, duration: 0.5 }}
                                        className="h-full"
                                    >
                                        <Card className="group bg-white border border-gray-100 rounded-[2rem] shadow-sm hover:shadow-[0_16px_40px_rgba(255,210,0,0.18)] hover:border-brand-yellow/30 transition-all duration-300 h-full flex flex-col relative overflow-hidden hover:-translate-y-1">
                                            <div className="relative h-[260px] bg-gray-50 flex items-center justify-center overflow-hidden">
                                                {item.image ? (
                                                    <img src={item.image} alt={item.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 opacity-90 group-hover:opacity-100" />
                                                ) : (
                                                    <div className="text-center p-4">
                                                        <div className="w-20 h-20 mx-auto rounded-3xl bg-white shadow-sm flex items-center justify-center mb-3 group-hover:shadow-md transition-all group-hover:scale-110 duration-500">
                                                            <span className="text-3xl">{item.itemType === 'bike' ? '🚲' : '🔧'}</span>
                                                        </div>
                                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Briz Quality</p>
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                                                
                                                <Badge className="absolute top-6 right-6 text-[10px] font-black px-4 py-2 bg-white/90 backdrop-blur-md text-brand-charcoal shadow-lg border-0 uppercase tracking-widest rounded-full">
                                                    {itemCategory}
                                                </Badge>
                                            </div>
                                            <CardContent className="p-8 flex-1 flex flex-col z-10 bg-white">
                                                <div className="flex-1 mb-6">
                                                    <h3 className="font-black text-xl sm:text-2xl text-brand-charcoal group-hover:text-brand-yellow transition-colors leading-tight mb-3 pr-2 line-clamp-2">{item.name}</h3>
                                                    <p className="text-sm text-gray-500 font-medium leading-relaxed line-clamp-2 opacity-80">{item.description}</p>
                                                </div>
                                                <div className="space-y-6 pt-6 border-t border-gray-50 mt-auto">
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-sm font-bold text-gray-400">Bs.</span>
                                                        <p className="font-black text-3xl text-brand-charcoal">{item.price}</p>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <Button className="h-14 bg-brand-charcoal text-white hover:bg-brand-yellow hover:text-brand-black shadow-xl hover:shadow-brand-yellow/20 hover:-translate-y-1 transition-all rounded-full border-0 font-black text-sm"
                                                            onClick={() => addToCart({ id: item.id, name: item.name, price: item.price, itemType: item.itemType, image: item.image })}>
                                                            <ShoppingCart className="w-4 h-4 mr-2" strokeWidth={1.5} /> Añadir
                                                        </Button>
                                                        <a href="https://wa.me/59177860277" target="_blank" rel="noopener noreferrer" className="block">
                                                            <Button variant="outline" className="w-full h-14 text-brand-charcoal border-gray-100 hover:border-brand-yellow hover:bg-brand-yellow/5 transition-all rounded-full font-black text-sm">
                                                                <MessageCircle className="w-4 h-4 mr-2" strokeWidth={1.5} /> Consultar
                              </Button>
                            </a>
                          </div>
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

            {/* Cart Modal */}
            <Dialog open={showCart} onOpenChange={(val) => { setShowCart(val); if (!val) setCheckoutStep('cart'); }}>
                <DialogContent className="max-w-2xl rounded-[2.5rem] border-0 shadow-2xl overflow-hidden p-0">
                    <div className="bg-brand-charcoal p-8">
                        <DialogHeader>
                            <DialogTitle className="text-3xl font-black text-white">
                                {checkoutStep === 'cart' ? 'Tu Carrito' : 'Detalles de Compra'}
                            </DialogTitle>
                            <p className="text-white/60 font-medium">
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
                                        <Button className="w-full h-16 bg-brand-charcoal text-white hover:bg-brand-yellow hover:text-brand-black transition-all font-black text-lg rounded-full shadow-xl hover:shadow-brand-yellow/20 hover:-translate-y-1"
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
