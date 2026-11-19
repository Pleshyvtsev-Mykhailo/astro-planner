import { useOutletContext } from 'react-router-dom';
import type { CelestialObject } from '../api/types';

export interface ObjectOutletContext {
  object: CelestialObject;
}

export function useObject(): CelestialObject {
  return useOutletContext<ObjectOutletContext>().object;
}