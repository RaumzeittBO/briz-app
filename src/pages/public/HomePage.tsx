const homeSections = [1, 2, 3, 4, 5, 6];

export default function HomePage() {
    return (
        <div className="bg-white pt-[73px] lg:pt-[104px]">
            {homeSections.map((sectionNumber, index) => {
                const isFirstSection = index === 0;

                return (
                    <section
                        key={sectionNumber}
                        className="relative w-full overflow-hidden"
                        aria-label={`Sección principal ${sectionNumber}`}
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
                    </section>
                );
            })}
        </div>
    );
}
