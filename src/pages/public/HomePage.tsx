import { createContext, useContext, useEffect, useState, type ComponentType, type CSSProperties, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    ArrowRight,
    Bike,
    ChevronLeft,
    ChevronRight,
    HeartHandshake,
    Map,
    MapPinned,
    Route,
    ShieldCheck,
    Sparkles,
    Star,
    Store,
    Wrench,
    UsersRound,
    type LucideIcon,
} from 'lucide-react';

const assetBase = '/menu-principal-web';
const designStorageKey = 'briz-home-design-editor-v3';
const designEditorEnabled = import.meta.env.DEV;

type DesignViewport = 'desktop' | 'mobile';
type EditableElementId =
    | 'heroLettering'
    | 'heroCollage'
    | 'heroButtons'
    | 'servicesTitle'
    | 'servicesImage'
    | 'whyTitle'
    | 'whyLeftText'
    | 'purposeTitle'
    | 'purposeText'
    | 'brandTitle'
    | 'brandLeftText'
    | 'brandLogo'
    | 'brandIllustration'
    | 'brandRightText'
    | 'brandComingSoon';

type EditableTransform = {
    x: number;
    y: number;
    scale: number;
};

type DesignConfig = Record<DesignViewport, Record<EditableElementId, EditableTransform>>;

const editableLabels: Record<EditableElementId, string> = {
    heroLettering: 'Hero lettering',
    heroCollage: 'Hero collage',
    heroButtons: 'Hero botones',
    servicesTitle: 'Servicios titulo',
    servicesImage: 'Servicios imagen',
    whyTitle: 'Por que elegir',
    whyLeftText: 'Texto izquierdo',
    purposeTitle: 'Proposito',
    purposeText: 'Texto proposito',
    brandTitle: 'Marca titulo',
    brandLeftText: 'Marca texto izq.',
    brandLogo: 'Marca logo',
    brandIllustration: 'Marca ilustracion',
    brandRightText: 'Marca texto der.',
    brandComingSoon: 'Proximamente',
};

const defaultTransform: EditableTransform = { x: 0, y: 0, scale: 1 };

const defaultDesignConfig: DesignConfig = {
    desktop: {
        heroLettering: { x: 0, y: 0, scale: 0.98 },
        heroCollage: { x: 0, y: 0, scale: 0.92 },
        heroButtons: { x: 0, y: 0, scale: 0.98 },
        servicesTitle: { x: 0, y: 0, scale: 1 },
        servicesImage: { x: 164, y: 0, scale: 1.19 },
        whyTitle: { x: -184, y: 10, scale: 1 },
        whyLeftText: { x: -132, y: 0, scale: 1 },
        purposeTitle: { x: 105, y: -95, scale: 1 },
        purposeText: { x: 138, y: -257, scale: 1.21 },
        brandTitle: { x: -138, y: 7, scale: 1 },
        brandLeftText: { x: -86, y: 7, scale: 1.15 },
        brandLogo: { x: 0, y: 0, scale: 1 },
        brandIllustration: { x: 0, y: 0, scale: 1 },
        brandRightText: { x: 158, y: -56, scale: 1.2 },
        brandComingSoon: { x: 197, y: 257, scale: 0.59 },
    },
    mobile: {
        heroLettering: { x: 0, y: 0, scale: 0.73 },
        heroCollage: { x: 0, y: 0, scale: 1.30 },
        heroButtons: { x: 0, y: 0, scale: 1 },
        servicesTitle: { x: 0, y: 0, scale: 1 },
        servicesImage: { x: 0, y: 0, scale: 1 },
        whyTitle: { x: 0, y: 0, scale: 1 },
        whyLeftText: { x: 0, y: 0, scale: 1 },
        purposeTitle: { x: 0, y: 0, scale: 1 },
        purposeText: { x: 0, y: 0, scale: 1 },
        brandTitle: { x: 0, y: 0, scale: 1 },
        brandLeftText: { x: 0, y: 0, scale: 1 },
        brandLogo: { x: 0, y: 0, scale: 1 },
        brandIllustration: { x: 0, y: 0, scale: 1 },
        brandRightText: { x: 0, y: 0, scale: 1 },
        brandComingSoon: { x: 0, y: 0, scale: 1 },
    },
};

type DesignEditorContextValue = {
    activeViewport: DesignViewport;
    config: DesignConfig;
    editorOpen: boolean;
    selectedId: EditableElementId;
    setSelectedId: (id: EditableElementId) => void;
    updateTransform: (viewport: DesignViewport, id: EditableElementId, patch: Partial<EditableTransform>) => void;
};

const DesignEditorContext = createContext<DesignEditorContextValue | null>(null);

function cloneDefaultDesignConfig(): DesignConfig {
    return {
        desktop: { ...defaultDesignConfig.desktop },
        mobile: { ...defaultDesignConfig.mobile },
    };
}

function mergeDesignConfig(saved: unknown): DesignConfig {
    const base = cloneDefaultDesignConfig();
    if (!saved || typeof saved !== 'object') return base;

    for (const viewport of ['desktop'] as const) {
        const savedViewport = (saved as Partial<DesignConfig>)[viewport];
        if (!savedViewport || typeof savedViewport !== 'object') continue;

        for (const id of Object.keys(editableLabels) as EditableElementId[]) {
            const value = savedViewport[id];
            if (!value || typeof value !== 'object') continue;
            base[viewport][id] = {
                x: Number.isFinite(value.x) ? value.x : 0,
                y: Number.isFinite(value.y) ? value.y : 0,
                scale: Number.isFinite(value.scale) ? value.scale : 1,
            };
        }
    }

    return base;
}

function useCurrentViewport(): DesignViewport {
    const [viewport, setViewport] = useState<DesignViewport>(() => {
        if (typeof window === 'undefined') return 'desktop';
        return window.innerWidth >= 1024 ? 'desktop' : 'mobile';
    });

    useEffect(() => {
        const update = () => setViewport(window.innerWidth >= 1024 ? 'desktop' : 'mobile');
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    return viewport;
}

function useDesignConfig() {
    const [config, setConfig] = useState<DesignConfig>(() => {
        if (!designEditorEnabled || typeof window === 'undefined') return cloneDefaultDesignConfig();
        try {
            return mergeDesignConfig(JSON.parse(window.localStorage.getItem(designStorageKey) || 'null'));
        } catch {
            return cloneDefaultDesignConfig();
        }
    });

    useEffect(() => {
        if (!designEditorEnabled) return;
        window.localStorage.setItem(designStorageKey, JSON.stringify(config));
    }, [config]);

    const updateTransform = (viewport: DesignViewport, id: EditableElementId, patch: Partial<EditableTransform>) => {
        setConfig((current) => ({
            ...current,
            [viewport]: {
                ...current[viewport],
                [id]: {
                    ...current[viewport][id],
                    ...patch,
                },
            },
        }));
    };

    const reset = () => setConfig(cloneDefaultDesignConfig());

    return { config, updateTransform, reset };
}

function editableStyle(transform: EditableTransform): CSSProperties {
    return {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
        transformOrigin: 'center',
    };
}

function EditableLayer({ id, className = '', children }: { id: EditableElementId; className?: string; children: ReactNode }) {
    const editor = useContext(DesignEditorContext);
    const [dragStart, setDragStart] = useState<{ pointerX: number; pointerY: number; x: number; y: number } | null>(null);

    if (!editor) return <>{children}</>;

    const transform = editor.config[editor.activeViewport][id];
    const selected = editor.selectedId === id;

    return (
        <div
            className={`relative ${editor.editorOpen ? 'cursor-move' : ''} ${selected && editor.editorOpen ? 'outline outline-2 outline-brand-pink/80 outline-offset-4' : ''} ${className}`}
            style={editableStyle(transform)}
            onClick={(event) => {
                if (!editor.editorOpen) return;
                event.preventDefault();
                event.stopPropagation();
                editor.setSelectedId(id);
            }}
            onPointerDown={(event) => {
                if (!editor.editorOpen) return;
                event.preventDefault();
                event.stopPropagation();
                editor.setSelectedId(id);
                setDragStart({ pointerX: event.clientX, pointerY: event.clientY, x: transform.x, y: transform.y });
                event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={(event) => {
                if (!editor.editorOpen || !dragStart) return;
                editor.updateTransform(editor.activeViewport, id, {
                    x: Math.round(dragStart.x + event.clientX - dragStart.pointerX),
                    y: Math.round(dragStart.y + event.clientY - dragStart.pointerY),
                });
            }}
            onPointerUp={() => setDragStart(null)}
        >
            {editor.editorOpen && (
                <span className="pointer-events-none absolute -left-1 -top-7 z-50 rounded-full bg-brand-pink px-2 py-1 font-maiandra text-[10px] text-white shadow">
                    {editableLabels[id]}
                </span>
            )}
            {children}
        </div>
    );
}

function DesignEditorPanel({
    config,
    selectedId,
    setSelectedId,
    editViewport,
    setEditViewport,
    editorOpen,
    setEditorOpen,
    updateTransform,
    reset,
}: {
    config: DesignConfig;
    selectedId: EditableElementId;
    setSelectedId: (id: EditableElementId) => void;
    editViewport: DesignViewport;
    setEditViewport: (viewport: DesignViewport) => void;
    editorOpen: boolean;
    setEditorOpen: (open: boolean) => void;
    updateTransform: (viewport: DesignViewport, id: EditableElementId, patch: Partial<EditableTransform>) => void;
    reset: () => void;
}) {
    const value = config[editViewport][selectedId];

    const copyConfig = async () => {
        const json = JSON.stringify(config, null, 2);
        try {
            await navigator.clipboard.writeText(json);
            window.alert('Configuracion copiada.');
        } catch {
            window.prompt('Copia esta configuracion:', json);
        }
    };

    if (!editorOpen) {
        return (
            <button
                type="button"
                onClick={() => setEditorOpen(true)}
                className="fixed bottom-5 right-5 z-[120] rounded-full bg-brand-black px-5 py-3 font-cocon text-sm font-bold text-white shadow-[0_14px_28px_rgba(0,0,0,0.22)] transition hover:scale-105"
            >
                Editar diseño
            </button>
        );
    }

    return (
        <aside className="fixed bottom-4 right-4 z-[120] w-[min(92vw,22rem)] rounded-2xl bg-white/96 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.24)] ring-1 ring-brand-yellow/30 backdrop-blur">
            <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                    <p className="font-tan text-base leading-tight text-brand-black">Editor visual</p>
                    <p className="font-maiandra text-xs text-brand-black/55">Se guarda en este navegador</p>
                </div>
                <button
                    type="button"
                    onClick={() => setEditorOpen(false)}
                    className="rounded-full bg-brand-black px-3 py-1.5 font-cocon text-xs font-bold text-white"
                >
                    Cerrar
                </button>
            </div>

            <div className="mb-3 grid grid-cols-2 gap-2">
                {(['desktop', 'mobile'] as const).map((viewport) => (
                    <button
                        key={viewport}
                        type="button"
                        onClick={() => setEditViewport(viewport)}
                        className={`rounded-full px-3 py-2 font-cocon text-sm font-bold ${editViewport === viewport ? 'bg-brand-yellow text-brand-black' : 'bg-[#FFF8DF] text-brand-black/65'}`}
                    >
                        {viewport === 'desktop' ? 'PC' : 'Móvil'}
                    </button>
                ))}
            </div>

            <label className="mb-3 block">
                <span className="mb-1 block font-maiandra text-xs text-brand-black/60">Elemento</span>
                <select
                    value={selectedId}
                    onChange={(event) => setSelectedId(event.target.value as EditableElementId)}
                    className="w-full rounded-xl border border-brand-yellow/30 bg-white px-3 py-2 font-cocon text-sm text-brand-black"
                >
                    {(Object.keys(editableLabels) as EditableElementId[]).map((id) => (
                        <option key={id} value={id}>
                            {editableLabels[id]}
                        </option>
                    ))}
                </select>
            </label>

            {[
                { key: 'x', label: 'Mover X', min: -500, max: 500, step: 1 },
                { key: 'y', label: 'Mover Y', min: -500, max: 500, step: 1 },
                { key: 'scale', label: 'Tamaño', min: 0.35, max: 2.2, step: 0.01 },
            ].map((control) => (
                <label key={control.key} className="mb-3 block">
                    <span className="mb-1 flex justify-between font-maiandra text-xs text-brand-black/60">
                        <span>{control.label}</span>
                        <span>{value[control.key as keyof EditableTransform]}</span>
                    </span>
                    <input
                        type="range"
                        min={control.min}
                        max={control.max}
                        step={control.step}
                        value={value[control.key as keyof EditableTransform]}
                        onChange={(event) => updateTransform(editViewport, selectedId, { [control.key]: Number(event.target.value) } as Partial<EditableTransform>)}
                        className="w-full accent-brand-yellow"
                    />
                </label>
            ))}

            <div className="grid grid-cols-3 gap-2">
                <button
                    type="button"
                    onClick={() => updateTransform(editViewport, selectedId, defaultTransform)}
                    className="rounded-xl bg-[#FFF8DF] px-3 py-2 font-cocon text-xs font-bold text-brand-black"
                >
                    Reset elem.
                </button>
                <button
                    type="button"
                    onClick={reset}
                    className="rounded-xl bg-[#FFE8E8] px-3 py-2 font-cocon text-xs font-bold text-brand-black"
                >
                    Reset todo
                </button>
                <button
                    type="button"
                    onClick={copyConfig}
                    className="rounded-xl bg-brand-black px-3 py-2 font-cocon text-xs font-bold text-white"
                >
                    Copiar JSON
                </button>
            </div>
        </aside>
    );
}

type SmartImageProps = {
    src: string;
    fallbackSrcs?: string[];
    alt: string;
    className?: string;
    placeholderClassName?: string;
    placeholderLabel: string;
    loading?: 'eager' | 'lazy';
    fetchPriority?: 'high' | 'low' | 'auto';
};

function SmartImage({
    src,
    fallbackSrcs = [],
    alt,
    className = '',
    placeholderClassName = '',
    placeholderLabel,
    loading = 'lazy',
    fetchPriority,
}: SmartImageProps) {
    const sources = [src, ...fallbackSrcs];
    const [sourceIndex, setSourceIndex] = useState(0);
    const missing = sourceIndex >= sources.length;

    if (missing) {
        return (
            <div className={`flex h-full w-full items-center justify-center ${placeholderClassName}`}>
                <div className="max-w-[18rem] px-5 text-center">
                    <p className="font-tangkiwood text-base text-brand-black sm:text-lg">Espacio reservado</p>
                    <p className="mt-2 break-words font-maiandra text-xs leading-relaxed text-brand-black/55">
                        Sube <span className="font-cocon text-brand-black">{placeholderLabel}</span>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <img
            src={sources[sourceIndex]}
            alt={alt}
            className={className}
            loading={loading}
            decoding="async"
            fetchPriority={fetchPriority}
            onError={() => setSourceIndex((index) => index + 1)}
        />
    );
}

const serviceMenu: Array<{ icon: LucideIcon; label: string; color: string; href: string }> = [
    { icon: Bike, label: 'Alquiler', color: '#FFD200', href: '/rentals' },
    { icon: Store, label: 'Tienda', color: '#FA0E95', href: '/shop' },
    { icon: Route, label: 'Ciclotours', color: '#62B851', href: '/routes' },
    { icon: Wrench, label: 'Mecánica', color: '#9A653C', href: '/service' },
    { icon: UsersRound, label: 'Comunidad', color: '#24A9C5', href: '/community' },
];

const experiences: Array<{
    title: string;
    subtitle: string;
    image: string;
    file: string;
    icon: LucideIcon;
    color: string;
    href: string;
}> = [
    {
        title: 'Ciclotours',
        subtitle: 'Aventura y naturaleza',
        image: `${assetBase}/card-ciclotours.webp`,
        file: 'card-ciclotours.webp',
        icon: Bike,
        color: '#FFD200',
        href: '/routes',
    },
    {
        title: 'En familia',
        subtitle: 'Diversión para todos',
        image: `${assetBase}/card-familia.webp`,
        file: 'card-familia.webp',
        icon: HeartHandshake,
        color: '#62B851',
        href: '/routes',
    },
    {
        title: 'Paseos urbanos',
        subtitle: 'Descubre la ciudad',
        image: `${assetBase}/card-urbanos.webp`,
        file: 'card-urbanos.webp',
        icon: UsersRound,
        color: '#FD7B2C',
        href: '/routes',
    },
    {
        title: 'Para todos',
        subtitle: 'Sin límites de edad',
        image: `${assetBase}/card-todos.webp`,
        file: 'card-todos.webp',
        icon: ShieldCheck,
        color: '#247EBC',
        href: '/rentals',
    },
];

const stats = [
    { icon: Bike, value: '+1,500', label: 'Bicicletas disponibles', color: '#FFD200' },
    { icon: MapPinned, value: '25+', label: 'Rutas increíbles', color: '#67B852' },
    { icon: UsersRound, value: '10K+', label: 'Personas felices', color: '#FD7B2C' },
    { icon: ShieldCheck, value: '100%', label: 'Seguridad garantizada', color: '#247EBC' },
];

const fadeUp = {
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: 0.55, ease: 'easeOut' as const },
};

function LeafStem({ className = '' }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 90 170" fill="none" aria-hidden="true">
            <path d="M42 164C30 113 36 62 68 8" stroke="#D8BE3C" strokeWidth="2" strokeLinecap="round" />
            {[18, 36, 58, 82, 108, 132].map((y, index) => (
                <path
                    key={y}
                    d={index % 2 ? `M43 ${y + 18}C24 ${y + 9} 18 ${y - 2} 22 ${y - 14}` : `M48 ${y + 12}C66 ${y + 5} 74 ${y - 8} 72 ${y - 18}`}
                    stroke="#D8BE3C"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                />
            ))}
        </svg>
    );
}

const heroParticles = [
    { left: '7%', top: '18%', size: 10, color: '#FFD200', delay: 0, duration: 6.5 },
    { left: '14%', top: '58%', size: 7, color: '#24A9C5', delay: 0.9, duration: 7.8 },
    { left: '23%', top: '28%', size: 6, color: '#FA0E95', delay: 1.3, duration: 6.9 },
    { left: '35%', top: '72%', size: 9, color: '#67B852', delay: 0.4, duration: 8.2 },
    { left: '48%', top: '16%', size: 12, color: '#FFD200', delay: 1.8, duration: 7.4 },
    { left: '62%', top: '78%', size: 7, color: '#FD7B2C', delay: 0.7, duration: 6.8 },
    { left: '72%', top: '21%', size: 8, color: '#24A9C5', delay: 1.1, duration: 8.1 },
    { left: '84%', top: '55%', size: 11, color: '#FFD200', delay: 0.2, duration: 7.2 },
    { left: '92%', top: '32%', size: 6, color: '#FA0E95', delay: 1.6, duration: 6.4 },
    { left: '54%', top: '44%', size: 5, color: '#67B852', delay: 2.1, duration: 7.6 },
];

function HeroParticles() {
    return (
        <div className="pointer-events-none absolute inset-0 -z-[1] overflow-hidden" aria-hidden="true">
            {heroParticles.map((particle) => (
                <motion.span
                    key={`${particle.left}-${particle.top}`}
                    className="absolute rounded-full blur-[0.5px]"
                    style={{
                        left: particle.left,
                        top: particle.top,
                        width: particle.size,
                        height: particle.size,
                        backgroundColor: particle.color,
                        boxShadow: `0 0 ${particle.size * 2.8}px ${particle.color}`,
                    }}
                    initial={{ opacity: 0, scale: 0.4, x: 0, y: 0 }}
                    animate={{
                        opacity: [0.18, 0.82, 0.28],
                        scale: [0.7, 1.35, 0.9],
                        x: [0, particle.size * 1.8, particle.size * -1.2, 0],
                        y: [0, particle.size * -2.2, particle.size * 1.1, 0],
                    }}
                    transition={{
                        duration: particle.duration,
                        delay: particle.delay,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            ))}
            <motion.svg
                className="absolute left-[-8%] top-[38%] h-44 w-[42rem] max-w-none text-brand-yellow/45 sm:left-[2%] sm:top-[46%]"
                viewBox="0 0 680 170"
                fill="none"
                initial={{ opacity: 0, pathLength: 0 }}
                animate={{ opacity: 1, pathLength: 1 }}
                transition={{ duration: 1.3, delay: 0.6, ease: 'easeOut' }}
            >
                <motion.path
                    d="M8 128C98 55 166 154 258 86C344 22 408 143 506 78C566 38 612 45 674 22"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeDasharray="9 10"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.8, delay: 0.35, ease: 'easeOut' }}
                />
            </motion.svg>
        </div>
    );
}

function HeroCollage({ variant }: { variant: 'mobile' | 'desktop' }) {
    const isMobile = variant === 'mobile';

    return (
        <EditableLayer
            id="heroCollage"
            className={
                isMobile
                    ? 'relative mx-auto mt-6 mb-6 block w-[98vw] max-w-[550px] px-2 lg:hidden'
                    : 'relative mx-auto hidden w-full max-w-none lg:ml-[-4.5rem] lg:mr-[-6rem] lg:mt-[-1rem] lg:block'
            }
        >
        <motion.div
            initial={{ opacity: 0, scale: 0.96, x: isMobile ? 0 : 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.85, delay: 0.08, ease: 'easeOut' }}
        >
            <motion.div
                className="absolute left-[20%] top-[-6%] h-28 w-28 rounded-full border-2 border-brand-yellow/35 opacity-80 sm:h-48 sm:w-48"
                animate={{ rotate: 360, scale: [1, 1.06, 1] }}
                transition={{ rotate: { duration: 22, repeat: Infinity, ease: 'linear' }, scale: { duration: 5, repeat: Infinity, ease: 'easeInOut' } }}
            />
            <div className="absolute left-[25%] top-[-2%] h-20 w-20 rounded-full bg-brand-yellow/35 blur-2xl sm:h-32 sm:w-32" />
            <svg className="absolute left-[4%] top-[2%] hidden h-44 w-36 text-[#C69F08]/45 sm:block" viewBox="0 0 120 160" fill="none" aria-hidden="true">
                <path d="M58 154C43 104 47 55 84 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M60 88C30 77 18 58 23 35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M66 69C89 61 101 43 102 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <motion.div
                whileHover={{ scale: 1.025, y: -5, rotate: 0.25 }}
                animate={{ y: [0, -10, 0], rotate: [0.35, -0.25, 0.35] }}
                transition={{
                    y: { duration: 6.2, repeat: Infinity, ease: 'easeInOut' },
                    rotate: { duration: 6.2, repeat: Infinity, ease: 'easeInOut' },
                    scale: { duration: 0.25 },
                }}
                className={isMobile ? 'relative mx-auto w-full' : 'relative ml-auto w-[min(74vw,1040px)] xl:w-[min(72vw,1120px)]'}
            >
                <SmartImage
                    src={`${assetBase}/hero-collage-principal.webp?v=3`}
                    fallbackSrcs={[`/menu-principal-celular/hero-collage-principal.webp?v=3`]}
                    alt="Collage principal de bicicletas y experiencias Briz"
                    placeholderLabel="hero-collage-principal.webp"
                    loading="eager"
                    fetchPriority="high"
                    className="block h-auto w-full object-contain drop-shadow-[0_30px_40px_rgba(82,57,0,0.22)]"
                    placeholderClassName="aspect-[1.25/1] rounded-[2.4rem] bg-[linear-gradient(135deg,#FFF4B8,#FFFDF3_48%,#DFF3EF)] shadow-[0_28px_70px_rgba(106,74,0,0.16)]"
                />
                <motion.span
                    className="absolute bottom-[5%] left-[18%] -z-10 h-[34%] w-[70%] rounded-full bg-brand-yellow/35 blur-3xl"
                    animate={{ scale: [0.9, 1.08, 0.9], opacity: [0.32, 0.64, 0.32] }}
                    transition={{ duration: 5.8, repeat: Infinity, ease: 'easeInOut' }}
                    aria-hidden="true"
                />
            </motion.div>
            <motion.div
                animate={{ y: [0, -9, 0], rotate: [0, -6, 0] }}
                transition={{ duration: 4.4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute bottom-[8%] left-[4%] hidden sm:grid h-12 w-12 place-items-center rounded-full bg-brand-yellow text-white shadow-[0_12px_26px_rgba(135,97,0,0.2)] ring-4 ring-white sm:h-14 sm:w-14"
            >
                <Bike className="h-6 w-6 sm:h-7 sm:w-7" />
            </motion.div>
            <motion.div
                animate={{ y: [0, 8, 0], rotate: [0, 8, 0] }}
                transition={{ duration: 4.9, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                className="absolute right-[5%] top-[14%] hidden sm:grid h-11 w-11 place-items-center rounded-full bg-[#67B852] text-white shadow-[0_12px_24px_rgba(39,104,28,0.2)] ring-4 ring-white sm:h-12 sm:w-12"
            >
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
            </motion.div>
        </motion.div>
        </EditableLayer>
    );
}

function HeroSection() {
    return (
        <section className="relative isolate overflow-hidden bg-[#FFF8DF] pt-[86px] lg:pt-[104px]">
            <SmartImage
                src={`${assetBase}/fondo-textura.webp`}
                alt=""
                placeholderLabel="fondo-textura.webp"
                className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover opacity-[0.13] mix-blend-multiply"
                placeholderClassName="hidden"
            />
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_24%_20%,rgba(255,210,0,0.18),transparent_30%),radial-gradient(circle_at_82%_36%,rgba(36,169,197,0.12),transparent_28%),linear-gradient(180deg,#FFF9E8_0%,#FFFDF3_100%)]" />
            <HeroParticles />
            <LeafStem className="pointer-events-none absolute left-2 top-[34rem] hidden h-36 w-20 text-brand-yellow/50 lg:block" />
            <LeafStem className="pointer-events-none absolute right-2 top-40 hidden h-44 w-24 scale-x-[-1] text-brand-yellow/50 lg:block" />

            <div className="mx-auto max-w-[1400px] px-4 pb-8 sm:px-6 lg:px-10">
                <div className="grid min-h-[690px] items-center gap-0 py-7 sm:gap-7 lg:grid-cols-[0.42fr_0.58fr] lg:gap-0 lg:py-8">
                    <motion.div
                        initial={{ opacity: 0, x: -26 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                        className="relative z-10 mx-auto flex w-full max-w-[560px] flex-col items-center text-center lg:mx-0 lg:max-w-[680px] lg:items-start lg:text-left"
                    >
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/68 px-4 py-2 font-maiandra text-xs uppercase tracking-[0.04em] text-[#9A7B00] shadow-[0_10px_30px_rgba(143,104,0,0.08)] ring-1 ring-brand-yellow/25">
                            <Bike className="h-4 w-4 text-brand-yellow" strokeWidth={2.3} />
                            Centro de la bicicleta
                        </div>

                        <EditableLayer id="heroLettering" className="relative mt-4 w-[min(100%,25.5rem)] sm:mt-5 lg:ml-[-1.5rem] lg:w-[32.25rem]">
                            <motion.div
                                initial={{ opacity: 0, y: 18, rotate: -1.2, scale: 0.92 }}
                                animate={{
                                    opacity: 1,
                                    y: [0, -7, 0],
                                    rotate: [-0.7, 0.45, -0.7],
                                    scale: 1,
                                }}
                                transition={{
                                    opacity: { duration: 0.5, delay: 0.15 },
                                    scale: { duration: 0.7, delay: 0.15, ease: 'easeOut' },
                                    y: { duration: 5.2, repeat: Infinity, ease: 'easeInOut' },
                                    rotate: { duration: 5.2, repeat: Infinity, ease: 'easeInOut' },
                                }}
                            >
                                <SmartImage
                                    src={`${assetBase}/lettering-una-bicicleta.webp?v=3`}
                                    fallbackSrcs={[`/menu-principal-celular/lettering-una-bicicleta.webp?v=3`]}
                                    alt="Una bicicleta. Un ciclo de expresiones infinitas."
                                    placeholderLabel="lettering-una-bicicleta.webp"
                                    loading="eager"
                                    fetchPriority="high"
                                    className="block h-auto w-full object-contain drop-shadow-[0_18px_24px_rgba(55,35,0,0.18)]"
                                    placeholderClassName="aspect-[1.35/1] rounded-[1.6rem] border border-dashed border-brand-yellow/60 bg-[#FFF6CC]/70"
                                />
                                <motion.span
                                    className="absolute left-[8%] top-[8%] -z-10 h-[64%] w-[72%] rounded-full bg-brand-yellow/24 blur-3xl"
                                    animate={{ scale: [0.92, 1.08, 0.92], opacity: [0.38, 0.68, 0.38] }}
                                    transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
                                    aria-hidden="true"
                                />
                            </motion.div>
                        </EditableLayer>

                        <HeroCollage variant="mobile" />

                        <p className="mt-6 max-w-[25rem] font-cocon text-lg leading-relaxed text-brand-black/72 sm:mt-6 sm:text-xl lg:mt-6 lg:max-w-[33rem] lg:text-2xl">
                            Alquila, recorre y vive experiencias únicas sobre dos ruedas.
                        </p>

                        <EditableLayer id="heroButtons" className="mt-5 flex w-full max-w-[34rem] flex-col sm:flex-row gap-3 sm:mt-7 lg:max-w-[42rem] lg:justify-start lg:gap-4">
                            <HomeButton to="/rentals" icon={Bike} variant="yellow">
                                Alquilar bicicleta
                            </HomeButton>
                            <HomeButton to="/routes" icon={Map} variant="white">
                                Explorar rutas
                            </HomeButton>
                        </EditableLayer>

                        <div className="mt-6 hidden items-center gap-3 sm:flex">
                            <div className="flex -space-x-2">
                                {['#FFD200', '#67B852', '#247EBC', '#FD7B2C'].map((color, index) => (
                                    <span
                                        key={color}
                                        className="grid h-9 w-9 place-items-center rounded-full border-2 border-white font-maiandra text-[10px] font-bold text-white shadow-sm"
                                        style={{ backgroundColor: color }}
                                    >
                                        {index + 1}
                                    </span>
                                ))}
                            </div>
                            <div>
                                <div className="flex gap-0.5">
                                    {Array.from({ length: 5 }).map((_, index) => (
                                        <Star key={index} className="h-3.5 w-3.5 fill-brand-yellow text-brand-yellow" strokeWidth={0} />
                                    ))}
                                </div>
                                <p className="font-maiandra text-xs text-brand-black/55">+1,250 aventureros felices</p>
                            </div>
                        </div>
                    </motion.div>

                    <HeroCollage variant="desktop" />
                </div>
            </div>
        </section>
    );
}

function HomeButton({
    to,
    icon: Icon,
    variant,
    children,
}: {
    to: string;
    icon: ComponentType<{ className?: string; strokeWidth?: number }>;
    variant: 'yellow' | 'white';
    children: string;
}) {
    const classes =
        variant === 'yellow'
            ? 'bg-brand-yellow text-brand-black shadow-[0_12px_24px_rgba(125,91,0,0.18)]'
            : 'bg-white/90 text-brand-black shadow-[0_12px_24px_rgba(0,0,0,0.08)] ring-1 ring-brand-yellow/20';

    return (
        <Link
            to={to}
            className={`group inline-flex min-h-[3.25rem] w-full sm:w-auto sm:flex-1 items-center justify-center gap-2 rounded-full px-3 font-cocon text-xs font-bold transition duration-200 hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-[0_16px_28px_rgba(84,60,0,0.18)] sm:min-h-14 sm:gap-3 sm:px-6 sm:text-sm lg:min-h-16 lg:px-8 lg:text-base ${classes}`}
        >
            <Icon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" strokeWidth={2.2} />
            <span>{children}</span>
            <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1 lg:h-5 lg:w-5" strokeWidth={2.6} />
        </Link>
    );
}

function ServiceStrip() {
    return (
        <section className="relative isolate overflow-hidden bg-[#FFFDF3] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_78%_18%,rgba(255,210,0,0.16),transparent_28%),radial-gradient(circle_at_16%_75%,rgba(36,169,197,0.08),transparent_22%)]" />
            <div className="mx-auto grid max-w-[1400px] items-center gap-2 lg:grid-cols-[0.31fr_0.69fr] lg:gap-0">
                <motion.div
                    {...fadeUp}
                    className="relative z-10 mx-auto w-full max-w-[26rem] py-3 text-left lg:mx-0 lg:py-10"
                >
                    <EditableLayer id="servicesTitle" className="mb-5 flex items-center gap-3 sm:mb-7">
                        <span className="font-tan text-3xl leading-none text-brand-yellow drop-shadow-[2px_2px_0_rgba(255,255,255,0.9)] sm:text-4xl">&gt;&gt;</span>
                        <h2 className="font-tan text-xl uppercase leading-[1.35] text-[#15243A] drop-shadow-[2px_2px_0_rgba(255,255,255,0.95)] sm:text-2xl lg:text-3xl">
                            Nuestros servicios:
                        </h2>
                    </EditableLayer>

                    <div className="grid gap-3 sm:gap-4">
                        {serviceMenu.map((service, index) => {
                            const Icon = service.icon;
                            return (
                                <motion.div
                                    key={service.label}
                                    initial={{ opacity: 0, x: -22 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true, amount: 0.35 }}
                                    transition={{ delay: index * 0.08, duration: 0.45, ease: 'easeOut' }}
                                >
                                    <Link
                                        to={service.href}
                                        className="group flex w-full items-center gap-4 rounded-[1.4rem] px-2 py-1.5 transition duration-200 hover:-translate-y-0.5 hover:bg-white/58 hover:shadow-[0_14px_28px_rgba(86,61,0,0.08)] sm:gap-5"
                                    >
                                        <span
                                            className="grid h-14 w-14 shrink-0 place-items-center rounded-full text-white shadow-[0_10px_20px_rgba(60,38,0,0.12)] ring-4 ring-white transition duration-200 group-hover:scale-110 sm:h-16 sm:w-16"
                                            style={{ backgroundColor: service.color }}
                                        >
                                            <Icon className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={2} />
                                        </span>
                                        <span
                                            className="font-tangkiwood text-3xl leading-none drop-shadow-[2px_2px_0_rgba(255,255,255,0.95)] transition duration-200 group-hover:translate-x-1 sm:text-4xl"
                                            style={{ color: service.color }}
                                        >
                                            {service.label}
                                        </span>
                                        <ArrowRight className="ml-auto h-5 w-5 text-brand-black/35 opacity-0 transition duration-200 group-hover:translate-x-1 group-hover:opacity-100" />
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>

                <EditableLayer
                    id="servicesImage"
                    className="relative mx-auto mt-6 mb-0 block w-[108vw] max-w-[108vw] -ml-[4vw] sm:w-full sm:max-w-[32rem] sm:ml-0 px-2 lg:ml-[-5rem] lg:mr-[-5rem] lg:mt-0 lg:w-[min(78vw,1080px)] lg:max-w-none"
                >
                <motion.div
                    initial={{ opacity: 0, x: 34, scale: 0.96 }}
                    whileInView={{ opacity: 1, x: 0, scale: 1 }}
                    viewport={{ once: true, amount: 0.25 }}
                    transition={{ duration: 0.75, ease: 'easeOut' }}
                >
                    <motion.div
                        animate={{ y: [0, -9, 0], rotate: [0.2, -0.25, 0.2] }}
                        transition={{ duration: 6.4, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <SmartImage
                            src={`${assetBase}/web2.webp`}
                            fallbackSrcs={[`${assetBase}/Web2.webp`]}
                            alt="Vive la experiencia Briz en Cochabamba"
                            placeholderLabel="web2.webp"
                            loading="lazy"
                            className="block h-auto w-full object-contain drop-shadow-[0_30px_42px_rgba(82,57,0,0.2)]"
                            placeholderClassName="aspect-[1.25/1] rounded-[2.4rem] bg-[linear-gradient(135deg,#FFF4B8,#FFFDF3_48%,#DFF3EF)] shadow-[0_28px_70px_rgba(106,74,0,0.16)]"
                        />
                    </motion.div>
                    <RouteLine className="pointer-events-none absolute left-[-18%] top-[18%] hidden h-40 w-80 rotate-90 text-brand-yellow/50 sm:block" />
                    <motion.span
                        className="absolute bottom-[7%] left-[20%] -z-10 h-[28%] w-[68%] rounded-full bg-brand-yellow/30 blur-3xl"
                        animate={{ opacity: [0.35, 0.7, 0.35], scale: [0.92, 1.08, 0.92] }}
                        transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
                    />
                </motion.div>
                </EditableLayer>
            </div>
        </section>
    );
}

function WheelWatermark({ className = '' }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 260 260" fill="none" aria-hidden="true">
            <circle cx="130" cy="130" r="116" stroke="currentColor" strokeWidth="7" opacity="0.7" />
            <circle cx="130" cy="130" r="18" stroke="currentColor" strokeWidth="6" opacity="0.8" />
            {Array.from({ length: 24 }).map((_, index) => {
                const angle = (index * Math.PI * 2) / 24;
                const x = 130 + Math.cos(angle) * 112;
                const y = 130 + Math.sin(angle) * 112;
                return <line key={index} x1="130" y1="130" x2={x} y2={y} stroke="currentColor" strokeWidth="2" opacity="0.58" />;
            })}
            <circle cx="130" cy="130" r="92" stroke="currentColor" strokeWidth="2" strokeDasharray="8 8" opacity="0.45" />
        </svg>
    );
}

function OptionalSticker({
    src,
    alt,
    className = '',
}: {
    src: string;
    alt: string;
    className?: string;
}) {
    const [hidden, setHidden] = useState(false);

    if (hidden) {
        return <span className={className} aria-hidden="true" />;
    }

    return (
        <img
            src={src}
            alt={alt}
            className={className}
            loading="lazy"
            decoding="async"
            onError={() => setHidden(true)}
        />
    );
}

function WhyChooseBrizSection() {
    return (
        <section className="relative isolate overflow-hidden scroll-mt-28 bg-[#50C879] pt-24 sm:pt-28 lg:pt-[112px]">
            <div className="absolute inset-y-0 right-0 -z-10 hidden w-[54%] rounded-l-[48%] border-y-2 border-l-2 border-white/80 bg-[#A45D33] lg:block" />

            <WheelWatermark className="pointer-events-none absolute -bottom-20 left-[-9rem] h-[30rem] w-[30rem] text-white/17 sm:left-[4%] lg:bottom-[-8rem] lg:left-[10%] lg:h-[34rem] lg:w-[34rem]" />
            <WheelWatermark className="pointer-events-none absolute right-[-5rem] top-24 hidden h-[34rem] w-[34rem] text-white/14 lg:block" />
            <div className="pointer-events-none absolute right-0 top-0 hidden h-72 w-72 rotate-12 border-[18px] border-white/8 lg:block" aria-hidden="true" />

            {/* Ambient floating particles */}
            <div className="pointer-events-none absolute inset-0 -z-[1] overflow-hidden" aria-hidden="true">
                {[
                    { left: '8%', top: '15%', size: 10, color: '#FFD200', duration: 6.2 },
                    { left: '88%', top: '72%', size: 9, color: '#FFD200', duration: 7.5 },
                    { left: '22%', top: '55%', size: 8, color: '#FFFFFF', duration: 6.8 },
                    { left: '72%', top: '25%', size: 11, color: '#FFFFFF', duration: 8.1 },
                    { left: '46%', top: '82%', size: 7, color: '#FA0E95', duration: 7.0 },
                    { left: '82%', top: '42%', size: 10, color: '#FA0E95', duration: 6.4 },
                ].map((particle, idx) => (
                    <motion.span
                        key={idx}
                        className="absolute rounded-full"
                        style={{
                            left: particle.left,
                            top: particle.top,
                            width: particle.size,
                            height: particle.size,
                            backgroundColor: particle.color,
                            boxShadow: `0 0 ${particle.size * 2.8}px ${particle.color}`,
                        }}
                        animate={{
                            y: [0, -15, 0],
                            scale: [0.8, 1.25, 0.8],
                            opacity: [0.25, 0.8, 0.25],
                        }}
                        transition={{
                            duration: particle.duration,
                            repeat: Infinity,
                            ease: 'easeInOut',
                            delay: idx * 0.45,
                        }}
                    />
                ))}
            </div>

            <div className="mx-auto grid max-w-[1500px] gap-8 px-5 pb-12 sm:px-8 lg:min-h-[740px] lg:grid-cols-2 lg:gap-0 lg:px-12 lg:pb-14">
                <motion.div
                    initial={{ opacity: 0, x: -26 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.25 }}
                    transition={{ duration: 0.65, ease: 'easeOut' }}
                    className="relative z-10 w-full min-w-0 lg:max-w-[760px]"
                >
                    <motion.div
                        animate={{ y: [0, -5, 0], rotate: [-3, -1, -3] }}
                        transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
                        className="pointer-events-none absolute left-[11%] top-0 hidden sm:block h-20 w-[22rem] sm:h-28 sm:w-[32rem] z-20"
                    >
                        <OptionalSticker
                            src={`${assetBase}/sticker-porque-tape.webp`}
                            alt=""
                            className="w-full h-full object-contain"
                        />
                    </motion.div>
                    <motion.div
                        animate={{ y: [0, 6, 0], rotate: [-12, -9, -12] }}
                        transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                        className="pointer-events-none absolute left-[-2rem] top-[17rem] hidden sm:block h-28 w-36 sm:top-[24rem] z-20"
                    >
                        <OptionalSticker
                            src={`${assetBase}/sticker-splash-rojo.webp`}
                            alt=""
                            className="w-full h-full object-contain"
                        />
                    </motion.div>
                    <motion.div
                        animate={{ y: [0, -7, 0], rotate: [12, 15, 12] }}
                        transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
                        className="pointer-events-none absolute right-[4%] top-[9rem] hidden sm:block h-24 w-28 sm:top-[12rem] sm:h-32 sm:w-36 z-20"
                    >
                        <OptionalSticker
                            src={`${assetBase}/sticker-splash-amarillo.webp`}
                            alt=""
                            className="w-full h-full object-contain"
                        />
                    </motion.div>

                    <EditableLayer id="whyTitle" className="relative mx-auto w-full max-w-[43rem] lg:mx-0">
                        <span className="absolute left-[9%] top-[3%] -z-10 h-[18%] w-[67%] rotate-[-3deg] rounded-sm bg-brand-yellow shadow-[0_7px_0_rgba(0,0,0,0.04)]" />
                        <span className="absolute left-[3%] top-[-5%] -z-10 h-[15%] w-[35%] rotate-[-8deg] rounded-[70%_42%_66%_46%] bg-[#75DFA2]/70" />
                        <h2 className="font-tan uppercase leading-[0.98] tracking-normal text-center lg:text-left">
                            <span 
                                className="block lg:whitespace-nowrap text-3xl sm:text-5xl lg:text-[4.75rem] xl:text-[5.15rem] text-white [-webkit-text-stroke:2px_#203253] text-center lg:text-left"
                                style={{ textShadow: '5px 5px 0px rgba(32,50,83,0.2)' }}
                            >
                                ¿Por qué
                            </span>
                            <span 
                                className="ml-0 lg:ml-[18%] mt-3 block lg:whitespace-nowrap text-4xl sm:text-6xl lg:text-[5.05rem] xl:text-[5.45rem] text-[#8E0909] [-webkit-text-stroke:3px_#ffffff] text-center lg:text-left"
                                style={{ textShadow: '5px 6px 0px rgba(0,0,0,0.18)' }}
                            >
                                elegir
                            </span>
                            <span 
                                className="ml-0 lg:ml-[14%] mt-3 block lg:whitespace-nowrap text-4xl sm:text-6xl lg:text-[4.8rem] xl:text-[5.2rem] text-brand-yellow [-webkit-text-stroke:2px_#203253] text-center lg:text-left"
                                style={{ textShadow: '5px 6px 0px rgba(32,50,83,0.22)' }}
                            >
                                Briz?
                            </span>
                        </h2>
                    </EditableLayer>

                    <EditableLayer id="whyLeftText" className="relative z-10 mt-9 w-full max-w-[50rem] sm:mt-12 lg:mt-8 mx-auto lg:mx-0">
                        <p 
                            className="font-cocon text-[1.1rem] leading-[1.48] text-[#101010] sm:text-[1.55rem] lg:text-[1.42rem] xl:text-[1.52rem] text-center lg:text-left"
                            style={{ textShadow: '1px 1px 0px rgba(255,255,255,0.24)' }}
                        >
                            Porque somos una iniciativa que hace que una bicicleta pueda hacer mucho más que llevarte de un punto a otro.
                            <span 
                                className="font-gochi text-[1.28rem] text-white sm:text-[1.9rem]"
                                style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.16)' }}
                            >
                                 Puede sanar cuerpos, aliviar emociones, cuidar el planeta y activar economías locales.
                            </span>
                            {' '}Pero también pueda contar historias, conservar memorias, unir comunidades y revelar el alma de una ciudad.
                        </p>
                    </EditableLayer>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 26 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.25 }}
                    transition={{ duration: 0.65, ease: 'easeOut' }}
                    className="relative z-10 flex min-h-0 w-full flex-col items-center justify-start pt-16 pb-16 px-6 text-center mt-12 lg:bg-transparent lg:rounded-none lg:border-t-0 lg:mt-0 lg:w-auto lg:px-0 lg:py-0 lg:min-h-0 lg:justify-start lg:pt-40"
                >
                    {/* Mobile organic dome background */}
                    <div className="pointer-events-none absolute inset-x-[-1.25rem] sm:inset-x-[-2rem] lg:hidden bottom-0 top-0 -z-10 rounded-t-[50vw] border-t-2 border-white/80 bg-[#A45D33]" />
                    <motion.div
                        animate={{ y: [0, -6, 0], rotate: [-2, 2, -2] }}
                        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                        className="pointer-events-none absolute left-[5%] top-[10%] hidden sm:block h-36 w-40 sm:h-44 sm:w-52 lg:left-[2%] lg:top-[14%] z-20"
                    >
                        <OptionalSticker
                            src={`${assetBase}/sticker-proposito-bici.webp`}
                            alt=""
                            className="w-full h-full object-contain"
                        />
                    </motion.div>
                    <motion.div
                        animate={{ scale: [1, 1.05, 1], y: [0, -3, 0] }}
                        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
                        className="pointer-events-none absolute left-1/2 top-[39%] hidden sm:block h-28 w-44 -translate-x-1/2 sm:h-36 sm:w-56 lg:top-[37%] z-20"
                    >
                        <OptionalSticker
                            src={`${assetBase}/sticker-manos-corazon.webp`}
                            alt=""
                            className="w-full h-full object-contain"
                        />
                    </motion.div>

                    <EditableLayer id="purposeTitle" className="mt-10 lg:mt-0 mx-auto lg:mx-0 text-center lg:text-left">
                        <h3 
                            className="rotate-[4deg] lg:rotate-[7deg] font-tan text-2xl sm:text-4xl lg:text-[4.35rem] xl:text-[4.9rem] uppercase leading-none text-transparent [-webkit-text-stroke:2px_#FFD200] lg:translate-x-8 text-center lg:text-left"
                            style={{ textShadow: '3px 3px 0px rgba(0,0,0,0.12)' }}
                        >
                            Propósito
                        </h3>
                    </EditableLayer>

                    <div className="hidden sm:block mt-24 h-24 w-44 sm:mt-28 sm:h-32 sm:w-56 lg:mt-28" aria-hidden="true" />

                    <EditableLayer id="purposeText" className="max-w-[37rem] mx-auto lg:mx-0">
                        <p 
                            className="font-cocon text-[1.06rem] font-bold leading-[1.2] text-white sm:text-[1.55rem] lg:text-[1.36rem] xl:text-[1.48rem] text-center lg:text-left"
                            style={{ textShadow: '3px 3px 0px #173C45' }}
                        >
                            <span className="text-brand-cyan">Nuestro propósito es hacer de la bicicleta una herramienta de bienestar integral,</span>
                            {' '}desde una visión holística que reconecta lo físico con lo emocional, lo ambiental con lo cultural, y lo cotidiano con lo extraordinario,
                            <span className="block pt-2 font-gochi text-[1.25rem] text-brand-cyan sm:text-[1.9rem]">a través de nuestras unidades de negocios.</span>
                        </p>
                    </EditableLayer>
                </motion.div>
            </div>
        </section>
    );
}

function BrandSection() {
    return (
        <section className="relative isolate overflow-hidden bg-[#FFD957] pt-20 lg:pt-24">
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-16 text-[#50C879]" aria-hidden="true">
                <svg viewBox="0 0 1440 90" className="h-full w-full" preserveAspectRatio="none">
                    <path d="M0 0H1440V34C1194 84 946 12 717 42C471 74 239 94 0 38V0Z" fill="currentColor" />
                    <path d="M0 40C239 94 471 74 717 42C946 12 1194 84 1440 34" fill="none" stroke="#FFFDF3" strokeWidth="5" strokeLinecap="round" />
                </svg>
            </div>

            <div className="absolute inset-y-0 right-0 -z-10 hidden w-[54%] rounded-l-[46%] border-y-2 border-l-2 border-white/80 bg-[#06465A] lg:block" />

            <WheelWatermark className="pointer-events-none absolute -bottom-16 left-[-8rem] h-[30rem] w-[30rem] text-white/22 sm:left-[6%] lg:bottom-[-6rem] lg:left-[11%] lg:h-[34rem] lg:w-[34rem]" />
            <WheelWatermark className="pointer-events-none absolute right-[-4rem] top-20 hidden h-[34rem] w-[34rem] text-white/13 lg:block" />
            <div className="pointer-events-none absolute left-[10%] top-20 h-16 w-48 rotate-[-6deg] rounded-[60%_44%_72%_48%] bg-white/15" aria-hidden="true" />

            {/* Ambient floating particles */}
            <div className="pointer-events-none absolute inset-0 -z-[1] overflow-hidden" aria-hidden="true">
                {[
                    { left: '12%', top: '28%', size: 10, color: '#24A9C5', duration: 6.5 },
                    { left: '78%', top: '75%', size: 9, color: '#24A9C5', duration: 7.8 },
                    { left: '26%', top: '68%', size: 8, color: '#FD7B2C', duration: 7.2 },
                    { left: '88%', top: '22%', size: 11, color: '#FD7B2C', duration: 8.4 },
                    { left: '42%', top: '15%', size: 7, color: '#FFFFFF', duration: 6.9 },
                    { left: '68%', top: '52%', size: 10, color: '#FFFFFF', duration: 7.6 },
                ].map((particle, idx) => (
                    <motion.span
                        key={idx}
                        className="absolute rounded-full"
                        style={{
                            left: particle.left,
                            top: particle.top,
                            width: particle.size,
                            height: particle.size,
                            backgroundColor: particle.color,
                            boxShadow: `0 0 ${particle.size * 2.8}px ${particle.color}`,
                        }}
                        animate={{
                            y: [0, -15, 0],
                            scale: [0.8, 1.25, 0.8],
                            opacity: [0.25, 0.8, 0.25],
                        }}
                        transition={{
                            duration: particle.duration,
                            repeat: Infinity,
                            ease: 'easeInOut',
                            delay: idx * 0.45,
                        }}
                    />
                ))}
            </div>

            <div className="mx-auto grid max-w-[1500px] gap-8 px-5 pb-14 sm:px-8 lg:min-h-[740px] lg:grid-cols-2 lg:gap-0 lg:px-12 lg:pb-16">
                <motion.div
                    initial={{ opacity: 0, x: -26 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.25 }}
                    transition={{ duration: 0.65, ease: 'easeOut' }}
                    className="relative z-10 flex min-w-0 flex-col justify-center"
                >
                    <EditableLayer id="brandTitle" className="w-full max-w-[44rem] mx-auto lg:mx-0 text-center lg:text-left">
                        <h2 
                            className="font-tan uppercase leading-none text-transparent [-webkit-text-stroke:2px_#174A35] text-3xl xs:text-4xl sm:text-5xl lg:text-[6rem] xl:text-[6.6rem] text-center lg:text-left"
                            style={{ textShadow: '3px 3px 0px rgba(255,255,255,0.35)' }}
                        >
                            La marca
                        </h2>
                    </EditableLayer>

                    <EditableLayer id="brandLeftText" className="mt-6 w-full max-w-[34rem] lg:mt-14 mx-auto lg:mx-0 text-center lg:text-left px-4 lg:px-0">
                        <p className="font-gochi text-[1.18rem] font-bold leading-[1.24] text-[#0B3D3C] sm:text-[1.75rem] lg:text-[1.62rem] xl:text-[1.78rem] text-center lg:text-left">
                            Briz es un ecosistema de movilidad y bienestar sostenible, donde la bicicleta es el eje central para transformar la salud, la comunidad y la ciudad. A través de un modelo de economía circular y regenerativa, Briz integra servicios innovadores que abarcan desde el alquiler y personalización de bicicletas, ciclotours temáticos y programas de salud, actualmente.
                        </p>
                    </EditableLayer>

                    <EditableLayer id="brandLogo" className="pointer-events-none absolute bottom-[3%] left-[28%] hidden w-[23rem] opacity-80 sm:block lg:w-[28rem]">
                        <motion.div
                            animate={{ y: [0, -5, 0], scale: [1, 1.03, 1] }}
                            transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
                            className="w-full h-full"
                        >
                            <OptionalSticker
                                src="/logo de briz.png"
                                alt="Logo Briz"
                                className="h-auto w-full object-contain brightness-0 invert opacity-90 drop-shadow-[0_18px_28px_rgba(0,0,0,0.08)]"
                            />
                        </motion.div>
                    </EditableLayer>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 26 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.25 }}
                    transition={{ duration: 0.65, ease: 'easeOut' }}
                    className="relative z-10 flex min-h-0 w-full flex-col items-center justify-start pt-16 pb-16 px-6 text-center mt-12 lg:bg-transparent lg:rounded-none lg:border-t-0 lg:mt-0 lg:w-auto lg:px-0 lg:py-0 lg:pt-10"
                >
                    {/* Mobile organic dome background */}
                    <div className="pointer-events-none absolute inset-x-[-1.25rem] sm:inset-x-[-2rem] lg:hidden bottom-0 top-0 -z-10 rounded-t-[50vw] border-t-2 border-white/80 bg-[#06465A]" />
                    <EditableLayer id="brandIllustration" className="relative mb-10 h-56 w-64 sm:h-64 sm:w-80 lg:h-72 lg:w-[25rem] mx-auto lg:mx-0">
                        <motion.div
                            animate={{ y: [0, -6, 0], rotate: [-1, 2, -1] }}
                            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                            className="w-full h-full"
                        >
                            <OptionalSticker
                                src="/menu-principal-web/sticker-marca.webp"
                                alt="Sticker de marca Briz"
                                className="block h-full w-full object-contain drop-shadow-[0_18px_35px_rgba(0,0,0,0.16)]"
                            />
                        </motion.div>
                    </EditableLayer>

                    <EditableLayer id="brandRightText" className="max-w-[36rem] mx-auto lg:mx-0 text-center lg:text-left">
                        <p 
                            className="font-gochi text-[1.16rem] font-bold leading-[1.16] text-white sm:text-[1.75rem] lg:text-[1.7rem] xl:text-[1.88rem] text-center lg:text-left"
                            style={{ textShadow: '3px 3px 0px rgba(0,0,0,0.22)' }}
                        >
                            Implementaremos por etapas soluciones de publicidad creativa, mecánica integral y formación en ingeniería aplicada a la bicicleta. Briz potencia el uso de la bicicleta como herramienta de bienestar integral, contribuyendo a una ciudad más saludable y sostenible.
                        </p>
                    </EditableLayer>

                    <EditableLayer id="brandComingSoon" className="mt-12 lg:mt-16 text-center mx-auto lg:mx-0">
                        <p 
                            className="font-tan text-xl sm:text-3xl lg:text-5xl uppercase leading-none text-transparent [-webkit-text-stroke:2px_#DDE44D] text-center lg:text-left"
                            style={{ textShadow: '3px 3px 0px rgba(0,0,0,0.12)' }}
                        >
                            Próximamente...
                        </p>
                    </EditableLayer>
                </motion.div>
            </div>
        </section>
    );
}

function ExperienceSection() {
    return (
        <section id="experiencias" className="relative overflow-hidden bg-[#FFFDF3] px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
            <div className="mx-auto max-w-[1200px]">
                <motion.div {...fadeUp} className="mb-5 flex items-center justify-between gap-4 sm:mb-7">
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                        <h2 className="shrink-0 font-tan text-2xl text-brand-black sm:text-3xl lg:text-4xl">Elige tu experiencia</h2>
                        <RouteLine className="hidden h-12 flex-1 text-brand-yellow sm:block" />
                    </div>
                    <div className="hidden gap-2 sm:flex">
                        <button className="grid h-11 w-11 place-items-center rounded-full bg-white text-brand-black shadow-sm ring-1 ring-brand-yellow/25 transition hover:bg-brand-yellow" aria-label="Anterior">
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button className="grid h-11 w-11 place-items-center rounded-full bg-brand-yellow text-brand-black shadow-sm transition hover:scale-105" aria-label="Siguiente">
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>
                </motion.div>

                <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
                    {experiences.map((experience, index) => {
                        const Icon = experience.icon;
                        return (
                            <motion.div
                                key={experience.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.25 }}
                                transition={{ delay: index * 0.08, duration: 0.45 }}
                                className="w-[78vw] min-w-[16rem] snap-center sm:w-auto sm:min-w-0"
                            >
                                <Link
                                    to={experience.href}
                                    className="group relative block aspect-[0.82/1] overflow-hidden rounded-[1.55rem] bg-[#F5ECCE] shadow-[0_16px_32px_rgba(74,50,0,0.12)] transition duration-300 hover:-translate-y-1 hover:scale-[1.02]"
                                >
                                    <SmartImage
                                        src={experience.image}
                                        alt={experience.title}
                                        placeholderLabel={experience.file}
                                        className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                        placeholderClassName="absolute inset-0 bg-[linear-gradient(135deg,#FFF4B8,#F6EACB,#DFF3EF)]"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/74 via-black/16 to-transparent" />
                                    <span
                                        className="absolute bottom-[5.2rem] left-4 grid h-12 w-12 place-items-center rounded-full text-white shadow-lg ring-3 ring-white/80"
                                        style={{ backgroundColor: experience.color }}
                                    >
                                        <Icon className="h-6 w-6" strokeWidth={2.1} />
                                    </span>
                                    <div className="absolute inset-x-0 bottom-0 p-4 pr-16">
                                        <h3 className="font-tangkiwood text-2xl leading-none text-white drop-shadow">{experience.title}</h3>
                                        <p className="mt-1 font-cocon text-sm text-white/88">{experience.subtitle}</p>
                                    </div>
                                    <span className="absolute bottom-4 right-4 grid h-11 w-11 place-items-center rounded-full bg-white text-brand-black transition group-hover:bg-brand-yellow">
                                        <ArrowRight className="h-5 w-5" />
                                    </span>
                                </Link>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

function RouteLine({ className = '' }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 620 70" fill="none" aria-hidden="true">
            <motion.path
                d="M4 36C96 21 119 58 190 43C253 30 262 13 324 31C390 50 411 55 478 33C536 14 566 19 616 29"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray="7 9"
                strokeLinecap="round"
                initial={{ pathLength: 0.4, opacity: 0.45 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
            />
            <Bike x="292" y="22" width="26" height="26" />
        </svg>
    );
}

function CommunitySection() {
    return (
        <section className="relative isolate overflow-hidden bg-[#62C5B0] py-20 sm:py-28 lg:py-32 px-4 sm:px-6 lg:px-8">
            {/* Subtle grain texture overlay */}
            <SmartImage
                src={`${assetBase}/fondo-textura.webp`}
                alt=""
                placeholderLabel="fondo-textura.webp"
                className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover opacity-[0.12] mix-blend-multiply"
                placeholderClassName="hidden"
            />
            {/* Organic ambient gradients */}
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(255,210,0,0.18),transparent_25%),radial-gradient(circle_at_80%_80%,rgba(250,14,149,0.12),transparent_30%)]" />
            
            {/* Ambient floating particles */}
            <div className="pointer-events-none absolute inset-0 -z-[1] overflow-hidden" aria-hidden="true">
                {[
                    { left: '15%', top: '20%', size: 10, color: '#FFD200', duration: 6.8 },
                    { left: '85%', top: '78%', size: 9, color: '#FFD200', duration: 7.4 },
                    { left: '28%', top: '72%', size: 8, color: '#FA0E95', duration: 7.1 },
                    { left: '75%', top: '15%', size: 11, color: '#FA0E95', duration: 8.0 },
                    { left: '48%', top: '35%', size: 7, color: '#FFFFFF', duration: 6.5 },
                    { left: '92%', top: '45%', size: 10, color: '#FFFFFF', duration: 7.7 },
                ].map((particle, idx) => (
                    <motion.span
                        key={idx}
                        className="absolute rounded-full"
                        style={{
                            left: particle.left,
                            top: particle.top,
                            width: particle.size,
                            height: particle.size,
                            backgroundColor: particle.color,
                            boxShadow: `0 0 ${particle.size * 2.8}px ${particle.color}`,
                        }}
                        animate={{
                            y: [0, -15, 0],
                            scale: [0.8, 1.25, 0.8],
                            opacity: [0.25, 0.8, 0.25],
                        }}
                        transition={{
                            duration: particle.duration,
                            repeat: Infinity,
                            ease: 'easeInOut',
                            delay: idx * 0.45,
                        }}
                    />
                ))}
            </div>

            <div className="mx-auto grid max-w-[1400px] items-center gap-12 lg:grid-cols-2 lg:gap-16">
                {/* Left Column: Title, Description, Button */}
                <div className="flex flex-col items-center text-center justify-center space-y-6 lg:space-y-8 w-full max-w-[620px] mx-auto z-10 px-4 sm:px-0">
                    <motion.h2
                        initial={{ opacity: 0, y: 24, scale: 0.96 }}
                        whileInView={{ opacity: 1, y: 0, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="font-tan uppercase text-3xl xs:text-4xl sm:text-5xl lg:text-[6.5rem] xl:text-[7.5rem] leading-[1.05]"
                        style={{ WebkitTextStroke: '2px #FFD200', color: '#063D47', textShadow: '4px 4px 0px rgba(6,61,71,0.28)' }}
                    >
                        Comunidad
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.12, ease: 'easeOut' }}
                        className="font-cocon text-lg sm:text-2xl leading-relaxed text-[#063D47] font-bold"
                    >
                        Te invitamos a ser parte de una comunidad que celebra la vida en movimiento, que se enamora de cada pedaleada y que inspira cambio.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.22 }}
                        className="pt-4"
                    >
                        <Link to="/community">
                            <motion.button
                                whileHover={{ scale: 1.06, rotate: -1.5, y: -3 }}
                                whileTap={{ scale: 0.94 }}
                                className="group inline-flex items-center gap-3 px-10 py-5 bg-brand-yellow text-brand-black border-3 border-brand-black rounded-full font-cocon font-black text-base uppercase tracking-wider shadow-[6px_6px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
                            >
                                <span>Ir a comunidad</span>
                                <ArrowRight className="w-5 h-5 shrink-0 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
                            </motion.button>
                        </Link>
                    </motion.div>
                </div>

                {/* Right Column: Polaroid Scrapbook Collage */}
                <div className="relative mx-auto w-full max-w-[480px] lg:max-w-none px-4 sm:px-6 z-10 mt-8 lg:mt-0 flex justify-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.96, rotate: 4 }}
                        whileInView={{ opacity: 1, y: 0, scale: 1, rotate: 2 }}
                        viewport={{ once: true, amount: 0.25 }}
                        transition={{ duration: 0.75, ease: 'easeOut' }}
                        className="relative mx-auto bg-white p-3 pb-10 sm:p-4 sm:pb-14 border-3 border-brand-black shadow-[10px_10px_0_rgba(0,0,0,0.18)] sm:shadow-[16px_16px_0_rgba(0,0,0,0.18)] rounded-sm rotate-[2deg] group w-[70vw] max-w-[280px] sm:w-full sm:max-w-[420px] overflow-visible"
                    >
                        {/* Writable tape tape-sticker effect */}
                        <div className="absolute -top-4 left-1/3 -translate-x-1/2 w-28 h-8 sm:w-36 sm:h-9 bg-[#FFFDF3]/88 border-x-2 border-dashed border-brand-black/20 backdrop-blur-sm shadow-sm rotate-[-6deg] z-20 flex items-center justify-center">
                            <span className="font-maiandra text-[9px] sm:text-[10px] text-brand-black/50 uppercase tracking-widest font-black">Comunidad Briz</span>
                        </div>

                        {/* Interactive Polaroid Image */}
                        <div className="overflow-hidden bg-[#E6F5F2] relative aspect-[1.15/1]">
                            <SmartImage
                                src={`${assetBase}/5.webp`}
                                fallbackSrcs={[`/menu-principal-celular/5.webp`, `${assetBase}/web2.webp`]}
                                alt="Ciclistas en la comunidad Briz"
                                placeholderLabel="5.webp"
                                className="w-full h-full object-cover rounded-sm grayscale-[15%] group-hover:grayscale-0 transition-all duration-500 scale-102 group-hover:scale-105"
                            />
                        </div>

                        {/* Caption in Gochi Hand */}
                        <div className="absolute inset-x-0 bottom-4 text-center">
                            <p className="font-gochi text-lg sm:text-xl text-brand-black/75 rotate-[-1deg] font-bold">
                                #PedalearNosConecta 🌟
                            </p>
                        </div>

                        {/* Sparkle sticker at top-right */}
                        <motion.div
                            animate={{ scale: [1, 1.15, 1], rotate: [0, 90, 180, 270, 360] }}
                            transition={{ scale: { duration: 3.2, repeat: Infinity }, rotate: { duration: 15, repeat: Infinity, ease: "linear" } }}
                            className="absolute -right-1.5 sm:-right-5 -top-1.5 sm:-top-5 w-10 h-10 sm:w-12 sm:h-12 bg-brand-pink border-3 border-brand-black rounded-xl flex items-center justify-center shadow-[4px_4px_0_rgba(0,0,0,1)] z-20 text-white cursor-default"
                            title="Briz Sparkle!"
                        >
                            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
                        </motion.div>

                        {/* Bicycle sticker at bottom-left */}
                        <motion.div
                            animate={{ y: [0, -6, 0], rotate: [3, -3, 3] }}
                            transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute -left-1.5 sm:-left-7 -bottom-4 sm:-bottom-6 w-16 h-16 sm:w-20 sm:h-20 bg-brand-yellow border-3 border-brand-black rounded-full flex items-center justify-center shadow-[5px_5px_0_rgba(0,0,0,1)] z-20"
                        >
                            <img src="/logo_bicicleta_principal.png" alt="Bicicleta Briz Sticker" className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />
                        </motion.div>
                    </motion.div>

                    {/* Gochi Hand emotional message under polaroid */}
                    <div className="mt-6 sm:mt-0 sm:absolute sm:right-6 sm:-bottom-10 rotate-[2deg] sm:rotate-[5deg] z-20 text-center sm:text-left">
                        <motion.p 
                            animate={{ y: [0, -3, 0] }}
                            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                            className="font-gochi text-xl sm:text-2xl text-white font-bold"
                            style={{ textShadow: '2px 2px 0px rgba(6,61,71,0.7)' }}
                        >
                            ¡Pedalear nos hace libres!
                        </motion.p>
                    </div>
                </div>
            </div>
        </section>
    );
}

function FinalInspirationalSection() {
    return (
        <section className="relative isolate overflow-hidden bg-[#0C4E40] py-20 sm:py-28 lg:py-32 px-4 sm:px-6 lg:px-8">
            {/* Subtle paper texture overlay */}
            <SmartImage
                src={`${assetBase}/fondo-textura.webp`}
                alt=""
                placeholderLabel="fondo-textura.webp"
                className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover opacity-[0.11] mix-blend-multiply"
                placeholderClassName="hidden"
            />
            {/* Background routes drawing effect */}
            <div className="pointer-events-none absolute inset-0 -z-10 opacity-30">
                <svg className="absolute left-[5%] top-[10%] w-[38rem] h-44 text-[#FFD200]/40" viewBox="0 0 680 170" fill="none" aria-hidden="true">
                    <motion.path
                        d="M10 80 Q 180 160, 340 90 T 670 120"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeDasharray="9 11"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 2, ease: "easeInOut" }}
                    />
                </svg>
            </div>

            {/* Floating particles/stars in Briz colors */}
            <div className="pointer-events-none absolute inset-0 -z-[1] overflow-hidden" aria-hidden="true">
                {[
                    { left: '12%', top: '22%', size: 12, color: '#FFD200', duration: 6.8 },
                    { left: '44%', top: '78%', size: 9, color: '#FA0E95', duration: 7.2 },
                    { left: '82%', top: '15%', size: 10, color: '#FD7B2C', duration: 8.0 },
                    { left: '90%', top: '65%', size: 8, color: '#FFD200', duration: 6.4 },
                ].map((particle, idx) => (
                    <motion.span
                        key={idx}
                        className="absolute rounded-full"
                        style={{
                            left: particle.left,
                            top: particle.top,
                            width: particle.size,
                            height: particle.size,
                            backgroundColor: particle.color,
                            boxShadow: `0 0 ${particle.size * 2.8}px ${particle.color}`,
                        }}
                        animate={{
                            y: [0, -14, 0],
                            scale: [0.8, 1.2, 0.8],
                            opacity: [0.3, 0.85, 0.3],
                        }}
                        transition={{
                            duration: particle.duration,
                            repeat: Infinity,
                            ease: 'easeInOut',
                            delay: idx * 0.5,
                        }}
                    />
                ))}
            </div>

            <div className="mx-auto grid max-w-[1400px] items-center gap-12 lg:grid-cols-2 lg:gap-16">
                {/* Left Column: Scrapbook Card with Text */}
                <div className="flex flex-col items-center justify-center space-y-6 lg:space-y-8 z-10 w-full">
                    {/* Main Collage Card */}
                    <motion.div
                        initial={{ opacity: 0, x: -38, scale: 0.97 }}
                        whileInView={{ opacity: 1, x: 0, scale: 1 }}
                        viewport={{ once: true, amount: 0.25 }}
                        transition={{ duration: 0.75, ease: 'easeOut' }}
                        className="bg-[#FFFDF3] border-3 border-brand-black p-8 sm:p-16 rounded-[2.5rem] shadow-[12px_12px_0_rgba(0,0,0,1)] relative w-full max-w-[88vw] sm:max-w-[660px] min-h-[360px] sm:min-h-[480px] flex items-center justify-center overflow-hidden"
                    >
                        {/* Big stacked text */}
                        <div className="flex flex-col text-center items-center justify-center space-y-2 select-none z-10 w-full">
                            <h3 
                                className="font-tan text-3xl sm:text-5xl lg:text-6xl font-black uppercase leading-[0.95] tracking-wide text-brand-orange text-center w-full"
                                style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.15)' }}
                            >
                                Pedalea.
                            </h3>
                            <h3 
                                className="font-tan text-3xl sm:text-5xl lg:text-6xl font-black uppercase leading-[0.95] tracking-wide text-brand-pink text-center w-full"
                                style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.15)' }}
                            >
                                Conecta.
                            </h3>
                            <h3 
                                className="font-tan text-3xl sm:text-5xl lg:text-6xl font-black uppercase leading-[0.95] tracking-wide text-brand-yellow text-center w-full"
                                style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.15)' }}
                            >
                                Inspira.
                            </h3>
                        </div>
                    </motion.div>

                    {/* Secondary Paragraph Text below card */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
                        className="font-cocon text-[#FFFDF3]/95 text-center text-base sm:text-lg lg:text-xl max-w-[540px] mx-auto mt-6 leading-relaxed"
                    >
                        Experiencias personalizadas que fusionan la ingeniería creativa y dinámica con el espíritu de la bicicultura y el compromiso con el planeta.
                    </motion.p>
                </div>

                {/* Right Column: Rip-Paper Sticker & Main Polaroid Image */}
                <div className="relative mx-auto w-full max-w-[480px] lg:max-w-none px-4 sm:px-6 z-10 flex flex-col items-center justify-center space-y-10 lg:space-y-12">
                    {/* Rip-Paper Header Sticker */}
                    <motion.div
                        initial={{ opacity: 0, y: -24, rotate: -4 }}
                        whileInView={{ opacity: 1, y: 0, rotate: -2 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="bg-[#FFFDF3] border-3 border-brand-black px-8 py-5 shadow-[5px_5px_0_rgba(0,0,0,1)] rounded-md rotate-[-2deg] relative inline-block w-full max-w-[88vw] sm:max-w-[440px] z-20"
                    >
                        {/* Pink slash illustration (Left) */}
                        <svg className="absolute -left-6 lg:-left-10 -top-6 lg:-top-8 w-10 h-10 lg:w-16 lg:h-16 text-brand-pink fill-current drop-shadow-sm select-none" viewBox="0 0 120 120">
                            <path d="M30 60c0-10 15-25 25-15s5 20-5 25-20 0-20-10z M50 35c5-10 25-5 20 10s-15 10-20-10z M40 85c-10 5-20-15-5-20s15 15 5 20z" />
                        </svg>

                        {/* Orange splash illustration (Right) */}
                        <svg className="absolute -right-6 lg:-right-9 -top-5 lg:-top-7 w-10 h-10 lg:w-16 lg:h-16 text-brand-orange fill-current drop-shadow-sm select-none" viewBox="0 0 120 120">
                            <path d="M90 60c0 10-15 25-25 15s-5-20 5-25 20 0 20 10z M70 35c-5-10-25-5-20 10s15 10 20-10z M80 85c10 5 20-15 5-20s-15 15-5 20z" />
                        </svg>

                        {/* Sticker Content */}
                        <div className="flex flex-col items-center justify-center text-center">
                            <div className="flex items-center gap-1">
                                <span 
                                    className="font-tan uppercase text-lg sm:text-2xl text-brand-yellow-vibrant"
                                    style={{ WebkitTextStroke: '1px #000', textShadow: '2px 2px 0px rgba(0,0,0,1)' }}
                                >
                                    ¡VIVE
                                </span>
                                <span className="font-gochi text-brand-black text-base sm:text-xl font-bold ml-1 mr-1">
                                     la experiencia
                                </span>
                                <span className="font-scripter text-xl sm:text-3xl leading-none font-bold text-brand-pink">
                                    Briz!
                                </span>
                            </div>
                            <div className="relative inline-block mt-1.5 pb-1">
                                <span className="font-gochi text-brand-charcoal text-sm sm:text-lg font-bold">
                                    porque con Briz, eres feliz.
                                </span>
                                {/* Doodled underline */}
                                <svg className="absolute bottom-[-2px] left-1/4 w-1/2 h-2 text-brand-yellow" viewBox="0 0 100 10" preserveAspectRatio="none">
                                    <path d="M0 5 Q 50 9, 100 3" stroke="currentColor" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                                </svg>
                            </div>
                        </div>
                    </motion.div>

                    {/* Main Polaroid Image Container */}
                    <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.96, rotate: 3 }}
                        whileInView={{ opacity: 1, y: 0, scale: 1, rotate: -2 }}
                        viewport={{ once: true, amount: 0.25 }}
                        transition={{ duration: 0.75, ease: 'easeOut' }}
                        className="relative bg-white p-3 pb-10 sm:p-4 sm:pb-14 border-3 border-brand-black shadow-[12px_12px_0_rgba(0,0,0,0.3)] sm:shadow-[16px_16px_0_rgba(0,0,0,0.3)] rounded-sm rotate-[-2deg] w-[70vw] max-w-[280px] sm:w-full sm:max-w-[420px] group overflow-visible"
                    >
                        {/* Polaroid Image Area */}
                        <div className="overflow-hidden bg-[#FFEEC7] relative aspect-[1.12/1]">
                            <SmartImage
                                src={`${assetBase}/6.webp`}
                                fallbackSrcs={[`/menu-principal-celular/6.webp`, `${assetBase}/1.webp`]}
                                alt="Experiencia Briz Feliz"
                                placeholderLabel="6.webp"
                                className="w-full h-full object-cover scale-102 group-hover:scale-105 transition-transform duration-500 rounded-sm"
                            />
                        </div>

                        {/* Small hand-written sticker on Polaroid */}
                        <div className="absolute right-4 bottom-4 rotate-[2deg] z-20">
                            <span className="font-gochi text-lg text-brand-black/70 font-black">
                                Briz Life 🚲✨
                            </span>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

function StatsStrip() {
    return (
        <section className="bg-[#FFFDF3] px-4 py-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp} className="mx-auto max-w-[1200px] rounded-[1.7rem] bg-white/74 p-4 shadow-sm ring-1 ring-brand-yellow/18 sm:p-6">
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:divide-x lg:divide-brand-black/10">
                    {stats.map((stat) => {
                        const Icon = stat.icon;
                        return (
                            <div key={stat.label} className="flex items-center gap-3 px-1 sm:gap-4 lg:px-6">
                                <Icon className="h-9 w-9 shrink-0 sm:h-10 sm:w-10" style={{ color: stat.color }} strokeWidth={1.8} />
                                <div className="min-w-0">
                                    <p className="font-cocon text-2xl font-bold leading-none text-brand-black sm:text-3xl">{stat.value}</p>
                                    <p className="mt-1 font-maiandra text-xs text-brand-black/58">{stat.label}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </motion.div>
        </section>
    );
}

function CTABanner() {
    return (
        <section className="bg-[#FFFDF3] px-4 pb-16 pt-4 sm:px-6 lg:px-8">
            <motion.div
                {...fadeUp}
                className="relative mx-auto grid max-w-[1200px] overflow-hidden rounded-[2rem] bg-brand-yellow p-7 shadow-[0_18px_36px_rgba(120,87,0,0.14)] sm:p-9 lg:grid-cols-[0.52fr_0.48fr] lg:items-center"
            >
                <LeafStem className="absolute -bottom-8 left-0 h-32 w-20 opacity-45" />
                <div className="relative z-10">
                    <h2 className="font-tan text-2xl leading-tight text-brand-black sm:text-3xl">Tu aventura comienza aquí</h2>
                    <p className="mt-2 font-cocon text-sm text-brand-black/68 sm:text-base">Reserva en minutos y comienza a pedalear.</p>
                    <Link
                        to="/rentals"
                        className="group mt-5 inline-flex min-h-12 items-center gap-3 rounded-xl bg-[#07122B] px-6 font-cocon text-sm font-bold text-white transition hover:-translate-y-0.5 hover:scale-[1.03]"
                    >
                        Reservar ahora
                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    </Link>
                </div>
                <svg className="relative z-0 mt-8 h-32 w-full text-[#B98500] lg:mt-0 lg:h-44" viewBox="0 0 560 190" fill="none" aria-hidden="true">
                    <path d="M0 162C94 96 140 177 229 105C290 55 333 76 389 48C449 18 500 26 552 8" stroke="currentColor" strokeWidth="10" strokeLinecap="round" opacity="0.18" />
                    <motion.path
                        d="M5 150C91 91 137 164 225 98C291 49 328 67 386 43C442 20 494 24 548 10"
                        stroke="#FFF5BA"
                        strokeWidth="4"
                        strokeDasharray="12 12"
                        strokeLinecap="round"
                        initial={{ pathLength: 0.15 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.4, ease: 'easeOut' }}
                    />
                    <Bike x="118" y="102" width="46" height="46" strokeWidth={1.8} />
                    <MapPinned x="480" y="3" width="48" height="48" color="#FD7B2C" />
                    <path d="M66 166H378" stroke="#C89500" strokeWidth="42" strokeLinecap="round" opacity="0.1" />
                </svg>
            </motion.div>
        </section>
    );
}

export default function HomePage() {
    const activeViewport = useCurrentViewport();
    const { config, updateTransform, reset } = useDesignConfig();
    const [editorOpen, setEditorOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<EditableElementId>('heroLettering');
    const [editViewport, setEditViewport] = useState<DesignViewport>(activeViewport);

    useEffect(() => {
        setEditViewport(activeViewport);
    }, [activeViewport]);

    return (
        <DesignEditorContext.Provider
            value={{
                activeViewport,
                config,
                editorOpen,
                selectedId,
                setSelectedId,
                updateTransform,
            }}
        >
            <div className="overflow-hidden bg-[#FFFDF3]">
                <HeroSection />
                <ServiceStrip />
                <WhyChooseBrizSection />
                <BrandSection />
                <CommunitySection />
                <FinalInspirationalSection />
                <StatsStrip />
                <CTABanner />
                <ExperienceSection />
                {designEditorEnabled ? (
                    <DesignEditorPanel
                        config={config}
                        selectedId={selectedId}
                        setSelectedId={setSelectedId}
                        editViewport={editViewport}
                        setEditViewport={setEditViewport}
                        editorOpen={editorOpen}
                        setEditorOpen={setEditorOpen}
                        updateTransform={updateTransform}
                        reset={reset}
                    />
                ) : null}
            </div>
        </DesignEditorContext.Provider>
    );
}
