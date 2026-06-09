import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
    collection, 
    doc, 
    setDoc, 
    updateDoc, 
    deleteDoc, 
    onSnapshot, 
    query, 
    orderBy,
    writeBatch
} from 'firebase/firestore';
import { db, storage } from '../lib/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

// ===========================
// TYPES
// ===========================

export interface WheelSizeEntry {
    size: string;
    stock: number;
}

export interface InventoryItem {
    id: string;
    itemType: 'bike' | 'accessory';
    name: string;
    description: string;
    imageUrl: string;
    active: boolean;

    availableForRental: boolean;
    availableForSale: boolean;

    // Bikes with wheel sizes
    hasWheelSizes: boolean;
    wheelSizes?: WheelSizeEntry[];

    // Accessories with simple stock
    stock?: number;

    // Pricing
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
}

export interface ComboComponent {
    inventoryItemId: string;
    quantity: number;
    requiresWheelSize: boolean;
}

export interface ComboProduct {
    id: string;
    name: string;
    description: string;
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
    total: number;
    paymentMethod: string;
    paymentStatus: 'unpaid' | 'pending_review' | 'paid';
    notes: string;

    status: 'pending' | 'confirmed' | 'cancelled' | 'expired' | 'Pendiente' | 'Confirmado' | 'Cancelado';
    createdAt: string;
    updatedAt: string;
    lastUpdatedBy?: string;
    paymentProofUrl?: string;

    createdDate?: string;

    mapsLink?: string;
    deliveryService?: boolean;
    pickupService?: boolean;
}

export interface Sale {
    id: string;
    customerName: string;
    customerPhone: string;
    customerCI: string;
    items: { name: string; price: number; quantity: number; image: string }[];
    total: number;
    status: 'Pendiente' | 'Completado' | 'Cancelado';
    paymentMethod: string;
    notes: string;
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
}

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

interface StoreContextType {
    inventory: InventoryItem[];
    combos: ComboProduct[];
    rentals: Rental[];
    sales: Sale[];
    customers: Customer[];
    serviceOrders: ServiceOrder[];
    isLoaded: boolean;

    // Inventory CRUD
    addInventoryItem: (item: InventoryItem) => Promise<void>;
    updateInventoryItem: (id: string, item: Partial<InventoryItem>) => Promise<void>;
    deleteInventoryItem: (id: string) => Promise<void>;

    // Combo CRUD
    addCombo: (combo: ComboProduct) => Promise<void>;
    updateCombo: (id: string, combo: Partial<ComboProduct>) => Promise<void>;
    deleteCombo: (id: string) => Promise<void>;

    // Rental CRUD
    addRental: (rental: Omit<Rental, 'id' | 'reservationCode' | 'status' | 'createdAt' | 'updatedAt' | 'paymentStatus'>) => Promise<Rental>;
    confirmRental: (id: string, actor?: string) => Promise<boolean>;
    cancelRental: (id: string, actor?: string) => Promise<void>;
    deleteRental: (id: string) => Promise<void>;
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

    // Service Order CRUD
    addServiceOrder: (so: Omit<ServiceOrder, 'id' | 'date'>) => Promise<void>;
    updateServiceOrder: (id: string, so: Partial<ServiceOrder>) => Promise<void>;
    deleteServiceOrder: (id: string) => Promise<void>;

    // Helpers
    getItemStock: (itemId: string, wheelSize?: string) => number;
    getComboAvailability: (comboId: string) => number;
    calculatePrice: (productType: 'single' | 'combo', productId: string, duration: string, quantity: number) => number;

    resetAllData: () => Promise<void>;

    // Customer Authentication state & methods
    currentCustomer: Customer | null;
    loginCustomer: (email: string, password: string, remember: boolean) => Promise<Customer | null>;
    registerCustomer: (
        customerData: Omit<Customer, 'id' | 'rentalsCount' | 'purchasesCount' | 'firstVisit' | 'lastVisit' | 'notes'>,
        selfieBlob: Blob | null,
        docFile: File | null,
        remember: boolean
    ) => Promise<Customer>;
    logoutCustomer: () => void;
}

export const StoreContext = createContext<StoreContextType | null>(null);

export const useStore = () => {
    const context = useContext(StoreContext);
    if (!context) throw new Error('useStore must be used within StoreProvider');
    return context;
};

export const StoreProvider = ({ children }: { children: React.ReactNode }) => {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [combos, setCombos] = useState<ComboProduct[]>([]);
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [sales, setSales] = useState<Sale[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Customer Session state
    const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);

    // Load saved session
    useEffect(() => {
        const saved = localStorage.getItem('briz_logged_customer');
        if (saved) {
            try {
                setCurrentCustomer(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse saved customer session:', e);
            }
        }
    }, []);

    // ---- Real-time Sync ----
    useEffect(() => {
        const unsubInv = onSnapshot(query(collection(db, 'inventory')), (snap) => {
            setInventory(snap.docs.map(doc => ({ ...doc.data() } as InventoryItem)));
        });
        const unsubCombos = onSnapshot(query(collection(db, 'combos')), (snap) => {
            setCombos(snap.docs.map(doc => ({ ...doc.data() } as ComboProduct)));
        });
        const unsubRentals = onSnapshot(query(collection(db, 'rentals'), orderBy('createdDate', 'desc')), (snap) => {
            setRentals(snap.docs.map(doc => ({ ...doc.data() } as Rental)));
        });
        const unsubSales = onSnapshot(query(collection(db, 'sales'), orderBy('date', 'desc')), (snap) => {
            setSales(snap.docs.map(doc => ({ ...doc.data() } as Sale)));
        });
        const unsubCustomers = onSnapshot(query(collection(db, 'customers')), (snap) => {
            setCustomers(snap.docs.map(doc => ({ ...doc.data() } as Customer)));
        });
        const unsubSO = onSnapshot(query(collection(db, 'serviceOrders'), orderBy('date', 'desc')), (snap) => {
            setServiceOrders(snap.docs.map(doc => ({ ...doc.data() } as ServiceOrder)));
        });

        setIsLoaded(true);
        return () => {
            unsubInv(); unsubCombos(); unsubRentals(); unsubSales(); unsubCustomers(); unsubSO();
        };
    }, []);

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
            if (!wheelSize) return item.wheelSizes.reduce((sum, ws) => sum + (ws.stock || 0), 0);
            return item.wheelSizes.find(w => w.size === wheelSize)?.stock ?? 0;
        }
        return item.stock ?? 0;
    };

    const getComboAvailability = (comboId: string): number => {
        const combo = combos.find(c => c.id === comboId);
        if (!combo || combo.components.length === 0) return 0;
        let minAvail = Infinity;
        for (const comp of combo.components) {
            const item = inventory.find(i => i.id === comp.inventoryItemId);
            if (!item) return 0;
            const itemStock = getItemStock(item.id);
            const possible = Math.floor(itemStock / comp.quantity);
            minAvail = Math.min(minAvail, possible);
        }
        return minAvail === Infinity ? 0 : minAvail;
    };

    // PRICE CALCULATOR
    const calculatePrice = (productType: 'single' | 'combo', productId: string, duration: string, quantity: number): number => {
        let pricing = productType === 'single' ? inventory.find(i => i.id === productId) : combos.find(c => c.id === productId);
        if (!pricing) return 0;
        let base = 0;
        const d = duration.toLowerCase().trim();

        // 8-tier pricing fields with default fallback values
        const p1h = (pricing as any).price1Hour || 0;
        const p2h = (pricing as any).price2Hours || 0;
        const p3h = (pricing as any).price3Hours || 0;
        const p4h = (pricing as any).price4Hours || 0;
        const p8h = (pricing as any).price8Hours || 0;
        const p24h = (pricing as any).price24Hours || 0;
        const p1w = (pricing as any).price1Week || 0;
        const p1m = (pricing as any).price1Month || 0;

        if (d === '1 hora') {
            base = p1h > 0 ? p1h : pricing.pricePerHour;
        } else if (d === '2 horas') {
            base = p2h > 0 ? p2h : (pricing.pricePerHour * 2);
        } else if (d === '3 horas') {
            base = p3h > 0 ? p3h : (pricing.pricePerHour * 3);
        } else if (d === '4 horas' || d === 'medio día') {
            base = p4h > 0 ? p4h : (pricing.pricePerHour * 4);
        } else if (d === '8 horas') {
            base = p8h > 0 ? p8h : ((p4h > 0 ? p4h : pricing.pricePerHour * 4) + 4 * (pricing.priceFrom5thHour || 0));
        } else if (d === '24 horas' || d === '1 día' || d === 'día completo') {
            base = p24h > 0 ? p24h : pricing.pricePerDay;
        } else if (d === '1 semana') {
            base = p1w > 0 ? p1w : pricing.pricePerWeek;
        } else if (d === '1 mes') {
            base = p1m > 0 ? p1m : pricing.pricePerMonth;
        } else {
            const match = d.match(/(\d+)\s*hora/);
            if (match) {
                const hrs = parseInt(match[1], 10);
                if (hrs === 1) base = p1h > 0 ? p1h : pricing.pricePerHour;
                else if (hrs === 2) base = p2h > 0 ? p2h : pricing.pricePerHour * 2;
                else if (hrs === 3) base = p3h > 0 ? p3h : pricing.pricePerHour * 3;
                else if (hrs === 4) base = p4h > 0 ? p4h : pricing.pricePerHour * 4;
                else if (hrs === 8) base = p8h > 0 ? p8h : ((p4h > 0 ? p4h : pricing.pricePerHour * 4) + 4 * (pricing.priceFrom5thHour || 0));
                else {
                    base = hrs <= 4 
                        ? (pricing.pricePerHour * hrs) 
                        : ((p4h > 0 ? p4h : pricing.pricePerHour * 4) + (hrs - 4) * (pricing.priceFrom5thHour || 0));
                }
            }
        }
        return base * quantity;
    };

    // CUSTOMER AUTH ACTIONS
    const loginCustomer = async (email: string, password: string, remember: boolean): Promise<Customer | null> => {
        const cust = customers.find(c => c.email?.toLowerCase().trim() === email.toLowerCase().trim() && c.password === password);
        if (cust) {
            setCurrentCustomer(cust);
            if (remember) {
                localStorage.setItem('briz_logged_customer', JSON.stringify(cust));
            } else {
                localStorage.removeItem('briz_logged_customer');
            }
            return cust;
        }
        return null;
    };

    const registerCustomer = async (
        customerData: Omit<Customer, 'id' | 'rentalsCount' | 'purchasesCount' | 'firstVisit' | 'lastVisit' | 'notes'>,
        selfieBlob: Blob | null,
        docFile: File | null,
        remember: boolean
    ): Promise<Customer> => {
        const emailExists = customers.some(c => c.email?.toLowerCase().trim() === customerData.email?.toLowerCase().trim());
        if (emailExists) {
            throw new Error('El correo electrónico ya está registrado.');
        }

        const id = generateId('cust');
        let autofotoUrl = '';
        let documentoUrl = '';

        if (selfieBlob) {
            try {
                const pathRef = storageRef(storage, `customers/selfies/${id}_selfie.jpg`);
                const result = await uploadBytes(pathRef, selfieBlob);
                autofotoUrl = await getDownloadURL(result.ref);
            } catch (err) {
                console.error("Error uploading selfie:", err);
            }
        }

        if (docFile) {
            try {
                const fileExt = docFile.name.split('.').pop() || 'pdf';
                const pathRef = storageRef(storage, `customers/documents/${id}_doc.${fileExt}`);
                const result = await uploadBytes(pathRef, docFile);
                documentoUrl = await getDownloadURL(result.ref);
            } catch (err) {
                console.error("Error uploading document:", err);
            }
        }

        const newCustomer: Customer = {
            id,
            ...customerData,
            rentalsCount: 0,
            purchasesCount: 0,
            firstVisit: new Date().toISOString(),
            lastVisit: new Date().toISOString(),
            notes: '',
            autofotoUrl,
            documentoUrl
        };

        await setDoc(doc(db, 'customers', id), newCustomer);

        setCurrentCustomer(newCustomer);
        if (remember) {
            localStorage.setItem('briz_logged_customer', JSON.stringify(newCustomer));
        } else {
            localStorage.removeItem('briz_logged_customer');
        }

        return newCustomer;
    };

    const logoutCustomer = () => {
        setCurrentCustomer(null);
        localStorage.removeItem('briz_logged_customer');
    };

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

    const addCombo = async (combo: ComboProduct) => {
        await setDoc(doc(db, 'combos', combo.id), combo);
    };
    const updateCombo = async (id: string, updates: Partial<ComboProduct>) => {
        await updateDoc(doc(db, 'combos', id), updates);
    };
    const deleteCombo = async (id: string) => {
        await deleteDoc(doc(db, 'combos', id));
    };

    const addRental = async (rental: Omit<Rental, 'id' | 'reservationCode' | 'status' | 'createdAt' | 'updatedAt' | 'paymentStatus'>): Promise<Rental> => {
        const id = generateId('rental');
        
        // Collision-safe sequential code generation from real-time local state array
        const currentYear = new Date().getFullYear();
        const yearPrefix = `BRIZ-${currentYear}-`;
        
        let seq = 1;
        const yearRentals = rentals.filter(r => r.reservationCode && r.reservationCode.startsWith(yearPrefix));
        if (yearRentals.length > 0) {
            const sequences = yearRentals.map(r => {
                const parts = r.reservationCode.split('-');
                const num = parseInt(parts[parts.length - 1], 10);
                return isNaN(num) ? 0 : num;
            });
            const maxSeq = Math.max(...sequences, 0);
            seq = maxSeq + 1;
        }
        
        const reservationCode = `${yearPrefix}${String(seq).padStart(4, '0')}`;
        const paymentStatus: Rental['paymentStatus'] = rental.paymentMethod.toLowerCase() === 'qr' ? 'pending_review' : 'unpaid';
        const nowStr = new Date().toISOString();

        const newRental: Rental = {
            ...rental,
            id,
            reservationCode,
            productNameSnapshot: rental.productNameSnapshot || rental.productName,
            paymentStatus,
            status: 'pending',
            createdAt: nowStr,
            updatedAt: nowStr,
            createdDate: nowStr
        };
        
        // Firestore does NOT accept undefined values — strip them before writing
        const cleanData: Record<string, any> = {};
        for (const [key, value] of Object.entries(newRental)) {
            if (value !== undefined) {
                cleanData[key] = value;
            }
        }
        
        // Wrap in try-catch so Firestore errors NEVER block the user flow
        try {
            setDoc(doc(db, 'rentals', id), cleanData).catch(err => {
                console.error("Firestore background upload failed:", err);
            });
        } catch (err) {
            console.error("Firestore setDoc sync error (non-blocking):", err);
        }

        return newRental;
    };

    const confirmRental = async (id: string, actor?: string): Promise<boolean> => {
        const rental = rentals.find(r => r.id === id);
        if (!rental || (rental.status !== 'pending' && rental.status !== 'Pendiente')) return false;

        // Atomic update for stock
        const batch = writeBatch(db);
        const invCopy = [...inventory];

        const updateStock = (itemId: string, qty: number, wsSize?: string) => {
            const itemIdx = invCopy.findIndex(i => i.id === itemId);
            if (itemIdx < 0) return false;
            const item = { ...invCopy[itemIdx] };
            if (item.hasWheelSizes && item.wheelSizes) {
                const wsIdx = item.wheelSizes.findIndex(w => w.size === wsSize);
                if (wsIdx < 0 || item.wheelSizes[wsIdx].stock < qty) return false;
                item.wheelSizes = [...item.wheelSizes];
                item.wheelSizes[wsIdx] = { ...item.wheelSizes[wsIdx], stock: item.wheelSizes[wsIdx].stock - qty };
            } else {
                if ((item.stock ?? 0) < qty) return false;
                item.stock = (item.stock ?? 0) - qty;
            }
            invCopy[itemIdx] = item;
            batch.update(doc(db, 'inventory', itemId), item as any);
            return true;
        };

        let success = true;
        if (rental.productType === 'single') {
            success = updateStock(rental.productId, rental.quantity, rental.selectedWheelSize);
        } else {
            const combo = combos.find(c => c.id === rental.productId);
            if (!combo) success = false;
            else {
                for (const comp of combo.components) {
                    const selection = rental.componentSelections?.find(cs => cs.inventoryItemId === comp.inventoryItemId);
                    if (!updateStock(comp.inventoryItemId, comp.quantity * rental.quantity, selection?.wheelSize)) {
                        success = false; break;
                    }
                }
            }
        }

        if (!success) return false;

        batch.update(doc(db, 'rentals', id), { 
            status: 'confirmed',
            updatedAt: new Date().toISOString(),
            lastUpdatedBy: actor || 'admin'
        });
        await batch.commit();
        return true;
    };

    const cancelRental = async (id: string, actor?: string) => {
        const rental = rentals.find(r => r.id === id);
        if (!rental) return;

        if (rental.status === 'confirmed' || rental.status === 'Confirmado') {
            const batch = writeBatch(db);
            const restoreStock = (itemId: string, qty: number, wsSize?: string) => {
                const item = inventory.find(i => i.id === itemId);
                if (!item) return;
                const updated = { ...item };
                if (updated.hasWheelSizes && updated.wheelSizes) {
                    updated.wheelSizes = updated.wheelSizes.map(w => w.size === wsSize ? { ...w, stock: w.stock + qty } : w);
                } else {
                    updated.stock = (updated.stock ?? 0) + qty;
                }
                batch.update(doc(db, 'inventory', itemId), updated as any);
            };

            if (rental.productType === 'single') {
                restoreStock(rental.productId, rental.quantity, rental.selectedWheelSize);
            } else {
                const combo = combos.find(c => c.id === rental.productId);
                combo?.components.forEach(comp => {
                    const sel = rental.componentSelections?.find(cs => cs.inventoryItemId === comp.inventoryItemId);
                    restoreStock(comp.inventoryItemId, comp.quantity * rental.quantity, sel?.wheelSize);
                });
            }
            batch.update(doc(db, 'rentals', id), { 
                status: 'cancelled',
                updatedAt: new Date().toISOString(),
                lastUpdatedBy: actor || 'admin'
            });
            await batch.commit();
        } else {
            await updateDoc(doc(db, 'rentals', id), { 
                status: 'cancelled',
                updatedAt: new Date().toISOString(),
                lastUpdatedBy: actor || 'admin'
            });
        }
    };

    const updateRentalPaymentStatus = async (id: string, paymentStatus: Rental['paymentStatus'], actor?: string) => {
        await updateDoc(doc(db, 'rentals', id), {
            paymentStatus,
            updatedAt: new Date().toISOString(),
            lastUpdatedBy: actor || 'admin'
        });
    };

    const markRentalExpired = async (id: string, actor?: string) => {
        await updateDoc(doc(db, 'rentals', id), {
            status: 'expired',
            updatedAt: new Date().toISOString(),
            lastUpdatedBy: actor || 'admin'
        });
    };

    const deleteRental = async (id: string) => {
        const rental = rentals.find(r => r.id === id);
        if (rental?.status === 'Confirmado') await cancelRental(id);
        await deleteDoc(doc(db, 'rentals', id));
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
        const existing = customers.find(cust => cust.ci === c.ci || cust.phone === c.phone);
        if (existing) {
            await updateDoc(doc(db, 'customers', existing.id), {
                name: c.name, phone: c.phone, ci: c.ci,
                purchasesCount: existing.purchasesCount + (isPurchase ? 1 : 0),
                rentalsCount: existing.rentalsCount + (!isPurchase ? 1 : 0),
                lastVisit: new Date().toISOString()
            });
        } else {
            const id = generateId('cust');
            await setDoc(doc(db, 'customers', id), {
                id, ...c, rentalsCount: isPurchase ? 0 : 1, purchasesCount: isPurchase ? 1 : 0,
                firstVisit: new Date().toISOString(), lastVisit: new Date().toISOString(), notes: ''
            });
        }
    };
    const updateCustomer = async (id: string, c: Partial<Customer>) => {
        await updateDoc(doc(db, 'customers', id), c);
    };
    const deleteCustomer = async (id: string) => {
        await deleteDoc(doc(db, 'customers', id));
    };

    const addServiceOrder = async (so: Omit<ServiceOrder, 'id' | 'date'>) => {
        const id = generateId('so');
        await setDoc(doc(db, 'serviceOrders', id), { ...so, id, date: new Date().toISOString() });
    };
    const updateServiceOrder = async (id: string, so: Partial<ServiceOrder>) => {
        await updateDoc(doc(db, 'serviceOrders', id), so);
    };
    const deleteServiceOrder = async (id: string) => {
        await deleteDoc(doc(db, 'serviceOrders', id));
    };

    const resetAllData = async () => {
        const batch = writeBatch(db);
        inventory.forEach(i => batch.delete(doc(db, 'inventory', i.id)));
        combos.forEach(c => batch.delete(doc(db, 'combos', c.id)));
        rentals.forEach(r => batch.delete(doc(db, 'rentals', r.id)));
        sales.forEach(s => batch.delete(doc(db, 'sales', s.id)));
        customers.forEach(c => batch.delete(doc(db, 'customers', c.id)));
        serviceOrders.forEach(s => batch.delete(doc(db, 'serviceOrders', s.id)));
        await batch.commit();
    };

    const value: StoreContextType = {
        inventory, combos, rentals, sales, customers, serviceOrders, isLoaded,
        addInventoryItem, updateInventoryItem, deleteInventoryItem,
        addCombo, updateCombo, deleteCombo,
        addRental, confirmRental, cancelRental, deleteRental,
        updateRentalPaymentStatus, markRentalExpired,
        addSale, updateSaleStatus, deleteSale,
        addOrUpdateCustomer, updateCustomer, deleteCustomer,
        addServiceOrder, updateServiceOrder, deleteServiceOrder,
        getItemStock, getComboAvailability, calculatePrice, resetAllData,
        currentCustomer, loginCustomer, registerCustomer, logoutCustomer
    };

    return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

function safeJSON<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
}
