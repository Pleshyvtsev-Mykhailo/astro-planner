import { api } from './client';
import type { Location, Paged } from './types';

export type LocationsQuery = {
  search?: string;
  sortBy?: 'name' | 'latitude' | 'longitude';
  descending?: boolean;
  page?: number;
  pageSize?: number;
};

export function getLocations(query: LocationsQuery = {}): Promise<Paged<Location>> {
  return api<Paged<Location>>('/api/locations', { query: { ...query } });
}