/**
 * ProfileScreen - User profile and settings
 */

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as Facebook from 'expo-auth-session/providers/facebook';
import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../context/AuthContext';
import { colors, typography, spacing, borderRadius } from '../theme';
import { useLibraryStore } from '../store/useLibraryStore';

WebBrowser.maybeCompleteAuthSession();

interface ProfileScreenProps {
  navigation: any;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user, isAuthenticated, logout, loginWithOtp, verifyOtp, loginWithOAuth } = useAuth();
  const { t } = useTranslation();

  const favorites = useLibraryStore((state) => Object.values(state.favorites));
  const history = useLibraryStore((state) => state.history);

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginStep, setLoginStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');

  const extra = Constants.expoConfig?.extra || (Constants.manifest as any)?.extra;

  const [googleRequest, googleResponse, promptGoogle] = Google.useAuthRequest({
    expoClientId: extra?.GOOGLE_OAUTH_EXPO_CLIENT_ID,
  });

  const [facebookRequest, facebookResponse, promptFacebook] = Facebook.useAuthRequest({
    clientId: extra?.FACEBOOK_APP_ID,
  });

  const handleLogin = () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
    }
  };

  const handleSendOtp = async () => {
    try {
      await loginWithOtp(phone);
      setLoginStep('otp');
      Alert.alert('Success', 'OTP sent to your phone');
    } catch (error) {
      Alert.alert('Error', 'Failed to send OTP');
    }
  };

  const handleVerifyOtp = async () => {
    try {
      await verifyOtp(phone, otpCode);
      setShowLoginModal(false);
      setPhone('');
      setOtpCode('');
      setLoginStep('phone');
    } catch (error) {
      Alert.alert('Error', 'Invalid OTP');
    }
  };

  useEffect(() => {
    if (googleResponse?.type === 'success' && googleResponse.authentication?.accessToken) {
      loginWithOAuth('google', googleResponse.authentication.accessToken).catch(() =>
        Alert.alert('Login failed', 'Unable to authenticate with Google')
      );
      setShowLoginModal(false);
    }
  }, [googleResponse, loginWithOAuth]);

  useEffect(() => {
    if (facebookResponse?.type === 'success' && facebookResponse.authentication?.accessToken) {
      loginWithOAuth('facebook', facebookResponse.authentication.accessToken).catch(() =>
        Alert.alert('Login failed', 'Unable to authenticate with Facebook')
      );
      setShowLoginModal(false);
    }
  }, [facebookResponse, loginWithOAuth]);

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const menuItems = useMemo(
    () => [
      { id: '1', icon: '⚙️', title: t('profile.linkAccount'), onPress: () => navigation.navigate('Settings') },
      { id: '2', icon: '💳', title: t('subscription.title'), onPress: () => navigation.navigate('Subscription') },
      { id: '3', icon: '⬇️', title: 'Downloads', onPress: () => navigation.navigate('Downloads') },
      { id: '4', icon: '❤️', title: t('favorites.title'), onPress: () => navigation.navigate('Favorites') },
      { id: '5', icon: '👤', title: 'Account', onPress: () => navigation.navigate('Account') },
      { id: '6', icon: '📖', title: 'Help & Support', onPress: () => {} },
    ],
    [navigation, t]
  );

  const getInitials = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    if (user?.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('profile.title')}</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
          <Text style={styles.name}>{t('profile.guest')}</Text>
          <Text style={styles.email}>{t('profile.login')}</Text>
        </View>

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin} activeOpacity={0.7}>
          <Text style={styles.loginButtonText}>{t('profile.login')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('profile.title')}</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials()}</Text>
          </View>
          <Text style={styles.name}>
            {user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : user?.username}
          </Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <View style={styles.menu}>
          {menuItems.map((item) => (
            <TouchableOpacity key={item.id} style={styles.menuItem} onPress={item.onPress} activeOpacity={0.7}>
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('favorites.title')}</Text>
          <Text style={styles.sectionSubtitle}>{t('search.results', { count: favorites.length })}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {favorites.slice(0, 8).map((video) => (
              <TouchableOpacity
                key={video.id}
                style={styles.favoriteChip}
                onPress={() => navigation.navigate('VideoDetail', { videoId: video.id, video })}
              >
                <Text style={styles.favoriteChipText}>{video.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('history.title')}</Text>
          {history.slice(0, 5).map((entry) => (
            <View key={entry.videoId} style={styles.historyRow}>
              <Text style={styles.historyTitle}>{new Date(entry.watchedAt).toLocaleString()}</Text>
              <Text style={styles.historyMeta}>{Math.round(entry.progress * 100)}%</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
          <Text style={styles.logoutText}>{t('profile.logout')}</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showLoginModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('profile.login')}</Text>

            {loginStep === 'phone' ? (
              <>
                <Text style={styles.modalLabel}>Phone Number</Text>
                <TextInput
                  style={styles.modalInput}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+1234567890"
                  keyboardType="phone-pad"
                />
                <TouchableOpacity style={styles.modalButton} onPress={handleSendOtp}>
                  <Text style={styles.modalButtonText}>Send OTP</Text>
                </TouchableOpacity>
                <View style={styles.oauthRow}>
                  <TouchableOpacity
                    style={[styles.oauthButton, !googleRequest && { opacity: 0.4 }]}
                    onPress={() => promptGoogle()}
                    disabled={!googleRequest}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.oauthButtonText}>Google</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.oauthButton, !facebookRequest && { opacity: 0.4 }]}
                    onPress={() => promptFacebook()}
                    disabled={!facebookRequest}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.oauthButtonText}>Facebook</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.modalLabel}>Enter OTP</Text>
                <TextInput
                  style={styles.modalInput}
                  value={otpCode}
                  onChangeText={setOtpCode}
                  placeholder="000000"
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <TouchableOpacity style={styles.modalButton} onPress={handleVerifyOtp}>
                  <Text style={styles.modalButtonText}>Verify OTP</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setLoginStep('phone')}>
                  <Text style={styles.changePhoneText}>Change Phone</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity style={styles.closeButton} onPress={() => setShowLoginModal(false)}>
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: colors.text,
  },
  profileCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    ...typography.h2,
    color: colors.text,
    fontWeight: 'bold',
  },
  name: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  email: {
    ...typography.body,
    color: colors.textSecondary,
  },
  menu: {
    marginBottom: spacing.xl,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  menuIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  menuTitle: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  chevron: {
    ...typography.h3,
    color: colors.textTertiary,
  },
  section: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  favoriteChip: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  favoriteChipText: {
    ...typography.bodySmall,
    color: colors.text,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyTitle: {
    ...typography.bodySmall,
    color: colors.text,
  },
  historyMeta: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  loginButton: {
    backgroundColor: colors.primary,
    marginHorizontal: spacing.md,
    marginBottom: spacing.xl,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  loginButtonText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: colors.error,
    marginHorizontal: spacing.md,
    marginBottom: spacing.xl,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  logoutText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xl,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  modalLabel: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  modalInput: {
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  modalButtonText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  oauthRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  oauthButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  oauthButtonText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  changePhoneText: {
    ...typography.bodySmall,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  closeButton: {
    padding: spacing.md,
    alignItems: 'center',
  },
  closeButtonText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});

