export interface RentalMoneyRow {
  id?: string;
  reservationCode?: string;
  date?: string;
  createdAt?: string;
  createdDate?: string;
  paidAt?: string;
  amountPaid?: number;
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
  /** Cash actually retained: receipts minus explicitly recorded cash refunds. */
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
  actualAt?: string | null;
  referenceMovementId?: string;
  legacy?: boolean;
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
    let allCorrections = 0;
    for (const movement of groupMovements) {
      const amount = Math.max(0, Number(movement.amount) || 0);
      if (movement.type === 'receipt') allReceipts += amount;
      if (movement.type === 'correction') allCorrections += amount;
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
      // Refunds are cash outflows; they do not recreate contractual debt.
      pending += Math.max(0, groupTotal - allReceipts + allCorrections);
    }
  }

  const netCash = collected - refunded;
  const netRecognized = netCash - corrected;
  return { contracted, collected, refunded, corrected, netCash, netRecognized, pending, collectedDateUnknown };
}
