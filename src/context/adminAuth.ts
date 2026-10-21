import type { AdminProfile, AdminRole } from './AuthContext';

const ALLOWED_ROLES: AdminRole[] = ['admin', 'manager', 'mechanic', 'viewer'];

export type AdminProfileFailure =
    | { kind: 'missing-profile' }
    | { kind: 'inactive-profile' }
    | { kind: 'invalid-role' }
    | { kind: 'profile-read-failed'; code?: string };

export type AdminProfileResult =
    | { profile: AdminProfile; failure: null }
    | { profile: null; failure: Exclude<AdminProfileFailure, { kind: 'profile-read-failed' }> };

export interface AdminProfileSource {
    uid: string;
    email: string | null;
    displayName: string | null;
}

export async function loadAdminProfile(
    user: AdminProfileSource,
    readProfile: (uid: string) => Promise<Partial<AdminProfile> | null>,
    timeoutMs = 15_000,
): Promise<AdminProfileResult> {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const timedRead = new Promise<Partial<AdminProfile> | null>((resolve, reject) => {
        timeout = setTimeout(() => {
            reject(Object.assign(new Error('Admin profile lookup timed out.'), { code: 'firestore/profile-read-timeout' }));
        }, timeoutMs);
        readProfile(user.uid).then(resolve, reject);
    });
    let data: Partial<AdminProfile> | null;
    try {
        data = await timedRead;
    } finally {
        if (timeout) clearTimeout(timeout);
    }
    if (!data) return { profile: null, failure: { kind: 'missing-profile' } };
    if (data.active !== true) return { profile: null, failure: { kind: 'inactive-profile' } };
    if (!ALLOWED_ROLES.includes(data.role as AdminRole)) {
        return { profile: null, failure: { kind: 'invalid-role' } };
    }

    return {
        profile: {
            uid: user.uid,
            email: data.email || user.email || '',
            name: data.name || user.displayName || 'Administrador',
            role: data.role as AdminRole,
            store: data.store || 'all',
            active: true,
        },
        failure: null,
    };
}

export function getFirebaseErrorCode(error: unknown): string | undefined {
    if (typeof error !== 'object' || error === null || !('code' in error)) return undefined;
    const code = (error as { code?: unknown }).code;
    return typeof code === 'string' ? code : undefined;
}

export function formatSignInError(error: unknown): string {
    const code = getFirebaseErrorCode(error);
    switch (code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
            return `Firebase rechazó las credenciales (${code}). Verifica el correo y la contraseña.`;
        case 'auth/user-disabled':
            return 'Esta cuenta está deshabilitada en Firebase Authentication (auth/user-disabled).';
        case 'auth/too-many-requests':
            return 'Firebase limitó temporalmente los intentos. Espera un momento y vuelve a probar (auth/too-many-requests).';
        case 'auth/network-request-failed':
            return 'No se pudo conectar con Firebase Authentication. Comprueba la conexión (auth/network-request-failed).';
        default:
            return code
                ? `No se pudo iniciar sesión. Firebase devolvió ${code}.`
                : 'No se pudo iniciar sesión por un error inesperado. Intenta de nuevo.';
    }
}

export function profileReadFailure(error: unknown): AdminProfileFailure {
    return { kind: 'profile-read-failed', code: getFirebaseErrorCode(error) };
}

export function formatAdminProfileFailure(failure: AdminProfileFailure): string {
    switch (failure.kind) {
        case 'missing-profile':
            return 'Firebase autenticó la cuenta, pero no existe su perfil en adminUsers. El acceso al panel permanece bloqueado.';
        case 'inactive-profile':
            return 'Firebase autenticó la cuenta, pero su perfil Admin está inactivo. El acceso al panel permanece bloqueado.';
        case 'invalid-role':
            return 'Firebase autenticó la cuenta, pero su perfil no tiene un rol Admin válido. El acceso al panel permanece bloqueado.';
        case 'profile-read-failed':
            if (failure.code === 'firestore/profile-read-timeout') {
                return 'Firebase autenticó la cuenta, pero Firestore tardó demasiado en verificar el perfil Admin. El acceso permanece bloqueado; puedes reintentar.';
            }
            return failure.code
                ? `Firebase autenticó la cuenta, pero no se pudo leer su perfil Admin en Firestore (${failure.code}). El acceso permanece bloqueado; puedes reintentar.`
                : 'Firebase autenticó la cuenta, pero no se pudo leer su perfil Admin en Firestore. El acceso permanece bloqueado; puedes reintentar.';
    }
}
