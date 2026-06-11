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
        className={`hidden shrink-0 text-white/80 md:block dyn-separator ${className}`} 
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

export interface NavbarStyles {
    mobileNavbarHeight: number;
    desktopNavbarHeight: number;
    mobileBikeHeight: number;
    desktopBikeHeight: number;
    mobileBrizHeight: number;
    desktopBrizHeight: number;
    mobileLogoGap: number;
    desktopLogoGap: number;
    logoBrizMarginLeft: number;
    separatorMargin: number;
    separatorHeight: number;
    separatorWidth: number;
    textFontSize: number;
    desktopNavGap: number;
    buttonGroupGap: number;

    logoTranslateX?: number;
    logoTranslateY?: number;
    bikeTranslateX?: number;
    bikeTranslateY?: number;
    brizTranslateX?: number;
    brizTranslateY?: number;
    track1TranslateX?: number;
    track1TranslateY?: number;
    textTranslateX?: number;
    textTranslateY?: number;
    track2TranslateX?: number;
    track2TranslateY?: number;
    g1TranslateX?: number;
    g1TranslateY?: number;
    track3TranslateX?: number;
    track3TranslateY?: number;
    g2TranslateX?: number;
    g2TranslateY?: number;

    mobileBikeTranslateX?: number;
    mobileBikeTranslateY?: number;
    mobileBrizTranslateX?: number;
    mobileBrizTranslateY?: number;
    mobileMenuTranslateX?: number;
    mobileMenuTranslateY?: number;

    navPaddingX: number;
    navMaxWidth: number;
    btnPaddingX: number;
    btnPaddingY: number;
    btnFontSize: number;
    btnIconSize: number;
}

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    
    const { currentCustomer, logoutCustomer } = useStore();
    const [authModalOpen, setAuthModalOpen] = useState(false);

    const [customizerOpen, setCustomizerOpen] = useState(false);
    const [dragMode, setDragMode] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 1024);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const [styles, setStyles] = useState<NavbarStyles>(() => {
        const saved = localStorage.getItem('briz-navbar-styles-v2');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) {}
        }
        return {
            mobileNavbarHeight: 90,
            desktopNavbarHeight: 133,
            mobileBikeHeight: 70,
            desktopBikeHeight: 150,
            mobileBrizHeight: 42,
            desktopBrizHeight: 111,
            mobileLogoGap: 3,
            desktopLogoGap: 0,
            logoBrizMarginLeft: -9,
            separatorMargin: 43,
            separatorHeight: 90,
            separatorWidth: 23,
            textFontSize: 25,
            desktopNavGap: 55,
            buttonGroupGap: 32,

            // 2D translation offsets
            logoTranslateX: 0,
            logoTranslateY: 0,
            bikeTranslateX: 0,
            bikeTranslateY: 0,
            brizTranslateX: 6,
            brizTranslateY: 7,
            track1TranslateX: 31,
            track1TranslateY: 13,
            textTranslateX: -25,
            textTranslateY: 11,
            track2TranslateX: 328,
            track2TranslateY: 19,
            g1TranslateX: 148,
            g1TranslateY: -6,
            track3TranslateX: 7,
            track3TranslateY: 0,
            g2TranslateX: -58,
            g2TranslateY: -1,

            // Mobile-specific offsets
            mobileBikeTranslateX: 0,
            mobileBikeTranslateY: 0,
            mobileBrizTranslateX: 3,
            mobileBrizTranslateY: 3,
            mobileMenuTranslateX: 0,
            mobileMenuTranslateY: 0,

            // Layout configurations
            navPaddingX: 80,
            navMaxWidth: 1640,
            btnPaddingX: 8,
            btnPaddingY: 6,
            btnFontSize: 15,
            btnIconSize: 44,
        };
    });

    useEffect(() => {
        localStorage.setItem('briz-navbar-styles-v2', JSON.stringify(styles));
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

    // 2D translation offsets with safe defaults
    const bikeTranslateX = styles.bikeTranslateX ?? 0;
    const bikeTranslateY = styles.bikeTranslateY ?? 0;
    const brizTranslateX = styles.brizTranslateX ?? 0;
    const brizTranslateY = styles.brizTranslateY ?? 0;
    const track1TranslateX = styles.track1TranslateX ?? 0;
    const track1TranslateY = styles.track1TranslateY ?? 0;
    const textTranslateX = styles.textTranslateX ?? 0;
    const textTranslateY = styles.textTranslateY ?? 0;
    const track2TranslateX = styles.track2TranslateX ?? 0;
    const track2TranslateY = styles.track2TranslateY ?? 0;
    const g1TranslateX = styles.g1TranslateX ?? 0;
    const g1TranslateY = styles.g1TranslateY ?? 0;
    const track3TranslateX = styles.track3TranslateX ?? 0;
    const track3TranslateY = styles.track3TranslateY ?? 0;
    const g2TranslateX = styles.g2TranslateX ?? 0;
    const g2TranslateY = styles.g2TranslateY ?? 0;

    // Mobile offsets
    const mobileBikeTranslateX = styles.mobileBikeTranslateX ?? 0;
    const mobileBikeTranslateY = styles.mobileBikeTranslateY ?? 0;
    const mobileBrizTranslateX = styles.mobileBrizTranslateX ?? 0;
    const mobileBrizTranslateY = styles.mobileBrizTranslateY ?? 0;
    const mobileMenuTranslateX = styles.mobileMenuTranslateX ?? 0;
    const mobileMenuTranslateY = styles.mobileMenuTranslateY ?? 0;

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
                    
                    --nav-gap: ${styles.desktopNavGap}px;
                    --btn-gap: ${styles.buttonGroupGap}px;

                    /* Spacings and sizes */
                    --nav-padding-x: ${styles.navPaddingX}px;
                    --nav-max-w: ${styles.navMaxWidth}px;
                    
                    --btn-px: ${styles.btnPaddingX}px;
                    --btn-py: ${styles.btnPaddingY}px;
                    --btn-fs: ${styles.btnFontSize}px;
                    --icon-sz: ${styles.btnIconSize}px;
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
                }
                
                .dyn-desktop-nav {
                    gap: var(--nav-gap) !important;
                }
                
                .dyn-btn-group {
                    gap: var(--btn-gap) !important;
                }
                
                .dyn-nav-container {
                    max-width: var(--nav-max-w) !important;
                    padding-left: var(--nav-padding-x) !important;
                    padding-right: var(--nav-padding-x) !important;
                }
                
                .dyn-btn {
                    padding-left: var(--btn-px) !important;
                    padding-right: var(--btn-px) !important;
                    padding-top: var(--btn-py) !important;
                    padding-bottom: var(--btn-py) !important;
                }
                
                .dyn-btn-text {
                    font-size: var(--btn-fs) !important;
                }
                
                .dyn-btn-icon {
                    width: var(--icon-sz) !important;
                    height: var(--icon-sz) !important;
                }
            `}</style>

            {dragMode && (
                <div className="bg-red-600 text-white font-cocon text-xs font-bold text-center py-2.5 px-4 flex items-center justify-center gap-2 z-[60] shadow-md border-b border-red-700 select-none">
                    <span>🔧 Modo Arrastre Libre Activo: Arrastra los logos, textos, huellas o botones para colocarlos donde quieras. Haz clic en "Copiar Estilos" en el panel flotante para guardar los cambios.</span>
                    <button 
                        onClick={() => setDragMode(false)}
                        className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-lg text-[10px] uppercase font-black transition active:scale-95"
                    >
                        Salir de Edición
                    </button>
                </div>
            )}

            <div className="relative bg-brand-yellow">
                <nav className="mx-auto dyn-nav-container">
                    <div className="flex items-center justify-between gap-3 dyn-navbar">
                        <div className="flex items-center gap-1 sm:gap-2">
                            <Link 
                                to="/" 
                                className="group flex items-center shrink-0 pl-1 dyn-logo-link" 
                                aria-label="BRIZ Centro de la Bicicleta"
                                onClick={(e) => { if (dragMode) e.preventDefault(); }}
                            >
                                <motion.div
                                    drag={dragMode}
                                    dragMomentum={false}
                                    style={{ 
                                        x: isMobile ? mobileBikeTranslateX : bikeTranslateX, 
                                        y: isMobile ? mobileBikeTranslateY : bikeTranslateY 
                                    }}
                                    onDragEnd={(_, info) => {
                                        if (!dragMode) return;
                                        setStyles(prev => ({
                                            ...prev,
                                            [isMobile ? 'mobileBikeTranslateX' : 'bikeTranslateX']: (isMobile ? (prev.mobileBikeTranslateX ?? 0) : (prev.bikeTranslateX ?? 0)) + info.offset.x,
                                            [isMobile ? 'mobileBikeTranslateY' : 'bikeTranslateY']: (isMobile ? (prev.mobileBikeTranslateY ?? 0) : (prev.bikeTranslateY ?? 0)) + info.offset.y
                                        }));
                                    }}
                                    className={dragMode ? "border border-dashed border-brand-charcoal/60 bg-brand-charcoal/5 cursor-grab active:cursor-grabbing p-1 rounded-xl select-none" : "shrink-0"}
                                >
                                    <img
                                        src="/logo_bicicleta_principal.png"
                                        alt="Bicicleta BRIZ"
                                        className="w-auto shrink-0 object-contain brightness-0 invert transition-transform duration-200 group-hover:scale-[1.02] dyn-bike-logo"
                                    />
                                </motion.div>

                                <motion.div
                                    drag={dragMode}
                                    dragMomentum={false}
                                    style={{ 
                                        x: isMobile ? mobileBrizTranslateX : brizTranslateX, 
                                        y: isMobile ? mobileBrizTranslateY : brizTranslateY 
                                    }}
                                    onDragEnd={(_, info) => {
                                        if (!dragMode) return;
                                        setStyles(prev => ({
                                            ...prev,
                                            [isMobile ? 'mobileBrizTranslateX' : 'brizTranslateX']: (isMobile ? (prev.mobileBrizTranslateX ?? 0) : (prev.brizTranslateX ?? 0)) + info.offset.x,
                                            [isMobile ? 'mobileBrizTranslateY' : 'brizTranslateY']: (isMobile ? (prev.mobileBrizTranslateY ?? 0) : (prev.brizTranslateY ?? 0)) + info.offset.y
                                        }));
                                    }}
                                    className={dragMode ? "border border-dashed border-brand-charcoal/60 bg-brand-charcoal/5 cursor-grab active:cursor-grabbing p-1 rounded-xl select-none" : "shrink-0"}
                                >
                                    <img
                                        src="/logo_briz_principal.png"
                                        alt="BRIZ"
                                        className="w-auto shrink-0 object-contain brightness-0 invert dyn-briz-logo"
                                    />
                                </motion.div>
                            </Link>

                            <motion.div
                                drag={dragMode && !isMobile}
                                dragMomentum={false}
                                style={{ x: track1TranslateX, y: track1TranslateY }}
                                onDragEnd={(_, info) => {
                                    if (!dragMode || isMobile) return;
                                    setStyles(prev => ({
                                        ...prev,
                                        track1TranslateX: (prev.track1TranslateX ?? 0) + info.offset.x,
                                        track1TranslateY: (prev.track1TranslateY ?? 0) + info.offset.y
                                    }));
                                }}
                                className={dragMode && !isMobile ? "border border-dashed border-brand-charcoal/60 bg-brand-charcoal/5 cursor-grab active:cursor-grabbing p-1 rounded-xl select-none" : ""}
                            >
                                <TireTrackSeparator className="dyn-track-1" />
                            </motion.div>

                            <motion.div 
                                drag={dragMode && !isMobile}
                                dragMomentum={false}
                                style={{ x: textTranslateX, y: textTranslateY }}
                                onDragEnd={(_, info) => {
                                    if (!dragMode || isMobile) return;
                                    setStyles(prev => ({
                                        ...prev,
                                        textTranslateX: (prev.textTranslateX ?? 0) + info.offset.x,
                                        textTranslateY: (prev.textTranslateY ?? 0) + info.offset.y
                                    }));
                                }}
                                className={dragMode && !isMobile ? "border border-dashed border-brand-charcoal/60 bg-brand-charcoal/5 cursor-grab active:cursor-grabbing p-2 rounded-xl select-none" : "hidden md:flex items-center h-full dyn-text-wrapper"}
                            >
                                <span className="font-maiandra font-black uppercase leading-none tracking-widest text-white drop-shadow-sm shrink-0 dyn-text-centro">
                                    Centro de la Bicicleta
                                </span>
                            </motion.div>
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden items-center lg:flex h-full dyn-desktop-nav">
                            <motion.div
                                drag={dragMode && !isMobile}
                                dragMomentum={false}
                                style={{ x: track2TranslateX, y: track2TranslateY }}
                                onDragEnd={(_, info) => {
                                    if (!dragMode || isMobile) return;
                                    setStyles(prev => ({
                                        ...prev,
                                        track2TranslateX: (prev.track2TranslateX ?? 0) + info.offset.x,
                                        track2TranslateY: (prev.track2TranslateY ?? 0) + info.offset.y
                                    }));
                                }}
                                className={dragMode && !isMobile ? "border border-dashed border-brand-charcoal/60 bg-brand-charcoal/5 cursor-grab active:cursor-grabbing p-1 rounded-xl select-none" : ""}
                            >
                                <TireTrackSeparator className="dyn-track-2" />
                            </motion.div>

                            <motion.div 
                                drag={dragMode && !isMobile}
                                dragMomentum={false}
                                style={{ x: g1TranslateX, y: g1TranslateY }}
                                onDragEnd={(_, info) => {
                                    if (!dragMode || isMobile) return;
                                    setStyles(prev => ({
                                        ...prev,
                                        g1TranslateX: (prev.g1TranslateX ?? 0) + info.offset.x,
                                        g1TranslateY: (prev.g1TranslateY ?? 0) + info.offset.y
                                    }));
                                }}
                                className={dragMode && !isMobile ? "border border-dashed border-brand-charcoal/60 bg-brand-charcoal/5 cursor-grab active:cursor-grabbing p-2 rounded-xl select-none" : "flex items-center dyn-btn-group"}
                            >
                                {group1Links.map((link) => {
                                    const Icon = link.icon;
                                    const active = isActive(link.href);
                                    return (
                                        <Link
                                            key={link.label}
                                            to={link.href}
                                            onClick={(event) => {
                                                if (dragMode) {
                                                    event.preventDefault();
                                                    return;
                                                }
                                                handleNavClick(event, link.href);
                                            }}
                                            className={`relative flex flex-col items-center justify-center gap-1.5 rounded-xl text-center transition-all duration-300 hover:bg-white/20 hover:scale-[1.03] dyn-btn ${
                                                active ? 'text-white' : 'text-brand-black'
                                            }`}
                                        >
                                            <Icon className="shrink-0 transition-transform duration-200 dyn-btn-icon" strokeWidth={2.0} />
                                            <span className="font-cocon font-bold tracking-wide leading-none dyn-btn-text">{link.label}</span>
                                            {active && (
                                                <motion.span
                                                    layoutId="activeNavUnderline"
                                                    className="absolute inset-x-2 -bottom-1 h-[3px] rounded-full bg-white"
                                                />
                                            )}
                                        </Link>
                                    );
                                })}
                            </motion.div>

                            <motion.div
                                drag={dragMode && !isMobile}
                                dragMomentum={false}
                                style={{ x: track3TranslateX, y: track3TranslateY }}
                                onDragEnd={(_, info) => {
                                    if (!dragMode || isMobile) return;
                                    setStyles(prev => ({
                                        ...prev,
                                        track3TranslateX: (prev.track3TranslateX ?? 0) + info.offset.x,
                                        track3TranslateY: (prev.track3TranslateY ?? 0) + info.offset.y
                                    }));
                                }}
                                className={dragMode && !isMobile ? "border border-dashed border-brand-charcoal/60 bg-brand-charcoal/5 cursor-grab active:cursor-grabbing p-1 rounded-xl select-none" : ""}
                            >
                                <TireTrackSeparator className="dyn-track-3" />
                            </motion.div>

                            <motion.div 
                                drag={dragMode && !isMobile}
                                dragMomentum={false}
                                style={{ x: g2TranslateX, y: g2TranslateY }}
                                onDragEnd={(_, info) => {
                                    if (!dragMode || isMobile) return;
                                    setStyles(prev => ({
                                        ...prev,
                                        g2TranslateX: (prev.g2TranslateX ?? 0) + info.offset.x,
                                        g2TranslateY: (prev.g2TranslateY ?? 0) + info.offset.y
                                    }));
                                }}
                                className={dragMode && !isMobile ? "border border-dashed border-brand-charcoal/60 bg-brand-charcoal/5 cursor-grab active:cursor-grabbing p-2 rounded-xl select-none" : "flex items-center dyn-btn-group"}
                            >
                                {group2Links.map((link) => {
                                    const Icon = link.icon;
                                    const active = isActive(link.href);
                                    return (
                                        <Link
                                            key={link.label}
                                            to={link.href}
                                            onClick={(event) => {
                                                if (dragMode) {
                                                    event.preventDefault();
                                                    return;
                                                }
                                                handleNavClick(event, link.href);
                                            }}
                                            className={`relative flex flex-col items-center justify-center gap-1.5 rounded-xl text-center transition-all duration-300 hover:bg-white/20 hover:scale-[1.03] dyn-btn ${
                                                active ? 'text-white' : 'text-brand-black'
                                            }`}
                                        >
                                            <Icon className="shrink-0 transition-transform duration-200 dyn-btn-icon" strokeWidth={2.0} />
                                            <span className="font-cocon font-bold tracking-wide leading-none dyn-btn-text">{link.label}</span>
                                            {active && (
                                                <motion.span
                                                    layoutId="activeNavUnderline"
                                                    className="absolute inset-x-2 -bottom-1 h-[3px] rounded-full bg-white"
                                                />
                                            )}
                                        </Link>
                                    );
                                })}
                            </motion.div>
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

                        <motion.div
                            drag={dragMode && isMobile}
                            dragMomentum={false}
                            style={{ 
                                x: isMobile ? mobileMenuTranslateX : 0, 
                                y: isMobile ? mobileMenuTranslateY : 0 
                            }}
                            onDragEnd={(_, info) => {
                                if (!dragMode || !isMobile) return;
                                setStyles(prev => ({
                                    ...prev,
                                    mobileMenuTranslateX: (prev.mobileMenuTranslateX ?? 0) + info.offset.x,
                                    mobileMenuTranslateY: (prev.mobileMenuTranslateY ?? 0) + info.offset.y
                                }));
                            }}
                            className={dragMode && isMobile ? "border border-dashed border-brand-charcoal/60 bg-brand-charcoal/5 cursor-grab active:cursor-grabbing p-1 rounded-xl select-none" : "ml-auto lg:hidden"}
                        >
                            <button
                                onClick={() => !dragMode && setMobileOpen((open) => !open)}
                                className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/18 text-white transition-transform active:scale-95"
                                aria-label={mobileOpen ? 'Cerrar menu' : 'Abrir menu'}
                                aria-expanded={mobileOpen}
                                type="button"
                            >
                                {mobileOpen ? <X className="h-7 w-7" strokeWidth={2.5} /> : <Menu className="h-7 w-7" strokeWidth={2.5} />}
                            </button>
                        </motion.div>
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
                        {/* Drag & Drop Toggle */}
                        <div className="border border-white/10 bg-brand-yellow/10 rounded-2xl p-4 mb-2">
                            <h4 className="font-bold text-brand-yellow uppercase tracking-wider mb-2 flex items-center gap-1.5 text-xs">
                                <span>🎮 Arrastre Libre</span>
                                <span className="text-[10px] bg-brand-yellow text-brand-black px-2 py-0.5 rounded-full font-black animate-pulse">NUEVO</span>
                            </h4>
                            <p className="text-white/60 mb-3 text-[10px] leading-relaxed">
                                Activa esta opción para mover CUALQUIER elemento (logos, textos, huellas, botones) arrastrándolo directamente con el ratón. Los links se desactivarán para permitir el arrastre.
                            </p>
                            <button
                                onClick={() => setDragMode(!dragMode)}
                                className={`w-full py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 text-xs ${
                                    dragMode 
                                        ? 'bg-red-500 text-white hover:bg-red-600' 
                                        : 'bg-brand-yellow text-brand-black hover:bg-brand-yellow/90'
                                }`}
                            >
                                {dragMode ? '🛑 Desactivar Arrastre Libre' : '🖱️ Activar Arrastre Libre (Drag)'}
                            </button>
                        </div>

                        {/* Section: Dimensiones */}
                        <div className="border border-white/5 bg-white/5 rounded-2xl p-3">
                            <h4 className="font-bold text-brand-yellow uppercase tracking-wider mb-2">📐 Dimensiones y Escala</h4>
                            <div className="space-y-3">
                                <label className="flex justify-between items-center">
                                    <span>Navbar Alto (Cel): {styles.mobileNavbarHeight}px</span>
                                    <input type="range" min="60" max="140" value={styles.mobileNavbarHeight} onChange={(e) => setStyles({...styles, mobileNavbarHeight: Number(e.target.value)})} className="w-1/2" />
                                </label>
                                <label className="flex justify-between items-center">
                                    <span>Navbar Alto (PC): {styles.desktopNavbarHeight}px</span>
                                    <input type="range" min="80" max="180" value={styles.desktopNavbarHeight} onChange={(e) => setStyles({...styles, desktopNavbarHeight: Number(e.target.value)})} className="w-1/2" />
                                </label>
                                <label className="flex justify-between items-center">
                                    <span>Bici Alto (Cel): {styles.mobileBikeHeight}px</span>
                                    <input type="range" min="40" max="120" value={styles.mobileBikeHeight} onChange={(e) => setStyles({...styles, mobileBikeHeight: Number(e.target.value)})} className="w-1/2" />
                                </label>
                                <label className="flex justify-between items-center">
                                    <span>Bici Alto (PC): {styles.desktopBikeHeight}px</span>
                                    <input type="range" min="60" max="160" value={styles.desktopBikeHeight} onChange={(e) => setStyles({...styles, desktopBikeHeight: Number(e.target.value)})} className="w-1/2" />
                                </label>
                                <label className="flex justify-between items-center">
                                    <span>Briz Alto (Cel): {styles.mobileBrizHeight}px</span>
                                    <input type="range" min="20" max="90" value={styles.mobileBrizHeight} onChange={(e) => setStyles({...styles, mobileBrizHeight: Number(e.target.value)})} className="w-1/2" />
                                </label>
                                <label className="flex justify-between items-center">
                                    <span>Briz Alto (PC): {styles.desktopBrizHeight}px</span>
                                    <input type="range" min="30" max="120" value={styles.desktopBrizHeight} onChange={(e) => setStyles({...styles, desktopBrizHeight: Number(e.target.value)})} className="w-1/2" />
                                </label>
                            </div>
                        </div>

                        {/* Section: Espaciados */}
                        <div className="border border-white/5 bg-white/5 rounded-2xl p-3">
                            <h4 className="font-bold text-brand-yellow uppercase tracking-wider mb-2">↔️ Espaciados y Gaps</h4>
                            <div className="space-y-3">
                                <label className="flex justify-between items-center">
                                    <span>Bici-Briz Gap (Cel): {styles.mobileLogoGap}px</span>
                                    <input type="range" min="0" max="32" value={styles.mobileLogoGap} onChange={(e) => setStyles({...styles, mobileLogoGap: Number(e.target.value)})} className="w-1/2" />
                                </label>
                                <label className="flex justify-between items-center">
                                    <span>Bici-Briz Gap (PC): {styles.desktopLogoGap}px</span>
                                    <input type="range" min="0" max="48" value={styles.desktopLogoGap} onChange={(e) => setStyles({...styles, desktopLogoGap: Number(e.target.value)})} className="w-1/2" />
                                </label>
                                <label className="flex justify-between items-center">
                                    <span>Solapamiento Briz: {styles.logoBrizMarginLeft}px</span>
                                    <input type="range" min="-30" max="15" value={styles.logoBrizMarginLeft} onChange={(e) => setStyles({...styles, logoBrizMarginLeft: Number(e.target.value)})} className="w-1/2" />
                                </label>
                                <label className="flex justify-between items-center">
                                    <span>Margen Huellas: {styles.separatorMargin}px</span>
                                    <input type="range" min="0" max="50" value={styles.separatorMargin} onChange={(e) => setStyles({...styles, separatorMargin: Number(e.target.value)})} className="w-1/2" />
                                </label>
                                <label className="flex justify-between items-center">
                                    <span>Alto Huella: {styles.separatorHeight}px</span>
                                    <input type="range" min="20" max="90" value={styles.separatorHeight} onChange={(e) => setStyles({...styles, separatorHeight: Number(e.target.value), separatorWidth: Math.round(Number(e.target.value) / 4)})} className="w-1/2" />
                                </label>
                            </div>
                        </div>

                        {/* Section: Textos y Botones */}
                        <div className="border border-white/5 bg-white/5 rounded-2xl p-3">
                            <h4 className="font-bold text-brand-yellow uppercase tracking-wider mb-2">🔤 Textos y Botones</h4>
                            <div className="space-y-3">
                                <label className="flex justify-between items-center">
                                    <span>Texto Centro Font: {styles.textFontSize}px</span>
                                    <input type="range" min="10" max="28" value={styles.textFontSize} onChange={(e) => setStyles({...styles, textFontSize: Number(e.target.value)})} className="w-1/2" />
                                </label>
                                <label className="flex justify-between items-center">
                                    <span>Botón Padding X: {styles.btnPaddingX}px</span>
                                    <input type="range" min="4" max="24" value={styles.btnPaddingX} onChange={(e) => setStyles({...styles, btnPaddingX: Number(e.target.value)})} className="w-1/2" />
                                </label>
                                <label className="flex justify-between items-center">
                                    <span>Botón Padding Y: {styles.btnPaddingY}px</span>
                                    <input type="range" min="2" max="16" value={styles.btnPaddingY} onChange={(e) => setStyles({...styles, btnPaddingY: Number(e.target.value)})} className="w-1/2" />
                                </label>
                                <label className="flex justify-between items-center">
                                    <span>Botón Font Size: {styles.btnFontSize}px</span>
                                    <input type="range" min="9" max="20" value={styles.btnFontSize} onChange={(e) => setStyles({...styles, btnFontSize: Number(e.target.value)})} className="w-1/2" />
                                </label>
                                <label className="flex justify-between items-center">
                                    <span>Botón Icon Size: {styles.btnIconSize}px</span>
                                    <input type="range" min="16" max="48" value={styles.btnIconSize} onChange={(e) => setStyles({...styles, btnIconSize: Number(e.target.value)})} className="w-1/2" />
                                </label>
                            </div>
                        </div>

                        {/* Section: 2D Translations */}
                        <div className="border border-white/5 bg-white/5 rounded-2xl p-3">
                            <h4 className="font-bold text-brand-yellow uppercase tracking-wider mb-3">🎮 Posición 2D (Mover Manual)</h4>
                            <div className="space-y-4">
                                <div className="border-b border-white/10 pb-2 mb-2">
                                    <span className="font-black text-brand-yellow uppercase tracking-wider block mb-1.5">🖥️ Layout PC (Desktop)</span>
                                    
                                    {/* Bike Logo PC */}
                                    <div className="mb-2">
                                        <span className="font-bold text-white/80 block mb-0.5">Bicicleta Logo (PC):</span>
                                        <label className="flex justify-between items-center">
                                            <span>X: {bikeTranslateX}px</span>
                                            <input type="range" min="-150" max="150" value={bikeTranslateX} onChange={(e) => setStyles({...styles, bikeTranslateX: Number(e.target.value)})} className="w-1/2" />
                                        </label>
                                        <label className="flex justify-between items-center">
                                            <span>Y: {bikeTranslateY}px</span>
                                            <input type="range" min="-80" max="80" value={bikeTranslateY} onChange={(e) => setStyles({...styles, bikeTranslateY: Number(e.target.value)})} className="w-1/2" />
                                        </label>
                                    </div>

                                    {/* Briz Logo PC */}
                                    <div className="mb-2">
                                        <span className="font-bold text-white/80 block mb-0.5">Briz Logo (PC):</span>
                                        <label className="flex justify-between items-center">
                                            <span>X: {brizTranslateX}px</span>
                                            <input type="range" min="-150" max="150" value={brizTranslateX} onChange={(e) => setStyles({...styles, brizTranslateX: Number(e.target.value)})} className="w-1/2" />
                                        </label>
                                        <label className="flex justify-between items-center">
                                            <span>Y: {brizTranslateY}px</span>
                                            <input type="range" min="-80" max="80" value={brizTranslateY} onChange={(e) => setStyles({...styles, brizTranslateY: Number(e.target.value)})} className="w-1/2" />
                                        </label>
                                    </div>

                                    {/* Track 1 translation */}
                                    <div className="mb-2">
                                        <span className="font-bold text-white/80 block mb-0.5">Huella 1 (Separador):</span>
                                        <label className="flex justify-between items-center">
                                            <span>X: {track1TranslateX}px</span>
                                            <input type="range" min="-100" max="100" value={track1TranslateX} onChange={(e) => setStyles({...styles, track1TranslateX: Number(e.target.value)})} className="w-1/2" />
                                        </label>
                                        <label className="flex justify-between items-center">
                                            <span>Y: {track1TranslateY}px</span>
                                            <input type="range" min="-50" max="50" value={track1TranslateY} onChange={(e) => setStyles({...styles, track1TranslateY: Number(e.target.value)})} className="w-1/2" />
                                        </label>
                                    </div>

                                    {/* Text Centro translation */}
                                    <div className="mb-2">
                                        <span className="font-bold text-white/80 block mb-0.5">Texto Centro:</span>
                                        <label className="flex justify-between items-center">
                                            <span>X: {textTranslateX}px</span>
                                            <input type="range" min="-150" max="150" value={textTranslateX} onChange={(e) => setStyles({...styles, textTranslateX: Number(e.target.value)})} className="w-1/2" />
                                        </label>
                                        <label className="flex justify-between items-center">
                                            <span>Y: {textTranslateY}px</span>
                                            <input type="range" min="-50" max="50" value={textTranslateY} onChange={(e) => setStyles({...styles, textTranslateY: Number(e.target.value)})} className="w-1/2" />
                                        </label>
                                    </div>

                                    {/* Track 2 translation */}
                                    <div className="mb-2">
                                        <span className="font-bold text-white/80 block mb-0.5">Huella 2 (Separador):</span>
                                        <label className="flex justify-between items-center">
                                            <span>X: {track2TranslateX}px</span>
                                            <input type="range" min="-100" max="100" value={track2TranslateX} onChange={(e) => setStyles({...styles, track2TranslateX: Number(e.target.value)})} className="w-1/2" />
                                        </label>
                                        <label className="flex justify-between items-center">
                                            <span>Y: {track2TranslateY}px</span>
                                            <input type="range" min="-50" max="50" value={track2TranslateY} onChange={(e) => setStyles({...styles, track2TranslateY: Number(e.target.value)})} className="w-1/2" />
                                        </label>
                                    </div>

                                    {/* Group 1 translation */}
                                    <div className="mb-2">
                                        <span className="font-bold text-white/80 block mb-0.5">Grupo Botones 1:</span>
                                        <label className="flex justify-between items-center">
                                            <span>X: {g1TranslateX}px</span>
                                            <input type="range" min="-200" max="200" value={g1TranslateX} onChange={(e) => setStyles({...styles, g1TranslateX: Number(e.target.value)})} className="w-1/2" />
                                        </label>
                                        <label className="flex justify-between items-center">
                                            <span>Y: {g1TranslateY}px</span>
                                            <input type="range" min="-80" max="80" value={g1TranslateY} onChange={(e) => setStyles({...styles, g1TranslateY: Number(e.target.value)})} className="w-1/2" />
                                        </label>
                                    </div>

                                    {/* Track 3 translation */}
                                    <div className="mb-2">
                                        <span className="font-bold text-white/80 block mb-0.5">Huella 3 (Separador):</span>
                                        <label className="flex justify-between items-center">
                                            <span>X: {track3TranslateX}px</span>
                                            <input type="range" min="-100" max="100" value={track3TranslateX} onChange={(e) => setStyles({...styles, track3TranslateX: Number(e.target.value)})} className="w-1/2" />
                                        </label>
                                        <label className="flex justify-between items-center">
                                            <span>Y: {track3TranslateY}px</span>
                                            <input type="range" min="-50" max="50" value={track3TranslateY} onChange={(e) => setStyles({...styles, track3TranslateY: Number(e.target.value)})} className="w-1/2" />
                                        </label>
                                    </div>

                                    {/* Group 2 translation */}
                                    <div className="mb-2">
                                        <span className="font-bold text-white/80 block mb-0.5">Grupo Botones 2:</span>
                                        <label className="flex justify-between items-center">
                                            <span>X: {g2TranslateX}px</span>
                                            <input type="range" min="-200" max="200" value={g2TranslateX} onChange={(e) => setStyles({...styles, g2TranslateX: Number(e.target.value)})} className="w-1/2" />
                                        </label>
                                        <label className="flex justify-between items-center">
                                            <span>Y: {g2TranslateY}px</span>
                                            <input type="range" min="-80" max="80" value={g2TranslateY} onChange={(e) => setStyles({...styles, g2TranslateY: Number(e.target.value)})} className="w-1/2" />
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <span className="font-black text-brand-yellow uppercase tracking-wider block mb-1.5">📱 Layout Móvil (Celular)</span>
                                    
                                    {/* Bike Logo Mobile */}
                                    <div className="mb-2">
                                        <span className="font-bold text-white/80 block mb-0.5">Bicicleta Logo (Cel):</span>
                                        <label className="flex justify-between items-center">
                                            <span>X: {mobileBikeTranslateX}px</span>
                                            <input type="range" min="-100" max="100" value={mobileBikeTranslateX} onChange={(e) => setStyles({...styles, mobileBikeTranslateX: Number(e.target.value)})} className="w-1/2" />
                                        </label>
                                        <label className="flex justify-between items-center">
                                            <span>Y: {mobileBikeTranslateY}px</span>
                                            <input type="range" min="-50" max="50" value={mobileBikeTranslateY} onChange={(e) => setStyles({...styles, mobileBikeTranslateY: Number(e.target.value)})} className="w-1/2" />
                                        </label>
                                    </div>

                                    {/* Briz Logo Mobile */}
                                    <div className="mb-2">
                                        <span className="font-bold text-white/80 block mb-0.5">Briz Logo (Cel):</span>
                                        <label className="flex justify-between items-center">
                                            <span>X: {mobileBrizTranslateX}px</span>
                                            <input type="range" min="-100" max="100" value={mobileBrizTranslateX} onChange={(e) => setStyles({...styles, mobileBrizTranslateX: Number(e.target.value)})} className="w-1/2" />
                                        </label>
                                        <label className="flex justify-between items-center">
                                            <span>Y: {mobileBrizTranslateY}px</span>
                                            <input type="range" min="-50" max="50" value={mobileBrizTranslateY} onChange={(e) => setStyles({...styles, mobileBrizTranslateY: Number(e.target.value)})} className="w-1/2" />
                                        </label>
                                    </div>

                                    {/* Menu Mobile */}
                                    <div className="mb-2">
                                        <span className="font-bold text-white/80 block mb-0.5">Botón Menú Hamburguesa (Cel):</span>
                                        <label className="flex justify-between items-center">
                                            <span>X: {mobileMenuTranslateX}px</span>
                                            <input type="range" min="-100" max="100" value={mobileMenuTranslateX} onChange={(e) => setStyles({...styles, mobileMenuTranslateX: Number(e.target.value)})} className="w-1/2" />
                                        </label>
                                        <label className="flex justify-between items-center">
                                            <span>Y: {mobileMenuTranslateY}px</span>
                                            <input type="range" min="-50" max="50" value={mobileMenuTranslateY} onChange={(e) => setStyles({...styles, mobileMenuTranslateY: Number(e.target.value)})} className="w-1/2" />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section: Layout PC Spacings */}
                        <div className="border border-white/5 bg-white/5 rounded-2xl p-3">
                            <h4 className="font-bold text-brand-yellow uppercase tracking-wider mb-2">🖥️ Contenedores y Layout PC</h4>
                            <div className="space-y-3">
                                <label className="flex justify-between items-center">
                                    <span>Margen Nav X: {styles.navPaddingX}px</span>
                                    <input type="range" min="4" max="80" value={styles.navPaddingX} onChange={(e) => setStyles({...styles, navPaddingX: Number(e.target.value)})} className="w-1/2" />
                                </label>
                                <label className="flex justify-between items-center">
                                    <span>Ancho Máximo Nav: {styles.navMaxWidth}px</span>
                                    <input type="range" min="1000" max="1800" step="20" value={styles.navMaxWidth} onChange={(e) => setStyles({...styles, navMaxWidth: Number(e.target.value)})} className="w-1/2" />
                                </label>
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
                                        mobileNavbarHeight: 90,
                                        desktopNavbarHeight: 133,
                                        mobileBikeHeight: 70,
                                        desktopBikeHeight: 150,
                                        mobileBrizHeight: 42,
                                        desktopBrizHeight: 111,
                                        mobileLogoGap: 3,
                                        desktopLogoGap: 0,
                                        logoBrizMarginLeft: -9,
                                        separatorMargin: 43,
                                        separatorHeight: 90,
                                        separatorWidth: 23,
                                        textFontSize: 25,
                                        desktopNavGap: 55,
                                        buttonGroupGap: 32,

                                        logoTranslateX: 0,
                                        logoTranslateY: 0,
                                        bikeTranslateX: 0,
                                        bikeTranslateY: 0,
                                        brizTranslateX: 6,
                                        brizTranslateY: 7,
                                        track1TranslateX: 31,
                                        track1TranslateY: 13,
                                        textTranslateX: -25,
                                        textTranslateY: 11,
                                        track2TranslateX: 328,
                                        track2TranslateY: 19,
                                        g1TranslateX: 148,
                                        g1TranslateY: -6,
                                        track3TranslateX: 7,
                                        track3TranslateY: 0,
                                        g2TranslateX: -58,
                                        g2TranslateY: -1,

                                        mobileBikeTranslateX: 0,
                                        mobileBikeTranslateY: 0,
                                        mobileBrizTranslateX: 3,
                                        mobileBrizTranslateY: 3,
                                        mobileMenuTranslateX: 0,
                                        mobileMenuTranslateY: 0,

                                        navPaddingX: 80,
                                        navMaxWidth: 1640,
                                        btnPaddingX: 8,
                                        btnPaddingY: 6,
                                        btnFontSize: 15,
                                        btnIconSize: 44,
                                    });
                                    setDragMode(false);
                                }}
                                className="w-1/2 py-2.5 bg-white/10 hover:bg-white/15 rounded-xl transition font-bold text-center text-xs"
                            >
                                Reiniciar
                            </button>
                            <button 
                                onClick={() => {
                                    navigator.clipboard.writeText(JSON.stringify(styles, null, 4));
                                    alert('¡Estilos copiados! Pégalos en el chat.');
                                }}
                                className="w-1/2 py-2.5 bg-brand-yellow text-brand-black hover:bg-brand-yellow/90 rounded-xl transition font-bold text-center text-xs"
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
