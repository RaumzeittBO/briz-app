/**
 * Bolivia (America/La_Paz, UTC-4) Date & Time Utilities
 * Ensures consistent dates across public booking, admin management, and financial reports
 * regardless of the user's browser timezone or late-evening UTC rollover (after 20:00 BOT).
 */

export const BOLIVIA_TIMEZONE = 'America/La_Paz';

/**
 * Formats a Date (or ISO string / timestamp) as 'YYYY-MM-DD' in America/La_Paz (UTC-4).
 */
export function toBoliviaDateString(input: Date | string | number = new Date()): string {
    if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input.trim())) {
        return input.trim();
    }
    const date = input instanceof Date ? input : new Date(input);
    if (isNaN(date.getTime())) {
        // Fallback to current Bolivia date
        return toBoliviaDateString(new Date());
    }
    try {
        const parts = new Intl.DateTimeFormat('en-CA', {
            timeZone: BOLIVIA_TIMEZONE,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        }).formatToParts(date);
        const y = parts.find(p => p.type === 'year')?.value;
        const m = parts.find(p => p.type === 'month')?.value;
        const d = parts.find(p => p.type === 'day')?.value;
        if (y && m && d) return `${y}-${m}-${d}`;
    } catch {
        // Fallback manual UTC-4 calculation
    }
    const boliviaMs = date.getTime() - 4 * 60 * 60 * 1000;
    const boliviaDate = new Date(boliviaMs);
    const yyyy = boliviaDate.getUTCFullYear();
    const mm = String(boliviaDate.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(boliviaDate.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

/**
 * Returns the current year in Bolivia timezone.
 */
export function getBoliviaYear(input: Date = new Date()): number {
    return parseInt(toBoliviaDateString(input).slice(0, 4), 10);
}

/**
 * Parses a 'YYYY-MM-DD' and optional 'HH:MM' into a timestamp (ms) in America/La_Paz (-04:00).
 */
export function parseBoliviaDateTime(dateStr: string, timeStr: string = '09:00'): number {
    const cleanDate = (dateStr || '').trim().slice(0, 10);
    const cleanTime = /^\d{1,2}:\d{2}$/.test((timeStr || '').trim())
        ? timeStr.trim().padStart(5, '0')
        : '09:00';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
        const parsed = new Date(dateStr);
        return isNaN(parsed.getTime()) ? Date.now() : parsed.getTime();
    }
    const isoWithOffset = `${cleanDate}T${cleanTime}:00-04:00`;
    const ms = Date.parse(isoWithOffset);
    return isNaN(ms) ? Date.now() : ms;
}

/**
 * Adds days to a 'YYYY-MM-DD' string and returns 'YYYY-MM-DD'.
 */
export function addDaysToDateString(dateStr: string, days: number): string {
    const ms = parseBoliviaDateTime(dateStr, '12:00') + days * 24 * 60 * 60 * 1000;
    return toBoliviaDateString(new Date(ms));
}
