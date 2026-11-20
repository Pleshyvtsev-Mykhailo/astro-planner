import { getLocations } from './locations';
import { getObjects } from './objects';
import type { CelestialObject, Location as Place, Paged } from './types';

export function loadLookups(): Promise<[Paged<CelestialObject>, Paged<Place>]> {
  return Promise.all([
    getObjects({ sortBy: 'name', pageSize: 100 }),
    getLocations({ sortBy: 'name', pageSize: 100 }),
  ]);
}