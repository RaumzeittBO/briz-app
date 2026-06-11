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
        className={`hidden h-12 w-3 shrink-0 text-white/80 md:block lg:h-16 lg:w-4 ${className}`} 
        viewBox="0 0 16 64" 
        fill="currentColor" 
        aria-hidden="true"
    >
        <path d="M 2 4 L 7 7 L 6 9 L 1 6 Z" />
        <path d="M 10 9 L 15 12 L 14 14 L 9 11 Z" />

        <path d="M 2 16 L 7 19 L 6 21 L 1 18 Z" />
        <path d="M 10 21 L 15 24 L 14 26 L 9 23 Z" />

        <path d="M 2 28 L 7 31 L 6 33 L 1 30 Z" />
        <path d="M 10 33 L 15 36 L 14 38 L 9 35 Z" />

        <path d="M 2 40 L 7 43 L 6 45 L 1 42 Z" />
        <path d="M 10 45 L 15 48 L 14 50 L 9 47 Z" />

        <path d="M 2 52 L 7 55 L 6 57 L 1 54 Z" />
        <path d="M 10 57 L 15 60 L 14 62 L 9 59 Z" />
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

    const [customizerOpen, setCustomizerOpen] = useState(false);
    const [styles, setStyles] = useState(() => {
        const saved = localStorage.getItem('briz-navbar-styles');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) {}
        }
        return {
            mobileNavbarHeight: 88,
            desktopNavbarHeight: 120,
            mobileBikeHeight: 66,
            desktopBikeHeight: 108,
            mobileBrizHeight: 42,
            desktopBrizHeight: 68,
            mobileLogoGap: 8,
            desktopLogoGap: 16,
            logoBrizMarginLeft: 0,
            separatorMargin: 24,
            separatorHeight: 64,
            separatorWidth: 16,
            textFontSize: 16,
            textYShift: 0,
            desktopNavGap: 24,
            buttonGroupGap: 24,
        };
    });

    useEffect(() => {
        localStorage.setItem('briz-navbar-styles', JSON.stringify(styles));
    }, [styles]);

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
            <style>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 10s linear infinite;
                }
                
                :root {
                    --nav-h-mobile: ${styles.mobileNavbarHeight}px;
                    --nav-h-desktop: ${styles.desktopNavbarHeight}px;
                    
                    --bike-h-mobile: ${styles.mobileBikeHeight}px;
                    --bike-h-desktop: ${styles.desktopBikeHeight}px;
                    
                    --briz-h-mobile: ${styles.mobileBrizHeight}px;
                    --briz-h-desktop: ${styles.desktopBrizHeight}px;
                    
                    --logo-gap-mobile: ${styles.mobileLogoGap}px;
                    --logo-gap-desktop: ${styles.desktopLogoGap}px;
                    --briz-ml: ${styles.logoBrizMarginLeft}px;
                    
                    --sep-mx: ${styles.separatorMargin}px;
                    --sep-h: ${styles.separatorHeight}px;
                    --sep-w: ${styles.separatorWidth}px;
                    
                    --text-fs: ${styles.textFontSize}px;
                    --text-y: ${styles.textYShift}px;
                    
                    --nav-gap: ${styles.desktopNavGap}px;
                    --btn-gap: ${styles.buttonGroupGap}px;
                }
                
                .dyn-navbar {
                    height: var(--nav-h-mobile) !important;
                }
                @media (min-width: 1024px) {
                    .dyn-navbar {
                        height: var(--nav-h-desktop) !important;
                    }
                }
                
                .dyn-bike-logo {
                    height: var(--bike-h-mobile) !important;
                }
                @media (min-width: 1024px) {
                    .dyn-bike-logo {
                        height: var(--bike-h-desktop) !important;
                    }
                }
                
                .dyn-briz-logo {
                    height: var(--briz-h-mobile) !important;
                    margin-left: var(--briz-ml) !important;
                }
                @media (min-width: 1024px) {
                    .dyn-briz-logo {
                        height: var(--briz-h-desktop) !important;
                    }
                }
                
                .dyn-logo-link {
                    gap: var(--logo-gap-mobile) !important;
                }
                @media (min-width: 1024px) {
                    .dyn-logo-link {
                        gap: var(--logo-gap-desktop) !important;
                    }
                }
                
                .dyn-separator {
                    margin-left: var(--sep-mx) !important;
                    margin-right: var(--sep-mx) !important;
                    height: var(--sep-h) !important;
                    width: var(--sep-w) !important;
                }
                
                .dyn-text-centro {
                    font-size: var(--text-fs) !important;
                    transform: translateY(var(--text-y)) !important;
                }
                
                .dyn-desktop-nav {
                    gap: var(--nav-gap) !important;
                }
                
                .dyn-btn-group {
                    gap: var(--btn-gap) !important;
                }
            `}</style>

            <div className="relative bg-brand-yellow">
                <nav className="mx-auto max-w-[1480px] px-3 sm:px-7">
                    <div className="flex items-center justify-between gap-3 dyn-navbar">
                        <div className="flex items-center gap-1 sm:gap-2">
                            <Link to="/" className="group flex items-center shrink-0 pl-1 dyn-logo-link" aria-label="BRIZ Centro de la Bicicleta">
                                <img
                                    src="/logo_bicicleta_principal.png"
                                    alt="Bicicleta BRIZ"
                                    className="w-auto shrink-0 object-contain brightness-0 invert transition-transform duration-200 group-hover:scale-[1.02] dyn-bike-logo"
                                />
                                <img
                                    src="/logo_briz_principal.png"
                                    alt="BRIZ"
                                    className="w-auto shrink-0 object-contain brightness-0 invert dyn-briz-logo"
                                />
                            </Link>

                            <TireTrackSeparator />

                            <div className="hidden md:flex items-center h-full">
                                <span className="font-maiandra font-black uppercase leading-none tracking-widest text-white drop-shadow-sm shrink-0 dyn-text-centro">
                                    Centro de la Bicicleta
                                </span>
                            </div>
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden items-center lg:flex h-full dyn-desktop-nav">
                            <TireTrackSeparator />

                            <div className="flex items-center dyn-btn-group">
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

                            <div className="flex items-center dyn-btn-group">
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

            {/* Floating Customizer Trigger */}
            <button 
                onClick={() => setCustomizerOpen(!customizerOpen)}
                className="fixed bottom-6 right-6 z-[100] p-3.5 rounded-full bg-brand-charcoal text-white hover:bg-brand-black hover:scale-110 shadow-2xl transition duration-300 border border-white/20"
                title="Abrir Editor de Navbar"
            >
                <svg className="w-6 h-6 animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </button>

            {/* Customizer Drawer */}
            {customizerOpen && (
                <div className="fixed bottom-24 right-6 z-[100] w-[350px] max-h-[70vh] overflow-y-auto rounded-3xl bg-brand-charcoal/95 backdrop-blur-md border border-white/10 p-6 text-white shadow-2xl font-cocon">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                        <h3 className="font-bold text-lg text-brand-yellow">Ajustes Visuales Navbar</h3>
                        <button onClick={() => setCustomizerOpen(false)} className="text-white/60 hover:text-white font-black text-sm">✕</button>
                    </div>
                    
                    <div className="space-y-4 text-xs">
                        {/* Height Group */}
                        <div>
                            <h4 className="font-bold text-brand-yellow/80 uppercase tracking-widest mb-2">Altura Navbar</h4>
                            <div className="space-y-2">
                                <label className="flex justify-between items-center">
                                    <span>Celular: {styles.mobileNavbarHeight}px</span>
                                    <input type="range" min="60" max="140" value={styles.mobileNavbarHeight} onChange={(e) => setStyles({...styles, mobileNavbarHeight: Number(e.target.value)})} className="w-1/2" />
                                </label>
                                <label className="flex justify-between items-center">
                                    <span>PC: {styles.desktopNavbarHeight}px</span>
                                    <input type="range" min="80" max="180" value={styles.desktopNavbarHeight} onChange={(e) => setStyles({...styles, desktopNavbarHeight: Number(e.target.value)})} className="w-1/2" />
                                </label>
                            </div>
                        </div>

                        <hr className="border-white/5" />

                        {/* Logo sizes */}
                        <div>
                            <h4 className="font-bold text-brand-yellow/80 uppercase tracking-widest mb-2">Tamaño de Logo Bicicleta</h4>
                            <div className="space-y-2">
                                <label className="flex justify-between items-center">
                                    <span>Celular: {styles.mobileBikeHeight}px</span>
                                    <input type="range" min="40" max="120" value={styles.mobileBikeHeight} onChange={(e) => setStyles({...styles, mobileBikeHeight: Number(e.target.value)})} className="w-1/2" />
                                </label>
                                <label className="flex justify-between items-center">
                                    <span>PC: {styles.desktopBikeHeight}px</span>
                                    <input type="range" min="60" max="160" value={styles.desktopBikeHeight} onChange={(e) => setStyles({...styles, desktopBikeHeight: Number(e.target.value)})} className="w-1/2" />
                                </label>
                            </div>
                        </div>

                        <hr className="border-white/5" />

                        {/* Logo sizes */}
                        <div>
                            <h4 className="font-bold text-brand-yellow/80 uppercase tracking-widest mb-2">Tamaño de Logo Briz</h4>
                            <div className="space-y-2">
                                <label className="flex justify-between items-center">
                                    <span>Celular: {styles.mobileBrizHeight}px</span>
                                    <input type="range" min="20" max="90" value={styles.mobileBrizHeight} onChange={(e) => setStyles({...styles, mobileBrizHeight: Number(e.target.value)})} className="w-1/2" />
                                </label>
                                <label className="flex justify-between items-center">
                                    <span>PC: {styles.desktopBrizHeight}px</span>
                                    <input type="range" min="30" max="120" value={styles.desktopBrizHeight} onChange={(e) => setStyles({...styles, desktopBrizHeight: Number(e.target.value)})} className="w-1/2" />
                                </label>
                            </div>
                        </div>

                        <hr className="border-white/5" />

                        {/* Logo spacing */}
                        <div>
                            <h4 className="font-bold text-brand-yellow/80 uppercase tracking-widest mb-2">Distancia entre Logos</h4>
                            <div className="space-y-2">
                                <label className="flex justify-between items-center">
                                    <span>Separación Celular: {styles.mobileLogoGap}px</span>
                                    <input type="range" min="0" max="32" value={styles.mobileLogoGap} onChange={(e) => setStyles({...styles, mobileLogoGap: Number(e.target.value)})} className="w-1/2" />
                                </label>
                                <label className="flex justify-between items-center">
                                    <span>Separación PC: {styles.desktopLogoGap}px</span>
                                    <input type="range" min="0" max="48" value={styles.desktopLogoGap} onChange={(e) => setStyles({...styles, desktopLogoGap: Number(e.target.value)})} className="w-1/2" />
                                </label>
                                <label className="flex justify-between items-center">
                                    <span>Solapamiento (Briz): {styles.logoBrizMarginLeft}px</span>
                                    <input type="range" min="-30" max="15" value={styles.logoBrizMarginLeft} onChange={(e) => setStyles({...styles, logoBrizMarginLeft: Number(e.target.value)})} className="w-1/2" />
                                </label>
                            </div>
                        </div>

                        <hr className="border-white/5" />

                        {/* Separators */}
                        <div>
                            <h4 className="font-bold text-brand-yellow/80 uppercase tracking-widest mb-2">Separadores (Huellas)</h4>
                            <div className="space-y-2">
                                <label className="flex justify-between items-center">
                                    <span>Margen lateral: {styles.separatorMargin}px</span>
                                    <input type="range" min="0" max="50" value={styles.separatorMargin} onChange={(e) => setStyles({...styles, separatorMargin: Number(e.target.value)})} className="w-1/2" />
                                </label>
                                <label className="flex justify-between items-center">
                                    <span>Alto de huella: {styles.separatorHeight}px</span>
                                    <input type="range" min="20" max="90" value={styles.separatorHeight} onChange={(e) => setStyles({...styles, separatorHeight: Number(e.target.value), separatorWidth: Math.round(Number(e.target.value) / 4)})} className="w-1/2" />
                                </label>
                            </div>
                        </div>

                        <hr className="border-white/5" />

                        {/* Text Centro */}
                        <div>
                            <h4 className="font-bold text-brand-yellow/80 uppercase tracking-widest mb-2">Texto "Centro de la Bicicleta"</h4>
                            <div className="space-y-2">
                                <label className="flex justify-between items-center">
                                    <span>Tamaño de letra: {styles.textFontSize}px</span>
                                    <input type="range" min="10" max="28" value={styles.textFontSize} onChange={(e) => setStyles({...styles, textFontSize: Number(e.target.value)})} className="w-1/2" />
                                </label>
                                <label className="flex justify-between items-center">
                                    <span>Desplazamiento Y: {styles.textYShift}px</span>
                                    <input type="range" min="-20" max="20" value={styles.textYShift} onChange={(e) => setStyles({...styles, textYShift: Number(e.target.value)})} className="w-1/2" />
                                </label>
                            </div>
                        </div>

                        <hr className="border-white/5" />

                        {/* Spacing buttons */}
                        <div>
                            <h4 className="font-bold text-brand-yellow/80 uppercase tracking-widest mb-2">Espaciado Botones PC</h4>
                            <div className="space-y-2">
                                <label className="flex justify-between items-center">
                                    <span>Espacio Nav: {styles.desktopNavGap}px</span>
                                    <input type="range" min="10" max="64" value={styles.desktopNavGap} onChange={(e) => setStyles({...styles, desktopNavGap: Number(e.target.value)})} className="w-1/2" />
                                </label>
                                <label className="flex justify-between items-center">
                                    <span>Espacio Grupo: {styles.buttonGroupGap}px</span>
                                    <input type="range" min="8" max="64" value={styles.buttonGroupGap} onChange={(e) => setStyles({...styles, buttonGroupGap: Number(e.target.value)})} className="w-1/2" />
                                </label>
                            </div>
                        </div>

                        <hr className="border-white/5" />

                        <div className="flex gap-2 pt-2">
                            <button 
                                onClick={() => {
                                    setStyles({
                                        mobileNavbarHeight: 88,
                                        desktopNavbarHeight: 120,
                                        mobileBikeHeight: 66,
                                        desktopBikeHeight: 108,
                                        mobileBrizHeight: 42,
                                        desktopBrizHeight: 68,
                                        mobileLogoGap: 8,
                                        desktopLogoGap: 16,
                                        logoBrizMarginLeft: 0,
                                        separatorMargin: 24,
                                        separatorHeight: 64,
                                        separatorWidth: 16,
                                        textFontSize: 16,
                                        textYShift: 0,
                                        desktopNavGap: 24,
                                        buttonGroupGap: 24,
                                    });
                                }}
                                className="w-1/2 py-2.5 bg-white/10 hover:bg-white/15 rounded-xl transition font-bold text-center"
                            >
                                Reiniciar
                            </button>
                            <button 
                                onClick={() => {
                                    navigator.clipboard.writeText(JSON.stringify(styles, null, 4));
                                    alert('¡Estilos copiados! Pégalos en el chat.');
                                }}
                                className="w-1/2 py-2.5 bg-brand-yellow text-brand-black hover:bg-brand-yellow/90 rounded-xl transition font-bold text-center"
                            >
                                Copiar Estilos
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </motion.header>
    );
}
