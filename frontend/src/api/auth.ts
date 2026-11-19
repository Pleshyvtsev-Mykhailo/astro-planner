import { api } from './client';
import type { LoginResponse, MeResponse, RegisterResponse } from './types';

export function login(username: string, password: string): Promise<LoginResponse> {
  return api<LoginResponse>('/api/auth/login', { method: 'POST', body: { username, password } });
}

export function register(username: string, password: string): Promise<RegisterResponse> {
  return api<RegisterResponse>('/api/auth/register', {
    method: 'POST',
    body: { username, password },
  });
}

export function getMe(): Promise<MeResponse> {
  return api<MeResponse>('/api/auth/me', { skipUnauthorizedHandler: true });
}