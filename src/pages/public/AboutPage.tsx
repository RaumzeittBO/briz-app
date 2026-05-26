import { motion } from 'framer-motion';
import { Bike, Heart, Users, Globe, Sparkles, ArrowRight, Scale, Brain, RefreshCw, Leaf, Target, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const fadeUp = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6 } };

const VALUES = [
    {
        icon: Scale,
        title: 'Integridad',
        desc: 'Actuamos con transparencia, ética y compromiso con la calidad.',
        color: 'brand-yellow',
        bg: 'bg-brand-yellow',
    },
    {
        icon: Heart,
        title: 'Empatía',
        desc: 'Escuchamos y entendemos a nuestra comunidad para crear experiencias reales.',
        color: 'brand-pink',
        bg: 'bg-brand-orange',
    },
    {
        icon: Sparkles,
        title: 'Pasión y Excelencia',
        desc: 'Amamos lo que hacemos y buscamos superar expectativas.',
        color: 'brand-orange',
        bg: 'bg-brand-orange',
    },
    {
        icon: Globe,
        title: 'Responsabilidad',
        desc: 'Promovemos sostenibilidad y movilidad consciente.',
        color: 'brand-cyan',
        bg: 'bg-brand-cyan',
    },
    {
        icon: Brain,
        title: 'Equilibrio',
        desc: 'Impulsamos bienestar físico, mental y estilo de vida activo.',
        color: 'brand-emerald',
        bg: 'bg-brand-emerald',
    },
    {
        icon: RefreshCw,
        title: 'Resiliencia',
        desc: 'Nos adaptamos, aprendemos y mejoramos constantemente.',
        color: 'brand-yellow',
        bg: 'bg-brand-yellow',
    },
    {
        icon: Users,
        title: 'Comunidad',
        desc: 'Construimos conexiones reales y aportamos impacto social positivo.',
        color: 'brand-pink',
        bg: 'bg-brand-cyan',
    },
    {
        icon: Leaf,
        title: 'Sostenibilidad',
        desc: 'Reducimos el impacto ambiental con soluciones innovadoras.',
        color: 'brand-emerald',
        bg: 'bg-brand-emerald',
    },
];

export default function AboutPage() {
    return (
        <div className="pt-20">
            {/* ===== HERO ===== */}
            <section className="bg-brand-charcoal py-24 sm:py-32 relative overflow-hidden flex items-center min-h-[70vh]">
                <div className="absolute inset-0 pointer-events-none">
                    <img src="/hero-nosotros-computadora.jpg" alt="" className="hidden sm:block w-full h-full object-cover" />
                    <img src="/hero-nosotros-celular.jpg" alt="" className="block sm:hidden w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-brand-black/40 mix-blend-multiply" />
                    <div className="absolute inset-0 bg-gradient-to-b from-brand-black/60 via-brand-black/20 to-brand-charcoal" />
                </div>
                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                    <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
                        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} className="col-span-12 lg:col-span-7 space-y-8 pr-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3 }}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm shadow-lg"
                            >
                                <Sparkles className="w-4 h-4 text-brand-yellow" strokeWidth={1.5} />
                                <span className="text-xs font-black text-white tracking-widest uppercase">Nuestra historia</span>
                            </motion.div>
                            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-tan text-white leading-[1.1] tracking-tight drop-shadow-sm break-words">
                                Más que bicicletas:<br />
                                <span className="text-brand-yellow drop-shadow-md">una experiencia.</span>
                            </h1>
                            <p className="text-white/75 leading-relaxed text-xl sm:text-2xl font-cocon font-bold max-w-lg">
                                Briz nació de la pasión por el ciclismo y el amor profundo por Cochabamba.
                                Somos movimiento, comunidad y sostenibilidad.
                            </p>
                        </motion.div>

                        {/* Visual side */}
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 0.8 }} className="hidden lg:block relative col-span-12 lg:col-span-5 lg:ml-auto w-full max-w-[400px] lg:translate-x-8">
                            <div className="absolute inset-0 bg-gradient-to-tr from-brand-yellow/20 to-brand-pink/20 rounded-[3rem] blur-3xl transform -rotate-6 scale-105" />
                            <div className="aspect-square rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-md flex items-center justify-center relative overflow-hidden shadow-2xl">
                                <div className="text-center space-y-6 p-8 relative z-10">
                                    <motion.div
                                        animate={{ y: [0, -10, 0] }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                        className="w-28 h-28 mx-auto rounded-full bg-brand-yellow flex items-center justify-center mb-6 shadow-[0_20px_40px_rgba(255,210,0,0.3)]"
                                    >
                                        <Bike className="w-14 h-14 text-brand-black" strokeWidth={1.5} />
                                    </motion.div>
                                    <div className="space-y-2">
                                        <p className="text-white font-black text-2xl tracking-wide uppercase italic font-tan">Briz Culture</p>
                                        <p className="text-white/50 font-cocon font-bold text-base">Felicidad sobre dos ruedas</p>
                                    </div>
                                    {/* Mini stats */}
                                    <div className="flex items-center justify-center gap-8 pt-4">
                                        {[
                                            { value: '500+', label: 'Clientes' },
                                            { value: '3+', label: 'Años' },
                                            { value: '100%', label: 'Pasión' },
                                        ].map((s) => (
                                            <div key={s.label} className="text-center">
                                                <p className="font-tan text-brand-yellow text-2xl">{s.value}</p>
                                                <p className="text-white/40 font-bold text-xs uppercase tracking-widest">{s.label}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ===== VALUES ===== */}
            <section className="py-24 sm:py-32 bg-brand-beige relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <motion.div {...fadeUp} className="text-center mb-16 sm:mb-20">
                        <h2 className="text-2xl sm:text-3xl font-tan mb-4 tracking-tight text-brand-black leading-tight uppercase">
                            Lo que nos <span className="text-brand-yellow">mueve</span>
                        </h2>
                        <p className="text-lg sm:text-xl text-brand-charcoal/70 font-cocon font-bold max-w-2xl mx-auto mt-4">
                            Nuestros 8 valores fundamentales guían cada decisión y experiencia en Briz.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                        {VALUES.map((v, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.07, duration: 0.5 }}
                                whileHover={{ scale: 1.03, rotate: (i % 2 === 0 ? 1 : -1) }}
                                className="h-full"
                            >
                                <div className="bg-white border-4 border-brand-black rounded-2xl shadow-[6px_6px_0px_rgba(0,0,0,1)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] hover:border-brand-yellow transition-all duration-300 p-3 sm:p-6 h-full flex flex-col items-center text-center gap-4 relative overflow-hidden">
                                    <div className={`${v.bg} w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 border-2 border-brand-black`}>
                                        <v.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={2} />
                                    </div>
                                    <h3 className="font-tan text-brand-black text-[13px] sm:text-base leading-tight uppercase break-words hyphens-auto w-full">{v.title}</h3>
                                    <p className="text-brand-charcoal/70 font-cocon font-bold text-[12px] sm:text-sm leading-relaxed break-words">{v.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== MISSION / VISION ===== */}
            <section className="py-24 sm:py-32 bg-brand-charcoal text-white relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute bottom-0 right-[-10%] w-[600px] h-[600px] bg-brand-yellow/10 rounded-full blur-[120px] mix-blend-screen" />
                    <div className="absolute top-0 left-[-5%] w-[400px] h-[400px] bg-brand-pink/10 rounded-full blur-[100px] mix-blend-screen" />
                </div>
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <motion.div {...fadeUp} className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-tan text-white leading-tight uppercase">
                            Hacia dónde <span className="text-brand-yellow">vamos</span>
                        </h2>
                    </motion.div>
                    <div className="grid md:grid-cols-2 gap-8 sm:gap-12">
                        {/* Mission */}
                        <motion.div {...fadeUp} className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 sm:p-14 space-y-8 backdrop-blur-sm hover:bg-white/8 transition-colors shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-yellow/20 rounded-bl-full blur-2xl group-hover:bg-brand-yellow/30 transition-colors" />
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-brand-yellow flex items-center justify-center shadow-[0_10px_30px_rgba(255,210,0,0.3)] relative z-10">
                                <Target className="w-8 h-8 sm:w-10 sm:h-10 text-brand-black" strokeWidth={2} />
                            </div>
                            <div className="relative z-10 space-y-4">
                                <h3 className="text-xl sm:text-2xl font-tan text-white uppercase">Nuestra Misión</h3>
                                <p className="text-white/80 text-lg sm:text-xl leading-relaxed font-cocon font-bold">
                                    Revolucionar el uso de la bicicleta como motor de bienestar, movilidad sostenible y transformación social, mediante un ecosistema innovador basado en economía circular, salud integral y accesibilidad.
                                </p>
                            </div>
                        </motion.div>

                        {/* Vision */}
                        <motion.div {...fadeUp} transition={{ delay: 0.2 }} className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 sm:p-14 space-y-8 backdrop-blur-sm hover:bg-white/8 transition-colors shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-32 h-32 bg-brand-pink/20 rounded-br-full blur-2xl group-hover:bg-brand-pink/30 transition-colors" />
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-brand-cyan flex items-center justify-center shadow-[0_10px_30px_rgba(36,169,197,0.3)] relative z-10">
                                <Eye className="w-8 h-8 sm:w-10 sm:h-10 text-white" strokeWidth={2} />
                            </div>
                            <div className="relative z-10 space-y-4">
                                <h3 className="text-xl sm:text-2xl font-tan text-white uppercase">Nuestra Visión</h3>
                                <p className="text-white/80 text-lg sm:text-xl leading-relaxed font-cocon font-bold">
                                    Ser el referente en innovación y sostenibilidad con bicicletas en Cochabamba, transformando la movilidad en una herramienta de bienestar, desarrollo social y regeneración urbana.
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ===== STORY ===== */}
            <section className="py-24 sm:py-32 bg-background relative">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div {...fadeUp} className="text-center space-y-12">
                        <div className="space-y-6">
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-tan text-brand-black tracking-tight leading-tight uppercase">
                                El comienzo de la <span className="text-brand-yellow">ruta</span>
                            </h2>
                            <div className="w-24 h-2 bg-brand-yellow mx-auto rounded-full shadow-sm" />
                        </div>

                        <div className="space-y-8 text-lg sm:text-xl text-gray-600 font-cocon font-bold leading-relaxed text-left max-w-3xl mx-auto">
                            <p className="first-letter:text-7xl first-letter:font-black first-letter:text-brand-charcoal first-letter:mr-3 first-letter:float-left first-letter:leading-[0.8] first-letter:font-tan">
                                Todo empezó con una idea simple: ¿por qué no hacer que explorar la ciudad en bicicleta sea fácil, divertido y verdaderamente accesible para todos? Desde turistas buscando aventura hasta locales necesitando una alternativa real de movilidad, vimos la oportunidad de crear algo único.
                            </p>
                            <p>
                                Briz es el resultado materializado de esa visión. Hemos construido un espacio donde no solo vienes a alquilar una bici impecable, sino que encuentras estilo, repuestos, conocimiento y una comunidad vibrante que comparte tu amor por el movimiento.
                            </p>
                            <div className="p-8 sm:p-10 bg-brand-yellow/10 rounded-[2rem] border-l-4 border-brand-yellow italic text-brand-charcoal shadow-sm mt-12 relative">
                                <Sparkles className="absolute -top-4 -left-4 w-8 h-8 text-brand-yellow bg-white rounded-full p-1 shadow-sm" />
                                "Más que un negocio, somos un movimiento. Creemos en el poder transformador de la bicicleta para cambiar la forma en que interactuamos con nuestra ciudad y con nosotros mismos."
                            </div>
                        </div>

                        <div className="pt-12">
                            <Link to="/contact">
                                <Button size="lg" className="h-16 px-12 text-xl font-black shadow-[0_8px_28px_rgba(255,210,0,0.45)] hover:shadow-[0_12px_36px_rgba(255,210,0,0.60)] mx-auto flex items-center gap-4">
                                    Conócenos en persona
                                    <ArrowRight className="w-5 h-5" strokeWidth={2} />
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}
