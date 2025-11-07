import React, { useEffect } from 'react';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { SettingsProvider } from './src/context/SettingsContext';
import { registerForPushNotificationsAsync } from './src/services/notification.service';
import { useLibraryStore } from './src/store/useLibraryStore';
import { useMonetizationStore } from './src/store/useMonetizationStore';

import './src/i18n';

const AppBootstrap: React.FC = () => {
  const { user } = useAuth();
  const initialized = useLibraryStore((state) => state.initialized);
  const fetchHome = useLibraryStore((state) => state.fetchHome);
  const setPremiumAccess = useLibraryStore((state) => state.setPremiumAccess);
  const initializeMonetization = useMonetizationStore((state) => state.initialize);
  const isPremium = useMonetizationStore((state) => state.isPremium);

  useEffect(() => {
    if (!initialized) {
      fetchHome().catch(() => void 0);
    }
  }, [initialized, fetchHome]);

  useEffect(() => {
    registerForPushNotificationsAsync().catch(() => void 0);
  }, []);

  useEffect(() => {
    initializeMonetization(user?.id).catch(() => void 0);
  }, [initializeMonetization, user?.id]);

  useEffect(() => {
    setPremiumAccess(isPremium);
  }, [isPremium, setPremiumAccess]);

  return <AppNavigator />;
};

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <AppBootstrap />
      </SettingsProvider>
    </AuthProvider>
  );
}

