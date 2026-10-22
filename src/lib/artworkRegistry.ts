import type { Language } from './translations';

export type ArtworkVariant = 'esDesktop' | 'esMobile' | 'enDesktop' | 'enMobile';
export type ArtworkDevice = 'desktop' | 'mobile';
export type ArtworkOverrides = Partial<Record<ArtworkSlotId, Partial<Record<ArtworkVariant, ArtworkOverride>>>>;

export interface ArtworkOverride {
    url?: string;
    storagePath?: string;
    /** Reuse another language/device variant without creating a duplicate file. */
    sourceVariant?: ArtworkVariant;
}

export type ArtworkSlotId =
    | 'home_welcome_badge' | 'home_hero_vive'
    | 'home_bento_1_rentals' | 'home_bento_2_service' | 'home_bento_3_shop' | 'home_bento_4_routes'
    | 'about_slide_1' | 'about_slide_2' | 'about_slide_3'
    | 'home_texture' | 'home_why_tape' | 'home_splash_red' | 'home_splash_yellow'
    | 'home_purpose_bike' | 'home_hands_heart' | 'home_brand_sticker' | 'home_community_art'
    | 'home_brand_logo' | 'home_bike_logo' | 'site_brand_logo' | 'customer_auth_logo' | 'home_pedalea_art'
    | 'home_experience_tours' | 'home_experience_family' | 'home_experience_urban' | 'home_experience_accessible'
    | 'about_texture'
    | 'service_hero' | 'service_texture' | 'routes_texture';

export type ArtworkPreviewKind = 'hero' | 'framed-card' | 'about-slide' | 'full-width' | 'texture' | 'sticker' | 'logo' | 'photo-banner';

export interface ArtworkSlotConfig {
    id: ArtworkSlotId;
    page: string;
    section: string;
    titleEs: string;
    descriptionEs: string;
    defaults: Record<ArtworkVariant, { src: string; translated?: boolean }>;
    dimensions: string;
    previewKind: ArtworkPreviewKind;
    /** False when a source path exists only in code but the file is missing from this checkout. */
    originalAvailable?: boolean;
    /** Locale-neutral assets such as logos, textures, and photos can be shared by ES and EN. */
    languageIndependent?: boolean;
}

const same = (src: string) => ({ esDesktop: { src }, esMobile: { src }, enDesktop: { src, translated: false }, enMobile: { src, translated: false } });
const responsive = (esDesktop: string, esMobile: string, enDesktop = esDesktop, enMobile = esMobile, enDesktopTranslated = false, enMobileTranslated = false) => ({
    esDesktop: { src: esDesktop }, esMobile: { src: esMobile },
    enDesktop: { src: enDesktop, translated: enDesktopTranslated }, enMobile: { src: enMobile, translated: enMobileTranslated },
});

export const ARTWORK_REGISTRY: Record<ArtworkSlotId, ArtworkSlotConfig> = {
    home_welcome_badge: { id: 'home_welcome_badge', page: 'Inicio', section: 'Hero', titleEs: 'Bienvenidos', descriptionEs: 'Cinta gráfica flotante superpuesta al collage principal.', defaults: responsive('/Bienvenidos.png', '/Bienvenidos.png', '/welcome.png', '/welcome.png', true, true), dimensions: '969×168', previewKind: 'hero' },
    home_hero_vive: { id: 'home_hero_vive', page: 'Inicio', section: 'Hero', titleEs: 'Vive Cochabamba', descriptionEs: 'Arte flotante “Vive” sobre la imagen de portada.', defaults: responsive('/vive.webp', '/vive.webp', '/live-cochabamba.webp', '/live-cochabamba.webp'), dimensions: '1159×250', previewKind: 'hero' },
    home_bento_1_rentals: { id: 'home_bento_1_rentals', page: 'Inicio', section: 'Menú principal', titleEs: 'Alquila una Bici', descriptionEs: 'Primera lámina ilustrada del collage de servicios.', defaults: responsive('/menu-principal-web/1.webp', '/menu-principal-celular/1.webp', '/menu-principal-web/Ingles/1.png', '/menu-principal-celular/Ingles/1.png'), dimensions: '1467×959 / 1027×1018', previewKind: 'framed-card' },
    home_bento_2_service: { id: 'home_bento_2_service', page: 'Inicio', section: 'Menú principal', titleEs: 'Servicio Técnico', descriptionEs: 'Lámina de taller usada en el collage y en la tarjeta de servicios.', defaults: responsive('/menu-principal-web/2.webp', '/menu-principal-celular/2.webp', '/menu-principal-web/Ingles/2.png', '/menu-principal-celular/Ingles/2.png'), dimensions: '1467×960 / 1028×1020', previewKind: 'framed-card' },
    home_bento_3_shop: { id: 'home_bento_3_shop', page: 'Inicio', section: 'Menú principal', titleEs: 'Accesorios y Repuestos', descriptionEs: 'Lámina de tienda; aparece en las secciones de portada.', defaults: responsive('/menu-principal-web/3.webp', '/menu-principal-celular/3.webp', '/menu-principal-web/Ingles/3.png', '/menu-principal-celular/Ingles/3.png', true, false), dimensions: '1467×959 / 1027×1021', previewKind: 'framed-card' },
    home_bento_4_routes: { id: 'home_bento_4_routes', page: 'Inicio', section: 'Menú principal', titleEs: 'Paseos y Rutas', descriptionEs: 'Lámina de rutas ilustrada para computadora y celular.', defaults: responsive('/menu-principal-web/4.webp', '/menu-principal-celular/4.webp', '/menu-principal-web/Ingles/4.png', '/menu-principal-celular/Ingles/4.png', true, false), dimensions: '1467×959 / 1028×1020', previewKind: 'framed-card' },
    about_slide_1: { id: 'about_slide_1', page: 'Acerca de', section: 'Historia', titleEs: 'Nuestra Historia', descriptionEs: 'Primera lámina de la secuencia inclinada “Conócenos”.', defaults: responsive('/Conocenos-web/1.webp?v=2', '/Conocenos-celular/1.webp?v=2', '/Conocenos-web/Ingles/1.webp', '/Conocenos-celular/Ingles/1.webp'), dimensions: '1920×647 / 1919×1141', previewKind: 'about-slide' },
    about_slide_2: { id: 'about_slide_2', page: 'Acerca de', section: 'Misión y visión', titleEs: 'Misión y Visión', descriptionEs: 'Segunda lámina de la secuencia “Conócenos”.', defaults: responsive('/Conocenos-web/2.webp?v=2', '/Conocenos-celular/2.webp?v=2', '/Conocenos-web/Ingles/2.webp', '/Conocenos-celular/Ingles/2.webp'), dimensions: '1920×647 / 1919×1141', previewKind: 'about-slide' },
    about_slide_3: { id: 'about_slide_3', page: 'Acerca de', section: 'Valores', titleEs: 'Nuestros Valores', descriptionEs: 'Tercera lámina de la secuencia “Conócenos”.', defaults: responsive('/Conocenos-web/3.webp?v=2', '/Conocenos-celular/3.webp?v=2', '/Conocenos-web/Ingles/3.webp', '/Conocenos-celular/Ingles/3.webp'), dimensions: '1920×647 / 1919×1141', previewKind: 'about-slide' },
    home_texture: { id: 'home_texture', page: 'Inicio', section: 'Fondos', titleEs: 'Textura de papel', descriptionEs: 'Textura superpuesta en el fondo del hero y bloques decorativos.', defaults: same('/menu-principal-web/fondo-textura.webp'), dimensions: 'Textura repetible', previewKind: 'texture', originalAvailable: false, languageIndependent: true },
    home_why_tape: { id: 'home_why_tape', page: 'Inicio', section: 'Por qué elegir Briz', titleEs: 'Cinta decorativa', descriptionEs: 'Cinta flotante sobre el encabezado de la sección.', defaults: same('/menu-principal-web/sticker-porque-tape.webp'), dimensions: 'Elemento decorativo', previewKind: 'sticker', originalAvailable: false, languageIndependent: true },
    home_splash_red: { id: 'home_splash_red', page: 'Inicio', section: 'Por qué elegir Briz', titleEs: 'Salpicadura roja', descriptionEs: 'Sticker decorativo flotante al costado del texto.', defaults: same('/menu-principal-web/sticker-splash-rojo.webp'), dimensions: 'Elemento decorativo', previewKind: 'sticker', originalAvailable: false, languageIndependent: true },
    home_splash_yellow: { id: 'home_splash_yellow', page: 'Inicio', section: 'Por qué elegir Briz', titleEs: 'Salpicadura amarilla', descriptionEs: 'Sticker decorativo flotante en la sección de propósito.', defaults: same('/menu-principal-web/sticker-splash-amarillo.webp'), dimensions: 'Elemento decorativo', previewKind: 'sticker', originalAvailable: false, languageIndependent: true },
    home_purpose_bike: { id: 'home_purpose_bike', page: 'Inicio', section: 'Propósito', titleEs: 'Bicicleta ilustrada', descriptionEs: 'Sticker sobre el bloque de propósito de Briz.', defaults: same('/menu-principal-web/sticker-proposito-bici.webp'), dimensions: 'Elemento decorativo', previewKind: 'sticker', originalAvailable: false, languageIndependent: true },
    home_hands_heart: { id: 'home_hands_heart', page: 'Inicio', section: 'Propósito', titleEs: 'Manos con corazón', descriptionEs: 'Sticker centrado sobre el bloque de propósito.', defaults: same('/menu-principal-web/sticker-manos-corazon.webp'), dimensions: 'Elemento decorativo', previewKind: 'sticker', originalAvailable: false, languageIndependent: true },
    home_brand_sticker: { id: 'home_brand_sticker', page: 'Inicio', section: 'Marca', titleEs: 'Sticker de marca', descriptionEs: 'Marca gráfica junto al contenido de identidad.', defaults: same('/menu-principal-web/sticker-marca.webp'), dimensions: 'Elemento decorativo', previewKind: 'sticker', originalAvailable: false },
    home_community_art: { id: 'home_community_art', page: 'Inicio', section: 'Comunidad', titleEs: 'Arte de comunidad', descriptionEs: 'Ilustración editorial usada en la llamada a comunidad.', defaults: responsive('/menu-principal-web/comunidad.webp?v=2', '/menu-principal-celular/comunidad.webp', '/menu-principal-web/comunidad.webp?v=2', '/menu-principal-celular/comunidad.webp'), dimensions: 'Arte editorial', previewKind: 'full-width' },
    home_brand_logo: { id: 'home_brand_logo', page: 'Navegación y pie', section: 'Pie público', titleEs: 'Logotipo Briz', descriptionEs: 'Logotipo usado en el pie público.', defaults: same('/logo de briz.png'), dimensions: 'Logotipo', previewKind: 'logo', languageIndependent: true },
    home_bike_logo: { id: 'home_bike_logo', page: 'Inicio', section: 'Identidad', titleEs: 'Bicicleta Briz', descriptionEs: 'Marca ilustrada de bicicleta en el bloque de comunidad.', defaults: same('/logo_bicicleta_principal.png'), dimensions: 'Logotipo', previewKind: 'logo', languageIndependent: true },
    site_brand_logo: { id: 'site_brand_logo', page: 'Navegación y pie', section: 'Identidad', titleEs: 'Logotipo principal', descriptionEs: 'Logotipo público en Navbar y pie de página.', defaults: same('/logo_briz_principal.png'), dimensions: 'Logotipo', previewKind: 'logo', languageIndependent: true },
    customer_auth_logo: { id: 'customer_auth_logo', page: 'Cuenta de cliente', section: 'Inicio de sesión y registro', titleEs: 'Logotipo amarillo', descriptionEs: 'Logotipo que encabeza los diálogos públicos de autenticación de clientes.', defaults: same('/logoamarillo.png'), dimensions: 'Logotipo', previewKind: 'logo', languageIndependent: true },
    home_pedalea_art: { id: 'home_pedalea_art', page: 'Inicio', section: 'Inspiración', titleEs: 'Pedalea · Conecta · Inspira', descriptionEs: 'Lámina editorial dentro del marco tipo Polaroid al final de la página.', defaults: same('/pedalea.webp?v=1'), dimensions: 'Arte fotográfico', previewKind: 'photo-banner' },
    home_experience_tours: { id: 'home_experience_tours', page: 'Inicio', section: 'Experiencias', titleEs: 'Ciclotours', descriptionEs: 'Tarjeta ilustrada de experiencias en la portada.', defaults: same('/menu-principal-web/card-ciclotours.webp'), dimensions: 'Tarjeta editorial', previewKind: 'framed-card', originalAvailable: false },
    home_experience_family: { id: 'home_experience_family', page: 'Inicio', section: 'Experiencias', titleEs: 'En familia', descriptionEs: 'Tarjeta ilustrada de experiencias en la portada.', defaults: same('/menu-principal-web/card-familia.webp'), dimensions: 'Tarjeta editorial', previewKind: 'framed-card', originalAvailable: false },
    home_experience_urban: { id: 'home_experience_urban', page: 'Inicio', section: 'Experiencias', titleEs: 'Paseos urbanos', descriptionEs: 'Tarjeta ilustrada de experiencias en la portada.', defaults: same('/menu-principal-web/card-urbanos.webp'), dimensions: 'Tarjeta editorial', previewKind: 'framed-card', originalAvailable: false },
    home_experience_accessible: { id: 'home_experience_accessible', page: 'Inicio', section: 'Experiencias', titleEs: 'Para todos', descriptionEs: 'Tarjeta ilustrada de experiencias en la portada.', defaults: same('/menu-principal-web/card-todos.webp'), dimensions: 'Tarjeta editorial', previewKind: 'framed-card', originalAvailable: false },
    about_texture: { id: 'about_texture', page: 'Acerca de', section: 'Fondos', titleEs: 'Textura de papel', descriptionEs: 'Textura de fondo en el encabezado y el cierre de Acerca de.', defaults: same('/menu-principal-web/fondo-textura.webp'), dimensions: 'Textura repetible', previewKind: 'texture', originalAvailable: false, languageIndependent: true },
    service_hero: { id: 'service_hero', page: 'Taller', section: 'Portada', titleEs: 'Fotografía del taller', descriptionEs: 'Imagen editorial del encabezado público del taller; no es una foto de producto.', defaults: same('/images/mechanics-hero-briz.jpg'), dimensions: 'Fotografía horizontal', previewKind: 'photo-banner', languageIndependent: true },
    service_texture: { id: 'service_texture', page: 'Taller', section: 'Fondos', titleEs: 'Textura del taller', descriptionEs: 'Textura de grano superpuesta al fondo del formulario.', defaults: same('/noise.png'), dimensions: 'Textura', previewKind: 'texture', originalAvailable: false, languageIndependent: true },
    routes_texture: { id: 'routes_texture', page: 'Rutas', section: 'Fondos', titleEs: 'Textura de grano', descriptionEs: 'Textura de grano superpuesta al fondo de la página.', defaults: same('/noise.png'), dimensions: 'Textura', previewKind: 'texture', originalAvailable: false, languageIndependent: true },
};

export interface LocalizedArtworkResult {
    webSrc: string;
    mobileSrc: string;
    alt: string;
    isTranslatedWeb: boolean;
    isTranslatedMobile: boolean;
}

export interface ResolvedArtwork {
    src: string;
    status: 'own' | 'shared' | 'spanish-fallback';
    translated: boolean;
    sourceVariant: ArtworkVariant;
    sourceAvailable: boolean;
    fallbackSrc: string;
    fallbackAvailable: boolean;
}

export function resolveArtwork(
    slotId: ArtworkSlotId,
    language: Language,
    device: ArtworkDevice,
    overrides?: ArtworkOverrides,
): ResolvedArtwork {
    const config = ARTWORK_REGISTRY[slotId];
    const requested: ArtworkVariant = `${language}${device === 'desktop' ? 'Desktop' : 'Mobile'}` as ArtworkVariant;
    const spanish: ArtworkVariant = `es${device === 'desktop' ? 'Desktop' : 'Mobile'}` as ArtworkVariant;
    const visited = new Set<ArtworkVariant>();

    const from = (variant: ArtworkVariant): ResolvedArtwork | null => {
        if (visited.has(variant)) return null;
        visited.add(variant);
        const override = overrides?.[slotId]?.[variant];
        if (override?.sourceVariant) {
            const inherited = from(override.sourceVariant);
            if (!inherited) return null;
            const spanishFallback = variant.startsWith('en')
                && override.sourceVariant.startsWith('es')
                && !config.languageIndependent;
            return {
                ...inherited,
                status: spanishFallback ? 'spanish-fallback' : 'shared',
                translated: spanishFallback ? false : inherited.translated,
                sourceVariant: override.sourceVariant,
            };
        }
        const spanishFallback = config.defaults[spanish];
        if (override?.url) return { src: override.url, status: 'own', translated: variant.startsWith('en'), sourceVariant: variant, sourceAvailable: true, fallbackSrc: spanishFallback.src, fallbackAvailable: config.originalAvailable !== false };
        const base = config.defaults[variant];
        if (base.translated || variant.startsWith('es')) {
            return { src: base.src, status: 'own', translated: !!base.translated || variant.startsWith('es'), sourceVariant: variant, sourceAvailable: config.originalAvailable !== false, fallbackSrc: spanishFallback.src, fallbackAvailable: config.originalAvailable !== false };
        }
        return null;
    };

    const resolved = from(requested);
    if (resolved) return resolved;
    if (language === 'en' && config.languageIndependent) {
        const shared = from(spanish);
        if (shared) return { ...shared, status: 'shared', translated: true, sourceVariant: spanish };
    }
    const fallback = from(spanish);
    return fallback ? { ...fallback, status: 'spanish-fallback', translated: false, sourceVariant: spanish } : {
        src: config.defaults[spanish].src, status: 'spanish-fallback', translated: false, sourceVariant: spanish, sourceAvailable: config.originalAvailable !== false, fallbackSrc: config.defaults[spanish].src, fallbackAvailable: config.originalAvailable !== false,
    };
}

export function getLocalizedArtwork(
    slotId: ArtworkSlotId,
    language: Language,
    remoteOverrides?: ArtworkOverrides,
): LocalizedArtworkResult {
    const config = ARTWORK_REGISTRY[slotId];
    const web = resolveArtwork(slotId, language, 'desktop', remoteOverrides);
    const mobile = resolveArtwork(slotId, language, 'mobile', remoteOverrides);
    return {
        webSrc: web.src,
        mobileSrc: mobile.src,
        alt: language === 'en' ? config.titleEs : config.titleEs,
        isTranslatedWeb: web.translated,
        isTranslatedMobile: mobile.translated,
    };
}
