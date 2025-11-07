/**
 * SettingsContext - User settings management
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import i18n from '../i18n';
import { useLibraryStore } from '../store/useLibraryStore';

export interface SubtitleSettings {
  enabled: boolean;
  fontSize: number; // 12-24
  color: string; // hex color
  language: string;
}

export interface VideoSettings {
  quality: 'auto' | '360p' | '480p' | '720p' | '1080p';
  autoplay: boolean;
}

export interface AppSettings {
  darkMode: boolean;
  language: string;
  notifications: boolean;
}

export interface UserSettings {
  subtitles: SubtitleSettings;
  video: VideoSettings;
  app: AppSettings;
}

interface SettingsContextType {
  settings: UserSettings;
  loading: boolean;
  updateSubtitleSettings: (settings: Partial<SubtitleSettings>) => Promise<void>;
  updateVideoSettings: (settings: Partial<VideoSettings>) => Promise<void>;
  updateAppSettings: (settings: Partial<AppSettings>) => Promise<void>;
  syncSettings: () => Promise<void>;
  loadSettings: () => Promise<void>;
}

const defaultSettings: UserSettings = {
  subtitles: {
    enabled: true,
    fontSize: 16,
    color: '#FFFFFF',
    language: 'en',
  },
  video: {
    quality: 'auto',
    autoplay: false,
  },
  app: {
    darkMode: true,
    language: 'en',
    notifications: true,
  },
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    i18n.changeLanguage(settings.app.language).catch((error) => console.warn('Language change failed', error));
    useLibraryStore.getState().setLanguage(settings.app.language);
  }, [settings.app.language]);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem('user_settings');
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Load settings error:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: UserSettings) => {
    try {
      await AsyncStorage.setItem('user_settings', JSON.stringify(newSettings));
      setSettings(newSettings);
      
      // Sync to server
      await syncToServer(newSettings);
    } catch (error) {
      console.error('Save settings error:', error);
    }
  };

  const syncToServer = async (settingsToSync: UserSettings) => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (token) {
        // Sync settings to user_settings endpoint
        await fetch('http://localhost:3000/api/user/settings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            settings: settingsToSync,
          }),
        });
      }
    } catch (error) {
      console.error('Sync settings error:', error);
    }
  };

  const updateSubtitleSettings = async (subtitleSettings: Partial<SubtitleSettings>) => {
    const newSettings = {
      ...settings,
      subtitles: { ...settings.subtitles, ...subtitleSettings },
    };
    await saveSettings(newSettings);
  };

  const updateVideoSettings = async (videoSettings: Partial<VideoSettings>) => {
    const newSettings = {
      ...settings,
      video: { ...settings.video, ...videoSettings },
    };
    await saveSettings(newSettings);
  };

  const updateAppSettings = async (appSettings: Partial<AppSettings>) => {
    const newSettings = {
      ...settings,
      app: { ...settings.app, ...appSettings },
    };
    await saveSettings(newSettings);
    if (appSettings.language) {
      i18n.changeLanguage(appSettings.language).catch((error) => console.warn('Language change failed', error));
      useLibraryStore.getState().setLanguage(appSettings.language);
    }
  };

  const syncSettings = async () => {
    await syncToServer(settings);
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        updateSubtitleSettings,
        updateVideoSettings,
        updateAppSettings,
        syncSettings,
        loadSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};

