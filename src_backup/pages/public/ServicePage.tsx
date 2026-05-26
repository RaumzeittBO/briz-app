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
        <div className="pt-20">
            {/* Hero */}
            <section className="bg-hero-gradient py-20 relative overflow-hidden">
                <div className="absolute inset-0"><div className="absolute top-0 left-1/3 w-96 h-96 bg-brand-yellow/8 rounded-full blur-[100px]" /></div>
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        <h1 className="text-4xl sm:text-5xl font-bold text-white">Servicio <span className="text-gradient-yellow">Técnico</span></h1>
                        <p className="text-white/60 max-w-xl mx-auto">Taller profesional para tu bicicleta. Reparaciones, mantenimiento y ajustes con los mejores técnicos de Cochabamba.</p>
                    </motion.div>
                </div>
            </section>

            {/* Services Grid */}
            <section className="py-20 bg-background">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div {...fadeUp} className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4">Nuestros <span className="text-brand-yellow">Servicios</span></h2>
                        <p className="text-muted-foreground">Desde revisiones rápidas hasta mantenimiento completo.</p>
                    </motion.div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {services.map((service, i) => (
                            <motion.div key={service.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                                <Card className="h-full hover:shadow-lg hover:border-brand-yellow/30 transition-all duration-300">
                                    <CardContent className="p-6 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="w-12 h-12 rounded-xl bg-brand-yellow/10 flex items-center justify-center">
                                                <Wrench className="w-6 h-6 text-brand-yellow" />
                                            </div>
                                            <Badge variant="secondary" className="text-xs">
                                                <Clock className="w-3 h-3 mr-1" /> {service.duration}
                                            </Badge>
                                        </div>
                                        <h3 className="text-lg font-semibold">{service.name}</h3>
                                        <p className="text-sm text-muted-foreground">{service.description}</p>
                                        <div className="flex items-center justify-between pt-4 border-t">
                                            <p className="text-2xl font-bold text-brand-yellow">Bs. {service.price}</p>
                                            <a href="https://wa.me/59177860277" target="_blank" rel="noopener noreferrer">
                                                <Button size="sm" className="bg-brand-yellow text-brand-black hover:bg-brand-yellow-light text-xs">
                                                    Solicitar
                                                </Button>
                                            </a>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Maintenance Packages */}
            <section className="py-20 bg-brand-black text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div {...fadeUp} className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4">Paquetes de <span className="text-gradient-yellow">Mantenimiento</span></h2>
                    </motion.div>
                    <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
                        {[
                            { name: 'Básico', price: 80, items: ['Revisión general', 'Inflado de neumáticos', 'Ajuste de frenos', 'Lubricación de cadena'] },
                            { name: 'Completo', price: 180, items: ['Todo del Básico', 'Ajuste de cambios', 'Limpieza profunda', 'Revisión de rodamientos', 'Ajuste de radios'], featured: true },
                            { name: 'Premium', price: 300, items: ['Todo del Completo', 'Cambio de cables', 'Cambio de pastillas', 'Cambio de cámara', 'Garantía 30 días'] },
                        ].map((pkg, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                                <div className={`rounded-2xl p-6 h-full flex flex-col ${pkg.featured ? 'glass-yellow glow-yellow' : 'glass'}`}>
                                    {pkg.featured && <Badge className="bg-brand-yellow text-brand-black self-start mb-3 text-xs">Más popular</Badge>}
                                    <h3 className="text-xl font-bold mb-1">{pkg.name}</h3>
                                    <p className="text-3xl font-bold text-brand-yellow mb-4">Bs. {pkg.price}</p>
                                    <ul className="space-y-2 flex-1 mb-6">
                                        {pkg.items.map((item, j) => (
                                            <li key={j} className="flex items-center gap-2 text-sm text-white/70">
                                                <CheckCircle className="w-4 h-4 text-brand-yellow flex-shrink-0" /> {item}
                                            </li>
                                        ))}
                                    </ul>
                                    <a href="https://wa.me/59177860277" target="_blank" rel="noopener noreferrer">
                                        <Button className={`w-full ${pkg.featured ? 'bg-brand-yellow text-brand-black hover:bg-brand-yellow-light' : 'bg-white/10 hover:bg-white/20 text-white'}`}>
                                            Solicitar
                                        </Button>
                                    </a>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="py-20 bg-background">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div {...fadeUp} className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4">¿Cómo funciona el <span className="text-brand-yellow">servicio</span>?</h2>
                    </motion.div>
                    <div className="grid sm:grid-cols-4 gap-8 max-w-4xl mx-auto">
                        {[
                            { step: '1', title: 'Trae tu bici', desc: 'Tráela a nuestro taller o solicita recogida.' },
                            { step: '2', title: 'Diagnóstico', desc: 'Revisamos y te damos un presupuesto claro.' },
                            { step: '3', title: 'Reparación', desc: 'Nuestros técnicos trabajan con precisión.' },
                            { step: '4', title: 'Entrega', desc: 'Te avisamos cuando esté lista. ¡A rodar!' },
                        ].map((s, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center space-y-3">
                                <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-yellow/10 flex items-center justify-center">
                                    <span className="text-xl font-bold text-brand-yellow">{s.step}</span>
                                </div>
                                <h3 className="font-semibold">{s.title}</h3>
                                <p className="text-sm text-muted-foreground">{s.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Request Form */}
            <section className="py-20 bg-muted/50">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div {...fadeUp} className="text-center mb-10">
                        <h2 className="text-3xl font-bold mb-4">Solicita tu <span className="text-brand-yellow">servicio</span></h2>
                        <p className="text-muted-foreground">Completa el formulario y te contactaremos para coordinar.</p>
                    </motion.div>
                    <motion.div {...fadeUp}>
                        <Card>
                            <CardContent className="p-6">
                                <form onSubmit={(e) => { e.preventDefault(); alert('¡Solicitud enviada! (Demo)'); }} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><Label>Nombre</Label><Input placeholder="Tu nombre" required /></div>
                                        <div><Label>Teléfono</Label><Input placeholder="+591 7..." required /></div>
                                    </div>
                                    <div><Label>Tipo de bicicleta</Label><Input placeholder="Ej: Mountain bike, urbana, ruta..." required /></div>
                                    <div><Label>Descripción del problema</Label><Textarea placeholder="Describe el problema o servicio que necesitas..." rows={3} required /></div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><Label>Fecha preferida</Label><Input type="date" /></div>
                                        <div><Label>Notas adicionales</Label><Input placeholder="Cualquier detalle extra" /></div>
                                    </div>
                                    <Button type="submit" className="w-full bg-brand-yellow text-brand-black hover:bg-brand-yellow-light font-bold">
                                        Enviar Solicitud
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </section>

            {/* Trust indicators */}
            <section className="py-16 bg-background">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
                        {[
                            { icon: Wrench, value: '500+', label: 'Bicis reparadas' },
                            { icon: Star, value: '4.9', label: 'Calificación promedio' },
                            { icon: Clock, value: '24h', label: 'Tiempo promedio' },
                            { icon: Shield, value: '30 días', label: 'Garantía de servicio' },
                        ].map((stat, i) => (
                            <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="space-y-2">
                                <stat.icon className="w-8 h-8 text-brand-yellow mx-auto" />
                                <p className="text-2xl font-bold">{stat.value}</p>
                                <p className="text-sm text-muted-foreground">{stat.label}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
