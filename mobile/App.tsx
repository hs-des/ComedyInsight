import React from 'react';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { SettingsProvider } from './src/context/SettingsContext';

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <AppNavigator />
      </SettingsProvider>
    </AuthProvider>
  );
}

