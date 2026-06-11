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
        <div className="pt-[80px] lg:pt-[120px] bg-background min-h-screen flex flex-col">

            <section className="py-24 sm:py-32 bg-gray-50/50 flex-1">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {cyclingRoutes.map((route, i) => (
                            <motion.div key={route.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (i % 6) * 0.1, duration: 0.5 }} className="h-full">
                                <Card className="group h-full bg-white border-4 border-brand-black rounded-2xl shadow-[8px_8px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all duration-300 flex flex-col overflow-hidden relative">
                                    <div className="h-[240px] bg-gray-50 flex items-center justify-center relative overflow-hidden">
                                        <div className="absolute inset-0 bg-brand-charcoal/5 group-hover:bg-brand-yellow/10 transition-colors duration-700" />
                                        <div className="text-center p-6 relative z-10">
                                            <motion.div 
                                                whileHover={{ scale: 1.1, rotate: 5 }}
                                                className="w-20 h-20 mx-auto rounded-3xl bg-white shadow-xl flex items-center justify-center mb-4 group-hover:bg-brand-yellow transition-all duration-500"
                                            >
                                                <MapPin className="w-10 h-10 text-brand-charcoal group-hover:text-white transition-colors" strokeWidth={1.5} />
                                            </motion.div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-brand-charcoal/50 transition-colors">Visualizar Ruta</p>
                                        </div>
                                        <Badge className={`absolute top-6 right-6 px-4 py-2 font-black text-[10px] uppercase tracking-widest rounded-full shadow-lg border-0 ${difficultyColor[route.difficulty]}`}>{route.difficulty}</Badge>
                                    </div>
                                    <CardContent className="p-8 sm:p-10 flex-1 flex flex-col z-10 bg-white relative">
                                        <div className="mb-6">
                                            <h3 className="font-black text-2xl text-brand-charcoal group-hover:text-brand-yellow transition-colors leading-tight mb-3">{route.name}</h3>
                                            <p className="text-sm sm:text-base text-gray-400 font-bold leading-relaxed flex-1 opacity-80">{route.description}</p>
                                        </div>
                                        <div className="mt-auto space-y-6 pt-6 border-t border-gray-50">
                                            <div className="flex items-center gap-8 text-[11px] font-black uppercase tracking-widest text-brand-charcoal/60">
                                                <span className="flex items-center gap-2 group-hover:text-brand-yellow transition-colors"><Route className="w-4 h-4 text-brand-yellow" strokeWidth={2} /> {route.distance}</span>
                                                <span className="flex items-center gap-2 group-hover:text-brand-yellow transition-colors"><Clock className="w-4 h-4 text-brand-yellow" strokeWidth={2} /> {route.duration}</span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {route.highlights.map((h, j) => (
                                                    <Badge key={j} variant="secondary" className="text-[9px] font-black uppercase tracking-widest bg-gray-50 text-gray-400 hover:bg-brand-yellow hover:text-brand-black transition-all px-3 py-1.5 rounded-full border-0">{h}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </CardContent>
                                    <div className="absolute bottom-0 left-0 w-full h-1 bg-brand-yellow scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Map placeholder */}
            <section className="py-24 sm:py-32 bg-brand-charcoal text-white relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-yellow/5 rounded-full blur-[120px] mix-blend-screen" />
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay"></div>
                </div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <motion.div {...fadeUp} className="text-center mb-16 space-y-6">
                        <h2 className="text-4xl sm:text-6xl font-black mb-6 tracking-tight">Explora el <span className="text-brand-yellow">mapa ciclista</span></h2>
                        <p className="text-xl sm:text-2xl text-white/50 font-medium max-w-2xl mx-auto leading-relaxed">Muy pronto: Un mapa interactivo con todas las rutas recomendadas, puntos de interés, talleres aliados y paradas de descanso en Cochabamba.</p>
                    </motion.div>
                    <div className="max-w-5xl mx-auto">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="aspect-video rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-md flex items-center justify-center relative overflow-hidden shadow-2xl group ring-1 ring-white/10"
                        >
                            <div className="absolute inset-0 bg-gradient-to-tr from-brand-yellow/10 via-transparent to-brand-pink/10 opacity-30 group-hover:opacity-60 transition-opacity duration-1000" />
                            <div className="text-center space-y-8 relative z-10 p-12">
                                <motion.div 
                                    animate={{ 
                                        y: [0, -15, 0],
                                        scale: [1, 1.05, 1]
                                    }}
                                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                                    className="w-28 h-28 mx-auto rounded-full bg-brand-yellow flex items-center justify-center mb-4 shadow-[0_20px_50px_rgba(255,210,0,0.3)] group-hover:bg-white transition-colors duration-500"
                                >
                                    <MapPin className="w-12 h-12 text-brand-black" strokeWidth={1.5} />
                                </motion.div>
                                <div>
                                    <h3 className="text-3xl sm:text-4xl font-black text-white group-hover:text-brand-yellow transition-colors italic">Próximamente</h3>
                                    <div className="w-20 h-2 bg-brand-yellow mx-auto rounded-full mt-4 opacity-30 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 sm:py-32 bg-brand-yellow relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.05] mix-blend-overlay"></div>
                <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] bg-white/20 rounded-full blur-[100px] mix-blend-screen" />
                <div className="max-w-4xl mx-auto px-4 text-center space-y-12 relative z-10">
                    <motion.div {...fadeUp} className="space-y-8">
                        <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black text-brand-charcoal tracking-tight leading-[1.1]">
                            ¿Listo para <span className="text-white drop-shadow-md">explorar</span>?
                        </h2>
                        <p className="text-xl sm:text-3xl font-bold text-brand-charcoal/80 max-w-2xl mx-auto leading-relaxed italic">
                            Alquila una bicicleta Premium y descubre los mejores rincones a tu propio ritmo.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
                            <a href="/rentals" className="w-full sm:w-auto">
                                <Button className="h-20 px-12 rounded-full bg-brand-charcoal text-white hover:bg-white hover:text-brand-charcoal font-black text-xl shadow-2xl hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:-translate-y-2 transition-all w-full border-0">
                                    Alquilar una bici
                                </Button>
                            </a>
                            <a href="https://wa.me/59177860277" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                                <Button variant="outline" className="h-20 px-12 rounded-full bg-white/15 border-brand-charcoal/20 text-brand-charcoal hover:bg-white hover:border-white hover:text-brand-charcoal font-black text-xl backdrop-blur-md shadow-lg hover:-translate-y-2 transition-all w-full border-2">
                                    Consultar WhatsApp
                                </Button>
                            </a>
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}
