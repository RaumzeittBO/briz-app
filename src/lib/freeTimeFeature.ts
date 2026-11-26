export interface FreeTimeUiEnvironment {
    development: boolean;
    emulatorEnabled: boolean;
    projectId: string;
    explicitFlag: string | boolean | undefined;
    deployment?: string;
}

export function isFreeTimeUiEnabled(environment: FreeTimeUiEnvironment): boolean {
    return isFreeTimeEmulatorUiEnabled(environment) || (
        environment.deployment === 'production' && !environment.development
        && !environment.emulatorEnabled && environment.projectId === 'briz-4ef3a'
    );
}

export function isFreeTimeEmulatorUiEnabled(environment: FreeTimeUiEnvironment): boolean {
    return environment.development
        && environment.emulatorEnabled
        && environment.projectId === 'demo-briz-security'
        && (environment.explicitFlag === true || environment.explicitFlag === 'true');
}
