export const LOCALES = ['es', 'en'] as const;
export type AppLanguage = typeof LOCALES[number];

export const MESSAGES = {
    navRentals: { es: 'Alquileres', en: 'Bike Rentals' },
    navShop: { es: 'Tienda', en: 'Shop' },
    navTours: { es: 'Paseos y rutas', en: 'Tours & Routes' },
    navService: { es: 'Taller', en: 'Bike Repair & Service' },
    navCommunity: { es: 'Comunidad', en: 'Community' },
    navAbout: { es: 'Acerca de BRIZ', en: 'About BRIZ' },
    navFaq: { es: 'Preguntas frecuentes', en: 'FAQs' },
    navServicesGroup: { es: 'Nuestros servicios', en: 'Our services' },
    navEvents: { es: 'Eventos', en: 'Events' },
    navNews: { es: 'Noticias', en: 'News' },
    navMaintenancePlans: { es: 'Planes de mantenimiento', en: 'Maintenance plans' },
    navAdditionalServices: { es: 'Servicios adicionales', en: 'Additional services' },
    navQuoteTool: { es: 'Cotizador en línea', en: 'Online estimate' },
    navBookAppointment: { es: 'Agendar turno', en: 'Book a service appointment' },
    actionSearch: { es: 'Buscar', en: 'Search' },
    actionAddToCart: { es: 'Añadir', en: 'Add to cart' },
    actionViewAll: { es: 'Ver todo', en: 'View all' },
    actionAsk: { es: 'Consultar', en: 'Ask us' },
    categoryAll: { es: 'Todas las categorías', en: 'All categories' },
    categoryOther: { es: 'Otros', en: 'Other' },
    statusAvailable: { es: 'Disponible', en: 'Available' },
    statusSoldOut: { es: 'Agotado', en: 'Out of stock' },
    authSignIn: { es: 'Iniciar sesión', en: 'Sign in' },
    authSignOut: { es: 'Cerrar sesión', en: 'Sign out' },
    languageSpanish: { es: 'Español (ES)', en: 'Español (ES)' },
    languageEnglish: { es: 'English (EN)', en: 'English (EN)' },
} as const satisfies Record<string, Record<AppLanguage, string>>;

export type MessageKey = keyof typeof MESSAGES;

export function tx(key: MessageKey, language: AppLanguage): string {
    return MESSAGES[key][language];
}
