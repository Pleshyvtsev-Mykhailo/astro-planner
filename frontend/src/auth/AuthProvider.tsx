import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register, getMe } from '../api/auth';
import { setUnauthorizedHandler } from '../api/client';
import { AuthContext, type AuthContextValue, type AuthUser } from './authContext';
import { clearToken, getToken, setToken } from './tokenStorage';

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready'>(() =>
    getToken() ? 'loading' : 'ready',
  );

  useEffect(() => {
    if (!getToken()) return;
    let cancelled = false;
    getMe()
      .then((me) => {
        if (!cancelled) setUser({ username: me.username, role: me.role });
      })
      .catch(() => {
        clearToken();
      })
      .finally(() => {
        if (!cancelled) setStatus('ready');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearToken();
      setUser(null);
      navigate('/login', {
        replace: true,
        state: { from: window.location.pathname + window.location.search, expired: true },
      });
    });
    return () => setUnauthorizedHandler(null);
  }, [navigate]);

  const signIn = useCallback(async (username: string, password: string) => {
    const response = await login(username, password);
    setToken(response.accessToken);
    setUser({ username: response.username, role: response.role });
  }, []);

  const signUp = useCallback(
    async (username: string, password: string) => {
      await register(username, password);
      await signIn(username, password);
    },
    [signIn],
  );

  const signOut = useCallback(() => {
    clearToken();
    setUser(null);
    navigate('/objects', { replace: true });
  }, [navigate]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, signIn, signUp, signOut }),
    [user, status, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}