import { createHash } from 'node:crypto';

export const MAX_TRANSLATABLE_FIELD_CHARS = 2_000;
export const MAX_TRANSLATION_BATCH_CHARS = 8_000;
export const MAX_TRANSLATION_CHARS_PER_DAY = 10_000;

export type TranslationProvider = {
    translateMany: (texts: string[]) => Promise<string[]>;
};

export type TranslationFailureDisposition = 'definitive' | 'ambiguous';

export class TranslationProviderFailure extends Error {
    constructor(message: string, readonly disposition: TranslationFailureDisposition) {
        super(message);
        this.name = 'TranslationProviderFailure';
    }
}

export type TranslationPair = { source: string; target: string };

export const CATALOG_TRANSLATION_FIELDS: Record<string, TranslationPair[]> = {
    inventory: [
        { source: 'name', target: 'nameEn' },
        { source: 'description', target: 'descriptionEn' },
        { source: 'details', target: 'detailsEn' },
    ],
    combos: [
        { source: 'name', target: 'nameEn' },
        { source: 'description', target: 'descriptionEn' },
        { source: 'details', target: 'detailsEn' },
    ],
    routes: [
        { source: 'name', target: 'nameEn' },
        { source: 'description', target: 'descriptionEn' },
    ],
    events: [
        { source: 'name', target: 'nameEn' },
        { source: 'description', target: 'descriptionEn' },
    ],
};

export function sourceTextHash(value: string): string {
    return createHash('sha256').update(value.normalize('NFC').trim()).digest('hex');
}

export function cacheKeyFor(text: string, provider = 'google-cloud-translation'): string {
    return createHash('sha256').update(`es\0en\0${provider}\0v1\0${text.normalize('NFC').trim()}`).digest('hex');
}

export type PlannedTranslation = { source: string; target: string; text: string; hash: string; parts?: string[] };

export function catalogSourceValue(collection: string, data: Record<string, unknown>, source: string): string | string[] | undefined {
    if (source === 'highlights' && collection === 'routes') return Array.isArray(data.highlights) ? data.highlights.filter((value): value is string => typeof value === 'string') : undefined;
    if (source === 'subcategories.name' && collection === 'events') {
        return Array.isArray(data.subcategories)
            ? data.subcategories.map((value) => value && typeof value === 'object' && typeof (value as Record<string, unknown>).name === 'string' ? (value as Record<string, string>).name : '')
            : undefined;
    }
    const value = data[source];
    return typeof value === 'string' ? value : undefined;
}

export function catalogSourceHash(value: string | string[]): string {
    return sourceTextHash(typeof value === 'string' ? value : JSON.stringify(value));
}

export function protectCommercialTokens(text: string): { masked: string; restore: (translated: string) => string } {
    const protectedValues: string[] = [];
    const tokenPattern = /\bBRIZ\b|\bMamachari\b|\b[A-Z0-9]{2,}(?:-[A-Z0-9]+)*\b|Bs\.?\s?\d[\d.,]*|\d+(?:[.,]\d+)?\s?(?:km\/h|km|cm|mm|kg|g|m|min|hrs?|%|in)\b|\d+(?:[.,]\d+)?\s?"|\b\d+(?:[.,]\d+)?\b/gu;
    const masked = text.replace(tokenPattern, (value) => {
        const token = `ZXQBRIZKEEP${protectedValues.length}QXZ`;
        protectedValues.push(value);
        return token;
    });
    return {
        masked,
        restore(translated) {
            return protectedValues.reduce((output, value, index) => {
                const token = `ZXQBRIZKEEP${index}QXZ`;
                if (!output.includes(token)) throw new Error('Translation provider changed a protected name, code, amount, number, or unit.');
                return output.replace(token, value);
            }, translated);
        },
    };
}

export function planCategoryTranslations(data: Record<string, unknown>): PlannedTranslation[] {
    const categories = Array.isArray(data.categories) ? data.categories.filter((value): value is string => typeof value === 'string') : [];
    const translations = data.translations && typeof data.translations === 'object' ? data.translations as Record<string, unknown> : {};
    const metadata = data.translationMeta && typeof data.translationMeta === 'object' ? data.translationMeta as Record<string, Record<string, unknown>> : {};
    const planned: PlannedTranslation[] = [];
    let total = 0;
    for (const sourceValue of categories) {
        const source = sourceValue.trim();
        if (!source || source.length > MAX_TRANSLATABLE_FIELD_CHARS) continue;
        const hash = sourceTextHash(source);
        const current = typeof translations[source] === 'string' ? (translations[source] as string).trim() : '';
        const meta = metadata[source];
        if (current && !meta) continue;
        if (meta?.origin === 'manual') continue;
        if (meta?.origin === 'automatic' && current && meta.outputHash !== sourceTextHash(current)) continue;
        if (meta?.origin === 'automatic' && meta.sourceHash === hash && current) continue;
        total += source.length;
        if (total > MAX_TRANSLATION_BATCH_CHARS) break;
        planned.push({ source, target: source, text: source, hash });
    }
    return planned;
}

export function buildCategoryTranslationPatch(plan: PlannedTranslation[], outputs: string[], data: Record<string, unknown>, timestamp: string, provider = 'google-cloud-translation'): Record<string, unknown> {
    if (outputs.length !== plan.length) throw new Error('Translation provider returned an unexpected number of results.');
    const currentTranslations = data.translations && typeof data.translations === 'object' ? data.translations as Record<string, unknown> : {};
    const currentMeta = data.translationMeta && typeof data.translationMeta === 'object' ? data.translationMeta as Record<string, unknown> : {};
    const translations = { ...currentTranslations };
    const translationMeta = { ...currentMeta } as Record<string, Record<string, unknown>>;
    plan.forEach((entry, index) => {
        const output = outputs[index].trim();
        if (!output || output.length > MAX_TRANSLATABLE_FIELD_CHARS) throw new Error('Translation provider returned invalid text.');
        translations[entry.source] = output;
        translationMeta[entry.source] = { origin: 'automatic', status: 'completed', sourceHash: entry.hash, outputHash: sourceTextHash(output), provider, version: 1, translatedAt: timestamp };
    });
    return { translations, translationMeta };
}

export function planCatalogTranslations(collection: string, data: Record<string, unknown>): PlannedTranslation[] {
    const pairs = CATALOG_TRANSLATION_FIELDS[collection] || [];
    const metadata = data.translationMeta && typeof data.translationMeta === 'object'
        ? data.translationMeta as Record<string, Record<string, unknown>>
        : {};
    const plan: PlannedTranslation[] = [];
    let total = 0;

    for (const pair of pairs) {
        const sourceValue = data[pair.source];
        const targetValue = data[pair.target];
        if (typeof sourceValue !== 'string' || !sourceValue.trim()) continue;
        const source = sourceValue.trim();
        if (source.length > MAX_TRANSLATABLE_FIELD_CHARS) continue;
        const hash = sourceTextHash(source);
        const meta = metadata[pair.target];
        const currentEnglish = typeof targetValue === 'string' ? targetValue.trim() : '';

        // Existing English text without our provenance is treated as manual and is never overwritten.
        if (currentEnglish && !meta) continue;
        if (meta?.origin === 'manual') continue;
        // If a person edited our generated English field, that edit stays authoritative even if
        // the Spanish source changed at the same time.
        if (meta?.origin === 'automatic' && currentEnglish && meta.outputHash !== sourceTextHash(currentEnglish)) continue;
        if (meta?.origin === 'automatic' && meta.sourceHash === hash && currentEnglish) continue;
        total += source.length;
        if (total > MAX_TRANSLATION_BATCH_CHARS) break;
        plan.push({ source: pair.source, target: pair.target, text: source, hash });
    }

    const arrayField = collection === 'routes'
        ? { source: 'highlights', target: 'highlightsEn' }
        : collection === 'events'
            ? { source: 'subcategories.name', target: 'subcategoryNamesEn' }
            : undefined;
    if (arrayField) {
        const sourceParts = catalogSourceValue(collection, data, arrayField.source);
        const targetParts = Array.isArray(data[arrayField.target]) ? data[arrayField.target] as unknown[] : [];
        const sourceValues = Array.isArray(sourceParts) ? sourceParts.map(value => value.trim()) : [];
        const meta = metadata[arrayField.target];
        const currentEnglish = targetParts.filter((value): value is string => typeof value === 'string').map(value => value.trim());
        if (sourceValues.length && sourceValues.every(Boolean)
            && sourceValues.every(value => value.length <= MAX_TRANSLATABLE_FIELD_CHARS)
            && !(currentEnglish.length && !meta)
            && meta?.origin !== 'manual'
            && !(meta?.origin === 'automatic' && currentEnglish.length && meta.outputHash !== sourceTextHash(JSON.stringify(currentEnglish)))
            && !(meta?.origin === 'automatic' && meta.sourceHash === catalogSourceHash(sourceValues) && currentEnglish.length)) {
            const length = sourceValues.reduce((sum, value) => sum + value.length, 0);
            if (total + length <= MAX_TRANSLATION_BATCH_CHARS) {
                plan.push({ source: arrayField.source, target: arrayField.target, text: sourceValues.join('\n'), parts: sourceValues, hash: catalogSourceHash(sourceValues) });
            }
        }
    }
    return plan;
}

export function buildTranslationPatch(
    plan: PlannedTranslation[],
    translated: Array<string | string[]>,
    data: Record<string, unknown>,
    timestamp: string,
    provider = 'google-cloud-translation',
): Record<string, unknown> {
    if (translated.length !== plan.length) throw new Error('Translation provider returned an unexpected number of results.');
    const existingMeta = data.translationMeta && typeof data.translationMeta === 'object'
        ? data.translationMeta as Record<string, unknown>
        : {};
    const patch: Record<string, unknown> = {};
    const nextMeta = { ...existingMeta } as Record<string, Record<string, unknown>>;
    for (let index = 0; index < plan.length; index += 1) {
        const entry = plan[index];
        const outputValue = translated[index];
        const output = Array.isArray(outputValue) ? outputValue.map(value => value.trim()) : outputValue.trim();
        if (Array.isArray(output)) {
            if (!entry.parts || output.length !== entry.parts.length || output.some(value => !value || value.length > MAX_TRANSLATABLE_FIELD_CHARS)) throw new Error('Translation provider returned invalid text.');
        } else if (entry.parts || !output || output.length > MAX_TRANSLATABLE_FIELD_CHARS) throw new Error('Translation provider returned invalid text.');
        patch[entry.target] = output;
        nextMeta[entry.target] = {
            origin: 'automatic',
            status: 'completed',
            sourceHash: entry.hash,
            outputHash: sourceTextHash(Array.isArray(output) ? JSON.stringify(output) : output),
            provider,
            version: 1,
            translatedAt: timestamp,
        };
    }
    patch.translationMeta = nextMeta;
    return patch;
}

export function createGoogleTranslationProvider(apiKey: string, fetcher: typeof fetch = fetch): TranslationProvider {
    if (!apiKey.trim()) throw new Error('Google Cloud Translation API key is not configured.');
    return {
        async translateMany(texts) {
            const guarded = texts.map(protectCommercialTokens);
            const response = await fetcher('https://translation.googleapis.com/language/translate/v2', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': apiKey },
                body: JSON.stringify({ q: guarded.map(item => item.masked), source: 'es', target: 'en', format: 'text' }),
            });
            if (!response.ok) {
                const definitive = response.status >= 400 && response.status < 500 && response.status !== 408;
                throw new TranslationProviderFailure(`Translation provider rejected the request (HTTP ${response.status}).`, definitive ? 'definitive' : 'ambiguous');
            }
            const payload = await response.json() as { data?: { translations?: Array<{ translatedText?: string }> } };
            const rows = payload.data?.translations;
            if (!Array.isArray(rows) || rows.length !== texts.length || rows.some(row => typeof row.translatedText !== 'string')) {
                throw new Error('Translation provider returned an invalid response.');
            }
            return rows.map((row, index) => guarded[index].restore(decodeHtmlEntities(row.translatedText!)));
        },
    };
}

function decodeHtmlEntities(value: string): string {
    return value.replace(/&amp;|&lt;|&gt;|&quot;|&#39;|&#x27;/g, token => ({
        '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&#x27;': "'",
    })[token]!);
}
