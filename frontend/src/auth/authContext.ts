import { createContext, useContext } from 'react';
import type { UserRole } from '../api/types';

export interface AuthUser {
  username: string;
  role: UserRole;
}

export interface AuthContextValue {
  user: AuthUser | null;
  status: 'loading' | 'ready';
  signIn: (username: string, password: string) => Promise<void>;
  signUp: (username: string, password: string) => Promise<void>;
  signOut: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth має використовуватися всередині AuthProvider');
  return value;
}