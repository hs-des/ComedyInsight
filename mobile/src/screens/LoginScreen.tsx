/**
 * LoginScreen - OTP and OAuth login
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { colors, typography, spacing, borderRadius } from '../theme';

interface LoginScreenProps {
  navigation: any;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { loginWithOtp, verifyOtp, loginWithOAuth } = useAuth();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!phone) {
      Alert.alert('Error', 'Please enter a phone number');
      return;
    }

    setLoading(true);
    try {
      await loginWithOtp(phone);
      setStep('otp');
      Alert.alert('Success', 'OTP sent to your phone');
    } catch (error) {
      Alert.alert('Error', 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      Alert.alert('Error', 'Please enter a valid OTP');
      return;
    }

    setLoading(true);
    try {
      await verifyOtp(phone, otpCode);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'apple' | 'facebook') => {
    setLoading(true);
    try {
      // In real app, get token from OAuth provider
      const mockToken = 'mock_token_' + provider;
      await loginWithOAuth(provider, mockToken);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', `Failed to login with ${provider}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Log In</Text>
          <Text style={styles.subtitle}>Welcome to ComedyInsight</Text>
        </View>

        {step === 'phone' ? (
          <View style={styles.form}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="+1234567890"
              placeholderTextColor={colors.textTertiary}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleSendOtp}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>Send OTP</Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <Text style={styles.socialTitle}>Continue with</Text>
            <TouchableOpacity
              style={[styles.socialButton, { backgroundColor: '#4285F4' }]}
              onPress={() => handleOAuthLogin('google')}
              disabled={loading}
            >
              <Text style={styles.socialButtonText}>Google</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.socialButton, { backgroundColor: '#000000' }]}
              onPress={() => handleOAuthLogin('apple')}
              disabled={loading}
            >
              <Text style={styles.socialButtonText}>Apple</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.socialButton, { backgroundColor: '#1877F2' }]}
              onPress={() => handleOAuthLogin('facebook')}
              disabled={loading}
            >
              <Text style={styles.socialButtonText}>Facebook</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.label}>Enter OTP</Text>
            <TextInput
              style={styles.input}
              placeholder="000000"
              placeholderTextColor={colors.textTertiary}
              value={otpCode}
              onChangeText={setOtpCode}
              keyboardType="number-pad"
              maxLength={6}
            />

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleVerifyOtp}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>Verify OTP</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.textButton}
              onPress={() => setStep('phone')}
            >
              <Text style={styles.textButtonText}>Change Phone Number</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
    padding: spacing.xl,
    alignItems: 'center',
  },
  title: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  form: {
    padding: spacing.xl,
  },
  label: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  input: {
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  buttonText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    ...typography.body,
    color: colors.textTertiary,
    paddingHorizontal: spacing.md,
  },
  socialTitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  socialButton: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  socialButtonText: {
    ...typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  textButton: {
    padding: spacing.md,
    alignItems: 'center',
  },
  textButtonText: {
    ...typography.body,
    color: colors.primary,
  },
});

