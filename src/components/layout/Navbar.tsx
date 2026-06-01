import { useState, useEffect, type MouseEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
        if (href === '/#experiencias') {
            return location.hash === '#experiencias';
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
                    <div className="flex h-[73px] items-center justify-between gap-2 lg:h-[88px]">
                        {/* Logo */}
                        <Link to="/" className="group flex min-w-0 items-center gap-1 sm:gap-2 lg:gap-3" aria-label="BRIZ Centro de la Bicicleta">
                            <img
                                src="/logo_bicicleta_principal.png"
                                alt="Bicicleta BRIZ"
                                className="h-[56px] w-[78px] shrink-0 object-contain brightness-0 invert transition-transform duration-200 group-hover:scale-[1.03] sm:h-[64px] sm:w-[96px] lg:h-[78px] lg:w-[120px]"
                            />
                            <img
                                src="/logo_briz_principal.png"
                                alt="BRIZ"
                                className="-ml-1 h-[36px] w-auto max-w-[68px] shrink-0 object-contain brightness-0 invert sm:h-10 sm:max-w-[78px] lg:-ml-2 lg:h-[52px] lg:max-w-[104px]"
                            />
                            <span className="mx-1 hidden h-10 w-[2px] shrink-0 bg-white/80 sm:block sm:mx-2 sm:h-11 lg:mx-3 lg:h-14" aria-hidden="true" />
                            <span className="hidden font-maiandra text-[10px] font-bold uppercase leading-tight tracking-wider text-white drop-shadow-sm sm:block sm:text-xs lg:text-sm">
                                Centro de la Bicicleta
                            </span>
                        </Link>

                        {/* Desktop nav links — horizontal text-based layout */}
                        <div className="hidden items-center gap-1 lg:flex">
                            {navLinks.map((link) => {
                                const active = isActive(link.href);
                                return (
                                    <Link
                                        key={link.label}
                                        to={link.href}
                                        onClick={(event) => handleNavClick(event, link.href)}
                                        className={`relative rounded-full px-4 py-2 font-cocon text-sm font-bold tracking-wide text-brand-black transition-all duration-200 hover:bg-white/25 ${active ? 'bg-white/30' : ''}`}
                                    >
                                        {link.label}
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Mobile hamburger */}
                        <button
                            onClick={() => setMobileOpen((open) => !open)}
                            className="ml-auto inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15 text-brand-black transition-transform active:scale-95 lg:hidden"
                            aria-label={mobileOpen ? 'Cerrar menu' : 'Abrir menu'}
                            aria-expanded={mobileOpen}
                        >
                            {mobileOpen ? <X className="h-7 w-7" strokeWidth={2.5} /> : <Menu className="h-7 w-7" strokeWidth={2.5} />}
                        </button>
                    </div>
                </nav>

                {/* Wavy white divider at bottom of navbar */}
                <div className="pointer-events-none absolute -bottom-[25px] left-0 right-0 h-[34px] overflow-hidden" aria-hidden="true">
                    <svg viewBox="0 0 1440 38" className="h-full w-full" preserveAspectRatio="none">
                        <path d="M0 0H1440V12C1210 8 1032 9 862 17C680 26 505 33 314 28C182 25 86 18 0 10V0Z" fill="#FFD200" />
                        <path d="M0 10C86 18 182 25 314 28C505 33 680 26 862 17C1032 9 1210 8 1440 12" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
                    </svg>
                </div>
            </div>

            {/* Mobile menu panel */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="lg:hidden bg-brand-yellow px-4 pb-5 pt-3 shadow-[0_16px_30px_rgba(0,0,0,0.14)]"
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
                                        className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 font-cocon text-base font-bold text-brand-black transition-colors ${active ? 'bg-white/30' : 'bg-white/10 hover:bg-white/20'}`}
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
