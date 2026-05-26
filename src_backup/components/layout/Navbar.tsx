import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronRight } from 'lucide-react';
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
                ? 'bg-brand-black/95 backdrop-blur-xl shadow-lg shadow-black/20'
                : 'bg-transparent'
                }`}
        >
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 lg:h-20">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 group">
                        <img src="/images/briz-logo.jpg" alt="Briz" className="h-10 w-10 rounded-lg object-cover group-hover:scale-110 transition-transform" />
                        <span className="text-xl font-bold text-white tracking-tight">Briz</span>
                    </Link>

                    {/* Desktop nav */}
                    <div className="hidden lg:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                to={link.href}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${location.pathname === link.href
                                    ? 'text-brand-yellow bg-brand-yellow/10'
                                    : 'text-white/70 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* CTA */}
                    <div className="hidden lg:flex items-center gap-3">
                        <Link to="/rentals">
                            <Button className="bg-brand-yellow text-brand-black hover:bg-brand-yellow-light font-semibold gap-1">
                                Reservar <ChevronRight className="w-4 h-4" />
                            </Button>
                        </Link>
                    </div>

                    {/* Mobile menu toggle */}
                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="lg:hidden text-white p-2"
                    >
                        {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </nav>

            {/* Mobile menu */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="lg:hidden bg-brand-black/98 backdrop-blur-xl border-t border-white/10"
                    >
                        <div className="px-4 py-4 space-y-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    to={link.href}
                                    className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${location.pathname === link.href
                                        ? 'text-brand-yellow bg-brand-yellow/10'
                                        : 'text-white/70 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                            <div className="pt-2 flex flex-col gap-2">
                                <Link to="/rentals">
                                    <Button className="w-full bg-brand-yellow text-brand-black hover:bg-brand-yellow-light font-semibold">
                                        Reservar Ahora
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
