import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    ArrowRight,
    Bike,
    ChevronsRight,
    HeartHandshake,
    MapPinned,
    Route,
    Sparkles,
    ShoppingBasket,
    Wrench,
    type LucideIcon,
} from 'lucide-react';
import type { CSSProperties, MouseEvent } from 'react';

const homeSections = [1, 2, 3, 4, 5, 6];

type ServicesHotspot = {
    label: string;
    href: string;
    color: string;
    icon: LucideIcon;
    desktopPosition: { left: string; top: string };
    mobilePosition: { left: string; top: string };
    glowPosition: { x: string; y: string };
};

type AmbientParticle = {
    color: string;
    left: string;
    top: string;
    size: string;
    delay?: string;
    duration?: string;
};

type AmbientTrail = {
    left: string;
    top: string;
    width: string;
    rotate: string;
    color: string;
    delay?: string;
};

type HomeSectionEffect = {
    section: number;
    intensity: 'hero' | 'service' | 'soft';
    colors: string[];
    glowPosition: { x: string; y: string };
    particles: AmbientParticle[];
    trails?: AmbientTrail[];
};

type HeroWidget = {
    label: string;
    sublabel?: string;
    href: string;
    variant: 'explore' | 'routes' | 'primary';
    icon: LucideIcon;
    desktopPosition: { left: string; top: string };
    mobilePosition: { left: string; top: string };
};

const servicesHotspots: ServicesHotspot[] = [
    {
        label: 'Alquiler',
        href: '/rentals',
        color: '#FFD200',
        icon: Bike,
        desktopPosition: { left: '12.5%', top: '20%' },
        mobilePosition: { left: '6%', top: '9%' },
        glowPosition: { x: '18%', y: '24%' },
    },
    {
        label: 'Tienda',
        href: '/shop',
        color: '#FA0E95',
        icon: ShoppingBasket,
        desktopPosition: { left: '12.5%', top: '30.5%' },
        mobilePosition: { left: '6%', top: '15.5%' },
        glowPosition: { x: '20%', y: '34%' },
    },
    {
        label: 'Ciclotours',
        href: '/routes',
        color: '#52CD7B',
        icon: Route,
        desktopPosition: { left: '12.5%', top: '41%' },
        mobilePosition: { left: '6%', top: '22%' },
        glowPosition: { x: '24%', y: '44%' },
    },
    {
        label: 'Mecánica',
        href: '/service',
        color: '#9B5A32',
        icon: Wrench,
        desktopPosition: { left: '12.5%', top: '51.5%' },
        mobilePosition: { left: '6%', top: '28.5%' },
        glowPosition: { x: '20%', y: '54%' },
    },
    {
        label: 'Comunidad',
        href: '/community',
        color: '#24A9C5',
        icon: HeartHandshake,
        desktopPosition: { left: '12.5%', top: '62%' },
        mobilePosition: { left: '6%', top: '35%' },
        glowPosition: { x: '23%', y: '64%' },
    },
];

type HotspotStyle = CSSProperties & Record<'--hotspot-color' | '--desktop-left' | '--desktop-top' | '--mobile-left' | '--mobile-top' | '--glow-x' | '--glow-y', string>;
type AmbientStyle = CSSProperties & Record<'--ambient-color' | '--ambient-left' | '--ambient-top' | '--ambient-size' | '--ambient-delay' | '--ambient-duration', string>;
type TrailStyle = CSSProperties & Record<'--trail-color' | '--trail-left' | '--trail-top' | '--trail-width' | '--trail-rotate' | '--trail-delay', string>;
type HeroWidgetStyle = CSSProperties & Record<'--hero-widget-desktop-left' | '--hero-widget-desktop-top' | '--hero-widget-mobile-left' | '--hero-widget-mobile-top', string>;

const heroWidgets: HeroWidget[] = [
    {
        label: 'Explora BRIZ',
        sublabel: 'alquiler · tienda · ciclotours',
        href: '#servicios',
        variant: 'explore',
        icon: Bike,
        desktopPosition: { left: '25%', top: '19%' },
        mobilePosition: { left: '31%', top: '15%' },
    },
    {
        label: 'Cochabamba sobre ruedas',
        href: '/routes',
        variant: 'routes',
        icon: MapPinned,
        desktopPosition: { left: '73%', top: '21.5%' },
        mobilePosition: { left: '74%', top: '35%' },
    },
    {
        label: 'Empieza tu experiencia',
        href: '/rentals',
        variant: 'primary',
        icon: Sparkles,
        desktopPosition: { left: '50%', top: '72%' },
        mobilePosition: { left: '50%', top: '70%' },
    },
];

const homeSectionEffects: HomeSectionEffect[] = [
    {
        section: 1,
        intensity: 'hero',
        colors: ['#FFD200', '#FFFFFF', '#22B8C7', '#FF3FA4'],
        glowPosition: { x: '50%', y: '41%' },
        particles: [
            { color: '#FFD200', left: '14%', top: '16%', size: '10px' },
            { color: '#FFFFFF', left: '18%', top: '21%', size: '6px', delay: '0.5s' },
            { color: '#FFD200', left: '33%', top: '27%', size: '8px', delay: '1s' },
            { color: '#FFFFFF', left: '38%', top: '20%', size: '5px', delay: '1.4s' },
            { color: '#FFD200', left: '52%', top: '32%', size: '7px', delay: '0.8s' },
            { color: '#22B8C7', left: '59%', top: '43%', size: '6px', delay: '1.8s' },
            { color: '#FF3FA4', left: '45%', top: '62%', size: '7px', delay: '2.2s' },
            { color: '#FFD200', left: '72%', top: '25%', size: '8px', delay: '2.8s' },
            { color: '#FFFFFF', left: '78%', top: '52%', size: '5px', delay: '3.2s' },
            { color: '#FFD200', left: '86%', top: '38%', size: '6px', delay: '3.6s' },
            { color: '#22B8C7', left: '24%', top: '73%', size: '5px', delay: '4s' },
            { color: '#FFFFFF', left: '66%', top: '70%', size: '6px', delay: '4.4s' },
        ],
        trails: [
            { left: '4%', top: '55%', width: '22%', rotate: '-8deg', color: '#FFD200' },
            { left: '58%', top: '36%', width: '18%', rotate: '15deg', color: '#22B8C7', delay: '0.9s' },
            { left: '68%', top: '61%', width: '24%', rotate: '-12deg', color: '#FFD200', delay: '1.5s' },
            { left: '34%', top: '66%', width: '15%', rotate: '9deg', color: '#FF3FA4', delay: '2.1s' },
        ],
    },
    {
        section: 2,
        intensity: 'service',
        colors: ['#FFD200', '#FA0E95', '#52CD7B', '#24A9C5'],
        glowPosition: { x: '26%', y: '38%' },
        particles: [],
    },
    {
        section: 3,
        intensity: 'soft',
        colors: ['#52CD7B', '#FFD200', '#FFFFFF'],
        glowPosition: { x: '24%', y: '34%' },
        particles: [
            { color: '#52CD7B', left: '18%', top: '20%', size: '7px' },
            { color: '#FFD200', left: '58%', top: '18%', size: '6px', delay: '1.1s' },
            { color: '#FFFFFF', left: '78%', top: '48%', size: '5px', delay: '2s' },
            { color: '#52CD7B', left: '36%', top: '76%', size: '5px', delay: '2.8s' },
        ],
    },
    {
        section: 4,
        intensity: 'soft',
        colors: ['#24A9C5', '#FFD200', '#FFFFFF'],
        glowPosition: { x: '64%', y: '42%' },
        particles: [
            { color: '#24A9C5', left: '20%', top: '30%', size: '6px' },
            { color: '#FFFFFF', left: '44%', top: '18%', size: '5px', delay: '1.2s' },
            { color: '#FFD200', left: '70%', top: '62%', size: '7px', delay: '2.4s' },
            { color: '#24A9C5', left: '86%', top: '34%', size: '5px', delay: '3s' },
        ],
    },
    {
        section: 5,
        intensity: 'soft',
        colors: ['#FA0E95', '#FFD200', '#FFFFFF'],
        glowPosition: { x: '50%', y: '44%' },
        particles: [
            { color: '#FA0E95', left: '15%', top: '42%', size: '6px' },
            { color: '#FFD200', left: '35%', top: '24%', size: '5px', delay: '1.3s' },
            { color: '#FFFFFF', left: '62%', top: '66%', size: '5px', delay: '2.1s' },
            { color: '#FA0E95', left: '82%', top: '38%', size: '6px', delay: '3.1s' },
        ],
    },
    {
        section: 6,
        intensity: 'soft',
        colors: ['#FFD200', '#24A9C5', '#FFFFFF'],
        glowPosition: { x: '42%', y: '42%' },
        particles: [
            { color: '#FFD200', left: '20%', top: '24%', size: '6px' },
            { color: '#24A9C5', left: '48%', top: '18%', size: '5px', delay: '1.2s' },
            { color: '#FFFFFF', left: '74%', top: '56%', size: '5px', delay: '2.2s' },
            { color: '#FFD200', left: '58%', top: '78%', size: '6px', delay: '3s' },
        ],
    },
];

function HeroInteractiveWidgets() {
    return (
        <div className="hero-widget-layer pointer-events-none absolute inset-0 z-20" aria-hidden={false}>
            <span className="hero-route-trace hero-route-trace-1" aria-hidden="true" />
            <span className="hero-route-trace hero-route-trace-2" aria-hidden="true" />
            <span className="hero-route-trace hero-route-trace-3" aria-hidden="true" />

            {heroWidgets.map((widget) => {
                const Icon = widget.icon;
                const widgetStyle: HeroWidgetStyle = {
                    '--hero-widget-desktop-left': widget.desktopPosition.left,
                    '--hero-widget-desktop-top': widget.desktopPosition.top,
                    '--hero-widget-mobile-left': widget.mobilePosition.left,
                    '--hero-widget-mobile-top': widget.mobilePosition.top,
                };
                const content = (
                    <>
                        <span className="hero-widget-icon">
                            <Icon className="h-full w-full" strokeWidth={2.35} />
                        </span>
                        <span className="hero-widget-copy">
                            <span className="hero-widget-label">{widget.label}</span>
                            {widget.sublabel && <span className="hero-widget-subtitle">{widget.sublabel}</span>}
                        </span>
                        {widget.variant === 'primary' && <ArrowRight className="hero-widget-arrow" strokeWidth={2.8} />}
                    </>
                );

                if (widget.href.startsWith('#')) {
                    return (
                        <a
                            key={widget.label}
                            href={widget.href}
                            className={`hero-widget hero-widget-${widget.variant} pointer-events-auto`}
                            style={widgetStyle}
                            aria-label={widget.label}
                        >
                            {content}
                        </a>
                    );
                }

                return (
                    <Link
                        key={widget.label}
                        to={widget.href}
                        className={`hero-widget hero-widget-${widget.variant} pointer-events-auto`}
                        style={widgetStyle}
                        aria-label={widget.label}
                    >
                        {content}
                    </Link>
                );
            })}
        </div>
    );
}

function HomeOrganicDivider({ variant }: { variant: 'a' | 'b' }) {
    const isVariantA = variant === 'a';
    const bandPath = isVariantA
        ? 'M0 36C185 82 370 86 568 54C756 24 912 7 1110 34C1256 54 1352 76 1440 48L1440 82C1352 110 1256 88 1110 68C912 41 756 58 568 88C370 120 185 116 0 70Z'
        : 'M0 54C160 28 332 20 528 44C744 70 918 98 1114 64C1266 38 1360 26 1440 42L1440 76C1360 60 1266 72 1114 98C918 132 744 104 528 78C332 54 160 62 0 88Z';
    const linePath = isVariantA
        ? 'M0 36C185 82 370 86 568 54C756 24 912 7 1110 34C1256 54 1352 76 1440 48'
        : 'M0 54C160 28 332 20 528 44C744 70 918 98 1114 64C1266 38 1360 26 1440 42';

    return (
        <div className="pointer-events-none absolute inset-x-0 -bottom-7 z-20 h-14 sm:-bottom-10 sm:h-20 lg:-bottom-14 lg:h-28" aria-hidden="true">
            <svg
                viewBox="0 0 1440 128"
                className="h-full w-full drop-shadow-[0_-6px_14px_rgba(0,0,0,0.08)]"
                preserveAspectRatio="none"
            >
                <path d={bandPath} fill="#FFD200" fillOpacity="0.76" />
                <path d={linePath} fill="none" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" />
                <path d={linePath} fill="none" stroke="#FFFFFF" strokeWidth="2" strokeOpacity="0.45" strokeLinecap="round" transform="translate(0 9)" />
            </svg>
        </div>
    );
}

function AmbientLayer({ effect }: { effect: HomeSectionEffect }) {
    const ambientStyle = {
        '--ambient-primary': effect.colors[0],
        '--ambient-secondary': effect.colors[1],
        '--ambient-accent': effect.colors[2] ?? effect.colors[0],
        '--ambient-glow-x': effect.glowPosition.x,
        '--ambient-glow-y': effect.glowPosition.y,
    } as CSSProperties;

    return (
        <div
            className={`home-ambient-layer home-ambient-${effect.intensity} pointer-events-none absolute inset-0 z-10`}
            style={ambientStyle}
            aria-hidden="true"
        >
            <div className="home-ambient-glow" />
            {effect.section === 1 && (
                <>
                    <div className="hero-sun-orbit hero-sun-orbit-left" />
                    <div className="hero-sun-orbit hero-sun-orbit-center" />
                    <div className="hero-word-glow" />
                </>
            )}
            <div className="home-ambient-depth">
                {effect.particles.map((particle, particleIndex) => {
                    const particleStyle: AmbientStyle = {
                        '--ambient-color': particle.color,
                        '--ambient-left': particle.left,
                        '--ambient-top': particle.top,
                        '--ambient-size': particle.size,
                        '--ambient-delay': particle.delay ?? `${particleIndex * 0.35}s`,
                        '--ambient-duration': particle.duration ?? (effect.intensity === 'hero' ? '6.8s' : '8.8s'),
                    };

                    return <span key={`${effect.section}-particle-${particleIndex}`} className="home-ambient-particle" style={particleStyle} />;
                })}

                {effect.trails?.map((trail, trailIndex) => {
                    const trailStyle: TrailStyle = {
                        '--trail-color': trail.color,
                        '--trail-left': trail.left,
                        '--trail-top': trail.top,
                        '--trail-width': trail.width,
                        '--trail-rotate': trail.rotate,
                        '--trail-delay': trail.delay ?? `${trailIndex * 0.45}s`,
                    };

                    return <span key={`${effect.section}-trail-${trailIndex}`} className="home-motion-trail" style={trailStyle} />;
                })}
            </div>
        </div>
    );
}

function ServicesInteractiveLayer() {
    return (
        <div
            className="services-home-layer pointer-events-none absolute inset-0 z-10"
            aria-hidden={false}
        >
            <div className="services-ambient-light absolute inset-0" aria-hidden="true" />
            <div className="services-home-depth absolute inset-0">
                <div className="services-home-spark service-spark-1" />
                <div className="services-home-spark service-spark-2" />
                <div className="services-home-spark service-spark-3" />
                <div className="services-home-spark service-spark-4" />
                <div className="services-home-spark service-spark-5" />
                <div className="services-home-spark service-spark-6" />
                <div className="services-home-spark service-spark-7" />
                <div className="services-home-spark service-spark-8" />
                <div className="services-home-spark service-spark-9" />
                <div className="services-home-spark service-spark-10" />
            </div>

            <div className="services-title-cue pointer-events-none absolute left-[5.8%] top-[7%] hidden items-center gap-3 text-white md:flex">
                <ChevronsRight className="services-title-arrow h-14 w-14 lg:h-16 lg:w-16" strokeWidth={4} />
                <span className="font-tan text-xl uppercase leading-none text-white drop-shadow-[2px_2px_0_rgba(0,0,0,0.75)] lg:text-3xl">
                    Nuestros servicios:
                </span>
            </div>

            {servicesHotspots.map((hotspot) => {
                const Icon = hotspot.icon;
                const style: HotspotStyle = {
                    '--hotspot-color': hotspot.color,
                    '--desktop-left': hotspot.desktopPosition.left,
                    '--desktop-top': hotspot.desktopPosition.top,
                    '--mobile-left': hotspot.mobilePosition.left,
                    '--mobile-top': hotspot.mobilePosition.top,
                    '--glow-x': hotspot.glowPosition.x,
                    '--glow-y': hotspot.glowPosition.y,
                };

                return (
                    <Link
                        key={hotspot.href}
                        to={hotspot.href}
                        className="service-hotspot group pointer-events-auto"
                        style={style}
                        aria-label={`Ir a ${hotspot.label}`}
                    >
                        <span className="service-hotspot-icon">
                            <Icon className="h-full w-full" strokeWidth={2.2} />
                        </span>
                        <span className="service-hotspot-label">{hotspot.label}</span>
                    </Link>
                );
            })}
        </div>
    );
}

function handleServicesMouseMove(event: MouseEvent<HTMLElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5).toFixed(3);
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5).toFixed(3);

    event.currentTarget.style.setProperty('--briz-depth-x', x);
    event.currentTarget.style.setProperty('--briz-depth-y', y);
}

function handleServicesMouseLeave(event: MouseEvent<HTMLElement>) {
    event.currentTarget.style.setProperty('--briz-depth-x', '0');
    event.currentTarget.style.setProperty('--briz-depth-y', '0');
}

export default function HomePage() {
    return (
        <div className="bg-white pt-[73px] lg:pt-[104px]">
            {homeSections.map((sectionNumber, index) => {
                const isFirstSection = index === 0;
                const isLastSection = index === homeSections.length - 1;
                const sectionEffect = homeSectionEffects.find((effect) => effect.section === sectionNumber);
                const hasMouseDepth = sectionNumber === 1 || sectionNumber === 2;

                return (
                    <motion.section
                        key={sectionNumber}
                        id={sectionNumber === 2 ? 'servicios' : undefined}
                        className={`home-section-scene relative w-full overflow-visible ${sectionNumber === 2 ? 'services-home-scene' : ''}`}
                        aria-label={`Sección principal ${sectionNumber}`}
                        onMouseMove={hasMouseDepth ? handleServicesMouseMove : undefined}
                        onMouseLeave={hasMouseDepth ? handleServicesMouseLeave : undefined}
                        initial={isFirstSection ? false : { opacity: 0, y: 18 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.18 }}
                        transition={{ duration: 0.55, ease: 'easeOut' }}
                        style={{ zIndex: homeSections.length - index }}
                    >
                        <picture>
                            <source
                                media="(max-width: 767px)"
                                srcSet={`/menu-principal-celular/${sectionNumber}.webp`}
                            />
                            <img
                                src={`/menu-principal-web/${sectionNumber}.webp`}
                                alt=""
                                className={`block h-auto w-full ${hasMouseDepth ? 'home-depth-image' : ''}`}
                                decoding="async"
                                fetchPriority={isFirstSection ? 'high' : 'auto'}
                                loading={isFirstSection ? 'eager' : 'lazy'}
                                sizes="100vw"
                            />
                        </picture>

                        {sectionEffect && <AmbientLayer effect={sectionEffect} />}
                        {sectionNumber === 1 && <HeroInteractiveWidgets />}
                        {sectionNumber === 2 && <ServicesInteractiveLayer />}

                        {!isLastSection && (
                            <HomeOrganicDivider variant={index % 2 === 0 ? 'a' : 'b'} />
                        )}
                    </motion.section>
                );
            })}
        </div>
    );
}
