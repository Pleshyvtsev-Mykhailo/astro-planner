import type { CurvePoint, Horizon } from '../api/types';

export const HORIZON_LABELS: Record<Horizon, string> = {
  RisesAndSets: 'Сходить і заходить',
  AlwaysAbove: 'Завжди над горизонтом',
  NeverRises: 'Ніколи не сходить',
};

const HOUR_MS = 3600000;

// Сьогоднішня дата за годинником користувача у форматі yyyy-MM-dd
export function todayLocal(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function isValidDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

export function parseUtc(value: string): number {
  const hasZone = /(Z|[+-]\d{2}:?\d{2})$/i.test(value);
  return Date.parse(hasZone ? value : `${value}Z`);
}

export function solarClock(utcMs: number, longitude: number): string {
  const shifted = new Date(utcMs + (longitude / 15) * HOUR_MS);
  const h = String(shifted.getUTCHours()).padStart(2, '0');
  const m = String(shifted.getUTCMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export interface ChartPoint {
  x: number;
  altitude: number;
}

export function buildChartData(points: CurvePoint[]): { t0: number; data: ChartPoint[] } {
  if (points.length === 0) return { t0: 0, data: [] };
  const t0 = parseUtc(points[0].timeUtc);
  const data = points.map((p) => ({
    x: (parseUtc(p.timeUtc) - t0) / HOUR_MS,
    altitude: p.altitudeDegrees,
  }));
  return { t0, data };
}

export function findDarkRanges(points: CurvePoint[], t0: number): [number, number][] {
  const ranges: [number, number][] = [];
  let start: number | null = null;
  let last = 0;
  for (const p of points) {
    const x = (parseUtc(p.timeUtc) - t0) / HOUR_MS;
    if (p.sunAltitudeDegrees < -12) {
      if (start === null) start = x;
      last = x;
    } else if (start !== null) {
      ranges.push([start, last]);
      start = null;
    }
  }
  if (start !== null) ranges.push([start, last]);
  return ranges;
}