import { useEffect, useState, type MouseEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Bike,
    Store,
    Route,
    Wrench,
    HandHeart,
    Info,
    HelpCircle,
    Menu,
    X,
    User,
    LogOut,
    type LucideIcon,
} from 'lucide-react';

type NavLinkItem = {
    label: string;
    href: string;
    icon: LucideIcon;
};

const group1Links: NavLinkItem[] = [
    { label: 'Alquiler', href: '/rentals', icon: Bike },
    { label: 'Tienda', href: '/shop', icon: Store },
    { label: 'Ciclotours', href: '/routes', icon: Route },
    { label: 'Mecánica', href: '/service', icon: Wrench },
    { label: 'Comunidad', href: '/community', icon: HandHeart },
];

const group2Links: NavLinkItem[] = [
    { label: 'Conócenos', href: '/about', icon: Info },
    { label: 'Preguntas frecuentes', href: '/contact', icon: HelpCircle },
];

const allNavLinks = [...group1Links, ...group2Links];

const TireTrackSeparator = ({ className = '' }: { className?: string }) => (
    <svg 
        className={`hidden h-10 w-4 shrink-0 text-white/80 md:block lg:h-12 lg:w-5 ${className}`} 
        viewBox="0 0 20 64" 
        fill="currentColor" 
        aria-hidden="true"
    >
        <path d="M 3 2 L 8 4 L 8 7 L 3 5 Z" />
        <path d="M 12 8 L 17 10 L 17 13 L 12 11 Z" />
        <rect x="9" y="5" width="2" height="2" rx="0.5" />

        <path d="M 3 14 L 8 16 L 8 19 L 3 17 Z" />
        <path d="M 12 20 L 17 22 L 17 25 L 12 23 Z" />
        <rect x="9" y="17" width="2" height="2" rx="0.5" />

        <path d="M 3 26 L 8 28 L 8 31 L 3 29 Z" />
        <path d="M 12 32 L 17 34 L 17 37 L 12 35 Z" />
        <rect x="9" y="29" width="2" height="2" rx="0.5" />

        <path d="M 3 38 L 8 40 L 8 43 L 3 41 Z" />
        <path d="M 12 44 L 17 46 L 17 49 L 12 47 Z" />
        <rect x="9" y="41" width="2" height="2" rx="0.5" />

        <path d="M 3 50 L 8 52 L 8 55 L 3 53 Z" />
        <path d="M 12 56 L 17 58 L 17 61 L 12 59 Z" />
        <rect x="9" y="53" width="2" height="2" rx="0.5" />
    </svg>
);

import { useStore } from '@/context/StoreContext';
import CustomerAuthModal from './CustomerAuthModal';

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    
    const { currentCustomer, logoutCustomer } = useStore();
    const [authModalOpen, setAuthModalOpen] = useState(false);

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
                    <div className="flex h-[74px] items-center justify-between gap-2 lg:h-[96px]">
                        <div className="flex items-center gap-2 lg:gap-3">
                            <Link to="/" className="group flex min-w-0 items-center gap-1.5 sm:gap-2 lg:gap-2.5" aria-label="BRIZ Centro de la Bicicleta">
                                <img
                                    src="/logo_bicicleta_principal.png"
                                    alt="Bicicleta BRIZ"
                                    className="h-[52px] w-auto shrink-0 object-contain brightness-0 invert transition-transform duration-200 group-hover:scale-[1.02] sm:h-[65px] lg:h-[80px]"
                                />
                                <img
                                    src="/logo_briz_principal.png"
                                    alt="BRIZ"
                                    className="h-[36px] w-auto shrink-0 object-contain brightness-0 invert sm:h-[44px] lg:h-[54px]"
                                />
                            </Link>

                            <TireTrackSeparator />

                            <div className="hidden md:flex items-center h-full">
                                <span className="font-maiandra text-xs font-black uppercase leading-none tracking-widest text-white drop-shadow-sm sm:text-sm lg:text-base xl:text-lg shrink-0">
                                    Centro de la Bicicleta
                                </span>
                            </div>
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden items-center gap-3 xl:gap-6 lg:flex h-full">
                            <TireTrackSeparator />

                            <div className="flex items-center gap-1.5 lg:gap-3 xl:gap-6">
                                {group1Links.map((link) => {
                                    const Icon = link.icon;
                                    const active = isActive(link.href);
                                    return (
                                        <Link
                                            key={link.label}
                                            to={link.href}
                                            onClick={(event) => handleNavClick(event, link.href)}
                                            className={`relative flex flex-col items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 text-center transition-all duration-300 hover:bg-white/20 hover:scale-[1.03] ${
                                                active ? 'text-white' : 'text-brand-black'
                                            }`}
                                        >
                                            <Icon className="h-6 w-6 lg:h-7 lg:w-7 shrink-0 transition-transform duration-200" strokeWidth={2.0} />
                                            <span className="font-cocon text-xs lg:text-sm font-bold tracking-wide leading-none">{link.label}</span>
                                            {active && (
                                                <motion.span
                                                    layoutId="activeNavUnderline"
                                                    className="absolute inset-x-2 -bottom-1 h-[3px] rounded-full bg-white"
                                                />
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>

                            <TireTrackSeparator />

                            <div className="flex items-center gap-1.5 lg:gap-3 xl:gap-6">
                                {group2Links.map((link) => {
                                    const Icon = link.icon;
                                    const active = isActive(link.href);
                                    return (
                                        <Link
                                            key={link.label}
                                            to={link.href}
                                            onClick={(event) => handleNavClick(event, link.href)}
                                            className={`relative flex flex-col items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 text-center transition-all duration-300 hover:bg-white/20 hover:scale-[1.03] ${
                                                active ? 'text-white' : 'text-brand-black'
                                            }`}
                                        >
                                            <Icon className="h-6 w-6 lg:h-7 lg:w-7 shrink-0 transition-transform duration-200" strokeWidth={2.0} />
                                            <span className="font-cocon text-xs lg:text-sm font-bold tracking-wide leading-none">{link.label}</span>
                                            {active && (
                                                <motion.span
                                                    layoutId="activeNavUnderline"
                                                    className="absolute inset-x-2 -bottom-1 h-[3px] rounded-full bg-white"
                                                />
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Desktop User Auth Button */}
                        <div className="hidden lg:flex items-center gap-2">
                            {currentCustomer ? (
                                <div className="relative group">
                                    <button 
                                        className="h-10 px-4 flex items-center gap-2 rounded-full bg-white/20 text-white font-cocon text-xs font-bold uppercase transition hover:scale-105 hover:bg-white/28"
                                    >
                                        {currentCustomer.autofotoUrl ? (
                                            <img src={currentCustomer.autofotoUrl} className="w-5 h-5 rounded-full object-cover border border-white/50" />
                                        ) : (
                                            <User className="w-4 h-4" />
                                        )}
                                        <span className="max-w-[100px] truncate">{currentCustomer.name.split(' ')[0]}</span>
                                    </button>
                                    
                                    {/* Dropdown on hover */}
                                    <div className="absolute right-0 top-full pt-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50">
                                        <div className="bg-brand-charcoal border border-white/10 rounded-2xl p-2 w-48 shadow-xl">
                                            <div className="px-3 py-2 border-b border-white/5 text-left">
                                                <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider font-maiandra">Cliente</p>
                                                <p className="text-xs font-bold text-white truncate font-cocon">{currentCustomer.name}</p>
                                            </div>
                                            <button 
                                                onClick={logoutCustomer} 
                                                className="w-full flex items-center gap-2 text-left px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 rounded-xl mt-1 transition-colors font-cocon"
                                            >
                                                <LogOut className="w-3.5 h-3.5" /> Cerrar Sesión
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => setAuthModalOpen(true)}
                                    className="h-10 px-5 flex items-center gap-2 rounded-full bg-white text-brand-black hover:bg-brand-yellow-light font-cocon text-xs font-bold uppercase transition hover:scale-105 shadow-sm"
                                >
                                    <User className="w-4 h-4" /> Iniciar Sesión
                                </button>
                            )}
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
                            {allNavLinks.map((link) => {
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
                            
                            {/* Mobile User Auth Link */}
                            <div className="border-t border-brand-black/10 pt-2 mt-2">
                                {currentCustomer ? (
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-3 rounded-2xl px-4 py-3 bg-white/12 text-brand-black font-cocon text-sm font-bold">
                                            {currentCustomer.autofotoUrl ? (
                                                <img src={currentCustomer.autofotoUrl} className="w-6 h-6 rounded-full object-cover border border-white/50" />
                                            ) : (
                                                <User className="w-4 h-4" />
                                            )}
                                            <span className="truncate">{currentCustomer.name}</span>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                logoutCustomer();
                                                setMobileOpen(false);
                                            }}
                                            className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 bg-red-500/10 text-red-700 font-cocon text-sm font-bold hover:bg-red-500/20 transition-all text-left"
                                        >
                                            <LogOut className="h-5 w-5 shrink-0 text-red-700" strokeWidth={2.2} />
                                            <span>Cerrar Sesión</span>
                                        </button>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => {
                                            setAuthModalOpen(true);
                                            setMobileOpen(false);
                                        }}
                                        className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 bg-white text-brand-black font-cocon text-sm font-bold hover:bg-white/90 transition-all text-left"
                                    >
                                        <User className="h-5 w-5 shrink-0" strokeWidth={2.2} />
                                        <span>Iniciar Sesión</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <CustomerAuthModal 
                isOpen={authModalOpen} 
                onClose={() => setAuthModalOpen(false)} 
            />
        </motion.header>
    );
}
