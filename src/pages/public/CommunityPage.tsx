import { motion } from 'framer-motion';
import { CalendarDays, HeartHandshake, MessageCircle, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const fadeUp = {
    initial: { opacity: 0, y: 28 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.55 },
};

export default function CommunityPage() {
    return (
        <div className="pt-20">
            <section className="relative flex min-h-[70vh] items-center overflow-hidden bg-brand-yellow py-24 sm:py-32">
                <div className="absolute inset-0 opacity-20">
                    <img src="/hero-principal.png" alt="" className="h-full w-full object-cover" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-brand-yellow/90 via-brand-yellow/95 to-brand-beige" />

                <div className="relative z-10 mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
                    <motion.div {...fadeUp} className="space-y-8">
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white text-brand-black shadow-[6px_6px_0px_rgba(0,0,0,1)]">
                            <HeartHandshake className="h-11 w-11" strokeWidth={2.3} />
                        </div>

                        <div className="space-y-5">
                            <h1 className="font-tan text-4xl uppercase leading-tight text-brand-black sm:text-6xl lg:text-7xl">
                                Comunidad BRIZ
                            </h1>
                            <p className="mx-auto max-w-2xl font-gochi text-2xl leading-snug text-brand-charcoal sm:text-4xl">
                                pronto tendremos rodadas, encuentros y experiencias para pedalear juntos.
                            </p>
                        </div>

                        <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-3">
                            {[
                                { icon: Users, label: 'Rodadas grupales' },
                                { icon: CalendarDays, label: 'Eventos ciclistas' },
                                { icon: MessageCircle, label: 'Charlas y comunidad' },
                            ].map((item) => (
                                <div key={item.label} className="rounded-sm border-3 border-brand-black bg-white p-5 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                                    <item.icon className="mx-auto mb-3 h-8 w-8 text-brand-black" strokeWidth={2.2} />
                                    <p className="font-cocon text-sm font-black uppercase leading-tight text-brand-black">{item.label}</p>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-col justify-center gap-3 sm:flex-row">
                            <Link to="/contact">
                                <Button size="lg" className="h-14 px-8 font-black">
                                    Contactarnos
                                </Button>
                            </Link>
                            <Link to="/#preguntas-frecuentes">
                                <Button variant="outline" size="lg" className="h-14 rounded-full border-brand-black bg-white px-8 font-black text-brand-black hover:bg-brand-black hover:text-brand-yellow">
                                    Preguntas frecuentes
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}
