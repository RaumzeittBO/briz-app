import { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion';
import { Bike, Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const assetBaseWeb = '/Conocenos-web';
const assetBaseCel = '/Conocenos-celular';

// 3D Tilt Hover Card Component
function TiltCard({ webSrc, mobileSrc, alt }: { webSrc: string; mobileSrc: string; alt: string }) {
    const cardRef = useRef<HTMLDivElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    
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
    const scrollRotate = useTransform(scrollYProgress, [0.1, 0.5, 0.9], [-1.5, 0, 1.5]);
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
            className="w-full flex justify-center py-6 px-4 md:px-0"
        >
            <motion.div 
                ref={cardRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{
                    rotateX: springRotateX,
                    rotateY: springRotateY,
                    rotate: scrollRotate,
                    scale: scrollScale,
                    transformPerspective: 1000,
                }}
                whileHover={{ scale: 1.018 }}
                transition={{ duration: 0.2 }}
                className="relative bg-white border-3 border-brand-black shadow-[12px_12px_0_rgba(0,0,0,1)] rounded-[1.8rem] sm:rounded-[2.4rem] overflow-hidden w-full max-w-[92vw] md:max-w-[960px] group transition-shadow hover:shadow-[16px_16px_0_rgba(0,0,0,1)] select-none z-10"
            >
                {/* Visual mouse gloss shine overlay */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 z-10 mix-blend-overlay" />
                
                {/* Responsive picture structure to auto-switch web/mobile images */}
                <picture className="w-full h-auto block">
                    <source media="(min-width: 768px)" srcSet={webSrc} />
                    <img 
                        src={mobileSrc} 
                        alt={alt}
                        className="w-full h-auto object-cover block"
                        loading="lazy"
                    />
                </picture>
            </motion.div>
        </div>
    );
}

// Bicycle Tire Track Scroll Connector Component
function BikeTreadConnector() {
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
            className="w-full flex flex-col items-center relative py-2 z-0 select-none overflow-visible"
            style={{ height: '150px' }}
        >
            <div className="absolute inset-y-0 w-12 flex justify-center overflow-visible">
                {/* Vertical SVG containing the tire tread pattern */}
                <svg className="w-8 h-full text-brand-yellow/30" viewBox="0 0 32 100" preserveAspectRatio="none">
                    <defs>
                        {/* Repeatable Chevron pattern for tire tread */}
                        <pattern id="tireTreadPattern" width="16" height="12" patternUnits="userSpaceOnUse">
                            <path d="M2 2 L8 8 L14 2 M2 6 L8 12 L14 6" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.32" />
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
                        strokeWidth="3.5" 
                        strokeDasharray="8 8"
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
                    className="absolute top-0 z-10 w-11 h-11 bg-brand-yellow border-3 border-brand-black rounded-full flex items-center justify-center shadow-[4px_4px_0_rgba(0,0,0,1)] text-brand-black"
                >
                    <Bike className="w-5 h-5 rotate-90" strokeWidth={2.5} />
                </motion.div>
            </div>
        </div>
    );
}

export default function AboutPage() {
    return (
        <div className="pt-20 min-h-screen bg-[#FFFDF3] relative overflow-hidden flex flex-col">
            {/* Subtle paper texture overlay */}
            <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.11]">
                <img src="/menu-principal-web/fondo-textura.webp" alt="" className="w-full h-full object-cover mix-blend-multiply" />
            </div>

            {/* Organic ambient gradients */}
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_25%,rgba(255,210,0,0.14),transparent_30%),radial-gradient(circle_at_85%_65%,rgba(250,14,149,0.08),transparent_25%)]" />

            {/* Section Header */}
            <header className="mx-auto max-w-[1400px] px-6 pt-10 pb-6 text-center flex flex-col items-center space-y-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.82 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-2 rounded-full bg-white border border-brand-yellow/35 px-4 py-2 font-maiandra text-xs uppercase tracking-widest text-[#9A7B00] shadow-[0_8px_20px_rgba(143,104,0,0.06)]"
                >
                    <Sparkles className="h-3.5 w-3.5 text-brand-yellow" strokeWidth={2.3} />
                    Nuestra Historia
                </motion.div>
                <motion.h1 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="font-tan text-[clamp(2rem,6vw,4rem)] uppercase leading-tight text-brand-black drop-shadow-sm"
                >
                    Conoce <span className="text-brand-yellow drop-shadow-[2px_2px_0_rgba(0,0,0,0.15)]">Briz</span>
                </motion.h1>
                <motion.p 
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.18 }}
                    className="font-gochi text-lg sm:text-2xl text-brand-black/70 max-w-[500px]"
                >
                    Felicidad y bienestar integral sobre dos ruedas.
                </motion.p>
            </header>

            {/* Stack of Sections */}
            <main className="mx-auto max-w-[1200px] w-full flex-1 flex flex-col items-center py-6">
                {/* SECTION 1 */}
                <TiltCard 
                    webSrc={`${assetBaseWeb}/1.webp`}
                    mobileSrc={`${assetBaseCel}/1.webp`}
                    alt="Conócenos Briz Parte 1"
                />

                {/* TRACK CONNECTOR 1 -> 2 */}
                <BikeTreadConnector />

                {/* SECTION 2 */}
                <TiltCard 
                    webSrc={`${assetBaseWeb}/2.webp`}
                    mobileSrc={`${assetBaseCel}/2.webp`}
                    alt="Conócenos Briz Parte 2"
                />

                {/* TRACK CONNECTOR 2 -> 3 */}
                <BikeTreadConnector />

                {/* SECTION 3 */}
                <TiltCard 
                    webSrc={`${assetBaseWeb}/3.webp`}
                    mobileSrc={`${assetBaseCel}/3.webp`}
                    alt="Conócenos Briz Parte 3"
                />
            </main>

            {/* Bottom Call to Action Section */}
            <section className="bg-[#0C4E40] text-white py-16 px-6 relative overflow-hidden flex flex-col items-center text-center mt-12">
                {/* Paper texture overlay */}
                <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.09] mix-blend-multiply">
                    <img src="/menu-principal-web/fondo-textura.webp" alt="" className="w-full h-full object-cover" />
                </div>
                
                {/* Floating particle design */}
                <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(255,210,0,0.15),transparent_25%),radial-gradient(circle_at_80%_80%,rgba(250,14,149,0.08),transparent_25%)]" />

                <motion.div 
                    initial={{ opacity: 0, y: 22 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-[620px] flex flex-col items-center space-y-6"
                >
                    <h2 className="font-tan text-2xl sm:text-4xl text-white uppercase leading-tight">
                        ¿Listo para vivir la <span className="text-brand-yellow">experiencia</span>?
                    </h2>
                    <p className="font-cocon text-base sm:text-xl text-white/84 leading-relaxed max-w-[500px]">
                        Te invitamos a visitarnos, conocer nuestras rutas o alquilar una de nuestras bicicletas personalizadas.
                    </p>
                    <div className="pt-4 flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-center justify-center">
                        <Link to="/contact" className="w-full sm:w-auto">
                            <motion.button
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                className="w-full sm:w-auto px-10 py-5 bg-brand-yellow text-brand-black border-3 border-brand-black font-cocon font-black text-sm uppercase tracking-wider rounded-full shadow-[5px_5px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all cursor-pointer flex items-center justify-center gap-3"
                            >
                                <span>Contáctanos</span>
                                <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                            </motion.button>
                        </Link>
                        <Link to="/rentals" className="w-full sm:w-auto">
                            <motion.button
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                className="w-full sm:w-auto px-10 py-5 bg-[#FFFDF3] text-brand-black border-3 border-brand-black font-cocon font-black text-sm uppercase tracking-wider rounded-full shadow-[5px_5px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all cursor-pointer flex items-center justify-center gap-3"
                            >
                                <span>Alquilar Bicicleta</span>
                                <Bike className="w-4 h-4" strokeWidth={2.5} />
                            </motion.button>
                        </Link>
                    </div>
                </motion.div>
            </section>
        </div>
    );
}
