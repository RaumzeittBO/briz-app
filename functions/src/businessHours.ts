import { parseDurationHours } from './domain';

type HoursDay = { closed?: boolean; open?: string; close?: string; secondShift?: { open?: string; close?: string } };
type HoursConfig = Record<string, HoursDay>;
const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
export const DEFAULT_RENTAL_HOURS: HoursConfig = {
    sunday: { closed: false, open: '09:00', close: '14:00' },
    monday: { closed: false, open: '08:00', close: '19:00' },
    tuesday: { closed: false, open: '08:00', close: '19:00' },
    wednesday: { closed: false, open: '08:00', close: '19:00' },
    thursday: { closed: false, open: '08:00', close: '19:00' },
    friday: { closed: false, open: '08:00', close: '19:00' },
    saturday: { closed: false, open: '08:00', close: '19:00' },
};
const minutes = (time: string) => {
    const match = /^(\d{2}):(\d{2})$/.exec(time);
    return match ? Number(match[1]) * 60 + Number(match[2]) : NaN;
};
function dateAndTime(date: string, time: string, hours: number) {
    const [year, month, day] = date.split('-').map(Number);
    const end = new Date(Date.UTC(year, month - 1, day, 0, minutes(time) + Math.round(hours * 60)));
    return { date: `${end.getUTCFullYear()}-${String(end.getUTCMonth() + 1).padStart(2, '0')}-${String(end.getUTCDate()).padStart(2, '0')}`, time: `${String(end.getUTCHours()).padStart(2, '0')}:${String(end.getUTCMinutes()).padStart(2, '0')}` };
}
function openAt(config: HoursConfig, date: string, time: string) {
    const [year, month, day] = date.split('-').map(Number);
    const dayKey = dayKeys[new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay()];
    const schedule = config?.[dayKey];
    const minute = minutes(time);
    return Boolean(schedule && !schedule.closed && Number.isFinite(minute)
        && [[schedule.open, schedule.close], ...(schedule.secondShift ? [[schedule.secondShift.open, schedule.secondShift.close]] : [])]
            .some(([start, end]) => Number.isFinite(minutes(String(start))) && Number.isFinite(minutes(String(end))) && minute >= minutes(String(start)) && minute <= minutes(String(end))));
}
export function validateRentalBusinessHours(config: HoursConfig, date: string, pickupTime: string, duration: string | number, requestedEndTime?: string): string | null {
    if (!openAt(config, date, pickupTime)) return 'La recogida debe realizarse dentro del horario de atención de esa fecha.';
    const durationHours = parseDurationHours(duration);
    let returned = dateAndTime(date, pickupTime, durationHours);
    if (requestedEndTime && durationHours < 24) {
        let endMinute = minutes(requestedEndTime);
        const pickupMinute = minutes(pickupTime);
        if (!Number.isFinite(endMinute)) return 'La hora de devolución no es válida.';
        if (endMinute <= pickupMinute) endMinute += 1440;
        if (endMinute - pickupMinute !== durationHours * 60) return 'La hora de devolución no coincide con la duración seleccionada.';
        const [year, month, day] = date.split('-').map(Number);
        const endDate = new Date(Date.UTC(year, month - 1, day + Math.floor(endMinute / 1440)));
        returned = { date: `${endDate.getUTCFullYear()}-${String(endDate.getUTCMonth() + 1).padStart(2, '0')}-${String(endDate.getUTCDate()).padStart(2, '0')}`, time: `${String(Math.floor((endMinute % 1440) / 60)).padStart(2, '0')}:${String(endMinute % 60).padStart(2, '0')}` };
    }
    if (!openAt(config, returned.date, returned.time)) {
        const [year, month, day] = returned.date.split('-').map(Number);
        const key = dayKeys[new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay()];
        const closing = config?.[key]?.secondShift?.close || config?.[key]?.close;
        return closing && !config?.[key]?.closed
            ? `La devolución supera el horario de atención, que finaliza a las ${closing}.`
            : 'La devolución cae en un día cerrado.';
    }
    return null;
}
