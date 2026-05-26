import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const navLinks = [
    { label: 'Inicio', href: '/' },
    { label: 'Alquiler', href: '/rentals' },
    { label: 'Tienda', href: '/shop' },
    { label: 'Servicio', href: '/service' },
    { label: 'Rutas', href: '/routes' },
    { label: 'Nosotros', href: '/about' },
    { label: 'Contacto', href: '/contact' },
];

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        setMobileOpen(false);
    }, [location]);

    return (
        <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5 }}
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
                ? 'shadow-[0_4px_20px_rgba(255,210,0,0.4)]'
                : ''
                }`}
        >
            {/* Main yellow bar */}
            <div className="bg-brand-yellow relative">
                <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16 lg:h-20">
                        {/* Logo section matching reference: Bike icon + Briz text + CENTRO DE LA BICICLETA */}
                        <Link to="/" className="flex items-center gap-2 group">
                            {/* Logo.jpg has yellow bg — blends seamlessly with navbar */}
                            <img 
                                src="/Logo.jpg" 
                                alt="Briz" 
                                className="h-14 w-14 sm:h-16 sm:w-16 object-contain group-hover:scale-105 transition-transform"
                            />
                            
                            {/* CENTRO DE LA BICICLETA title — matching the reference */}
                            <span className="hidden sm:block text-brand-black font-tan text-xs sm:text-sm tracking-[0.18em] uppercase leading-tight">
                                Centro de la Bicicleta
                            </span>
                        </Link>

                        {/* Desktop nav */}
                        <div className="hidden lg:flex items-center gap-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    to={link.href}
                                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 ${location.pathname === link.href
                                        ? 'text-brand-black bg-brand-black/10'
                                        : 'text-brand-black/70 hover:text-brand-black hover:bg-brand-black/5'
                                        }`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>

                        {/* CTA + Mobile toggle */}
                        <div className="flex items-center gap-3">
                            <Link to="/rentals" className="hidden lg:block">
                                <Button className="bg-brand-black text-brand-yellow hover:bg-brand-charcoal font-black gap-1 shadow-[4px_4px_0px_rgba(0,0,0,0.3)] rounded-xl">
                                    RESERVAR <ChevronRight className="w-4 h-4" />
                                </Button>
                            </Link>

                            {/* Hamburger — 3 thick lines like the reference design */}
                            <button
                                onClick={() => setMobileOpen(!mobileOpen)}
                                className="lg:hidden text-brand-black p-2"
                                aria-label="Menu"
                            >
                                {mobileOpen ? (
                                    <X className="w-7 h-7" strokeWidth={2.5} />
                                ) : (
                                    <div className="flex flex-col gap-[5px]">
                                        <span className="block w-7 h-[3px] bg-brand-black rounded-full"></span>
                                        <span className="block w-7 h-[3px] bg-brand-black rounded-full"></span>
                                        <span className="block w-7 h-[3px] bg-brand-black rounded-full"></span>
                                    </div>
                                )}
                            </button>
                        </div>
                    </div>
                </nav>

                {/* Curved bottom edge — smooth wave shape */}
                <div className="absolute -bottom-3 sm:-bottom-4 left-0 right-0 h-4 sm:h-5 overflow-hidden pointer-events-none" aria-hidden="true">
                    <svg viewBox="0 0 1440 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" preserveAspectRatio="none">
                        <path d="M0 0H1440V6C1440 6 1200 24 720 24C240 24 0 6 0 6V0Z" fill="#F5B800" />
                    </svg>
                </div>
            </div>

            {/* Mobile menu */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="lg:hidden bg-brand-yellow border-t-2 border-brand-black/10"
                    >
                        <div className="px-4 py-4 space-y-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    to={link.href}
                                    className={`block px-4 py-3 rounded-xl text-sm font-bold transition-colors ${location.pathname === link.href
                                        ? 'text-brand-black bg-brand-black/10'
                                        : 'text-brand-black/70 hover:text-brand-black hover:bg-brand-black/5'
                                        }`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                            <div className="pt-2 flex flex-col gap-2">
                                <Link to="/rentals">
                                    <Button className="w-full bg-brand-black text-brand-yellow hover:bg-brand-charcoal font-black rounded-xl">
                                        RESERVAR AHORA
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.header>
    );
}
