import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    Bike,
    ChevronsRight,
    HeartHandshake,
    Route,
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
};

const servicesHotspots: ServicesHotspot[] = [
    {
        label: 'Alquiler',
        href: '/rentals',
        color: '#FFD200',
        icon: Bike,
        desktopPosition: { left: '12.5%', top: '20%' },
        mobilePosition: { left: '6%', top: '9%' },
    },
    {
        label: 'Tienda',
        href: '/shop',
        color: '#FA0E95',
        icon: ShoppingBasket,
        desktopPosition: { left: '12.5%', top: '30.5%' },
        mobilePosition: { left: '6%', top: '15.5%' },
    },
    {
        label: 'Ciclotours',
        href: '/routes',
        color: '#52CD7B',
        icon: Route,
        desktopPosition: { left: '12.5%', top: '41%' },
        mobilePosition: { left: '6%', top: '22%' },
    },
    {
        label: 'Mecánica',
        href: '/service',
        color: '#9B5A32',
        icon: Wrench,
        desktopPosition: { left: '12.5%', top: '51.5%' },
        mobilePosition: { left: '6%', top: '28.5%' },
    },
    {
        label: 'Comunidad',
        href: '/community',
        color: '#24A9C5',
        icon: HeartHandshake,
        desktopPosition: { left: '12.5%', top: '62%' },
        mobilePosition: { left: '6%', top: '35%' },
    },
];

type HotspotStyle = CSSProperties & Record<'--hotspot-color' | '--desktop-left' | '--desktop-top' | '--mobile-left' | '--mobile-top', string>;

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

function ServicesInteractiveLayer() {
    const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        const x = ((event.clientX - bounds.left) / bounds.width - 0.5).toFixed(3);
        const y = ((event.clientY - bounds.top) / bounds.height - 0.5).toFixed(3);

        event.currentTarget.style.setProperty('--briz-depth-x', x);
        event.currentTarget.style.setProperty('--briz-depth-y', y);
    };

    const handleMouseLeave = (event: MouseEvent<HTMLDivElement>) => {
        event.currentTarget.style.setProperty('--briz-depth-x', '0');
        event.currentTarget.style.setProperty('--briz-depth-y', '0');
    };

    return (
        <div
            className="services-home-layer pointer-events-none absolute inset-0 z-10"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            aria-hidden={false}
        >
            <div className="services-home-depth absolute inset-0">
                <div className="services-home-spark service-spark-1" />
                <div className="services-home-spark service-spark-2" />
                <div className="services-home-spark service-spark-3" />
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

export default function HomePage() {
    return (
        <div className="bg-white pt-[73px] lg:pt-[104px]">
            {homeSections.map((sectionNumber, index) => {
                const isFirstSection = index === 0;
                const isLastSection = index === homeSections.length - 1;

                return (
                    <motion.section
                        key={sectionNumber}
                        className="relative w-full overflow-visible"
                        aria-label={`Sección principal ${sectionNumber}`}
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
                                className="block h-auto w-full"
                                decoding="async"
                                fetchPriority={isFirstSection ? 'high' : 'auto'}
                                loading={isFirstSection ? 'eager' : 'lazy'}
                                sizes="100vw"
                            />
                        </picture>

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
