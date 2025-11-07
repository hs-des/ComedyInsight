/**
 * SubscriptionScreen - Subscription management with RevenueCat offerings
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { colors, typography, spacing, borderRadius } from '../theme';
import { useMonetizationStore } from '../store/useMonetizationStore';

interface SubscriptionScreenProps {
  navigation: any;
}

export const SubscriptionScreen: React.FC<SubscriptionScreenProps> = () => {
  const { t } = useTranslation();
  const offerings = useMonetizationStore((state) => state.offerings);
  const isPremium = useMonetizationStore((state) => state.isPremium);
  const purchase = useMonetizationStore((state) => state.purchase);
  const refreshOfferings = useMonetizationStore((state) => state.refreshOfferings);
  const refreshCustomerInfo = useMonetizationStore((state) => state.refreshCustomerInfo);
  const loading = useMonetizationStore((state) => state.loading);

  const handlePurchase = async (identifier: string) => {
    const pkg = offerings?.availablePackages.find((item) => item.identifier === identifier);
    if (!pkg) return;
    try {
      await purchase(pkg);
      Alert.alert('Success', 'Subscription activated');
    } catch (error) {
      Alert.alert('Purchase failed', 'Unable to complete subscription');
    }
  };

  const handleRestore = async () => {
    await refreshCustomerInfo();
    Alert.alert('Restored', 'Purchase history refreshed');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('subscription.title')}</Text>
          <Text style={styles.subtitle}>
            {isPremium ? 'Premium access active' : 'Upgrade to unlock ad-free comedy specials.'}
          </Text>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleRestore}>
            <Text style={styles.secondaryButtonText}>Restore Purchases</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={refreshOfferings}>
            <Text style={styles.secondaryButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.primary} />
          </View>
        )}

        {(offerings?.availablePackages || []).map((pkg) => (
          <View key={pkg.identifier} style={styles.planCard}>
            <View style={styles.planHeader}>
              <View>
                <Text style={styles.planName}>{pkg.product.title}</Text>
                <Text style={styles.planPeriod}>{pkg.product.description}</Text>
              </View>
              <Text style={styles.planPrice}>{pkg.product.priceString}</Text>
            </View>
            <TouchableOpacity
              style={styles.subscribeButton}
              onPress={() => handlePurchase(pkg.identifier)}
              activeOpacity={0.8}
            >
              <Text style={styles.subscribeButtonText}>
                {isPremium ? t('subscription.manage') : t('subscription.subscribe')}
              </Text>
            </TouchableOpacity>
          </View>
        ))}

        {!offerings?.availablePackages?.length && !loading && (
          <View style={styles.loadingRow}>
            <Text style={styles.subtitle}>No plans available. Pull to refresh or try again later.</Text>
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: colors.text,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  loadingRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  planCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  planName: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  planPeriod: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  planPrice: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: 'bold',
  },
  subscribeButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  subscribeButtonText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
});
/**
 * SubscriptionScreen - Subscription management with RevenueCat offerings
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { colors, typography, spacing, borderRadius } from '../theme';
import { useMonetizationStore } from '../store/useMonetizationStore';

interface SubscriptionScreenProps {
  navigation: any;
}

export const SubscriptionScreen: React.FC<SubscriptionScreenProps> = () => {
  const { t } = useTranslation();
  const offerings = useMonetizationStore((state) => state.offerings);
  const isPremium = useMonetizationStore((state) => state.isPremium);
  const purchase = useMonetizationStore((state) => state.purchase);
  const refreshOfferings = useMonetizationStore((state) => state.refreshOfferings);
  const refreshCustomerInfo = useMonetizationStore((state) => state.refreshCustomerInfo);
  const loading = useMonetizationStore((state) => state.loading);

  const handlePurchase = async (identifier: string) => {
    const pkg = offerings?.availablePackages.find((item) => item.identifier === identifier);
    if (!pkg) return;
    try {
      await purchase(pkg);
      Alert.alert('Success', 'Subscription activated');
    } catch (error) {
      Alert.alert('Purchase failed', 'Unable to complete subscription');
    }
  };

  const handleRestore = async () => {
    await refreshCustomerInfo();
    Alert.alert('Restored', 'Purchase history refreshed');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('subscription.title')}</Text>
          <Text style={styles.subtitle}>
            {isPremium ? 'Premium access active' : 'Upgrade to unlock ad-free comedy specials.'}
          </Text>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleRestore}>
            <Text style={styles.secondaryButtonText}>Restore Purchases</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={refreshOfferings}>
            <Text style={styles.secondaryButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.primary} />
          </View>
        )}

        {(offerings?.availablePackages || []).map((pkg) => (
          <View key={pkg.identifier} style={styles.planCard}>
            <View style={styles.planHeader}>
              <View>
                <Text style={styles.planName}>{pkg.product.title}</Text>
                <Text style={styles.planPeriod}>{pkg.product.description}</Text>
              </View>
              <Text style={styles.planPrice}>{pkg.product.priceString}</Text>
            </View>
            <TouchableOpacity
              style={styles.subscribeButton}
              onPress={() => handlePurchase(pkg.identifier)}
              activeOpacity={0.8}
            >
              <Text style={styles.subscribeButtonText}>
                {isPremium ? t('subscription.manage') : t('subscription.subscribe')}
              </Text>
            </TouchableOpacity>
          </View>
        ))}

        {!offerings?.availablePackages?.length && !loading && (
          <View style={styles.loadingRow}>
            <Text style={styles.subtitle}>No plans available. Pull to refresh or try again later.</Text>
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: colors.text,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  loadingRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  planCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  planName: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  planPeriod: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  planPrice: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: 'bold',
  },
  subscribeButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  subscribeButtonText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
});
/**
 * SubscriptionScreen - Subscription management
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../theme';

interface SubscriptionScreenProps {
  navigation: any;
}

export const SubscriptionScreen: React.FC<SubscriptionScreenProps> = ({ navigation }) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionPlan, setSubscriptionPlan] = useState('Premium');

  const handleSubscribe = async () => {
    try {
      // In real app, open Stripe Checkout in WebView
      Alert.alert(
        'Subscribe',
        'Opening Stripe Checkout...',
        [
          {
            text: 'Open',
            onPress: () => {
              // Open Stripe Checkout URL
              const checkoutUrl = 'https://stripe.com/checkout';
              Linking.openURL(checkoutUrl);
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to open checkout');
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your subscription?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            // Call API to cancel
            setIsSubscribed(false);
            Alert.alert('Success', 'Subscription cancelled');
          },
        },
      ]
    );
  };

  const features = [
    'Ad-free experience',
    'Download videos offline',
    'HD & Ultra HD quality',
    'Early access to new content',
    'Exclusive content',
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Subscription</Text>
        </View>

        {isSubscribed ? (
          <>
            {/* Active Subscription */}
            <View style={styles.activeCard}>
              <Text style={styles.activeIcon}>✅</Text>
              <Text style={styles.activeTitle}>Active Subscription</Text>
              <Text style={styles.planName}>{subscriptionPlan}</Text>
              <Text style={styles.renewsDate}>Renews on: February 1, 2025</Text>
            </View>

            <View style={styles.section}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel Subscription</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            {/* Subscribe Options */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Choose Your Plan</Text>
              
              {/* Premium Plan */}
              <TouchableOpacity style={styles.planCard} activeOpacity={0.8}>
                <View style={styles.planHeader}>
                  <Text style={styles.planName}>Premium</Text>
                  <View>
                    <Text style={styles.planPrice}>$9.99</Text>
                    <Text style={styles.planPeriod}>/month</Text>
                  </View>
                </View>
                <View style={styles.featuresList}>
                  {features.map((feature, idx) => (
                    <View key={idx} style={styles.featureItem}>
                      <Text style={styles.featureIcon}>✓</Text>
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>
                <TouchableOpacity
                  style={styles.subscribeButton}
                  onPress={handleSubscribe}
                  activeOpacity={0.8}
                >
                  <Text style={styles.subscribeButtonText}>Subscribe Now</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            </View>

            {/* Free Plan Info */}
            <View style={styles.freePlanCard}>
              <Text style={styles.freePlanTitle}>Free Plan</Text>
              <View style={styles.featuresList}>
                {features.slice(0, 2).map((feature, idx) => (
                  <View key={idx} style={styles.featureItem}>
                    <Text style={styles.featureIcon}>✗</Text>
                    <Text style={[styles.featureText, { opacity: 0.5 }]}>{feature}</Text>
                  </View>
                ))}
                <Text style={styles.limitedText}>Limited content access</Text>
              </View>
            </View>
          </>
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
  activeCard: {
    backgroundColor: colors.primary,
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
  },
  activeIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  activeTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  planName: {
    ...typography.h4,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  renewsDate: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  planCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  planPrice: {
    ...typography.h2,
    color: colors.primary,
    fontWeight: 'bold',
  },
  planPeriod: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  featuresList: {
    marginBottom: spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  featureIcon: {
    fontSize: 18,
    color: colors.success,
    marginRight: spacing.sm,
  },
  featureText: {
    ...typography.body,
    color: colors.text,
  },
  subscribeButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  subscribeButtonText: {
    ...typography.body,
    color: colors.text,
    fontWeight: 'bold',
  },
  freePlanCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  freePlanTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.md,
  },
  limitedText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: spacing.sm,
  },
  cancelButton: {
    backgroundColor: colors.error,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
});

