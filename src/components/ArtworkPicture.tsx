import { useState } from 'react';
import type { CSSProperties } from 'react';
import { useArtworkPair } from '@/context/ArtworkContext';
import type { ArtworkSlotId } from '@/lib/artworkRegistry';
import type { Language } from '@/lib/translations';

export default function ArtworkPicture({ slotId, language, alt, className = '', imageClassName = '', loading = 'lazy', placeholderLabel, style }: {
    slotId: ArtworkSlotId;
    language: Language;
    alt: string;
    className?: string;
    imageClassName?: string;
    loading?: 'eager' | 'lazy';
    placeholderLabel?: string;
    style?: CSSProperties;
}) {
    const { desktop, mobile } = useArtworkPair(slotId, language);
    const [failedSources, setFailedSources] = useState<string[]>([]);
    if (!desktop.sourceAvailable && !mobile.sourceAvailable) {
        if (!placeholderLabel) return null;
        return <div className={`flex h-full w-full items-center justify-center ${className}`}><div className="max-w-[18rem] px-5 text-center"><p className="font-tangkiwood text-base text-brand-black sm:text-lg">Espacio reservado</p><p className="mt-2 break-words font-maiandra text-xs leading-relaxed text-brand-black/55">Sube <span className="font-cocon text-brand-black">{placeholderLabel}</span></p></div></div>;
    }
    const desktopPrimary = desktop.sourceAvailable ? desktop.src : mobile.src;
    const mobilePrimary = mobile.sourceAvailable ? mobile.src : desktop.src;
    const desktopFallback = desktop.fallbackAvailable ? desktop.fallbackSrc : mobile.sourceAvailable ? mobile.src : '';
    const mobileFallback = mobile.fallbackAvailable ? mobile.fallbackSrc : desktop.sourceAvailable ? desktop.src : '';
    const sourceFailed = (src: string) => failedSources.includes(new URL(src, window.location.href).href);
    const desktopSrc = sourceFailed(desktopPrimary) ? desktopFallback : desktopPrimary;
    const mobileSrc = sourceFailed(mobilePrimary) ? mobileFallback : mobilePrimary;
    const desktopFailed = !desktopSrc || sourceFailed(desktopSrc);
    const mobileFailed = !mobileSrc || sourceFailed(mobileSrc);
    if (desktopFailed && mobileFailed) return null;
    const desktopRenderSrc = desktopFailed ? mobileSrc : desktopSrc;
    const hasMobileSource = !mobileFailed && !!mobileSrc && mobileSrc !== desktopRenderSrc;
    return <picture className={`block ${className}`}>
        {hasMobileSource && <source media="(max-width: 767px)" srcSet={mobileSrc} />}
        <img
            src={desktopRenderSrc}
            alt={alt}
            className={imageClassName}
            style={style}
            loading={loading}
            onError={(event) => {
                const failed = event.currentTarget.currentSrc;
                setFailedSources((sources) => sources.includes(failed) ? sources : [...sources, failed]);
            }}
        />
    </picture>;
}
