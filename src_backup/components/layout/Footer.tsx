import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock, Facebook, Instagram, MessageCircle } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-brand-black text-white">
            {/* Main footer */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                    {/* Brand */}
                    <div className="space-y-4">
                        <Link to="/" className="flex items-center gap-2">
                            <img src="/images/briz-logo.jpg" alt="Briz" className="h-10 w-10 rounded-lg object-cover" />
                            <span className="text-xl font-bold tracking-tight">Briz</span>
                        </Link>
                        <p className="text-white/60 text-sm leading-relaxed">
                            Tu experiencia ciclista en Cochabamba. Alquiler, venta, repuestos y servicio técnico de bicicletas.
                        </p>
                        <div className="flex gap-3">
                            <a href="https://www.facebook.com/Briz.Bolivia" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-brand-yellow/20 hover:text-brand-yellow transition-colors">
                                <Facebook className="w-4 h-4" />
                            </a>
                            <a href="https://www.instagram.com/briz.bolivia" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-brand-yellow/20 hover:text-brand-yellow transition-colors">
                                <Instagram className="w-4 h-4" />
                            </a>
                            <a href="https://www.tiktok.com/@briz.bolivia" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-brand-yellow/20 hover:text-brand-yellow transition-colors">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.87a8.16 8.16 0 0 0 4.76 1.52v-3.4a4.85 4.85 0 0 1-1-.3z" /></svg>
                            </a>
                            <a href="https://wa.me/59177860277" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-brand-yellow/20 hover:text-brand-yellow transition-colors">
                                <MessageCircle className="w-4 h-4" />
                            </a>
                        </div>
                    </div>

                    {/* Quick links */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-yellow">Navegación</h3>
                        <ul className="space-y-2">
                            {[
                                { label: 'Alquiler de bicis', href: '/rentals' },
                                { label: 'Tienda', href: '/shop' },
                                { label: 'Servicio técnico', href: '/service' },
                                { label: 'Rutas en Cochabamba', href: '/routes' },
                                { label: 'Sobre Briz', href: '/about' },
                                { label: 'Contacto', href: '/contact' },
                            ].map((link) => (
                                <li key={link.href}>
                                    <Link to={link.href} className="text-white/60 hover:text-brand-yellow text-sm transition-colors">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Services */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-yellow">Servicios</h3>
                        <ul className="space-y-2 text-sm text-white/60">
                            <li>Alquiler por horas y días</li>
                            <li>Venta de bicicletas</li>
                            <li>Repuestos y accesorios</li>
                            <li>Taller de reparación</li>
                            <li>Mantenimiento preventivo</li>
                            <li>Asesoría ciclista</li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-yellow">Contacto</h3>
                        <ul className="space-y-3 text-sm text-white/60">
                            <li className="flex items-start gap-3">
                                <MapPin className="w-4 h-4 text-brand-yellow flex-shrink-0 mt-0.5" />
                                <a href="https://maps.app.goo.gl/tgqw7ZK51Y68Q7L7A?g_st=iwb" target="_blank" rel="noopener noreferrer" className="hover:text-brand-yellow transition-colors">
                                    Cochabamba, Bolivia (Ver en mapa)
                                </a>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone className="w-4 h-4 text-brand-yellow flex-shrink-0" />
                                <span>+591 77860277</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail className="w-4 h-4 text-brand-yellow flex-shrink-0" />
                                <span>hola@briz.bo</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <Clock className="w-4 h-4 text-brand-yellow mt-0.5 flex-shrink-0" />
                                <div>
                                    <p>Lun - Sáb: 8:00 - 19:00</p>
                                    <p>Dom: 9:00 - 14:00</p>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <p className="text-white/40 text-xs">
                        © 2026 Briz. Todos los derechos reservados.
                    </p>
                    <p className="text-white/40 text-xs">
                        Cochabamba, Bolivia 🇧🇴
                    </p>
                </div>
            </div>
        </footer>
    );
}
