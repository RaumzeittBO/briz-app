import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bike, CalendarDays, Clock, CreditCard, MapPin, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStore, type Rental } from '@/context/StoreContext';
import CustomerAuthModal from '@/components/layout/CustomerAuthModal';
import { useLanguage } from '@/context/LanguageContext';
import { t } from '@/lib/translations';

const statusLabelEs: Record<string, string> = {
    pending: 'Pendiente de confirmación',
    confirmed: 'Confirmado',
    delivered: 'En curso (Entregado)',
    returned: 'Devuelto',
    cancelled: 'Cancelado',
    expired: 'Expirado',
    Pendiente: 'Pendiente de confirmación',
    Confirmado: 'Confirmado',
    Entregado: 'En curso (Entregado)',
    Devuelto: 'Devuelto',
    Cancelado: 'Cancelado',
};

const statusLabelEn: Record<string, string> = {
    pending: 'Pending confirmation',
    confirmed: 'Confirmed',
    delivered: 'In progress (Delivered)',
    returned: 'Returned',
    cancelled: 'Cancelled',
    expired: 'Expired',
    Pendiente: 'Pending confirmation',
    Confirmado: 'Confirmed',
    Entregado: 'In progress (Delivered)',
    Devuelto: 'Returned',
    Cancelado: 'Cancelled',
};

const statusClass: Record<string, string> = {
    pending: 'bg-brand-yellow text-brand-black',
    confirmed: 'bg-emerald-100 text-emerald-700',
    delivered: 'bg-sky-100 text-sky-700',
    returned: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-700',
    expired: 'bg-gray-100 text-gray-700',
    Pendiente: 'bg-brand-yellow text-brand-black',
    Confirmado: 'bg-emerald-100 text-emerald-700',
    Entregado: 'bg-sky-100 text-sky-700',
    Devuelto: 'bg-blue-100 text-blue-700',
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
    const { language } = useLanguage();
    const [authOpen, setAuthOpen] = useState(false);

    const customerRentals = useMemo(() => {
        if (!currentCustomer) return [];
        return rentals.filter(rental =>
            rental.customerCI === currentCustomer.ci ||
            rental.customerPhone === currentCustomer.phone
        );
    }, [currentCustomer, rentals]);

    const rentalGroups = useMemo(() => groupRentals(customerRentals), [customerRentals]);
    const statusMap = language === 'es' ? statusLabelEs : statusLabelEn;

    if (!currentCustomer) {
        return (
            <main className="min-h-screen bg-[#FFFDF3] px-4 pb-20 pt-36">
                <section className="mx-auto max-w-3xl rounded-[2rem] border border-brand-yellow/30 bg-white p-8 text-center shadow-sm">
                    <User className="mx-auto h-14 w-14 text-brand-yellow-vibrant" />
                    <h1 className="mt-4 font-tangkiwood text-2xl sm:text-3xl uppercase tracking-wide text-brand-black">
                        {language === 'es' ? 'Mi perfil' : 'My Profile'}
                    </h1>
                    <p className="mt-3 text-sm font-bold leading-relaxed text-brand-charcoal/70">
                        {language === 'es'
                            ? 'Inicia sesión para ver tus alquileres, estados y detalles de reserva.'
                            : 'Sign in to view your rentals, booking status, and reservation details.'}
                    </p>
                    <Button onClick={() => setAuthOpen(true)} className="mt-6 h-12 rounded-full bg-brand-yellow px-8 font-black text-brand-black hover:bg-brand-yellow-light">
                        {language === 'es' ? 'Iniciar sesión' : 'Sign In'}
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
                                <p className="text-[10px] font-black uppercase tracking-widest text-brand-charcoal/40">
                                    {language === 'es' ? 'Cliente Briz' : 'Briz Customer'}
                                </p>
                                <h1 className="font-tangkiwood text-lg sm:text-xl md:text-2xl uppercase tracking-wide text-brand-black leading-tight break-words word-break-all">{currentCustomer.name}</h1>
                                <p className="text-sm font-bold text-brand-charcoal/60 break-all">
                                    {currentCustomer.phone} · {language === 'es' ? 'CI' : 'ID'} {currentCustomer.ci}
                                </p>
                            </div>
                        </div>
                        <Button asChild className="rounded-full bg-brand-yellow px-6 font-black text-brand-black hover:bg-brand-yellow-light">
                            <Link to="/rentals">{language === 'es' ? 'Reservar otra bicicleta' : 'Book another bicycle'}</Link>
                        </Button>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-end justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-brand-charcoal/40">
                                {language === 'es' ? 'Historial' : 'History'}
                            </p>
                            <h2 className="font-tangkiwood text-xl sm:text-2xl uppercase tracking-wide text-brand-black">
                                {language === 'es' ? 'Mis alquileres' : 'My Rentals'}
                            </h2>
                        </div>
                        <Badge className="rounded-full bg-brand-yellow px-3 py-1 text-brand-black">
                            {rentalGroups.length} {language === 'es' ? 'reservas' : 'bookings'}
                        </Badge>
                    </div>

                    {rentalGroups.length === 0 ? (
                        <div className="rounded-[2rem] border border-brand-yellow/20 bg-white p-10 text-center">
                            <Bike className="mx-auto h-12 w-12 text-brand-yellow-vibrant" />
                            <p className="mt-4 text-sm font-bold text-brand-charcoal/60">
                                {language === 'es' ? 'Aún no tienes alquileres registrados.' : 'You have no registered rentals yet.'}
                            </p>
                        </div>
                    ) : (
                        rentalGroups.map(group => (
                            <article key={group.code} className="rounded-[2rem] border border-brand-yellow/20 bg-white p-5 shadow-sm sm:p-6">
                                <div className="flex flex-col gap-3 border-b border-brand-yellow/15 pb-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-brand-charcoal/40">
                                            {language === 'es' ? 'Código' : 'Reservation Code'}
                                        </p>
                                        <h3 className="text-xl font-black text-brand-black notranslate" translate="no">{group.code}</h3>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <Badge className={`rounded-full px-3 py-1 ${statusClass[group.status] || statusClass.pending}`}>
                                            {statusMap[group.status] || group.status}
                                        </Badge>
                                        <Badge className="rounded-full bg-brand-charcoal/5 px-3 py-1 text-brand-charcoal">
                                            {group.paymentStatus === 'paid'
                                                ? (language === 'es' ? 'Pago confirmado' : 'Payment confirmed')
                                                : (language === 'es' ? 'Pago pendiente' : 'Payment pending')}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="grid gap-3 py-4 text-sm font-bold text-brand-charcoal/70 sm:grid-cols-3">
                                    <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-brand-yellow-vibrant" /> {group.items[0]?.date}</span>
                                    <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-brand-yellow-vibrant" /> {group.items[0]?.pickupTime} · {t(group.items[0]?.duration, language)}</span>
                                    <span className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-brand-yellow-vibrant" /> {group.paymentMethod} · Bs. {group.total.toFixed(2)}</span>
                                </div>

                                <div className="space-y-2">
                                    {group.items.map(item => (
                                        <div key={item.id} className="flex flex-col justify-between gap-2 rounded-2xl bg-[#FFF9D8] p-4 text-sm sm:flex-row sm:items-center">
                                            <div>
                                                <p className="font-black text-brand-black">
                                                    {item.quantity}x {t(item.productNameSnapshot || item.productName, language)}
                                                </p>
                                                <p className="text-xs font-bold text-brand-charcoal/55">
                                                    {item.selectedWheelSize
                                                        ? `${language === 'es' ? 'Aro' : 'Wheel Size'} ${item.selectedWheelSize} · `
                                                        : ''}
                                                    {t(item.duration, language)}
                                                </p>
                                            </div>
                                            <p className="font-black text-brand-black">Bs. {(item.total || 0).toFixed(2)}</p>
                                        </div>
                                    ))}
                                </div>

                                {group.items[0]?.mapsLink && (
                                    <a href={group.items[0].mapsLink} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-xs font-black uppercase text-brand-yellow-vibrant">
                                        <MapPin className="h-4 w-4" /> {language === 'es' ? 'Ver dirección registrada' : 'View registered address'}
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
