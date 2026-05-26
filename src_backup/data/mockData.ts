import type { ReactNode } from 'react';

// ============= BIKES =============
export interface Bike {
    id: string;
    name: string;
    category: string;
    type: string;
    wheelSize: string;
    description: string;
    pricePerHour: number;
    pricePerDay: number;
    pricePerWeek: number;
    saleable: boolean;
    salePrice?: number;
    available: boolean;
    condition: 'Excelente' | 'Bueno' | 'Regular' | 'En Mantenimiento';
    image: string;
    accessories: string[];
}

export const bikes: Bike[] = [
    { id: 'b1', name: 'Briz Urban Pro', category: 'Urbana', type: 'Urbana', wheelSize: '700c', description: 'Bicicleta urbana ligera, perfecta para las calles de Cochabamba. Ideal para commuting diario.', pricePerHour: 15, pricePerDay: 60, pricePerWeek: 300, saleable: true, salePrice: 2800, available: true, condition: 'Excelente', image: '', accessories: ['Casco', 'Candado', 'Luces'] },
    { id: 'b2', name: 'Briz Mountain X1', category: 'Montaña', type: 'Montaña', wheelSize: '29"', description: 'MTB de alto rendimiento con suspensión delantera. Conquista los senderos de Tunari.', pricePerHour: 25, pricePerDay: 100, pricePerWeek: 500, saleable: true, salePrice: 4500, available: true, condition: 'Excelente', image: '', accessories: ['Casco', 'Candado', 'Kit de reparación'] },
    { id: 'b3', name: 'Briz Road Elite', category: 'Ruta', type: 'Ruta', wheelSize: '700c', description: 'Bicicleta de ruta aerodinámica para los ciclistas que buscan velocidad y rendimiento.', pricePerHour: 30, pricePerDay: 120, pricePerWeek: 600, saleable: true, salePrice: 5200, available: true, condition: 'Bueno', image: '', accessories: ['Casco', 'Candado', 'Bidón'] },
    { id: 'b4', name: 'Briz City Cruise', category: 'Urbana', type: 'Urbana', wheelSize: '26"', description: 'Paseo relajado por la ciudad con comodidad total. Perfecta para ciclovías y parques.', pricePerHour: 12, pricePerDay: 45, pricePerWeek: 220, saleable: false, available: true, condition: 'Excelente', image: '', accessories: ['Casco', 'Canasta'] },
    { id: 'b5', name: 'Briz Tandem Duo', category: 'Tándem', type: 'Tándem', wheelSize: '26"', description: 'Bicicleta para dos — ideal para parejas y amigos explorando Cochabamba juntos.', pricePerHour: 35, pricePerDay: 140, pricePerWeek: 700, saleable: false, available: true, condition: 'Bueno', image: '', accessories: ['Cascos x2', 'Candado'] },
    { id: 'b6', name: 'Briz Mountain Trail', category: 'Montaña', type: 'Montaña', wheelSize: '27.5"', description: 'Trail bike versátil con doble suspensión. Para aventuras en los cerros cochabambinos.', pricePerHour: 28, pricePerDay: 110, pricePerWeek: 550, saleable: true, salePrice: 4800, available: false, condition: 'En Mantenimiento', image: '', accessories: ['Casco', 'Kit de reparación', 'Guantes'] },
    { id: 'b7', name: 'Briz Kids Explorer', category: 'Familiar', type: 'Familiar', wheelSize: '20"', description: 'Bicicleta segura y divertida para los pequeños ciclistas de la familia.', pricePerHour: 10, pricePerDay: 35, pricePerWeek: 180, saleable: true, salePrice: 1200, available: true, condition: 'Excelente', image: '', accessories: ['Casco infantil', 'Rueditas de apoyo'] },
    { id: 'b8', name: 'Briz Gravel Adventure', category: 'Ruta', type: 'Gravel', wheelSize: '700c', description: 'La bicicleta ideal para caminos mixtos. Explora rutas off-road con confianza.', pricePerHour: 28, pricePerDay: 100, pricePerWeek: 480, saleable: true, salePrice: 3900, available: true, condition: 'Excelente', image: '', accessories: ['Casco', 'Candado', 'Alforjas'] },
];

// ============= PRODUCTS / ACCESSORIES =============
export interface Product {
    id: string;
    name: string;
    category: string;
    price: number;
    stock: number;
    description: string;
    image: string;
}

export const products: Product[] = [
    { id: 'p1', name: 'Casco Urbano Briz', category: 'Cascos', price: 180, stock: 15, description: 'Casco ligero con ventilación superior. Diseño moderno y seguro.', image: '' },
    { id: 'p2', name: 'Candado U-Lock Premium', category: 'Seguridad', price: 120, stock: 20, description: 'Candado de alta seguridad tipo U. Protege tu bicicleta en la ciudad.', image: '' },
    { id: 'p3', name: 'Luces LED Recargables', category: 'Iluminación', price: 85, stock: 30, description: 'Set de luces delantera y trasera LED. Recargables por USB.', image: '' },
    { id: 'p4', name: 'Kit de Reparación Portátil', category: 'Herramientas', price: 65, stock: 25, description: 'Todo lo que necesitas para reparaciones rápidas en la ruta.', image: '' },
    { id: 'p5', name: 'Bidón Deportivo 750ml', category: 'Accesorios', price: 35, stock: 40, description: 'Bidón ergonómico con válvula de flujo rápido. Libre de BPA.', image: '' },
    { id: 'p6', name: 'Guantes Ciclismo Pro', category: 'Ropa', price: 95, stock: 18, description: 'Guantes con acolchado en gel. Máximo agarre y comodidad.', image: '' },
    { id: 'p7', name: 'Portacelular para Bici', category: 'Accesorios', price: 55, stock: 22, description: 'Soporte universal para celular. Resistente a vibraciones.', image: '' },
    { id: 'p8', name: 'Inflador de Piso Pro', category: 'Herramientas', price: 150, stock: 8, description: 'Inflador con manómetro integrado. Compatible con válvulas Presta y Schrader.', image: '' },
    { id: 'p9', name: 'Alforjas Impermeables', category: 'Accesorios', price: 220, stock: 10, description: 'Alforjas laterales impermeables con 20L de capacidad total.', image: '' },
    { id: 'p10', name: 'Cámara 700c', category: 'Repuestos', price: 25, stock: 50, description: 'Cámara de repuesto para bicicletas de ruta y urbanas 700c.', image: '' },
    { id: 'p11', name: 'Cadena Shimano 8v', category: 'Repuestos', price: 75, stock: 15, description: 'Cadena de repuesto Shimano para 8 velocidades.', image: '' },
    { id: 'p12', name: 'Pastillas de Freno Disco', category: 'Repuestos', price: 45, stock: 20, description: 'Pastillas de freno de disco semi-metálicas. Compatible con Shimano.', image: '' },
];

// ============= SERVICES =============
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

// ============= ROUTES =============
export interface CyclingRoute {
    id: string;
    name: string;
    difficulty: 'Fácil' | 'Moderado' | 'Difícil';
    distance: string;
    duration: string;
    description: string;
    highlights: string[];
    image: string;
}

export const cyclingRoutes: CyclingRoute[] = [
    { id: 'r1', name: 'Ciclovía del Prado', difficulty: 'Fácil', distance: '8 km', duration: '30-45 min', description: 'Recorrido clásico por El Prado, la avenida principal de Cochabamba. Perfecto para un paseo relajado.', highlights: ['El Prado', 'Plaza 14 de Septiembre', 'Centro Histórico'], image: '' },
    { id: 'r2', name: 'Ruta al Cristo', difficulty: 'Moderado', distance: '12 km', duration: '1-2 horas', description: 'Subida desafiante hasta el Cristo de la Concordia con vistas panorámicas espectaculares.', highlights: ['Cristo de la Concordia', 'Cerro San Pedro', 'Vista panorámica'], image: '' },
    { id: 'r3', name: 'Parque Lincoln', difficulty: 'Fácil', distance: '5 km', duration: '20-30 min', description: 'Circuito tranquilo por el Parque Lincoln, ideal para familias y principiantes.', highlights: ['Parque Lincoln', 'Áreas verdes', 'Zona recreativa'], image: '' },
    { id: 'r4', name: 'Valle de Tiquipaya', difficulty: 'Moderado', distance: '20 km', duration: '2-3 horas', description: 'Aventura por el valle con paisajes impresionantes y aire fresco de montaña.', highlights: ['Tiquipaya', 'Paisajes del valle', 'Comunidades rurales'], image: '' },
    { id: 'r5', name: 'Tunari Challenge', difficulty: 'Difícil', distance: '35 km', duration: '4-6 horas', description: 'Ruta extrema hacia las faldas del Tunari. Solo para ciclistas experimentados.', highlights: ['Cordillera del Tunari', 'Senderos de montaña', 'Naturaleza virgen'], image: '' },
    { id: 'r6', name: 'Circuito Urbano Sur', difficulty: 'Fácil', distance: '10 km', duration: '40-60 min', description: 'Recorrido por la zona sur de Cochabamba, pasando por parques y plazas.', highlights: ['Zona Sur', 'Parques urbanos', 'Cafés y restaurantes'], image: '' },
];

// ============= TESTIMONIALS =============
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

// ============= FAQ =============
export interface FAQ {
    question: string;
    answer: string;
}

export const faqs: FAQ[] = [
    { question: '¿Qué necesito para alquilar una bicicleta?', answer: 'Solo necesitas tu carnet de identidad (CI) vigente y llenar un formulario rápido con tus datos. No es necesario crear una cuenta.' },
    { question: '¿Cuáles son los precios de alquiler?', answer: 'Los precios varían según el tipo de bicicleta. Desde Bs. 10/hora para bicicletas infantiles hasta Bs. 35/hora para tándems. También ofrecemos tarifas por día y por semana con descuentos.' },
    { question: '¿Incluyen accesorios con el alquiler?', answer: 'Sí, cada alquiler incluye casco y candado sin costo adicional. Otros accesorios como luces, bidones y kits de reparación están disponibles con un cargo extra mínimo.' },
    { question: '¿Necesito dejar un depósito?', answer: 'Sí, solicitamos un depósito reembolsable que varía según el tipo de bicicleta. El depósito se devuelve completo al retornar la bicicleta en buen estado.' },
    { question: '¿Qué pasa si la bicicleta se daña?', answer: 'Los daños menores por uso normal están cubiertos. Para daños mayores, se descuenta del depósito según la evaluación del taller. Siempre te explicamos cualquier cargo antes.' },
    { question: '¿Ofrecen servicio técnico para bicicletas propias?', answer: '¡Sí! Nuestro taller atiende cualquier bicicleta, no solo las de Briz. Ofrecemos desde revisiones rápidas hasta mantenimiento completo.' },
    { question: '¿Cuál es el horario de atención?', answer: 'Estamos abiertos de lunes a sábado de 8:00 a 19:00 y domingos de 9:00 a 14:00.' },
    { question: '¿Pueden entregar la bicicleta en mi ubicación?', answer: 'Sí, ofrecemos servicio de entrega y recogida en toda Cochabamba con un cargo adicional. Contáctanos por WhatsApp para coordinar.' },
];

// ============= ADMIN MOCK DATA =============
export interface Rental {
    id: string;
    customer: string;
    phone: string;
    bike: string;
    date: string;
    duration: string;
    status: 'Pendiente' | 'Confirmado' | 'Activo' | 'Devuelto' | 'Atrasado' | 'Cancelado';
    pickupTime: string;
    accessories: string[];
    total: number;
}

export const rentals: Rental[] = [
    { id: 'R001', customer: 'María López', phone: '+591 76543210', bike: 'Briz Urban Pro', date: '2026-03-09', duration: '4 horas', status: 'Activo', pickupTime: '09:00', accessories: ['Casco', 'Candado'], total: 60 },
    { id: 'R002', customer: 'Juan Pérez', phone: '+591 71234567', bike: 'Briz Mountain X1', date: '2026-03-09', duration: '1 día', status: 'Activo', pickupTime: '08:00', accessories: ['Casco', 'Kit de reparación'], total: 100 },
    { id: 'R003', customer: 'Andrea Soliz', phone: '+591 72345678', bike: 'Briz Tandem Duo', date: '2026-03-09', duration: '2 horas', status: 'Pendiente', pickupTime: '14:00', accessories: ['Cascos x2', 'Candado'], total: 70 },
    { id: 'R004', customer: 'Roberto Méndez', phone: '+591 73456789', bike: 'Briz Road Elite', date: '2026-03-08', duration: '1 día', status: 'Atrasado', pickupTime: '07:00', accessories: ['Casco', 'Bidón'], total: 120 },
    { id: 'R005', customer: 'Lucia Torrico', phone: '+591 74567890', bike: 'Briz City Cruise', date: '2026-03-08', duration: '3 horas', status: 'Devuelto', pickupTime: '10:00', accessories: ['Casco'], total: 36 },
    { id: 'R006', customer: 'Pedro Vargas', phone: '+591 75678901', bike: 'Briz Kids Explorer', date: '2026-03-10', duration: '2 horas', status: 'Confirmado', pickupTime: '11:00', accessories: ['Casco infantil', 'Rueditas de apoyo'], total: 20 },
    { id: 'R007', customer: 'Carmen Flores', phone: '+591 76789012', bike: 'Briz Gravel Adventure', date: '2026-03-07', duration: '1 semana', status: 'Devuelto', pickupTime: '08:00', accessories: ['Casco', 'Alforjas'], total: 480 },
    { id: 'R008', customer: 'Felipe Rojas', phone: '+591 77890123', bike: 'Briz Urban Pro', date: '2026-03-10', duration: '1 día', status: 'Pendiente', pickupTime: '09:00', accessories: ['Casco', 'Luces'], total: 60 },
];

export interface ServiceOrder {
    id: string;
    customer: string;
    phone: string;
    bikeType: string;
    issue: string;
    status: 'Recibido' | 'En revisión' | 'En reparación' | 'Listo' | 'Entregado';
    estimatedDelivery: string;
    costEstimate: number;
    notes: string;
    date: string;
}

export const serviceOrders: ServiceOrder[] = [
    { id: 'SO001', customer: 'Jorge Guzmán', phone: '+591 71111111', bikeType: 'Mountain Bike', issue: 'Frenos hidráulicos no responden', status: 'En reparación', estimatedDelivery: '2026-03-10', costEstimate: 120, notes: 'Requiere cambio de pastillas y purgado', date: '2026-03-07' },
    { id: 'SO002', customer: 'Patricia Ríos', phone: '+591 72222222', bikeType: 'Bici Urbana', issue: 'Cadena rota', status: 'Listo', estimatedDelivery: '2026-03-09', costEstimate: 60, notes: 'Cadena reemplazada, ajustes de cambios incluidos', date: '2026-03-08' },
    { id: 'SO003', customer: 'Miguel Salazar', phone: '+591 73333333', bikeType: 'Ruta', issue: 'Revisión general + cambio de cámara', status: 'Recibido', estimatedDelivery: '2026-03-11', costEstimate: 100, notes: 'Requiere revisión completa', date: '2026-03-09' },
    { id: 'SO004', customer: 'Sandra Vega', phone: '+591 74444444', bikeType: 'Infantil', issue: 'Rueditas desalineadas', status: 'Entregado', estimatedDelivery: '2026-03-08', costEstimate: 25, notes: 'Ajuste rápido completado', date: '2026-03-06' },
    { id: 'SO005', customer: 'Diego Montaño', phone: '+591 75555555', bikeType: 'Mountain Bike', issue: 'Suspensión delantera hace ruido', status: 'En revisión', estimatedDelivery: '2026-03-12', costEstimate: 200, notes: 'Posible cambio de sellos del amortiguador', date: '2026-03-09' },
];

export interface Sale {
    id: string;
    customer: string;
    products: string[];
    total: number;
    status: 'Completado' | 'Pendiente' | 'Cancelado';
    paymentMethod: 'Efectivo' | 'QR' | 'Transferencia';
    date: string;
}

export const sales: Sale[] = [
    { id: 'V001', customer: 'Andrés Jiménez', products: ['Casco Urbano Briz', 'Candado U-Lock Premium'], total: 300, status: 'Completado', paymentMethod: 'QR', date: '2026-03-09' },
    { id: 'V002', customer: 'Valeria Suárez', products: ['Kit de Reparación Portátil', 'Bidón Deportivo 750ml'], total: 100, status: 'Completado', paymentMethod: 'Efectivo', date: '2026-03-09' },
    { id: 'V003', customer: 'Ramón Quiroga', products: ['Briz Urban Pro'], total: 2800, status: 'Pendiente', paymentMethod: 'Transferencia', date: '2026-03-08' },
    { id: 'V004', customer: 'Elena Morales', products: ['Luces LED Recargables', 'Portacelular para Bici', 'Guantes Ciclismo Pro'], total: 235, status: 'Completado', paymentMethod: 'Efectivo', date: '2026-03-07' },
    { id: 'V005', customer: 'Fernando Castro', products: ['Inflador de Piso Pro'], total: 150, status: 'Completado', paymentMethod: 'QR', date: '2026-03-07' },
];

export interface Customer {
    id: string;
    name: string;
    phone: string;
    ci: string;
    rentals: number;
    purchases: number;
    serviceOrders: number;
    lastVisit: string;
    notes: string;
}

export const customers: Customer[] = [
    { id: 'C001', name: 'María Fernanda López', phone: '+591 76543210', ci: '5678901', rentals: 8, purchases: 3, serviceOrders: 1, lastVisit: '2026-03-09', notes: 'Cliente frecuente — descuento preferencial' },
    { id: 'C002', name: 'Carlos Quiroga', phone: '+591 71234567', ci: '4567890', rentals: 2, purchases: 1, serviceOrders: 0, lastVisit: '2026-03-05', notes: 'Turista — posible cliente recurrente' },
    { id: 'C003', name: 'Ana Belén Torrico', phone: '+591 72345678', ci: '3456789', rentals: 5, purchases: 2, serviceOrders: 2, lastVisit: '2026-03-08', notes: 'Estudiante — interesada en plan mensual' },
    { id: 'C004', name: 'Roberto Mendoza', phone: '+591 73456789', ci: '2345678', rentals: 3, purchases: 0, serviceOrders: 1, lastVisit: '2026-03-07', notes: '' },
    { id: 'C005', name: 'Jorge Guzmán', phone: '+591 71111111', ci: '1234567', rentals: 0, purchases: 0, serviceOrders: 1, lastVisit: '2026-03-07', notes: 'Solo servicio técnico por ahora' },
    { id: 'C006', name: 'Lucía Torrico', phone: '+591 74567890', ci: '6789012', rentals: 12, purchases: 5, serviceOrders: 3, lastVisit: '2026-03-09', notes: 'Mejor cliente — considerar programa de lealtad' },
];

// ============= DASHBOARD STATS =============
export const dashboardStats = {
    activeRentals: 3,
    bikesAvailable: 6,
    bikesInMaintenance: 1,
    todaySales: 400,
    openServiceOrders: 3,
    lowStockAlerts: 2,
    newReservations: 2,
    totalCustomers: 6,
};

// ============= CHART DATA =============
export const revenueByArea = [
    { name: 'Ene', alquileres: 4200, ventas: 2800, servicio: 1200 },
    { name: 'Feb', alquileres: 5100, ventas: 3200, servicio: 1500 },
    { name: 'Mar', alquileres: 4800, ventas: 4100, servicio: 1800 },
    { name: 'Abr', alquileres: 6200, ventas: 3600, servicio: 2100 },
    { name: 'May', alquileres: 7100, ventas: 4200, servicio: 2400 },
    { name: 'Jun', alquileres: 6800, ventas: 3800, servicio: 1900 },
];

export const rentalTrend = [
    { name: 'Lun', cantidad: 8 },
    { name: 'Mar', cantidad: 12 },
    { name: 'Mié', cantidad: 10 },
    { name: 'Jue', cantidad: 15 },
    { name: 'Vie', cantidad: 20 },
    { name: 'Sáb', cantidad: 28 },
    { name: 'Dom', cantidad: 22 },
];

export const bestSellingProducts = [
    { name: 'Casco Urbano', ventas: 45 },
    { name: 'Candado U-Lock', ventas: 38 },
    { name: 'Luces LED', ventas: 32 },
    { name: 'Bidón 750ml', ventas: 28 },
    { name: 'Kit Reparación', ventas: 22 },
];

// Navigation items for public site
export interface NavItem {
    label: string;
    href: string;
    icon?: ReactNode;
}
