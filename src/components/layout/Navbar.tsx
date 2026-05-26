import { useState, useEffect, type MouseEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bike,
    CircleHelp,
    HeartHandshake,
    Home,
    Info,
    MapPinned,
    Menu,
    Store,
    Wrench,
    X,
    type LucideIcon,
} from 'lucide-react';

type NavLinkItem = {
    label: string;
    href: string;
    icon: LucideIcon;
};

const navLinks: NavLinkItem[] = [
    { label: 'Inicio', href: '/', icon: Home },
    { label: 'Alquiler', href: '/rentals', icon: Bike },
    { label: 'Tienda', href: '/shop', icon: Store },
    { label: 'Ciclotours', href: '/routes', icon: MapPinned },
    { label: 'Mecánica', href: '/service', icon: Wrench },
    { label: 'Comunidad', href: '/community', icon: HeartHandshake },
    { label: 'Conócenos', href: '/about', icon: Info },
    { label: 'Preguntas frecuentes', href: '/#preguntas-frecuentes', icon: CircleHelp },
];

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        handleScroll();
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname, location.hash]);

    useEffect(() => {
        if (location.hash === '#preguntas-frecuentes') {
            window.setTimeout(() => {
                document.getElementById('preguntas-frecuentes')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 80);
        }
    }, [location.pathname, location.hash]);

    const handleNavClick = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
        if (href === '/#preguntas-frecuentes' && location.pathname === '/') {
            event.preventDefault();
            document.getElementById('preguntas-frecuentes')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            window.history.replaceState(null, '', href);
            setMobileOpen(false);
            return;
        }

        if (href === '/#preguntas-frecuentes') {
            event.preventDefault();
            navigate(href);
        }
    };

    const isActive = (href: string) => {
        if (href === '/#preguntas-frecuentes') {
            return location.hash === '#preguntas-frecuentes';
        }
        return location.pathname === href;
    };

    return (
        <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.45 }}
            className={`fixed top-0 left-0 right-0 z-50 transition-shadow duration-300 ${scrolled ? 'shadow-[0_6px_18px_rgba(0,0,0,0.12)]' : ''}`}
        >
            <div className="relative bg-brand-yellow">
                <nav className="mx-auto max-w-[1480px] px-3 sm:px-7 lg:px-7">
                    <div className="flex h-[73px] items-center justify-between gap-2 lg:h-[104px]">
                        <Link to="/" className="group flex min-w-0 items-center gap-2 sm:gap-4 lg:gap-5" aria-label="BRIZ Centro de la Bicicleta">
                            <img
                                src="/logo_bicicleta_principal.png"
                                alt="Bicicleta BRIZ"
                                className="h-[60px] w-20 shrink-0 object-contain brightness-0 invert transition-transform duration-200 group-hover:scale-[1.03] sm:h-16 sm:w-24 lg:h-[82px] lg:w-[132px]"
                            />
                            <img
                                src="/logo_briz_principal.png"
                                alt="BRIZ"
                                className="h-9 w-auto max-w-[62px] shrink-0 object-contain brightness-0 invert sm:h-10 sm:max-w-[76px] lg:h-[52px] lg:max-w-[100px]"
                            />
                            <span className="h-11 w-[3px] shrink-0 bg-white/95 sm:h-14 lg:h-[86px]" aria-hidden="true" />
                            <span className="block max-w-[112px] text-[10px] font-black uppercase leading-none tracking-normal text-white drop-shadow-sm sm:max-w-[164px] sm:text-xs lg:max-w-[292px] lg:text-2xl">
                                Centro de la Bicicleta
                            </span>
                        </Link>

                        <span className="hidden h-[86px] w-[3px] shrink-0 bg-white/95 lg:block" aria-hidden="true" />

                        <div className="hidden min-w-0 flex-1 items-stretch justify-end gap-0 lg:flex">
                            {navLinks.filter((link) => link.href !== '/').map((link) => {
                                const Icon = link.icon;
                                const active = isActive(link.href);

                                return (
                                    <div key={link.href} className="contents">
                                        {link.href === '/about' && <span className="mx-2 my-2 w-[3px] shrink-0 bg-white/95" aria-hidden="true" />}
                                        <Link
                                            to={link.href}
                                            onClick={(event) => handleNavClick(event, link.href)}
                                            className={`group flex min-w-[86px] max-w-[142px] flex-1 flex-col items-center justify-center gap-1 rounded-sm px-1 py-2 text-center font-cocon text-[14px] font-black leading-[1.05] tracking-normal text-brand-black transition-colors duration-200 xl:text-lg ${active ? 'bg-white/20' : 'hover:bg-white/16'}`}
                                        >
                                            <Icon className="h-6 w-6 text-brand-black transition-transform duration-200 group-hover:-translate-y-0.5 xl:h-8 xl:w-8" strokeWidth={2.3} />
                                            <span className="max-w-[118px] text-balance">{link.label}</span>
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => setMobileOpen((open) => !open)}
                            className="ml-auto inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-sm text-white transition-transform active:scale-95 lg:hidden"
                            aria-label={mobileOpen ? 'Cerrar menu' : 'Abrir menu'}
                            aria-expanded={mobileOpen}
                        >
                            {mobileOpen ? <X className="h-9 w-9" strokeWidth={3} /> : <Menu className="h-10 w-10" strokeWidth={3} />}
                        </button>
                    </div>
                </nav>

                <div className="pointer-events-none absolute -bottom-[11px] left-0 right-0 h-6 overflow-hidden" aria-hidden="true">
                    <svg viewBox="0 0 1440 32" className="h-full w-full" preserveAspectRatio="none">
                        <path d="M0 10 C205 30 390 29 590 13 C770 -1 920 2 1090 13 C1245 24 1352 24 1440 12" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
                    </svg>
                </div>
            </div>

            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="lg:hidden bg-brand-yellow px-4 pb-5 pt-3 shadow-[0_16px_30px_rgba(0,0,0,0.14)]"
                    >
                        <div className="grid grid-cols-2 gap-2">
                            {navLinks.map((link) => {
                                const Icon = link.icon;
                                const active = isActive(link.href);

                                return (
                                    <Link
                                        key={link.href}
                                        to={link.href}
                                        onClick={(event) => handleNavClick(event, link.href)}
                                        className={`flex min-h-16 items-center gap-3 rounded-sm px-3 py-3 text-sm font-black uppercase leading-tight text-brand-black transition-colors ${active ? 'bg-white/25' : 'bg-white/10 hover:bg-white/20'}`}
                                    >
                                        <Icon className="h-6 w-6 shrink-0" strokeWidth={2.4} />
                                        <span>{link.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.header>
    );
}
