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
            <section className="bg-hero-gradient py-20 relative overflow-hidden">
                <div className="absolute inset-0"><div className="absolute bottom-0 right-1/3 w-96 h-96 bg-brand-yellow/8 rounded-full blur-[100px]" /></div>
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        <h1 className="text-4xl sm:text-5xl font-bold text-white">Hablemos de <span className="text-gradient-yellow">bicicletas</span></h1>
                        <p className="text-white/60 max-w-xl mx-auto">Estamos aquí para ayudarte. Contáctanos por el medio que prefieras.</p>
                    </motion.div>
                </div>
            </section>

            <section className="py-20 bg-background">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12">
                        {/* Contact Form */}
                        <motion.div {...fadeUp}>
                            <Card>
                                <CardContent className="p-6">
                                    <h2 className="text-xl font-bold mb-6">Envíanos un mensaje</h2>
                                    <form onSubmit={(e) => { e.preventDefault(); alert('¡Mensaje enviado! (Demo)'); }} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div><Label>Nombre</Label><Input placeholder="Tu nombre" required /></div>
                                            <div><Label>Teléfono</Label><Input placeholder="+591 7..." required /></div>
                                        </div>
                                        <div><Label>Email (opcional)</Label><Input type="email" placeholder="tu@email.com" /></div>
                                        <div><Label>Asunto</Label>
                                            <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                                                <option>Consulta general</option><option>Alquiler de bici</option><option>Compra de producto</option>
                                                <option>Servicio técnico</option><option>Sugerencia</option><option>Otro</option>
                                            </select>
                                        </div>
                                        <div><Label>Mensaje</Label><Textarea placeholder="¿En qué podemos ayudarte?" rows={4} required /></div>
                                        <Button type="submit" className="w-full bg-brand-yellow text-brand-black hover:bg-brand-yellow-light font-bold">
                                            <Send className="w-4 h-4 mr-2" /> Enviar Mensaje
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Contact Info */}
                        <motion.div {...fadeUp} className="space-y-6">
                            {/* WhatsApp CTA */}
                            <a href="https://wa.me/59177860277" target="_blank" rel="noopener noreferrer" className="block">
                                <Card className="border-green-500/20 bg-green-500/5 hover:bg-green-500/10 transition-colors cursor-pointer">
                                    <CardContent className="p-6 flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-xl bg-green-500/20 flex items-center justify-center">
                                            <MessageCircle className="w-7 h-7 text-green-500" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg">WhatsApp</h3>
                                            <p className="text-sm text-muted-foreground">La forma más rápida de contactarnos. Respuesta inmediata.</p>
                                            <p className="text-green-600 font-semibold text-sm mt-1">+591 77860277</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </a>

                            {/* Info cards */}
                            <Card>
                                <CardContent className="p-6 space-y-5">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-brand-yellow/10 flex items-center justify-center flex-shrink-0">
                                            <MapPin className="w-5 h-5 text-brand-yellow" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium mb-1">Dirección</h4>
                                            <a href="https://maps.app.goo.gl/tgqw7ZK51Y68Q7L7A?g_st=iwb" target="_blank" rel="noopener noreferrer" className="text-sm text-brand-yellow hover:underline block">
                                                Cochabamba, Bolivia (Ver en Google Maps)
                                            </a>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-brand-yellow/10 flex items-center justify-center flex-shrink-0">
                                            <Phone className="w-5 h-5 text-brand-yellow" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium mb-1">Teléfono</h4>
                                            <p className="text-sm text-muted-foreground">+591 77860277</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-brand-yellow/10 flex items-center justify-center flex-shrink-0">
                                            <Mail className="w-5 h-5 text-brand-yellow" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium mb-1">Email</h4>
                                            <p className="text-sm text-muted-foreground">hola@briz.bo</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-brand-yellow/10 flex items-center justify-center flex-shrink-0">
                                            <Clock className="w-5 h-5 text-brand-yellow" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium mb-1">Horario</h4>
                                            <p className="text-sm text-muted-foreground">Lunes a Sábado: 8:00 - 19:00</p>
                                            <p className="text-sm text-muted-foreground">Domingo: 9:00 - 14:00</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Social */}
                            <Card>
                                <CardContent className="p-6">
                                    <h4 className="font-medium mb-3">Síguenos en redes</h4>
                                    <div className="flex gap-3">
                                        <a href="https://www.facebook.com/Briz.Bolivia" target="_blank" rel="noopener noreferrer">
                                            <Button variant="outline" size="icon"><Facebook className="w-4 h-4" /></Button>
                                        </a>
                                        <a href="https://www.instagram.com/briz.bolivia" target="_blank" rel="noopener noreferrer">
                                            <Button variant="outline" size="icon"><Instagram className="w-4 h-4" /></Button>
                                        </a>
                                        <a href="https://www.tiktok.com/@briz.bolivia" target="_blank" rel="noopener noreferrer">
                                            <Button variant="outline" size="icon">
                                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.87a8.16 8.16 0 0 0 4.76 1.52v-3.4a4.85 4.85 0 0 1-1-.3z" /></svg>
                                            </Button>
                                        </a>
                                        <a href="https://wa.me/59177860277" target="_blank" rel="noopener noreferrer">
                                            <Button variant="outline" size="icon"><MessageCircle className="w-4 h-4" /></Button>
                                        </a>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Map placeholder */}
                            <Card>
                                <CardContent className="p-0">
                                    <div className="h-48 rounded-lg bg-muted flex items-center justify-center">
                                        <div className="text-center space-y-2">
                                            <MapPin className="w-8 h-8 text-brand-yellow mx-auto" />
                                            <p className="text-sm text-muted-foreground">Google Maps — se integrará aquí</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* FAQ snippet */}
            <section className="py-16 bg-muted/50">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div {...fadeUp} className="text-center mb-10">
                        <h2 className="text-2xl font-bold">Preguntas <span className="text-brand-yellow">frecuentes</span></h2>
                    </motion.div>
                    <Accordion type="single" collapsible className="space-y-2">
                        {faqs.slice(0, 4).map((faq, i) => (
                            <AccordionItem key={i} value={`faq-${i}`} className="border border-border/50 rounded-xl px-4 data-[state=open]:border-brand-yellow/30">
                                <AccordionTrigger className="hover:text-brand-yellow text-left text-sm font-medium py-3">{faq.question}</AccordionTrigger>
                                <AccordionContent className="text-muted-foreground text-sm pb-3">{faq.answer}</AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </section>
        </div>
    );
}
