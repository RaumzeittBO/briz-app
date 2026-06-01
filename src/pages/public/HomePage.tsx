import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    ArrowRight,
    Bike,
    ChevronLeft,
    ChevronRight,
    Headphones,
    Map,
    Route,
    Shield,
    Sparkles,
    Star,
    Users,
} from 'lucide-react';

/* ───────── animation presets ───────── */
const fadeUp = {
    initial: { opacity: 0, y: 28 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.18 },
    transition: { duration: 0.6, ease: 'easeOut' as const },
};

const stagger = {
    initial: { opacity: 0, y: 22 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.12 },
};


/* ───────── data ───────── */
const services = [
    { icon: Bike, title: 'Alquiler', subtitle: 'de bicicletas', color: '#FFD200', bg: 'bg-[#FFF6D0]' },
    { icon: Route, title: 'Rutas', subtitle: 'para todos', color: '#52CD7B', bg: 'bg-[#E3F9EB]' },
    { icon: Sparkles, title: 'Experiencias', subtitle: 'únicas', color: '#FD7B2C', bg: 'bg-[#FFF0E4]' },
    { icon: Shield, title: 'Seguridad', subtitle: 'garantizada', color: '#24A9C5', bg: 'bg-[#E0F5FA]' },
    { icon: Headphones, title: 'Soporte 24/7', subtitle: 'estamos contigo', color: '#FA0E95', bg: 'bg-[#FDE6F3]' },
];

const experiences = [
    {
        title: 'Ciclotours',
        subtitle: 'Aventura y naturaleza',
        image: '/images/cristo.jpg',
        color: '#FFD200',
        href: '/routes',
    },
    {
        title: 'En familia',
        subtitle: 'Diversión para todos',
        image: '/hero-nosotros-computadora.jpg',
        color: '#52CD7B',
        href: '/routes',
    },
    {
        title: 'Paseos urbanos',
        subtitle: 'Descubre la ciudad',
        image: '/hero-tienda-computadora.jpg',
        color: '#FD7B2C',
        href: '/routes',
    },
    {
        title: 'Para todos',
        subtitle: 'Sin límites de edad',
        image: '/hero-alquiler-computadora.jpg',
        color: '#24A9C5',
        href: '/rentals',
    },
];

const stats = [
    { icon: Bike, value: '+1,500', label: 'Bicicletas disponibles', color: '#FFD200' },
    { icon: Map, value: '25+', label: 'Rutas increíbles', color: '#52CD7B' },
    { icon: Users, value: '10K+', label: 'Personas felices', color: '#FD7B2C' },
    { icon: Shield, value: '100%', label: 'Seguridad garantizada', color: '#24A9C5' },
];

/* ═══════════════════════════════════════ */
/*            HERO SECTION                 */
/* ═══════════════════════════════════════ */
function HeroSection() {
    return (
        <section className="relative min-h-[92vh] w-full overflow-hidden bg-brand-beige pt-[73px] lg:pt-[88px]">
            {/* Background artwork image — the brand collage */}
            <div className="absolute inset-0 pt-[73px] lg:pt-[88px]">
                <picture>
                    <source media="(max-width: 767px)" srcSet="/menu-principal-celular/1.webp" />
                    <img
                        src="/menu-principal-web/1.webp"
                        alt="Briz — Una bicicleta. Un ciclo de expresiones infinitas."
                        className="h-full w-full object-cover object-top"
                        decoding="async"
                        fetchPriority="high"
                        loading="eager"
                    />
                </picture>
            </div>

            {/* Gradient overlays for text legibility */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-brand-beige/90 via-brand-beige/50 to-transparent md:via-brand-beige/30" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-beige via-transparent to-transparent" />

            {/* Hero content overlay */}
            <div className="relative z-10 mx-auto flex min-h-[calc(92vh-73px)] max-w-[1480px] items-end px-5 pb-16 sm:items-center sm:px-8 lg:min-h-[calc(92vh-88px)] lg:px-12">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                    className="max-w-xl space-y-6 lg:max-w-lg"
                >
                    {/* Badge */}
                    <motion.span
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.25, duration: 0.4 }}
                        className="inline-flex items-center gap-2 rounded-full border-2 border-brand-yellow bg-white/80 px-4 py-1.5 font-maiandra text-xs font-bold uppercase tracking-wider text-brand-black shadow-sm backdrop-blur-sm"
                    >
                        <Bike className="h-4 w-4 text-brand-yellow" strokeWidth={2.5} />
                        Centro de la Bicicleta
                    </motion.span>

                    {/* Supporting text */}
                    <div className="rounded-2xl bg-brand-beige/60 p-4 backdrop-blur-sm sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
                        <p className="font-cocon text-lg font-bold leading-relaxed text-brand-black/80 sm:text-xl lg:text-2xl">
                            Alquila, recorre y vive experiencias únicas sobre dos ruedas.
                        </p>
                    </div>

                    {/* CTA buttons */}
                    <div className="flex flex-wrap gap-3">
                        <Link
                            to="/rentals"
                            className="group inline-flex items-center gap-2 rounded-full border-2 border-brand-black bg-brand-yellow px-6 py-3 font-cocon text-sm font-bold text-brand-black shadow-[3px_3px_0px_rgba(0,0,0,0.9)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[4px_5px_0px_rgba(0,0,0,0.9)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:px-7 sm:py-3.5 sm:text-base"
                        >
                            Alquilar bicicleta
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
                        </Link>
                        <Link
                            to="/routes"
                            className="group inline-flex items-center gap-2 rounded-full border-2 border-brand-black bg-white px-6 py-3 font-cocon text-sm font-bold text-brand-black shadow-[3px_3px_0px_rgba(0,0,0,0.9)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[4px_5px_0px_rgba(0,0,0,0.9)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:px-7 sm:py-3.5 sm:text-base"
                        >
                            Explorar rutas
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
                        </Link>
                    </div>

                    {/* Social proof */}
                    <div className="flex items-center gap-3 pt-2">
                        {/* Overlapping avatars */}
                        <div className="flex -space-x-2.5">
                            {[
                                'bg-brand-yellow',
                                'bg-brand-cyan',
                                'bg-[#52CD7B]',
                                'bg-brand-orange',
                            ].map((bg, i) => (
                                <div
                                    key={i}
                                    className={`flex h-9 w-9 items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white shadow-sm ${bg}`}
                                >
                                    {['MF', 'CQ', 'AB', 'RM'][i]}
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col">
                            <div className="flex gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="h-3.5 w-3.5 fill-brand-yellow text-brand-yellow" strokeWidth={0} />
                                ))}
                            </div>
                            <span className="font-maiandra text-xs font-bold text-brand-black/60">
                                +1,250 aventureros felices
                            </span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

/* ═══════════════════════════════════════ */
/*         SERVICE FEATURE STRIP           */
/* ═══════════════════════════════════════ */
function ServiceStrip() {
    return (
        <section className="relative z-20 -mt-12 px-4 sm:-mt-16 sm:px-6 lg:-mt-20 lg:px-8">
            <motion.div
                {...fadeUp}
                className="mx-auto max-w-[1200px] rounded-3xl bg-white p-4 shadow-[0_8px_40px_rgba(0,0,0,0.08)] sm:p-6 lg:rounded-[2rem] lg:p-8"
            >
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
                    {services.map((service, i) => {
                        const Icon = service.icon;
                        return (
                            <motion.div
                                key={service.title}
                                initial={{ opacity: 0, y: 18 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.08, duration: 0.45 }}
                                className="group flex flex-col items-center gap-2.5 rounded-2xl p-4 text-center transition-all duration-200 hover:bg-brand-beige/50 sm:p-5"
                            >
                                <div
                                    className={`flex h-14 w-14 items-center justify-center rounded-full ${service.bg} transition-transform duration-200 group-hover:scale-110 sm:h-16 sm:w-16`}
                                >
                                    <Icon className="h-7 w-7 sm:h-8 sm:w-8" style={{ color: service.color }} strokeWidth={2} />
                                </div>
                                <div>
                                    <p className="font-tangkiwood text-sm font-bold text-brand-black sm:text-base">
                                        {service.title}
                                    </p>
                                    <p className="font-maiandra text-xs text-brand-black/50">
                                        {service.subtitle}
                                    </p>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </motion.div>
        </section>
    );
}

/* ═══════════════════════════════════════ */
/*         EXPERIENCE SECTION              */
/* ═══════════════════════════════════════ */
function ExperienceSection() {
    return (
        <section id="experiencias" className="bg-brand-beige py-16 sm:py-20 lg:py-24">
            <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-12">
                {/* Header */}
                <motion.div {...fadeUp} className="mb-10 flex items-end justify-between gap-4 sm:mb-14">
                    <div className="relative">
                        {/* Decorative dotted arc */}
                        <svg
                            className="absolute -right-12 -top-4 hidden h-10 w-24 text-brand-yellow/50 sm:block"
                            viewBox="0 0 96 40"
                            fill="none"
                        >
                            <path
                                d="M2 38C20 10 50 2 94 8"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeDasharray="5 5"
                                strokeLinecap="round"
                            />
                        </svg>
                        <h2 className="font-tan text-3xl text-brand-black sm:text-4xl lg:text-5xl">
                            Elige tu experiencia
                        </h2>
                    </div>
                    <div className="hidden gap-2 sm:flex">
                        <button
                            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-brand-yellow bg-white text-brand-black transition-colors hover:bg-brand-yellow"
                            aria-label="Anterior"
                        >
                            <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
                        </button>
                        <button
                            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-brand-yellow bg-brand-yellow text-brand-black transition-colors hover:bg-brand-yellow/80"
                            aria-label="Siguiente"
                        >
                            <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
                        </button>
                    </div>
                </motion.div>

                {/* Cards grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
                    {experiences.map((exp, i) => (
                        <motion.div
                            key={exp.title}
                            {...stagger}
                            transition={{ delay: i * 0.1, duration: 0.5 }}
                        >
                            <Link
                                to={exp.href}
                                className="group relative block aspect-[3/4] overflow-hidden rounded-3xl shadow-lg transition-transform duration-300 hover:scale-[1.02] hover:shadow-xl sm:aspect-[4/5]"
                            >
                                {/* Image */}
                                <img
                                    src={exp.image}
                                    alt={exp.title}
                                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    loading="lazy"
                                    decoding="async"
                                />
                                {/* Gradient overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                                {/* Top-left icon badge */}
                                <div
                                    className="absolute left-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/30 sm:left-4 sm:top-4 sm:h-11 sm:w-11"
                                    style={{ backgroundColor: exp.color }}
                                >
                                    <Route className="h-5 w-5 text-white" strokeWidth={2} />
                                </div>

                                {/* Bottom content */}
                                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                                    <h3 className="font-tangkiwood text-xl font-bold text-white drop-shadow-md sm:text-2xl">
                                        {exp.title}
                                    </h3>
                                    <p className="font-cocon text-sm text-white/80">
                                        {exp.subtitle}
                                    </p>
                                </div>

                                {/* Bottom-right arrow */}
                                <div className="absolute bottom-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-all group-hover:bg-white group-hover:text-brand-black sm:bottom-5 sm:right-5">
                                    <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ═══════════════════════════════════════ */
/*            STATS STRIP                  */
/* ═══════════════════════════════════════ */
function StatsStrip() {
    return (
        <section className="bg-brand-beige px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            <motion.div
                {...fadeUp}
                className="mx-auto max-w-[1100px] rounded-3xl border border-brand-yellow/20 bg-white p-6 shadow-sm sm:p-8 lg:rounded-[2rem] lg:p-10"
            >
                <div className="grid grid-cols-2 gap-6 lg:grid-cols-4 lg:gap-8">
                    {stats.map((stat, i) => {
                        const Icon = stat.icon;
                        return (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1, duration: 0.45 }}
                                className="flex items-center gap-3 sm:gap-4"
                            >
                                <div
                                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full sm:h-14 sm:w-14"
                                    style={{ backgroundColor: `${stat.color}20` }}
                                >
                                    <Icon className="h-6 w-6 sm:h-7 sm:w-7" style={{ color: stat.color }} strokeWidth={2} />
                                </div>
                                <div>
                                    <p className="font-cocon text-xl font-bold text-brand-black sm:text-2xl lg:text-3xl">
                                        {stat.value}
                                    </p>
                                    <p className="font-maiandra text-xs text-brand-black/50 sm:text-sm">
                                        {stat.label}
                                    </p>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </motion.div>
        </section>
    );
}

/* ═══════════════════════════════════════ */
/*            CTA BANNER                   */
/* ═══════════════════════════════════════ */
function CTABanner() {
    return (
        <section className="bg-brand-beige px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8 lg:pb-24">
            <motion.div
                {...fadeUp}
                className="relative mx-auto max-w-[1200px] overflow-hidden rounded-3xl bg-brand-yellow p-8 sm:p-12 lg:rounded-[2rem] lg:p-16"
            >
                {/* Decorative SVG route illustration */}
                <svg
                    className="absolute bottom-0 right-0 h-full w-1/2 text-brand-yellow opacity-30 sm:opacity-40"
                    viewBox="0 0 400 300"
                    fill="none"
                    aria-hidden="true"
                >
                    <path
                        d="M50 280C80 200 150 180 200 160C260 136 280 80 320 50C340 36 370 30 390 28"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeDasharray="8 6"
                        strokeLinecap="round"
                        filter="brightness(0.7)"
                    />
                    <circle cx="50" cy="280" r="6" fill="#111" opacity="0.3" />
                    <circle cx="200" cy="160" r="5" fill="#111" opacity="0.2" />
                    <circle cx="390" cy="28" r="6" fill="#111" opacity="0.3" />
                    {/* Stylized sun */}
                    <circle cx="340" cy="30" r="20" fill="#FFF" opacity="0.2" />
                    <circle cx="340" cy="30" r="12" fill="#FFF" opacity="0.15" />
                    {/* Trees */}
                    <path d="M100 240L108 210L116 240Z" fill="#52CD7B" opacity="0.3" />
                    <path d="M260 120L268 90L276 120Z" fill="#52CD7B" opacity="0.25" />
                    <path d="M300 100L306 78L312 100Z" fill="#52CD7B" opacity="0.2" />
                </svg>

                <div className="relative z-10 max-w-lg">
                    <h2 className="font-tan text-2xl text-brand-black sm:text-3xl lg:text-4xl">
                        Tu aventura comienza aquí
                    </h2>
                    <p className="mt-3 font-cocon text-base text-brand-black/70 sm:text-lg">
                        Reserva en minutos y comienza a pedalear.
                    </p>
                    <Link
                        to="/rentals"
                        className="group mt-6 inline-flex items-center gap-2 rounded-full border-2 border-brand-black bg-brand-black px-7 py-3.5 font-cocon text-sm font-bold text-white shadow-[3px_3px_0px_rgba(0,0,0,0.3)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-charcoal hover:shadow-[4px_5px_0px_rgba(0,0,0,0.3)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:text-base"
                    >
                        Reservar ahora
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
                    </Link>
                </div>
            </motion.div>
        </section>
    );
}

/* ═══════════════════════════════════════ */
/*            MAIN PAGE EXPORT             */
/* ═══════════════════════════════════════ */
export default function HomePage() {
    return (
        <div className="bg-brand-beige">
            <HeroSection />
            <ServiceStrip />
            <ExperienceSection />
            <StatsStrip />
            <CTABanner />
        </div>
    );
}
