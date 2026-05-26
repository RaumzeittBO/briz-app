import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Clock, Star, ShieldCheck, Check, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import type { Bike } from '@/context/StoreContext';
import { useStore } from '@/context/StoreContext';
import { useAuth } from '@/context/AuthContext';
import { generateRentalWhatsAppLink, generateGroupRentalWhatsAppLink } from '@/lib/whatsapp';

const categories = ['Todas', 'Urbana', 'Montaña', 'Ruta', 'Tándem', 'Familiar'];

const fadeUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 },
};

export default function RentalsPage() {
    const { bikes, accessories, addOrUpdateCustomer, addRental, updateBike } = useStore();
    const { isAuthenticated, isEditMode } = useAuth();

    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todas');
    const [selectedBike, setSelectedBike] = useState<Bike | null>(null);
    const [showReservation, setShowReservation] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [ci, setCi] = useState('');
    const [date, setDate] = useState('');
    const [pickupTime, setPickupTime] = useState('');
    const [duration, setDuration] = useState('1 hora');
    const [bikeQty, setBikeQty] = useState(1);
    const [notes, setNotes] = useState('');
    const [accepted, setAccepted] = useState(false);

    // Accessories Selection
    const [selectedAccessories, setSelectedAccessories] = useState<Record<string, number>>({});

    // Admin Edit State
    const [editBike, setEditBike] = useState<Bike | null>(null);

    const availableBikes = isAuthenticated ? bikes : bikes.filter(b => b.active !== false);
    const availableAccessories = accessories.filter(a => a.active !== false && ['rental', 'both'].includes(a.usageType));

    const filtered = availableBikes.filter(b => {
        const matchCat = selectedCategory === 'Todas' || b.category === selectedCategory;
        const matchSearch = b.name.toLowerCase().includes(search.toLowerCase()) || b.type.toLowerCase().includes(search.toLowerCase());
        return matchCat && matchSearch;
    });

    const toggleAccessory = (id: string) => {
        setSelectedAccessories(prev => {
            const next = { ...prev };
            if (next[id]) delete next[id];
            else next[id] = 1;
            return next;
        });
    };

    const updateAccQty = (e: React.MouseEvent, id: string, delta: number) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedAccessories(prev => {
            if (!prev[id]) return prev;
            const next = { ...prev };
            next[id] = Math.max(1, next[id] + delta);
            return next;
        });
    };

    const durationPrice = useMemo(() => {
        if (!selectedBike) return 0;
        let base = 0;
        if (duration.includes('hora')) {
            const hrs = parseInt(duration);
            if (hrs === 1) {
                base = selectedBike.pricePerHour;
            } else {
                base = selectedBike.pricePerHour + (selectedBike.priceExtraHour ?? selectedBike.pricePerHour) * (hrs - 1);
            }
        } else if (duration === '1 día') {
            base = selectedBike.pricePerDay;
        } else if (duration === '1 semana') {
            base = selectedBike.pricePerWeek;
        }
        return base * bikeQty;
    }, [selectedBike, duration, bikeQty]);

    const accPrice = useMemo(() => {
        let total = 0;
        Object.entries(selectedAccessories).forEach(([id, qty]) => {
            const a = availableAccessories.find(x => x.id === id);
            if (a) total += a.price * qty;
        });
        return total;
    }, [selectedAccessories, availableAccessories]);

    const total = durationPrice + accPrice;

    const handleConfirm = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBike || !accepted) return;

        const customerFullName = `${name} ${lastName}`.trim();
        addOrUpdateCustomer({ name: customerFullName, phone, ci }, false);

        if (bikeQty > 20) {
            // Group Reservation Route
            const groupData = {
                customerName: customerFullName,
                customerPhone: phone,
                customerCI: ci,
                bikeName: selectedBike.name,
                bikeQty,
                date,
                pickupTime,
                duration,
                notes
            };
            const link = generateGroupRentalWhatsAppLink(groupData);
            window.open(link, '_blank');
        } else {
            // Standard Reservation Route
            const rentalAccs = Object.entries(selectedAccessories).map(([id, qty]) => {
                const a = availableAccessories.find(x => x.id === id)!;
                return { id: a.id, name: a.name, price: a.price, quantity: qty };
            });

            const rental = {
                customerName: customerFullName,
                customerPhone: phone,
                customerCI: ci,
                bikeId: selectedBike.id,
                bikeSnapshot: {
                    name: selectedBike.name,
                    pricePerHour: selectedBike.pricePerHour,
                    pricePerDay: selectedBike.pricePerDay,
                    pricePerWeek: selectedBike.pricePerWeek,
                    image: selectedBike.image
                },
                duration,
                bikeQty, // Added bike quantity to rental record
                date,
                pickupTime,
                accessories: rentalAccs,
                total,
                notes
            };

            addRental(rental);

            const fullRental = { ...rental, id: 'temp', status: 'Pendiente', createdDate: new Date().toISOString() };
            const link = generateRentalWhatsAppLink(fullRental as any);
            window.open(link, '_blank');
        }

        setShowReservation(false);
        // Reset form
        setName(''); setLastName(''); setPhone(''); setCi(''); setDate(''); setPickupTime('');
        setDuration('1 hora'); setBikeQty(1); setNotes(''); setAccepted(false); setSelectedAccessories({});
    };

    const handleAdminSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (editBike) {
            updateBike(editBike.id, editBike);
            setEditBike(null);
        }
    };

    return (
        <div className="pt-20">
            {/* Hero */}
            <section className="bg-hero-gradient py-20 relative overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-brand-yellow/8 rounded-full blur-[100px]" />
                </div>
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        <h1 className="text-4xl sm:text-5xl font-bold text-white">
                            Alquila tu <span className="text-gradient-yellow">bicicleta ideal</span>
                        </h1>
                        <p className="text-white/60 max-w-xl mx-auto">Elige entre nuestra flota de bicicletas premium. Sin cuentas obligatorias, reserva fácil y rápida.</p>
                    </motion.div>
                </div>
            </section>

            {/* Filters + Grid */}
            <section className="py-16 bg-background">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Filters */}
                    <motion.div {...fadeUp} className="flex flex-col sm:flex-row gap-4 mb-10">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input placeholder="Buscar bicicleta..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {categories.map(c => (
                                <Button key={c} variant={selectedCategory === c ? 'default' : 'outline'} size="sm"
                                    className={selectedCategory === c ? 'bg-brand-yellow text-brand-black hover:bg-brand-yellow-light' : ''}
                                    onClick={() => setSelectedCategory(c)}>{c}</Button>
                            ))}
                        </div>
                    </motion.div>

                    {/* Bike Grid */}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filtered.map((bike, i) => (
                            <motion.div key={bike.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }} transition={{ delay: i * 0.05, duration: 0.4 }}>
                                <Card className="group hover:shadow-xl hover:shadow-brand-yellow/5 transition-all duration-300 hover:-translate-y-1 h-full flex flex-col relative">
                                    {isAuthenticated && isEditMode && (
                                        <Button size="icon" variant="secondary" className="absolute top-2 left-2 z-10 w-8 h-8 rounded-full shadow-lg opacity-100" onClick={(e) => { e.stopPropagation(); setEditBike(bike); }}>
                                            <span className="text-xs">✏️</span>
                                        </Button>
                                    )}
                                    <div className="relative h-48 bg-muted rounded-t-lg flex items-center justify-center overflow-hidden">
                                        {bike.image ? (
                                            <img src={bike.image} alt={bike.name} className="absolute inset-0 w-full h-full object-cover opacity-80" />
                                        ) : (
                                            <div className="text-center p-4">
                                                <div className="w-16 h-16 mx-auto rounded-xl bg-brand-yellow/10 flex items-center justify-center mb-2">
                                                    <span className="text-2xl">🚲</span>
                                                </div>
                                                <p className="text-xs text-muted-foreground">Foto de {bike.name}</p>
                                            </div>
                                        )}
                                        <Badge className={`absolute top-3 right-3 ${bike.available ? 'bg-green-500/20 text-green-600 border-green-500/30' : 'bg-red-500/20 text-red-600 border-red-500/30'}`}>
                                            {bike.available ? 'Disponible' : 'En uso'}
                                        </Badge>
                                    </div>
                                    <CardContent className="p-4 flex-1 flex flex-col">
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className="font-semibold text-sm group-hover:text-brand-yellow transition-colors">{bike.name}</h3>
                                                <Badge variant="outline" className="text-xs">{bike.wheelSize}</Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground mb-3">{bike.description}</p>
                                        </div>
                                        <div className="space-y-3 pt-3 border-t">
                                            <div className="grid grid-cols-3 gap-2 text-center min-h-[64px]">
                                                <div className="flex flex-col items-center justify-start">
                                                    <p className="text-xs text-muted-foreground">Hora</p>
                                                    <p className="font-bold text-sm text-brand-yellow">Bs. {bike.pricePerHour}</p>
                                                    {bike.priceExtraHour && (
                                                        <p className="text-[10px] text-muted-foreground leading-tight whitespace-nowrap">(+Bs.{bike.priceExtraHour} extra)</p>
                                                    )}
                                                </div>
                                                <div className="flex flex-col items-center justify-start"><p className="text-xs text-muted-foreground">Día</p><p className="font-bold text-sm">Bs. {bike.pricePerDay}</p></div>
                                                <div className="flex flex-col items-center justify-start"><p className="text-xs text-muted-foreground">Semana</p><p className="font-bold text-sm">Bs. {bike.pricePerWeek}</p></div>
                                            </div>
                                            <Button className="w-full bg-brand-yellow text-brand-black hover:bg-brand-yellow-light text-sm font-semibold"
                                                disabled={!bike.available || (bike.stock !== undefined && bike.stock <= 0)}
                                                onClick={() => { setSelectedBike(bike); setShowReservation(true); setBikeQty(1); }}>
                                                {bike.available && (bike.stock === undefined || bike.stock > 0) ? `Reservar Ahora (${bike.stock || 1} disp.)` : 'No Disponible'}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing summary */}
            <section className="py-16 bg-brand-black text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div {...fadeUp} className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-4">Tarifas <span className="text-gradient-yellow">claras y simples</span></h2>
                        <p className="text-white/60">Sin sorpresas. El casco y candado básico vienen incluidos.</p>
                    </motion.div>
                    <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
                        {[
                            { label: 'Por Hora', price: 'Desde Bs. 10', icon: Clock, desc: 'Paseo corto o trámites rápidos' },
                            { label: 'Por Día', price: 'Desde Bs. 35', icon: Star, desc: 'Explora la ciudad completa', featured: true },
                            { label: 'Por Semana', price: 'Desde Bs. 180', icon: ShieldCheck, desc: 'Mejor tarifa para estadías largas' },
                        ].map((plan, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                                <div className={`rounded-2xl p-6 text-center space-y-3 h-full ${plan.featured ? 'glass-yellow glow-yellow' : 'glass'}`}>
                                    <plan.icon className={`w-8 h-8 mx-auto ${plan.featured ? 'text-brand-yellow' : 'text-white/60'}`} />
                                    <h3 className="font-semibold text-lg">{plan.label}</h3>
                                    <p className="text-2xl font-bold text-brand-yellow">{plan.price}</p>
                                    <p className="text-sm text-white/50">{plan.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Reservation Modal w/ Setup Progress */}
            <Dialog open={showReservation} onOpenChange={setShowReservation}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-full">
                    <DialogHeader>
                        <DialogTitle className="text-xl">Reserva {bikeQty > 20 ? 'Grupal' : 'Rápida'} {selectedBike && `— ${selectedBike.name}`}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleConfirm} className="space-y-6">
                        {/* Section 1: Customer Details */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-sm text-brand-yellow border-b border-white/10 pb-2">1. Tus Datos</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div><Label>Nombre</Label><Input value={name} onChange={e => setName(e.target.value)} required /></div>
                                <div><Label>Apellido</Label><Input value={lastName} onChange={e => setLastName(e.target.value)} required /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><Label>Celular</Label><Input value={phone} onChange={e => setPhone(e.target.value)} required placeholder="+591..." /></div>
                                <div><Label>CI / Carnet</Label><Input value={ci} onChange={e => setCi(e.target.value)} required /></div>
                            </div>
                        </div>

                        {/* Section 2: Rental Details */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-sm text-brand-yellow border-b border-white/10 pb-2">2. Fechas y Horarios</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div><Label>Fecha de recojo</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} required /></div>
                                <div><Label>Hora de recojo</Label><Input type="time" value={pickupTime} onChange={e => setPickupTime(e.target.value)} required /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Duración del Alquiler</Label>
                                    <select value={duration} onChange={e => setDuration(e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring mt-1">
                                        <option>1 hora</option>
                                        <option>2 horas</option>
                                        <option>3 horas</option>
                                        <option>4 horas</option>
                                        <option>5 horas</option>
                                        <option>6 horas</option>
                                        <option>12 horas</option>
                                        <option>1 día</option>
                                        <option>1 semana</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <Label>Cantidad de Bicicletas</Label>
                                    <div className="flex items-center gap-2 bg-background border rounded-md px-2 h-10 mt-1">
                                        <button type="button" onClick={() => setBikeQty(Math.max(1, bikeQty - 1))} className="text-muted-foreground hover:text-foreground disabled:opacity-50"><Minus className="w-4 h-4" /></button>
                                        <span className="text-sm font-medium flex-1 text-center">{bikeQty}</span>
                                        <button type="button" onClick={() => setBikeQty(Math.min(selectedBike?.stock || 1, bikeQty + 1))} disabled={bikeQty >= (selectedBike?.stock || 1)} className="text-muted-foreground hover:text-foreground disabled:opacity-50"><Plus className="w-4 h-4" /></button>
                                    </div>
                                    {bikeQty > 20 && <p className="text-xs text-brand-yellow">Reserva grupal: te contactaremos para confirmar disponibilidad total.</p>}
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Accessories */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-sm text-brand-yellow border-b border-white/10 pb-2">3. Accesorios Extra</h3>
                            <div className="grid sm:grid-cols-2 gap-3">
                                {availableAccessories.map(acc => {
                                    const isSelected = !!selectedAccessories[acc.id];
                                    const qty = selectedAccessories[acc.id] || 0;
                                    return (
                                        <div key={acc.id} onClick={() => toggleAccessory(acc.id)}
                                            className={`p-3 border rounded-lg cursor-pointer transition flex items-center gap-3 ${isSelected ? 'border-brand-yellow bg-brand-yellow/5' : 'border-input hover:border-brand-yellow/50'}`}>
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'bg-brand-yellow border-brand-yellow text-brand-black' : 'border-muted-foreground'}`}>
                                                {isSelected && <Check className="w-3 h-3" />}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold leading-none mb-1">{acc.name}</p>
                                                <p className="text-xs text-brand-yellow">+ Bs. {acc.price}</p>
                                            </div>
                                            {isSelected && (
                                                <div className="flex items-center gap-2 bg-background border px-1.5 py-1 rounded">
                                                    <button onClick={(e) => updateAccQty(e, acc.id, -1)} disabled={qty <= 1} className="text-muted-foreground disabled:opacity-50"><Minus className="w-3 h-3" /></button>
                                                    <span className="text-xs font-medium w-3 text-center">{qty}</span>
                                                    <button onClick={(e) => updateAccQty(e, acc.id, 1)} className="text-muted-foreground"><Plus className="w-3 h-3" /></button>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                                {availableAccessories.length === 0 && <p className="text-sm text-muted-foreground">No hay accesorios extra configurados.</p>}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-bold text-sm text-brand-yellow border-b border-white/10 pb-2">4. Notas (Opcional)</h3>
                            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Alguna preferencia, ajuste de altura, pedal especial..." rows={2} />
                        </div>

                        <div className="bg-brand-yellow/10 border border-brand-yellow/30 rounded-lg p-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Alquiler {bikeQty}x bici(s) ({duration})</span>
                                <span>Bs. {durationPrice}</span>
                            </div>
                            {accPrice > 0 && (
                                <div className="flex justify-between text-sm text-white/70">
                                    <span>Accesorios extra</span>
                                    <span>Bs. {accPrice}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-bold text-lg pt-2 border-t border-brand-yellow/20 text-brand-yellow">
                                <span>Total Estimado</span>
                                <span>Bs. {total}</span>
                            </div>
                        </div>

                        <div className="flex items-start gap-2 pt-2">
                            <Checkbox id="terms" checked={accepted} onCheckedChange={(val: any) => setAccepted(Boolean(val))} required className="mt-1" />
                            <Label htmlFor="terms" className="text-xs leading-snug">Acepto la política de alquileres, asumo la responsabilidad y entiendo que se requerirá un depósito en garantía al recoger la bicicleta.</Label>
                        </div>

                        <Button type="submit" disabled={!accepted} className="w-full bg-brand-yellow text-brand-black hover:bg-brand-yellow-light font-bold h-12">
                            Aceptar y Enviar por WhatsApp
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Admin Edit Modal */}
            <Dialog open={!!editBike} onOpenChange={(open) => !open && setEditBike(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edición Rápida (Admin)</DialogTitle>
                    </DialogHeader>
                    {editBike && (
                        <form onSubmit={handleAdminSave} className="space-y-4">
                            <div className="space-y-1">
                                <Label>Nombre de la Bicicleta</Label>
                                <Input value={editBike.name} onChange={e => setEditBike({ ...editBike, name: e.target.value })} required />
                            </div>
                            <div className="space-y-1">
                                <Label>URL de Imagen</Label>
                                <Input value={editBike.image || ''} placeholder="https://..." onChange={e => setEditBike({ ...editBike, image: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1"><Label>Tarifa 1ra Hora</Label><Input type="number" min="0" value={editBike.pricePerHour} onChange={e => setEditBike({ ...editBike, pricePerHour: parseFloat(e.target.value) })} required /></div>
                                <div className="space-y-1"><Label>Tarifa Hr. Extra</Label><Input type="number" min="0" value={editBike.priceExtraHour || ''} onChange={e => setEditBike({ ...editBike, priceExtraHour: parseFloat(e.target.value) })} placeholder="Igual a 1ra hora" /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1"><Label>Tarifa Día</Label><Input type="number" min="0" value={editBike.pricePerDay} onChange={e => setEditBike({ ...editBike, pricePerDay: parseFloat(e.target.value) })} required /></div>
                                <div className="space-y-1"><Label>Tarifa Sem.</Label><Input type="number" min="0" value={editBike.pricePerWeek} onChange={e => setEditBike({ ...editBike, pricePerWeek: parseFloat(e.target.value) })} required /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1"><Label>Stock / Unidades</Label><Input type="number" min="0" value={editBike.stock ?? 1} onChange={e => setEditBike({ ...editBike, stock: parseInt(e.target.value, 10) })} required /></div>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox checked={editBike.available} onCheckedChange={v => setEditBike({ ...editBike, available: Boolean(v) })} id="editAvail" />
                                    <Label htmlFor="editAvail">Disponible</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox checked={editBike.active !== false} onCheckedChange={v => setEditBike({ ...editBike, active: Boolean(v) })} id="editAct" />
                                    <Label htmlFor="editAct">Visible Público</Label>
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
