import { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion';
import { Bike, Sparkles, Heart, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import ArtworkBackground from '@/components/ArtworkBackground';
import ArtworkPicture from '@/components/ArtworkPicture';
import type { ArtworkSlotId } from '@/lib/artworkRegistry';

// Crinkled Translucent Washi Tape Sticker Component
function WashiTape({ className }: { className: string }) {
    return (
        <div className={`absolute w-28 h-7 sm:w-36 sm:h-9 bg-[#FFFEE0]/82 border-x-2 border-dashed border-brand-black/15 backdrop-blur-[2px] shadow-[2px_2px_5px_rgba(0,0,0,0.06)] z-20 flex items-center justify-center select-none ${className}`}>
            <div className="w-full h-full border-y border-dashed border-brand-black/5" />
        </div>
    );
}

// Background Decorations Component: Sparkles, dots, and drawing paths
function AboutBackgroundDecorations() {
    return (
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
            {/* Floating Sparkles & Dots in Briz Colors */}
            {[
                { left: '6%', top: '12%', size: 14, color: '#FFD200', duration: 7.2 },
                { left: '92%', top: '18%', size: 10, color: '#FA0E95', duration: 8.5 },
                { left: '4%', top: '42%', size: 12, color: '#24A9C5', duration: 6.9 },
                { left: '94%', top: '52%', size: 16, color: '#FFD200', duration: 9.1 },
                { left: '8%', top: '72%', size: 11, color: '#FA0E95', duration: 7.8 },
                { left: '88%', top: '85%', size: 15, color: '#24A9C5', duration: 8.2 },
            ].map((particle, idx) => (
                <motion.div
                    key={idx}
                    className="absolute rounded-full opacity-[0.22] blur-[0.5px]"
                    style={{
                        left: particle.left,
                        top: particle.top,
                        width: particle.size,
                        height: particle.size,
                        backgroundColor: particle.color,
                        boxShadow: `0 0 ${particle.size * 2.5}px ${particle.color}`,
                    }}
                    animate={{
                        y: [0, -24, 0],
                        x: [0, 12, 0],
                        scale: [0.9, 1.3, 0.9],
                    }}
                    transition={{
                        duration: particle.duration,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: idx * 0.45,
                    }}
                />
            ))}

            {/* Doodled bike paths drawing in the background */}
            <div className="absolute top-[28%] left-[-5%] w-[42%] h-44 opacity-[0.14]">
                <svg className="w-full h-full text-brand-yellow" viewBox="0 0 400 120" fill="none" preserveAspectRatio="none">
                    <motion.path 
                        d="M10 90 Q 130 15, 250 100 T 390 40" 
                        stroke="currentColor" 
                        strokeWidth="3.5" 
                        strokeDasharray="9 9"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true, amount: 0.1 }}
                        transition={{ duration: 2.5, ease: "easeInOut" }}
                    />
                </svg>
            </div>
            
            <div className="absolute top-[68%] right-[-5%] w-[42%] h-44 opacity-[0.14]">
                <svg className="w-full h-full text-brand-yellow" viewBox="0 0 400 120" fill="none" preserveAspectRatio="none">
                    <motion.path 
                        d="M390 40 Q 270 100, 150 15 T 10 90" 
                        stroke="currentColor" 
                        strokeWidth="3.5" 
                        strokeDasharray="9 9"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true, amount: 0.1 }}
                        transition={{ duration: 2.5, ease: "easeInOut" }}
                    />
                </svg>
            </div>
        </div>
    );
}

// 3D Tilt Hover Card Component
interface TiltCardProps {
    slotId: ArtworkSlotId;
    alt: string;
    idx: number;
    language: 'es' | 'en';
}

function TiltCard({ slotId, alt, idx, language }: TiltCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    // Transform coordinates [-0.5, 0.5] into angles of rotation [-6, 6] degrees
    const rotateX = useTransform(y, [-0.5, 0.5], [6, -6]);
    const rotateY = useTransform(x, [-0.5, 0.5], [-6, 6]);
    
    // Add smooth springs to avoid jittery movements
    const springRotateX = useSpring(rotateX, { damping: 25, stiffness: 220 });
    const springRotateY = useSpring(rotateY, { damping: 25, stiffness: 220 });
    
    // Floating transition on load and scroll
    const cardScrollRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: cardScrollRef,
        offset: ["start end", "end start"]
    });
    
    // Smooth floating scale and rotate animation on scroll
    const scrollRotate = useTransform(scrollYProgress, [0.1, 0.5, 0.9], [-1.2, 0, 1.2]);
    const scrollScale = useTransform(scrollYProgress, [0.1, 0.5, 0.9], [0.98, 1, 0.98]);
    
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left - width / 2;
        const mouseY = e.clientY - rect.top - height / 2;
        x.set(mouseX / width);
        y.set(mouseY / height);
    };
    
    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <div 
            ref={cardScrollRef} 
            className="w-full flex justify-center py-14 px-2 sm:px-6 md:px-0"
        >
            <motion.div 
                ref={cardRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{
                    rotateX: isMobile ? 0 : springRotateX,
                    rotateY: isMobile ? 0 : springRotateY,
                    rotate: scrollRotate,
                    scale: scrollScale,
                    transformPerspective: isMobile ? undefined : 1000,
                }}
                whileHover={{ scale: 1.018 }}
                transition={{ duration: 0.2 }}
                className="relative bg-brand-yellow border-[6px] sm:border-[12px] border-brand-yellow outline outline-3 sm:outline-4 outline-brand-black shadow-[14px_14px_0_rgba(0,0,0,1)] sm:shadow-[20px_20px_0_rgba(0,0,0,1)] rounded-[1.8rem] sm:rounded-[2.4rem] w-full max-w-[98vw] md:max-w-[1480px] group transition-all hover:translate-y-[-4px] hover:shadow-[24px_24px_0_rgba(0,0,0,1)] select-none z-10"
            >
                {/* Scrapbook corner tapes */}
                <WashiTape className="-top-3 left-6 sm:left-14 rotate-[-12deg]" />
                <WashiTape className="-top-4 right-6 sm:right-14 rotate-[15deg]" />

                {/* Varied scrapbook sticker badges at the card edges */}
                {idx === 0 && (
                    <>
                        <motion.div 
                            animate={{ rotate: [0, 360] }}
                            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                            className="absolute -bottom-6 sm:-bottom-8 -left-3 sm:-left-5 bg-brand-pink border-3 border-brand-black rounded-xl p-2.5 shadow-[4px_4px_0_rgba(0,0,0,1)] text-white z-20"
                            title="Sparkles!"
                        >
                            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
                        </motion.div>
                        <div className="absolute -bottom-7 sm:-bottom-9 -right-3 sm:-right-5 bg-[#67B852] border-3 border-brand-black rounded-full p-2.5 shadow-[4px_4px_0_rgba(0,0,0,1)] text-white z-20 rotate-[12deg] group-hover:scale-110 transition-transform duration-200">
                            <Bike className="w-5 h-5" strokeWidth={2.3} />
                        </div>
                    </>
                )}

                {idx === 1 && (
                    <>
                        <div className="absolute -bottom-6 sm:-bottom-8 -left-4 sm:-left-5 bg-brand-cyan border-3 border-brand-black rounded-xl p-2.5 shadow-[4px_4px_0_rgba(0,0,0,1)] text-white z-20 rotate-[-10deg] group-hover:-translate-x-1 transition-transform">
                            <Heart className="w-5 h-5 fill-current" strokeWidth={2} />
                        </div>
                        <motion.div 
                            animate={{ scale: [1, 1.15, 1] }}
                            transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
                            className="absolute -bottom-7 sm:-bottom-9 -right-3 bg-brand-orange border-3 border-brand-black rounded-full p-2.5 shadow-[4px_4px_0_rgba(0,0,0,1)] text-white z-20 rotate-[8deg]"
                        >
                            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
                        </motion.div>
                    </>
                )}

                {idx === 2 && (
                    <>
                        <div className="absolute -bottom-7 sm:-bottom-9 -left-3 sm:-left-4 bg-[#67B852] border-3 border-brand-black rounded-full p-2.5 shadow-[4px_4px_0_rgba(0,0,0,1)] text-white z-20 rotate-[-12deg] group-hover:scale-110 transition-transform duration-200">
                            <Bike className="w-5 h-5" strokeWidth={2.3} />
                        </div>
                        <Link to="/contact" className="absolute -bottom-7 sm:-bottom-9 -right-4 sm:-right-5 bg-brand-pink border-3 border-brand-black rounded-xl p-2.5 shadow-[4px_4px_0_rgba(0,0,0,1)] text-white z-20 rotate-[6deg] hover:scale-105 transition-transform flex items-center gap-1.5 font-cocon text-xs font-black uppercase">
                            <span>{language === 'es' ? 'Conocer' : 'Explore'}</span>
                            <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                        </Link>
                    </>
                )}

                {/* Inner image container to handle corner cropping */}
                <div className="w-full h-auto overflow-hidden rounded-[1.35rem] sm:rounded-[1.7rem] relative">
                    {/* Visual mouse gloss shine overlay */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 z-10 mix-blend-overlay" />
                    
                    {/* Responsive picture structure to auto-switch web/mobile images */}
                    <ArtworkPicture slotId={slotId} language={language} alt={alt} className="w-full select-none" imageClassName="block h-auto w-full border-b-2 border-brand-black" loading="eager" style={{ transform: 'translateZ(0)', backfaceVisibility: 'hidden', WebkitFontSmoothing: 'antialiased' }} />
                </div>
            </motion.div>
        </div>
    );
}

// Bicycle Tire Track Scroll Connector Component
function BikeTreadConnector({ language }: { language: 'es' | 'en' }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    });
    
    // Path length animation linked to scroll
    const pathLength = useSpring(scrollYProgress, { stiffness: 100, damping: 28 });
    
    // Position of the bike: maps progress to translation from top to bottom
    const bikeY = useTransform(scrollYProgress, [0.05, 0.95], ["0%", "100%"]);
    // Fade bike in and out at boundaries to avoid popping
    const bikeOpacity = useTransform(scrollYProgress, [0.05, 0.15, 0.85, 0.95], [0, 1, 1, 0]);
    const bikeScale = useTransform(scrollYProgress, [0.05, 0.15, 0.85, 0.95], [0.7, 1, 1, 0.7]);
    
    return (
        <div 
            ref={containerRef} 
            className="w-full flex flex-col items-center relative py-4 z-10 select-none overflow-visible"
            style={{ height: '160px' }}
        >
            <div className="absolute inset-y-0 w-12 flex justify-center overflow-visible">
                {/* Arrow Doodles pointing down */}
                <div className="absolute left-[-6rem] top-1/4 hidden md:block text-[#203253]/35 font-gochi text-base rotate-[-8deg] pointer-events-none">
                    👉 {language === 'es' ? 'Sigue la ruta' : 'Follow the route'}
                </div>
                <div className="absolute right-[-8rem] top-1/2 hidden md:block text-[#203253]/35 font-gochi text-base rotate-[12deg] pointer-events-none">
                    {language === 'es' ? 'Pedalea hacia abajo' : 'Pedal down'} 👇
                </div>

                {/* Vertical SVG containing the tire tread pattern */}
                <svg className="w-8 h-full text-brand-yellow/35" viewBox="0 0 32 100" preserveAspectRatio="none">
                    <defs>
                        {/* Repeatable Chevron pattern for tire tread */}
                        <pattern id="tireTreadPattern" width="16" height="12" patternUnits="userSpaceOnUse">
                            <path d="M2 2 L8 8 L14 2 M2 6 L8 12 L14 6" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.45" />
                        </pattern>
                    </defs>
                    {/* Shadow tread pattern */}
                    <rect width="16" height="100" x="8" fill="url(#tireTreadPattern)" />
                    
                    {/* Dotted drawing path representing bike track */}
                    <motion.line 
                        x1="16" 
                        y1="0" 
                        x2="16" 
                        y2="100" 
                        stroke="#FFD200" 
                        strokeWidth="4" 
                        strokeDasharray="9 9"
                        style={{ pathLength }}
                    />
                </svg>
                
                {/* Floating bicycle sticker driving down the path */}
                <motion.div 
                    style={{ 
                        y: bikeY,
                        opacity: bikeOpacity,
                        scale: bikeScale,
                        translateX: "-50%",
                        left: "50%"
                    }}
                    className="absolute top-0 z-10 w-12 h-12 bg-brand-yellow border-3 border-brand-black rounded-full flex items-center justify-center shadow-[4px_4px_0_rgba(0,0,0,1)] text-brand-black"
                >
                    <Bike className="w-5 h-5 rotate-90" strokeWidth={2.5} />
                </motion.div>
            </div>
        </div>
    );
}

export default function AboutPage() {
    const { language } = useLanguage();

    return (
        <div className="pt-20 min-h-screen bg-[#FFFDF3] relative overflow-hidden flex flex-col">
            {/* Subtle paper texture overlay */}
            <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.11]">
                <ArtworkBackground slotId="about_texture" language={language} className="mix-blend-multiply" />
            </div>

            {/* Background decorations with sparkles and bike tracks */}
            <AboutBackgroundDecorations />

            {/* Section Header */}
            <header className="mx-auto max-w-[1400px] px-6 pt-10 pb-6 text-center flex flex-col items-center space-y-4 relative z-10">
                <motion.h1 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="font-tan text-[clamp(2.2rem,6vw,4.5rem)] uppercase leading-tight text-brand-black drop-shadow-sm notranslate"
                >
                    {language === 'es' ? 'Conoce' : 'Get to know'}{' '}
                    <span className="text-brand-yellow drop-shadow-[2px_2px_0_rgba(0,0,0,0.15)]">Briz</span>
                </motion.h1>
                <motion.p 
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.18 }}
                    className="font-gochi text-lg sm:text-2xl text-brand-black/70 max-w-[500px]"
                >
                    {language === 'es'
                        ? 'Felicidad y bienestar integral sobre dos ruedas.'
                        : 'Happiness and holistic well-being on two wheels.'}
                </motion.p>
            </header>

            {/* Stack of Sections */}
            <main className="mx-auto max-w-[1600px] w-full flex-1 flex flex-col items-center py-6 relative z-10">
                {/* SECTION 1 */}
                <TiltCard 
                    slotId="about_slide_1"
                    alt="Nuestra historia Briz"
                    idx={0}
                    language={language}
                />

                {/* TRACK CONNECTOR 1 -> 2 */}
                <BikeTreadConnector language={language} />

                {/* SECTION 2 */}
                <TiltCard 
                    slotId="about_slide_2"
                    alt="Misión y visión de Briz"
                    idx={1}
                    language={language}
                />

                {/* TRACK CONNECTOR 2 -> 3 */}
                <BikeTreadConnector language={language} />

                {/* SECTION 3 */}
                <TiltCard 
                    slotId="about_slide_3"
                    alt="Valores de Briz"
                    idx={2}
                    language={language}
                />
            </main>

            {/* Bottom Call to Action Section */}
            <section className="bg-[#0C4E40] text-white py-16 px-6 relative overflow-hidden flex flex-col items-center text-center mt-12 z-10">
                {/* Paper texture overlay */}
                <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.09] mix-blend-multiply">
                    <ArtworkBackground slotId="about_texture" language={language} />
                </div>
                
                {/* Floating particle design */}
                <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(255,210,0,0.15),transparent_25%),radial-gradient(circle_at_80%_80%,rgba(250,14,149,0.08),transparent_25%)]" />

                <motion.div 
                    initial={{ opacity: 0, y: 22 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-[620px] flex flex-col items-center space-y-6"
                >
                    <h2 className="font-tan text-[1.45rem] sm:text-3xl text-white uppercase leading-[1.38] tracking-normal">
                        {language === 'es' ? (
                            <>¿Listo para vivir la <span className="text-brand-yellow">experiencia</span>?</>
                        ) : (
                            <>Ready to live the <span className="text-brand-yellow">experience</span>?</>
                        )}
                    </h2>
                    <p className="font-cocon text-base sm:text-xl text-white/84 leading-relaxed max-w-[500px]">
                        {language === 'es'
                            ? 'Te invitamos a visitarnos, conocer nuestras rutas o alquilar una de nuestras bicicletas personalizadas.'
                            : 'Come visit us, explore our cycling routes, or rent one of our custom-fitted bicycles.'}
                    </p>
                    <div className="pt-4 flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-center justify-center">
                        <Link to="/contact" className="w-full sm:w-auto">
                            <motion.button
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                className="w-full sm:w-auto px-10 py-5 bg-brand-yellow text-brand-black border-3 border-brand-black font-cocon font-black text-sm uppercase tracking-wider rounded-full shadow-[5px_5px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all cursor-pointer flex items-center justify-center gap-3"
                            >
                                <span>{language === 'es' ? 'Contáctanos' : 'Contact Us'}</span>
                                <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                            </motion.button>
                        </Link>
                        <Link to="/rentals" className="w-full sm:w-auto">
                            <motion.button
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                className="w-full sm:w-auto px-10 py-5 bg-[#FFFDF3] text-brand-black border-3 border-brand-black font-cocon font-black text-sm uppercase tracking-wider rounded-full shadow-[5px_5px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all cursor-pointer flex items-center justify-center gap-3"
                            >
                                <span>{language === 'es' ? 'Alquilar Bicicleta' : 'Rent a Bike'}</span>
                                <Bike className="w-4 h-4" strokeWidth={2.5} />
                            </motion.button>
                        </Link>
                    </div>
                </motion.div>
            </section>
        </div>
    );
}
