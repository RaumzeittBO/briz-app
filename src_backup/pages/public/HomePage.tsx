import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    Bike, ShoppingBag, Wrench, MapPin, Shield, Clock, Heart, Star,
    ChevronRight, ArrowRight, Users, Sparkles, Route, Phone, MessageCircle, CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { testimonials, faqs } from '@/data/mockData';

const fadeUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-50px' },
    transition: { duration: 0.6 },
};

const stagger = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
};

export default function HomePage() {
    return (
        <div className="overflow-hidden">
            {/* ===== HERO SECTION ===== */}
            <section className="relative min-h-[100svh] flex items-center overflow-hidden">
                {/* Hero background image */}
                <div className="absolute inset-0">
                    <img src="/images/hero-bg.jpeg" alt="" className="w-full h-full object-cover object-center contrast-125 saturate-105 brightness-95" />
                    <div className="absolute inset-0 bg-brand-yellow/20 mix-blend-multiply" />
                    <div className="absolute inset-0 bg-brand-yellow/10" />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-yellow/30 via-transparent to-transparent" />
                    {/* Smooth transition to the next section's background */}
                    <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent" />
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40 w-full flex flex-col justify-center min-h-[100svh] pt-32 lg:pt-40">
                    <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center flex-1">
                        {/* Text Content */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="space-y-6 sm:space-y-8 text-center lg:text-left flex flex-col items-center lg:items-start z-10"
                        >
                            <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full glass-yellow/50 border border-brand-yellow/30 bg-black/20 backdrop-blur-md">
                                <Sparkles className="w-4 h-4 text-brand-yellow" />
                                <span className="text-xs sm:text-sm font-medium text-brand-yellow tracking-wide uppercase">La experiencia ciclista de Cochabamba</span>
                            </div>

                            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.05] tracking-tight drop-shadow-lg">
                                Vive Cochabamba <br className="hidden sm:block" />
                                <span className="text-gradient-yellow">sobre dos ruedas</span>
                            </h1>

                            <p className="text-base sm:text-lg text-white/90 max-w-xl leading-relaxed drop-shadow-md font-medium px-2 sm:px-0">
                                Alquila, compra y repara tu bicicleta en un solo lugar. Descubre las mejores rutas urbanas, explora el Cristo, recorre las ciclovías y vive la libertad del ciclismo en la llajta.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto pt-2">
                                <Link to="/rentals" className="w-full sm:w-auto">
                                    <Button size="lg" className="bg-brand-yellow text-brand-black hover:bg-brand-yellow-light font-bold text-base px-8 py-6 rounded-2xl glow-yellow-strong w-full shadow-xl transition-all hover:scale-105 active:scale-95">
                                        <Bike className="w-5 h-5 mr-2" /> Reserva ya
                                    </Button>
                                </Link>
                                <Link to="/shop" className="w-full sm:w-auto">
                                    <Button size="lg" className="bg-transparent text-white border-2 border-white/50 hover:bg-white/10 hover:border-white font-semibold text-base px-8 py-6 rounded-2xl w-full backdrop-blur-sm transition-all hover:scale-105 active:scale-95">
                                        <ShoppingBag className="w-5 h-5 mr-2" /> Explorar Tienda
                                    </Button>
                                </Link>
                            </div>

                            <Link to="/service" className="inline-flex items-center justify-center gap-2 text-white/80 hover:text-brand-yellow transition-colors text-sm font-medium group drop-shadow-sm pt-2">
                                <Wrench className="w-4 h-4" /> ¿Necesitas servicio técnico?
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </motion.div>

                        {/* Hero visual — Real bike image */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="flex justify-center mt-4 lg:mt-0 lg:justify-end relative z-0"
                        >
                            <div className="relative w-full max-w-[280px] sm:max-w-[400px] lg:max-w-[480px] aspect-square">
                                <div className="absolute inset-0 bg-brand-yellow/20 rounded-full blur-[80px]" />
                                <div className="relative w-full h-full rounded-[2rem] overflow-hidden border border-white/20 shadow-2xl">
                                    <img src="/images/urban-bike.png" alt="Bicicleta Briz" className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-brand-black/60 via-transparent to-transparent" />
                                </div>
                                {/* Floating cards - adjusted for mobile */}
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.6 }}
                                    className="absolute -bottom-4 -left-3 lg:-left-8 glass-dark border border-white/10 rounded-2xl px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-2 sm:gap-3 shadow-xl backdrop-blur-md"
                                >
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-brand-yellow/20 flex items-center justify-center">
                                        <Users className="w-4 h-4 sm:w-5 sm:h-5 text-brand-yellow" />
                                    </div>
                                    <div>
                                        <p className="text-white text-xs sm:text-sm font-bold leading-tight">500+</p>
                                        <p className="text-white/60 text-[9px] sm:text-xs">Clientes felices</p>
                                    </div>
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.8 }}
                                    className="absolute top-4 -right-3 lg:-right-8 glass-dark border border-white/10 rounded-2xl px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-2 sm:gap-3 shadow-xl backdrop-blur-md"
                                >
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                                    </div>
                                    <div>
                                        <p className="text-white text-xs sm:text-sm font-bold leading-tight">Disponible</p>
                                        <p className="text-white/60 text-[9px] sm:text-xs">Reserva ahora</p>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ===== FEATURED SERVICES ===== */}
            <section className="py-24 bg-background">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div {...fadeUp} className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                            Todo para tu experiencia <span className="text-brand-yellow">ciclista</span>
                        </h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Desde alquiler hasta servicio técnico, Briz es tu centro ciclista completo en Cochabamba.
                        </p>
                    </motion.div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { icon: Bike, title: 'Alquiler de Bicicletas', desc: 'Bicis urbanas, montaña, ruta y tándem. Por horas, días o semanas.', href: '/rentals', color: 'text-brand-yellow bg-brand-yellow/10' },
                            { icon: ShoppingBag, title: 'Venta de Bicicletas', desc: 'Las mejores marcas y modelos para cada tipo de ciclista.', href: '/shop', color: 'text-blue-400 bg-blue-400/10' },
                            { icon: Wrench, title: 'Repuestos y Accesorios', desc: 'Cascos, luces, candados, cámaras, cadenas y todo lo que necesitas.', href: '/shop', color: 'text-green-400 bg-green-400/10' },
                            { icon: Shield, title: 'Servicio Técnico', desc: 'Taller profesional: revisiones, reparaciones y mantenimiento.', href: '/service', color: 'text-purple-400 bg-purple-400/10' },
                            { icon: Route, title: 'Rutas en Cochabamba', desc: 'Descubre las mejores rutas urbanas y de montaña de la llajta.', href: '/routes', color: 'text-orange-400 bg-orange-400/10' },
                            { icon: Heart, title: 'Experiencia Premium', desc: 'Atención personalizada, bicicletas impecables y precios justos.', href: '/about', color: 'text-pink-400 bg-pink-400/10' },
                        ].map((service, i) => (
                            <motion.div key={i} {...stagger} transition={{ delay: i * 0.1, duration: 0.5 }}>
                                <Link to={service.href}>
                                    <Card className="group hover:shadow-xl hover:shadow-brand-yellow/5 transition-all duration-300 hover:-translate-y-1 border-border/50 h-full">
                                        <CardContent className="p-6 space-y-4">
                                            <div className={`w-12 h-12 rounded-xl ${service.color} flex items-center justify-center`}>
                                                <service.icon className="w-6 h-6" />
                                            </div>
                                            <h3 className="text-lg font-semibold group-hover:text-brand-yellow transition-colors">{service.title}</h3>
                                            <p className="text-sm text-muted-foreground">{service.desc}</p>
                                            <div className="flex items-center text-brand-yellow text-sm font-medium gap-1 group-hover:gap-2 transition-all">
                                                Explorar <ChevronRight className="w-4 h-4" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== HOW IT WORKS ===== */}
            <section className="py-24 bg-brand-black text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div {...fadeUp} className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                            Simple. Rápido. <span className="text-gradient-yellow">Sin complicaciones.</span>
                        </h2>
                        <p className="text-white/60 max-w-2xl mx-auto">
                            Reserva tu bicicleta en minutos y empieza a explorar Cochabamba.
                        </p>
                    </motion.div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { step: '01', title: 'Elige tu bici', desc: 'Explora nuestro catálogo y elige el tipo de bicicleta ideal para ti.' },
                            { step: '02', title: 'Selecciona duración', desc: 'Por horas, días o semanas. También productos y servicios.' },
                            { step: '03', title: 'Ingresa tus datos', desc: 'Solo nombre, teléfono y CI. Sin registro obligatorio.' },
                            { step: '04', title: '¡A rodar!', desc: 'Confirmamos tu reserva y te esperamos. ¡A explorar la llajta!' },
                        ].map((item, i) => (
                            <motion.div key={i} {...stagger} transition={{ delay: i * 0.15, duration: 0.5 }} className="text-center space-y-4">
                                <div className="w-16 h-16 mx-auto rounded-2xl bg-brand-yellow/10 flex items-center justify-center">
                                    <span className="text-2xl font-bold text-brand-yellow">{item.step}</span>
                                </div>
                                <h3 className="text-lg font-semibold">{item.title}</h3>
                                <p className="text-white/50 text-sm">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== BIKE CATEGORIES ===== */}
            <section className="py-24 bg-background">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div {...fadeUp} className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                            Encuentra tu <span className="text-brand-yellow">bicicleta ideal</span>
                        </h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Variedad de bicicletas para cada estilo, terreno y aventura.
                        </p>
                    </motion.div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { name: 'Urbanas', desc: 'Para la ciudad y el commuting diario', icon: '🏙️', bikes: 3 },
                            { name: 'Montaña', desc: 'Senderos, tierra y aventura off-road', icon: '⛰️', bikes: 2 },
                            { name: 'Ruta', desc: 'Velocidad y rendimiento en asfalto', icon: '🛣️', bikes: 2 },
                            { name: 'Tándem', desc: 'Para compartir la experiencia en pareja', icon: '👫', bikes: 1 },
                            { name: 'Familiar', desc: 'Bicicletas seguras para toda la familia', icon: '👨‍👩‍👧‍👦', bikes: 1 },
                            { name: 'Accesorios', desc: 'Todo lo que necesitas para tu bici', icon: '🔧', bikes: 12 },
                        ].map((cat, i) => (
                            <motion.div key={i} {...stagger} transition={{ delay: i * 0.1, duration: 0.5 }}>
                                <Link to="/rentals">
                                    <Card className="group hover:shadow-lg hover:border-brand-yellow/30 transition-all duration-300 cursor-pointer h-full">
                                        <CardContent className="p-6 flex items-center gap-4">
                                            <div className="text-4xl">{cat.icon}</div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold group-hover:text-brand-yellow transition-colors">{cat.name}</h3>
                                                <p className="text-sm text-muted-foreground">{cat.desc}</p>
                                                <p className="text-xs text-brand-yellow mt-1">{cat.bikes} disponibles</p>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-brand-yellow transition-colors" />
                                        </CardContent>
                                    </Card>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== LOCAL EXPERIENCE ===== */}
            <section className="py-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-black via-brand-charcoal to-brand-black" />
                <div className="absolute inset-0">
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-yellow/5 rounded-full blur-[150px]" />
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-yellow/3 rounded-full blur-[120px]" />
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <motion.div {...fadeUp} className="space-y-8">
                            <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
                                Explora Cochabamba como nunca antes:{' '}
                                <span className="text-gradient-yellow">sobre dos ruedas</span>
                            </h2>
                            <p className="text-white/60 leading-relaxed">
                                Desde el majestuoso Cristo de la Concordia hasta las ciclovías del Prado,
                                Cochabamba es una ciudad perfecta para descubrir en bicicleta. Con Briz,
                                cada pedaleo es una nueva aventura.
                            </p>
                            <ul className="space-y-4">
                                {[
                                    'Ciclovía del Prado — El recorrido clásico de la llajta',
                                    'Ruta al Cristo — Vistas panorámicas inolvidables',
                                    'Valle de Tiquipaya — Naturaleza y aire fresco',
                                    'Circuitos urbanos — Descubre cada rincón',
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-white/70">
                                        <MapPin className="w-5 h-5 text-brand-yellow flex-shrink-0" />
                                        <span className="text-sm">{item}</span>
                                    </li>
                                ))}
                            </ul>
                            <Link to="/routes">
                                <Button className="bg-brand-yellow text-brand-black hover:bg-brand-yellow-light font-semibold">
                                    Ver rutas recomendadas <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </Link>
                        </motion.div>

                        <motion.div {...fadeUp} className="hidden lg:block">
                            <div className="relative w-full aspect-square max-w-md mx-auto rounded-3xl glass border border-white/10 flex items-center justify-center">
                                <div className="text-center space-y-4 p-8">
                                    <MapPin className="w-20 h-20 text-brand-yellow mx-auto" />
                                    <h3 className="text-white font-semibold text-lg">Cochabamba, Bolivia</h3>
                                    <p className="text-white/50 text-sm">
                                        Imagen panorámica de Cochabamba / Cristo de la Concordia — se reemplazará con foto real
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ===== WHY BRIZ ===== */}
            <section className="py-24 bg-background">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div {...fadeUp} className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                            ¿Por qué elegir <span className="text-brand-yellow">Briz</span>?
                        </h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Más que un alquiler de bicicletas — una experiencia local premium.
                        </p>
                    </motion.div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            { icon: MapPin, title: 'Experiencia Local', desc: 'Conocemos cada ruta, calle y sendero de Cochabamba. Te guiamos.' },
                            { icon: Clock, title: 'Reserva Fácil', desc: 'Sin cuentas obligatorias. Reserva en minutos con tu CI y teléfono.' },
                            { icon: Shield, title: 'Bicis Impecables', desc: 'Mantenimiento profesional constante. Cada bici está lista para ti.' },
                            { icon: Wrench, title: 'Taller Profesional', desc: 'Servicio técnico para cualquier bicicleta, no solo las nuestras.' },
                            { icon: Heart, title: 'Atención Amigable', desc: 'Te tratamos como amigo. Asesoría personalizada sin presión.' },
                            { icon: Star, title: 'Precios Justos', desc: 'Tarifas accesibles con opciones por hora, día y semana.' },
                        ].map((item, i) => (
                            <motion.div key={i} {...stagger} transition={{ delay: i * 0.1, duration: 0.5 }} className="flex gap-4">
                                <div className="w-12 h-12 rounded-xl bg-brand-yellow/10 flex items-center justify-center flex-shrink-0">
                                    <item.icon className="w-6 h-6 text-brand-yellow" />
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">{item.title}</h3>
                                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== TESTIMONIALS ===== */}
            <section className="py-24 bg-brand-black text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div {...fadeUp} className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                            Lo que dicen nuestros <span className="text-gradient-yellow">clientes</span>
                        </h2>
                    </motion.div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {testimonials.map((t, i) => (
                            <motion.div key={t.id} {...stagger} transition={{ delay: i * 0.1, duration: 0.5 }}>
                                <div className="glass rounded-2xl p-6 h-full flex flex-col">
                                    <div className="flex gap-1 mb-4">
                                        {Array.from({ length: t.rating }).map((_, j) => (
                                            <Star key={j} className="w-4 h-4 fill-brand-yellow text-brand-yellow" />
                                        ))}
                                    </div>
                                    <p className="text-white/70 text-sm flex-1 mb-4">"{t.content}"</p>
                                    <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                                        <div className="w-10 h-10 rounded-full bg-brand-yellow/20 flex items-center justify-center">
                                            <span className="text-brand-yellow text-xs font-bold">
                                                {t.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">{t.name}</p>
                                            <p className="text-xs text-white/50">{t.role}</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== FAQ ===== */}
            <section className="py-24 bg-background">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div {...fadeUp} className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                            Preguntas <span className="text-brand-yellow">frecuentes</span>
                        </h2>
                    </motion.div>

                    <motion.div {...fadeUp}>
                        <Accordion type="single" collapsible className="space-y-3">
                            {faqs.map((faq, i) => (
                                <AccordionItem key={i} value={`faq-${i}`} className="border border-border/50 rounded-xl px-4 data-[state=open]:border-brand-yellow/30">
                                    <AccordionTrigger className="hover:text-brand-yellow text-left text-sm font-medium py-4">
                                        {faq.question}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-muted-foreground text-sm pb-4">
                                        {faq.answer}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </motion.div>
                </div>
            </section>

            {/* ===== CONTACT CTA ===== */}
            <section className="py-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-brand-black via-brand-charcoal to-brand-black" />
                <div className="absolute inset-0">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-yellow/8 rounded-full blur-[150px]" />
                </div>

                <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div {...fadeUp} className="space-y-8">
                        <h2 className="text-3xl sm:text-4xl font-bold text-white">
                            ¿Listo para <span className="text-gradient-yellow">explorar Cochabamba</span>?
                        </h2>
                        <p className="text-white/60 max-w-xl mx-auto">
                            Reserva tu bicicleta, visita nuestra tienda o contáctanos por WhatsApp.
                            Estamos aquí para ayudarte.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/rentals">
                                <Button size="lg" className="bg-brand-yellow text-brand-black hover:bg-brand-yellow-light font-bold text-base px-8 glow-yellow-strong w-full sm:w-auto">
                                    <Bike className="w-5 h-5 mr-2" /> Reservar Ahora
                                </Button>
                            </Link>
                            <a href="https://wa.me/59177860277" target="_blank" rel="noopener noreferrer">
                                <Button size="lg" className="bg-white text-black border-2 border-white hover:bg-gray-100 hover:text-black font-semibold text-base px-8 w-full sm:w-auto">
                                    <MessageCircle className="w-5 h-5 mr-2" /> WhatsApp
                                </Button>
                            </a>
                            <Link to="/contact">
                                <Button size="lg" className="bg-white text-black border-2 border-white hover:bg-gray-100 hover:text-black font-semibold text-base px-8 w-full sm:w-auto">
                                    <Phone className="w-5 h-5 mr-2" /> Contacto
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}
