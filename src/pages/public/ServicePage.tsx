import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Wrench, CheckCircle, Clock, Shield, Star, XCircle, ShoppingCart, Trash2, Plus, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useStore } from '@/context/StoreContext';
import { useLanguage } from '@/context/LanguageContext';
import ArtworkBackground from '@/components/ArtworkBackground';
import ArtworkPicture from '@/components/ArtworkPicture';

const fadeUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 },
};

const maintenancePlans = [
    {
        name: 'Plan 1',
        title: 'Regulado general',
        price: '50 - 70',
        ideal: 'Ideal para bicicletas con componentes en buen estado que requieren regulado para su buen funcionamiento.',
        includes: [
            'Diagnóstico rápido externo',
            'Ajuste de ejes',
            'Regulado de frenos',
            'Regulado de caja de cambios',
            'Ajuste de sillín',
            'Otros ajustes menores',
        ],
        excludes: ['Reparaciones', 'Desarme de componentes', 'Sustitución de piezas', 'Repuestos'],
    },
    {
        name: 'Plan 2',
        title: 'Mantenimiento general profundo',
        price: '190 - 250',
        ideal: 'Bicicletas de gama baja a media que necesitan una revisión completa y mantenimiento integral.',
        includes: [
            'Diagnóstico mecánico general',
            'Desmontaje integral de componentes principales',
            'Limpieza técnica completa del cuadro y componentes',
            'Mantenimiento, limpieza, engrase y ajuste del buje delantero',
            'Mantenimiento, limpieza, engrase y ajuste del buje trasero',
            'Mantenimiento, limpieza, engrase y ajuste de la caja pedalera / eje central',
            'Mantenimiento, limpieza, engrase y ajuste del juego de dirección',
            'Revisión, mantenimiento y ajuste de frenos delanteros y traseros',
            'Revisión y lubricación de cables y fundas',
            'Ajuste y regulación del cambio trasero',
            'Ajuste y regulación del desviador delantero (si aplica)',
            'Limpieza y mantenimiento de transmisión: cadena, piñón, platos y bielas',
            'Centrado básico de ruedas',
            'Revisión de tensión de radios',
            'Ajuste general de tornillería',
            'Instalación de repuestos necesarios',
            'Ajustes menores complementarios',
            'Prueba final de funcionamiento y seguridad',
        ],
        excludes: ['Mantenimiento de horquilla', 'Mantenimiento de frenos hidráulicos', 'Líquido de frenos', 'Repuestos'],
        featured: true,
    },
    {
        name: 'Plan 3',
        title: 'Mantenimiento gama alta',
        price: '300',
        ideal: 'Bicicletas de alta gama, MTB avanzadas, bicicletas de ruta y bicicletas con componentes premium.',
        includes: [
            'Diagnóstico mecánico general',
            'Desmontaje integral de componentes principales',
            'Limpieza técnica completa del cuadro y componentes',
            'Mantenimiento, limpieza, engrase y ajuste del buje delantero',
            'Mantenimiento, limpieza, engrase y ajuste del buje trasero',
            'Mantenimiento, limpieza, engrase y ajuste de la caja pedalera / eje central',
            'Mantenimiento, limpieza, engrase y ajuste del juego de dirección',
            'Revisión, mantenimiento y ajuste de frenos delanteros y traseros',
            'Revisión y lubricación de cables y fundas',
            'Ajuste y regulación del cambio trasero',
            'Ajuste y regulación del desviador delantero (si aplica)',
            'Limpieza y mantenimiento de transmisión: cadena, piñón, platos y bielas',
            'Centrado básico de ruedas',
            'Revisión de tensión de radios',
            'Ajuste general de tornillería',
            'Instalación de repuestos necesarios',
            'Ajustes menores complementarios',
            'Prueba final de funcionamiento y seguridad',
        ],
        excludes: ['Mantenimiento de horquilla', 'Mantenimiento de frenos hidráulicos', 'Líquido de frenos', 'Repuestos'],
    },
];

const extraServices = [
    ['Diagnóstico externo', '10 Bs'],
    ['Blindaje antipinchazo (ambas llantas)', '150 Bs'],
    ['Instalación de líquido autosellante', '130 Bs'],
    ['Mantenimiento horquilla básica', '50 - 80 Bs'],
    ['Mantenimiento horquilla gama alta sin aire', '100 Bs'],
    ['Mantenimiento horquilla gama alta con aire', '250 Bs'],
    ['Mantenimiento frenos hidráulicos completo', '70 - 90 Bs'],
    ['Mantenimiento frenos hidráulicos (aumento de líquido)', '40 - 60 Bs'],
    ['Inflado de llantas', '1,5 - 2 Bs por llanta'],
    ['Regulado de frenos', '10 - 15 Bs'],
];

const popularServices = [
    maintenancePlans[0],
    maintenancePlans[1],
    {
        name: 'Servicio 3',
        title: 'Blindaje antipinchazo',
        price: '150',
        ideal: 'Protección para ambas llantas, ideal para reducir pinchazos durante tus recorridos.',
        includes: ['Aplicación de blindaje antipinchazo en ambas llantas'],
        excludes: ['Reparación de llantas dañadas', 'Cámaras o cubiertas nuevas'],
    },
];

type QuoteItem = { id: string; name: string; price: string };

function priceRange(price: string) {
    const values = [...price.replace(',', '.').matchAll(/\d+(?:\.\d+)?/g)].map(match => Number(match[0]));
    return { min: values[0] || 0, max: values[1] || values[0] || 0 };
}

export default function ServicePage() {
    const [selectedPlanIndex, setSelectedPlanIndex] = useState(0);
    const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
    const [request, setRequest] = useState({ name: '', phone: '', bikeType: '', issue: '', date: '' });
    const [bikeImageUrl, setBikeImageUrl] = useState('');
    const [isSending, setIsSending] = useState(false);
    const { addServiceOrder } = useStore();
    const { language } = useLanguage();
    const selectedPlan = popularServices[selectedPlanIndex];
    const quoteTotal = quoteItems.reduce((total, item) => {
        const range = priceRange(item.price);
        return { min: total.min + range.min, max: total.max + range.max };
    }, { min: 0, max: 0 });
    const addToQuote = (item: QuoteItem) => setQuoteItems(current => current.some(entry => entry.id === item.id) ? current : [...current, item]);
    const removeFromQuote = (id: string) => setQuoteItems(current => current.filter(item => item.id !== id));
    const quoteLink = `https://wa.me/59177860277?text=${encodeURIComponent(`Hola Briz, deseo una cotización mecánica.\n\nServicios:\n${quoteItems.map(item => `- ${item.name}: Bs. ${item.price}`).join('\n')}\n\nTotal estimado: Bs. ${quoteTotal.min}${quoteTotal.max !== quoteTotal.min ? ` - ${quoteTotal.max}` : ''}`)}`;

    const handleBikeImage = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { alert('Selecciona una imagen de la bicicleta.'); event.target.value = ''; return; }
        const reader = new FileReader();
        reader.onload = () => {
            const image = new Image();
            image.onload = () => {
                const maxSide = 900;
                const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
                const canvas = document.createElement('canvas');
                canvas.width = Math.max(1, Math.round(image.width * scale));
                canvas.height = Math.max(1, Math.round(image.height * scale));
                const context = canvas.getContext('2d');
                if (!context) return;
                context.drawImage(image, 0, 0, canvas.width, canvas.height);
                setBikeImageUrl(canvas.toDataURL('image/jpeg', 0.78));
            };
            image.src = String(reader.result || '');
        };
        reader.readAsDataURL(file);
    };

    const handleRequest = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSending(true);
        try {
            await addServiceOrder({
                customer: request.name, phone: request.phone, bikeType: request.bikeType, issue: request.issue,
                status: 'Recibido', estimatedDelivery: request.date || new Date().toISOString().slice(0, 10),
                costEstimate: 0, notes: quoteItems.length ? `Servicios solicitados: ${quoteItems.map(item => item.name).join(', ')}` : '',
                bikeImageUrl: bikeImageUrl || undefined,
            });
            setRequest({ name: '', phone: '', bikeType: '', issue: '', date: '' });
            setBikeImageUrl(''); setQuoteItems([]);
            alert('Solicitud enviada. Te contactaremos para confirmar tu turno.');
        } catch (error) {
            console.error('Error al agendar servicio:', error);
            alert('No pudimos enviar la solicitud. Intenta nuevamente.');
        } finally { setIsSending(false); }
    };

    return (
        <div className="pt-[64px] lg:pt-[86px]">

            {/* Mechanics hero */}
            <section id="planes" className="py-12 sm:py-16 bg-gray-50/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 26, scale: 0.98 }}
                        whileInView={{ opacity: 1, y: 0, scale: 1 }}
                        viewport={{ once: true, amount: 0.35 }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                        className="group relative overflow-hidden rounded-[2rem] bg-brand-charcoal shadow-[0_28px_80px_rgba(0,0,0,0.12)] sm:rounded-[2.6rem]"
                    >
                        <ArtworkPicture slotId="service_hero" language={language} alt="Taller mecanico Briz" className="h-full w-full transition duration-700 group-hover:scale-105" imageClassName="h-[340px] w-full object-cover sm:h-[430px] lg:h-[500px]" />
                    </motion.div>

                </div>
            </section>

            {/* Maintenance packages */}
            <section className="py-12 sm:py-20 bg-white">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div {...fadeUp} className="text-center mb-7 sm:mb-10">
                        <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-brand-charcoal">{language === 'es' ? <>Servicios más <span className="text-brand-yellow">solicitados</span></> : <>Most requested <span className="text-brand-yellow">services</span></>}</h2>
                        <p className="mt-3 text-sm sm:text-lg text-brand-charcoal/60 font-bold">{language === 'es' ? 'Selecciona un servicio para ver todo su alcance.' : 'Select a service to view its full scope.'}</p>
                    </motion.div>

                    <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
                        {popularServices.map((pkg, index) => {
                            const theme = [
                                'bg-[#E9D7B7] text-brand-charcoal border-[#E9D7B7]',
                                'bg-brand-cyan text-white border-brand-cyan',
                                'bg-brand-yellow text-brand-charcoal border-brand-yellow',
                            ][index];
                            const active = selectedPlanIndex === index;
                            return (
                                <button
                                    key={pkg.name}
                                    type="button"
                                    onClick={() => setSelectedPlanIndex(index)}
                                    className={`min-h-0 rounded-2xl border p-4 text-left transition-transform sm:min-h-40 sm:p-5 ${theme} ${active ? 'shadow-lg ring-2 ring-brand-charcoal/20' : 'opacity-80 hover:opacity-100'}`}
                                >
                                    <div className="flex items-center justify-between gap-4 sm:block">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">{pkg.name}</p>
                                            <p className="mt-1 text-base font-black leading-tight sm:mt-2 sm:text-lg">{pkg.title}</p>
                                        </div>
                                        <p className="shrink-0 text-lg font-black sm:mt-3 sm:text-2xl">Bs. {pkg.price}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <motion.article
                        key={selectedPlan.name}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-5 rounded-3xl border border-brand-charcoal/10 bg-[#FFFDF3] p-5 sm:mt-8 sm:p-8"
                    >
                        <div className="flex flex-col gap-4 border-b border-brand-charcoal/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-brand-charcoal/45">{selectedPlan.name}</p>
                                <h3 className="mt-1 text-2xl sm:text-3xl font-black uppercase leading-tight text-brand-charcoal">{selectedPlan.title}</h3>
                            </div>
                            <p className="shrink-0 text-xl sm:text-2xl font-black text-brand-charcoal">Bs. {selectedPlan.price}</p>
                        </div>
                        <div className="mt-5 rounded-2xl bg-white p-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-brand-charcoal/45">{language === 'es' ? 'Ideal para' : 'Ideal for'}</p>
                            <p className="mt-2 text-sm font-bold leading-relaxed text-brand-charcoal/75">{selectedPlan.ideal}</p>
                        </div>
                        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.36fr]">
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-brand-charcoal">{language === 'es' ? 'Qué incluye' : 'What is included'}</p>
                                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                                    {selectedPlan.includes.map(item => (
                                        <li key={item} className="flex items-start gap-2 text-sm font-bold leading-snug text-brand-charcoal/75">
                                            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-cyan" strokeWidth={2.5} /> {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="rounded-2xl bg-white p-4">
                                <p className="text-xs font-black uppercase tracking-widest text-brand-charcoal">{language === 'es' ? 'No incluye' : 'Not included'}</p>
                                <ul className="mt-4 space-y-2">
                                    {selectedPlan.excludes.map(item => (
                                        <li key={item} className="flex items-start gap-2 text-xs font-bold text-brand-charcoal/65">
                                            <XCircle className="h-4 w-4 shrink-0 text-brand-pink" /> {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        <Button
                            type="button"
                            onClick={() => addToQuote({ id: `popular_${selectedPlanIndex}`, name: `${selectedPlan.name} - ${selectedPlan.title}`, price: selectedPlan.price })}
                            disabled={quoteItems.some(item => item.id === `popular_${selectedPlanIndex}`)}
                            className="mt-6 h-12 w-full rounded-xl bg-brand-cyan font-black text-white hover:bg-brand-cyan/85 disabled:opacity-55 sm:w-auto sm:px-8"
                        >
                            <Plus className="mr-2 h-4 w-4" /> {quoteItems.some(item => item.id === `popular_${selectedPlanIndex}`) ? (language === 'es' ? 'Añadido a cotización' : 'Added to quote') : (language === 'es' ? 'Añadir a cotización' : 'Add to quote')}
                        </Button>
                    </motion.article>
                </div>
            </section>

            <section id="adicionales" className="py-12 sm:py-20 bg-[#FFFDF3]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div {...fadeUp} className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6 sm:mb-9">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-brand-yellow-vibrant">{language === 'es' ? 'Mecánica Briz' : 'Briz Mechanics'}</p>
                            <h2 className="mt-2 text-3xl sm:text-5xl font-black tracking-tight text-brand-charcoal">{language === 'es' ? <>Otros <span className="text-brand-yellow">servicios</span></> : <>Additional <span className="text-brand-yellow">services</span></>}</h2>
                        </div>
                        <p className="max-w-md text-sm font-bold leading-relaxed text-brand-charcoal/60">{language === 'es' ? 'Puedes solicitarlos por separado o añadirlos al mantenimiento que elijas.' : 'You can request them separately or add them to your chosen maintenance plan.'}</p>
                    </motion.div>

                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                        {extraServices.map(([service, price], index) => (
                            <motion.div
                                key={service}
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: (index % 3) * 0.06 }}
                                className="flex min-h-28 flex-col justify-between gap-3 rounded-xl border border-brand-yellow/20 bg-white p-3.5 shadow-sm"
                            >
                                <div className="flex min-w-0 items-start gap-2.5">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-yellow/15 text-brand-yellow-vibrant">
                                        <Wrench className="h-4 w-4" strokeWidth={2.3} />
                                    </div>
                                    <p className="text-xs font-black leading-snug text-brand-charcoal">{service}</p>
                                </div>
                                <div className="w-full border-t border-brand-yellow/15 pt-2">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-brand-charcoal/40">{language === 'es' ? 'Precio' : 'Price'}</p>
                                    <p className="mt-0.5 text-sm font-black text-brand-charcoal">{price}</p>
                                    <button
                                        type="button"
                                        onClick={() => addToQuote({ id: `extra_${index}`, name: service, price })}
                                        disabled={quoteItems.some(item => item.id === `extra_${index}`)}
                                        className="mt-2 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wide text-brand-cyan hover:text-brand-charcoal disabled:text-brand-charcoal/35"
                                    >
                                        <Plus className="h-3.5 w-3.5" /> {quoteItems.some(item => item.id === `extra_${index}`) ? (language === 'es' ? 'Añadido' : 'Added') : (language === 'es' ? 'Agregar' : 'Add')}
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {quoteItems.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6 rounded-2xl border border-brand-cyan/25 bg-white p-4 shadow-sm sm:p-5"
                        >
                            <div className="flex items-center justify-between gap-3 border-b border-brand-cyan/15 pb-3">
                                <div className="flex items-center gap-2 text-brand-charcoal">
                                    <ShoppingCart className="h-5 w-5 text-brand-cyan" />
                                    <h3 className="font-black">{language === 'es' ? 'Cotización de mecánica' : 'Mechanical Quote'}</h3>
                                </div>
                                <span className="text-sm font-black text-brand-charcoal">Bs. {quoteTotal.min}{quoteTotal.max !== quoteTotal.min ? ` - ${quoteTotal.max}` : ''}</span>
                            </div>
                            <div className="mt-3 space-y-2">
                                {quoteItems.map(item => (
                                    <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                                        <span className="font-bold text-brand-charcoal/75">{item.name}</span>
                                        <div className="flex shrink-0 items-center gap-2">
                                            <span className="font-black text-brand-charcoal">Bs. {item.price}</span>
                                            <button type="button" onClick={() => removeFromQuote(item.id)} className="rounded-lg p-1 text-brand-pink hover:bg-brand-pink/10" aria-label={`Eliminar ${item.name}`}>
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <a href={quoteLink} target="_blank" rel="noopener noreferrer" className="mt-4 block">
                                <Button className="h-11 w-full rounded-xl bg-brand-cyan font-black text-white hover:bg-brand-cyan/85 sm:w-auto sm:px-6">{language === 'es' ? 'Solicitar cotización por WhatsApp' : 'Request quote via WhatsApp'}</Button>
                            </a>
                        </motion.div>
                    )}
                </div>
            </section>

            {/* How it works */}
            <section className="py-24 sm:py-32 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div {...fadeUp} className="text-center mb-16 sm:mb-20">
                        <h2 className="text-4xl sm:text-5xl font-black mb-6 tracking-tight text-brand-charcoal">{language === 'es' ? <>¿Cómo funciona el <span className="text-brand-yellow">servicio</span>?</> : <>How does our <span className="text-brand-yellow">service</span> work?</>}</h2>
                    </motion.div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12 max-w-6xl mx-auto">
                        {[
                            { step: '01', title: language === 'es' ? 'Trae tu bici' : 'Bring your bike', desc: language === 'es' ? 'Acércate a nuestro taller o solicita servicio de recogida a domicilio.' : 'Visit our workshop or request home pickup service.', icon: '🚲' },
                            { step: '02', title: language === 'es' ? 'Diagnóstico' : 'Diagnosis', desc: language === 'es' ? 'Realizamos una inspección técnica detallada para darte un presupuesto honesto.' : 'We perform a detailed technical inspection to give you an honest quote.', icon: '📋' },
                            { step: '03', title: language === 'es' ? 'Reparación' : 'Repair', desc: language === 'es' ? 'Nuestros técnicos certificados trabajan con herramientas y repuestos de alta gama.' : 'Our certified technicians work with top-grade tools and parts.', icon: '🔧' },
                            { step: '04', title: language === 'es' ? 'Entrega' : 'Delivery', desc: language === 'es' ? 'Te notificamos cuando tu bici esté impecable. ¡Lista para la ruta!' : 'We notify you when your bike is spotless and ready to ride!', icon: '✨' },
                        ].map((s, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center space-y-6 group">
                                <div className="relative">
                                    <div className="w-24 h-24 mx-auto rounded-3xl bg-gray-50 border border-gray-100 group-hover:bg-brand-yellow group-hover:border-brand-yellow shadow-lg flex items-center justify-center transition-all duration-500 group-hover:-translate-y-3 group-hover:shadow-[0_20px_40px_rgba(255,210,0,0.3)] relative z-10">
                                        <span className="text-4xl group-hover:scale-110 transition-transform">{s.icon}</span>
                                        <div className="absolute -top-3 -right-3 w-10 h-10 rounded-xl bg-brand-charcoal text-white flex items-center justify-center font-black text-lg shadow-xl border-2 border-white group-hover:bg-white group-hover:text-brand-charcoal transition-colors">
                                            {s.step}
                                        </div>
                                    </div>
                                    {i < 3 && <div className="hidden lg:block absolute top-12 left-full w-full h-[2px] bg-gradient-to-r from-brand-yellow/50 to-transparent -translate-x-12 z-0" />}
                                </div>
                                <div className="px-4">
                                    <h3 className="font-black text-xl text-brand-charcoal mb-3 group-hover:text-brand-yellow transition-colors tracking-tight">{s.title}</h3>
                                    <p className="text-sm sm:text-base text-gray-400 font-bold leading-relaxed">{s.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Request Form */}
            <section className="py-24 sm:py-40 bg-gray-50/50" id="agenda-turno">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div {...fadeUp} className="text-center mb-16 sm:mb-20">
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            className="inline-block px-4 py-1.5 rounded-full bg-brand-yellow/10 text-brand-yellow font-black text-[10px] uppercase tracking-widest mb-6"
                        >
                            {language === 'es' ? 'Agenda Online' : 'Online Booking'}
                        </motion.div>
                        <h2 className="text-4xl sm:text-6xl font-black mb-8 tracking-tight text-brand-charcoal leading-tight">{language === 'es' ? <>Solicita tu <span className="text-brand-yellow italic">turno hoy</span></> : <>Book your <span className="text-brand-yellow italic">appointment today</span></>}</h2>
                        <p className="text-xl sm:text-2xl text-gray-400 font-bold max-w-2xl mx-auto leading-relaxed">{language === 'es' ? 'Completa el formulario y te contactaremos de inmediato para confirmar tu horario.' : 'Fill out the form and we will contact you right away to confirm your schedule.'}</p>
                    </motion.div>
                    <motion.div {...fadeUp}>
                        <Card className="bg-white rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.08)] border-0 overflow-hidden relative group">
                            <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-brand-yellow via-brand-pink to-brand-charcoal" />
                            <CardContent className="p-10 sm:p-16">
                                <form onSubmit={handleRequest} className="space-y-8">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <Label className="text-brand-charcoal font-black text-xs uppercase tracking-widest ml-1 opacity-60">{language === 'es' ? 'Nombre Completo' : 'Full Name'}</Label>
                                            <Input value={request.name} onChange={event => setRequest(current => ({ ...current, name: event.target.value }))} placeholder="Tu nombre" required className="h-16 rounded-2xl bg-gray-50 border-0 focus-visible:ring-2 focus-visible:ring-brand-yellow/50 focus-visible:bg-white transition-all text-base font-bold shadow-inner" />
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-brand-charcoal font-black text-xs uppercase tracking-widest ml-1 opacity-60">{language === 'es' ? 'Teléfono WhatsApp' : 'WhatsApp Phone'}</Label>
                                            <Input value={request.phone} onChange={event => setRequest(current => ({ ...current, phone: event.target.value }))} placeholder="+591 7..." required className="h-16 rounded-2xl bg-gray-50 border-0 focus-visible:ring-2 focus-visible:ring-brand-yellow/50 focus-visible:bg-white transition-all text-base font-bold shadow-inner" />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-brand-charcoal font-black text-xs uppercase tracking-widest ml-1 opacity-60">{language === 'es' ? 'Tipo de bicicleta' : 'Bicycle Type'}</Label>
                                        <Input value={request.bikeType} onChange={event => setRequest(current => ({ ...current, bikeType: event.target.value }))} placeholder="Ej: Mountain bike, urbana, ruta..." required className="h-16 rounded-2xl bg-gray-50 border-0 focus-visible:ring-2 focus-visible:ring-brand-yellow/50 focus-visible:bg-white transition-all text-base font-bold shadow-inner" />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-brand-charcoal font-black text-xs uppercase tracking-widest ml-1 opacity-60">{language === 'es' ? 'Falla o Servicio Necesitado' : 'Issue or Service Needed'}</Label>
                                        <Textarea value={request.issue} onChange={event => setRequest(current => ({ ...current, issue: event.target.value }))} placeholder="Describe brevemente qué necesita tu bicicleta..." rows={4} required className="rounded-2xl bg-gray-50 border-0 focus-visible:ring-2 focus-visible:ring-brand-yellow/50 focus-visible:bg-white transition-all text-base font-bold shadow-inner resize-none p-5" />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <Label className="text-brand-charcoal font-black text-xs uppercase tracking-widest ml-1 opacity-60">{language === 'es' ? 'Fecha Sugerida' : 'Preferred Date'}</Label>
                                            <Input type="date" value={request.date} onChange={event => setRequest(current => ({ ...current, date: event.target.value }))} className="h-16 rounded-2xl bg-gray-50 border-0 focus-visible:ring-2 focus-visible:ring-brand-yellow/50 focus-visible:bg-white transition-all text-base font-bold shadow-inner" />
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-brand-charcoal font-black text-xs uppercase tracking-widest ml-1 opacity-60">{language === 'es' ? 'Foto de la bicicleta' : 'Bicycle Photo'}</Label>
                                            <label className="flex h-16 cursor-pointer items-center gap-3 rounded-2xl bg-gray-50 px-5 font-bold text-brand-charcoal/70 transition hover:bg-brand-yellow/10">
                                                <ImagePlus className="h-5 w-5 text-brand-yellow-vibrant" />
                                                <span className="truncate">{bikeImageUrl ? (language === 'es' ? 'Foto seleccionada' : 'Photo selected') : (language === 'es' ? 'Agregar foto (opcional)' : 'Add photo (optional)')}</span>
                                                <input type="file" accept="image/*" onChange={handleBikeImage} className="sr-only" />
                                            </label>
                                        </div>
                                    </div>
                                    {bikeImageUrl && <img src={bikeImageUrl} alt="Vista previa de la bicicleta" className="h-40 w-full rounded-2xl object-cover" />}
                                    <Button disabled={isSending} type="submit" className="w-full h-16 bg-brand-charcoal text-white hover:bg-brand-yellow hover:text-brand-black shadow-2xl hover:shadow-brand-yellow/30 hover:-translate-y-2 transition-all duration-500 rounded-2xl font-black text-xl border-0 uppercase tracking-tighter disabled:opacity-60">
                                        {isSending ? (language === 'es' ? 'Agendando...' : 'Booking...') : (language === 'es' ? 'Agendar Ahora' : 'Book Now')}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </section>

            {/* Trust indicators */}
            <section className="py-24 sm:py-32 bg-brand-charcoal text-white overflow-hidden relative">
                <ArtworkBackground slotId="service_texture" language={language} className="opacity-[0.03] mix-blend-overlay" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-brand-yellow/5 rounded-full blur-[150px] mix-blend-screen" />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-20 text-center">
                        {[
                            { icon: Wrench, value: '500+', label: language === 'es' ? 'Bicis Reparadas' : 'Bikes Repaired', color: 'brand-yellow' },
                            { icon: Star, value: '4.9', label: language === 'es' ? 'Satisfacción' : 'Satisfaction', color: 'brand-cyan' },
                            { icon: Clock, value: '24h', label: language === 'es' ? 'Entrega Rápida' : 'Fast Turnaround', color: 'brand-pink' },
                            { icon: Shield, value: '30 d', label: language === 'es' ? 'Garantía Total' : 'Full Warranty', color: 'brand-yellow' },
                        ].map((stat, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="space-y-6 group">
                                <div className={`w-20 h-20 mx-auto rounded-3xl bg-${stat.color}/5 border border-${stat.color}/10 flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:bg-${stat.color}/20 group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)]`}>
                                    <stat.icon className={`w-10 h-10 text-${stat.color}`} strokeWidth={1.5} />
                                </div>
                                <div>
                                    <p className="text-4xl sm:text-5xl font-black mb-2 tracking-tighter">{stat.value}</p>
                                    <p className="text-[10px] sm:text-xs font-black text-white/40 tracking-[0.2em] uppercase">{stat.label}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
