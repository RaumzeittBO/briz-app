import { randomUUID } from 'node:crypto';
import { FieldValue, type Firestore, type DocumentReference } from 'firebase-admin/firestore';
import { MAX_TRANSLATABLE_FIELD_CHARS, MAX_TRANSLATION_BATCH_CHARS, MAX_TRANSLATION_CHARS_PER_DAY, cacheKeyFor, sourceTextHash, TranslationProviderFailure, type TranslationProvider } from './catalogTranslation';

type CacheAttempt = { index: number; key: string; ref: DocumentReference; text: string };
type QuotaDisposition = 'consumed' | 'released' | 'ambiguous';

export interface TranslationQuotaOptions {
    dailyLimit?: number;
    dateKey?: string;
    attemptId?: string;
    now?: () => number;
}

function chars(value: unknown): number {
    const count = Number(value);
    return Number.isSafeInteger(count) && count >= 0 ? count : 0;
}

function failureCode(error: unknown): string {
    return error instanceof Error ? error.name : 'TranslationError';
}

async function claimCacheEntry(db: Firestore, item: CacheAttempt, attemptId: string, providerKey: string, now: number) {
    return db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(item.ref);
        const data = snapshot.data() || {};
        const cached = data.translatedText;
        if (data.status === 'completed' && typeof cached === 'string' && cached.trim()) {
            return { status: 'cached' as const, value: cached };
        }
        if (data.status === 'ambiguous') return { status: 'ambiguous' as const };
        if (data.status === 'pending') {
            const leaseAt = Number(data.leaseAt) || 0;
            if (now - leaseAt < 120_000) return { status: 'busy' as const };
            transaction.update(item.ref, {
                status: 'ambiguous',
                errorCode: 'TranslationAttemptExpiredNeedsReview',
                ambiguousAt: FieldValue.serverTimestamp(),
                leaseAt: FieldValue.delete(),
            });
            return { status: 'ambiguous' as const };
        }
        transaction.set(item.ref, {
            status: 'pending',
            attemptId,
            leaseAt: now,
            sourceHash: sourceTextHash(item.text),
            provider: providerKey,
            version: 1,
        }, { merge: true });
        return { status: 'claimed' as const };
    });
}

async function reserveDailyQuota(
    db: Firestore,
    usageRef: DocumentReference,
    reservationRef: DocumentReference,
    characters: number,
    dailyLimit: number,
): Promise<void> {
    await db.runTransaction(async (transaction) => {
        const reservationSnapshot = await transaction.get(reservationRef);
        if (reservationSnapshot.exists) {
            if (reservationSnapshot.get('status') === 'reserved' && chars(reservationSnapshot.get('characters')) === characters) return;
            throw new Error('TranslationQuotaReservationConflict');
        }
        const usageSnapshot = await transaction.get(usageRef);
        const data = usageSnapshot.data() || {};
        const reserved = chars(data.charactersReserved);
        const consumed = chars(data.charactersConsumed);
        const ambiguous = chars(data.charactersAmbiguous);
        if (reserved + consumed + ambiguous + characters > dailyLimit) throw new Error('TranslationDailyLimitExceeded');
        transaction.set(usageRef, {
            charactersReserved: reserved + characters,
            charactersConsumed: consumed,
            charactersAmbiguous: ambiguous,
            charactersReleased: chars(data.charactersReleased),
            dailyLimit,
            updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
        transaction.create(reservationRef, {
            status: 'reserved',
            characters,
            dailyLimit,
            createdAt: FieldValue.serverTimestamp(),
        });
    });
}

async function settleAttempt(
    db: Firestore,
    usageRef: DocumentReference,
    reservationRef: DocumentReference,
    items: CacheAttempt[],
    attemptId: string,
    providerKey: string,
    disposition: QuotaDisposition,
    outputs?: string[],
    error?: unknown,
): Promise<void> {
    await db.runTransaction(async (transaction) => {
        const reservationSnapshot = await transaction.get(reservationRef);
        const usageSnapshot = await transaction.get(usageRef);
        const cacheSnapshots = [];
        for (const item of items) cacheSnapshots.push(await transaction.get(item.ref));
        const reservation = reservationSnapshot.data() || {};
        if (reservation.status === 'reserved') {
            const usage = usageSnapshot.data() || {};
            const amount = chars(reservation.characters);
            const reserved = chars(usage.charactersReserved);
            transaction.set(usageRef, {
                charactersReserved: Math.max(0, reserved - amount),
                charactersConsumed: chars(usage.charactersConsumed) + (disposition === 'consumed' ? amount : 0),
                charactersAmbiguous: chars(usage.charactersAmbiguous) + (disposition === 'ambiguous' ? amount : 0),
                charactersReleased: chars(usage.charactersReleased) + (disposition === 'released' ? amount : 0),
                dailyLimit: chars(usage.dailyLimit),
                updatedAt: FieldValue.serverTimestamp(),
            }, { merge: true });
            transaction.update(reservationRef, {
                status: disposition,
                settledAt: FieldValue.serverTimestamp(),
                errorCode: error ? failureCode(error) : FieldValue.delete(),
            });
        }
        for (const [index, snapshot] of cacheSnapshots.entries()) {
            const item = items[index];
            if (snapshot.get('attemptId') !== attemptId) continue;
            if (disposition === 'consumed') {
                const output = outputs?.[index];
                if (typeof output !== 'string') throw new Error('TranslationProviderReturnedInvalidText');
                transaction.update(item.ref, {
                    status: 'completed',
                    translatedText: output,
                    provider: providerKey,
                    createdAt: FieldValue.serverTimestamp(),
                    leaseAt: FieldValue.delete(),
                    errorCode: FieldValue.delete(),
                });
            } else if (disposition === 'released') {
                transaction.update(item.ref, {
                    status: 'failed',
                    errorCode: failureCode(error),
                    leaseAt: FieldValue.delete(),
                    failedAt: FieldValue.serverTimestamp(),
                });
            } else {
                transaction.update(item.ref, {
                    status: 'ambiguous',
                    errorCode: failureCode(error),
                    leaseAt: FieldValue.delete(),
                    ambiguousAt: FieldValue.serverTimestamp(),
                });
            }
        }
    });
}

async function failUnreservedClaims(db: Firestore, items: CacheAttempt[], attemptId: string, error: unknown): Promise<void> {
    await db.runTransaction(async (transaction) => {
        const snapshots = [];
        for (const item of items) snapshots.push(await transaction.get(item.ref));
        for (const [index, snapshot] of snapshots.entries()) {
            if (snapshot.get('attemptId') !== attemptId) continue;
            transaction.update(items[index].ref, {
                status: 'failed',
                errorCode: failureCode(error),
                leaseAt: FieldValue.delete(),
                failedAt: FieldValue.serverTimestamp(),
            });
        }
    });
}

async function awaitOtherAttempt(db: Firestore, item: CacheAttempt): Promise<string> {
    for (let attempt = 0; attempt < 20; attempt += 1) {
        await new Promise(resolve => setTimeout(resolve, 250));
        const data = (await item.ref.get()).data() || {};
        if (data.status === 'completed' && typeof data.translatedText === 'string' && data.translatedText.trim()) return data.translatedText;
        if (data.status === 'ambiguous') throw new Error('TranslationResultAmbiguousNeedsReview');
        if (data.status === 'failed') throw new Error('TranslationProviderFailed; retry is safe after definitive rejection.');
    }
    throw new Error('TranslationCacheBusy');
}

/**
 * Calls the provider only after a transactional quota reservation. Confirmed rejects release it;
 * network/timeouts and lost results are charged conservatively and require manual cache recovery.
 */
export async function translateWithQuota(
    db: Firestore,
    texts: string[],
    provider: TranslationProvider,
    providerKey: string,
    options: TranslationQuotaOptions = {},
): Promise<string[]> {
    if (!texts.length) return [];
    const distinctTexts = [...new Set(texts)];
    if (distinctTexts.some(text => !text.trim() || text.length > MAX_TRANSLATABLE_FIELD_CHARS)
        || distinctTexts.reduce((sum, text) => sum + text.length, 0) > MAX_TRANSLATION_BATCH_CHARS) {
        throw new Error('TranslationBatchSizeInvalid');
    }
    const now = options.now || Date.now;
    const attemptId = options.attemptId || randomUUID().replaceAll('-', '');
    const dateKey = options.dateKey || new Date(now()).toISOString().slice(0, 10);
    const dailyLimit = options.dailyLimit ?? MAX_TRANSLATION_CHARS_PER_DAY;
    const items = distinctTexts.map((text, index) => {
        const key = cacheKeyFor(text, providerKey);
        return { index, key, ref: db.doc(`translationCache/${key}`), text };
    });
    const results = new Map<string, string>();
    const pending: CacheAttempt[] = [];
    for (const item of items) {
        const claim = await claimCacheEntry(db, item, attemptId, providerKey, now());
        if (claim.status === 'cached') results.set(item.text, claim.value);
        else if (claim.status === 'claimed') pending.push(item);
        else if (claim.status === 'ambiguous') throw new Error('TranslationResultAmbiguousNeedsReview');
        else results.set(item.text, await awaitOtherAttempt(db, item));
    }
    if (pending.length) {
        const reservedCharacters = pending.reduce((sum, item) => sum + item.text.length, 0);
        const usageRef = db.doc(`translationUsage/${dateKey}`);
        const reservationRef = usageRef.collection('reservations').doc(attemptId);
        try {
            await reserveDailyQuota(db, usageRef, reservationRef, reservedCharacters, dailyLimit);
        } catch (error) {
            await failUnreservedClaims(db, pending, attemptId, error);
            throw error;
        }
        let outputs: string[];
        try {
            outputs = await provider.translateMany(pending.map(item => item.text));
            if (!Array.isArray(outputs) || outputs.length !== pending.length
                || outputs.some(output => typeof output !== 'string' || !output.trim() || output.length > MAX_TRANSLATABLE_FIELD_CHARS)) {
                throw new Error('TranslationProviderReturnedInvalidText');
            }
        } catch (error) {
            const disposition = error instanceof TranslationProviderFailure && error.disposition === 'definitive' ? 'released' : 'ambiguous';
            await settleAttempt(db, usageRef, reservationRef, pending, attemptId, providerKey, disposition, undefined, error);
            throw error;
        }
        await settleAttempt(db, usageRef, reservationRef, pending, attemptId, providerKey, 'consumed', outputs);
        pending.forEach((item, index) => results.set(item.text, outputs[index]));
    }
    return texts.map(text => results.get(text) || '');
}
