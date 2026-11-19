import { api } from './client';
import type { CurveResponse, VisibilityResponse } from './types';

export type VisibilityQuery = {
  latitude: number;
  longitude: number;
  date?: string; // yyyy-MM-dd
  minAltitude?: number; // 0–90
  objectId?: number;
};

export type CurveQuery = {
  latitude: number;
  longitude: number;
  date?: string;
};

export function getVisibility(query: VisibilityQuery): Promise<VisibilityResponse> {
  return api<VisibilityResponse>('/api/visibility', { query: { ...query } });
}

export function getCurve(objectId: number, query: CurveQuery): Promise<CurveResponse> {
  return api<CurveResponse>(`/api/visibility/${objectId}/curve`, { query: { ...query } });
}