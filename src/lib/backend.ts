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

export async function completeCustomerProfile(input: { name?: string; phone?: string; ci?: string }): Promise<PublicCustomerProfile> {
    const result = await httpsCallable<typeof input, { profile: PublicCustomerProfile }>(functions, 'completeCustomerProfile')(input);
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

export interface AdminCustomerFiles {
    files: Record<'autofoto' | 'documento' | 'documentoReverso', { url: string | null; state: 'available' | 'missing' }>;
    expiresInSeconds: number;
}

export async function getAdminCustomerFiles(customerId: string): Promise<AdminCustomerFiles> {
    const result = await httpsCallable<{ customerId: string }, AdminCustomerFiles>(functions, 'getAdminCustomerFiles')({ customerId });
    return result.data;
}

export async function createRentalGroup(input: ReservationGroupInput): Promise<{ reservationCode: string; rentalIds: string[]; total: number; duplicate: boolean }> {
    const result = await httpsCallable<ReservationGroupInput, { reservationCode: string; rentalIds: string[]; total: number; duplicate: boolean }>(functions, 'createRentalGroup')(input);
    return result.data;
}

export type AdminRentalActionName = 'confirm' | 'deliver' | 'return' | 'cancel' | 'expire';
export async function runAdminRentalAction(action: AdminRentalActionName, rentalIds: string[], options: Record<string, unknown> = {}): Promise<{ ok: boolean }> {
    const result = await httpsCallable<{ action: AdminRentalActionName; rentalIds: string[] } & Record<string, unknown>, { ok: boolean }>(functions, 'adminRentalAction')({ action, rentalIds, ...options });
    return result.data;
}

export interface UpdateRentalGroupInput {
    reservationCode: string;
    rentalIds: string[];
    date: string;
    pickupTime: string;
    duration: string;
    deliveryService: boolean;
    pickupService: boolean;
    mapsLink: string;
    notes: string;
    items: Array<{ id: string; productId: string; productType: 'single' | 'combo'; quantity: number; selectedWheelSize?: string }>;
}
export async function updateRentalGroup(input: UpdateRentalGroupInput): Promise<void> {
    await httpsCallable<UpdateRentalGroupInput, { ok: boolean }>(functions, 'updateRentalGroup')(input);
}

export type RecordRentalPaymentMovementInput = {
    rentalIds: string[];
    type: 'receipt' | 'refund' | 'correction';
    amount: number;
    method: 'Efectivo' | 'QR' | 'Transferencia';
    actualAt: string;
    idempotencyKey: string;
    referenceMovementId?: string;
    reason?: string;
    confirmedReceived?: boolean;
    confirmed?: boolean;
};
export async function recordRentalPaymentMovement(input: RecordRentalPaymentMovementInput): Promise<{ movementId: string; duplicate: boolean }> {
    const result = await httpsCallable<RecordRentalPaymentMovementInput, { ok: boolean; movementId: string; duplicate: boolean }>(functions, 'recordRentalPaymentMovement')(input);
    return { movementId: result.data.movementId, duplicate: result.data.duplicate };
}

export async function createServiceOrder(data: Record<string, unknown>): Promise<void> {
    await httpsCallable(functions, 'createServiceOrder')(data);
}

export async function createBrizMaintenanceOrder(data: Record<string, unknown>): Promise<{ id: string }> {
    const result = await httpsCallable<Record<string, unknown>, { id: string }>(functions, 'createBrizMaintenanceOrder')(data);
    return result.data;
}

export async function updateBrizMaintenanceOrder(id: string, updates: Record<string, unknown>): Promise<void> {
    await httpsCallable<{ id: string; updates: Record<string, unknown> }, { ok: boolean }>(functions, 'updateBrizMaintenanceOrder')({ id, updates });
}

export async function releaseBrizMaintenanceOrder(id: string): Promise<void> {
    await httpsCallable<{ id: string }, { ok: boolean }>(functions, 'releaseBrizMaintenanceOrder')({ id });
}

export async function adjustInventoryStock(itemId: string, delta: number, wheelSize?: string): Promise<void> {
    await httpsCallable<{ itemId: string; delta: number; wheelSize?: string }, { ok: boolean }>(functions, 'adjustInventoryStock')({
        itemId, delta, ...(wheelSize ? { wheelSize } : {}),
    });
}

export async function releaseUnlinkedMaintenanceStock(data: { itemId: string; wheelSize?: string; operationId: string }): Promise<void> {
    await httpsCallable<typeof data, { ok: boolean }>(functions, 'releaseUnlinkedMaintenanceStock')(data);
}

export async function provisionAdminUser(data: { uid: string; role: string; store?: string; name?: string; active?: boolean }): Promise<void> {
    await httpsCallable(functions, 'provisionAdminUser')(data);
}
