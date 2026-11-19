import { api } from './client';
import type { CelestialObject, ObjectType, Paged } from './types';

export type ObjectSortBy = 'name' | 'magnitude' | 'ra' | 'dec';

export type ObjectsQuery = {
  search?: string;
  type?: ObjectType;
  minMagnitude?: number;
  maxMagnitude?: number;
  sortBy?: ObjectSortBy;
  descending?: boolean;
  page?: number;
  pageSize?: number;
};

export function getObjects(query: ObjectsQuery): Promise<Paged<CelestialObject>> {
  return api<Paged<CelestialObject>>('/api/objects', { query: { ...query } });
}

export function getObject(id: number): Promise<CelestialObject> {
  return api<CelestialObject>(`/api/objects/${id}`);
}