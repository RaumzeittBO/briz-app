import React, { createContext, useContext, useState, useEffect } from 'react';
import { bikes as mockBikes, products as mockProducts } from '@/data/mockData';

// --- TYPES ---
export interface Bike {
    id: string;
    name: string;
    category: string;
    type: string;
    wheelSize: string;
    description: string;
    pricePerHour: number;
    priceExtraHour?: number;
    pricePerDay: number;
    pricePerWeek: number;
    saleable: boolean;
    salePrice?: number;
    available: boolean;
    stock?: number;
    condition: 'Excelente' | 'Bueno' | 'Regular' | 'En Mantenimiento';
    image: string;
    active?: boolean;
}

export interface Product {
    id: string;
    name: string;
    category: string;
    price: number;
    stock: number;
    description: string;
    image: string;
    active: boolean;
}

export interface Accessory {
    id: string;
    name: string;
    category: string;
    price: number;
    stock: number;
    description: string;
    image: string;
    usageType: 'rental' | 'shop' | 'both';
    active: boolean;
}

// Snapshots for orders and rentals
export interface OrderItemSnapshot {
    id: string;
    name: string;
    price: number;
    quantity: number;
    itemType: 'product' | 'bike' | 'accessory';
    image: string;
}

export interface Sale {
    id: string;
    customerName: string;
    customerPhone: string;
    customerCI: string;
    items: OrderItemSnapshot[];
    total: number;
    status: 'Pendiente' | 'Completado' | 'Cancelado';
    paymentMethod: string;
    notes: string;
    date: string;
}

export interface RentalAccessorySnapshot {
    id: string;
    name: string;
    price: number;
    quantity: number;
}

export interface Rental {
    id: string;
    customerName: string;
    customerPhone: string;
    customerCI: string;
    bikeId: string;
    bikeSnapshot: {
        name: string;
        pricePerHour: number;
        priceExtraHour?: number;
        pricePerDay: number;
        pricePerWeek: number;
        image: string;
    };
    duration: string; // e.g., '1 hora', '1 día'
    bikeQty?: number;
    date: string; // pickup date
    pickupTime: string;
    accessories: RentalAccessorySnapshot[];
    total: number;
    status: 'Pendiente' | 'Confirmado' | 'Activo' | 'Devuelto' | 'Atrasado' | 'Cancelado';
    notes: string;
    createdDate: string;
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
    bikes: Bike[];
    products: Product[];
    accessories: Accessory[];
    sales: Sale[];
    rentals: Rental[];
    customers: Customer[];
    serviceOrders: ServiceOrder[];

    // Actions
    addBike: (b: Bike) => void;
    updateBike: (id: string, b: Partial<Bike>) => void;
    deleteBike: (id: string) => void;

    addProduct: (p: Product) => void;
    updateProduct: (id: string, p: Partial<Product>) => void;
    deleteProduct: (id: string) => void;

    addAccessory: (a: Accessory) => void;
    updateAccessory: (id: string, a: Partial<Accessory>) => void;
    deleteAccessory: (id: string) => void;

    addSale: (s: Omit<Sale, 'id' | 'date' | 'status'>) => void;
    updateSaleStatus: (id: string, status: Sale['status']) => void;
    deleteSale: (id: string) => void;

    addRental: (r: Omit<Rental, 'id' | 'createdDate' | 'status'>) => void;
    updateRentalStatus: (id: string, status: Rental['status']) => void;
    deleteRental: (id: string) => void;

    updateStock: (items: { id: string, type: 'bike' | 'product' | 'accessory', quantity: number }[], operation: 'deduct' | 'restore') => void;

    addOrUpdateCustomer: (c: { name: string, phone: string, ci: string }, isPurchase: boolean) => void;
    updateCustomer: (id: string, c: Partial<Customer>) => void;
    deleteCustomer: (id: string) => void;

    // Service Orders
    addServiceOrder: (so: Omit<ServiceOrder, 'id' | 'date'>) => void;
    updateServiceOrder: (id: string, so: Partial<ServiceOrder>) => void;
    deleteServiceOrder: (id: string) => void;
}

export const StoreContext = createContext<StoreContextType | null>(null);

export const useStore = () => {
    const context = useContext(StoreContext);
    if (!context) throw new Error("useStore must be used within StoreProvider");
    return context;
};

// Initial data parser logic
const parseMockBikes = () => mockBikes.map(b => ({ ...b, active: true }));

// We need to separate products and accessories from mockData
const parseMockProducts = () => mockProducts.filter(p => !['Accesorios', 'Seguridad', 'Iluminación'].includes(p.category)).map(p => ({
    ...p,
    active: true
}));

const parseMockAccessories = () => mockProducts.filter(p => ['Accesorios', 'Seguridad', 'Iluminación'].includes(p.category)).map(p => ({
    ...p,
    usageType: 'both' as const,
    active: true
}));

export const StoreProvider = ({ children }: { children: React.ReactNode }) => {
    const generateId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // State Hooks
    const [bikes, setBikes] = useState<Bike[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [accessories, setAccessories] = useState<Accessory[]>([]);
    const [sales, setSales] = useState<Sale[]>([]);
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);

    const [isLoaded, setIsLoaded] = useState(false);

    // Initialization
    useEffect(() => {
        const storedBikes = localStorage.getItem('briz_bikes');
        const storedProducts = localStorage.getItem('briz_products');
        const storedAccessories = localStorage.getItem('briz_accessories');
        const storedSales = localStorage.getItem('briz_sales');
        const storedRentals = localStorage.getItem('briz_rentals');
        const storedCustomers = localStorage.getItem('briz_customers');
        const storedServiceOrders = localStorage.getItem('briz_service_orders');

        setBikes(storedBikes ? JSON.parse(storedBikes) : parseMockBikes());
        setProducts(storedProducts ? JSON.parse(storedProducts) : parseMockProducts());
        setAccessories(storedAccessories ? JSON.parse(storedAccessories) : parseMockAccessories());

        // Start Orders, Rentals, Customers completely empty!
        setSales(storedSales ? JSON.parse(storedSales) : []);
        setRentals(storedRentals ? JSON.parse(storedRentals) : []);
        setCustomers(storedCustomers ? JSON.parse(storedCustomers) : []);
        setServiceOrders(storedServiceOrders ? JSON.parse(storedServiceOrders) : []);

        setIsLoaded(true);
    }, []);

    // Persistence Effect
    useEffect(() => {
        if (!isLoaded) return;
        localStorage.setItem('briz_bikes', JSON.stringify(bikes));
        localStorage.setItem('briz_products', JSON.stringify(products));
        localStorage.setItem('briz_accessories', JSON.stringify(accessories));
        localStorage.setItem('briz_sales', JSON.stringify(sales));
        localStorage.setItem('briz_rentals', JSON.stringify(rentals));
        localStorage.setItem('briz_customers', JSON.stringify(customers));
        localStorage.setItem('briz_service_orders', JSON.stringify(serviceOrders));
    }, [bikes, products, accessories, sales, rentals, customers, serviceOrders, isLoaded]);

    const value: StoreContextType = {
        bikes, products, accessories, sales, rentals, customers, serviceOrders,

        addBike: (b) => setBikes(prev => [...prev, b]),
        updateBike: (id, b) => setBikes(prev => prev.map(item => item.id === id ? { ...item, ...b } : item)),
        deleteBike: (id) => setBikes(prev => prev.filter(item => item.id !== id)),

        addProduct: (p) => setProducts(prev => [...prev, p]),
        updateProduct: (id, p) => setProducts(prev => prev.map(item => item.id === id ? { ...item, ...p } : item)),
        deleteProduct: (id) => setProducts(prev => prev.filter(item => item.id !== id)),

        addAccessory: (a) => setAccessories(prev => [...prev, a]),
        updateAccessory: (id, a) => setAccessories(prev => prev.map(item => item.id === id ? { ...item, ...a } : item)),
        deleteAccessory: (id) => setAccessories(prev => prev.filter(item => item.id !== id)),

        addSale: (s) => setSales(prev => {
            return [{ ...s, id: generateId('sale'), status: 'Pendiente', date: new Date().toISOString() }, ...prev];
        }),
        updateSaleStatus: (id, status) => setSales(prev => prev.map(item => item.id === id ? { ...item, status } : item)),
        deleteSale: (id) => setSales(prev => prev.filter(item => item.id !== id)),

        addRental: (r) => setRentals(prev => [{ ...r, id: generateId('rental'), status: 'Pendiente', createdDate: new Date().toISOString() }, ...prev]),
        updateRentalStatus: (id, status) => setRentals(prev => prev.map(item => item.id === id ? { ...item, status } : item)),
        deleteRental: (id) => setRentals(prev => prev.filter(item => item.id !== id)),

        updateStock: (items, operation) => {
            const multiplier = operation === 'deduct' ? -1 : 1;

            items.forEach(item => {
                if (item.type === 'bike') {
                    setBikes(prev => prev.map(b =>
                        b.id === item.id ? { ...b, stock: Math.max(0, (b.stock || 1) + (item.quantity * multiplier)) } : b
                    ));
                } else if (item.type === 'product') {
                    setProducts(prev => prev.map(p =>
                        p.id === item.id ? { ...p, stock: Math.max(0, p.stock + (item.quantity * multiplier)) } : p
                    ));
                } else if (item.type === 'accessory') {
                    setAccessories(prev => prev.map(a =>
                        a.id === item.id ? { ...a, stock: Math.max(0, a.stock + (item.quantity * multiplier)) } : a
                    ));
                }
            });
        },

        addOrUpdateCustomer: (c, isPurchase) => setCustomers(prev => {
            const existingIndex = prev.findIndex(cust => cust.ci === c.ci || cust.phone === c.phone);
            if (existingIndex >= 0) {
                const updated = [...prev];
                const cust = updated[existingIndex];
                updated[existingIndex] = {
                    ...cust,
                    name: c.name,
                    phone: c.phone,
                    ci: c.ci,
                    purchasesCount: cust.purchasesCount + (isPurchase ? 1 : 0),
                    rentalsCount: cust.rentalsCount + (!isPurchase ? 1 : 0),
                    lastVisit: new Date().toISOString()
                };
                return updated;
            } else {
                return [{
                    id: generateId('cust'),
                    name: c.name,
                    phone: c.phone,
                    ci: c.ci,
                    purchasesCount: isPurchase ? 1 : 0,
                    rentalsCount: !isPurchase ? 1 : 0,
                    firstVisit: new Date().toISOString(),
                    lastVisit: new Date().toISOString(),
                    notes: ''
                }, ...prev];
            }
        }),
        deleteCustomer: (id) => setCustomers(prev => prev.filter(item => item.id !== id)),
        updateCustomer: (id, c) => setCustomers(prev => prev.map(item => item.id === id ? { ...item, ...c } : item)),

        addServiceOrder: (so) => setServiceOrders(prev => [{ ...so, id: generateId('so'), date: new Date().toISOString() }, ...prev]),
        updateServiceOrder: (id, so) => setServiceOrders(prev => prev.map(item => item.id === id ? { ...item, ...so } : item)),
        deleteServiceOrder: (id) => setServiceOrders(prev => prev.filter(item => item.id !== id)),
    };

    if (!isLoaded) return null;

    return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};
