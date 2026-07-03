import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Sale } from '@/context/StoreContext';
import { useStore } from '@/context/StoreContext';
import { Trash2, ShoppingBag, Receipt, PackageOpen, Plus, Search, ChevronRight, Printer } from 'lucide-react';
import { db } from '@/lib/firebase';
import { writeBatch, doc } from 'firebase/firestore';

const statusColors: Record<string, string> = {
    'Completado': 'bg-green-500/15 text-green-600 border-0',
    'Pendiente': 'bg-yellow-500/15 text-yellow-600 border-0',
    'Cancelado': 'bg-red-500/15 text-red-600 border-0',
};

export default function AdminSalesPage() {
    const { sales, updateSaleStatus, deleteSale, inventory, shopCategories } = useStore();

    // Modal State
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

    // Manual Sale Wizard States
    const [newSaleModalOpen, setNewSaleModalOpen] = useState(false);
    const [newSaleStep, setNewSaleStep] = useState<1 | 2 | 3>(1);
    const [newSaleCart, setNewSaleCart] = useState<Array<{ product: any; quantity: number }>>([]);
    const [newSaleForm, setNewSaleForm] = useState({
        customerName: '',
        customerNIT: '',
        paymentMethod: 'efectivo' as 'efectivo' | 'qr',
    });
    const [wizardSearch, setWizardSearch] = useState('');
    const [wizardCategory, setWizardCategory] = useState('all');
    const [completedSaleData, setCompletedSaleData] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    const addToCart = (product: any) => {
        setNewSaleCart(prev => {
            const existing = prev.find(item => item.product.id === product.id);
            if (existing) {
                return prev.map(item => 
                    item.product.id === product.id 
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { product, quantity: 1 }];
        });
    };

    const updateCartQuantity = (productId: string, delta: number) => {
        setNewSaleCart(prev => {
            return prev.map(item => {
                if (item.product.id === productId) {
                    const newQty = Math.max(1, item.quantity + delta);
                    return { ...item, quantity: newQty };
                }
                return item;
            });
        });
    };

    const removeFromCart = (productId: string) => {
        setNewSaleCart(prev => prev.filter(item => item.product.id !== productId));
    };

    const cartTotal = newSaleCart.reduce((acc, item) => acc + (item.product.salePrice || 0) * item.quantity, 0);

    // Helper: get total available stock for an item (handles bikes with wheelSizes)
    const getItemStock = (item: any): number => {
        if (item.hasWheelSizes && Array.isArray(item.wheelSizes)) {
            return item.wheelSizes.reduce((sum: number, ws: any) => sum + (ws.stock || 0), 0);
        }
        return item.stock ?? 0;
    };

    const availableForSaleProducts = (inventory || []).filter(item => {
        if (!item.active || !item.availableForSale) return false;
        
        // Category Filter
        if (wizardCategory !== 'all' && item.category !== wizardCategory) return false;

        // Search text Filter
        if (wizardSearch.trim().length > 0) {
            const query = wizardSearch.toLowerCase();
            return item.name.toLowerCase().includes(query) || (item.description || '').toLowerCase().includes(query);
        }

        return true;
    });

    const handleSaveSale = async () => {
        if (newSaleCart.length === 0) return;
        setIsSaving(true);
        try {
            const batch = writeBatch(db);
            const saleId = 'sale_' + Math.random().toString(36).substring(2, 9);
            const saleDocRef = doc(db, 'sales', saleId);

            const saleItems = newSaleCart.map(c => ({
                id: c.product.id,
                name: c.product.name,
                price: c.product.salePrice || 0,
                quantity: c.quantity,
                type: c.product.itemType || 'accessory'
            }));

            // 1. Write the sale document directly as Completed
            const salePayload = {
                id: saleId,
                customerName: newSaleForm.customerName.trim() || 'Cliente General',
                customerPhone: 'N/A',
                customerCI: newSaleForm.customerNIT.trim() || 'N/A',
                items: saleItems,
                total: cartTotal,
                status: 'Completado',
                paymentMethod: newSaleForm.paymentMethod,
                source: 'manual',
                date: new Date().toISOString()
            };

            batch.set(saleDocRef, salePayload);

            // 2. Decrement inventory stock (handle bikes with wheelSizes)
            newSaleCart.forEach(c => {
                const itemDocRef = doc(db, 'inventory', c.product.id);
                if (c.product.hasWheelSizes && Array.isArray(c.product.wheelSizes)) {
                    // Distribute decrement proportionally across wheelSizes (largest first)
                    let remaining = c.quantity;
                    const updatedWheelSizes = [...c.product.wheelSizes].map((ws: any) => ({ ...ws }));
                    // Sort by stock descending to take from most-stocked size first
                    updatedWheelSizes.sort((a: any, b: any) => (b.stock || 0) - (a.stock || 0));
                    for (const ws of updatedWheelSizes) {
                        if (remaining <= 0) break;
                        const take = Math.min(remaining, ws.stock || 0);
                        ws.stock = (ws.stock || 0) - take;
                        remaining -= take;
                    }
                    batch.update(itemDocRef, { wheelSizes: updatedWheelSizes });
                } else {
                    const currentStock = c.product.stock ?? 0;
                    batch.update(itemDocRef, {
                        stock: Math.max(0, currentStock - c.quantity)
                    });
                }
            });

            await batch.commit();

            // Store completed data to show receipt first
            setCompletedSaleData(salePayload);
            setNewSaleStep(3); // Advance to final receipt print page
            
            // Clean cart
            setNewSaleCart([]);
        } catch (error: any) {
            console.error('Error saving manual sale:', error);
            alert('No se pudo registrar la venta: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    // RENDER STEP 1: Select products for sale
    const renderWizardStep1 = () => {
        return (
            <div className="flex flex-col lg:flex-row gap-6 min-h-[50vh] max-h-[70vh]">
                {/* Products List Panel */}
                <div className="flex-1 flex flex-col space-y-4 min-w-0">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-white/30" />
                            <Input
                                placeholder="Buscar repuestos o accesorios por nombre..."
                                value={wizardSearch}
                                onChange={e => setWizardSearch(e.target.value)}
                                className="pl-9 bg-black/35 border-white/10 h-10 rounded-xl text-xs font-bold text-white focus-visible:ring-brand-yellow"
                            />
                        </div>
                        <select
                            value={wizardCategory}
                            onChange={e => setWizardCategory(e.target.value)}
                            className="bg-black/35 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:border-brand-yellow outline-none shrink-0"
                        >
                            <option value="all" className="bg-brand-charcoal text-white">Todas las Categorías</option>
                            {(shopCategories || []).map((cat: string) => (
                                <option key={cat} value={cat} className="bg-brand-charcoal text-white">{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4">
                        {availableForSaleProducts.map(item => {
                            const imgUrl = item.imageUrl || '/images/placeholder_bike.png';
                            const stock = getItemStock(item);
                            const isOutOfStock = stock <= 0;

                            return (
                                <div key={item.id} className="bg-black/20 border border-white/5 rounded-2xl p-4 flex flex-col justify-between hover:border-brand-yellow/30 transition-all">
                                    <div className="space-y-2">
                                        <span className="text-[9px] font-black uppercase text-brand-yellow tracking-widest">{item.category || 'Tienda'}</span>
                                        <div className="aspect-[4/3] rounded-xl overflow-hidden bg-black/35 relative">
                                            <img src={imgUrl} alt={item.name} className="w-full h-full object-cover" />
                                            {isOutOfStock && (
                                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                    <span className="text-red-500 text-xs font-black uppercase tracking-wider">Agotado</span>
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-white">{item.name}</h4>
                                            <p className="text-[10px] text-white/40 mt-0.5 line-clamp-2">{item.description}</p>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-white/5 space-y-3">
                                        <div className="flex justify-between items-center text-[10px] font-bold text-white/50">
                                            <span>Stock disponible:</span>
                                            <span className={stock > 0 ? 'text-green-400' : 'text-red-400'}>{stock} uds.</span>
                                        </div>
                                        
                                        <div className="flex justify-between items-center pt-1">
                                            <span className="text-sm font-black text-brand-yellow">Bs. {item.salePrice || 0}</span>
                                            <Button
                                                type="button"
                                                size="sm"
                                                disabled={isOutOfStock}
                                                onClick={() => addToCart(item)}
                                                className="h-8 rounded-lg bg-brand-yellow hover:bg-brand-yellow-light text-brand-black font-black text-[10px] uppercase px-3 cursor-pointer"
                                            >
                                                <Plus className="w-3.5 h-3.5 mr-1" strokeWidth={3} /> Agregar
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {availableForSaleProducts.length === 0 && (
                            <div className="col-span-2 text-center py-12 text-white/30 text-xs italic">
                                No se encontraron productos disponibles para venta en tienda.
                            </div>
                        )}
                    </div>
                </div>

                {/* Cart sidebar Panel */}
                <div className="w-full lg:w-80 bg-black/25 border border-white/5 rounded-2xl p-4 flex flex-col justify-between shrink-0">
                    <div className="flex flex-col flex-1 min-h-0">
                        <h3 className="text-xs font-black uppercase tracking-widest text-brand-yellow pb-3 border-b border-white/5 flex items-center gap-2">
                            <span>🛒 Carrito de Ventas</span>
                            <Badge className="bg-brand-yellow text-brand-black border-0 text-[10px] font-black">{newSaleCart.length}</Badge>
                        </h3>

                        <div className="flex-1 overflow-y-auto space-y-3 py-3 pr-1">
                            {newSaleCart.map(item => (
                                <div key={item.product.id} className="bg-white/[0.02] border border-white/5 p-3 rounded-xl flex gap-3 justify-between items-center">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-bold text-white truncate">{item.product.name}</p>
                                        <p className="text-[10px] text-white/40 font-bold mt-0.5">Bs. {item.product.salePrice || 0} c/u</p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1.5 bg-black/40 rounded-lg p-1 border border-white/5 shrink-0">
                                            <button 
                                                type="button" 
                                                onClick={() => updateCartQuantity(item.product.id, -1)}
                                                className="w-5 h-5 rounded hover:bg-white/10 text-white flex items-center justify-center cursor-pointer text-xs font-bold"
                                            >
                                                -
                                            </button>
                                            <span className="text-xs text-white font-black w-4 text-center">{item.quantity}</span>
                                            <button 
                                                type="button" 
                                                onClick={() => updateCartQuantity(item.product.id, 1)}
                                                disabled={item.quantity >= getItemStock(item.product)}
                                                className="w-5 h-5 rounded hover:bg-white/10 text-white flex items-center justify-center cursor-pointer text-xs font-bold disabled:opacity-30"
                                            >
                                                +
                                            </button>
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={() => removeFromCart(item.product.id)}
                                            className="text-red-400 hover:text-red-500 hover:bg-red-500/10 p-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {newSaleCart.length === 0 && (
                                <div className="text-center py-20 text-white/20 text-xs italic">
                                    El carrito está vacío. Agregue repuestos o accesorios para vender.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-3 border-t border-white/5 space-y-4 shrink-0">
                        <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-white/40 uppercase">Total Venta:</span>
                            <span className="font-black text-lg text-brand-yellow">Bs. {cartTotal.toFixed(2)}</span>
                        </div>
                        <Button
                            type="button"
                            disabled={newSaleCart.length === 0}
                            onClick={() => setNewSaleStep(2)}
                            className="w-full bg-brand-yellow hover:bg-brand-yellow-light text-brand-black font-black uppercase text-xs tracking-wider h-11 rounded-xl cursor-pointer flex items-center justify-center gap-1"
                        >
                            Siguiente Paso <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    // RENDER STEP 2: Customer details and payment options
    const renderWizardStep2 = () => {
        return (
            <div className="space-y-6 min-h-[40vh] max-w-xl mx-auto py-4">
                <div className="bg-black/25 border border-white/5 p-6 rounded-2xl space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-brand-yellow border-b border-white/5 pb-2">
                        Información del Cliente y Pago
                    </h3>

                    <div className="space-y-2">
                        <Label className="text-white/70 text-xs font-bold uppercase tracking-wider">Nombre del Cliente (Opcional)</Label>
                        <Input
                            value={newSaleForm.customerName}
                            onChange={e => setNewSaleForm({ ...newSaleForm, customerName: e.target.value })}
                            placeholder="Ej. Juan Pérez (Dejar en blanco para Cliente General)"
                            className="bg-black/45 border-white/10 h-11 text-sm font-semibold text-white focus-visible:ring-brand-yellow"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-white/70 text-xs font-bold uppercase tracking-wider">NIT / CI (Opcional)</Label>
                        <Input
                            value={newSaleForm.customerNIT}
                            onChange={e => setNewSaleForm({ ...newSaleForm, customerNIT: e.target.value })}
                            placeholder="Ej. 12345678"
                            className="bg-black/45 border-white/10 h-11 text-sm font-semibold text-white focus-visible:ring-brand-yellow"
                        />
                    </div>

                    <div className="space-y-2 pt-2">
                        <Label className="text-white/70 text-xs font-bold uppercase tracking-wider block mb-2">Método de Pago</Label>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { id: 'efectivo', label: '💸 Efectivo' },
                                { id: 'qr', label: '📱 QR Digital / Transf.' }
                            ].map(method => (
                                <button
                                    key={method.id}
                                    type="button"
                                    onClick={() => setNewSaleForm({ ...newSaleForm, paymentMethod: method.id as any })}
                                    className={`py-3 rounded-xl border font-bold text-xs uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                        newSaleForm.paymentMethod === method.id
                                            ? 'bg-brand-yellow text-brand-black border-brand-yellow font-black shadow-md'
                                            : 'bg-black/40 border-white/10 text-white/60 hover:bg-black/60 hover:text-white'
                                    }`}
                                >
                                    {method.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-[#1A1A1A] border border-white/5 p-5 rounded-2xl flex justify-between items-center">
                    <div>
                        <span className="text-[10px] text-white/30 font-black uppercase block tracking-wider">Total de Artículos ({newSaleCart.reduce((s, c) => s + c.quantity, 0)} uds.)</span>
                        <span className="text-xs text-white/60 font-semibold block mt-0.5">Método de pago seleccionado: {newSaleForm.paymentMethod === 'efectivo' ? 'Efectivo' : 'QR Digital'}</span>
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] text-white/30 font-black uppercase block tracking-wider">Total Venta</span>
                        <span className="text-2xl font-black text-brand-yellow">Bs. {cartTotal.toFixed(2)}</span>
                    </div>
                </div>

                <div className="flex gap-4 pt-2">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setNewSaleStep(1)}
                        className="hover:bg-white/5 h-12 px-6 uppercase text-xs font-bold"
                    >
                        Volver a Productos
                    </Button>
                    <Button
                        type="button"
                        disabled={isSaving}
                        onClick={handleSaveSale}
                        className="flex-1 bg-brand-yellow hover:bg-brand-yellow-light text-brand-black font-black uppercase text-xs tracking-wider h-12 rounded-xl cursor-pointer"
                    >
                        {isSaving ? 'Registrando...' : 'Registrar y Generar Recibo'}
                    </Button>
                </div>
            </div>
        );
    };

    // RENDER STEP 3: Virtual Receipt & Print Screen
    const renderWizardStep3 = () => {
        if (!completedSaleData) return null;
        const sale = completedSaleData;

        return (
            <div className="space-y-6 max-w-xl mx-auto py-4">
                <div 
                    id="manual-sale-receipt-print"
                    className="bg-white text-brand-black p-6 rounded-2xl border border-gray-200 shadow-inner flex flex-col justify-between font-mono text-xs space-y-4"
                    style={{ color: '#111', fontFamily: 'monospace' }}
                >
                    <div className="text-center space-y-1 pb-3 border-b border-dashed border-gray-300">
                        <h2 className="text-xl font-black tracking-widest text-black">BRIZ</h2>
                        <p className="text-[10px] text-gray-500 font-bold uppercase">Recibo de Venta Oficial</p>
                        <p className="text-[9px] text-gray-400">Tel: +591 77860277</p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="font-bold text-gray-500">VENTA ID:</span>
                            <span className="font-bold text-black uppercase">{sale.id}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-bold text-gray-500">FECHA:</span>
                            <span className="font-bold text-black">{new Date(sale.date).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-bold text-gray-500">TIPO:</span>
                            <span className="font-bold text-black">VENTA EN TIENDA</span>
                        </div>
                    </div>

                    <div className="pt-3 border-t border-dashed border-gray-300 space-y-1">
                        <div>
                            <span className="font-bold text-gray-500 block text-[9px] uppercase tracking-wider">Cliente:</span>
                            <span className="font-black text-sm text-black">{sale.customerName}</span>
                        </div>
                        {sale.customerCI && sale.customerCI !== 'N/A' && (
                            <div>
                                <span className="font-bold text-gray-500 block text-[9px] uppercase tracking-wider">NIT/CI:</span>
                                <span className="font-bold text-black">{sale.customerCI}</span>
                            </div>
                        )}
                    </div>

                    <div className="pt-3 border-t border-dashed border-gray-300">
                        <span className="font-bold text-gray-500 block text-[9px] uppercase tracking-wider mb-2">Artículos:</span>
                        <div className="space-y-2">
                            {sale.items.map((item: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-start text-[11px]">
                                    <div className="pr-4">
                                        <p className="font-bold text-black">{item.name}</p>
                                        <p className="text-[10px] text-gray-500">{item.quantity} x Bs. {item.price.toFixed(2)}</p>
                                    </div>
                                    <span className="font-bold text-black shrink-0">Bs. {(item.quantity * item.price).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 border-t-2 border-double border-gray-300 flex justify-between items-center">
                        <span className="font-black text-sm text-black">TOTAL PAGADO</span>
                        <span className="font-black text-lg text-black">Bs. {(sale.total || 0).toFixed(2)}</span>
                    </div>

                    <div className="text-center pt-4 border-t border-dashed border-gray-300">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Método de pago: {sale.paymentMethod === 'efectivo' ? 'Efectivo' : 'QR / Transferencia'}</p>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mt-2">¡Muchas gracias por su compra!</p>
                        <p className="text-[8px] text-gray-300 mt-0.5">BRIZ - Movilidad y Comunidad</p>
                    </div>
                </div>

                {/* Printable receipt custom style */}
                <style>{`
                    @media print {
                        body * {
                            visibility: hidden !important;
                        }
                        #manual-sale-receipt-print, #manual-sale-receipt-print * {
                            visibility: visible !important;
                        }
                        #manual-sale-receipt-print {
                            position: absolute !important;
                            left: 0 !important;
                            top: 0 !important;
                            width: 100% !important;
                            border: none !important;
                            box-shadow: none !important;
                            padding: 0 !important;
                            margin: 0 !important;
                        }
                    }
                `}</style>

                <div className="flex gap-4 pt-2">
                    <Button
                        type="button"
                        onClick={() => window.print()}
                        className="bg-white/10 hover:bg-white/20 text-white font-bold h-12 text-xs uppercase px-6 flex items-center gap-1.5 cursor-pointer border border-white/10"
                    >
                        <Printer className="w-4 h-4" /> Imprimir Recibo
                    </Button>

                    <Button
                        type="button"
                        onClick={() => {
                            setNewSaleModalOpen(false);
                            setNewSaleStep(1);
                            setCompletedSaleData(null);
                        }}
                        className="flex-1 bg-brand-yellow hover:bg-brand-yellow-light text-brand-black font-black uppercase text-xs tracking-wider h-12 rounded-xl cursor-pointer"
                    >
                        Finalizar y Cerrar
                    </Button>
                </div>
            </div>
        );
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar esta venta? El stock de los artículos será restaurado.')) return;
        try {
            // Find the sale to restore stock
            const sale = sales.find(s => s.id === id);
            if (sale && sale.items && sale.items.length > 0) {
                const batch = writeBatch(db);
                for (const saleItem of sale.items) {
                    if (!saleItem.id) continue;
                    const invItem = (inventory || []).find((inv: any) => inv.id === saleItem.id);
                    if (!invItem) continue;
                    const itemDocRef = doc(db, 'inventory', saleItem.id);
                    if (invItem.hasWheelSizes && Array.isArray(invItem.wheelSizes)) {
                        // Restore stock to wheelSizes proportionally (largest stock first)
                        let remaining = saleItem.quantity;
                        const updatedWheelSizes = invItem.wheelSizes.map((ws: any) => ({ ...ws }));
                        updatedWheelSizes.sort((a: any, b: any) => (b.stock || 0) - (a.stock || 0));
                        for (const ws of updatedWheelSizes) {
                            if (remaining <= 0) break;
                            ws.stock = (ws.stock || 0) + remaining;
                            remaining = 0;
                        }
                        batch.update(itemDocRef, { wheelSizes: updatedWheelSizes });
                    } else {
                        const currentStock = invItem.stock ?? 0;
                        batch.update(itemDocRef, { stock: currentStock + saleItem.quantity });
                    }
                }
                // Delete the sale
                batch.delete(doc(db, 'sales', id));
                await batch.commit();
            } else {
                // No items to restore, just delete
                await deleteSale(id);
            }
            if (selectedSale?.id === id) setSelectedSale(null);
        } catch (error: any) {
            console.error('Error al eliminar venta:', error);
            alert('No se pudo eliminar la venta: ' + error.message);
        }
    };

    const handleStatusChange = (sale: Sale, newStatus: string) => {
        updateSaleStatus(sale.id, newStatus as any);
    };

    return (
        <div className="space-y-8 pb-20">
            <div className="flex items-end justify-between border-b border-white/10 pb-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-white flex items-center gap-3 tracking-tight">
                        <div className="p-2 bg-brand-yellow/10 rounded-xl">
                            <ShoppingBag className="w-8 h-8 text-brand-yellow" strokeWidth={2.5} />
                        </div>
                        Ventas y Pedidos
                    </h1>
                    <p className="text-white/50 text-lg font-medium">Registros de compras, transacciones e ingresos en tienda.</p>
                </div>
                <Button
                    onClick={() => {
                        setNewSaleCart([]);
                        setNewSaleStep(1);
                        setCompletedSaleData(null);
                        setNewSaleModalOpen(true);
                    }}
                    className="bg-white text-brand-black hover:bg-brand-yellow font-bold h-12 px-8 rounded-full shadow-lg transition-all hover:scale-105 cursor-pointer"
                >
                    <Plus className="w-5 h-5 mr-2" strokeWidth={3} /> Nueva Venta
                </Button>
            </div>

            <Card className="bg-[#1A1A1A] border-white/5 rounded-[1.5rem] overflow-hidden shadow-xl">
                <CardContent className="p-0">
                    <div className="overflow-x-auto min-h-[50vh]">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-white/5 bg-white/[0.02] hover:bg-white/[0.02]">
                                    <TableHead className="text-white/40 font-bold uppercase text-[10px] tracking-wider py-5 pl-6">Fecha</TableHead>
                                    <TableHead className="text-white/40 font-bold uppercase text-[10px] tracking-wider py-5">Cliente</TableHead>
                                    <TableHead className="text-white/40 font-bold uppercase text-[10px] tracking-wider py-5">Resumen</TableHead>
                                    <TableHead className="text-white/40 font-bold uppercase text-[10px] tracking-wider py-5">Total</TableHead>
                                    <TableHead className="text-white/40 font-bold uppercase text-[10px] tracking-wider py-5">Estado</TableHead>
                                    <TableHead className="text-white/40 font-bold uppercase text-[10px] tracking-wider py-5 text-right pr-6">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sales.map(s => (
                                    <TableRow key={s.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                                        <TableCell className="text-white/50 font-medium text-sm py-4 pl-6 whitespace-nowrap">{new Date(s.date).toLocaleDateString()}</TableCell>
                                        <TableCell className="py-4">
                                            <p className="text-white font-bold text-base">{s.customerName}</p>
                                        </TableCell>
                                        <TableCell className="py-4 font-medium flex items-center gap-2 text-white/80">
                                            <div className="w-8 h-8 rounded bg-brand-yellow/10 flex items-center justify-center shrink-0">
                                                <PackageOpen className="w-4 h-4 text-brand-yellow" />
                                            </div>
                                            <span className="text-white/90">{s.items.length} item(s)</span>
                                        </TableCell>
                                        <TableCell className="py-4"><Badge variant="outline" className="border-brand-yellow/30 text-brand-yellow font-black text-sm bg-brand-yellow/10 rounded-md py-1">Bs. {s.total}</Badge></TableCell>
                                        <TableCell className="py-4">
                                            <select
                                                value={s.status}
                                                onChange={(e) => handleStatusChange(s, e.target.value)}
                                                className={`text-xs px-4 py-2 flex items-center justify-between rounded-full outline-none appearance-none cursor-pointer font-bold transition-all border border-transparent hover:border-white/20 shadow-sm ${statusColors[s.status]}`}
                                                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', paddingRight: '2rem' }}
                                            >
                                                <option value="Pendiente">Pendiente</option>
                                                <option value="Completado">Completado</option>
                                                <option value="Cancelado">Cancelado</option>
                                            </select>
                                        </TableCell>
                                        <TableCell className="text-right py-4 pr-6">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="sm" className="h-9 px-4 rounded-full text-white hover:text-brand-charcoal hover:bg-white font-bold transition-all shadow-sm" onClick={() => setSelectedSale(s)}>Recibo</Button>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-red-400/80 hover:text-white hover:bg-red-500 transition-all shadow-sm" onClick={() => handleDelete(s.id)}><Trash2 className="w-4 h-4" /></Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {sales.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-20 text-white/50">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                                                    <ShoppingBag className="w-8 h-8 text-brand-yellow/50" />
                                                </div>
                                                <p className="text-xl font-bold text-white mb-1">Sin Ventas</p>
                                                <p className="font-medium text-white/40">No hay ventas registradas aún en el sistema.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={!!selectedSale} onOpenChange={(val) => { if (!val) setSelectedSale(null) }}>
                <DialogContent className="max-w-2xl bg-brand-charcoal border border-white/10 text-white">
                    <DialogHeader className="border-b border-white/10 pb-4 mb-2">
                        <DialogTitle className="text-2xl flex items-center gap-2">
                            <Receipt className="w-6 h-6 text-brand-yellow" />
                            Recibo de Venta
                        </DialogTitle>
                    </DialogHeader>
                    {selectedSale && (
                        <div className="space-y-6 pt-2">
                            <div className="grid grid-cols-2 gap-4 text-sm bg-black/20 p-5 rounded-xl border border-white/5">
                                <div className="space-y-1">
                                    <p className="text-brand-yellow text-xs uppercase tracking-wider font-bold mb-2">Cliente</p>
                                    <p className="font-bold text-lg text-white">{selectedSale.customerName}</p>
                                    <p className="text-white/70 flex items-center gap-2">📱 {selectedSale.customerPhone}</p>
                                    <p className="text-white/70 flex items-center gap-2">🪪 CI: {selectedSale.customerCI}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-brand-yellow text-xs uppercase tracking-wider font-bold mb-2">Información del Pedido</p>
                                    <p className="text-white/70 mt-1 mb-2">Fecha: {new Date(selectedSale.date).toLocaleString()}</p>
                                    <Badge className={`${statusColors[selectedSale.status]} px-3 py-1 font-bold`}>{selectedSale.status}</Badge>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-bold text-white/80 uppercase tracking-wider mb-3">Artículos Comprados</h3>
                                <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
                                    {selectedSale.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center bg-black/20 p-4 rounded-xl border border-white/5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center text-brand-yellow/80">
                                                    <span className="text-xl">🛒</span>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white text-base">{item.name}</p>
                                                    <p className="text-xs text-white/50">{item.quantity} x Bs. {item.price} c/u</p>
                                                </div>
                                            </div>
                                            <div className="font-bold text-white/90 text-lg">
                                                Bs. {item.quantity * item.price}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {selectedSale.notes && (
                                <div className="bg-brand-yellow/5 p-4 rounded-xl border border-brand-yellow/20 text-sm">
                                    <p className="text-brand-yellow font-bold text-xs uppercase tracking-wider mb-1">Notas del cliente</p>
                                    <p className="text-white/90 italic">"{selectedSale.notes}"</p>
                                </div>
                            )}

                            <div className="flex justify-between items-end pt-6 border-t border-white/10 mt-4">
                                <span className="font-bold text-white/50 uppercase tracking-wider text-sm">Total del Pedido</span>
                                <span className="font-bold text-4xl text-brand-yellow">Bs. {selectedSale.total}</span>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Manual Sales Creator Dialog */}
            <Dialog open={newSaleModalOpen} onOpenChange={(open) => {
                if (newSaleStep === 3) return;
                setNewSaleModalOpen(open);
            }}>
                <DialogContent className="max-w-5xl bg-brand-charcoal border-white/10 text-white rounded-3xl p-6 font-sans select-none overflow-y-auto max-h-[90vh]">
                    <DialogHeader className="border-b border-white/10 pb-4 mb-4">
                        <DialogTitle className="text-2xl font-black text-white flex items-center gap-2">
                            <ShoppingBag className="w-6 h-6 text-brand-yellow" />
                            Nueva Venta Manual (Tienda)
                        </DialogTitle>
                    </DialogHeader>

                    {/* Progress Indicator */}
                    {newSaleStep !== 3 && (
                        <div className="grid grid-cols-2 gap-2 mb-6">
                            {[
                                { step: 1, label: '1. Selección de Artículos' },
                                { step: 2, label: '2. Pago y Cliente' }
                            ].map(s => (
                                <div
                                    key={s.step}
                                    className={`py-2 text-center rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${
                                        newSaleStep === s.step
                                            ? 'bg-brand-yellow text-brand-black border-brand-yellow shadow-[0_4px_15px_rgba(255,210,0,0.15)]'
                                            : 'bg-black/20 text-white/40 border-white/5'
                                    }`}
                                >
                                    {s.label}
                                </div>
                            ))}
                        </div>
                    )}

                    {newSaleStep === 1 && renderWizardStep1()}
                    {newSaleStep === 2 && renderWizardStep2()}
                    {newSaleStep === 3 && renderWizardStep3()}
                </DialogContent>
            </Dialog>
        </div>
    );
}
