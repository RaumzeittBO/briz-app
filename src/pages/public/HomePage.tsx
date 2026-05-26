import { motion } from 'framer-motion';

const homeSections = [1, 2, 3, 4, 5, 6];

export default function HomePage() {
    return (
        <div className="bg-white pt-[73px] lg:pt-[104px]">
            {homeSections.map((sectionNumber, index) => {
                const isFirstSection = index === 0;
                const isLastSection = index === homeSections.length - 1;

                return (
                    <motion.section
                        key={sectionNumber}
                        className="relative w-full overflow-hidden"
                        aria-label={`Sección principal ${sectionNumber}`}
                        initial={isFirstSection ? false : { opacity: 0, y: 18 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.18 }}
                        transition={{ duration: 0.55, ease: 'easeOut' }}
                    >
                        <picture>
                            <source
                                media="(max-width: 767px)"
                                srcSet={`/menu-principal-celular/${sectionNumber}.webp`}
                            />
                            <img
                                src={`/menu-principal-web/${sectionNumber}.webp`}
                                alt=""
                                className="block h-auto w-full"
                                decoding="async"
                                fetchPriority={isFirstSection ? 'high' : 'auto'}
                                loading={isFirstSection ? 'eager' : 'lazy'}
                                sizes="100vw"
                            />
                        </picture>

                        {!isLastSection && (
                            <div
                                className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10 bg-gradient-to-b from-transparent via-white/10 to-white/18 sm:h-14 lg:h-20"
                                aria-hidden="true"
                            />
                        )}
                    </motion.section>
                );
            })}
        </div>
    );
}
