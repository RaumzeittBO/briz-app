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
  pending: number;
  collectedDateUnknown: number;
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
): RentalMoneySummary {
  let contracted = 0;
  let pending = 0;
  let collected = 0;
  let collectedDateUnknown = 0;

  for (const row of rows) {
    const total = Math.max(0, Number(row.total) || 0);
    const rentalDay = day(row.date) || day(row.createdAt) || day(row.createdDate);
    const isInRentalRange = Boolean(rentalDay && rentalDay >= start && rentalDay <= end);
    const isEffective = effectiveStatuses.has(String(row.status || ''));
    const paid = row.paymentStatus === 'paid';
    // Only a currently recognized paid state contributes to cash totals. Keep
    // amountPaid/paidAt on the rental as an audit trace when status is corrected.
    const recordedPaid = paid ? Math.max(0, Number(row.amountPaid) || total) : 0;
    const amountDue = Math.max(0, total - recordedPaid);

    if (isEffective && isInRentalRange) {
      contracted += total;
      pending += amountDue;
    }

    if (!paid) continue;
    const paymentDay = day(row.paidAt);
    if (!paymentDay) {
      if (includeUndatedLegacyPayments) collectedDateUnknown += recordedPaid;
    } else if (paymentDay >= start && paymentDay <= end) {
      collected += recordedPaid;
    }
  }

  return { contracted, collected, pending, collectedDateUnknown };
}
