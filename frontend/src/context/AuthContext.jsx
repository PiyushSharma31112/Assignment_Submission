import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    authApi.me()
      .then(({ user: currentUser }) => {
        if (active) setUser(currentUser);
      })
      .catch((requestError) => {
        if (active) {
          setUser(null);
          if (requestError.status !== 401) setError(requestError.message);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    error,
    async login(credentials) {
      const result = await authApi.login(credentials);
      setUser(result.user);
      setError('');
      return result.user;
    },
    async register(details) {
      const result = await authApi.register(details);
      setUser(result.user);
      setError('');
      return result.user;
    },
    async logout() {
      await authApi.logout();
      setUser(null);
      setError('');
    },
  }), [user, loading, error]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
