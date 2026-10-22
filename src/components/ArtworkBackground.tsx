import { useArtworkPair } from '@/context/ArtworkContext';
import type { ArtworkSlotId } from '@/lib/artworkRegistry';
import type { Language } from '@/lib/translations';

export default function ArtworkBackground({ slotId, language, className = '' }: { slotId: ArtworkSlotId; language: Language; className?: string }) {
    const { desktop, mobile } = useArtworkPair(slotId, language);
    if (!desktop.sourceAvailable && !mobile.sourceAvailable) return null;
    const desktopSrc = desktop.sourceAvailable ? desktop.src : mobile.src;
    return <picture className={`pointer-events-none absolute inset-0 ${className}`} aria-hidden="true">
        {mobile.sourceAvailable && mobile.src !== desktopSrc && <source media="(max-width: 767px)" srcSet={mobile.src} />}
        <img src={desktopSrc} alt="" className="h-full w-full object-cover" />
    </picture>;
}
