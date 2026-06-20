import { createContext, useContext, useState, useCallback } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('gestio_token'));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('gestio_user');
    return raw ? JSON.parse(raw) : null;
  });

  const persistSession = (data) => {
    localStorage.setItem('gestio_token', data.token);
    localStorage.setItem('gestio_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  };

  const login = useCallback(async (email, password) => {
    const data = await api.post('/auth/login', { email, password });
    persistSession(data);
  }, []);

  const register = useCallback(async (email, password, nom_entreprise) => {
    const data = await api.post('/auth/register', { email, password, nom_entreprise });
    persistSession(data);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('gestio_token');
    localStorage.removeItem('gestio_user');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}