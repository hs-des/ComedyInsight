/**
 * AuthContext - Authentication state management
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../services/api.service';

export interface User {
  id: string;
  username: string;
  email: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  profile_picture_url?: string;
  is_verified: boolean;
  subscription_active?: boolean;
}

export interface ConnectedProvider {
  provider: 'google' | 'apple' | 'facebook';
  connected: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  connectedProviders: ConnectedProvider[];
  loginWithOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, code: string) => Promise<void>;
  loginWithOAuth: (provider: 'google' | 'apple' | 'facebook', token: string) => Promise<void>;
  linkProvider: (provider: 'google' | 'apple' | 'facebook', token: string) => Promise<void>;
  unlinkProvider: (provider: 'google' | 'apple' | 'facebook') => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectedProviders, setConnectedProviders] = useState<ConnectedProvider[]>([]);

  // Load user from storage on mount
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('access_token');
      
      if (userStr && token) {
        setUser(JSON.parse(userStr));
        await refreshProviders();
      }
    } catch (error) {
      console.error('Load user error:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshProviders = async () => {
    try {
      // Fetch connected providers from API
      const providers: ConnectedProvider[] = [
        { provider: 'google', connected: false },
        { provider: 'apple', connected: false },
        { provider: 'facebook', connected: false },
      ];
      setConnectedProviders(providers);
    } catch (error) {
      console.error('Refresh providers error:', error);
    }
  };

  const loginWithOtp = async (phone: string) => {
    try {
      // Call API to send OTP
      await fetch('http://localhost:3000/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
    } catch (error) {
      console.error('Send OTP error:', error);
      throw error;
    }
  };

  const verifyOtp = async (phone: string, code: string) => {
    try {
      const response = await fetch('http://localhost:3000/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp_code: code }),
      });

      const data = await response.json();
      
      if (data.tokens && data.user) {
        await AsyncStorage.setItem('access_token', data.tokens.accessToken);
        await AsyncStorage.setItem('refresh_token', data.tokens.refreshToken);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        await refreshProviders();
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      throw error;
    }
  };

  const loginWithOAuth = async (provider: 'google' | 'apple' | 'facebook', token: string) => {
    try {
      const response = await fetch('http://localhost:3000/api/auth/oauth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, access_token: token }),
      });

      const data = await response.json();
      
      if (data.tokens && data.user) {
        await AsyncStorage.setItem('access_token', data.tokens.accessToken);
        await AsyncStorage.setItem('refresh_token', data.tokens.refreshToken);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        await refreshProviders();
      }
    } catch (error) {
      console.error('OAuth login error:', error);
      throw error;
    }
  };

  const linkProvider = async (provider: 'google' | 'apple' | 'facebook', token: string) => {
    try {
      // Call API to link provider
      await loginWithOAuth(provider, token);
      await refreshProviders();
    } catch (error) {
      console.error('Link provider error:', error);
      throw error;
    }
  };

  const unlinkProvider = async (provider: 'google' | 'apple' | 'facebook') => {
    try {
      // Call API to unlink provider
      // await fetch(`http://localhost:3000/api/auth/unlink/${provider}`, {
      //   method: 'POST',
      // });
      await refreshProviders();
    } catch (error) {
      console.error('Unlink provider error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('access_token');
      await AsyncStorage.removeItem('refresh_token');
      await AsyncStorage.removeItem('user');
      setUser(null);
      setConnectedProviders([]);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const refreshUser = async () => {
    try {
      // Fetch updated user from API
      await refreshProviders();
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        connectedProviders,
        loginWithOtp,
        verifyOtp,
        loginWithOAuth,
        linkProvider,
        unlinkProvider,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

