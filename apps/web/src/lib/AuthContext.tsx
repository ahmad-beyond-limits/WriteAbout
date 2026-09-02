'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser } from '@writeabout/types';

interface AuthContextType {
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  updateUser: (partialUser: Partial<AuthUser>) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  updateUser: () => {},
  logout: () => {},
  isLoading: true
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('writeabout_user') || localStorage.getItem('swifttype_user');
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      // ignore parsing errors
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (newUser: AuthUser) => {
    setUser(newUser);
    localStorage.setItem('writeabout_user', JSON.stringify(newUser));
    localStorage.setItem('swifttype_user', JSON.stringify(newUser));
  };

  const updateUser = (partialUser: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...partialUser };
      localStorage.setItem('writeabout_user', JSON.stringify(updated));
      localStorage.setItem('swifttype_user', JSON.stringify(updated));
      return updated;
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('writeabout_user');
    localStorage.removeItem('swifttype_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, updateUser, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
