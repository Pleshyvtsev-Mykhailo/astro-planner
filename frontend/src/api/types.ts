export type UserRole = 'User' | 'Admin';

export type ObjectType =
  | 'Galaxy'
  | 'Nebula'
  | 'PlanetaryNebula'
  | 'SupernovaRemnant'
  | 'OpenCluster'
  | 'GlobularCluster';

export type Horizon = 'RisesAndSets' | 'AlwaysAbove' | 'NeverRises';

export interface Paged<T> {
  total: number;
  page: number;
  pageSize: number;
  items: T[];
}

export interface CelestialObject {
  id: number;
  name: string;
  commonName: string | null;
  type: ObjectType;
  rightAscensionHours: number;
  declinationDegrees: number;
  magnitude: number;
}

export interface Location {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
}

export interface LoginResponse {
  accessToken: string;
  expiresAtUtc: string;
  username: string;
  role: UserRole;
}

export interface RegisterResponse {
  id: number;
  username: string;
  role: UserRole;
}

export interface MeResponse {
  id: number;
  username: string;
  role: UserRole;
}

export interface VisibilityItem {
  objectId: number;
  name: string;
  commonName: string | null;
  horizon: Horizon;
  visible: boolean;
  bestAltitudeDegrees: number | null;
  bestTimeUtc: string | null;
  hoursAboveMinAltitude: number;
}

export interface VisibilityResponse {
  latitude: number;
  longitude: number;
  date: string;
  minAltitudeDegrees: number;
  darkHours: number;
  items: VisibilityItem[];
}

export interface CurvePoint {
  timeUtc: string;
  altitudeDegrees: number;
  sunAltitudeDegrees: number;
}

export interface CurveResponse {
  objectId: number;
  name: string;
  points: CurvePoint[];
}

export interface Observation {
  id: number;
  userId: number;
  celestialObjectId: number;
  objectName: string;
  locationId: number;
  locationName: string;
  observedAtUtc: string;
  notes: string | null;
}

export interface ObservationInput {
  celestialObjectId: number;
  locationId: number;
  observedAtUtc: string;
  notes?: string;
}