import type { ObjectType } from '../api/types';

export const OBJECT_TYPE_LABELS: Record<ObjectType, string> = {
  Galaxy: 'Галактика',
  Nebula: 'Туманність',
  PlanetaryNebula: 'Планетарна туманність',
  SupernovaRemnant: 'Залишок наднової',
  OpenCluster: 'Розсіяне скупчення',
  GlobularCluster: 'Кулясте скупчення',
};

export const OBJECT_TYPES = Object.keys(OBJECT_TYPE_LABELS) as ObjectType[];

export function formatMagnitude(value: number): string {
  return value.toLocaleString('uk-UA', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
}

export function formatRightAscension(hours: number): string {
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${h} г ${String(m).padStart(2, '0')} хв`;
}

export function formatDeclination(degrees: number): string {
  const sign = degrees < 0 ? '−' : '+';
  const abs = Math.abs(degrees).toLocaleString('uk-UA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${sign}${abs}°`;
}

export interface ParsedNumber {
  value?: number;
  error?: string;
}

export function parseMagnitude(text: string): ParsedNumber {
  const clean = text.trim().replace(',', '.');
  if (clean === '') return {};
  const value = Number(clean);
  if (!Number.isFinite(value)) return { error: 'Введіть число' };
  if (value < -30 || value > 30) return { error: 'Допустимо від −30 до 30' };
  return { value };
}

export function setOrDelete(params: URLSearchParams, key: string, value: string): void {
  if (value) params.set(key, value);
  else params.delete(key);
}