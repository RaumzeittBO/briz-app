export interface RentalMoneyRow {
  id?: string;
  reservationCode?: string;
  date?: string;
  createdAt?: string;
  createdDate?: string;
  paidAt?: string;
  amountPaid?: number;
  paymentMethod?: string;
  total?: number;
  paymentStatus?: string;
  status?: string;
  store?: string;
}

export interface RentalMoneySummary {
  contracted: number;
  collected: number;
  refunded: number;
  corrected: number;
  /** Net receipts retained across all payment methods, after recorded refunds. */
  netCash: number;
  /** Recognized rental income after non-cash accounting corrections. */
  netRecognized: number;
  pending: number;
  collectedDateUnknown: number;
}

export interface RentalPaymentMovement {
  id?: string;
  movementId?: string;
  reservationCode: string;
  store?: string;
  type: 'receipt' | 'refund' | 'correction';
  amount: number;
  method?: string;
  rentalIds?: string[];
  actualAt?: string | null;
  referenceMovementId?: string;
  legacy?: boolean;
}

export type RentalReceiptMethod = 'Efectivo' | 'QR' | 'Transferencia' | 'Sin especificar';
export type ReceiptMethodTotals = Record<RentalReceiptMethod, number>;

export function normalizeReceiptMethod(value?: string): RentalReceiptMethod {
  const method = String(value || '').trim().toLocaleLowerCase();
  if (method === 'efectivo' || method === 'cash') return 'Efectivo';
  if (method === 'qr') return 'QR';
  if (method === 'transferencia' || method === 'transfer') return 'Transferencia';
  return 'Sin especificar';
}

const emptyReceiptMethodTotals = (): ReceiptMethodTotals => ({
  Efectivo: 0,
  QR: 0,
  Transferencia: 0,
  'Sin especificar': 0,
});

/** Sum receipts by their verified method and real payment date without counting a legacy projection twice. */
export function summarizeRentalReceiptsByMethod(
  rows: RentalMoneyRow[],
  movements: RentalPaymentMovement[],
  start: string,
  end: string,
  includeUndatedLegacyPayments = false,
): { byMethod: ReceiptMethodTotals; total: number; dateUnknown: number } {
  const byMethod = emptyReceiptMethodTotals();
  let dateUnknown = 0;
  const rowsById = new Map(rows.map(row => [String(row.id || ''), row]));
  const groups = new Map<string, RentalMoneyRow[]>();
  rows.forEach(row => {
    const key = String(row.reservationCode || row.id || '');
    groups.set(key, [...(groups.get(key) || []), row]);
  });
  const movementGroups = new Set(movements.map(movement => String(movement.reservationCode || '')));
  const add = (method: RentalReceiptMethod, amount: number, undated = false) => {
    const safeAmount = Math.max(0, Number(amount) || 0);
    byMethod[method] += safeAmount;
    if (undated) dateUnknown += safeAmount;
  };

  for (const [groupId, groupRows] of groups) {
    if (movementGroups.has(groupId)) continue;
    for (const row of groupRows) {
      if (row.paymentStatus !== 'paid') continue;
      const amount = Number(row.amountPaid) || Number(row.total) || 0;
      const paymentDay = day(row.paidAt);
      if (paymentDay && paymentDay >= start && paymentDay <= end) {
        add(normalizeReceiptMethod(row.paymentMethod), amount);
      } else if (!paymentDay && includeUndatedLegacyPayments) {
        add(normalizeReceiptMethod(row.paymentMethod), amount, true);
      }
    }
  }

  for (const movement of movements) {
    if (movement.type !== 'receipt') continue;
    const paymentDay = day(movement.actualAt);
    let method = normalizeReceiptMethod(movement.method);
    if (movement.legacy) {
      const sourceMethods = (movement.rentalIds || [])
        .map(id => rowsById.get(String(id))?.paymentMethod)
        .map(normalizeReceiptMethod)
        .filter(value => value !== 'Sin especificar');
      const uniqueSourceMethods = [...new Set(sourceMethods)];
      // The legacy seeder historically defaulted a missing method to cash. Only
      // trust that projection when the original rental row verifies its method.
      method = uniqueSourceMethods.length === 1 ? uniqueSourceMethods[0] : 'Sin especificar';
    }
    if (paymentDay && paymentDay >= start && paymentDay <= end) {
      add(method, movement.amount);
    } else if (!paymentDay && movement.legacy && includeUndatedLegacyPayments) {
      add(method, movement.amount, true);
    }
  }

  return { byMethod, total: Object.values(byMethod).reduce((sum, value) => sum + value, 0), dateUnknown };
}

export function summarizeSalesByMethod<T extends { total?: number; paymentMethod?: string }>(sales: T[]): {
  byMethod: ReceiptMethodTotals;
  total: number;
} {
  const byMethod = emptyReceiptMethodTotals();
  sales.forEach(sale => { byMethod[normalizeReceiptMethod(sale.paymentMethod)] += Math.max(0, Number(sale.total) || 0); });
  return { byMethod, total: Object.values(byMethod).reduce((sum, value) => sum + value, 0) };
}

const effectiveStatuses = new Set(['Confirmado', 'confirmed', 'Entregado', 'delivered', 'Devuelto', 'returned']);
export function filterRentalMoneyByStore<T extends RentalMoneyRow>(rows: T[], selectedStore: string): T[] {
  if (selectedStore === 'all') return rows;
  return rows.filter(row => (row.store || 'Cochabamba') === selectedStore);
}
const day = (value: unknown): string | undefined => {
  if (typeof value !== 'string' || !value) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz' }).format(parsed);
};

/** Separates rental-date contract value from receipts recognized on their actual payment date. */
export function summarizeRentalMoney(
  rows: RentalMoneyRow[],
  start: string,
  end: string,
  includeUndatedLegacyPayments = false,
  movements: RentalPaymentMovement[] = [],
): RentalMoneySummary {
  let contracted = 0;
  let pending = 0;
  let collected = 0;
  let refunded = 0;
  let corrected = 0;
  let collectedDateUnknown = 0;

  const groups = new Map<string, RentalMoneyRow[]>();
  rows.forEach(row => {
    const key = String(row.reservationCode || row.id || '');
    groups.set(key, [...(groups.get(key) || []), row]);
  });
  const movementGroups = new Set(movements.map(movement => String(movement.reservationCode || '')));

  const inDateRange = (value?: string | null) => {
    const valueDay = day(value);
    return Boolean(valueDay && valueDay >= start && valueDay <= end);
  };

  for (const [groupId, groupRows] of groups) {
    const groupTotal = groupRows.reduce((sum, row) => sum + Math.max(0, Number(row.total) || 0), 0);
    const rentalDay = groupRows.map(row => day(row.date) || day(row.createdAt) || day(row.createdDate)).find(Boolean);
    const isInRentalRange = Boolean(rentalDay && rentalDay >= start && rentalDay <= end);
    const isEffective = groupRows.some(row => effectiveStatuses.has(String(row.status || '')));
    const groupMovements = movements.filter(movement => String(movement.reservationCode || '') === groupId);

    let allReceipts = 0;
    for (const movement of groupMovements) {
      const amount = Math.max(0, Number(movement.amount) || 0);
      if (movement.type === 'receipt') allReceipts += amount;
      if (movement.type === 'receipt' && inDateRange(movement.actualAt)) collected += amount;
      if (movement.type === 'receipt' && movement.legacy && !day(movement.actualAt) && includeUndatedLegacyPayments) collectedDateUnknown += amount;
      if (movement.type === 'refund' && inDateRange(movement.actualAt)) refunded += amount;
      if (movement.type === 'correction' && inDateRange(movement.actualAt)) corrected += amount;
    }

    // Preserve historical rows without fabricating payment movements. Once a
    // group has ledger entries, its ledger is the sole money source of truth.
    if (!movementGroups.has(groupId)) {
      for (const row of groupRows) {
        if (row.paymentStatus !== 'paid') continue;
        const amount = Math.max(0, Number(row.amountPaid) || Number(row.total) || 0);
        allReceipts += amount;
        const paymentDay = day(row.paidAt);
        if (!paymentDay) {
          if (includeUndatedLegacyPayments) collectedDateUnknown += amount;
        } else if (paymentDay >= start && paymentDay <= end) collected += amount;
      }
    }

    if (isEffective && isInRentalRange) {
      contracted += groupTotal;
      // Refunds and accounting corrections do not recreate contractual debt.
      pending += Math.max(0, groupTotal - allReceipts);
    }
  }

  const netCash = collected - refunded;
  const netRecognized = netCash - corrected;
  return { contracted, collected, refunded, corrected, netCash, netRecognized, pending, collectedDateUnknown };
}
