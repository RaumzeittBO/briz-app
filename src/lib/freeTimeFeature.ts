export interface FreeTimeUiEnvironment {
    development: boolean;
    emulatorEnabled: boolean;
    projectId: string;
    explicitFlag: string | boolean | undefined;
}

export function isFreeTimeEmulatorUiEnabled(environment: FreeTimeUiEnvironment): boolean {
    return environment.development
        && environment.emulatorEnabled
        && environment.projectId === 'demo-briz-security'
        && (environment.explicitFlag === true || environment.explicitFlag === 'true');
}
