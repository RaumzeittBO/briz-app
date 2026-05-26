import { motion } from 'framer-motion';
import { MapPin, Clock, Route } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cyclingRoutes } from '@/data/mockData';

const fadeUp = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6 } };

const difficultyColor: Record<string, string> = {
    'Fácil': 'bg-green-500/15 text-green-600 border-green-500/30',
    'Moderado': 'bg-yellow-500/15 text-yellow-600 border-yellow-500/30',
    'Difícil': 'bg-red-500/15 text-red-600 border-red-500/30',
};

export default function RoutesPage() {
    return (
        <div className="pt-20">
            <section className="bg-hero-gradient py-20 relative overflow-hidden">
                <div className="absolute inset-0"><div className="absolute top-1/2 right-0 w-96 h-96 bg-brand-yellow/8 rounded-full blur-[100px]" /></div>
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        <h1 className="text-4xl sm:text-5xl font-bold text-white">Rutas ciclistas en <span className="text-gradient-yellow">Cochabamba</span></h1>
                        <p className="text-white/60 max-w-xl mx-auto">Descubre las mejores rutas para explorar la llajta sobre dos ruedas. Desde paseos urbanos hasta aventuras de montaña.</p>
                    </motion.div>
                </div>
            </section>

            <section className="py-20 bg-background">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {cyclingRoutes.map((route, i) => (
                            <motion.div key={route.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                                <Card className="group h-full hover:shadow-lg hover:border-brand-yellow/30 transition-all duration-300">
                                    <div className="h-48 bg-muted rounded-t-lg flex items-center justify-center">
                                        <div className="text-center p-4">
                                            <MapPin className="w-12 h-12 text-brand-yellow mx-auto mb-2" />
                                            <p className="text-xs text-muted-foreground">Foto de ruta: {route.name}</p>
                                        </div>
                                    </div>
                                    <CardContent className="p-5 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-semibold text-lg group-hover:text-brand-yellow transition-colors">{route.name}</h3>
                                            <Badge className={difficultyColor[route.difficulty]}>{route.difficulty}</Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{route.description}</p>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1"><Route className="w-4 h-4" /> {route.distance}</span>
                                            <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {route.duration}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 pt-2">
                                            {route.highlights.map((h, j) => (
                                                <Badge key={j} variant="secondary" className="text-xs">{h}</Badge>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Map placeholder */}
            <section className="py-20 bg-brand-black text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div {...fadeUp} className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-4">Explora el <span className="text-gradient-yellow">mapa ciclista</span></h2>
                        <p className="text-white/60">Próximamente: mapa interactivo con todas las rutas recomendadas.</p>
                    </motion.div>
                    <div className="aspect-[16/9] max-w-4xl mx-auto rounded-2xl glass flex items-center justify-center">
                        <div className="text-center space-y-4">
                            <MapPin className="w-16 h-16 text-brand-yellow mx-auto" />
                            <h3 className="text-xl font-semibold">Mapa Interactivo</h3>
                            <p className="text-white/50 text-sm max-w-md mx-auto">
                                Se integrará un mapa interactivo con las rutas ciclistas de Cochabamba, puntos de interés y distancias.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-16 bg-background">
                <div className="max-w-3xl mx-auto px-4 text-center space-y-6">
                    <motion.div {...fadeUp}>
                        <h2 className="text-3xl font-bold mb-4">¿Listo para <span className="text-brand-yellow">explorar</span>?</h2>
                        <p className="text-muted-foreground mb-6">Alquila una bicicleta y descubre Cochabamba a tu ritmo.</p>
                        <div className="flex gap-4 justify-center flex-wrap">
                            <a href="/rentals"><Button className="bg-brand-yellow text-brand-black hover:bg-brand-yellow-light font-semibold">Alquilar una bici</Button></a>
                            <a href="https://wa.me/59177860277" target="_blank" rel="noopener noreferrer"><Button variant="outline">Consultar por WhatsApp</Button></a>
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}
