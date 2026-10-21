import type { ReactNode } from 'react';

// ============= SERVICES (static, for public page) =============
export interface Service {
    id: string;
    name: string;
    description: string;
    price: number;
    duration: string;
    icon: string;
}

export const services: Service[] = [
    { id: 's1', name: 'Revisión General', description: 'Inspección completa de frenos, cambios, cadena, neumáticos y ajustes generales.', price: 80, duration: '1-2 horas', icon: 'Wrench' },
    { id: 's2', name: 'Cambio de Cámara', description: 'Reemplazo de cámara pinchada con cámara nueva incluida.', price: 35, duration: '30 min', icon: 'CircleDot' },
    { id: 's3', name: 'Ajuste de Frenos', description: 'Calibración y ajuste de frenos mecánicos o hidráulicos.', price: 40, duration: '30-45 min', icon: 'Disc' },
    { id: 's4', name: 'Ajuste de Cambios', description: 'Ajuste preciso de desviadores delantero y trasero.', price: 50, duration: '45 min', icon: 'Settings' },
    { id: 's5', name: 'Mantenimiento Completo', description: 'Servicio completo: limpieza, lubricación, ajuste de frenos, cambios y revisión total.', price: 180, duration: '3-4 horas', icon: 'Star' },
    { id: 's6', name: 'Cambio de Cadena', description: 'Reemplazo de cadena desgastada con cadena nueva.', price: 60, duration: '30 min', icon: 'Link' },
];

// ============= ROUTES (static, for public page) =============
export interface CyclingRoute {
    id: string;
    name: string;
    nameEn?: string;
    difficulty: 'Fácil' | 'Moderado' | 'Difícil';
    distance: string;
    duration: string;
    description: string;
    descriptionEn?: string;
    highlights: string[];
    image: string;
    mapUrl?: string;
}

export const cyclingRoutes: CyclingRoute[] = [
    { id: 'r1', name: 'Ciclovía del Prado', difficulty: 'Fácil', distance: '8 km', duration: '30-45 min', description: 'Recorrido clásico por El Prado, la avenida principal de Cochabamba. Perfecto para un paseo relajado.', highlights: ['El Prado', 'Plaza 14 de Septiembre', 'Centro Histórico'], image: '' },
    { id: 'r2', name: 'Ruta al Cristo', difficulty: 'Moderado', distance: '12 km', duration: '1-2 horas', description: 'Subida desafiante hasta el Cristo de la Concordia con vistas panorámicas espectaculares.', highlights: ['Cristo de la Concordia', 'Cerro San Pedro', 'Vista panorámica'], image: '' },
    { id: 'r3', name: 'Parque Lincoln', difficulty: 'Fácil', distance: '5 km', duration: '20-30 min', description: 'Circuito tranquilo por el Parque Lincoln, ideal para familias y principiantes.', highlights: ['Parque Lincoln', 'Áreas verdes', 'Zona recreativa'], image: '' },
    { id: 'r4', name: 'Valle de Tiquipaya', difficulty: 'Moderado', distance: '20 km', duration: '2-3 horas', description: 'Aventura por el valle con paisajes impresionantes y aire fresco de montaña.', highlights: ['Tiquipaya', 'Paisajes del valle', 'Comunidades rurales'], image: '' },
    { id: 'r5', name: 'Tunari Challenge', difficulty: 'Difícil', distance: '35 km', duration: '4-6 horas', description: 'Ruta extrema hacia las faldas del Tunari. Solo para ciclistas experimentados.', highlights: ['Cordillera del Tunari', 'Senderos de montaña', 'Naturaleza virgen'], image: '' },
    { id: 'r6', name: 'Circuito Urbano Sur', difficulty: 'Fácil', distance: '10 km', duration: '40-60 min', description: 'Recorrido por la zona sur de Cochabamba, pasando por parques y plazas.', highlights: ['Zona Sur', 'Parques urbanos', 'Cafés y restaurantes'], image: '' },
];

// ============= TESTIMONIALS (static) =============
export interface Testimonial {
    id: string;
    name: string;
    role: string;
    content: string;
    rating: number;
    avatar: string;
}

export const testimonials: Testimonial[] = [
    { id: 't1', name: 'María Fernanda López', role: 'Ciclista urbana', content: 'Briz cambió mi forma de moverme por Cochabamba. Alquilé una bicicleta para probar y ahora soy cliente frecuente. ¡El servicio es increíble!', rating: 5, avatar: '' },
    { id: 't2', name: 'Carlos Quiroga', role: 'Turista aventurero', content: 'Visitamos Cochabamba y alquilamos bicicletas para explorar la ciudad. La experiencia fue premium, las bicicletas en excelente estado.', rating: 5, avatar: '' },
    { id: 't3', name: 'Ana Belén Torrico', role: 'Estudiante universitaria', content: 'Los precios son accesibles y las bicicletas están impecables. El taller de servicio me salvó cuando tuve un problema con mi propia bici.', rating: 4, avatar: '' },
    { id: 't4', name: 'Roberto Mendoza', role: 'Ciclista de montaña', content: 'Las mountain bikes de Briz son de primera. Hice la ruta al Tunari y la bicicleta respondió perfecto. Totalmente recomendado.', rating: 5, avatar: '' },
];

// ============= FAQ (static) =============
export interface FAQ {
    question: string;
    answer: string;
}

export const faqs: FAQ[] = [
    { question: '¿Qué necesito para alquilar una bicicleta?', answer: 'Solo necesitas tu carnet de identidad (CI) vigente y llenar un formulario rápido con tus datos. No es necesario crear una cuenta.' },
    { question: '¿Cuáles son los precios de alquiler?', answer: 'Los precios varían según el tipo de bicicleta. Consulta nuestra sección de alquileres para ver las tarifas actualizadas.' },
    { question: '¿Incluyen accesorios con el alquiler?', answer: 'Depende del paquete. Puedes agregar accesorios extras o elegir un paquete combinado que ya los incluya.' },
    { question: '¿Necesito dejar un depósito?', answer: 'Sí, solicitamos un depósito reembolsable que varía según el tipo de bicicleta. El depósito se devuelve completo al retornar la bicicleta en buen estado.' },
    { question: '¿Qué pasa si la bicicleta se daña?', answer: 'Los daños menores por uso normal están cubiertos. Para daños mayores, se descuenta del depósito según la evaluación del taller.' },
    { question: '¿Ofrecen servicio técnico para bicicletas propias?', answer: '¡Sí! Nuestro taller atiende cualquier bicicleta, no solo las de Briz.' },
    { question: '¿Cuál es el horario de atención?', answer: 'Estamos abiertos de lunes a sábado de 8:00 a 19:00 y domingos de 9:00 a 14:00.' },
    { question: '¿Pueden entregar la bicicleta en mi ubicación?', answer: 'Sí, ofrecemos servicio de entrega y recogida en toda Cochabamba con un cargo adicional. Contáctanos por WhatsApp para coordinar.' },
];

// Navigation items for public site
export interface NavItem {
    label: string;
    href: string;
    icon?: ReactNode;
}
