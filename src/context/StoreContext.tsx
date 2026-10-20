import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
    collection,
    doc,
    setDoc,
    updateDoc,
    deleteDoc,
    getDoc,
    onSnapshot,
    query,
    orderBy,
    where,
    writeBatch,
    runTransaction
} from 'firebase/firestore';
import {
    browserLocalPersistence,
    browserSessionPersistence,
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    sendEmailVerification,
    sendPasswordResetEmail,
    setPersistence,
    signInWithEmailAndPassword,
    signOut,
} from 'firebase/auth';
import { auth, db, storage } from '../lib/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { cyclingRoutes as DEFAULT_ROUTES, type CyclingRoute } from '../data/mockData';
import {
    RENTAL_SEED_CATEGORIES,
    RENTAL_SEED_COMBOS,
    RENTAL_SEED_INVENTORY,
} from '../data/rentalSeedData';
import { SHOP_SEED_CATEGORIES } from '../data/shopSeedData';
import { beginCustomerRegistration, createCustomerProfile as createCustomerProfileBackend, getMyRentals as getMyRentalsBackend, getAdminCustomers as getAdminCustomersBackend, createRentalGroup as createRentalGroupBackend, createServiceOrder as createServiceOrderBackend, type ReservationGroupInput } from '../lib/backend';
import { calculateProductRentalPrice } from '../lib/rentalPricing';
import {
    getAvailableStockForInterval as calcItemStockForInterval,
    getComboAvailabilityForInterval as calcComboAvailForInterval,
    isRentalHoldingStock,
    isRentalPendingReservation,
    resolveComboComponentWheelSize
} from '../lib/rentalAvailability';

export type { CyclingRoute };

// ===========================
// TYPES
// ===========================

export interface WheelSizeEntry {
    size: string;
    stock: number;
    maintenanceStock?: number;
}

export interface InventoryItem {
    id: string;
    itemType: 'bike' | 'accessory';
    name: string;
    nameEn?: string;
    category?: string;
    store?: string;
    description: string;
    descriptionEn?: string;
    details?: string;
    detailsEn?: string;
    imageUrl: string;
    active: boolean;

    availableForRental: boolean;
    availableForSale: boolean;

    // Bikes with wheel sizes
    hasWheelSizes: boolean;
    wheelSizes?: WheelSizeEntry[];

    // Accessories with simple stock
    stock?: number;
    maintenanceStock?: number;

    // Pricing
    pricePerHour: number;
    priceFrom5thHour: number;
    pricePerDay: number;
    pricePerWeek: number;
    pricePerMonth: number;
    salePrice?: number;
    addonFlatPrice?: number;

    // Pricing tiers
    price1Hour?: number;
    price2Hours?: number;
    price3Hours?: number;
    price4Hours?: number;
    price8Hours?: number;
    price24Hours?: number;
    price1Week?: number;
    price1Month?: number;
    additionalImageUrls?: string[];
}

export interface ComboComponent {
    inventoryItemId: string;
    quantity: number;
    requiresWheelSize: boolean;
}

export interface ComboProduct {
    id: string;
    name: string;
    nameEn?: string;
    category?: string;
    secondaryCategories?: string[];
    store?: string;
    description: string;
    descriptionEn?: string;
    details?: string;
    detailsEn?: string;
    imageUrl: string;
    active: boolean;
    availableForRental: boolean;
    availableForSale: boolean;

    components: ComboComponent[];

    pricePerHour: number;
    priceFrom5thHour: number;
    pricePerDay: number;
    pricePerWeek: number;
    pricePerMonth: number;
    salePrice?: number;

    // Pricing tiers
    price1Hour?: number;
    price2Hours?: number;
    price3Hours?: number;
    price4Hours?: number;
    price8Hours?: number;
    price24Hours?: number;
    price1Week?: number;
    price1Month?: number;
    additionalImageUrls?: string[];
}

export interface RentalSettings {
    bankName: string;
    accountNumber: string;
    accountOwner: string;
    ownerCI: string;
    qrCodeUrl: string;
}

export interface ComponentSelection {
    inventoryItemId: string;
    wheelSize?: string;
}

export interface Rental {
    id: string;
    reservationCode: string;
    customerName: string;
    customerPhone: string;
    customerCI: string;
    customerEmail?: string;
    customerAddress?: string;
    autofotoUrl?: string;
    documentoUrl?: string;
    documentoReversoUrl?: string;

    productType: 'single' | 'combo';
    productId: string;
    productName: string;
    productNameSnapshot?: string;

    selectedWheelSize?: string;
    componentSelections?: ComponentSelection[];

    quantity: number;
    duration: string;
    date: string;
    pickupTime: string;
    endTime?: string;
    total: number;
    amountPaid?: number;
    lateFee?: number;
    extensionFee?: number;
    paymentMethod: string;
    paymentStatus: 'unpaid' | 'pending_review' | 'paid';
    notes: string;

    status:
        | 'pending'
        | 'confirmed'
        | 'delivered'
        | 'cancelled'
        | 'expired'
        | 'returned'
        | 'Pendiente'
        | 'Confirmado'
        | 'Entregado'
        | 'Cancelado'
        | 'Devuelto';
    createdAt: string;
    updatedAt: string;
    deliveredAt?: string;
    returnedAt?: string;
    damagedOnReturn?: boolean;
    returnConditionNotes?: string;
    lastUpdatedBy?: string;
    paymentProofUrl?: string;

    createdDate?: string;

    mapsLink?: string;
    deliveryService?: boolean;
    pickupService?: boolean;
    source?: 'web' | 'manual';
    store?: string;
}

export interface SaleItem {
    id?: string;
    name: string;
    price: number;
    quantity: number;
    wheelSize?: string;
    image?: string;
}

export interface Sale {
    id: string;
    customerName: string;
    customerPhone: string;
    customerCI: string;
    items: SaleItem[];
    total: number;
    status: 'Pendiente' | 'Completado' | 'Cancelado';
    paymentMethod: string;
    notes?: string;
    source?: string;
    store?: string;
    date: string;
}

export interface Customer {
    id: string;
    name: string;
    phone: string;
    ci: string;
    rentalsCount: number;
    purchasesCount: number;
    firstVisit: string;
    lastVisit: string;
    notes: string;

    // New customer fields
    email?: string;
    password?: string;
    nacionalidad?: string;
    departamento?: string;
    comoNosConociste?: string;
    autofotoUrl?: string;
    documentoUrl?: string;
    documentoReversoUrl?: string;
    store?: string;
}

export interface ServiceOrder {
    id: string;
    customer: string;
    phone: string;
    bikeType: string;
    issue: string;
    status: 'Recibido' | 'En revisión' | 'En reparación' | 'Listo' | 'Entregado' | 'En revisiÃ³n' | 'En reparaciÃ³n';
    estimatedDelivery: string;
    costEstimate: number;
    notes: string;
    bikeImageUrl?: string;
    date: string;
}

export interface EventSubcategory {
    name: string;
    images: string[];
}

export interface EventItem {
    id: string;
    name: string;
    nameEn?: string;
    description: string;
    descriptionEn?: string;
    subcategories: EventSubcategory[];
    price?: number;
    images?: string[];
}

export interface ReturnRentalOptions {
    damagedUnits?: number;
    conditionNotes?: string;
    lateFee?: number;
    actor?: string;
}

const LOCAL_ROUTES_KEY = 'briz_local_routes';
const LOCAL_RENTAL_SETTINGS_KEY = 'briz_rental_settings';

function mergeRoutes(remoteRoutes: CyclingRoute[], localRoutes: CyclingRoute[]) {
    const byId = new Map<string, CyclingRoute>();
    remoteRoutes.forEach(route => byId.set(route.id, route));
    localRoutes.forEach(route => byId.set(route.id, route));
    return Array.from(byId.values());
}

interface StoreContextType {
    inventory: InventoryItem[];
    combos: ComboProduct[];
    rentals: Rental[];
    sales: Sale[];
    customers: Customer[];
    serviceOrders: ServiceOrder[];
    routes: CyclingRoute[];
    events: EventItem[];
    bikeCategories: string[];
    shopCategories: string[];
    isLoaded: boolean;
    rentalSettings: RentalSettings;
    updateRentalSettings: (updates: Partial<RentalSettings>, qrFile: File | null) => Promise<void>;

    // Routes CRUD
    addRoute: (route: CyclingRoute) => Promise<void>;
    updateRoute: (id: string, updates: Partial<CyclingRoute>) => Promise<void>;
    deleteRoute: (id: string) => Promise<void>;

    // Events CRUD
    addEvent: (event: EventItem) => Promise<void>;
    updateEvent: (id: string, updates: Partial<EventItem>) => Promise<void>;
    deleteEvent: (id: string) => Promise<void>;

    // Bike Categories CRUD
    addBikeCategory: (category: string) => Promise<void>;
    deleteBikeCategory: (category: string) => Promise<void>;
    updateBikeCategory: (oldCategory: string, newCategory: string) => Promise<void>;
    reorderBikeCategories: (categories: string[]) => Promise<void>;

    // Shop Categories CRUD
    addShopCategory: (category: string) => Promise<void>;
    deleteShopCategory: (category: string) => Promise<void>;
    updateShopCategory: (oldCategory: string, newCategory: string) => Promise<void>;
    reorderShopCategories: (categories: string[]) => Promise<void>;

    // Inventory CRUD
    addInventoryItem: (item: InventoryItem) => Promise<void>;
    updateInventoryItem: (id: string, item: Partial<InventoryItem>) => Promise<void>;
    deleteInventoryItem: (id: string) => Promise<void>;

    // Combo CRUD
    addCombo: (combo: ComboProduct) => Promise<void>;
    updateCombo: (id: string, combo: Partial<ComboProduct>) => Promise<void>;
    deleteCombo: (id: string) => Promise<void>;

    // Rental CRUD & Group Atomic Operations
    confirmRental: (id: string, actor?: string) => Promise<boolean>;
    confirmRentalGroup: (ids: string[], actor?: string) => Promise<{ ok: boolean; error?: string }>;
    deliverRentalGroup: (ids: string[], actor?: string) => Promise<void>;
    cancelRental: (id: string, actor?: string) => Promise<void>;
    cancelRentalGroup: (ids: string[], actor?: string) => Promise<void>;
    returnRental: (id: string, actor?: string, options?: ReturnRentalOptions) => Promise<void>;
    returnRentalGroup: (ids: string[], actor?: string, options?: ReturnRentalOptions) => Promise<void>;
    deleteRental: (id: string) => Promise<void>;
    deleteRentalGroup: (ids: string[]) => Promise<void>;
    updateRental: (id: string, updates: Partial<Rental>, actor?: string) => Promise<void>;
    updateRentalPaymentStatus: (id: string, paymentStatus: Rental['paymentStatus'], actor?: string) => Promise<void>;
    markRentalExpired: (id: string, actor?: string) => Promise<void>;

    // Sale CRUD
    addSale: (s: Omit<Sale, 'id' | 'date' | 'status'>) => Promise<void>;
    updateSaleStatus: (id: string, status: Sale['status']) => Promise<void>;
    deleteSale: (id: string) => Promise<void>;

    // Customer CRUD
    addOrUpdateCustomer: (c: { name: string; phone: string; ci: string }, isPurchase: boolean) => Promise<void>;
    updateCustomer: (id: string, c: Partial<Customer>) => Promise<void>;
    deleteCustomer: (id: string) => Promise<void>;
    verifyCustomerRecovery: (email: string) => Promise<boolean>;
    getMyRentalHistory: () => Promise<Rental[]>;
    createRentalGroup: (input: ReservationGroupInput) => Promise<{ reservationCode: string; rentalIds: string[]; total: number; duplicate: boolean }>;

    // Service Order CRUD
    addServiceOrder: (so: Omit<ServiceOrder, 'id' | 'date'>) => Promise<void>;
    updateServiceOrder: (id: string, so: Partial<ServiceOrder>) => Promise<void>;
    deleteServiceOrder: (id: string) => Promise<void>;

    // Helpers
    getItemStock: (itemId: string, wheelSize?: string) => number;
    getComboAvailability: (comboId: string, wheelSize?: string) => number;
    getAvailableStockForInterval: (
        itemId: string,
        wheelSize?: string,
        date?: string,
        pickupTime?: string,
        duration?: string | number,
        excludeReservationCode?: string,
        includePendingReservations?: boolean
    ) => number;
    getComboAvailabilityForInterval: (
        comboId: string,
        wheelSize?: string,
        date?: string,
        pickupTime?: string,
        duration?: string | number,
        excludeReservationCode?: string,
        includePendingReservations?: boolean
    ) => number;
    calculatePrice: (productType: 'single' | 'combo', productId: string, duration: string, quantity: number) => number;

    resetAllData: () => Promise<void>;

    // Customer Authentication state & methods
    currentCustomer: Customer | null;
    loginCustomer: (email: string, password: string, remember: boolean) => Promise<Customer | null>;
    registerCustomer: (
        customerData: Omit<Customer, 'id' | 'rentalsCount' | 'purchasesCount' | 'firstVisit' | 'lastVisit' | 'notes'>,
        selfieBlob: Blob | null,
        docFileAnverso: File | null,
        docFileReverso: File | null,
        remember: boolean
    ) => Promise<Customer>;
    logoutCustomer: () => void;
    adminNavigationLinks: any[];
    updateAdminNavigationLinks: (links: any[]) => Promise<void>;
}

export const StoreContext = createContext<StoreContextType | null>(null);

function customerFromPublicProfile(profile: {
    id: string; email: string; name: string; phone: string; ci: string;
    nacionalidad?: string; departamento?: string; comoNosConociste?: string;
    rentalsCount?: number; purchasesCount?: number;
}): Customer {
    return {
        id: profile.id, email: profile.email, name: profile.name, phone: profile.phone, ci: profile.ci,
        nacionalidad: profile.nacionalidad, departamento: profile.departamento,
        comoNosConociste: profile.comoNosConociste,
        rentalsCount: Number(profile.rentalsCount) || 0,
        purchasesCount: Number(profile.purchasesCount) || 0,
        firstVisit: '', lastVisit: '', notes: '',
    };
}

function fileExtension(file: File): string {
    const extension = file.name.split('.').pop()?.toLowerCase() || (file.type === 'application/pdf' ? 'pdf' : 'jpg');
    return /^[a-z0-9]{1,8}$/.test(extension) ? extension : 'jpg';
}

export const useStore = () => {
    const context = useContext(StoreContext);
    if (!context) throw new Error('useStore must be used within StoreProvider');
    return context;
};

// ===========================
// DEFAULT SEED DATA
// ===========================

const DEFAULT_INVENTORY: InventoryItem[] = RENTAL_SEED_INVENTORY;
const DEFAULT_COMBOS: ComboProduct[] = RENTAL_SEED_COMBOS;

export const DEFAULT_ADMIN_LINKS = [
    { key: 'dashboard', label: 'Dashboard', href: '/admin', icon: 'LayoutDashboard' },
    { key: 'rentals', label: 'Alquileres', href: '/admin/rentals', icon: 'Bike' },
    { key: 'shop', label: 'Tienda', href: '/admin/shop', icon: 'ShoppingBag' },
    { key: 'events', label: 'Eventos', href: '/admin/events', icon: 'Calendar' },
    { key: 'inventory', label: 'Inventario', href: '/admin/inventory', icon: 'Package' },
    { key: 'sales', label: 'Ventas', href: '/admin/sales', icon: 'ShoppingCart' },
    { key: 'service', label: 'Servicio', href: '/admin/service', icon: 'Wrench' },
    { key: 'customers', label: 'Clientes', href: '/admin/customers', icon: 'Users' },
    { key: 'routes', label: 'Ciclotours', href: '/admin/routes', icon: 'MapPinned' },
    { key: 'community', label: 'Comunidad', href: '/admin/community', icon: 'MessagesSquare' },
    { key: 'reports', label: 'Reportes', href: '/admin/reports', icon: 'BarChart3' },
    { key: 'settings', label: 'Configuración', href: '/admin/settings', icon: 'Settings' }
];

export const StoreProvider = ({ children }: { children: React.ReactNode }) => {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [combos, setCombos] = useState<ComboProduct[]>([]);
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [sales, setSales] = useState<Sale[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
    const [routes, setRoutes] = useState<CyclingRoute[]>([]);
    const [events, setEvents] = useState<EventItem[]>([]);
    const [localRoutes, setLocalRoutes] = useState<CyclingRoute[]>(() => safeJSON<CyclingRoute[]>(LOCAL_ROUTES_KEY, []));
    const [bikeCategories, setBikeCategories] = useState<string[]>([]);
    const [shopCategories, setShopCategories] = useState<string[]>([]);
    const [adminNavigationLinks, setAdminNavigationLinks] = useState<any[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isAdminSession, setIsAdminSession] = useState(false);
    const [adminStoreScope, setAdminStoreScope] = useState<string>('all');

    const [rentalSettings, setRentalSettings] = useState<RentalSettings>(() => safeJSON<RentalSettings>(LOCAL_RENTAL_SETTINGS_KEY, {
        bankName: 'Banco Nacional de Bolivia (BNB)',
        accountNumber: '3501818797',
        accountOwner: 'Litzy Jhoselyn Gutierrez Jarillo',
        ownerCI: '9399367 CB',
        qrCodeUrl: '/images/qr_pago.png'
    }));

    // Customer Session state
    const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);

    // Only active, explicitly registered staff can subscribe to private collections.
    useEffect(() => {
        const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
            setIsAdminSession(false);
            setAdminStoreScope('all');
            setCurrentCustomer(null);
            localStorage.removeItem('briz_logged_customer');
            if (!fbUser) return;
            try {
                const adminSnapshot = await getDoc(doc(db, 'adminUsers', fbUser.uid));
                const adminData = adminSnapshot.exists() ? adminSnapshot.data() : null;
                const allowedRole = ['admin', 'manager', 'mechanic', 'viewer'].includes(String(adminData?.role));
                if (adminData?.active === true && allowedRole) {
                    setIsAdminSession(true);
                    setAdminStoreScope(String(adminData.store || 'all'));
                }
            } catch {
                // Customer accounts are not allowed to read admin authorization records.
            }
            if (fbUser.emailVerified) {
                try {
                    const profileSnap = await getDoc(doc(db, 'customerProfiles', fbUser.uid));
                    if (profileSnap.exists()) {
                        const profile = profileSnap.data();
                        setCurrentCustomer({
                            id: fbUser.uid,
                            name: String(profile.name || ''),
                            phone: String(profile.phone || ''),
                            ci: String(profile.ci || ''),
                            email: String(profile.email || fbUser.email || ''),
                            nacionalidad: String(profile.nacionalidad || ''),
                            departamento: String(profile.departamento || ''),
                            comoNosConociste: String(profile.comoNosConociste || ''),
                            rentalsCount: Number(profile.rentalsCount) || 0,
                            purchasesCount: Number(profile.purchasesCount) || 0,
                            firstVisit: '',
                            lastVisit: '',
                            notes: '',
                        });
                    }
                } catch {
                    // A verified account with an incomplete registration remains signed in without a profile.
                }
            }
        });
        return unsubAuth;
    }, []);

    useEffect(() => {
        const refreshLocalRoutes = () => {
            setLocalRoutes(safeJSON<CyclingRoute[]>(LOCAL_ROUTES_KEY, []));
        };
        const handleStorage = (event: StorageEvent) => {
            if (event.key === LOCAL_ROUTES_KEY) refreshLocalRoutes();
        };
        window.addEventListener('storage', handleStorage);
        window.addEventListener('briz_local_routes_updated', refreshLocalRoutes);
        return () => {
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener('briz_local_routes_updated', refreshLocalRoutes);
        };
    }, []);

    // Seeding methods
    const seedDefaultInventory = async () => {
        try {
            const batch = writeBatch(db);
            DEFAULT_INVENTORY.forEach(item => {
                batch.set(doc(db, 'inventory', item.id), item);
            });
            await batch.commit();
        } catch (e) {
            console.error('Failed to seed default inventory:', e);
        }
    };

    const seedDefaultCombos = async () => {
        try {
            const batch = writeBatch(db);
            DEFAULT_COMBOS.forEach(combo => {
                batch.set(doc(db, 'combos', combo.id), combo);
            });
            await batch.commit();
        } catch (e) {
            console.error('Failed to seed default combos:', e);
        }
    };

    const seedDefaultRoutes = async () => {
        try {
            const batch = writeBatch(db);
            DEFAULT_ROUTES.forEach(route => {
                batch.set(doc(db, 'routes', route.id), {
                    ...route,
                    mapUrl: 'https://maps.google.com'
                });
            });
            await batch.commit();
        } catch (e) {
            console.error('Failed to seed default routes:', e);
        }
    };

    // ---- Real-time Sync (Public Catalog & Settings) ----
    useEffect(() => {
        const unsubInv = onSnapshot(query(collection(db, 'inventory')), (snap) => {
            setInventory(snap.docs.map(d => ({ ...d.data() } as InventoryItem)));
            if (snap.empty) {
                seedDefaultInventory();
            }
        });
        const unsubCombos = onSnapshot(query(collection(db, 'combos')), (snap) => {
            setCombos(snap.docs.map(d => ({ ...d.data() } as ComboProduct)));
            if (snap.empty) {
                seedDefaultCombos();
            }
        });
        const unsubSettings = onSnapshot(doc(db, 'settings', 'rental_settings'), (snap) => {
            if (snap.exists()) {
                const remoteSettings = snap.data() as RentalSettings;
                setRentalSettings(remoteSettings);
                localStorage.setItem(LOCAL_RENTAL_SETTINGS_KEY, JSON.stringify(remoteSettings));
            }
        }, (error) => {
            console.error('Error fetching rental settings:', error);
        });
        const unsubRoutes = onSnapshot(query(collection(db, 'routes')), (snap) => {
            setRoutes(snap.docs.map(d => ({ ...d.data() } as CyclingRoute)));
            if (snap.empty) {
                seedDefaultRoutes();
            }
        }, (error) => {
            console.error('Error fetching routes:', error);
        });
        const unsubBikeCats = onSnapshot(doc(db, 'settings', 'bike_categories'), (snap) => {
            if (snap.exists()) {
                setBikeCategories(snap.data().categories || []);
            } else {
                const defaults = RENTAL_SEED_CATEGORIES;
                setDoc(doc(db, 'settings', 'bike_categories'), { categories: defaults }).catch(() => undefined);
                setBikeCategories(defaults);
            }
        }, (error) => {
            console.error('Error fetching bike categories:', error);
        });

        const unsubShopCats = onSnapshot(doc(db, 'settings', 'shop_categories'), (snap) => {
            if (snap.exists()) {
                const cats = snap.data().categories || [];
                if (cats.includes('Bicicletas') && cats.includes('Indumentaria') && !cats.includes('Bicicletas plegables')) {
                    const defaults = SHOP_SEED_CATEGORIES;
                    setDoc(doc(db, 'settings', 'shop_categories'), { categories: defaults }).catch(() => undefined);
                    setShopCategories(defaults);
                } else {
                    setShopCategories(cats);
                }
            } else {
                const defaults = SHOP_SEED_CATEGORIES;
                setDoc(doc(db, 'settings', 'shop_categories'), { categories: defaults }).catch(() => undefined);
                setShopCategories(defaults);
            }
        }, (error) => {
            console.error('Error fetching shop categories:', error);
        });

        const unsubAdminNav = onSnapshot(doc(db, 'settings', 'admin_navigation'), (snap) => {
            if (snap.exists()) {
                setAdminNavigationLinks(snap.data().links || DEFAULT_ADMIN_LINKS);
            } else {
                setDoc(doc(db, 'settings', 'admin_navigation'), { links: DEFAULT_ADMIN_LINKS }).catch(() => undefined);
                setAdminNavigationLinks(DEFAULT_ADMIN_LINKS);
            }
        }, (error) => {
            console.error('Error fetching admin navigation links:', error);
        });

        const unsubEvents = onSnapshot(query(collection(db, 'events')), (snap) => {
            setEvents(snap.docs.map(d => ({ ...d.data() } as EventItem)));
        }, (error) => {
            console.error('Error fetching events:', error);
        });

        setIsLoaded(true);
        return () => {
            unsubInv();
            unsubCombos();
            unsubSettings();
            unsubRoutes();
            unsubBikeCats();
            unsubShopCats();
            unsubAdminNav();
            unsubEvents();
        };
    }, []);

    // ---- Real-time Sync (public sanitized slots and scoped admin collections) ----
    useEffect(() => {
        const rentalsRef = collection(db, 'rentals');
        const publicSlotsRef = collection(db, 'rentals_busy_slots');
        const rentalQuery = isAdminSession
            ? (adminStoreScope === 'all'
                ? query(rentalsRef, orderBy('createdDate', 'desc'))
                : query(rentalsRef, where('store', '==', adminStoreScope), orderBy('createdDate', 'desc')))
            : null;
        const unsubRentals = onSnapshot(
            rentalQuery || publicSlotsRef,
            (snap) => {
                if (isAdminSession) {
                    setRentals(snap.docs.map(d => ({ ...d.data(), id: d.id } as Rental)));
                    return;
                }
                const publicRentals = snap.docs.map((d) => {
                    const slot = d.data();
                    const start = new Date(Number(slot.startMs));
                    const end = new Date(Number(slot.endMs));
                    const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz' }).format(start);
                    const timeParts = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/La_Paz', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(start);
                    const endParts = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/La_Paz', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(end);
                    const pickupTime = `${timeParts.find(p => p.type === 'hour')?.value || '00'}:${timeParts.find(p => p.type === 'minute')?.value || '00'}`;
                    const endTime = `${endParts.find(p => p.type === 'hour')?.value || '00'}:${endParts.find(p => p.type === 'minute')?.value || '00'}`;
                    const durationHours = Math.max(1, Math.round((Number(slot.endMs) - Number(slot.startMs)) / 3_600_000));
                    const item = inventory.find(candidate => candidate.id === slot.itemId);
                    return {
                        id: d.id,
                        reservationCode: `public_${d.id}`,
                        customerName: 'Reservado', customerPhone: '', customerCI: '',
                        productType: 'single' as const,
                        productId: String(slot.itemId || ''),
                        productName: item?.name || 'Reservado',
                        quantity: Number(slot.quantity) || 0,
                        selectedWheelSize: String(slot.wheelSize || ''),
                        duration: `${durationHours} horas`, date, pickupTime, endTime,
                        startTimestamp: Number(slot.startMs), endTimestamp: Number(slot.endMs),
                        total: 0, paymentMethod: '', paymentStatus: 'unpaid' as const,
                        notes: '', status: String(slot.status || 'pending') as Rental['status'],
                        createdAt: '', updatedAt: '',
                    } as Rental;
                });
                setRentals(publicRentals);
            },
            () => setRentals([])
        );

        let unsubSales: (() => void) | undefined;
        let customerLoadCancelled = false;
        let unsubSO: (() => void) | undefined;

        if (isAdminSession) {
            const salesQuery = adminStoreScope === 'all'
                ? query(collection(db, 'sales'), orderBy('date', 'desc'))
                : query(collection(db, 'sales'), where('store', '==', adminStoreScope), orderBy('date', 'desc'));
            const serviceOrdersQuery = adminStoreScope === 'all'
                ? query(collection(db, 'serviceOrders'), orderBy('date', 'desc'))
                : query(collection(db, 'serviceOrders'), where('store', '==', adminStoreScope), orderBy('date', 'desc'));
            unsubSales = onSnapshot(
                salesQuery,
                (snap) => setSales(snap.docs.map(d => ({ ...d.data() } as Sale))),
                (err) => console.error('Error fetching sales:', err)
            );
            getAdminCustomersBackend()
                .then((records) => { if (!customerLoadCancelled) setCustomers(records as unknown as Customer[]); })
                .catch((err) => console.error('Error fetching sanitized customers:', err));
            unsubSO = onSnapshot(
                serviceOrdersQuery,
                (snap) => setServiceOrders(snap.docs.map(d => ({ ...d.data() } as ServiceOrder))),
                (err) => console.error('Error fetching service orders:', err)
            );
        } else {
            setSales([]);
            setCustomers([]);
            setServiceOrders([]);
        }

        return () => {
            unsubRentals();
            if (unsubSales) unsubSales();
            customerLoadCancelled = true;
            if (unsubSO) unsubSO();
        };
    }, [isAdminSession, adminStoreScope, inventory]);

    // ---- One-time Migration from LocalStorage ----
    useEffect(() => {
        const migrate = async () => {
            const hasMigrated = localStorage.getItem('briz_migrated_v1');
            if (hasMigrated === 'true') return;

            const localInv = safeJSON<InventoryItem[]>('briz_inventory', []);
            if (localInv.length > 0) {
                const batch = writeBatch(db);
                localInv.forEach(item => {
                    batch.set(doc(db, 'inventory', item.id), item);
                });
                await batch.commit();
            }
            localStorage.setItem('briz_migrated_v1', 'true');
        };
        if (isLoaded) migrate();
    }, [isLoaded]);

    const generateId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // STOCK HELPERS
    const getItemStock = (itemId: string, wheelSize?: string): number => {
        const item = inventory.find(i => i.id === itemId);
        if (!item) return 0;
        if (item.hasWheelSizes && item.wheelSizes) {
            if (!wheelSize) return item.wheelSizes.reduce((sum, ws) => sum + Math.max(0, ws.stock || 0), 0);
            return Math.max(0, item.wheelSizes.find(w => w.size === wheelSize)?.stock ?? 0);
        }
        return Math.max(0, item.stock ?? 0);
    };

    const getComboAvailability = (comboId: string, wheelSize?: string): number => {
        const combo = combos.find(c => c.id === comboId);
        if (!combo || combo.components.length === 0) return 0;
        let minAvail = Infinity;
        for (const comp of combo.components) {
            const item = inventory.find(i => i.id === comp.inventoryItemId);
            if (!item) return 0;
            const ws = (comp.requiresWheelSize || item.hasWheelSizes) ? wheelSize : undefined;
            const itemStock = getItemStock(item.id, ws);
            const possible = Math.floor(itemStock / Math.max(1, comp.quantity));
            minAvail = Math.min(minAvail, possible);
        }
        return minAvail === Infinity ? 0 : Math.max(0, minAvail);
    };

    const getAvailableStockForInterval = (
        itemId: string,
        wheelSize?: string,
        date?: string,
        pickupTime?: string,
        duration?: string | number,
        excludeReservationCode?: string,
    includePendingReservations: boolean = true
    ): number => {
        return calcItemStockForInterval({
            inventory,
            combos,
            rentals,
            itemId,
            wheelSize,
            date,
            pickupTime,
            duration,
            excludeReservationCode,
            includePendingReservations
        });
    };

    const getComboAvailabilityForInterval = (
        comboId: string,
        wheelSize?: string,
        date?: string,
        pickupTime?: string,
        duration?: string | number,
        excludeReservationCode?: string,
        includePendingReservations: boolean = true
    ): number => {
        return calcComboAvailForInterval({
            inventory,
            combos,
            rentals,
            comboId,
            wheelSize,
            date,
            pickupTime,
            duration,
            excludeReservationCode,
            includePendingReservations
        });
    };

    // CENTRALIZED PRICE CALCULATOR
    const calculatePrice = (productType: 'single' | 'combo', productId: string, duration: string, quantity: number): number => {
        const pricing = productType === 'single'
            ? inventory.find(i => i.id === productId)
            : combos.find(c => c.id === productId);
        return calculateProductRentalPrice(pricing, duration, quantity);
    };

    // Customer passwords are handled only by Firebase Authentication.
    const loginCustomer = async (email: string, password: string, remember: boolean): Promise<Customer | null> => {
        await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
        const credential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
        if (!credential.user.emailVerified) {
            await signOut(auth);
            throw new Error('Verifica tu correo electrónico con el enlace que te enviamos antes de iniciar sesión.');
        }
        const profile = await createCustomerProfileBackend();
        const customer = customerFromPublicProfile(profile);
        setCurrentCustomer(customer);
        return customer;
    };

    const verifyCustomerRecovery = async (email: string): Promise<boolean> => {
        const cleanEmail = email.toLowerCase().trim();
        if (!cleanEmail) return false;
        // Firebase applies abuse controls and does not reveal whether an address has an account.
        await sendPasswordResetEmail(auth, cleanEmail).catch(() => undefined);
        return true;
    };

    const registerCustomer = async (
        customerData: Omit<Customer, 'id' | 'rentalsCount' | 'purchasesCount' | 'firstVisit' | 'lastVisit' | 'notes'>,
        selfieBlob: Blob | null,
        docFileAnverso: File | null,
        docFileReverso: File | null,
        remember: boolean
    ): Promise<Customer> => {
        const cleanEmail = customerData.email?.trim().toLowerCase() || '';
        if (!cleanEmail || !customerData.password) throw new Error('El correo y la contraseña son obligatorios.');
        if (!selfieBlob || !docFileAnverso || !docFileReverso) throw new Error('Adjunta la foto y ambos lados del documento.');
        const id = `cust_pending_${Date.now()}`;
        let authCreated = false;
        try {
            await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
            const credential = await createUserWithEmailAndPassword(auth, cleanEmail, customerData.password);
            authCreated = true;
            const uid = credential.user.uid;
            const files = [
                { name: 'selfie.jpg', blob: selfieBlob, contentType: selfieBlob.type || 'image/jpeg' },
                { name: `document-front.${fileExtension(docFileAnverso)}`, blob: docFileAnverso, contentType: docFileAnverso.type || 'application/octet-stream' },
                { name: `document-back.${fileExtension(docFileReverso)}`, blob: docFileReverso, contentType: docFileReverso.type || 'application/octet-stream' },
            ];
            const privatePaths: Record<string, string> = {};
            for (const file of files) {
                const path = `customerUploads/${uid}/${file.name}`;
                await uploadBytes(storageRef(storage, path), file.blob, { contentType: file.contentType });
                if (file.name === 'selfie.jpg') privatePaths.autofotoPath = path;
                else if (file.name.startsWith('document-front.')) privatePaths.documentoPath = path;
                else privatePaths.documentoReversoPath = path;
            }
            await beginCustomerRegistration({
                name: customerData.name,
                phone: customerData.phone,
                ci: customerData.ci,
                nacionalidad: customerData.nacionalidad || '',
                departamento: customerData.departamento || '',
                comoNosConociste: customerData.comoNosConociste || '',
                ...privatePaths,
            });
            await sendEmailVerification(credential.user);
            await signOut(auth);
            setCurrentCustomer(null);
            return {
                id,
                name: customerData.name,
                phone: customerData.phone,
                ci: customerData.ci,
                email: cleanEmail,
                rentalsCount: 0, purchasesCount: 0, firstVisit: '', lastVisit: '', notes: '',
            };
        } catch (error) {
            if (authCreated && auth.currentUser) await signOut(auth).catch(() => undefined);
            throw error;
        }
    };

    const logoutCustomer = async () => {
        await signOut(auth);
        setCurrentCustomer(null);
        localStorage.removeItem('briz_logged_customer');
    };

    const customerUid = currentCustomer?.id;
    const getMyRentalHistory = useCallback(async (): Promise<Rental[]> => {
        if (!customerUid) return [];
        const history = await getMyRentalsBackend();
        return history as unknown as Rental[];
    }, [customerUid]);

    const createRentalGroup = (input: ReservationGroupInput) => createRentalGroupBackend(input);

    // CRUD ACTIONS
    const addInventoryItem = async (item: InventoryItem) => {
        await setDoc(doc(db, 'inventory', item.id), item);
    };
    const updateInventoryItem = async (id: string, updates: Partial<InventoryItem>) => {
        await updateDoc(doc(db, 'inventory', id), updates);
    };
    const deleteInventoryItem = async (id: string) => {
        await deleteDoc(doc(db, 'inventory', id));
    };

    const addEvent = async (event: EventItem) => {
        await setDoc(doc(db, 'events', event.id), event);
    };
    const updateEvent = async (id: string, updates: Partial<EventItem>) => {
        await updateDoc(doc(db, 'events', id), updates);
    };
    const deleteEvent = async (id: string) => {
        await deleteDoc(doc(db, 'events', id));
    };

    const saveLocalRoutes = (updater: (current: CyclingRoute[]) => CyclingRoute[]) => {
        setLocalRoutes(current => {
            const next = updater(current);
            localStorage.setItem(LOCAL_ROUTES_KEY, JSON.stringify(next));
            window.setTimeout(() => window.dispatchEvent(new Event('briz_local_routes_updated')), 0);
            return next;
        });
    };

    const addRoute = async (route: CyclingRoute) => {
        try {
            await setDoc(doc(db, 'routes', route.id), route);
            saveLocalRoutes(current => current.filter(r => r.id !== route.id));
        } catch (error) {
            console.warn('Firestore routes write failed; saving route locally:', error);
            saveLocalRoutes(current => [...current.filter(r => r.id !== route.id), route]);
        }
    };
    const updateRoute = async (id: string, updates: Partial<CyclingRoute>) => {
        const existing = mergeRoutes(routes, localRoutes).find(route => route.id === id);
        try {
            await updateDoc(doc(db, 'routes', id), updates);
            saveLocalRoutes(current => current.filter(r => r.id !== id));
        } catch (error) {
            console.warn('Firestore routes update failed; saving route locally:', error);
            if (existing) {
                saveLocalRoutes(current => [
                    ...current.filter(r => r.id !== id),
                    { ...existing, ...updates, id }
                ]);
            }
        }
    };
    const deleteRoute = async (id: string) => {
        try {
            await deleteDoc(doc(db, 'routes', id));
        } catch (error) {
            console.warn('Firestore routes delete failed; deleting local fallback only:', error);
        }
        saveLocalRoutes(current => current.filter(r => r.id !== id));
    };

    const addBikeCategory = async (cat: string) => {
        const trimmed = cat.trim();
        if (trimmed && !bikeCategories.includes(trimmed)) {
            const updated = [...bikeCategories, trimmed];
            await setDoc(doc(db, 'settings', 'bike_categories'), { categories: updated });
        }
    };
    const deleteBikeCategory = async (cat: string) => {
        const updated = bikeCategories.filter(c => c !== cat);
        await setDoc(doc(db, 'settings', 'bike_categories'), { categories: updated });
    };
    const updateBikeCategory = async (oldCat: string, newCat: string) => {
        const trimmedOld = oldCat.trim();
        const trimmedNew = newCat.trim();
        if (!trimmedNew || trimmedOld === trimmedNew) return;

        const updated = bikeCategories.map(c => c === trimmedOld ? trimmedNew : c);
        await setDoc(doc(db, 'settings', 'bike_categories'), { categories: updated });

        const itemsToUpdate = inventory.filter(i => i.category === trimmedOld);
        for (const item of itemsToUpdate) {
            await updateInventoryItem(item.id, { category: trimmedNew });
        }

        const combosToUpdate = combos.filter(c => c.category === trimmedOld);
        for (const combo of combosToUpdate) {
            await updateCombo(combo.id, { category: trimmedNew });
        }
    };
    const reorderBikeCategories = async (nextCategories: string[]) => {
        await setDoc(doc(db, 'settings', 'bike_categories'), { categories: nextCategories });
        setBikeCategories(nextCategories);
    };

    const addShopCategory = async (cat: string) => {
        const trimmed = cat.trim();
        if (trimmed && !shopCategories.includes(trimmed)) {
            const updated = [...shopCategories, trimmed];
            await setDoc(doc(db, 'settings', 'shop_categories'), { categories: updated });
            setShopCategories(updated);
        }
    };
    const deleteShopCategory = async (cat: string) => {
        const updated = shopCategories.filter(c => c !== cat);
        await setDoc(doc(db, 'settings', 'shop_categories'), { categories: updated });
        setShopCategories(updated);
    };
    const updateShopCategory = async (oldCat: string, newCat: string) => {
        const trimmedOld = oldCat.trim();
        const trimmedNew = newCat.trim();
        if (!trimmedNew || trimmedOld === trimmedNew) return;

        const updated = shopCategories.map(c => c === trimmedOld ? trimmedNew : c);
        await setDoc(doc(db, 'settings', 'shop_categories'), { categories: updated });
        setShopCategories(updated);

        const itemsToUpdate = inventory.filter(i => i.category === trimmedOld);
        for (const item of itemsToUpdate) {
            await updateInventoryItem(item.id, { category: trimmedNew });
        }

        const combosToUpdate = combos.filter(c => c.category === trimmedOld);
        for (const combo of combosToUpdate) {
            await updateCombo(combo.id, { category: trimmedNew });
        }
    };
    const reorderShopCategories = async (nextCategories: string[]) => {
        await setDoc(doc(db, 'settings', 'shop_categories'), { categories: nextCategories });
        setShopCategories(nextCategories);
    };

    const addCombo = async (combo: ComboProduct) => {
        await setDoc(doc(db, 'combos', combo.id), combo);
    };
    const updateCombo = async (id: string, updates: Partial<ComboProduct>) => {
        await updateDoc(doc(db, 'combos', id), updates);
    };
    const deleteCombo = async (id: string) => {
        await deleteDoc(doc(db, 'combos', id));
    };

    /**
     * Atomic group confirmation:
     * Validates and deducts stock for ALL pending items in the reservation group at once.
     * If any item in the group lacks stock, NO item is deducted or confirmed.
     */
    const confirmRentalGroup = async (ids: string[], actor?: string): Promise<{ ok: boolean; error?: string }> => {
        const targetIds = Array.from(new Set(ids)).filter(Boolean);
        if (targetIds.length === 0) return { ok: false, error: 'No se especificaron ítems para confirmar.' };

        try {
            await runTransaction(db, async (tx) => {
                // 1. Read all rental docs in transaction
                const rentalDocs = await Promise.all(targetIds.map(id => tx.get(doc(db, 'rentals', id))));
                const pendingRentals: Rental[] = [];

                for (const rSnap of rentalDocs) {
                    if (!rSnap.exists()) continue;
                    const rData = rSnap.data() as Rental;
                    if (isRentalPendingReservation(rData.status)) {
                        pendingRentals.push({ ...rData, id: rSnap.id });
                    }
                }

                if (pendingRentals.length === 0) {
                    return; // Already confirmed or nothing pending
                }

                // 2. Collect all required inventory item IDs across all rentals in the group
                const requiredItemIds = new Set<string>();
                for (const rental of pendingRentals) {
                    if (rental.productId.startsWith('srv_')) continue;
                    if (rental.productType === 'single') {
                        requiredItemIds.add(rental.productId);
                    } else {
                        const combo = combos.find(c => c.id === rental.productId);
                        if (!combo) {
                            throw new Error(`El paquete combinado "${rental.productName}" ya no existe en el catálogo.`);
                        }
                        combo.components.forEach(comp => {
                            if (!comp.inventoryItemId.startsWith('srv_')) {
                                requiredItemIds.add(comp.inventoryItemId);
                            }
                        });
                    }
                }

                // 3. Read all affected inventory documents inside the transaction
                const invMap = new Map<string, InventoryItem>();
                for (const itemId of requiredItemIds) {
                    const iSnap = await tx.get(doc(db, 'inventory', itemId));
                    if (!iSnap.exists()) {
                        throw new Error(`El producto o accesorio (${itemId}) no existe en el inventario.`);
                    }
                    invMap.set(itemId, JSON.parse(JSON.stringify(iSnap.data())) as InventoryItem);
                }

                // 4. Deduct stock in-memory and validate every single component
                const deductFromMap = (itemId: string, qty: number, wsSize?: string, label?: string) => {
                    if (itemId.startsWith('srv_') || qty <= 0) return;
                    const item = invMap.get(itemId);
                    if (!item) {
                        throw new Error(`Producto no encontrado: ${label || itemId}`);
                    }
                    if (item.hasWheelSizes && item.wheelSizes && item.wheelSizes.length > 0) {
                        const targetWs = wsSize || (item.wheelSizes.length === 1 ? item.wheelSizes[0].size : undefined);
                        const wsIdx = item.wheelSizes.findIndex(w => w.size === targetWs);
                        if (wsIdx < 0) {
                            throw new Error(`Aro "${targetWs || 'sin especificar'}" no válido para ${item.name}.`);
                        }
                        if ((item.wheelSizes[wsIdx].stock || 0) < qty) {
                            throw new Error(
                                `Stock insuficiente para ${item.name} (Aro ${targetWs}): disponible ${item.wheelSizes[wsIdx].stock}, requerido ${qty}.`
                            );
                        }
                        item.wheelSizes[wsIdx].stock -= qty;
                    } else {
                        if ((item.stock ?? 0) < qty) {
                            throw new Error(
                                `Stock insuficiente para ${item.name}: disponible ${item.stock ?? 0}, requerido ${qty}.`
                            );
                        }
                        item.stock = (item.stock ?? 0) - qty;
                    }
                };

                for (const rental of pendingRentals) {
                    if (rental.productId.startsWith('srv_')) continue;
                    if (rental.productType === 'single') {
                        deductFromMap(rental.productId, rental.quantity, rental.selectedWheelSize, rental.productName);
                    } else {
                        const combo = combos.find(c => c.id === rental.productId);
                        if (!combo) {
                            throw new Error(`Combo no encontrado: ${rental.productName}`);
                        }
                        for (const comp of combo.components) {
                            const compItem = invMap.get(comp.inventoryItemId);
                            const ws = (comp.requiresWheelSize || compItem?.hasWheelSizes)
                                ? resolveComboComponentWheelSize(rental, comp.inventoryItemId, compItem)
                                : undefined;
                            deductFromMap(
                                comp.inventoryItemId,
                                comp.quantity * rental.quantity,
                                ws,
                                compItem?.name || rental.productName
                            );
                        }
                    }
                }

                // 5. Commit all inventory updates and rental status updates atomically
                const nowStr = new Date().toISOString();
                for (const [itemId, updatedItem] of invMap.entries()) {
                    tx.update(doc(db, 'inventory', itemId), {
                        ...(updatedItem.hasWheelSizes ? { wheelSizes: updatedItem.wheelSizes } : { stock: updatedItem.stock })
                    });
                }

                for (const rental of pendingRentals) {
                    tx.update(doc(db, 'rentals', rental.id), {
                        status: 'confirmed',
                        updatedAt: nowStr,
                        lastUpdatedBy: actor || 'admin'
                    });
                }
            });

            return { ok: true };
        } catch (err: any) {
            console.error('Atomic confirmRentalGroup failed:', err);
            return { ok: false, error: err?.message || 'Error al confirmar la reserva.' };
        }
    };

    const confirmRental = async (id: string, actor?: string): Promise<boolean> => {
        const res = await confirmRentalGroup([id], actor);
        return res.ok;
    };

    const deliverRentalGroup = async (ids: string[], actor?: string) => {
        const targetIds = Array.from(new Set(ids)).filter(Boolean);
        if (targetIds.length === 0) return;
        const batch = writeBatch(db);
        const nowStr = new Date().toISOString();
        targetIds.forEach(id => {
            const r = rentals.find(item => item.id === id);
            if (r && (r.status === 'confirmed' || r.status === 'Confirmado')) {
                batch.update(doc(db, 'rentals', id), {
                    status: 'delivered',
                    deliveredAt: nowStr,
                    updatedAt: nowStr,
                    lastUpdatedBy: actor || 'admin'
                });
            }
        });
        await batch.commit();
    };

    /**
     * Atomic helper to restore stock and transition status for a group of rentals
     * (used by both cancelRentalGroup and returnRentalGroup).
     */
    const restoreStockAndTransitionGroup = async (
        ids: string[],
        targetStatus: 'cancelled' | 'returned',
        actor?: string,
        returnOptions?: ReturnRentalOptions
    ) => {
        const targetIds = Array.from(new Set(ids)).filter(Boolean);
        if (targetIds.length === 0) return;

        await runTransaction(db, async (tx) => {
            const rentalSnaps = await Promise.all(targetIds.map(id => tx.get(doc(db, 'rentals', id))));
            const existingRentals: Rental[] = [];

            for (const snap of rentalSnaps) {
                if (snap.exists()) {
                    existingRentals.push({ ...(snap.data() as Rental), id: snap.id });
                }
            }

            if (existingRentals.length === 0) return;

            // Collect inventory items that need stock restoration (ONLY from rentals currently holding stock)
            const holdingRentals = existingRentals.filter(r => isRentalHoldingStock(r.status));
            const affectedItemIds = new Set<string>();

            for (const rental of holdingRentals) {
                if (rental.productId.startsWith('srv_')) continue;
                if (rental.productType === 'single') {
                    affectedItemIds.add(rental.productId);
                } else {
                    const combo = combos.find(c => c.id === rental.productId);
                    combo?.components.forEach(comp => {
                        if (!comp.inventoryItemId.startsWith('srv_')) {
                            affectedItemIds.add(comp.inventoryItemId);
                        }
                    });
                }
            }

            const invMap = new Map<string, InventoryItem>();
            for (const itemId of affectedItemIds) {
                const iSnap = await tx.get(doc(db, 'inventory', itemId));
                if (iSnap.exists()) {
                    invMap.set(itemId, JSON.parse(JSON.stringify(iSnap.data())) as InventoryItem);
                }
            }

            let remainingDamagedToAllocate = Math.max(0, returnOptions?.damagedUnits || 0);

            const restoreToMap = (itemId: string, qty: number, wsSize?: string, isBikeCandidate: boolean = false) => {
                if (itemId.startsWith('srv_') || qty <= 0) return;
                const item = invMap.get(itemId);
                if (!item) return;

                // If units were reported damaged on return, divert them to maintenanceStock instead of available stock
                let damagedHere = 0;
                if (targetStatus === 'returned' && remainingDamagedToAllocate > 0 && (isBikeCandidate || item.itemType === 'bike')) {
                    damagedHere = Math.min(qty, remainingDamagedToAllocate);
                    remainingDamagedToAllocate -= damagedHere;
                }
                const healthyQty = Math.max(0, qty - damagedHere);

                if (item.hasWheelSizes && item.wheelSizes && item.wheelSizes.length > 0) {
                    const targetWs = wsSize || (item.wheelSizes.length === 1 ? item.wheelSizes[0].size : item.wheelSizes[0]?.size);
                    item.wheelSizes = item.wheelSizes.map(w => {
                        if (w.size === targetWs) {
                            return {
                                ...w,
                                stock: (w.stock || 0) + healthyQty,
                                ...(damagedHere > 0 ? { maintenanceStock: (w.maintenanceStock || 0) + damagedHere } : {})
                            };
                        }
                        return w;
                    });
                    if (damagedHere > 0) {
                        item.maintenanceStock = (item.maintenanceStock || 0) + damagedHere;
                    }
                } else {
                    item.stock = (item.stock ?? 0) + healthyQty;
                    if (damagedHere > 0) {
                        item.maintenanceStock = (item.maintenanceStock || 0) + damagedHere;
                    }
                }
            };

            for (const rental of holdingRentals) {
                if (rental.productId.startsWith('srv_')) continue;
                if (rental.productType === 'single') {
                    const item = invMap.get(rental.productId);
                    restoreToMap(
                        rental.productId,
                        rental.quantity,
                        rental.selectedWheelSize,
                        item?.itemType === 'bike'
                    );
                } else {
                    const combo = combos.find(c => c.id === rental.productId);
                    combo?.components.forEach(comp => {
                        const compItem = invMap.get(comp.inventoryItemId);
                        const ws = (comp.requiresWheelSize || compItem?.hasWheelSizes)
                            ? resolveComboComponentWheelSize(rental, comp.inventoryItemId, compItem)
                            : undefined;
                        restoreToMap(
                            comp.inventoryItemId,
                            comp.quantity * rental.quantity,
                            ws,
                            comp.requiresWheelSize || compItem?.itemType === 'bike'
                        );
                    });
                }
            }

            const nowStr = new Date().toISOString();
            for (const [itemId, updatedItem] of invMap.entries()) {
                tx.update(doc(db, 'inventory', itemId), {
                    ...(updatedItem.hasWheelSizes ? { wheelSizes: updatedItem.wheelSizes } : { stock: updatedItem.stock }),
                    ...(typeof updatedItem.maintenanceStock === 'number' ? { maintenanceStock: updatedItem.maintenanceStock } : {})
                });
            }

            for (const rental of existingRentals) {
                // Guard against returning an already returned rental twice
                if (targetStatus === 'returned' && (rental.status === 'returned' || rental.status === 'Devuelto')) {
                    continue;
                }
                if (targetStatus === 'cancelled' && (rental.status === 'cancelled' || rental.status === 'Cancelado')) {
                    continue;
                }

                const extraFields: Record<string, any> = {};
                if (targetStatus === 'returned') {
                    extraFields.returnedAt = nowStr;
                    if (returnOptions?.damagedUnits && returnOptions.damagedUnits > 0) {
                        extraFields.damagedOnReturn = true;
                    }
                    if (returnOptions?.conditionNotes) {
                        extraFields.returnConditionNotes = returnOptions.conditionNotes;
                    }
                    if (typeof returnOptions?.lateFee === 'number' && returnOptions.lateFee > 0) {
                        extraFields.lateFee = returnOptions.lateFee;
                    }
                }

                tx.update(doc(db, 'rentals', rental.id), {
                    status: targetStatus,
                    updatedAt: nowStr,
                    lastUpdatedBy: actor || returnOptions?.actor || 'admin',
                    ...extraFields
                });
            }
        });
    };

    const cancelRentalGroup = async (ids: string[], actor?: string) => {
        await restoreStockAndTransitionGroup(ids, 'cancelled', actor);
    };

    const cancelRental = async (id: string, actor?: string) => {
        await restoreStockAndTransitionGroup([id], 'cancelled', actor);
    };

    const returnRentalGroup = async (ids: string[], actor?: string, options?: ReturnRentalOptions) => {
        await restoreStockAndTransitionGroup(ids, 'returned', actor, options);
    };

    const returnRental = async (id: string, actor?: string, options?: ReturnRentalOptions) => {
        await restoreStockAndTransitionGroup([id], 'returned', actor, options);
    };

    const updateRentalPaymentStatus = async (id: string, paymentStatus: Rental['paymentStatus'], actor?: string) => {
        await updateDoc(doc(db, 'rentals', id), {
            paymentStatus,
            updatedAt: new Date().toISOString(),
            lastUpdatedBy: actor || 'admin'
        });
    };

    const updateRental = async (id: string, updates: Partial<Rental>, actor?: string) => {
        const existing = rentals.find(r => r.id === id);
        const cleanUpdates: Record<string, any> = {};
        for (const [key, value] of Object.entries(updates)) {
            if (value !== undefined && key !== 'id' && key !== 'reservationCode' && key !== 'createdAt' && key !== 'createdDate') {
                cleanUpdates[key] = value;
            }
        }

        // If the rental is currently holding stock (confirmed/delivered) and its product, quantity, or wheelSize changed,
        // adjust the inventory stock differential atomically so stock never drifts!
        const stockAffectingChange =
            existing &&
            isRentalHoldingStock(existing.status) &&
            !existing.productId.startsWith('srv_') &&
            (
                (cleanUpdates.quantity !== undefined && cleanUpdates.quantity !== existing.quantity) ||
                (cleanUpdates.productId !== undefined && cleanUpdates.productId !== existing.productId) ||
                (cleanUpdates.productType !== undefined && cleanUpdates.productType !== existing.productType) ||
                (cleanUpdates.selectedWheelSize !== undefined && cleanUpdates.selectedWheelSize !== existing.selectedWheelSize)
            );

        if (stockAffectingChange && existing) {
            await runTransaction(db, async (tx) => {
                const rRef = doc(db, 'rentals', id);
                const rSnap = await tx.get(rRef);
                if (!rSnap.exists()) return;
                const currentRental = rSnap.data() as Rental;
                const nextRental: Rental = { ...currentRental, ...cleanUpdates };

                const itemIds = new Set<string>();
                const collectIds = (r: Rental) => {
                    if (r.productId.startsWith('srv_')) return;
                    if (r.productType === 'single') itemIds.add(r.productId);
                    else {
                        const c = combos.find(cb => cb.id === r.productId);
                        c?.components.forEach(comp => {
                            if (!comp.inventoryItemId.startsWith('srv_')) itemIds.add(comp.inventoryItemId);
                        });
                    }
                };
                collectIds(currentRental);
                collectIds(nextRental);

                const invMap = new Map<string, InventoryItem>();
                for (const itemId of itemIds) {
                    const iSnap = await tx.get(doc(db, 'inventory', itemId));
                    if (iSnap.exists()) {
                        invMap.set(itemId, JSON.parse(JSON.stringify(iSnap.data())) as InventoryItem);
                    }
                }

                const adjustMap = (r: Rental, direction: 1 | -1) => {
                    if (r.productId.startsWith('srv_')) return;
                    if (r.productType === 'single') {
                        const item = invMap.get(r.productId);
                        if (!item) throw new Error(`Producto ${r.productId} no encontrado.`);
                        const delta = r.quantity * direction;
                        if (item.hasWheelSizes && item.wheelSizes) {
                            const ws = r.selectedWheelSize || item.wheelSizes[0]?.size;
                            const idx = item.wheelSizes.findIndex(w => w.size === ws);
                            if (idx < 0) throw new Error(`Aro ${ws} inválido para ${item.name}.`);
                            const nextStock = (item.wheelSizes[idx].stock || 0) + delta;
                            if (nextStock < 0) throw new Error(`Stock insuficiente para ${item.name} (Aro ${ws}).`);
                            item.wheelSizes[idx].stock = nextStock;
                        } else {
                            const nextStock = (item.stock ?? 0) + delta;
                            if (nextStock < 0) throw new Error(`Stock insuficiente para ${item.name}.`);
                            item.stock = nextStock;
                        }
                    } else {
                        const combo = combos.find(c => c.id === r.productId);
                        if (!combo) throw new Error(`Combo ${r.productName} no encontrado.`);
                        for (const comp of combo.components) {
                            const item = invMap.get(comp.inventoryItemId);
                            if (!item) continue;
                            const delta = comp.quantity * r.quantity * direction;
                            const ws = (comp.requiresWheelSize || item.hasWheelSizes)
                                ? resolveComboComponentWheelSize(r, comp.inventoryItemId, item)
                                : undefined;
                            if (item.hasWheelSizes && item.wheelSizes) {
                                const idx = item.wheelSizes.findIndex(w => w.size === ws);
                                if (idx < 0) throw new Error(`Aro ${ws} inválido para ${item.name}.`);
                                const nextStock = (item.wheelSizes[idx].stock || 0) + delta;
                                if (nextStock < 0) throw new Error(`Stock insuficiente para ${item.name} (Aro ${ws}).`);
                                item.wheelSizes[idx].stock = nextStock;
                            } else {
                                const nextStock = (item.stock ?? 0) + delta;
                                if (nextStock < 0) throw new Error(`Stock insuficiente para ${item.name}.`);
                                item.stock = nextStock;
                            }
                        }
                    }
                };

                // 1. Restore old rental's deducted stock (+1)
                adjustMap(currentRental, 1);
                // 2. Deduct new rental's required stock (-1)
                adjustMap(nextRental, -1);

                for (const [itemId, updatedItem] of invMap.entries()) {
                    tx.update(doc(db, 'inventory', itemId), {
                        ...(updatedItem.hasWheelSizes ? { wheelSizes: updatedItem.wheelSizes } : { stock: updatedItem.stock })
                    });
                }

                tx.update(rRef, {
                    ...cleanUpdates,
                    updatedAt: new Date().toISOString(),
                    lastUpdatedBy: actor || 'admin'
                });
            });
            return;
        }

        await updateDoc(doc(db, 'rentals', id), {
            ...cleanUpdates,
            updatedAt: new Date().toISOString(),
            lastUpdatedBy: actor || 'admin'
        });
    };

    const markRentalExpired = async (id: string, actor?: string) => {
        const rental = rentals.find(r => r.id === id);
        if (!rental) return;
        // Only pending reservations can expire; confirmed/delivered rentals hold physical bikes
        if (!isRentalPendingReservation(rental.status)) return;
        await updateDoc(doc(db, 'rentals', id), {
            status: 'expired',
            updatedAt: new Date().toISOString(),
            lastUpdatedBy: actor || 'admin'
        });
    };

    const deleteRentalGroup = async (ids: string[]) => {
        const targetIds = Array.from(new Set(ids)).filter(Boolean);
        if (targetIds.length === 0) return;
        // Restore stock ONLY for items that were actively holding stock ('confirmed'/'Confirmado'/'delivered'/'Entregado')
        const holdingIds = targetIds.filter(id => {
            const r = rentals.find(item => item.id === id);
            return r && isRentalHoldingStock(r.status);
        });
        if (holdingIds.length > 0) {
            await cancelRentalGroup(holdingIds, 'admin');
        }
        const batch = writeBatch(db);
        targetIds.forEach(id => batch.delete(doc(db, 'rentals', id)));
        await batch.commit();
    };

    const deleteRental = async (id: string) => {
        await deleteRentalGroup([id]);
    };

    const addSale = async (s: Omit<Sale, 'id' | 'date' | 'status'>) => {
        const id = generateId('sale');
        await setDoc(doc(db, 'sales', id), { ...s, id, status: 'Pendiente', date: new Date().toISOString() });
    };
    const updateSaleStatus = async (id: string, status: Sale['status']) => {
        await updateDoc(doc(db, 'sales', id), { status });
    };
    const deleteSale = async (id: string) => {
        await deleteDoc(doc(db, 'sales', id));
    };

    const addOrUpdateCustomer = async (c: { name: string; phone: string; ci: string }, isPurchase: boolean) => {
        const cleanCi = (c.ci || '').trim();
        const cleanPhone = (c.phone || '').trim();
        let existing = customers.find(cust => (cleanCi && cust.ci === cleanCi) || (cleanPhone && cust.phone === cleanPhone));

        if (existing) {
            const updates = {
                name: c.name || existing.name,
                phone: c.phone || existing.phone,
                ci: c.ci || existing.ci,
                purchasesCount: (existing.purchasesCount || 0) + (isPurchase ? 1 : 0),
                rentalsCount: (existing.rentalsCount || 0) + (!isPurchase ? 1 : 0),
                lastVisit: new Date().toISOString()
            };
            await updateDoc(doc(db, 'customers', existing.id), updates);
            setCustomers((current) => current.map((customer) => customer.id === existing!.id ? { ...customer, ...updates } : customer));
        } else {
            const id = generateId('cust');
            const newCustomer: Customer = {
                id,
                ...c,
                rentalsCount: isPurchase ? 0 : 1,
                purchasesCount: isPurchase ? 1 : 0,
                firstVisit: new Date().toISOString(),
                lastVisit: new Date().toISOString(),
                notes: '',
                ...(isAdminSession && adminStoreScope !== 'all' ? { store: adminStoreScope } : {}),
            };
            await setDoc(doc(db, 'customers', id), newCustomer);
            setCustomers((current) => [...current, newCustomer]);
        }
    };

    const updateCustomer = async (id: string, c: Partial<Customer>) => {
        if ('password' in c) throw new Error('Las contraseñas se actualizan desde Firebase Authentication.');
        await updateDoc(doc(db, 'customers', id), c);
        setCustomers((current) => current.map((customer) => customer.id === id ? { ...customer, ...c } : customer));
    };

    const deleteCustomer = async (id: string) => {
        await deleteDoc(doc(db, 'customers', id));
        setCustomers((current) => current.filter((customer) => customer.id !== id));
    };

    const addServiceOrder = async (so: Omit<ServiceOrder, 'id' | 'date'>) => {
        if (isAdminSession) {
            const id = generateId('so');
            await setDoc(doc(db, 'serviceOrders', id), {
                ...so,
                ...(adminStoreScope !== 'all' ? { store: adminStoreScope } : {}),
                id,
                date: new Date().toISOString(),
            });
            return;
        }
        await createServiceOrderBackend(so);
    };
    const updateServiceOrder = async (id: string, so: Partial<ServiceOrder>) => {
        await updateDoc(doc(db, 'serviceOrders', id), so);
    };
    const deleteServiceOrder = async (id: string) => {
        await deleteDoc(doc(db, 'serviceOrders', id));
    };

    const updateAdminNavigationLinks = async (links: any[]) => {
        await setDoc(doc(db, 'settings', 'admin_navigation'), { links });
    };

    const fileToCompressedDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const image = new Image();
            image.onload = () => {
                const maxSide = 900;
                const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
                const width = Math.max(1, Math.round(image.width * scale));
                const height = Math.max(1, Math.round(image.height * scale));
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('No se pudo procesar la imagen del QR.'));
                    return;
                }
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(image, 0, 0, width, height);
                resolve(canvas.toDataURL('image/png'));
            };
            image.onerror = () => reject(new Error('No se pudo leer la imagen del QR.'));
            image.src = String(reader.result || '');
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });

    const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> => {
        let timeoutId: ReturnType<typeof setTimeout> | undefined;
        const timeout = new Promise<never>((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
        });
        try {
            return await Promise.race([promise, timeout]);
        } finally {
            if (timeoutId) clearTimeout(timeoutId);
        }
    };

    const updateRentalSettings = async (updates: Partial<RentalSettings>, qrFile: File | null) => {
        let qrCodeUrl = updates.qrCodeUrl || rentalSettings.qrCodeUrl;
        if (qrFile) {
            try {
                const fileExt = qrFile.name.split('.').pop() || 'png';
                const pathRef = storageRef(storage, `settings/qr_pago_${Date.now()}.${fileExt}`);
                const result = await withTimeout(uploadBytes(pathRef, qrFile), 15000, 'La subida del QR tardó demasiado.');
                qrCodeUrl = await withTimeout(getDownloadURL(result.ref), 10000, 'No se pudo obtener el enlace del QR.');
            } catch (error) {
                console.warn('QR upload failed; saving compressed Firestore fallback:', error);
                qrCodeUrl = await fileToCompressedDataUrl(qrFile);
            }
        }
        const newSettings = {
            ...rentalSettings,
            ...updates,
            qrCodeUrl
        };
        try {
            await withTimeout(setDoc(doc(db, 'settings', 'rental_settings'), newSettings), 12000, 'La configuración tardó demasiado en guardarse.');
            setRentalSettings(newSettings);
            localStorage.setItem(LOCAL_RENTAL_SETTINGS_KEY, JSON.stringify(newSettings));
        } catch (error) {
            console.error('Firestore rental settings save failed:', error);
            throw new Error('No se pudo guardar el QR globalmente. Revisa permisos de Firestore o intenta con una imagen más liviana.');
        }
    };

    const resetAllData = async () => {
        const batch = writeBatch(db);
        rentals.forEach(r => batch.delete(doc(db, 'rentals', r.id)));
        sales.forEach(s => batch.delete(doc(db, 'sales', s.id)));
        customers.forEach(c => batch.delete(doc(db, 'customers', c.id)));
        serviceOrders.forEach(s => batch.delete(doc(db, 'serviceOrders', s.id)));
        await batch.commit();
    };

    const mergedRoutes = mergeRoutes(routes, localRoutes);

    const value: StoreContextType = {
        inventory, combos, rentals, sales, customers, serviceOrders, isLoaded,
        rentalSettings, updateRentalSettings,
        addInventoryItem, updateInventoryItem, deleteInventoryItem,
        addCombo, updateCombo, deleteCombo,
        confirmRental, confirmRentalGroup, deliverRentalGroup,
        cancelRental, cancelRentalGroup, returnRental, returnRentalGroup,
        deleteRental, deleteRentalGroup,
        updateRental, updateRentalPaymentStatus, markRentalExpired,
        addSale, updateSaleStatus, deleteSale,
        addOrUpdateCustomer, updateCustomer, deleteCustomer, verifyCustomerRecovery,
        addServiceOrder, updateServiceOrder, deleteServiceOrder,
        getItemStock, getComboAvailability,
        getAvailableStockForInterval, getComboAvailabilityForInterval,
        calculatePrice, resetAllData,
        currentCustomer, loginCustomer, registerCustomer, logoutCustomer, getMyRentalHistory, createRentalGroup,
        routes: mergedRoutes, addRoute, updateRoute, deleteRoute,
        events, addEvent, updateEvent, deleteEvent,
        bikeCategories, addBikeCategory, deleteBikeCategory, updateBikeCategory, reorderBikeCategories,
        shopCategories, addShopCategory, deleteShopCategory, updateShopCategory, reorderShopCategories,
        adminNavigationLinks, updateAdminNavigationLinks
    };

    return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

function safeJSON<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
}
