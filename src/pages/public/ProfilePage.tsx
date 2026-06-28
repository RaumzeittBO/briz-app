import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bike, CalendarDays, Clock, CreditCard, MapPin, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStore, type Rental } from '@/context/StoreContext';
import CustomerAuthModal from '@/components/layout/CustomerAuthModal';

const statusLabel: Record<string, string> = {
    pending: 'Pendiente de confirmación',
    confirmed: 'Confirmado',
    cancelled: 'Cancelado',
    expired: 'Expirado',
    Pendiente: 'Pendiente de confirmación',
    Confirmado: 'Confirmado',
    Cancelado: 'Cancelado',
};

const statusClass: Record<string, string> = {
    pending: 'bg-brand-yellow text-brand-black',
    confirmed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
    expired: 'bg-gray-100 text-gray-700',
    Pendiente: 'bg-brand-yellow text-brand-black',
    Confirmado: 'bg-emerald-100 text-emerald-700',
    Cancelado: 'bg-red-100 text-red-700',
};

function groupRentals(rentals: Rental[]) {
    const groups = new Map<string, Rental[]>();
    rentals.forEach(rental => {
        const code = rental.reservationCode || rental.id;
        groups.set(code, [...(groups.get(code) || []), rental]);
    });
    return Array.from(groups.entries()).map(([code, items]) => ({
        code,
        items,
        total: items.reduce((sum, item) => sum + (item.total || 0), 0),
        latest: Math.max(...items.map(item => new Date(item.createdAt || item.createdDate || item.date).getTime())),
        status: items[0]?.status || 'pending',
        paymentMethod: items[0]?.paymentMethod || 'No definido',
        paymentStatus: items[0]?.paymentStatus || 'unpaid',
    })).sort((a, b) => b.latest - a.latest);
}

export default function ProfilePage() {
    const { currentCustomer, rentals } = useStore();
    const [authOpen, setAuthOpen] = useState(false);

    const customerRentals = useMemo(() => {
        if (!currentCustomer) return [];
        return rentals.filter(rental =>
            rental.customerCI === currentCustomer.ci ||
            rental.customerPhone === currentCustomer.phone
        );
    }, [currentCustomer, rentals]);

    const rentalGroups = useMemo(() => groupRentals(customerRentals), [customerRentals]);

    if (!currentCustomer) {
        return (
            <main className="min-h-screen bg-[#FFFDF3] px-4 pb-20 pt-36">
                <section className="mx-auto max-w-3xl rounded-[2rem] border border-brand-yellow/30 bg-white p-8 text-center shadow-sm">
                    <User className="mx-auto h-14 w-14 text-brand-yellow-vibrant" />
                    <h1 className="mt-4 font-tan text-3xl uppercase text-brand-black">Mi perfil</h1>
                    <p className="mt-3 text-sm font-bold leading-relaxed text-brand-charcoal/70">
                        Inicia sesión para ver tus alquileres, estados y detalles de reserva.
                    </p>
                    <Button onClick={() => setAuthOpen(true)} className="mt-6 h-12 rounded-full bg-brand-yellow px-8 font-black text-brand-black hover:bg-brand-yellow-light">
                        Iniciar sesión
                    </Button>
                </section>
                <CustomerAuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#FFFDF3] px-4 pb-20 pt-36">
            <section className="mx-auto max-w-6xl space-y-8">
                <div className="rounded-[2rem] border border-brand-yellow/30 bg-white p-6 shadow-sm sm:p-8">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4 min-w-0 overflow-hidden flex-1">
                            <div className="h-20 w-20 overflow-hidden rounded-full border-4 border-brand-yellow bg-brand-yellow/10">
                                {currentCustomer.autofotoUrl ? (
                                    <img src={currentCustomer.autofotoUrl} alt={currentCustomer.name} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-2xl font-black text-brand-yellow-vibrant">
                                        {currentCustomer.name.slice(0, 2).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-brand-charcoal/40">Cliente Briz</p>
                                <h1 className="font-tan text-xl sm:text-2xl uppercase text-brand-black leading-tight break-words word-break-all">{currentCustomer.name}</h1>
                                <p className="text-sm font-bold text-brand-charcoal/60 break-all">{currentCustomer.phone} · CI {currentCustomer.ci}</p>
                            </div>
                        </div>
                        <Button asChild className="rounded-full bg-brand-yellow px-6 font-black text-brand-black hover:bg-brand-yellow-light">
                            <Link to="/rentals">Reservar otra bicicleta</Link>
                        </Button>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-end justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-brand-charcoal/40">Historial</p>
                            <h2 className="font-tan text-2xl uppercase text-brand-black">Mis alquileres</h2>
                        </div>
                        <Badge className="rounded-full bg-brand-yellow px-3 py-1 text-brand-black">{rentalGroups.length} reservas</Badge>
                    </div>

                    {rentalGroups.length === 0 ? (
                        <div className="rounded-[2rem] border border-brand-yellow/20 bg-white p-10 text-center">
                            <Bike className="mx-auto h-12 w-12 text-brand-yellow-vibrant" />
                            <p className="mt-4 text-sm font-bold text-brand-charcoal/60">Aún no tienes alquileres registrados.</p>
                        </div>
                    ) : (
                        rentalGroups.map(group => (
                            <article key={group.code} className="rounded-[2rem] border border-brand-yellow/20 bg-white p-5 shadow-sm sm:p-6">
                                <div className="flex flex-col gap-3 border-b border-brand-yellow/15 pb-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-brand-charcoal/40">Código</p>
                                        <h3 className="text-xl font-black text-brand-black">{group.code}</h3>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <Badge className={`rounded-full px-3 py-1 ${statusClass[group.status] || statusClass.pending}`}>
                                            {statusLabel[group.status] || group.status}
                                        </Badge>
                                        <Badge className="rounded-full bg-brand-charcoal/5 px-3 py-1 text-brand-charcoal">
                                            {group.paymentStatus === 'paid' ? 'Pago confirmado' : 'Pago pendiente'}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="grid gap-3 py-4 text-sm font-bold text-brand-charcoal/70 sm:grid-cols-3">
                                    <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-brand-yellow-vibrant" /> {group.items[0]?.date}</span>
                                    <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-brand-yellow-vibrant" /> {group.items[0]?.pickupTime} · {group.items[0]?.duration}</span>
                                    <span className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-brand-yellow-vibrant" /> {group.paymentMethod} · Bs. {group.total.toFixed(2)}</span>
                                </div>

                                <div className="space-y-2">
                                    {group.items.map(item => (
                                        <div key={item.id} className="flex flex-col justify-between gap-2 rounded-2xl bg-[#FFF9D8] p-4 text-sm sm:flex-row sm:items-center">
                                            <div>
                                                <p className="font-black text-brand-black">{item.quantity}x {item.productNameSnapshot || item.productName}</p>
                                                <p className="text-xs font-bold text-brand-charcoal/55">
                                                    {item.selectedWheelSize ? `Aro ${item.selectedWheelSize} · ` : ''}{item.duration}
                                                </p>
                                            </div>
                                            <p className="font-black text-brand-black">Bs. {(item.total || 0).toFixed(2)}</p>
                                        </div>
                                    ))}
                                </div>

                                {group.items[0]?.mapsLink && (
                                    <a href={group.items[0].mapsLink} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-xs font-black uppercase text-brand-yellow-vibrant">
                                        <MapPin className="h-4 w-4" /> Ver dirección registrada
                                    </a>
                                )}
                            </article>
                        ))
                    )}
                </div>
            </section>
        </main>
    );
}
