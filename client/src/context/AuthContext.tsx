import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { get, post, setToken, getToken } from '../lib/api';
import type { SiteSummary, User } from '../lib/types';

interface AuthResponse {
  token: string;
  user: User;
  sites: SiteSummary[];
}

interface AuthContextValue {
  user: User | null;
  sites: SiteSummary[];
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (name: string, email: string, password: string) => Promise<AuthResponse>;
  logout: () => void;
  refresh: () => Promise<void>;
  setUser: (user: User) => void;
  setSites: (sites: SiteSummary[]) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [sites, setSites] = useState<SiteSummary[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    try {
      const data = await get<{ user: User; sites: SiteSummary[] }>('/auth/me');
      setUserState(data.user);
      setSites(data.sites);
    } catch {
      setToken(null);
      setUserState(null);
      setSites([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function login(email: string, password: string) {
    const data = await post<AuthResponse>('/auth/login', { email, password });
    setToken(data.token);
    setUserState(data.user);
    setSites(data.sites);
    return data;
  }

  async function register(name: string, email: string, password: string) {
    const data = await post<AuthResponse>('/auth/register', { name, email, password });
    setToken(data.token);
    setUserState(data.user);
    setSites(data.sites);
    return data;
  }

  function logout() {
    setToken(null);
    setUserState(null);
    setSites([]);
  }

  return (
    <AuthContext.Provider value={{
      user, sites, loading, login, register, logout, refresh,
      setUser: setUserState,
      setSites,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
