/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ARTWORK_REGISTRY, resolveArtwork, type ArtworkDevice, type ArtworkOverrides, type ArtworkSlotId } from '@/lib/artworkRegistry';
import type { Language } from '@/lib/translations';

const ArtworkContext = createContext<ArtworkOverrides>({});

export function ArtworkProvider({ children }: { children: ReactNode }) {
    const [overrides, setOverrides] = useState<ArtworkOverrides>({});
    useEffect(() => onSnapshot(collection(db, 'publicArtworkConfig'), (snapshot) => {
        const next: ArtworkOverrides = {};
        snapshot.forEach((item) => {
            const slotId = item.id as ArtworkSlotId;
            if (!(slotId in ARTWORK_REGISTRY)) return;
            const variants = item.data().variants;
            if (variants && typeof variants === 'object') next[slotId] = variants;
        });
        setOverrides(next);
    }, (error) => {
        // Local source assets remain the safe fallback if public config cannot be read.
        console.error('Could not load published artwork configuration:', error);
    }), []);
    return <ArtworkContext.Provider value={overrides}>{children}</ArtworkContext.Provider>;
}

export function useArtwork(slotId: ArtworkSlotId, language: Language, device: ArtworkDevice) {
    const overrides = useContext(ArtworkContext);
    return useMemo(() => resolveArtwork(slotId, language, device, overrides), [slotId, language, device, overrides]);
}

export function useArtworkPair(slotId: ArtworkSlotId, language: Language) {
    const overrides = useContext(ArtworkContext);
    return useMemo(() => ({
        desktop: resolveArtwork(slotId, language, 'desktop', overrides),
        mobile: resolveArtwork(slotId, language, 'mobile', overrides),
    }), [slotId, language, overrides]);
}
