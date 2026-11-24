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
