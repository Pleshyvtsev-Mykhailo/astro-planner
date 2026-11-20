import { parseUtc } from './visibility';

const pad = (n: number) => String(n).padStart(2, '0');

export function formatDateTime(iso: string): string {
  return new Date(parseUtc(iso)).toLocaleString('uk-UA', { dateStyle: 'medium', timeStyle: 'short' });
}

export function toLocalInput(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function isoToLocalInput(iso: string): string {
  return toLocalInput(new Date(parseUtc(iso)));
}

export interface ParsedDateTime {
  iso?: string;
  error?: string;
}

export function parseLocalDateTime(value: string): ParsedDateTime {
  if (!value) return { error: 'Вкажіть дату й час' };
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return { error: 'Вкажіть коректну дату й час' };
  if (d.getFullYear() < 1900) return { error: 'Дата не може бути раніше 1900 року' };
  if (d.getTime() > Date.now() + 24 * 3600000) {
    return { error: 'Дата не може бути пізніше ніж завтра' };
  }
  return { iso: d.toISOString() };
}