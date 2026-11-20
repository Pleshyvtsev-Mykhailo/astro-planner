import { api } from './client';
import type { Observation, ObservationInput, Paged } from './types';

export type ObservationsQuery = {
  objectId?: number;
  locationId?: number;
  from?: string; // yyyy-MM-dd
  to?: string; // yyyy-MM-dd
  page?: number;
  pageSize?: number;
};

export function getObservations(query: ObservationsQuery): Promise<Paged<Observation>> {
  return api<Paged<Observation>>('/api/observations', { query: { ...query } });
}

export function getObservation(id: number): Promise<Observation> {
  return api<Observation>(`/api/observations/${id}`);
}

export function createObservation(input: ObservationInput): Promise<unknown> {
  return api<unknown>('/api/observations', { method: 'POST', body: input });
}

export function updateObservation(id: number, input: ObservationInput): Promise<void> {
  return api<void>(`/api/observations/${id}`, { method: 'PUT', body: input });
}

export function deleteObservation(id: number): Promise<void> {
  return api<void>(`/api/observations/${id}`, { method: 'DELETE' });
}