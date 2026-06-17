import { motion } from 'framer-motion';
import { Wrench, CheckCircle, Clock, Shield, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { services } from '@/data/mockData';

const fadeUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 },
};

export default function ServicePage() {
    return (
        <div className="pt-[64px] lg:pt-[86px]">

            {/* Services Grid */}
            <section className="py-24 sm:py-32 bg-gray-50/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div {...fadeUp} className="text-center mb-16 sm:mb-20">
                        <h2 className="text-4xl sm:text-5xl font-black mb-6 tracking-tight text-brand-charcoal">Nuestros <span className="text-brand-yellow">Servicios</span></h2>
                        <p className="text-lg sm:text-xl text-gray-500 font-medium max-w-2xl mx-auto">Desde revisiones rápidas hasta mantenimiento integral experto.</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 26, scale: 0.98 }}
                        whileInView={{ opacity: 1, y: 0, scale: 1 }}
                        viewport={{ once: true, amount: 0.35 }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                        className="group relative mb-16 overflow-hidden rounded-[2rem] bg-brand-charcoal shadow-[0_28px_80px_rgba(0,0,0,0.12)] sm:rounded-[2.6rem]"
                    >
                        <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/70 via-black/20 to-transparent" />
                        <img
                            src="/images/hero-bg.jpeg"
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

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
                        {services.map((service, i) => (
                            <motion.div key={service.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (i % 6) * 0.1, duration: 0.5 }} className="h-full">
                                <Card className="h-full bg-white border-4 border-brand-black rounded-2xl shadow-[8px_8px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all duration-300 flex flex-col group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-yellow/5 rounded-bl-[4rem] group-hover:bg-brand-yellow/10 transition-colors" />
                                    <CardContent className="p-8 sm:p-10 flex flex-col flex-1 relative z-10">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gray-50 group-hover:bg-brand-yellow flex items-center justify-center transition-all duration-500 shadow-sm group-hover:scale-110">
                                                <Wrench className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 group-hover:text-white transition-colors" strokeWidth={1.5} />
                                            </div>
                                            <Badge variant="secondary" className="text-[10px] font-black bg-gray-50 text-gray-400 rounded-full px-4 py-2 uppercase tracking-widest border-0 group-hover:bg-brand-yellow/20 group-hover:text-brand-charcoal transition-colors">
                                                <Clock className="w-3.5 h-3.5 mr-2" strokeWidth={1.5} /> {service.duration}
                                            </Badge>
                                        </div>
                                        <h3 className="text-2xl sm:text-3xl font-black text-brand-charcoal mb-4 group-hover:text-brand-yellow transition-colors leading-tight">{service.name}</h3>
                                        <p className="text-sm sm:text-base text-gray-400 font-bold leading-relaxed flex-1 opacity-80 group-hover:opacity-100 transition-opacity">{service.description}</p>
                                        <div className="flex items-center justify-between pt-8 border-t border-gray-50 mt-8">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-sm font-bold text-gray-400">Bs</span>
                                                <p className="text-3xl sm:text-4xl font-black text-brand-charcoal">{service.price}</p>
                                            </div>
                                            <a href="https://wa.me/59177860277" target="_blank" rel="noopener noreferrer">
                                                <Button className="rounded-full h-12 px-8 bg-brand-charcoal text-white hover:bg-brand-yellow hover:text-brand-black shadow-xl hover:-translate-y-1.5 hover:shadow-brand-yellow/20 transition-all duration-300 font-black text-base border-0">
                                                    Solicitar
                                                </Button>
                                            </a>
                                        </div>
                                    </CardContent>
                                    <div className="absolute bottom-0 left-0 w-full h-1 bg-brand-yellow scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Maintenance Packages */}
            <section className="py-24 sm:py-32 bg-brand-charcoal text-white relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute bottom-[-20%] left-1/4 w-[600px] h-[600px] bg-brand-yellow/10 rounded-full blur-[120px]" />
                </div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <motion.div {...fadeUp} className="text-center mb-16 sm:mb-20">
                        <h2 className="text-4xl sm:text-5xl font-black mb-6 tracking-tight">Paquetes de <span className="text-brand-yellow">Mantenimiento</span></h2>
                        <p className="text-lg sm:text-xl text-white/70 font-medium max-w-2xl mx-auto">Soluciones completas para dejar tu bici como nueva.</p>
                    </motion.div>
                    <div className="grid lg:grid-cols-3 gap-10 max-w-6xl mx-auto items-stretch">
                        {[
                            { name: 'Básico', price: 80, items: ['Revisión general', 'Inflado de neumáticos', 'Ajuste de frenos', 'Lubricación de cadena'] },
                            { name: 'Completo', price: 180, items: ['Todo del Básico', 'Ajuste de cambios', 'Limpieza profunda', 'Revisión de rodamientos', 'Ajuste de radios'], featured: true },
                            { name: 'Premium', price: 300, items: ['Todo del Completo', 'Cambio de cables', 'Cambio de pastillas', 'Cambio de cámara', 'Garantía 30 días'] },
                        ].map((pkg, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} className="h-full">
                                <div className={`relative rounded-[3rem] p-10 h-full flex flex-col transition-all duration-500 hover:-translate-y-4 ${pkg.featured ? 'bg-brand-yellow text-brand-charcoal border-0 shadow-[0_30px_60px_rgba(255,210,0,0.4)] md:scale-110 z-10' : 'bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl hover:bg-white/10'}`}>
                                    {pkg.featured && (
                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                                            <Badge className="bg-brand-charcoal text-white font-black px-6 py-2 uppercase tracking-widest text-[10px] rounded-full shadow-2xl border-0">Recomendado</Badge>
                                        </div>
                                    )}
                                    <div className="mb-10">
                                        <h3 className="text-3xl font-black mb-4 tracking-tight">{pkg.name}</h3>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-sm font-black uppercase tracking-widest opacity-60">Bs.</span>
                                            <span className={`text-6xl font-black ${pkg.featured ? 'text-brand-charcoal' : 'text-brand-yellow'} tracking-tighter`}>{pkg.price}</span>
                                        </div>
                                    </div>
                                    <ul className="space-y-5 flex-1 mb-12">
                                        {pkg.items.map((item, j) => (
                                            <li key={j} className="flex items-start gap-4 text-base font-bold">
                                                <div className={`mt-1 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${pkg.featured ? 'bg-brand-charcoal' : 'bg-brand-yellow'}`}>
                                                    <CheckCircle className={`w-3.5 h-3.5 ${pkg.featured ? 'text-white' : 'text-brand-black'}`} strokeWidth={3} />
                                                </div>
                                                <span className={pkg.featured ? 'text-brand-charcoal/90' : 'text-white/80'}>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <a href="https://wa.me/59177860277" target="_blank" rel="noopener noreferrer" className="mt-auto">
                                        <Button className={`w-full h-16 rounded-full font-black text-lg transition-all duration-300 ${pkg.featured ? 'bg-brand-charcoal text-white hover:bg-black shadow-xl hover:shadow-2xl' : 'bg-white/10 text-white hover:bg-brand-yellow hover:text-brand-black border border-white/20 hover:border-brand-yellow shadow-lg'}`}>
                                            Agendar Turno
                                        </Button>
                                    </a>
                                </div>
                            </motion.div>
                        ))}
                    </div>
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
