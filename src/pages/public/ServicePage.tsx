import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wrench, CheckCircle, Clock, Shield, Star, XCircle, ShoppingCart, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

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
        ideal: 'Bicicletas que funcionan correctamente pero necesitan ajustes y calibración general.',
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

type QuoteItem = { id: string; name: string; price: string };

function priceRange(price: string) {
    const values = [...price.replace(',', '.').matchAll(/\d+(?:\.\d+)?/g)].map(match => Number(match[0]));
    return { min: values[0] || 0, max: values[1] || values[0] || 0 };
}

export default function ServicePage() {
    const [selectedPlanIndex, setSelectedPlanIndex] = useState(0);
    const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
    const selectedPlan = maintenancePlans[selectedPlanIndex];
    const quoteTotal = quoteItems.reduce((total, item) => {
        const range = priceRange(item.price);
        return { min: total.min + range.min, max: total.max + range.max };
    }, { min: 0, max: 0 });
    const addToQuote = (item: QuoteItem) => setQuoteItems(current => current.some(entry => entry.id === item.id) ? current : [...current, item]);
    const removeFromQuote = (id: string) => setQuoteItems(current => current.filter(item => item.id !== id));
    const quoteLink = `https://wa.me/59177860277?text=${encodeURIComponent(`Hola Briz, deseo una cotización mecánica.\n\nServicios:\n${quoteItems.map(item => `- ${item.name}: Bs. ${item.price}`).join('\n')}\n\nTotal estimado: Bs. ${quoteTotal.min}${quoteTotal.max !== quoteTotal.min ? ` - ${quoteTotal.max}` : ''}`)}`;

    return (
        <div className="pt-[64px] lg:pt-[86px]">

            {/* Mechanics hero */}
            <section className="py-12 sm:py-16 bg-gray-50/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 26, scale: 0.98 }}
                        whileInView={{ opacity: 1, y: 0, scale: 1 }}
                        viewport={{ once: true, amount: 0.35 }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                        className="group relative overflow-hidden rounded-[2rem] bg-brand-charcoal shadow-[0_28px_80px_rgba(0,0,0,0.12)] sm:rounded-[2.6rem]"
                    >
                        <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/70 via-black/20 to-transparent" />
                        <img
                            src="/images/mechanics-hero-briz.jpg"
                            alt="Taller mecanico Briz"
                            className="h-[340px] w-full object-cover transition duration-700 group-hover:scale-105 sm:h-[430px] lg:h-[500px]"
                        />
                        <div className="absolute inset-x-4 bottom-4 z-20 rounded-[1.5rem] border border-white/18 bg-white/10 p-5 text-white shadow-2xl backdrop-blur-md sm:inset-x-8 sm:bottom-8 sm:max-w-xl sm:p-7">
                            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.24em] text-brand-yellow">Taller Briz</p>
                            <h3 className="text-3xl font-black leading-tight sm:text-5xl">Mecanica precisa para volver a rodar</h3>
                            <p className="mt-3 text-sm font-bold leading-relaxed text-white/75 sm:text-base">
                                Diagnostico, ajuste y mantenimiento con una vista clara antes de elegir el servicio.
                            </p>
                        </div>
                        <div className="pointer-events-none absolute inset-4 z-20 rounded-[1.55rem] border border-white/0 transition duration-500 group-hover:inset-5 group-hover:border-white/30 sm:rounded-[2rem]" />
                    </motion.div>

                </div>
            </section>

            {/* Maintenance packages */}
            <section className="py-12 sm:py-20 bg-white">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div {...fadeUp} className="text-center mb-7 sm:mb-10">
                        <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-brand-charcoal">Planes de <span className="text-brand-yellow">Mantenimiento</span></h2>
                        <p className="mt-3 text-sm sm:text-lg text-brand-charcoal/60 font-bold">Selecciona un plan para ver todo su alcance.</p>
                    </motion.div>

                    <div className="grid grid-cols-3 gap-2 sm:gap-4">
                        {maintenancePlans.map((pkg, index) => {
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
                                    className={`min-h-32 sm:min-h-40 rounded-2xl border p-3 sm:p-5 text-left transition-transform ${theme} ${active ? 'scale-[1.03] shadow-lg ring-2 ring-brand-charcoal/20' : 'opacity-80 hover:opacity-100'}`}
                                >
                                    <p className="text-[9px] sm:text-[11px] font-black uppercase tracking-widest opacity-80">{pkg.name}</p>
                                    <p className="mt-2 text-xs sm:text-lg font-black leading-tight line-clamp-2">{pkg.title}</p>
                                    <p className="mt-3 text-base sm:text-2xl font-black">Bs. {pkg.price}</p>
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
                            <p className="text-[10px] font-black uppercase tracking-widest text-brand-charcoal/45">Ideal para</p>
                            <p className="mt-2 text-sm font-bold leading-relaxed text-brand-charcoal/75">{selectedPlan.ideal}</p>
                        </div>
                        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.36fr]">
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-brand-charcoal">Qué incluye</p>
                                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                                    {selectedPlan.includes.map(item => (
                                        <li key={item} className="flex items-start gap-2 text-sm font-bold leading-snug text-brand-charcoal/75">
                                            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-cyan" strokeWidth={2.5} /> {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="rounded-2xl bg-white p-4">
                                <p className="text-xs font-black uppercase tracking-widest text-brand-charcoal">No incluye</p>
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
                            onClick={() => addToQuote({ id: `plan_${selectedPlanIndex}`, name: `${selectedPlan.name} - ${selectedPlan.title}`, price: selectedPlan.price })}
                            disabled={quoteItems.some(item => item.id === `plan_${selectedPlanIndex}`)}
                            className="mt-6 h-12 w-full rounded-xl bg-brand-cyan font-black text-white hover:bg-brand-cyan/85 disabled:opacity-55 sm:w-auto sm:px-8"
                        >
                            <Plus className="mr-2 h-4 w-4" /> {quoteItems.some(item => item.id === `plan_${selectedPlanIndex}`) ? 'Añadido a cotización' : 'Añadir a cotización'}
                        </Button>
                    </motion.article>
                </div>
            </section>

            {/* Extra services */}
            <section className="py-12 sm:py-20 bg-[#FFFDF3]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div {...fadeUp} className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6 sm:mb-9">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-brand-yellow-vibrant">Mecánica Briz</p>
                            <h2 className="mt-2 text-3xl sm:text-5xl font-black tracking-tight text-brand-charcoal">Servicios <span className="text-brand-yellow">extra</span></h2>
                        </div>
                        <p className="max-w-md text-sm font-bold leading-relaxed text-brand-charcoal/60">Puedes solicitarlos por separado o añadirlos al mantenimiento que elijas.</p>
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
                                    <p className="text-[8px] font-black uppercase tracking-widest text-brand-charcoal/40">Precio</p>
                                    <p className="mt-0.5 text-sm font-black text-brand-charcoal">{price}</p>
                                    <button
                                        type="button"
                                        onClick={() => addToQuote({ id: `extra_${index}`, name: service, price })}
                                        disabled={quoteItems.some(item => item.id === `extra_${index}`)}
                                        className="mt-2 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wide text-brand-cyan hover:text-brand-charcoal disabled:text-brand-charcoal/35"
                                    >
                                        <Plus className="h-3.5 w-3.5" /> {quoteItems.some(item => item.id === `extra_${index}`) ? 'Añadido' : 'Agregar'}
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
                                    <h3 className="font-black">Cotización de mecánica</h3>
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
                                <Button className="h-11 w-full rounded-xl bg-brand-cyan font-black text-white hover:bg-brand-cyan/85 sm:w-auto sm:px-6">Solicitar cotización por WhatsApp</Button>
                            </a>
                        </motion.div>
                    )}
                </div>
            </section>

            {/* How it works */}
            <section className="py-24 sm:py-32 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div {...fadeUp} className="text-center mb-16 sm:mb-20">
                        <h2 className="text-4xl sm:text-5xl font-black mb-6 tracking-tight text-brand-charcoal">¿Cómo funciona el <span className="text-brand-yellow">servicio</span>?</h2>
                    </motion.div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12 max-w-6xl mx-auto">
                        {[
                            { step: '01', title: 'Trae tu bici', desc: 'Acércate a nuestro taller o solicita servicio de recogida a domicilio.', icon: '🚲' },
                            { step: '02', title: 'Diagnóstico', desc: 'Realizamos una inspección técnica detallada para darte un presupuesto honesto.', icon: '📋' },
                            { step: '03', title: 'Reparación', desc: 'Nuestros técnicos certificados trabajan con herramientas y repuestos de alta gama.', icon: '🔧' },
                            { step: '04', title: 'Entrega', desc: 'Te notificamos cuando tu bici esté impecable. ¡Lista para la ruta!', icon: '✨' },
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
                            Agenda Online
                        </motion.div>
                        <h2 className="text-4xl sm:text-6xl font-black mb-8 tracking-tight text-brand-charcoal leading-tight">Solicita tu <span className="text-brand-yellow italic">turno hoy</span></h2>
                        <p className="text-xl sm:text-2xl text-gray-400 font-bold max-w-2xl mx-auto leading-relaxed">Completa el formulario y te contactaremos de inmediato para confirmar tu horario.</p>
                    </motion.div>
                    <motion.div {...fadeUp}>
                        <Card className="bg-white rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.08)] border-0 overflow-hidden relative group">
                            <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-brand-yellow via-brand-pink to-brand-charcoal" />
                            <CardContent className="p-10 sm:p-16">
                                <form onSubmit={(e) => { e.preventDefault(); alert('¡Solicitud enviada! (Demo)'); }} className="space-y-8">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <Label className="text-brand-charcoal font-black text-xs uppercase tracking-widest ml-1 opacity-60">Nombre Completo</Label>
                                            <Input placeholder="Tu nombre" required className="h-16 rounded-2xl bg-gray-50 border-0 focus-visible:ring-2 focus-visible:ring-brand-yellow/50 focus-visible:bg-white transition-all text-base font-bold shadow-inner" />
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-brand-charcoal font-black text-xs uppercase tracking-widest ml-1 opacity-60">Teléfono WhatsApp</Label>
                                            <Input placeholder="+591 7..." required className="h-16 rounded-2xl bg-gray-50 border-0 focus-visible:ring-2 focus-visible:ring-brand-yellow/50 focus-visible:bg-white transition-all text-base font-bold shadow-inner" />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-brand-charcoal font-black text-xs uppercase tracking-widest ml-1 opacity-60">Tipo de bicicleta</Label>
                                        <Input placeholder="Ej: Mountain bike, urbana, ruta..." required className="h-16 rounded-2xl bg-gray-50 border-0 focus-visible:ring-2 focus-visible:ring-brand-yellow/50 focus-visible:bg-white transition-all text-base font-bold shadow-inner" />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-brand-charcoal font-black text-xs uppercase tracking-widest ml-1 opacity-60">Falla o Servicio Necesitado</Label>
                                        <Textarea placeholder="Describe brevemente qué necesita tu bicicleta..." rows={4} required className="rounded-2xl bg-gray-50 border-0 focus-visible:ring-2 focus-visible:ring-brand-yellow/50 focus-visible:bg-white transition-all text-base font-bold shadow-inner resize-none p-5" />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <Label className="text-brand-charcoal font-black text-xs uppercase tracking-widest ml-1 opacity-60">Fecha Sugerida</Label>
                                            <Input type="date" className="h-16 rounded-2xl bg-gray-50 border-0 focus-visible:ring-2 focus-visible:ring-brand-yellow/50 focus-visible:bg-white transition-all text-base font-bold shadow-inner" />
                                        </div>
                                        <div className="space-y-3 flex items-end">
                                            <Button type="submit" className="w-full h-16 bg-brand-charcoal text-white hover:bg-brand-yellow hover:text-brand-black shadow-2xl hover:shadow-brand-yellow/30 hover:-translate-y-2 transition-all duration-500 rounded-2xl font-black text-xl border-0 uppercase tracking-tighter">
                                                Agendar Ahora
                                            </Button>
                                        </div>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </section>

            {/* Trust indicators */}
            <section className="py-24 sm:py-32 bg-brand-charcoal text-white overflow-hidden relative">
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-brand-yellow/5 rounded-full blur-[150px] mix-blend-screen" />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-20 text-center">
                        {[
                            { icon: Wrench, value: '500+', label: 'Bicis Reparadas', color: 'brand-yellow' },
                            { icon: Star, value: '4.9', label: 'Satisfacción', color: 'brand-cyan' },
                            { icon: Clock, value: '24h', label: 'Entrega Rápida', color: 'brand-pink' },
                            { icon: Shield, value: '30 d', label: 'Garantía Total', color: 'brand-yellow' },
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
