import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, MessageCircle, Facebook, Instagram, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { faqs } from '@/data/mockData';

const fadeUp = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6 } };

export default function ContactPage() {
    return (
        <div className="pt-20">
            <section className="bg-brand-charcoal py-24 sm:py-32 relative overflow-hidden flex items-center min-h-[50vh]">
                <div className="absolute inset-0 pointer-events-none">
                    <img src="/hero-contacto-computadora.jpg" alt="" className="hidden sm:block w-full h-full object-cover" />
                    <img src="/hero-contacto-celular.jpg" alt="" className="block sm:hidden w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-brand-black/40 mix-blend-multiply" />
                    <div className="absolute inset-0 bg-gradient-to-b from-brand-black/60 via-brand-black/20 to-brand-charcoal" />
                </div>
                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center w-full">
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }} className="space-y-6">
                        <h1 className="text-5xl sm:text-8xl font-tan text-white tracking-tight drop-shadow-sm leading-none break-words">
                            Hablemos de <br className="sm:hidden" /><span className="text-brand-yellow">rutas.</span>
                        </h1>
                        <p className="text-xl sm:text-3xl text-white/70 max-w-2xl mx-auto font-cocon font-bold">
                            Estamos aquí para ayudarte a planear tu próxima aventura en dos ruedas. Contáctanos.
                        </p>
                    </motion.div>
                </div>
            </section>

            <section className="py-24 sm:py-32 bg-gray-50/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
                        {/* Contact Form */}
                        <motion.div {...fadeUp} className="order-2 lg:order-1">
                            <Card className="bg-white rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.08)] border-0 overflow-hidden relative group">
                                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-yellow via-brand-pink to-brand-charcoal" />
                                <CardContent className="p-8 sm:p-12">
                                    <div className="mb-10 space-y-3">
                                        <h2 className="text-3xl sm:text-5xl font-tan text-brand-black tracking-tight leading-none break-words">Envíanos un mensaje</h2>
                                        <p className="text-brand-charcoal font-cocon font-bold text-[15px] sm:text-lg leading-relaxed">Nos pondremos en contacto contigo lo antes posible.</p>
                                    </div>
                                    <form onSubmit={(e) => { e.preventDefault(); alert('¡Mensaje enviado! (Demo)'); }} className="space-y-6">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-brand-charcoal/40 font-black text-[10px] uppercase tracking-widest ml-1">Nombre Completo</Label>
                                                <Input placeholder="Tu nombre" required className="h-14 rounded-2xl bg-gray-50/50 border-gray-100 focus-visible:ring-brand-yellow/20 focus-visible:border-brand-yellow transition-all font-bold" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-brand-charcoal/40 font-black text-[10px] uppercase tracking-widest ml-1">Teléfono / WhatsApp</Label>
                                                <Input placeholder="+591 7..." required className="h-14 rounded-2xl bg-gray-50/50 border-gray-100 focus-visible:ring-brand-yellow/20 focus-visible:border-brand-yellow transition-all font-bold" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-brand-charcoal/40 font-black text-[10px] uppercase tracking-widest ml-1">Correo Electrónico</Label>
                                            <Input type="email" placeholder="tu@email.com" className="h-14 rounded-2xl bg-gray-50/50 border-gray-100 focus-visible:ring-brand-yellow/20 focus-visible:border-brand-yellow transition-all font-bold" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-brand-charcoal/40 font-black text-[10px] uppercase tracking-widest ml-1">Asunto de consulta</Label>
                                            <select className="w-full h-14 rounded-2xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow/20 focus-visible:border-brand-yellow transition-all appearance-none cursor-pointer">
                                                <option>Consulta general</option>
                                                <option>Alquiler de bici</option>
                                                <option>Compra de producto</option>
                                                <option>Servicio técnico</option>
                                                <option>Sugerencia</option>
                                                <option>Otro</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-brand-charcoal/40 font-black text-[10px] uppercase tracking-widest ml-1">Tu Mensaje</Label>
                                            <Textarea placeholder="¿En qué podemos ayudarte?" rows={5} required className="rounded-2xl bg-gray-50/50 border-gray-100 focus-visible:ring-brand-yellow/20 focus-visible:border-brand-yellow transition-all resize-none p-4 font-medium" />
                                        </div>
                                        <div className="pt-4">
                                            <Button type="submit" variant="primary" size="lg" className="w-full h-16 font-black text-[15px] sm:text-xl shadow-[0_6px_24px_rgba(250,14,149,0.4)] hover:shadow-[0_10px_32px_rgba(250,14,149,0.55)] flex items-center justify-center gap-2 px-2">
                                                <Send className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} /> ENVIAR MENSAJE
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Contact Info */}
                        <motion.div {...fadeUp} transition={{ delay: 0.2 }} className="space-y-8 order-1 lg:order-2">
                            {/* WhatsApp CTA */}
                            <a href="https://wa.me/59177860277" target="_blank" rel="noopener noreferrer" className="block group">
                                <Card className="border-0 bg-white hover:bg-green-50/30 transition-all duration-500 cursor-pointer rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] hover:shadow-[0_40px_80px_rgba(34,197,94,0.12)] hover:-translate-y-2 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-bl-full group-hover:bg-green-500/10 transition-colors" />
                                    <CardContent className="p-5 sm:p-10 flex items-center gap-4 sm:gap-8 relative z-10">
                                        <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl bg-green-500 flex items-center justify-center shadow-[0_20px_40px_rgba(34,197,94,0.3)] group-hover:scale-110 transition-transform duration-500 flex-shrink-0">
                                            <MessageCircle className="w-8 h-8 sm:w-12 sm:h-12 text-white" strokeWidth={1.5} />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-black text-lg sm:text-3xl text-brand-charcoal group-hover:text-green-600 transition-colors truncate">WhatsApp Directo</h3>
                                            <p className="text-[10px] sm:text-base text-gray-400 font-bold uppercase tracking-widest mt-0.5 sm:mt-1">Respuesta inmediata</p>
                                            <p className="text-green-600 font-black text-base sm:text-xl mt-2 sm:mt-3 tracking-tighter">+591 77860277</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </a>

                            {/* Info cards */}
                            <Card className="rounded-[2.5rem] border-0 shadow-[0_20px_50px_rgba(0,0,0,0.04)] bg-white overflow-hidden">
                                <CardContent className="p-8 sm:p-10 space-y-8">
                                    {[
                                        { icon: MapPin, title: 'Dirección', color: 'brand-yellow', content: <a href="https://maps.app.goo.gl/tgqw7ZK51Y68Q7L7A?g_st=iwb" target="_blank" rel="noopener noreferrer" className="text-[13px] sm:text-lg font-black text-brand-charcoal hover:text-brand-yellow transition-colors block leading-tight">Cochabamba, Bolivia <span className="text-brand-yellow text-[9px] sm:text-xs mt-2 sm:mt-0 sm:ml-2 font-black uppercase tracking-widest bg-brand-yellow/10 px-3 py-1 rounded-full inline-block">Ver Mapa</span></a> },
                                        { icon: Phone, title: 'Teléfono', color: 'brand-cyan', content: <p className="text-[13px] sm:text-lg font-black text-brand-charcoal">+591 77860277</p> },
                                        { icon: Mail, title: 'Email', color: 'brand-pink', content: <p className="text-[13px] sm:text-lg font-black text-brand-charcoal break-all">brizbolivia@gmail.com</p> },
                                        { icon: Clock, title: 'Horario', color: 'brand-charcoal', content: <div className="text-[13px] sm:text-lg font-black text-brand-charcoal space-y-1"><p>Lunes a Sábado: <span className="text-brand-yellow block sm:inline">8:00 - 19:00</span></p><p>Domingo: <span className="text-brand-yellow block sm:inline">9:00 - 14:00</span></p></div> }
                                    ].map((info, i) => (
                                        <div key={i} className="flex items-start gap-4 sm:gap-6 group pb-8 border-b border-gray-50 last:border-0 last:pb-0">
                                            <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-${info.color}/5 group-hover:bg-${info.color}/10 flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110`}>
                                                <info.icon className={`w-5 h-5 sm:w-6 sm:h-6 text-gray-400 group-hover:text-${info.color === 'brand-charcoal' ? 'brand-yellow' : info.color} transition-colors`} strokeWidth={1.5} />
                                            </div>
                                            <div className="pt-1 flex-1">
                                                <h4 className="font-black text-[10px] text-gray-300 uppercase tracking-widest mb-2">{info.title}</h4>
                                                {info.content}
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            {/* Social */}
                            <Card className="rounded-[2.5rem] border-0 shadow-2xl bg-brand-charcoal text-white overflow-hidden relative group">
                                <div className="absolute inset-0 bg-gradient-to-br from-brand-yellow/20 via-transparent to-brand-pink/20 opacity-30 group-hover:opacity-50 transition-opacity duration-700" />
                                <CardContent className="p-8 sm:p-10 relative z-10 flex flex-col sm:flex-row items-center justify-between gap-8">
                                    <div className="text-center sm:text-left">
                                        <h4 className="font-black text-2xl mb-1">Briz Community</h4>
                                        <p className="text-white/50 font-bold text-sm uppercase tracking-widest uppercase">Síguenos en redes</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <a href="https://www.facebook.com/Briz.Bolivia" target="_blank" rel="noopener noreferrer">
                                            <Button variant="outline" size="icon" className="rounded-2xl bg-white/5 border-white/10 hover:bg-brand-yellow hover:text-brand-black hover:border-brand-yellow transition-all w-14 h-14 shadow-lg active:scale-95"><Facebook className="w-6 h-6" strokeWidth={1.5} /></Button>
                                        </a>
                                        <a href="https://www.instagram.com/briz.bolivia" target="_blank" rel="noopener noreferrer">
                                            <Button variant="outline" size="icon" className="rounded-2xl bg-white/5 border-white/10 hover:bg-brand-pink hover:text-white hover:border-brand-pink transition-all w-14 h-14 shadow-lg active:scale-95"><Instagram className="w-6 h-6" strokeWidth={1.5} /></Button>
                                        </a>
                                        <a href="https://www.tiktok.com/@briz.bolivia" target="_blank" rel="noopener noreferrer">
                                            <Button variant="outline" size="icon" className="rounded-2xl bg-white/5 border-white/10 hover:bg-white hover:text-black hover:border-white transition-all w-14 h-14 shadow-lg active:scale-95">
                                                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.87a8.16 8.16 0 0 0 4.76 1.52v-3.4a4.85 4.85 0 0 1-1-.3z" /></svg>
                                            </Button>
                                        </a>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* FAQ snippet */}
            <section className="py-24 sm:py-32 bg-white relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[600px] bg-brand-yellow/5 rounded-full blur-[120px] pointer-events-none" />
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <motion.div {...fadeUp} className="text-center mb-16 space-y-4">
                        <h2 className="text-5xl sm:text-7xl font-tan text-brand-black tracking-tight leading-none">Preguntas <span className="text-brand-yellow">frecuentes</span></h2>
                        <div className="w-24 h-2 bg-brand-yellow mx-auto rounded-full shadow-sm" />
                        <p className="text-gray-500 font-cocon font-bold text-lg max-w-2xl mx-auto pt-4">Resolvemos tus dudas más comunes de forma rápida.</p>
                    </motion.div>
                    <Accordion type="single" collapsible className="space-y-5">
                        {faqs.slice(0, 4).map((faq, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <AccordionItem value={`faq-${i}`} className="bg-gray-50/50 border border-gray-100 rounded-[2rem] px-8 data-[state=open]:border-brand-yellow/30 data-[state=open]:bg-white data-[state=open]:shadow-xl transition-all duration-300">
                                    <AccordionTrigger className="hover:text-brand-yellow hover:no-underline text-left text-lg sm:text-xl font-black py-7 !no-underline group">
                                        {faq.question}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-gray-500 font-bold text-base sm:text-lg pb-7 leading-relaxed opacity-80">{faq.answer}</AccordionContent>
                                </AccordionItem>
                            </motion.div>
                        ))}
                    </Accordion>
                </div>
            </section>
        </div>
    );
}
