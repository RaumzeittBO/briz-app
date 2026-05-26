import { motion } from 'framer-motion';
import { Bike, Heart, Users, MapPin, Target, Eye, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const fadeUp = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6 } };

export default function AboutPage() {
    return (
        <div className="pt-20">
            <section className="bg-hero-gradient py-24 relative overflow-hidden">
                <div className="absolute inset-0"><div className="absolute top-0 left-0 w-[500px] h-[500px] bg-brand-yellow/6 rounded-full blur-[120px]" /></div>
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-yellow">
                                <Sparkles className="w-4 h-4 text-brand-yellow" />
                                <span className="text-sm font-medium text-brand-yellow">Nuestra historia</span>
                            </div>
                            <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
                                Más que bicicletas: una <span className="text-gradient-yellow">experiencia de vida</span>
                            </h1>
                            <p className="text-white/60 leading-relaxed text-lg">
                                Briz nació de la pasión por el ciclismo y el amor por Cochabamba. Creemos que una bicicleta
                                puede transformar tu día, tu ciudad y tu forma de vivir.
                            </p>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="hidden lg:block">
                            <div className="aspect-square rounded-3xl glass border border-white/10 flex items-center justify-center">
                                <div className="text-center space-y-4 p-8">
                                    <Bike className="w-20 h-20 text-brand-yellow mx-auto" />
                                    <p className="text-white/50 text-sm">Foto del equipo Briz — se reemplazará con foto real</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="py-20 bg-background">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div {...fadeUp} className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4">Lo que nos <span className="text-brand-yellow">mueve</span></h2>
                    </motion.div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { icon: Heart, title: 'Pasión', desc: 'El ciclismo es nuestra pasión. Lo vivimos, lo respiramos, lo compartimos.' },
                            { icon: Users, title: 'Comunidad', desc: 'Construimos una comunidad ciclista inclusiva y amigable en Cochabamba.' },
                            { icon: MapPin, title: 'Local', desc: 'Somos cochabambinos. Conocemos cada esquina, cada ruta, cada pendiente.' },
                            { icon: Sparkles, title: 'Calidad', desc: 'Bicicletas impecables, servicio premium y atención personalizada siempre.' },
                        ].map((v, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center space-y-4">
                                <div className="w-16 h-16 mx-auto rounded-2xl bg-brand-yellow/10 flex items-center justify-center">
                                    <v.icon className="w-8 h-8 text-brand-yellow" />
                                </div>
                                <h3 className="font-semibold text-lg">{v.title}</h3>
                                <p className="text-sm text-muted-foreground">{v.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Mission / Vision */}
            <section className="py-20 bg-brand-black text-white">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-12">
                        <motion.div {...fadeUp} className="glass rounded-2xl p-8 space-y-4">
                            <div className="w-12 h-12 rounded-xl bg-brand-yellow/10 flex items-center justify-center">
                                <Target className="w-6 h-6 text-brand-yellow" />
                            </div>
                            <h3 className="text-2xl font-bold">Misión</h3>
                            <p className="text-white/60 leading-relaxed">
                                Hacer del ciclismo una experiencia accesible, segura y emocionante para todos en Cochabamba.
                                Ofrecemos bicicletas de calidad, servicio profesional y una atención que te haga sentir en casa.
                            </p>
                        </motion.div>
                        <motion.div {...fadeUp} className="glass rounded-2xl p-8 space-y-4">
                            <div className="w-12 h-12 rounded-xl bg-brand-yellow/10 flex items-center justify-center">
                                <Eye className="w-6 h-6 text-brand-yellow" />
                            </div>
                            <h3 className="text-2xl font-bold">Visión</h3>
                            <p className="text-white/60 leading-relaxed">
                                Ser la marca referente de ciclismo urbano en Bolivia. Queremos que cada persona que visite
                                Cochabamba descubra la ciudad sobre dos ruedas y que cada cochabambino elija la bici como estilo de vida.
                            </p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Story */}
            <section className="py-20 bg-background">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div {...fadeUp} className="space-y-6 text-center">
                        <h2 className="text-3xl font-bold">Nuestra <span className="text-brand-yellow">historia</span></h2>
                        <div className="space-y-4 text-muted-foreground leading-relaxed text-left">
                            <p>
                                Todo empezó con una idea simple: ¿por qué no hacer que explorar Cochabamba en bicicleta sea
                                fácil, divertido y accesible para todos? Desde turistas curiosos hasta locales buscando una
                                alternativa de movilidad, vimos una oportunidad de crear algo especial.
                            </p>
                            <p>
                                Briz es el resultado de esa visión. Un lugar donde puedes alquilar una bici impecable por unas
                                horas, comprar accesorios de calidad, llevar tu propia bicicleta al taller, o simplemente
                                descubrir las mejores rutas de la llajta.
                            </p>
                            <p>
                                Más que un negocio, somos una comunidad. Creemos en el poder de la bicicleta para transformar
                                ciudades, conectar personas y crear experiencias inolvidables. Y estamos orgullosos de hacerlo
                                desde el corazón de Bolivia: Cochabamba.
                            </p>
                        </div>
                        <Link to="/contact">
                            <Button className="bg-brand-yellow text-brand-black hover:bg-brand-yellow-light font-semibold mt-4">
                                Conócenos en persona
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}
