import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    Bike, ShoppingBag, Wrench, MapPin, Shield, Clock, Heart, Star,
    ArrowRight, Route, MessageCircle, CalendarDays, Sparkles
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

export default function HomePage() {
    return (
        <div className="overflow-hidden">
            {/* ===== HERO SECTION ===== */}
            <section className="relative min-h-[90svh] flex flex-col justify-center overflow-hidden pb-16 pt-28">
                <div className="absolute inset-0 z-0">
                    <img src="/hero-principal.png" alt="" className="hidden sm:block w-full h-full object-cover" />
                    <img src="/hero-principal-celular.jpg" alt="" className="block sm:hidden w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-b from-brand-black/60 via-brand-black/40 to-brand-black/70" />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="space-y-5 text-center sm:text-left max-w-3xl"
                    >
                        <div className="inline-block transform -rotate-2">
                            <span className="sticker text-brand-black text-xs sm:text-sm font-black uppercase tracking-widest border-2 border-brand-black">
                                <Sparkles className="w-4 h-4 text-brand-black" /> Cochabamba en Movimiento
                            </span>
                        </div>

                        <h1 className="font-tan text-white drop-shadow-lg">
                            <span className="text-xl sm:text-3xl md:text-4xl block uppercase leading-relaxed">¡VIVE LA EXPERIENCIA</span>
                            <span className="text-3xl sm:text-5xl md:text-6xl block text-brand-yellow drop-shadow-[0_4px_20px_rgba(255,210,0,0.5)] mt-1 uppercase leading-tight">
                                BRIZ!
                            </span>
                        </h1>

                        <p className="font-gochi text-lg sm:text-2xl text-brand-yellow drop-shadow-md">
                            "Porque con Briz, eres feliz 🚲"
                        </p>

                        <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
                            <Link to="/rentals" className="w-full sm:w-auto">
                                <Button size="lg" className="h-12 sm:h-14 px-8 sm:px-10 text-base sm:text-lg font-black w-full shadow-[0_6px_24px_rgba(255,210,0,0.5)] hover:shadow-[0_10px_32px_rgba(255,210,0,0.65)]">
                                    RESERVA YA <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                            </Link>
                            <p className="font-maiandra text-white/70 leading-snug text-sm">
                                Sin complicaciones, ¡solo pedaleá!
                            </p>
                        </div>
                    </motion.div>
                </div>

                {/* Categories Bar - Redesigned as bold stickers */}
                <div className="relative z-20 w-full mt-20 sm:mt-24 px-4 overflow-visible">
                    <div className="max-w-7xl mx-auto flex flex-wrap justify-center gap-4 sm:gap-8">
                        {[
                            { title: 'ALQUILER', icon: Bike, color: 'bg-brand-yellow', rot: '-2deg', href: '/rentals' },
                            { title: 'TIENDA', icon: ShoppingBag, color: 'bg-brand-pink', rot: '1deg', textColor: 'text-white', href: '/shop' },
                            { title: 'CICLOTOURS', icon: Route, color: 'bg-brand-cyan', rot: '-1deg', textColor: 'text-white', href: '/routes' },
                            { title: 'EVENTOS', icon: CalendarDays, color: 'bg-brand-orange', rot: '2deg', textColor: 'text-white', href: '/contact' },
                            { title: 'MECÁNICA', icon: Wrench, color: 'bg-brand-emerald', rot: '-1.5deg', textColor: 'text-white', href: '/service' },
                        ].map((cat, i) => (
                            <motion.div
                                key={cat.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 + (i * 0.1) }}
                                whileHover={{ scale: 1.05, rotate: 0, zIndex: 30 }}
                                className="group cursor-pointer"
                            >
                                <Link to={cat.href}>
                                    <div className={`${cat.color} ${cat.textColor || 'text-brand-black'} border-3 border-brand-black rounded-xl px-3 py-2 sm:px-6 sm:py-4 shadow-[4px_4px_0px_rgba(0,0,0,1)] group-hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)] group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-200 flex items-center gap-2 sm:gap-3`} style={{ transform: `rotate(${cat.rot})` }}>
                                        <cat.icon className="w-4 h-4 sm:w-6 sm:h-6" strokeWidth={2} />
                                        <span className="font-tan text-sm sm:text-lg tracking-tighter uppercase">{cat.title}</span>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>



            {/* ===== PREMIUM SERVICES / EXPERIENCES ===== */}
            <section className="py-24 bg-background relative z-10 w-full overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div {...fadeUp} className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-tan text-brand-black mb-4 drop-shadow-sm leading-tight uppercase">
                            NUESTRAS <span className="marker-highlight marker-highlight-cyan px-2">EXPERIENCIAS</span>
                        </h2>
                        <div className="inline-block bg-brand-yellow/20 px-6 py-2 rounded-full transform rotate-1 mt-4 border border-brand-yellow/30">
                            <p className="text-base sm:text-lg text-brand-charcoal font-maiandra tracking-wide">
                                Explora todo lo que Briz tiene para ti
                            </p>
                        </div>
                    </motion.div>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-50px' }}
                        variants={{
                            hidden: { opacity: 0 },
                            visible: {
                                opacity: 1,
                                transition: {
                                    staggerChildren: 0.1
                                }
                            }
                        }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8"
                    >
                        {[
                            {
                                title: 'ALQUILER DE BICIS',
                                desc: 'Rápido, fácil y divertido',
                                btnText: 'VER MÁS',
                                href: '/rentals',
                                btnVariant: 'default',
                                bgColor: 'bg-brand-yellow',
                                textColor: 'text-brand-black',
                                rot: '-1deg'
                            },
                            {
                                title: 'TIENDA BRIZ',
                                desc: 'Accesorios & Repuestos',
                                btnText: 'COMPRAR',
                                href: '/shop',
                                btnVariant: 'primary',
                                bgColor: 'bg-brand-pink',
                                textColor: 'text-white',
                                rot: '2deg'
                            },
                            {
                                title: 'CICLOTOURS',
                                desc: 'Descubre Cochabamba',
                                btnText: 'EXPLORAR',
                                href: '/routes',
                                btnVariant: 'accent',
                                bgColor: 'bg-brand-cyan',
                                textColor: 'text-white',
                                rot: '-2deg'
                            },
                            {
                                title: 'EVENTOS',
                                desc: 'Grupos & Aventuras',
                                btnText: 'RESERVAR',
                                href: '/contact',
                                btnVariant: 'secondary',
                                bgColor: 'bg-brand-orange',
                                textColor: 'text-white',
                                rot: '1.5deg'
                            },
                        ].map((service) => (
                            <motion.div
                                key={service.title}
                                variants={{
                                    hidden: { opacity: 0, y: 30 },
                                    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
                                }}
                                whileHover={{ scale: 1.02, rotate: 0 }}
                                className="relative group"
                            >
                                <div className={`h-full border-3 border-brand-black rounded-2xl ${service.bgColor} p-5 sm:p-6 shadow-[6px_6px_0px_rgba(0,0,0,1)] group-hover:shadow-none group-hover:translate-x-1 group-hover:translate-y-1 transition-all duration-200 flex flex-col`} style={{ transform: `rotate(${service.rot})` }}>
                                    <h3 className={`text-base sm:text-lg font-tan ${service.textColor} mb-3 leading-tight uppercase`}>{service.title}</h3>
                                    <p className={`font-maiandra text-sm sm:text-base ${service.textColor === 'text-white' ? 'text-white/80' : 'text-brand-black/80'} mb-6 flex-grow`}>
                                        {service.desc}
                                    </p>
                                    <Link to={service.href}>
                                        <Button variant={service.btnVariant as any} className="w-full h-10 text-sm font-black tracking-tight" size="lg">
                                            {service.btnText}
                                        </Button>
                                    </Link>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ===== HOW IT WORKS ===== */}
            <section className="py-24 sm:py-32 bg-white relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <motion.div {...fadeUp} className="text-center mb-16 sm:mb-20">
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-tan text-brand-black mb-4 leading-tight uppercase">
                            RESERVAR ES <span className="text-brand-black bg-brand-yellow px-4 py-1 mt-2 inline-block border-3 border-brand-black rounded-xl shadow-[6px_6px_0px_rgba(0,0,0,1)] -rotate-1">¡PAN COMIDO!</span>
                        </h2>
                        <p className="text-brand-charcoal/70 text-lg sm:text-xl max-w-2xl mx-auto font-cocon mt-6">
                            Reserva tu bicicleta en minutos y empieza a explorar Cochabamba.
                        </p>
                    </motion.div>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-50px' }}
                        variants={{
                            hidden: { opacity: 0 },
                            visible: {
                                opacity: 1,
                                transition: {
                                    staggerChildren: 0.1
                                }
                            }
                        }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-10"
                    >
                        {[
                            { step: '01', title: 'Elige tu bici', desc: 'Explora nuestro catálogo y elige el tipo de bicicleta ideal para ti.' },
                            { step: '02', title: 'Selecciona duración', desc: 'Por horas, días o semanas. También productos y servicios.' },
                            { step: '03', title: 'Ingresa tus datos', desc: 'Solo nombre, teléfono y CI. Sin registro obligatorio.' },
                            { step: '04', title: '¡A rodar!', desc: 'Confirmamos tu reserva y te esperamos. ¡Vamos a explorar Cochabamba!' },
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                variants={{
                                    hidden: { opacity: 0, y: 20 },
                                    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
                                }}
                                className="relative group"
                            >
                                <div className="bg-gray-50 rounded-[2.5rem] p-8 sm:p-10 text-center h-full border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)] transition-all duration-400 hover:-translate-y-2">
                                    <div className="w-20 h-20 mx-auto rounded-[1.5rem] bg-white shadow-sm flex items-center justify-center mb-6 border border-gray-100 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-400">
                                        <span className="text-3xl font-black text-brand-yellow drop-shadow-sm">{item.step}</span>
                                    </div>
                                    <h3 className="text-xl sm:text-2xl font-black text-brand-charcoal mb-3 tracking-tight">{item.title}</h3>
                                    <p className="text-gray-500 text-sm sm:text-base leading-relaxed font-medium">{item.desc}</p>
                                </div>
                                {i !== 3 && (
                                    <div className="hidden lg:block absolute top-1/2 -right-10 w-20 h-[2px] bg-gradient-to-r from-gray-200 to-transparent z-0" />
                                )}
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ===== BIKE CATEGORIES ===== */}
            <section className="py-24 sm:py-32 bg-brand-beige relative overflow-hidden">
                {/* Collage deco */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-yellow/30 rounded-bl-[8rem] -translate-y-16 translate-x-8 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-pink/10 rounded-tr-[6rem] translate-y-10 -translate-x-6 pointer-events-none" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <motion.div {...fadeUp} className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
                        <div className="max-w-xl">
                            <div className="inline-block transform -rotate-1 mb-4">
                                <span className="sticker text-brand-black text-xs font-black uppercase">Nuestras bicicletas</span>
                            </div>
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-tan text-brand-black leading-tight tracking-tight uppercase">
                                ENCUENTRA TU <span className="text-brand-yellow">BICICLETA IDEAL</span>
                            </h2>
                            <p className="text-brand-charcoal/70 font-maiandra text-lg mt-4">
                                Variedad de bicis para cada estilo, terreno y aventura en Cochabamba.
                            </p>
                        </div>
                        <Link to="/rentals" className="shrink-0">
                            <Button size="lg" className="font-black text-base">
                                Ver Catálogo Completo <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                    </motion.div>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-50px' }}
                        variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
                        className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
                    >
                        {[
                            { name: 'Urbanas', desc: 'Para la ciudad y el commuting diario', icon: MapPin, accentBg: 'bg-brand-yellow', tag: 'MÁS POPULAR' },
                            { name: 'Montaña', desc: 'Senderos, tierra y aventura off-road', icon: Route, accentBg: 'bg-brand-cyan', tag: null },
                            { name: 'Ruta', desc: 'Velocidad y rendimiento en asfalto', icon: Bike, accentBg: 'bg-brand-cyan', tag: null },
                            { name: 'Tándem', desc: 'Para compartir la experiencia en pareja', icon: Heart, accentBg: 'bg-brand-orange', tag: 'ESPECIAL' },
                            { name: 'Infantil', desc: 'Bicicletas seguras para los más pequeños', icon: Shield, accentBg: 'bg-brand-emerald', tag: null },
                            { name: 'Accesorios', desc: 'Cascos, candados y más para tu bici', icon: Wrench, accentBg: 'bg-brand-charcoal', tag: null },
                        ].map((cat, i) => (
                            <motion.div
                                key={i}
                                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45 } } }}
                                whileHover={{ y: -4 }}
                            >
                                <Link to="/rentals">
                                    <div className="bg-white border border-gray-100 rounded-[2rem] p-6 sm:p-8 flex items-center gap-5 h-full shadow-sm hover:shadow-[0_12px_32px_rgba(255,210,0,0.18)] hover:border-brand-yellow/40 transition-all duration-300 group relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-full h-1.5 rounded-t-[2rem] " style={{ background: 'transparent' }} />
                                        <div className={`w-14 h-14 sm:w-16 sm:h-16 ${cat.accentBg} rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                                            <cat.icon className="w-7 h-7 text-white" strokeWidth={1.8} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-tan text-xl sm:text-2xl text-brand-black leading-tight">{cat.name}</h3>
                                                {cat.tag && <span className="text-[9px] font-black uppercase tracking-widest bg-brand-yellow text-brand-black px-2 py-0.5 rounded-full">{cat.tag}</span>}
                                            </div>
                                            <p className="text-sm text-brand-charcoal/60 font-cocon font-bold leading-snug">{cat.desc}</p>
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-brand-yellow group-hover:translate-x-1 transition-all duration-300 flex-shrink-0" strokeWidth={2} />
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>


            {/* ===== LOCAL EXPERIENCE / ROUTES PROMO ===== */}
            <section className="py-24 sm:py-32 bg-brand-charcoal text-white relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-brand-yellow/10 rounded-full blur-[120px] mix-blend-screen" />
                    <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-brand-cyan/10 rounded-full blur-[100px] mix-blend-screen" />
                </div>
                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Text side */}
                        <motion.div {...fadeUp} className="space-y-8">
                            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-yellow/10 border border-brand-yellow/20">
                                <MapPin className="w-4 h-4 text-brand-yellow" strokeWidth={1.5} />
                                <span className="text-xs font-black text-brand-yellow tracking-widest uppercase">Cochabamba, Bolivia</span>
                            </div>
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-tan text-white leading-tight tracking-tight uppercase">
                                EXPLORA LA LLAJTA <span className="text-brand-yellow">SOBRE DOS RUEDAS</span>
                            </h2>
                            <p className="text-white/70 leading-relaxed text-xl font-cocon max-w-lg">
                                Desde el majestuoso Cristo de la Concordia hasta las ciclovías del Prado, Cochabamba es perfecta para descubrir en bicicleta.
                            </p>
                            <ul className="space-y-4">
                                {[
                                    'Ciclovía del Prado — El recorrido clásico de la llajta',
                                    'Ruta al Cristo — Vistas panorámicas inolvidables',
                                    'Valle de Tiquipaya — Naturaleza y aire fresco',
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-4 text-white/80 font-cocon font-bold">
                                        <div className="w-8 h-8 rounded-full bg-brand-yellow flex items-center justify-center flex-shrink-0 text-brand-black font-black text-sm shadow-md">✓</div>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                            <Link to="/routes">
                                <Button size="lg" className="h-14 px-8 font-black text-base">
                                    Ver rutas recomendadas <Route className="w-5 h-5 ml-2" />
                                </Button>
                            </Link>
                        </motion.div>

                        {/* Image side — placeholder for route photo */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="relative"
                        >
                            <div className="absolute inset-0 bg-brand-yellow/20 rounded-[3rem] blur-3xl transform rotate-2 scale-105" />
                            <div className="relative aspect-[4/3] rounded-[3rem] overflow-hidden border-4 border-white/10 shadow-2xl z-10">
                                {/* TODO: Replace with /images/routes/cochabamba-routes.jpg when provided */}
                                <motion.div
                                    className="absolute inset-0 bg-[url('/images/cristo.jpg')] bg-cover bg-center"
                                    whileHover={{ scale: 1.05 }}
                                    transition={{ duration: 1.5, ease: 'easeOut' }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-brand-charcoal/70 via-transparent to-transparent" />
                                <div className="absolute bottom-6 left-6 right-6">
                                    <Link to="/routes">
                                        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl flex items-center gap-4 cursor-pointer hover:-translate-y-1 transition-transform duration-300">
                                            <div className="w-12 h-12 rounded-xl bg-brand-yellow flex items-center justify-center shadow-md flex-shrink-0">
                                                <MapPin className="w-6 h-6 text-brand-black" strokeWidth={2} />
                                            </div>
                                            <div>
                                                <p className="text-brand-charcoal font-black text-base leading-tight">Cristo de la Concordia</p>
                                                <p className="text-gray-500 text-sm font-cocon font-bold">Ruta de montaña • 5km</p>
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>


            {/* ===== WHY BRIZ ===== */}
            <section id="preguntas-frecuentes" className="scroll-mt-28 py-24 sm:py-32 bg-brand-beige relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-80 h-80 bg-brand-yellow/20 rounded-full blur-[80px] pointer-events-none" />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <motion.div {...fadeUp} className="text-center mb-16 sm:mb-20">
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-tan text-brand-black mb-4 leading-tight uppercase">
                            ¿POR QUÉ ELEGIR <span className="text-brand-yellow">BRIZ</span>?
                        </h2>
                        <p className="text-brand-charcoal/70 text-lg sm:text-xl max-w-2xl mx-auto font-cocon">
                            Más que alquiler de bicicletas — somos tu centro integral para una experiencia ciclista premium.
                        </p>
                    </motion.div>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-50px' }}
                        variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
                        className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
                    >
                        {[
                            { icon: MapPin, title: 'Experiencia Local', desc: 'Conocemos cada ruta, calle y sendero de Cochabamba. Te guiamos como verdaderos locales.', accent: 'bg-brand-yellow' },
                            { icon: Clock, title: 'Reserva Fácil', desc: 'Sin cuentas engorrosas. Reserva en minutos solo con tu documento de identidad.', accent: 'bg-brand-cyan' },
                            { icon: Shield, title: 'Bicis Impecables', desc: 'Mantenimiento profesional constante. Tu seguridad y comodidad son nuestra prioridad.', accent: 'bg-brand-emerald' },
                            { icon: Wrench, title: 'Taller Profesional', desc: 'Expertos cuidando tu bicicleta. Servicio técnico para todas las marcas y modelos.', accent: 'bg-brand-orange' },
                            { icon: Heart, title: 'Atención Amigable', desc: 'Te tratamos como familia. Asesoría personalizada y buena onda siempre.', accent: 'bg-brand-pink' },
                            { icon: Star, title: 'Precios Justos', desc: 'Calidad superior con tarifas accesibles por hora, día o semana.', accent: 'bg-brand-cyan' },
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
                                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                            >
                                <div className="bg-white border border-gray-100 rounded-[2rem] p-8 h-full shadow-sm hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] hover:border-brand-yellow/30 transition-all duration-300 group flex flex-col gap-5 relative overflow-hidden">
                                    <div className={`absolute top-0 left-0 w-full h-1.5 ${item.accent} rounded-t-[2rem]`} />
                                    <div className={`w-14 h-14 ${item.accent} rounded-2xl flex items-center justify-center shadow-md flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                                        <item.icon className="w-7 h-7 text-white" strokeWidth={1.8} />
                                    </div>
                                    <div>
                                        <h3 className="font-tan text-sm sm:text-base text-brand-black mb-2 leading-tight uppercase">{item.title}</h3>
                                        <p className="text-brand-charcoal/65 font-maiandra text-base leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>


            {/* ===== TESTIMONIALS ===== */}
            <section className="py-24 sm:py-32 bg-brand-charcoal text-white relative overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-1/4 -right-32 w-[500px] h-[500px] bg-brand-yellow/10 rounded-full blur-[100px]" />
                    <div className="absolute bottom-[-10%] -left-32 w-[400px] h-[400px] bg-brand-pink/5 rounded-full blur-[100px]" />
                </div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <motion.div {...fadeUp} className="text-center mb-16 sm:mb-20 space-y-4">
                        <div className="inline-block transform rotate-1">
                            <span className="sticker text-brand-black text-xs font-black uppercase">Nuestros ciclistas</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-tan text-white leading-tight uppercase">
                            LO QUE DICEN QUIENES <span className="text-brand-yellow">YA RODARON CON NOSOTROS</span>
                        </h2>
                    </motion.div>
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-50px' }}
                        variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.12 } } }}
                        className="grid md:grid-cols-3 gap-6 sm:gap-8"
                    >
                        {testimonials.map((t, i) => (
                            <motion.div
                                key={i}
                                variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
                                whileHover={{ y: -6, rotate: i % 2 === 0 ? 1 : -1, transition: { duration: 0.2 } }}
                            >
                                <Card className="h-full bg-white rounded-[2.5rem] border-0 shadow-lg hover:shadow-[0_20px_50px_rgba(255,210,0,0.2)] transition-all duration-500 relative overflow-hidden group">
                                    <div className="absolute top-0 left-0 w-full h-1.5 bg-brand-yellow rounded-t-[2.5rem]" />
                                    <CardContent className="p-8 sm:p-10 flex flex-col h-full relative z-10">
                                        <div className="text-5xl font-tan text-brand-yellow leading-none mb-4">"</div>
                                        <p className="text-brand-charcoal/80 font-cocon font-bold text-lg leading-relaxed mb-8 flex-1">{t.content}</p>
                                        <div className="flex items-center gap-3 pt-6 border-t border-gray-100">
                                            <div className="w-12 h-12 rounded-full bg-brand-yellow flex items-center justify-center font-tan text-brand-black text-xl shadow-md">
                                                {t.name[0]}
                                            </div>
                                            <div>
                                                <h4 className="font-black text-brand-charcoal">{t.name}</h4>
                                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{t.role}</p>
                                            </div>
                                            <div className="ml-auto flex gap-0.5">
                                                {[...Array(5)].map((_, j) => (
                                                    <Star key={j} className="w-4 h-4 text-brand-yellow" strokeWidth={1.5} />
                                                ))}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>


            {/* ===== FAQ ===== */}
            <section className="py-24 sm:py-32 bg-brand-beige relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[500px] bg-brand-yellow/5 rounded-full blur-[100px] pointer-events-none" />
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <motion.div {...fadeUp} className="text-center mb-16 space-y-4">
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-tan text-brand-black leading-tight uppercase">
                            PREGUNTAS <span className="text-brand-yellow">FRECUENTES</span>
                        </h2>
                        <div className="w-20 h-1.5 bg-brand-yellow mx-auto rounded-full" />
                        <p className="text-brand-charcoal/70 font-cocon text-lg">Todo lo que necesitas saber antes de pedalear.</p>
                    </motion.div>
                    <motion.div {...fadeUp}>
                        <Accordion type="single" collapsible className="space-y-4">
                            {faqs.slice(0, 5).map((faq, i) => (
                                <AccordionItem key={i} value={`faq-${i}`} className="bg-white border border-gray-100 rounded-[2rem] px-8 data-[state=open]:border-brand-yellow/50 data-[state=open]:bg-brand-yellow/5 data-[state=open]:shadow-lg transition-all overflow-hidden">
                                    <AccordionTrigger className="hover:text-brand-yellow hover:no-underline text-left text-lg sm:text-xl font-black py-6 !no-underline font-cocon">
                                        {faq.question}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-brand-charcoal/70 font-cocon font-bold text-base pb-6 leading-relaxed">
                                        {faq.answer}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </motion.div>
                </div>
            </section>


            {/* ===== CONTACT CTA ===== */}
            <section className="py-24 sm:py-32 bg-white relative overflow-hidden">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-brand-black rounded-[3rem] sm:rounded-[4rem] p-10 sm:p-16 lg:p-20 text-center relative overflow-hidden shadow-2xl">
                        <div className="absolute inset-0 z-0 pointer-events-none">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[400px] bg-brand-yellow/25 rounded-full blur-[120px]" />
                            <div className="absolute top-[-20%] right-[-10%] w-80 h-80 bg-brand-pink/15 rounded-full blur-[100px]" />
                            {/* Collage deco */}
                            <div className="absolute top-8 left-8 w-24 h-24 border-4 border-brand-yellow/20 rounded-full" />
                            <div className="absolute bottom-8 right-8 w-16 h-16 bg-brand-yellow/10 rotate-45" />
                        </div>
                        <div className="relative z-10 space-y-10">
                            <div className="space-y-6">
                                <div className="inline-block transform -rotate-1">
                                    <span className="sticker text-brand-black text-xs font-black uppercase">¡Te esperamos!</span>
                                </div>
                                <h2 className="text-3xl sm:text-4xl md:text-5xl font-tan text-white leading-tight uppercase">
                                    ¿LISTO PARA <span className="text-brand-yellow">RODAR</span>?
                                </h2>
                                <p className="text-white/80 text-xl sm:text-2xl font-cocon max-w-2xl mx-auto">
                                    Únete a la comunidad ciclista más vibrante de Cochabamba. Alquila, compra o repara con los mejores.
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-5 justify-center pt-4">
                                <Link to="/rentals">
                                    <Button size="lg" className="h-16 px-10 text-lg font-black w-full sm:w-auto shadow-[0_8px_28px_rgba(255,210,0,0.5)]">
                                        Alquilar una bici
                                    </Button>
                                </Link>
                                <a href="https://wa.me/59177860277" target="_blank" rel="noopener noreferrer">
                                    <Button variant="outline" size="lg" className="h-16 px-10 rounded-full bg-white/10 border-white/20 text-white hover:bg-white hover:text-brand-black font-black text-lg backdrop-blur-sm w-full sm:w-auto">
                                        <MessageCircle className="w-5 h-5 mr-2" strokeWidth={1.5} /> Consultar por WhatsApp
                                    </Button>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

        </div>
    );
}
