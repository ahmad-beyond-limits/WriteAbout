'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserSettings, ThemeMode, CaretStyle, TestMode } from '@writeabout/types';
import { useAuth } from './AuthContext';

interface SettingsContextType {
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  isLoading: boolean;
}

const defaultSettings: UserSettings = {
  id: 0,
  userId: 0,
  theme: 'dark',
  font: 'Inter',
  fontSize: 18,
  caretStyle: 'line',
  smoothCaret: 'slow',
  soundEnabled: false,
  soundVolume: 0.5,
  punctuation: false,
  numbers: false,
  language: 'english',
  defaultTestMode: 'time',
  defaultTestDuration: 30,
  updatedAt: new Date()
};

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  updateSettings: async () => {},
  isLoading: true
});

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Apply theme and font to DOM
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', settings.theme);
      document.documentElement.style.setProperty('--font-family', settings.font);
    }
  }, [settings.theme, settings.font]);

  // Load from local storage or server
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // 1. Try local storage first
        const local = localStorage.getItem('swifttype_settings');
        if (local) {
          const parsed = JSON.parse(local);
          setSettings(prev => ({ ...prev, ...parsed }));
        }

        // 2. If authenticated, fetch from Neon database
        if (user) {
          const res = await fetch(`/api/settings?userId=${user.id}`);
          if (res.ok) {
            const data = await res.json();
            if (data.settings) {
              setSettings(prev => ({ ...prev, ...data.settings }));
              localStorage.setItem('swifttype_settings', JSON.stringify(data.settings));
            }
          }
        }
      } catch (err) {
        console.error('Error loading settings:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [user]);

  const updateSettings = async (partial: Partial<UserSettings>) => {
    const updated = { ...settings, ...partial };
    setSettings(updated);
    localStorage.setItem('swifttype_settings', JSON.stringify(updated));

    if (user) {
      try {
        await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, settings: updated })
        });
      } catch (err) {
        console.error('Failed to sync settings to server:', err);
      }
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, isLoading }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
