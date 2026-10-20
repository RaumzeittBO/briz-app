import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

export interface PublicCustomerProfile {
    id: string;
    authUid: string;
    email: string;
    name: string;
    phone: string;
    ci: string;
    nacionalidad?: string;
    departamento?: string;
    comoNosConociste?: string;
    rentalsCount?: number;
    purchasesCount?: number;
    legacyCustomerId?: string;
    autofotoPath?: string;
}

export interface ReservationGroupInput {
    idempotencyKey: string;
    lines: Array<{ productId: string; productType: 'single' | 'combo'; quantity: number; wheelSize?: string }>;
    accessories?: Array<{ itemId: string; quantity: number }>;
    date: string;
    pickupTime: string;
    endTime?: string;
    duration: string;
    paymentMethod: 'QR' | 'Transferencia' | 'Efectivo';
    discountCode?: string;
    transport?: { delivery: boolean; pickup: boolean; address: string; lat: number; lng: number };
    adminManual?: boolean;
    adminCustomer?: { id?: string; name: string; phone: string; ci: string; email?: string; nacionalidad?: string; departamento?: string; comoNosConociste?: string };
    adminNotes?: string;
    adminPaymentStatus?: 'paid' | 'unpaid';
    adminDeliveryService?: boolean;
    adminPickupService?: boolean;
    adminMapsLink?: string;
}

export async function beginCustomerRegistration(data: Record<string, unknown>): Promise<void> {
    await httpsCallable(functions, 'beginCustomerRegistration')(data);
}

export async function createCustomerProfile(): Promise<PublicCustomerProfile> {
    const result = await httpsCallable<void, { profile: PublicCustomerProfile }>(functions, 'createCustomerProfile')();
    return result.data.profile;
}

export async function getMyRentals(): Promise<Record<string, unknown>[]> {
    const result = await httpsCallable<void, { rentals: Record<string, unknown>[] }>(functions, 'getMyRentals')();
    return result.data.rentals;
}

export async function getAdminCustomers(): Promise<Record<string, unknown>[]> {
    const customers: Record<string, unknown>[] = [];
    let cursor: string | null = null;
    do {
        const result: { data: { customers: Record<string, unknown>[]; nextCursor: string | null } } = await httpsCallable<{ cursor?: string }, { customers: Record<string, unknown>[]; nextCursor: string | null }>(functions, 'getAdminCustomers')(cursor ? { cursor } : {});
        customers.push(...result.data.customers);
        cursor = result.data.nextCursor;
    } while (cursor);
    return customers;
}

export async function createRentalGroup(input: ReservationGroupInput): Promise<{ reservationCode: string; rentalIds: string[]; total: number; duplicate: boolean }> {
    const result = await httpsCallable<ReservationGroupInput, { reservationCode: string; rentalIds: string[]; total: number; duplicate: boolean }>(functions, 'createRentalGroup')(input);
    return result.data;
}

export async function createServiceOrder(data: Record<string, unknown>): Promise<void> {
    await httpsCallable(functions, 'createServiceOrder')(data);
}

export async function provisionAdminUser(data: { uid: string; role: string; store?: string; name?: string; active?: boolean }): Promise<void> {
    await httpsCallable(functions, 'provisionAdminUser')(data);
}
