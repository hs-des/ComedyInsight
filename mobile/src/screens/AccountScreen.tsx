/**
 * AccountScreen - Account management and OAuth provider linking
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { colors, typography, spacing, borderRadius } from '../theme';

interface AccountScreenProps {
  navigation: any;
}

export const AccountScreen: React.FC<AccountScreenProps> = ({ navigation }) => {
  const { user, connectedProviders, linkProvider, unlinkProvider } = useAuth();
  const [linkModalVisible, setLinkModalVisible] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'google' | 'apple' | 'facebook' | null>(null);

  const handleLinkProvider = (provider: 'google' | 'apple' | 'facebook') => {
    setSelectedProvider(provider);
    setLinkModalVisible(true);
  };

  const handleConfirmLink = async () => {
    if (!selectedProvider) return;
    
    try {
      // In real app, get token from OAuth provider
      const mockToken = 'mock_token_' + selectedProvider;
      await linkProvider(selectedProvider, mockToken);
      Alert.alert('Success', `${selectedProvider} account linked successfully`);
    } catch (error) {
      Alert.alert('Error', 'Failed to link account');
    } finally {
      setLinkModalVisible(false);
      setSelectedProvider(null);
    }
  };

  const handleUnlinkProvider = async (provider: 'google' | 'apple' | 'facebook') => {
    Alert.alert(
      'Unlink Account',
      `Are you sure you want to unlink your ${provider} account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unlink',
          style: 'destructive',
          onPress: async () => {
            try {
              await unlinkProvider(provider);
              Alert.alert('Success', 'Account unlinked successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to unlink account');
            }
          },
        },
      ]
    );
  };

  const getProviderInfo = (provider: string) => {
    const info = {
      google: { icon: '🔍', name: 'Google', color: '#4285F4' },
      apple: { icon: '🍎', name: 'Apple', color: '#000000' },
      facebook: { icon: '📘', name: 'Facebook', color: '#1877F2' },
    };
    return info[provider as keyof typeof info] || { icon: '🔗', name: provider, color: colors.primary };
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Account</Text>
        </View>

        {/* Profile Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Username</Text>
              <Text style={styles.infoValue}>{user?.username || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user?.email || 'N/A'}</Text>
            </View>
            {user?.phone && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{user.phone}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Connected Accounts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connected Accounts</Text>
          {connectedProviders.map((item) => {
            const providerInfo = getProviderInfo(item.provider);
            return (
              <View key={item.provider} style={styles.providerCard}>
                <View style={styles.providerInfo}>
                  <Text style={styles.providerIcon}>{providerInfo.icon}</Text>
                  <View>
                    <Text style={styles.providerName}>{providerInfo.name}</Text>
                    <Text style={styles.providerStatus}>
                      {item.connected ? 'Connected' : 'Not Connected'}
                    </Text>
                  </View>
                </View>
                {item.connected ? (
                  <TouchableOpacity
                    style={[styles.providerButton, { backgroundColor: colors.error }]}
                    onPress={() => handleUnlinkProvider(item.provider)}
                  >
                    <Text style={styles.providerButtonText}>Unlink</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.providerButton, { backgroundColor: colors.primary }]}
                    onPress={() => handleLinkProvider(item.provider)}
                  >
                    <Text style={styles.providerButtonText}>Link</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Actions</Text>
          <TouchableOpacity style={styles.actionCard} activeOpacity={0.7}>
            <Text style={styles.actionIcon}>✏️</Text>
            <Text style={styles.actionText}>Edit Profile</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} activeOpacity={0.7}>
            <Text style={styles.actionIcon}>🔒</Text>
            <Text style={styles.actionText}>Change Password</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} activeOpacity={0.7}>
            <Text style={styles.actionIcon}>🗑️</Text>
            <Text style={styles.actionText}>Delete Account</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Link Provider Modal */}
      <Modal visible={linkModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Link Account</Text>
            {selectedProvider && (
              <Text style={styles.modalMessage}>
                You will be redirected to {getProviderInfo(selectedProvider).name} to authenticate.
              </Text>
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setLinkModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleConfirmLink}
              >
                <Text style={styles.modalButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
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
  section: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.md,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  infoValue: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
  },
  providerCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  providerIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  providerName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  providerStatus: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  providerButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  providerButtonText: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
  },
  actionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  actionText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  chevron: {
    ...typography.h3,
    color: colors.textTertiary,
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
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  modalMessage: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.surfaceElevated,
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  modalButtonText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
});

