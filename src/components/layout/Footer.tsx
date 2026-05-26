import { Link } from 'react-router-dom';
import { MapPin, Facebook, Instagram, MessageCircle } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-brand-black text-white pt-20 pb-10 border-t-8 border-brand-yellow font-cocon">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* Brand column */}
                    <div className="space-y-6">
                        <Link to="/" className="flex items-center gap-3 group">
                            <img src="/Logo.jpg" alt="Briz" className="h-12 w-12 rounded-full object-cover border-2 border-brand-yellow shadow-lg" />
                            <span className="text-3xl font-tan text-brand-yellow tracking-tighter">Briz</span>
                        </Link>
                        <p className="text-white/60 font-maiandra leading-relaxed">
                            Transformando la movilidad en Cochabamba con estilo, energía y sostenibilidad. 
                            <span className="text-brand-yellow block mt-2 font-gochi text-xl">"Porque con Briz, Eres Feliz"</span>
                        </p>
                    </div>

                    {/* Links columns */}
                    <div>
                        <h4 className="font-tan text-2xl text-brand-yellow mb-6 uppercase">EXPLORA</h4>
                        <ul className="space-y-4">
                            {['Inicio', 'Alquiler', 'Tienda', 'Ciclotours', 'Mecánica'].map((item) => (
                                <li key={item}>
                                    <Link to="/" className="text-white/60 hover:text-brand-yellow transition-colors font-bold">
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Support column */}
                    <div>
                        <h4 className="font-tan text-2xl text-brand-yellow mb-6 uppercase">SOPORTE</h4>
                        <ul className="space-y-4 text-white/60 font-bold">
                            {['Contacto', 'Preguntas Frecuentes', 'Términos', 'Privacidad'].map((item) => (
                                <li key={item}>
                                    <Link to="/" className="hover:text-brand-yellow transition-colors">
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact column */}
                    <div>
                        <h4 className="font-tan text-2xl text-brand-yellow mb-6 uppercase">CONTACTO</h4>
                        <ul className="space-y-4 text-white/60 font-bold">
                            <li className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-brand-yellow shrink-0 mt-1" />
                                <span>Cochabamba, Bolivia</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <MessageCircle className="w-5 h-5 text-brand-yellow shrink-0" />
                                <span>+591 77860277</span>
                            </li>
                        </ul>
                        <div className="flex items-center gap-4 mt-8">
                            {[Facebook, Instagram].map((Icon, i) => (
                                <a key={i} href="#" className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-brand-yellow hover:text-brand-black hover:border-brand-black transition-all shadow-lg transform hover:-rotate-6">
                                    <Icon className="w-6 h-6" />
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/40 font-bold">
                    <p>© {new Date().getFullYear()} Briz Cochabamba. Todos los derechos reservados.</p>
                    <div className="flex items-center gap-6">
                        <Link to="/admin/login" className="hover:text-brand-yellow">Portal Admin</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
