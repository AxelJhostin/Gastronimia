'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { authApi, UserMe } from '@/lib/api/auth';

interface AuthContextType {
  user: UserMe | null;
  loading: boolean;
  logout: () => Promise<void>;
  hasRole: (roles: ('ADMIN' | 'MANAGER' | 'TEACHER')[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserMe | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const loadUser = async () => {
    try {
      const me = await authApi.getMe();
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        loadUser();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const hasRole = (roles: ('ADMIN' | 'MANAGER' | 'TEACHER')[]) => {
    if (!user) return false;
    return user.roles.some((r) => roles.includes(r));
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}