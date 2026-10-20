import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, MessageCircle, Facebook, Instagram, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useLanguage } from '@/context/LanguageContext';

const fadeUp = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6 } };

export default function ContactPage() {
    const { language } = useLanguage();

    const customFaqs = [
        {
            question: language === 'es' ? '¿Cómo puedo alquilar una bicicleta?' : 'How can I rent a bicycle?',
            answer: (
                <div className="space-y-3 font-sans">
                    <p className="text-gray-500 font-bold text-base sm:text-lg leading-relaxed opacity-90">
                        {language === 'es' ? 'Sigue estos sencillos pasos:' : 'Follow these simple steps:'}
                    </p>
                    <ol className="list-decimal pl-5 space-y-2 text-gray-500 font-bold text-sm sm:text-base leading-relaxed opacity-80">
                        <li>
                            {language === 'es'
                                ? 'Elige el modelo de tu preferencia. (Revisa nuestra sección de alquiler para ver modelos y tarifas).'
                                : 'Choose your preferred bicycle model and rental duration in our Rentals catalog.'}
                        </li>
                        <li>
                            {language === 'es'
                                ? 'Regístrate en nuestro sistema de usuarios y si ya estás registrad@ completa solamente el registro de tu alquiler.'
                                : 'Sign in or create your customer profile in seconds to link your reservation.'}
                        </li>
                        <li>
                            {language === 'es'
                                ? 'Elige el método de pago.'
                                : 'Select your preferred payment method (QR, Bank Transfer, or Cash at store).'}
                        </li>
                        <li>
                            {language === 'es'
                                ? 'Recoge tu bici de nuestras instalaciones habilitadas o si solicitaste servicio de transporte, aguarda tu pedido.'
                                : 'Pick up your bike at our store or wait at your chosen address if you requested home delivery.'}
                        </li>
                    </ol>
                </div>
            )
        },
        {
            question: language === 'es'
                ? '¿Por qué debo comprar una bici urbana de procedencia japonesa a medio uso?'
                : 'Why should I buy a refurbished Japanese urban bicycle?',
            answer: (
                <div className="space-y-4 font-sans">
                    <ul className="list-disc pl-5 space-y-2 text-gray-500 font-bold text-sm sm:text-base leading-relaxed opacity-80">
                        <li>{language === 'es' ? 'Ingeniería hecha para durar.' : 'Japanese engineering built to last.'}</li>
                        <li>{language === 'es' ? 'Pedaleo suave y eficiente.' : 'Smooth, comfortable, and efficient pedaling.'}</li>
                        <li>{language === 'es' ? 'Repuestos accesibles.' : 'Accessible and affordable spare parts.'}</li>
                        <li>{language === 'es' ? 'Menor mantenimiento.' : 'Low maintenance requirements.'}</li>
                        <li>{language === 'es' ? 'Más ahorro a largo plazo.' : 'Greater long-term savings and reliability.'}</li>
                    </ul>
                    <div className="pt-2">
                        <Link to="/shop">
                            <Button size="sm" className="bg-brand-yellow text-brand-black hover:bg-brand-yellow-light rounded-full font-black text-xs px-6 h-11 shadow-md border-0 transition-transform active:scale-95">
                                {language === 'es' ? 'REVISA NUESTRO CATÁLOGO' : 'BROWSE OUR SHOP CATALOG'}
                            </Button>
                        </Link>
                    </div>
                </div>
            )
        },
        {
            question: language === 'es'
                ? 'Quiero comprar una bicicleta personalizada. ¿Cómo puedo hacerlo?'
                : 'I want to buy a custom-built bicycle. How does it work?',
            answer: (
                <div className="space-y-4 font-sans">
                    <ul className="list-disc pl-5 space-y-2 text-gray-500 font-bold text-sm sm:text-base leading-relaxed opacity-80">
                        <li>{language === 'es' ? 'Elige el tipo de cuadro.' : 'Choose your frame style.'}</li>
                        <li>{language === 'es' ? 'Elige tu paleta de colores favorita.' : 'Pick your favorite color palette.'}</li>
                        <li>{language === 'es' ? 'Elige tus accesorios complementarios favoritos (canasta, luces, alforja y otros).' : 'Select your favorite accessories (basket, lights, racks, child seats, and more).'}</li>
                        <li>{language === 'es' ? 'Paga el 70% del presupuesto total y el otro 30% al momento de la entrega de tu bici.' : 'Pay 70% upfront to start customization and the remaining 30% upon delivery.'}</li>
                        <li>{language === 'es' ? 'Tiempo de entrega: de 4 a 10 días hábiles. Dependerá de la orden de solicitudes.' : 'Estimated delivery time: 4 to 10 business days depending on workshop queue.'}</li>
                    </ul>
                    <div className="pt-2">
                        <Button size="sm" className="bg-gray-200 text-gray-400 cursor-not-allowed rounded-full font-black text-xs px-6 h-11 border-0" disabled>
                            {language === 'es' ? 'PERSONALIZA TU BICI (Funcionalidad futura)' : 'CUSTOMIZE YOUR BIKE (Coming Soon)'}
                        </Button>
                    </div>
                </div>
            )
        },
        {
            question: language === 'es'
                ? 'Quiero vender mi bici a medio uso. ¿Cuál es el procedimiento?'
                : 'I want to sell my pre-owned bicycle. What is the process?',
            answer: (
                <div className="space-y-4 font-sans">
                    <p className="text-gray-500 font-bold text-base sm:text-lg leading-relaxed opacity-80">
                        {language === 'es'
                            ? 'Envíanos una foto, un vídeo y el precio de tu bici a nuestra línea de atención al cliente:'
                            : 'Send us photos, a short video, and your asking price via our WhatsApp customer support line:'}
                    </p>
                    <div className="pt-1">
                        <a href="https://wa.me/59177860277" target="_blank" rel="noopener noreferrer">
                            <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white rounded-full font-black text-sm px-6 h-12 shadow-md flex items-center gap-2 border-0 transition-all hover:scale-105 active:scale-95">
                                <MessageCircle className="w-5 h-5 text-white" /> +591 77860277
                            </Button>
                        </a>
                    </div>
                </div>
            )
        }
    ];

    return (
        <div className="pt-[80px] lg:pt-[120px]">

            {/* FAQ snippet */}
            <section className="relative overflow-hidden bg-white py-14 sm:py-32">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[600px] bg-brand-yellow/5 rounded-full blur-[120px] pointer-events-none" />
                <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    <motion.div {...fadeUp} className="mb-9 space-y-3 text-center sm:mb-16 sm:space-y-4">
                        <h2 className="w-full max-w-full font-tan text-[1.45rem] leading-[1.3] tracking-normal text-brand-black sm:text-5xl sm:tracking-tight notranslate">
                            {language === 'es' ? (
                                <>
                                    <span className="block">Preguntas</span>
                                    <span className="block text-brand-yellow">frecuentes</span>
                                </>
                            ) : (
                                <>
                                    <span className="block">Frequently</span>
                                    <span className="block text-brand-yellow">Asked Questions</span>
                                </>
                            )}
                        </h2>
                        <div className="w-24 h-2 bg-brand-yellow mx-auto rounded-full shadow-sm" />
                        <p className="mx-auto max-w-2xl pt-2 font-cocon text-base font-bold text-gray-500 sm:pt-4 sm:text-lg">
                            {language === 'es'
                                ? 'Resolvemos tus dudas más comunes de forma rápida.'
                                : 'Quick answers to our most common questions.'}
                        </p>
                    </motion.div>
                    <Accordion type="single" collapsible className="space-y-5">
                        {customFaqs.map((faq, i) => (
                            <motion.div className="min-w-0"
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <AccordionItem value={`faq-${i}`} className="rounded-[1.35rem] border border-gray-100 bg-gray-50/50 px-5 transition-all duration-300 data-[state=open]:border-brand-yellow/30 data-[state=open]:bg-white data-[state=open]:shadow-xl sm:rounded-[2rem] sm:px-8">
                                    <AccordionTrigger className="min-w-0 break-words py-5 text-left text-base font-black hover:text-brand-yellow hover:no-underline !no-underline sm:py-7 sm:text-xl">
                                        {faq.question}
                                    </AccordionTrigger>
                                    <AccordionContent className="break-words pb-5 text-sm leading-relaxed opacity-80 sm:pb-7 sm:text-base">{faq.answer}</AccordionContent>
                                </AccordionItem>
                            </motion.div>
                        ))}
                    </Accordion>
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
                                        <h2 className="text-3xl sm:text-5xl font-tan text-brand-black tracking-tight leading-none break-words">
                                            {language === 'es' ? 'Envíanos un mensaje' : 'Send us a message'}
                                        </h2>
                                        <p className="text-brand-charcoal font-cocon font-bold text-[15px] sm:text-lg leading-relaxed">
                                            {language === 'es'
                                                ? 'Nos pondremos en contacto contigo lo antes posible.'
                                                : 'We will get back to you as soon as possible.'}
                                        </p>
                                    </div>
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            alert(language === 'es' ? '¡Mensaje enviado! Nos comunicaremos contigo pronto.' : 'Message sent! We will contact you soon.');
                                        }}
                                        className="space-y-6"
                                    >
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-brand-charcoal/40 font-black text-[10px] uppercase tracking-widest ml-1">
                                                    {language === 'es' ? 'Nombre Completo' : 'Full Name'}
                                                </Label>
                                                <Input placeholder={language === 'es' ? 'Tu nombre' : 'Your name'} required className="h-14 rounded-2xl bg-gray-50/50 border-gray-100 focus-visible:ring-brand-yellow/20 focus-visible:border-brand-yellow transition-all font-bold" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-brand-charcoal/40 font-black text-[10px] uppercase tracking-widest ml-1">
                                                    {language === 'es' ? 'Teléfono / WhatsApp' : 'Phone / WhatsApp'}
                                                </Label>
                                                <Input placeholder="+591 7..." required className="h-14 rounded-2xl bg-gray-50/50 border-gray-100 focus-visible:ring-brand-yellow/20 focus-visible:border-brand-yellow transition-all font-bold" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-brand-charcoal/40 font-black text-[10px] uppercase tracking-widest ml-1">
                                                {language === 'es' ? 'Correo Electrónico' : 'Email Address'}
                                            </Label>
                                            <Input type="email" placeholder={language === 'es' ? 'tu@email.com' : 'you@email.com'} className="h-14 rounded-2xl bg-gray-50/50 border-gray-100 focus-visible:ring-brand-yellow/20 focus-visible:border-brand-yellow transition-all font-bold" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-brand-charcoal/40 font-black text-[10px] uppercase tracking-widest ml-1">
                                                {language === 'es' ? 'Asunto de consulta' : 'Inquiry Subject'}
                                            </Label>
                                            <select className="w-full h-14 rounded-2xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow/20 focus-visible:border-brand-yellow transition-all appearance-none cursor-pointer">
                                                <option>{language === 'es' ? 'Consulta general' : 'General Inquiry'}</option>
                                                <option>{language === 'es' ? 'Alquiler de bici' : 'Bicycle Rental'}</option>
                                                <option>{language === 'es' ? 'Compra de producto' : 'Product Purchase'}</option>
                                                <option>{language === 'es' ? 'Servicio técnico' : 'Repair & Maintenance'}</option>
                                                <option>{language === 'es' ? 'Sugerencia' : 'Suggestion'}</option>
                                                <option>{language === 'es' ? 'Otro' : 'Other'}</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-brand-charcoal/40 font-black text-[10px] uppercase tracking-widest ml-1">
                                                {language === 'es' ? 'Tu Mensaje' : 'Your Message'}
                                            </Label>
                                            <Textarea placeholder={language === 'es' ? '¿En qué podemos ayudarte?' : 'How can we help you?'} rows={5} required className="rounded-2xl bg-gray-50/50 border-gray-100 focus-visible:ring-brand-yellow/20 focus-visible:border-brand-yellow transition-all resize-none p-4 font-medium" />
                                        </div>
                                        <div className="pt-4">
                                            <Button type="submit" variant="primary" size="lg" className="w-full h-16 font-black text-[15px] sm:text-xl shadow-[0_6px_24px_rgba(250,14,149,0.4)] hover:shadow-[0_10px_32px_rgba(250,14,149,0.55)] flex items-center justify-center gap-2 px-2">
                                                <Send className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} /> {language === 'es' ? 'ENVIAR MENSAJE' : 'SEND MESSAGE'}
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
                                            <h3 className="font-black text-lg sm:text-3xl text-brand-charcoal group-hover:text-green-600 transition-colors truncate">
                                                {language === 'es' ? 'WhatsApp Directo' : 'Direct WhatsApp'}
                                            </h3>
                                            <p className="text-[10px] sm:text-base text-gray-400 font-bold uppercase tracking-widest mt-0.5 sm:mt-1">
                                                {language === 'es' ? 'Respuesta inmediata' : 'Immediate response'}
                                            </p>
                                            <p className="text-green-600 font-black text-base sm:text-xl mt-2 sm:mt-3 tracking-tighter">+591 77860277</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </a>

                            {/* Info cards */}
                            <Card className="rounded-[2.5rem] border-0 shadow-[0_20px_50px_rgba(0,0,0,0.04)] bg-white overflow-hidden">
                                <CardContent className="p-8 sm:p-10 space-y-8">
                                    {[
                                        {
                                            icon: MapPin,
                                            title: language === 'es' ? 'Dirección' : 'Location',
                                            color: 'brand-yellow',
                                            content: (
                                                <a href="https://maps.app.goo.gl/tgqw7ZK51Y68Q7L7A?g_st=iwb" target="_blank" rel="noopener noreferrer" className="text-[13px] sm:text-lg font-black text-brand-charcoal hover:text-brand-yellow transition-colors block leading-tight">
                                                    Cochabamba, Bolivia{' '}
                                                    <span className="text-brand-yellow text-[9px] sm:text-xs mt-2 sm:mt-0 sm:ml-2 font-black uppercase tracking-widest bg-brand-yellow/10 px-3 py-1 rounded-full inline-block">
                                                        {language === 'es' ? 'Ver Mapa' : 'View Map'}
                                                    </span>
                                                </a>
                                            )
                                        },
                                        { icon: Phone, title: language === 'es' ? 'Teléfono' : 'Phone', color: 'brand-cyan', content: <p className="text-[13px] sm:text-lg font-black text-brand-charcoal">+591 77860277</p> },
                                        { icon: Mail, title: 'Email', color: 'brand-pink', content: <p className="text-[13px] sm:text-lg font-black text-brand-charcoal break-all">brizbolivia@gmail.com</p> },
                                        {
                                            icon: Clock,
                                            title: language === 'es' ? 'Horario' : 'Opening Hours',
                                            color: 'brand-charcoal',
                                            content: (
                                                <div className="text-[13px] sm:text-lg font-black text-brand-charcoal space-y-1">
                                                    <p>
                                                        {language === 'es' ? 'Lunes a Sábado:' : 'Monday to Saturday:'}{' '}
                                                        <span className="text-brand-yellow block sm:inline">8:00 - 19:00</span>
                                                    </p>
                                                    <p>
                                                        {language === 'es' ? 'Domingo:' : 'Sunday:'}{' '}
                                                        <span className="text-brand-yellow block sm:inline">9:00 - 14:00</span>
                                                    </p>
                                                </div>
                                            )
                                        }
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
                                        <p className="text-white/50 font-bold text-sm uppercase tracking-widest">
                                            {language === 'es' ? 'Síguenos en redes' : 'Follow us on social media'}
                                        </p>
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
        </div>
    );
}
