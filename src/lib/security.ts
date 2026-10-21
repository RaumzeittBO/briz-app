import type { Customer, Rental } from '@/context/StoreContext';

const PBKDF2_PREFIX = 'pbkdf2$';
const LEGACY_SHA256_PREFIX = 'sha256$';
const PBKDF2_ITERATIONS = 100000;

function bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex: string): Uint8Array {
    const clean = hex.length % 2 === 0 ? hex : `0${hex}`;
    const out = new Uint8Array(clean.length / 2);
    for (let i = 0; i < out.length; i++) {
        out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16) || 0;
    }
    return out;
}

/**
 * Legacy deterministic SHA-256 digest kept strictly for verifying `sha256$` hashes
 * created before the PBKDF2-HMAC-SHA256 upgrade.
 */
async function computeLegacySha256Hash(password: string): Promise<string> {
    const normalized = password.trim();
    if (!normalized) return '';
    if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
        const encoder = new TextEncoder();
        const data = encoder.encode(`briz_salt_v1:${normalized}`);
        const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
        return `${LEGACY_SHA256_PREFIX}${bytesToHex(new Uint8Array(hashBuffer))}`;
    }
    let h1 = 0xdeadbeef ^ normalized.length;
    let h2 = 0x41c6ce57 ^ normalized.length;
    for (let i = 0, ch; i < normalized.length; i++) {
        ch = normalized.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return `${LEGACY_SHA256_PREFIX}${(h2 >>> 0).toString(16).padStart(8, '0')}${(h1 >>> 0).toString(16).padStart(8, '0')}`;
}

async function derivePbkdf2Hex(password: string, saltBytes: Uint8Array, iterations: number): Promise<string> {
    const encoder = new TextEncoder();
    const keyMaterial = await globalThis.crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
    );
    const derivedBits = await globalThis.crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: saltBytes as BufferSource,
            iterations,
            hash: 'SHA-256'
        },
        keyMaterial,
        256
    );
    return bytesToHex(new Uint8Array(derivedBits));
}

/**
 * Generates a PBKDF2-HMAC-SHA256 password hash with a 16-byte random salt and 100,000 iterations:
 * Format: `pbkdf2$100000$<saltHex>$<hashHex>`
 */
export async function hashPassword(password: string): Promise<string> {
    const normalized = password.trim();
    if (!normalized) return '';
    if (normalized.startsWith(PBKDF2_PREFIX)) return normalized;

    if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle && globalThis.crypto?.getRandomValues) {
        const salt = new Uint8Array(16);
        globalThis.crypto.getRandomValues(salt);
        const derivedHex = await derivePbkdf2Hex(normalized, salt, PBKDF2_ITERATIONS);
        return `${PBKDF2_PREFIX}${PBKDF2_ITERATIONS}$${bytesToHex(salt)}$${derivedHex}`;
    }

    return computeLegacySha256Hash(normalized);
}

export function isPasswordHashed(storedPassword?: string): boolean {
    return Boolean(
        storedPassword &&
        (storedPassword.startsWith(PBKDF2_PREFIX) || storedPassword.startsWith(LEGACY_SHA256_PREFIX))
    );
}

/**
 * Constant-time string comparison to mitigate timing attacks.
 */
function constantTimeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) {
        diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return diff === 0;
}

/**
 * Verifies a candidate password against a stored password.
 * Supports:
 * 1. Modern `pbkdf2$<iterations>$<saltHex>$<hashHex>` (`needsUpgrade: false`)
 * 2. Intermediate `sha256$<hashHex>` (`needsUpgrade: true` -> auto-upgrades to PBKDF2 on login)
 * 3. Legacy plaintext passwords (`needsUpgrade: true` -> auto-upgrades to PBKDF2 on login)
 */
export async function verifyPassword(
    candidatePassword: string,
    storedPassword?: string
): Promise<{ valid: boolean; needsUpgrade: boolean }> {
    if (!storedPassword) {
        return { valid: false, needsUpgrade: false };
    }
    const candidateTrimmed = candidatePassword.trim();

    if (storedPassword.startsWith(PBKDF2_PREFIX)) {
        const parts = storedPassword.split('$');
        // Format: ['pbkdf2', '100000', '<saltHex>', '<hashHex>']
        if (parts.length === 4 && typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
            const iterations = Math.max(1000, parseInt(parts[1], 10) || PBKDF2_ITERATIONS);
            const saltBytes = hexToBytes(parts[2]);
            const expectedHex = parts[3];
            const derivedHex = await derivePbkdf2Hex(candidateTrimmed, saltBytes, iterations);
            const valid = constantTimeEqual(derivedHex, expectedHex);
            return { valid, needsUpgrade: valid && iterations < PBKDF2_ITERATIONS };
        }
        return { valid: false, needsUpgrade: false };
    }

    if (storedPassword.startsWith(LEGACY_SHA256_PREFIX)) {
        const legacyHash = await computeLegacySha256Hash(candidateTrimmed);
        const valid = constantTimeEqual(legacyHash, storedPassword);
        return { valid, needsUpgrade: valid };
    }

    // Legacy plaintext comparison
    const valid = storedPassword === candidatePassword || storedPassword === candidateTrimmed;
    return { valid, needsUpgrade: valid };
}

/**
 * Strips sensitive fields (such as password hashes or plaintext passwords)
 * before persisting a customer profile in localStorage or React state.
 */
export function sanitizeCustomerForSession(customer: Customer): Customer {
    const sanitized = { ...customer };
    delete sanitized.password;
    return sanitized;
}

/**
 * Strips customer PII from rental records when used in unauthenticated
 * public sessions solely for calculating bike/accessory time-slot availability.
 */
export function sanitizeRentalForPublicAvailability(rental: Rental): Rental {
    return {
        ...rental,
        customerName: 'Reservado',
        customerPhone: '',
        customerCI: '',
        customerEmail: undefined,
        customerAddress: undefined,
        autofotoUrl: undefined,
        documentoUrl: undefined,
        documentoReversoUrl: undefined,
        paymentProofUrl: undefined,
        notes: '',
    };
}
