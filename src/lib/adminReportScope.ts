export interface DatedStoreRecord {
    date?: string;
    store?: string;
    status?: string;
    total?: number;
    costEstimate?: number;
    price?: number;
}

export interface ReportDateRange {
    start: string;
    end: string;
}

export function filterCompletedSales<T extends DatedStoreRecord>(
    sales: T[],
    range: ReportDateRange,
    selectedStore: string,
    getDate: (sale: T) => string,
): T[] {
    return sales.filter((sale) => {
        if (sale.status !== 'Completado') return false;
        if (selectedStore !== 'all' && (sale.store || 'Cochabamba') !== selectedStore) return false;
        const date = getDate(sale);
        return date >= range.start && date <= range.end;
    });
}

export function filterCompletedServiceOrders<T extends DatedStoreRecord>(
    serviceOrders: T[],
    range: ReportDateRange,
    selectedStore: string,
    getDate: (order: T) => string,
): T[] {
    return serviceOrders.filter((order) => {
        if (!['Entregado', 'Listo', 'Terminado'].includes(order.status || '')) return false;
        if (selectedStore !== 'all' && (order.store || 'Cochabamba') !== selectedStore) return false;
        const date = getDate(order);
        return date >= range.start && date <= range.end;
    });
}

export function sumServiceOrderRevenue(serviceOrders: DatedStoreRecord[]): number {
    return serviceOrders.reduce((sum, order) => sum + serviceOrderRevenue(order), 0);
}

export function serviceOrderRevenue(order: DatedStoreRecord): number {
    return Number(order.costEstimate ?? order.price) || 0;
}
