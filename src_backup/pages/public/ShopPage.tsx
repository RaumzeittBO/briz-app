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
import { Checkbox } from '@/components/ui/checkbox';
import { useStore } from '@/context/StoreContext';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { generateShopWhatsAppLink } from '@/lib/whatsapp';

type ShopItem = {
    id: string;
    itemType: 'bike' | 'product' | 'accessory';
    name: string;
    category: string;
    price: number;
    description: string;
    image: string;
};

const productCategories = ['Todos', 'Bicicletas', 'Cascos', 'Seguridad', 'Iluminación', 'Herramientas', 'Accesorios', 'Ropa', 'Repuestos'];

export default function ShopPage() {
    const { bikes, products, accessories, addSale, addOrUpdateCustomer, updateBike, updateProduct, updateAccessory } = useStore();
    const { items: cartItems, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice } = useCart();
    const { isAuthenticated, isEditMode } = useAuth();

    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('Todos');
    const [showCart, setShowCart] = useState(false);
    const [checkoutStep, setCheckoutStep] = useState<'cart' | 'checkout'>('cart');

    // Form state
    const [name, setName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [ci, setCi] = useState('');
    const [notes, setNotes] = useState('');

    const [editItem, setEditItem] = useState<ShopItem | null>(null);

    const saleableBikes: ShopItem[] = (isAuthenticated && isEditMode ? bikes.filter(b => b.saleable) : bikes.filter(b => b.saleable && b.active !== false)).map(b => ({ ...b, itemType: 'bike', price: b.salePrice || 0 }));
    const productItems: ShopItem[] = (isAuthenticated && isEditMode ? products : products.filter(p => p.active !== false)).map(p => ({ ...p, itemType: 'product' }));
    const accessoryItems: ShopItem[] = (isAuthenticated && isEditMode ? accessories.filter(a => ['shop', 'both'].includes(a.usageType)) : accessories.filter(a => a.active !== false && ['shop', 'both'].includes(a.usageType))).map(a => ({ ...a, itemType: 'accessory' }));

    const allItems: ShopItem[] = [...saleableBikes, ...productItems, ...accessoryItems];

    const filtered = allItems.filter(item => {
        const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
        if (category === 'Todos') return matchSearch;
        if (category === 'Bicicletas') return item.itemType === 'bike' && matchSearch;
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
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                itemType: item.itemType,
                image: item.image
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

    const handleAdminSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editItem) return;

        const payload: any = {
            name: editItem.name,
            description: editItem.description,
            image: editItem.image,
            active: (editItem as any).active,
            stock: (editItem as any).stock
        };

        if (editItem.itemType === 'bike') {
            payload.salePrice = editItem.price;
            updateBike(editItem.id, payload);
        } else if (editItem.itemType === 'product') {
            payload.price = editItem.price;
            updateProduct(editItem.id, payload);
        } else {
            payload.price = editItem.price;
            updateAccessory(editItem.id, payload);
        }
        setEditItem(null);
    };

    return (
        <div className="pt-20">
            {/* Hero */}
            <section className="bg-hero-gradient py-20 relative overflow-hidden">
                <div className="absolute inset-0"><div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-yellow/8 rounded-full blur-[100px]" /></div>
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        <h1 className="text-4xl sm:text-5xl font-bold text-white">Tienda <span className="text-gradient-yellow">Briz</span></h1>
                        <p className="text-white/60 max-w-xl mx-auto">Bicicletas, repuestos y accesorios. Todo lo que necesitas para rodar.</p>
                    </motion.div>
                </div>
            </section>

            {/* Shop */}
            <section className="py-16 bg-background">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-10">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input placeholder="Buscar productos..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {productCategories.map(c => (
                                <Button key={c} variant={category === c ? 'default' : 'outline'} size="sm"
                                    className={category === c ? 'bg-brand-yellow text-brand-black hover:bg-brand-yellow-light' : ''}
                                    onClick={() => setCategory(c)}>{c}</Button>
                            ))}
                        </div>
                        <Button variant="outline" className="relative" onClick={() => setShowCart(true)}>
                            <ShoppingCart className="w-4 h-4 mr-2" /> Carrito
                            {totalItems > 0 && <Badge className="absolute -top-2 -right-2 bg-brand-yellow text-brand-black text-xs w-5 h-5 flex items-center justify-center p-0">{totalItems}</Badge>}
                        </Button>
                    </div>

                    {/* Product Grid */}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filtered.map((item, i) => {
                            const itemCategory = item.itemType === 'bike' ? 'Bicicleta' : item.category;
                            return (
                                <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.03, duration: 0.4 }}>
                                    <Card className="group hover:shadow-lg hover:shadow-brand-yellow/5 transition-all duration-300 hover:-translate-y-1 h-full flex flex-col relative">
                                        {isAuthenticated && isEditMode && (
                                            <Button size="icon" variant="secondary" className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full shadow-lg opacity-100" onClick={(e) => { e.stopPropagation(); setEditItem({ ...item, active: (item as any).active ?? true, stock: (item as any).stock ?? 1 } as any); }}>
                                                <span className="text-xs">✏️</span>
                                            </Button>
                                        )}
                                        <div className="relative h-44 bg-muted rounded-t-lg flex items-center justify-center overflow-hidden">
                                            {item.image ? (
                                                <img src={item.image} alt={item.name} className="absolute inset-0 w-full h-full object-cover opacity-80" />
                                            ) : (
                                                <div className="text-center p-4">
                                                    <span className="text-3xl">{item.itemType === 'bike' ? '🚲' : '🔧'}</span>
                                                    <p className="text-xs text-muted-foreground mt-2">Foto de {item.name}</p>
                                                </div>
                                            )}
                                            <Badge variant="secondary" className="absolute top-3 left-3 text-xs">{itemCategory}</Badge>
                                        </div>
                                        <CardContent className="p-4 flex-1 flex flex-col">
                                            <h3 className="font-semibold text-sm mb-1 group-hover:text-brand-yellow transition-colors">{item.name}</h3>
                                            <p className="text-xs text-muted-foreground flex-1 mb-3">{item.description}</p>
                                            <div className="space-y-2 pt-3 border-t">
                                                <p className="text-xl font-bold text-brand-yellow">Bs. {item.price}</p>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <Button size="sm" className="bg-brand-yellow text-brand-black hover:bg-brand-yellow-light text-xs"
                                                        onClick={() => addToCart({ id: item.id, name: item.name, price: item.price, itemType: item.itemType, image: item.image })}>
                                                        <ShoppingCart className="w-3 h-3 mr-1" /> Agregar
                                                    </Button>
                                                    <a href="https://wa.me/59177860277" target="_blank" rel="noopener noreferrer">
                                                        <Button size="sm" variant="outline" className="w-full text-xs border-green-500/30 text-green-600 hover:bg-green-500/10">
                                                            <MessageCircle className="w-3 h-3 mr-1" /> Consulta
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

                    {filtered.length === 0 && <div className="text-center py-16 text-muted-foreground"><p>No se encontraron productos.</p></div>}
                </div>
            </section>

            {/* Cart Modal */}
            <Dialog open={showCart} onOpenChange={(val) => { setShowCart(val); if (!val) setCheckoutStep('cart'); }}>
                <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>{checkoutStep === 'cart' ? 'Tu Carrito' : 'Datos de Compra'}</DialogTitle></DialogHeader>
                    {cartItems.length === 0 ? (
                        <div className="text-center py-12">
                            <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                            <p className="text-muted-foreground">Tu carrito está vacío</p>
                        </div>
                    ) : (
                        checkoutStep === 'cart' ? (
                            <div className="space-y-4">
                                <div className="max-h-[50vh] overflow-y-auto space-y-3 pr-2">
                                    {cartItems.map((item) => (
                                        <div key={item.id} className="flex gap-4 p-3 border rounded-lg bg-muted/30">
                                            <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center shrink-0">
                                                <span className="text-xl">{item.itemType === 'bike' ? '🚲' : '🔧'}</span>
                                            </div>
                                            <div className="flex-1 flex flex-col justify-between">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-semibold text-sm leading-tight">{item.name}</h4>
                                                    <button onClick={() => removeFromCart(item.id)} className="text-muted-foreground hover:text-destructive">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div className="flex items-center justify-between mt-2">
                                                    <div className="flex items-center gap-2 bg-background border rounded-md px-2 py-1">
                                                        <button onClick={() => updateQuantity(item.id, -1)} disabled={item.quantity <= 1} className="text-muted-foreground hover:text-foreground disabled:opacity-50"><Minus className="w-3 h-3" /></button>
                                                        <span className="text-xs font-medium w-4 text-center">{item.quantity}</span>
                                                        <button onClick={() => updateQuantity(item.id, 1)} className="text-muted-foreground hover:text-foreground"><Plus className="w-3 h-3" /></button>
                                                    </div>
                                                    <span className="font-bold text-sm text-brand-yellow">Bs. {item.price * item.quantity}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t pt-4 space-y-4">
                                    <div className="flex justify-between items-center bg-muted/30 p-4 rounded-lg">
                                        <span className="font-medium text-lg">Total</span>
                                        <span className="font-bold text-2xl text-brand-yellow">Bs. {totalPrice}</span>
                                    </div>
                                    <Button className="w-full bg-brand-yellow text-brand-black hover:bg-brand-yellow-light font-bold text-lg h-12"
                                        onClick={() => setCheckoutStep('checkout')}>
                                        Proceder al Pago
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleCheckout} className="space-y-4">
                                <div className="bg-brand-yellow/10 p-4 rounded-lg border border-brand-yellow/20 mb-4">
                                    <div className="flex justify-between items-center text-sm font-medium mb-1">
                                        <span>Resumen del pedido</span>
                                        <span>{totalItems} items</span>
                                    </div>
                                    <div className="flex justify-between items-center font-bold text-brand-yellow text-lg">
                                        <span>Total a pagar</span>
                                        <span>Bs. {totalPrice}</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1"><Label>Nombre</Label><Input value={name} onChange={e => setName(e.target.value)} required /></div>
                                    <div className="space-y-1"><Label>Apellido</Label><Input value={lastName} onChange={e => setLastName(e.target.value)} required /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1"><Label>Celular (WhatsApp)</Label><Input value={phone} onChange={e => setPhone(e.target.value)} required placeholder="+591..." /></div>
                                    <div className="space-y-1"><Label>CI / Carnet</Label><Input value={ci} onChange={e => setCi(e.target.value)} required /></div>
                                </div>
                                <div className="space-y-1"><Label>Notas de envío / Pedido especial</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Opcional..." /></div>

                                <div className="flex gap-3 pt-4 border-t">
                                    <Button type="button" variant="outline" className="w-1/3" onClick={() => setCheckoutStep('cart')}>Volver</Button>
                                    <Button type="submit" className="w-2/3 bg-green-500 hover:bg-green-600 text-white font-bold h-10">
                                        <MessageCircle className="w-4 h-4 mr-2" /> Enviar por WhatsApp
                                    </Button>
                                </div>
                            </form>
                        )
                    )}
                </DialogContent>
            </Dialog>

            {/* Admin Edit Modal */}
            <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edición Rápida (Admin)</DialogTitle>
                    </DialogHeader>
                    {editItem && (
                        <form onSubmit={handleAdminSave} className="space-y-4">
                            <div className="space-y-1">
                                <Label>Nombre del Producto</Label>
                                <Input value={editItem.name} onChange={e => setEditItem({ ...editItem, name: e.target.value })} required />
                            </div>
                            <div className="space-y-1">
                                <Label>URL de Imagen</Label>
                                <Input value={editItem.image || ''} placeholder="https://..." onChange={e => setEditItem({ ...editItem, image: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1"><Label>Precio (Venta)</Label><Input type="number" min="0" value={editItem.price} onChange={e => setEditItem({ ...editItem, price: parseFloat(e.target.value) })} required /></div>
                                <div className="space-y-1"><Label>Stock / Unidades</Label><Input type="number" min="0" value={(editItem as any).stock ?? 1} onChange={e => setEditItem({ ...editItem, stock: parseInt(e.target.value, 10) } as any)} required /></div>
                            </div>
                            <div className="space-y-1">
                                <Label>Descripción</Label>
                                <Textarea value={editItem.description} onChange={e => setEditItem({ ...editItem, description: e.target.value })} rows={2} />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox checked={(editItem as any).active !== false} onCheckedChange={(v: any) => setEditItem({ ...editItem, active: Boolean(v) } as any)} id="editActShop" />
                                    <Label htmlFor="editActShop">Visible Público</Label>
                                </div>
                            </div>
                            <Button type="submit" className="w-full mt-4">Guardar Cambios</Button>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
