export type FreeTimeEnvironment = Record<string, string | undefined>;

export type FreeTimeRates = {
    firstHour: number | null;
    halfDay: number | null;
    additionalHour: number | null;
    fullDay: number | null;
};

export function freeTimeMinimum(category: string | undefined): 'one_hour' | 'actual_time' {
    const normalized = (category ?? '').normalize('NFD').replace(/\p{M}/gu, '').trim().toLowerCase();
    return /^(triciclos?|tandems?|cua(?:tri|dri)ciclos?)$/.test(normalized) ? 'actual_time' : 'one_hour';
}

/** Returns an exact reference quote in fractional centavos. It is never a ledger amount. */
export function quoteFreeTime(rates: FreeTimeRates, elapsedMs: number, minimum: 'one_hour' | 'actual_time') {
    if (!Number.isSafeInteger(elapsedMs) || elapsedMs < 0) throw new Error('Duración inválida.');
    const asCents = (rate: number | null) => {
        const cents = Math.round((rate ?? 0) * 100);
        return Number.isSafeInteger(cents) && cents > 0 && cents / 100 === rate ? BigInt(cents) : null;
    };
    const first = asCents(rates.firstHour);
    const half = asCents(rates.halfDay);
    const extra = asCents(rates.additionalHour);
    const full = asCents(rates.fullDay);
    if (first === null || half === null || extra === null || full === null) return { status: 'rate_unavailable' } as const;
    const hour = 3_600_000n;
    const elapsed = BigInt(elapsedMs);
    if (half > full || (minimum === 'one_hour' && first > half)
        || first * 4n < half || half + extra * 4n < full) {
        return { status: 'incompatible_rates' } as const;
    }
    const min = (a: bigint, b: bigint) => a < b ? a : b;
    const billedElapsed = minimum === 'one_hour' && elapsed < hour ? hour : elapsed;
    const raw = elapsed < 4n * hour
        ? min(first * billedElapsed, half * hour)
        : min(half * hour + extra * (min(elapsed, 8n * hour) - 4n * hour), full * hour);
    return {
        status: 'calculated',
        centavoNumerator: raw.toString(),
        centavoDenominator: Number(hour),
        excessMilliseconds: Math.max(0, elapsedMs - 8 * Number(hour)),
    } as const;
}

/** Free Time callables are deliberately emulator-only for this first phase. */
export function isFreeTimeEmulatorRuntime(environment: FreeTimeEnvironment): boolean {
    return environment.FUNCTIONS_EMULATOR === 'true'
        && environment.GCLOUD_PROJECT === 'demo-briz-security';
}

export function isFreeTimeRuntimeEnabled(environment: FreeTimeEnvironment): boolean {
    return isFreeTimeEmulatorRuntime(environment) || (
        environment.FUNCTIONS_EMULATOR !== 'true'
        && Boolean(environment.K_SERVICE)
        && (environment.GCLOUD_PROJECT || environment.GOOGLE_CLOUD_PROJECT) === 'briz-4ef3a'
    );
}

export function elapsedFreeTimeMilliseconds(startedAtMs: number, closedAtMs: number): number {
    if (!Number.isSafeInteger(startedAtMs) || !Number.isSafeInteger(closedAtMs) || closedAtMs < startedAtMs) {
        throw new Error('El intervalo de la sesión no es válido.');
    }
    return closedAtMs - startedAtMs;
}

export interface FreeTimeProration {
    elapsedMilliseconds: number;
    elapsedMinutes: number;
    unroundedAmount: number;
}

/** Raw per-minute proration only. Minimums, rounding, caps and fees belong to confirmed business rules. */
export function calculateFreeTimeProration(hourlyRate: number, startedAtMs: number, closedAtMs: number): FreeTimeProration {
    if (!Number.isFinite(hourlyRate) || hourlyRate <= 0) throw new Error('La tarifa horaria debe ser válida.');
    const elapsedMilliseconds = elapsedFreeTimeMilliseconds(startedAtMs, closedAtMs);
    const elapsedMinutes = elapsedMilliseconds / 60_000;
    return {
        elapsedMilliseconds,
        elapsedMinutes,
        unroundedAmount: hourlyRate * elapsedMilliseconds / 3_600_000,
    };
}
