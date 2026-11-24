export type FreeTimeEnvironment = Record<string, string | undefined>;

/** Free Time callables are deliberately emulator-only for this first phase. */
export function isFreeTimeEmulatorRuntime(environment: FreeTimeEnvironment): boolean {
    return environment.FUNCTIONS_EMULATOR === 'true'
        && environment.GCLOUD_PROJECT === 'demo-briz-security';
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
