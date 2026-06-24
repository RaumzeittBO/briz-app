import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type CommunityItemType = 'post' | 'event' | 'review';
export type CommunityStatus = 'pending' | 'approved' | 'rejected';

export interface CommunityItem {
    id: string;
    type: CommunityItemType;
    status: CommunityStatus;
    title: string;
    content: string;
    imageUrl?: string;
    category?: string;
    authorId: string;
    authorName: string;
    authorAvatar?: string;
    createdAt: string;
    updatedAt: string;
    eventDate?: string;
    eventTime?: string;
    location?: string;
    registrationUrl?: string;
    rating?: number;
}

type CommunityDraft = Omit<CommunityItem, 'id' | 'status' | 'createdAt' | 'updatedAt'>;

interface CommunityContextValue {
    items: CommunityItem[];
    isLoaded: boolean;
    createItem: (draft: CommunityDraft) => Promise<void>;
    moderateItem: (id: string, status: CommunityStatus) => Promise<void>;
    deleteItem: (id: string) => Promise<void>;
}

const CommunityContext = createContext<CommunityContextValue | null>(null);
const LOCAL_KEY = 'briz_community_items';

function readLocal(): CommunityItem[] {
    try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]'); } catch { return []; }
}

function saveLocal(items: CommunityItem[]) {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event('briz_community_updated'));
}

export function CommunityProvider({ children }: { children: ReactNode }) {
    const [remoteItems, setRemoteItems] = useState<CommunityItem[]>([]);
    const [localItems, setLocalItems] = useState<CommunityItem[]>(readLocal);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const refresh = () => setLocalItems(readLocal());
        window.addEventListener('storage', refresh);
        window.addEventListener('briz_community_updated', refresh);
        return () => {
            window.removeEventListener('storage', refresh);
            window.removeEventListener('briz_community_updated', refresh);
        };
    }, []);

    useEffect(() => {
        const unsubscribe = onSnapshot(query(collection(db, 'communityItems'), orderBy('createdAt', 'desc')), snapshot => {
            setRemoteItems(snapshot.docs.map(item => ({ ...item.data(), id: item.id } as CommunityItem)));
            setIsLoaded(true);
        }, error => {
            console.warn('No se pudo sincronizar Comunidad Briz; usando datos locales.', error);
            setIsLoaded(true);
        });
        return unsubscribe;
    }, []);

    const items = useMemo(() => {
        const merged = new Map<string, CommunityItem>();
        remoteItems.forEach(item => merged.set(item.id, item));
        localItems.forEach(item => { if (!merged.has(item.id)) merged.set(item.id, item); });
        return Array.from(merged.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }, [remoteItems, localItems]);

    const createItem = async (draft: CommunityDraft) => {
        const now = new Date().toISOString();
        const item: CommunityItem = { ...draft, id: `community-${Date.now()}`, status: 'pending', createdAt: now, updatedAt: now };
        try {
            await setDoc(doc(db, 'communityItems', item.id), item);
        } catch (error) {
            console.warn('No se pudo enviar la publicación a Firestore; se guardó en este dispositivo.', error);
            const next = [item, ...readLocal().filter(existing => existing.id !== item.id)];
            saveLocal(next);
            setLocalItems(next);
        }
    };

    const moderateItem = async (id: string, status: CommunityStatus) => {
        await updateDoc(doc(db, 'communityItems', id), { status, updatedAt: new Date().toISOString() });
    };

    const removeItem = async (id: string) => {
        try { await deleteDoc(doc(db, 'communityItems', id)); } finally {
            const next = readLocal().filter(item => item.id !== id);
            saveLocal(next);
            setLocalItems(next);
        }
    };

    return <CommunityContext.Provider value={{ items, isLoaded, createItem, moderateItem, deleteItem: removeItem }}>{children}</CommunityContext.Provider>;
}

export function useCommunity() {
    const context = useContext(CommunityContext);
    if (!context) throw new Error('useCommunity debe usarse dentro de CommunityProvider');
    return context;
}
