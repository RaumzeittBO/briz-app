import React, { useEffect, useState, type MouseEvent } from 'react';
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
    Globe,
    ChevronDown,
    type LucideIcon,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

type NavLinkItem = {
    label: string;
    href: string;
    icon: LucideIcon;
};

const getGroup1Links = (lang: string): NavLinkItem[] => [
    { label: lang === 'es' ? 'Alquiler' : 'Rentals', href: '/rentals', icon: Bike },
    { label: lang === 'es' ? 'Tienda' : 'Shop', href: '/shop', icon: Store },
    { label: lang === 'es' ? 'Ciclotours' : 'Ciclotours', href: '/routes', icon: Route },
    { label: lang === 'es' ? 'Mecánica' : 'Mechanics', href: '/service', icon: Wrench },
    { label: lang === 'es' ? 'Comunidad' : 'Community', href: '/community', icon: HandHeart },
];

const getGroup2Links = (lang: string): NavLinkItem[] => [
    { label: lang === 'es' ? 'Conócenos' : 'About Us', href: '/about', icon: Info },
    { label: lang === 'es' ? 'Preguntas frecuentes' : 'FAQ', href: '/contact', icon: HelpCircle },
];

const TireTrackSeparator = ({ className = '', style }: { className?: string; style?: React.CSSProperties }) => (
    <svg 
        className={`shrink-0 text-white/80 ${className}`} 
        viewBox="0 0 16 64" 
        fill="currentColor" 
        aria-hidden="true"
        style={style}
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
    const { language, setLanguage } = useLanguage();
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [langDropdownOpen, setLangDropdownOpen] = useState(false);

    const group1 = getGroup1Links(language);
    const group2 = getGroup2Links(language);
    const allLinks = [...group1, ...group2];



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
            `}</style>

            <div className="relative bg-brand-yellow">
                <nav className="mx-auto" style={{ maxWidth: 1560, paddingLeft: 20, paddingRight: 20 }}>
                    {/* ═══════════ DESKTOP NAVBAR ═══════════ */}
                    <div className="hidden lg:flex items-center justify-between" style={{ height: 86 }}>
                        {/* Left: Logos + Centro text */}
                        <Link 
                            to="/" 
                            className="group flex items-center shrink-0" 
                            aria-label="BRIZ Centro de la Bicicleta"
                        >
                            <img
                                src="/logo_bicicleta_principal.png"
                                alt="Bicicleta BRIZ"
                                className="w-auto shrink-0 object-contain brightness-0 invert transition-transform duration-200 group-hover:scale-[1.02]"
                                style={{ height: 80 }}
                            />
                            <img
                                src="/logo_briz_principal.png"
                                alt="BRIZ"
                                className="w-auto shrink-0 object-contain brightness-0 invert"
                                style={{ height: 56, marginLeft: -6 }}
                            />
                        </Link>

                        {/* Tire Track 1 */}
                        <TireTrackSeparator className="mx-2.5" style={{ height: 56, width: 16 }} />

                        {/* Centro de la Bicicleta text */}
                        <span className="font-cocon font-black uppercase leading-none tracking-wider text-white drop-shadow-sm shrink-0" style={{ fontSize: 18 }}>
                            Centro de la Bicicleta
                        </span>

                        {/* Tire Track 2 */}
                        <TireTrackSeparator className="mx-2.5" style={{ height: 56, width: 16 }} />

                        {/* Group 1 buttons */}
                        <div className="flex items-center" style={{ gap: 6 }}>
                            {group1.map((link) => {
                                const Icon = link.icon;
                                const active = isActive(link.href);
                                return (
                                    <Link
                                        key={link.label}
                                        to={link.href}
                                        onClick={(event) => handleNavClick(event, link.href)}
                                        className={`relative flex flex-col items-center justify-center gap-1 rounded-xl text-center transition-all duration-300 hover:bg-white/20 hover:scale-[1.03] ${
                                            active ? 'text-white' : 'text-brand-black'
                                        }`}
                                        style={{ paddingLeft: 7, paddingRight: 7, paddingTop: 4, paddingBottom: 4 }}
                                    >
                                        <Icon className="shrink-0 transition-transform duration-200" style={{ width: 24, height: 24 }} strokeWidth={2.0} />
                                        <span className="font-cocon font-bold tracking-wide leading-none notranslate" style={{ fontSize: 11 }}>{link.label}</span>
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

                        {/* Tire Track 3 */}
                        <TireTrackSeparator className="mx-2.5" style={{ height: 56, width: 16 }} />

                        {/* Group 2 buttons */}
                        <div className="flex items-center" style={{ gap: 6 }}>
                            {group2.map((link) => {
                                const Icon = link.icon;
                                const active = isActive(link.href);
                                return (
                                    <Link
                                        key={link.label}
                                        to={link.href}
                                        onClick={(event) => handleNavClick(event, link.href)}
                                        className={`relative flex flex-col items-center justify-center gap-1 rounded-xl text-center transition-all duration-300 hover:bg-white/20 hover:scale-[1.03] ${
                                            active ? 'text-white' : 'text-brand-black'
                                        }`}
                                        style={{ paddingLeft: 7, paddingRight: 7, paddingTop: 4, paddingBottom: 4 }}
                                    >
                                        <Icon className="shrink-0 transition-transform duration-200" style={{ width: 24, height: 24 }} strokeWidth={2.0} />
                                        <span className="font-cocon font-bold tracking-wide leading-none notranslate" style={{ fontSize: 11 }}>{link.label}</span>
                                        {active && (
                                            <motion.span
                                                layoutId="activeNavUnderline2"
                                                className="absolute inset-x-2 -bottom-1 h-[3px] rounded-full bg-white"
                                            />
                                        )}
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Desktop User Auth Button */}
                        <div className="flex items-center gap-2 ml-2">
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
                                            <Link
                                                to="/profile"
                                                className="w-full flex items-center gap-2 text-left px-3 py-2 text-xs font-bold text-white/80 hover:bg-white/5 rounded-xl mt-1 transition-colors font-cocon"
                                            >
                                                <User className="w-3.5 h-3.5" /> Mi perfil
                                            </Link>
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

                            {/* Language Selector Dropdown */}
                            <div className="relative ml-3 shrink-0">
                                <button
                                    onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                                    className="h-10 px-4 flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white font-cocon text-xs font-black uppercase transition-all duration-200 cursor-pointer shadow-sm"
                                    title={language === 'es' ? 'Cambiar idioma' : 'Change language'}
                                >
                                    <Globe className="w-3.5 h-3.5" />
                                    <span>{language === 'es' ? 'ES' : 'EN'}</span>
                                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-250 ${langDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>
                                
                                {langDropdownOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setLangDropdownOpen(false)} />
                                        <div className="absolute right-0 top-full mt-2 bg-[#0d0d0d] border border-white/10 rounded-2xl p-1.5 w-36 shadow-2xl z-50">
                                            <button
                                                onClick={() => {
                                                    setLanguage('es');
                                                    setLangDropdownOpen(false);
                                                }}
                                                className={`w-full flex items-center justify-between text-left px-3.5 py-2.5 text-xs font-bold rounded-xl transition-colors font-cocon cursor-pointer ${language === 'es' ? 'bg-brand-yellow text-brand-black font-black' : 'text-white/80 hover:bg-white/5 hover:text-white'}`}
                                            >
                                                Español (ES)
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setLanguage('en');
                                                    setLangDropdownOpen(false);
                                                }}
                                                className={`w-full flex items-center justify-between text-left px-3.5 py-2.5 text-xs font-bold rounded-xl transition-colors font-cocon mt-1 cursor-pointer ${language === 'en' ? 'bg-brand-yellow text-brand-black font-black' : 'text-white/80 hover:bg-white/5 hover:text-white'}`}
                                            >
                                                English (EN)
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ═══════════ MOBILE NAVBAR ═══════════ */}
                    <div className="flex lg:hidden items-center justify-between" style={{ height: 64 }}>
                        {/* Left: Logos */}
                        <Link 
                            to="/" 
                            className="group flex items-center shrink-0" 
                            aria-label="BRIZ Centro de la Bicicleta"
                        >
                            <img
                                src="/logo_bicicleta_principal.png"
                                alt="Bicicleta BRIZ"
                                className="w-auto shrink-0 object-contain brightness-0 invert"
                                style={{ height: 58 }}
                            />
                            <img
                                src="/logo_briz_principal.png"
                                alt="BRIZ"
                                className="w-auto shrink-0 object-contain brightness-0 invert"
                                style={{ height: 34, marginLeft: -4 }}
                            />
                        </Link>

                        {/* Tire Track separator - mobile */}
                        <TireTrackSeparator className="mx-1.5" style={{ height: 40, width: 12 }} />

                        {/* Centro de la Bicicleta text - mobile */}
                        <span className="font-cocon font-black uppercase leading-none tracking-wide text-white drop-shadow-sm shrink-0 whitespace-nowrap" style={{ fontSize: 'min(11px, 2.8vw)' }}>
                            Centro de la Bicicleta
                        </span>

                        {/* Spacer */}
                        <div className="flex-1" />

                        {/* Hamburger */}
                        <button
                            onClick={() => setMobileOpen((open) => !open)}
                            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/18 text-white transition-transform active:scale-95"
                            aria-label={mobileOpen ? 'Cerrar menu' : 'Abrir menu'}
                            aria-expanded={mobileOpen}
                            type="button"
                        >
                            {mobileOpen ? <X className="h-6 w-6" strokeWidth={2.5} /> : <Menu className="h-6 w-6" strokeWidth={2.5} />}
                        </button>
                    </div>
                </nav>

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
                            {allLinks.map((link) => {
                                const Icon = link.icon;
                                const active = isActive(link.href);
                                return (
                                    <Link
                                        key={link.label}
                                        to={link.href}
                                        onClick={(event) => handleNavClick(event, link.href)}
                                        className={`flex min-w-0 items-center gap-3 rounded-2xl px-4 py-3.5 font-cocon text-base font-bold text-brand-black transition-colors ${active ? 'bg-white/34' : 'bg-white/12 hover:bg-white/22'}`}
                                    >
                                        <Icon className="h-5 w-5 shrink-0" strokeWidth={2.2} />
                                        <span className={`min-w-0 flex-1 whitespace-normal break-words leading-tight notranslate ${link.label === 'Preguntas frecuentes' || link.label === 'FAQ' ? 'text-[15px]' : ''}`}>{link.label}</span>
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
                                        <Link
                                            to="/profile"
                                            onClick={() => setMobileOpen(false)}
                                            className="w-full flex min-w-0 items-center gap-3 rounded-2xl px-4 py-3 bg-white/12 text-brand-black font-cocon text-sm font-bold hover:bg-white/22 transition-all text-left"
                                        >
                                            <User className="h-5 w-5 shrink-0" strokeWidth={2.2} />
                                            <span className="min-w-0 flex-1 whitespace-normal break-words leading-tight">Mi perfil</span>
                                        </Link>
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

                            {/* Mobile Language Toggle */}
                            <div className="mt-3 pt-3 border-t border-brand-black/10">
                                <button
                                    onClick={() => {
                                        setLanguage(language === 'es' ? 'en' : 'es');
                                        setMobileOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 bg-white/12 text-brand-black font-cocon text-sm font-bold hover:bg-white/22 transition-all text-left"
                                >
                                    <Globe className="h-5 w-5 shrink-0" strokeWidth={2.2} />
                                    <span>{language === 'es' ? 'Cambiar a Inglés (EN)' : 'Switch to Spanish (ES)'}</span>
                                </button>
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
