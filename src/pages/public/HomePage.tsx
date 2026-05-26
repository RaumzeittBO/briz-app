import { motion } from 'framer-motion';

const homeSections = [1, 2, 3, 4, 5, 6];

function HomeOrganicDivider({ variant }: { variant: 'a' | 'b' }) {
    const isVariantA = variant === 'a';
    const bandPath = isVariantA
        ? 'M0 36C185 82 370 86 568 54C756 24 912 7 1110 34C1256 54 1352 76 1440 48L1440 82C1352 110 1256 88 1110 68C912 41 756 58 568 88C370 120 185 116 0 70Z'
        : 'M0 54C160 28 332 20 528 44C744 70 918 98 1114 64C1266 38 1360 26 1440 42L1440 76C1360 60 1266 72 1114 98C918 132 744 104 528 78C332 54 160 62 0 88Z';
    const linePath = isVariantA
        ? 'M0 36C185 82 370 86 568 54C756 24 912 7 1110 34C1256 54 1352 76 1440 48'
        : 'M0 54C160 28 332 20 528 44C744 70 918 98 1114 64C1266 38 1360 26 1440 42';

    return (
        <div className="pointer-events-none absolute inset-x-0 -bottom-7 z-20 h-14 sm:-bottom-10 sm:h-20 lg:-bottom-14 lg:h-28" aria-hidden="true">
            <svg
                viewBox="0 0 1440 128"
                className="h-full w-full drop-shadow-[0_-6px_14px_rgba(0,0,0,0.08)]"
                preserveAspectRatio="none"
            >
                <path d={bandPath} fill="#FFD200" fillOpacity="0.76" />
                <path d={linePath} fill="none" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" />
                <path d={linePath} fill="none" stroke="#FFFFFF" strokeWidth="2" strokeOpacity="0.45" strokeLinecap="round" transform="translate(0 9)" />
            </svg>
        </div>
    );
}

export default function HomePage() {
    return (
        <div className="bg-white pt-[73px] lg:pt-[104px]">
            {homeSections.map((sectionNumber, index) => {
                const isFirstSection = index === 0;
                const isLastSection = index === homeSections.length - 1;

                return (
                    <motion.section
                        key={sectionNumber}
                        className="relative w-full overflow-visible"
                        aria-label={`Sección principal ${sectionNumber}`}
                        initial={isFirstSection ? false : { opacity: 0, y: 18 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.18 }}
                        transition={{ duration: 0.55, ease: 'easeOut' }}
                        style={{ zIndex: homeSections.length - index }}
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
                            <HomeOrganicDivider variant={index % 2 === 0 ? 'a' : 'b'} />
                        )}
                    </motion.section>
                );
            })}
        </div>
    );
}
