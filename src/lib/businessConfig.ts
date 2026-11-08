export type BusinessDay = {
  closed: boolean;
  open: string;
  close: string;
  /** Optional second shift; legacy open/close documents remain continuous. */
  secondShift?: {
    open: string;
    close: string;
  };
};

export type BusinessHours = Record<
  'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday',
  BusinessDay
>;

export interface PublicBusinessConfig {
  businessName: string;
  phone: string;
  address: string;
  email: string;
  whatsapp: string;
  hours: BusinessHours;
  updatedAt?: unknown;
}

export type PublicBusinessConfigUpdate = Partial<Omit<PublicBusinessConfig, 'hours'>> & {
  hours?: Partial<BusinessHours>;
};

// These match the contact details and hours already displayed on the public site.
// They are presentation fallbacks only and are never written automatically.
export const DEFAULT_PUBLIC_BUSINESS_CONFIG: PublicBusinessConfig = {
  businessName: 'Briz',
  phone: '+591 77860277',
  address: 'Av. Rodriguez Morales (Zona el pueblito)',
  email: 'brizbolivia@gmail.com',
  whatsapp: '+591 77860277',
  hours: {
    monday: { closed: false, open: '08:00', close: '19:00' },
    tuesday: { closed: false, open: '08:00', close: '19:00' },
    wednesday: { closed: false, open: '08:00', close: '19:00' },
    thursday: { closed: false, open: '08:00', close: '19:00' },
    friday: { closed: false, open: '08:00', close: '19:00' },
    saturday: { closed: false, open: '08:00', close: '19:00' },
    sunday: { closed: false, open: '09:00', close: '14:00' },
  },
};

export const BUSINESS_DAY_KEYS = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
] as const;

export const BUSINESS_DAY_LABELS = {
  es: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
  en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
} as const;

export function normalizeBusinessPhone(value: string): string {
  return value.replace(/\D/g, '');
}

export function businessWhatsAppUrl(value: string, message?: string): string {
  const phone = normalizeBusinessPhone(value);
  const base = `https://wa.me/${phone}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function businessMapUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export function formatBusinessHours(day: BusinessDay, language: 'es' | 'en'): string {
  if (day.closed) return language === 'es' ? 'Cerrado' : 'Closed';
  const firstShift = `${day.open} – ${day.close}`;
  return day.secondShift ? `${firstShift}\n${day.secondShift.open} – ${day.secondShift.close}` : firstShift;
}

export function validatePublicBusinessConfig(config: PublicBusinessConfig): string | null {
  if (!config.businessName.trim()) return 'El nombre del negocio es obligatorio.';
  if (!config.phone.trim()) return 'El teléfono principal es obligatorio.';
  if (!config.address.trim()) return 'La dirección es obligatoria.';
  if (!/^\S+@\S+\.\S+$/.test(config.email.trim())) return 'Ingresa un correo de contacto válido.';
  if (normalizeBusinessPhone(config.whatsapp).length < 7) return 'Ingresa un número de WhatsApp válido.';
  for (const [index, key] of BUSINESS_DAY_KEYS.entries()) {
    const day = config.hours[key];
    const dayLabel = BUSINESS_DAY_LABELS.es[index];
    if (day.closed) continue;
    if (!isValidTime(day.open) || !isValidTime(day.close)) return `${dayLabel}: completa las horas del primer turno.`;
    if (day.open >= day.close) return `${dayLabel}: la apertura debe ser anterior al cierre del primer turno.`;
    if (!day.secondShift) continue;
    if (!isValidTime(day.secondShift.open) || !isValidTime(day.secondShift.close)) return `${dayLabel}: completa las horas del segundo turno.`;
    if (day.secondShift.open < day.close) return `${dayLabel}: la reapertura no puede ser anterior al cierre del primer turno.`;
    if (day.secondShift.open >= day.secondShift.close) return `${dayLabel}: la reapertura debe ser anterior al cierre final.`;
  }
  return null;
}

function isValidTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function mergePublicBusinessConfig(remote: Partial<PublicBusinessConfig>): PublicBusinessConfig {
  const hours = BUSINESS_DAY_KEYS.reduce((result, key) => {
    result[key] = { ...DEFAULT_PUBLIC_BUSINESS_CONFIG.hours[key], ...(remote.hours?.[key] || {}) };
    return result;
  }, {} as BusinessHours);
  return { ...DEFAULT_PUBLIC_BUSINESS_CONFIG, ...remote, hours };
}

export function createInitialPublicBusinessConfig(
  updates: PublicBusinessConfigUpdate,
  updatedAt: unknown,
): PublicBusinessConfig {
  return {
    ...mergePublicBusinessConfig({
      businessName: updates.businessName ?? DEFAULT_PUBLIC_BUSINESS_CONFIG.businessName,
      phone: updates.phone ?? DEFAULT_PUBLIC_BUSINESS_CONFIG.phone,
      address: updates.address ?? DEFAULT_PUBLIC_BUSINESS_CONFIG.address,
      email: updates.email ?? DEFAULT_PUBLIC_BUSINESS_CONFIG.email,
      whatsapp: updates.whatsapp ?? DEFAULT_PUBLIC_BUSINESS_CONFIG.whatsapp,
      hours: { ...DEFAULT_PUBLIC_BUSINESS_CONFIG.hours, ...updates.hours },
    }),
    updatedAt,
  };
}
