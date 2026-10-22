import type { Language } from './translations';

export type ArtworkSlotId =
    | 'home_welcome_badge'
    | 'home_hero_vive'
    | 'home_bento_1_rentals'
    | 'home_bento_2_service'
    | 'home_bento_3_shop'
    | 'home_bento_4_routes'
    | 'about_slide_1'
    | 'about_slide_2'
    | 'about_slide_3';

export interface ArtworkSlotConfig {
    id: ArtworkSlotId;
    section: 'home_hero' | 'home_bento' | 'about_carousel';
    titleEs: string;
    titleEn: string;
    esWebSrc: string;
    esMobileSrc: string;
    enWebTargetSrc: string;
    enMobileTargetSrc: string;
    /**
     * True ONLY if the English Web artwork file exists in `public/` AND has been visually verified
     * to contain translated English text (not a duplicate of the Spanish artwork or a missing file).
     */
    hasVerifiedEnWeb: boolean;
    /**
     * True ONLY if the English Mobile artwork file exists in `public/` AND has been visually verified
     * to contain translated English text.
     */
    hasVerifiedEnMobile: boolean;
    webDimensions: string;
    mobileDimensions: string;
}

export const ARTWORK_REGISTRY: Record<ArtworkSlotId, ArtworkSlotConfig> = {
    home_welcome_badge: {
        id: 'home_welcome_badge',
        section: 'home_hero',
        titleEs: 'Bienvenidos',
        titleEn: 'Welcome',
        esWebSrc: '/Bienvenidos.png',
        esMobileSrc: '/Bienvenidos.png',
        enWebTargetSrc: '/welcome.png',
        enMobileTargetSrc: '/welcome.png',
        hasVerifiedEnWeb: true,
        hasVerifiedEnMobile: true,
        webDimensions: '969x168',
        mobileDimensions: '969x168',
    },
    home_hero_vive: {
        id: 'home_hero_vive',
        section: 'home_hero',
        titleEs: '¡Vive Cochabamba en bicicleta! Alquila fácil, rápido y seguro',
        titleEn: 'Experience Cochabamba by bike! Rent easily, fast, and safely',
        esWebSrc: '/vive.webp',
        esMobileSrc: '/vive.webp',
        enWebTargetSrc: '/live-cochabamba.webp',
        enMobileTargetSrc: '/live-cochabamba.webp',
        hasVerifiedEnWeb: false,
        hasVerifiedEnMobile: false,
        webDimensions: '1159x250',
        mobileDimensions: '1159x250',
    },
    home_bento_1_rentals: {
        id: 'home_bento_1_rentals',
        section: 'home_bento',
        titleEs: 'Alquila una Bici',
        titleEn: 'Rent a Bike',
        esWebSrc: '/menu-principal-web/1.webp',
        esMobileSrc: '/menu-principal-celular/1.webp',
        enWebTargetSrc: '/menu-principal-web/Ingles/1.png',
        enMobileTargetSrc: '/menu-principal-celular/Ingles/1.png',
        // These files are not present yet; keep English on the existing Spanish fallback.
        hasVerifiedEnWeb: false,
        hasVerifiedEnMobile: false,
        webDimensions: '1467x959',
        mobileDimensions: '1027x1018',
    },
    home_bento_2_service: {
        id: 'home_bento_2_service',
        section: 'home_bento',
        titleEs: 'Servicio Técnico',
        titleEn: 'Bike Repair & Service',
        esWebSrc: '/menu-principal-web/2.webp',
        esMobileSrc: '/menu-principal-celular/2.webp',
        enWebTargetSrc: '/menu-principal-web/Ingles/2.png',
        enMobileTargetSrc: '/menu-principal-celular/Ingles/2.png',
        // Currently /Ingles/2.png still says "SERVICIO TÉCNICO" in Spanish
        hasVerifiedEnWeb: false,
        hasVerifiedEnMobile: false,
        webDimensions: '1467x960',
        mobileDimensions: '1028x1020',
    },
    home_bento_3_shop: {
        id: 'home_bento_3_shop',
        section: 'home_bento',
        titleEs: 'Accesorios y Repuestos',
        titleEn: 'Accessories & Spare Parts',
        esWebSrc: '/menu-principal-web/3.webp',
        esMobileSrc: '/menu-principal-celular/3.webp',
        enWebTargetSrc: '/menu-principal-web/Ingles/3.png',
        enMobileTargetSrc: '/menu-principal-celular/Ingles/3.png',
        // Web /Ingles/3.png is translated ("ACCESSORIES & SPARE PARTS"); mobile /Ingles/3.png is still in Spanish
        hasVerifiedEnWeb: true,
        hasVerifiedEnMobile: false,
        webDimensions: '1467x959',
        mobileDimensions: '1027x1021',
    },
    home_bento_4_routes: {
        id: 'home_bento_4_routes',
        section: 'home_bento',
        titleEs: 'Paseos y Rutas',
        titleEn: 'Tours & Routes',
        esWebSrc: '/menu-principal-web/4.webp',
        esMobileSrc: '/menu-principal-celular/4.webp',
        enWebTargetSrc: '/menu-principal-web/Ingles/4.png',
        enMobileTargetSrc: '/menu-principal-celular/Ingles/4.png',
        // Web /Ingles/4.png is translated ("TOURS & ROUTES"); mobile /Ingles/4.png is still in Spanish
        hasVerifiedEnWeb: true,
        hasVerifiedEnMobile: false,
        webDimensions: '1467x959',
        mobileDimensions: '1028x1020',
    },
    about_slide_1: {
        id: 'about_slide_1',
        section: 'about_carousel',
        titleEs: 'Nuestra Historia — ¡Pedalea con nosotros y siente la brisa!',
        titleEn: 'Our Story — Ride with us and feel the breeze!',
        esWebSrc: '/Conocenos-web/1.webp?v=2',
        esMobileSrc: '/Conocenos-celular/1.webp?v=2',
        enWebTargetSrc: '/Conocenos-web/Ingles/1.webp',
        enMobileTargetSrc: '/Conocenos-celular/Ingles/1.webp',
        // Prevents 404 on missing .webp and avoids unverified Spanish .png duplicates
        hasVerifiedEnWeb: false,
        hasVerifiedEnMobile: false,
        webDimensions: '1920x647',
        mobileDimensions: '1919x1141',
    },
    about_slide_2: {
        id: 'about_slide_2',
        section: 'about_carousel',
        titleEs: 'Misión y Visión',
        titleEn: 'Mission & Vision',
        esWebSrc: '/Conocenos-web/2.webp?v=2',
        esMobileSrc: '/Conocenos-celular/2.webp?v=2',
        enWebTargetSrc: '/Conocenos-web/Ingles/2.webp',
        enMobileTargetSrc: '/Conocenos-celular/Ingles/2.webp',
        hasVerifiedEnWeb: false,
        hasVerifiedEnMobile: false,
        webDimensions: '1920x647',
        mobileDimensions: '1919x1141',
    },
    about_slide_3: {
        id: 'about_slide_3',
        section: 'about_carousel',
        titleEs: 'Nuestros Valores',
        titleEn: 'Our Values',
        esWebSrc: '/Conocenos-web/3.webp?v=2',
        esMobileSrc: '/Conocenos-celular/3.webp?v=2',
        enWebTargetSrc: '/Conocenos-web/Ingles/3.webp',
        enMobileTargetSrc: '/Conocenos-celular/Ingles/3.webp',
        hasVerifiedEnWeb: false,
        hasVerifiedEnMobile: false,
        webDimensions: '1920x647',
        mobileDimensions: '1919x1141',
    },
};

export interface LocalizedArtworkResult {
    webSrc: string;
    mobileSrc: string;
    alt: string;
    isTranslatedWeb: boolean;
    isTranslatedMobile: boolean;
}

/**
 * Resolves the safe Web and Mobile image URLs for a given artwork slot and language.
 * Never returns a broken 404 path or an unverified Spanish copy when `language === 'en'`.
 */
export function getLocalizedArtwork(
    slotId: ArtworkSlotId,
    language: Language,
    remoteOverrides?: Partial<Record<ArtworkSlotId, Partial<ArtworkSlotConfig>>>
): LocalizedArtworkResult {
    const base = ARTWORK_REGISTRY[slotId];
    const cfg = remoteOverrides?.[slotId] ? { ...base, ...remoteOverrides[slotId] } : base;

    if (language === 'en') {
        const webSrc = cfg.hasVerifiedEnWeb ? cfg.enWebTargetSrc : cfg.esWebSrc;
        const mobileSrc = cfg.hasVerifiedEnMobile ? cfg.enMobileTargetSrc : cfg.esMobileSrc;
        return {
            webSrc,
            mobileSrc,
            alt: cfg.titleEn,
            isTranslatedWeb: cfg.hasVerifiedEnWeb,
            isTranslatedMobile: cfg.hasVerifiedEnMobile,
        };
    }

    return {
        webSrc: cfg.esWebSrc,
        mobileSrc: cfg.esMobileSrc,
        alt: cfg.titleEs,
        isTranslatedWeb: true,
        isTranslatedMobile: true,
    };
}
