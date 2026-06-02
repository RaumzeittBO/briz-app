import { useEffect, useState, type MouseEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Bike,
    Compass,
    Home,
    Map,
    Menu,
    Sparkles,
    Users,
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
    { label: 'Rutas', href: '/routes', icon: Map },
    { label: 'Ciclotours', href: '/routes', icon: Compass },
    { label: 'Experiencias', href: '/#experiencias', icon: Sparkles },
    { label: 'Nosotros', href: '/about', icon: Users },
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
        if (location.hash === '#experiencias') {
            window.setTimeout(() => {
                document.getElementById('experiencias')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 80);
        }
    }, [location.pathname, location.hash]);

    const handleNavClick = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
        if (href === '/#experiencias' && location.pathname === '/') {
            event.preventDefault();
            document.getElementById('experiencias')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            window.history.replaceState(null, '', href);
            setMobileOpen(false);
            return;
        }

        if (href === '/#experiencias') {
            event.preventDefault();
            navigate(href);
        }
    };

    const isActive = (href: string) => {
        if (href === '/#experiencias') return location.hash === '#experiencias';
        return location.pathname === href;
    };

    return (
        <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className={`fixed left-0 right-0 top-0 z-50 transition-shadow duration-300 ${scrolled ? 'shadow-[0_10px_24px_rgba(102,76,0,0.13)]' : ''}`}
        >
            <div className="relative bg-brand-yellow">
                <nav className="mx-auto max-w-[1480px] px-3 sm:px-7">
                    <div className="flex h-[74px] items-center justify-between gap-2 lg:h-[88px]">
                        <Link to="/" className="group flex min-w-0 items-center gap-1 sm:gap-2 lg:gap-3" aria-label="BRIZ Centro de la Bicicleta">
                            <img
                                src="/logo_bicicleta_principal.png"
                                alt="Bicicleta BRIZ"
                                className="h-[50px] w-[70px] shrink-0 object-contain brightness-0 invert transition-transform duration-200 group-hover:scale-[1.03] sm:h-[60px] sm:w-[90px] lg:h-[72px] lg:w-[110px]"
                            />
                            <img
                                src="/logo_briz_principal.png"
                                alt="BRIZ"
                                className="-ml-1 h-[34px] w-auto max-w-[68px] shrink-0 object-contain brightness-0 invert sm:h-10 sm:max-w-[78px] lg:-ml-2 lg:h-[48px] lg:max-w-[96px]"
                            />
                            <span className="mx-1 hidden h-10 w-[2px] shrink-0 bg-white/80 sm:block sm:mx-2 sm:h-11 lg:mx-3 lg:h-14" aria-hidden="true" />
                            <span className="hidden font-maiandra text-[10px] font-bold uppercase leading-tight tracking-wider text-white drop-shadow-sm sm:block sm:text-xs lg:text-sm">
                                Centro de la Bicicleta
                            </span>
                        </Link>

                        <div className="hidden items-center gap-2 lg:flex">
                            {navLinks.map((link) => {
                                const active = isActive(link.href);
                                return (
                                    <Link
                                        key={link.label}
                                        to={link.href}
                                        onClick={(event) => handleNavClick(event, link.href)}
                                        className={`relative rounded-full px-4 py-2 font-cocon text-sm font-bold tracking-wide transition-all duration-200 hover:bg-white/24 ${active ? 'text-white' : 'text-brand-black'}`}
                                    >
                                        {link.label}
                                        {active && (
                                            <motion.span
                                                layoutId="activeNavUnderline"
                                                className="absolute inset-x-4 -bottom-1 h-[3px] rounded-full bg-white"
                                            />
                                        )}
                                    </Link>
                                );
                            })}
                        </div>

                        <button
                            className="ml-2 hidden h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20 text-white transition hover:scale-105 hover:bg-white/28 lg:inline-flex"
                            aria-label="Abrir menu"
                            type="button"
                        >
                            <Menu className="h-8 w-8" strokeWidth={2.5} />
                        </button>

                        <button
                            onClick={() => setMobileOpen((open) => !open)}
                            className="ml-auto inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/18 text-white transition-transform active:scale-95 lg:hidden"
                            aria-label={mobileOpen ? 'Cerrar menu' : 'Abrir menu'}
                            aria-expanded={mobileOpen}
                            type="button"
                        >
                            {mobileOpen ? <X className="h-7 w-7" strokeWidth={2.5} /> : <Menu className="h-7 w-7" strokeWidth={2.5} />}
                        </button>
                    </div>
                </nav>

                <div className="pointer-events-none absolute -bottom-[28px] left-0 right-0 h-[36px] overflow-hidden" aria-hidden="true">
                    <svg viewBox="0 0 1440 42" className="h-full w-full" preserveAspectRatio="none">
                        <path d="M0 0H1440V15C1230 8 1032 10 850 20C650 31 488 32 308 25C172 20 76 13 0 8V0Z" fill="#FFD200" />
                        <path d="M0 9C76 14 172 21 308 26C488 33 650 32 850 21C1032 11 1230 9 1440 16" fill="none" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" />
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
                        className="bg-brand-yellow px-4 pb-5 pt-3 shadow-[0_16px_30px_rgba(102,76,0,0.16)] lg:hidden"
                    >
                        <div className="flex flex-col gap-1">
                            {navLinks.map((link) => {
                                const Icon = link.icon;
                                const active = isActive(link.href);
                                return (
                                    <Link
                                        key={link.label}
                                        to={link.href}
                                        onClick={(event) => handleNavClick(event, link.href)}
                                        className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 font-cocon text-base font-bold text-brand-black transition-colors ${active ? 'bg-white/34' : 'bg-white/12 hover:bg-white/22'}`}
                                    >
                                        <Icon className="h-5 w-5 shrink-0" strokeWidth={2.2} />
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
