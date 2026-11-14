import type { BusinessHours } from '@/lib/businessConfig';
import { parseDurationToHours } from '@/lib/rentalPricing';

export type RentalScheduleResult = { valid: true } | { valid: false; reason: string };

const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

function dayKey(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  return dayKeys[new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay()];
}

function minuteOfDay(time: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(time);
  return match ? Number(match[1]) * 60 + Number(match[2]) : NaN;
}

function addHours(date: string, time: string, hours: number) {
  const [year, month, day] = date.split('-').map(Number);
  const mins = minuteOfDay(time) + Math.round(hours * 60);
  const end = new Date(Date.UTC(year, month - 1, day, 0, mins));
  return { date: `${end.getUTCFullYear()}-${String(end.getUTCMonth() + 1).padStart(2, '0')}-${String(end.getUTCDate()).padStart(2, '0')}`, time: `${String(Math.floor(end.getUTCHours())).padStart(2, '0')}:${String(end.getUTCMinutes()).padStart(2, '0')}` };
}

function isOpenAt(hours: BusinessHours, date: string, time: string) {
  const day = hours[dayKey(date)];
  const minute = minuteOfDay(time);
  if (!day || day.closed || !Number.isFinite(minute)) return false;
  return [[day.open, day.close], ...(day.secondShift ? [[day.secondShift.open, day.secondShift.close]] : [])]
    .some(([open, close]) => minute >= minuteOfDay(open) && minute <= minuteOfDay(close));
}

export function validateRentalSchedule(hours: BusinessHours, date: string, pickupTime: string, duration: string | number): RentalScheduleResult {
  if (!isOpenAt(hours, date, pickupTime)) return { valid: false, reason: 'La recogida debe realizarse dentro del horario de atención de esa fecha.' };
  const returned = addHours(date, pickupTime, parseDurationToHours(duration));
  if (!isOpenAt(hours, returned.date, returned.time)) {
    const endDay = hours[dayKey(returned.date)];
    const close = endDay?.secondShift?.close || endDay?.close;
    return { valid: false, reason: endDay && !endDay.closed && close
      ? `La devolución seleccionada supera nuestro horario de atención, que finaliza a las ${close}. Elige una hora anterior o consulta una excepción con BRIZ.`
      : 'La devolución cae en un día cerrado. Elige una duración u horario que termine en un día de atención.' };
  }
  return { valid: true };
}

export function getRentalPickupOptions(hours: BusinessHours, date: string, duration: string | number, intervalMinutes = 30): string[] {
  const intervals = [hours[dayKey(date)]].filter((day) => day && !day.closed)
    .flatMap((day) => [[day.open, day.close], ...(day.secondShift ? [[day.secondShift.open, day.secondShift.close]] : [])]);
  const options = new Set<string>();
  for (const [open, close] of intervals) {
    const start = minuteOfDay(open);
    const end = minuteOfDay(close);
    for (let minute = start; minute <= end; minute += intervalMinutes) {
      const time = `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
      if (validateRentalSchedule(hours, date, time, duration).valid) options.add(time);
    }
  }
  return [...options].sort();
}
