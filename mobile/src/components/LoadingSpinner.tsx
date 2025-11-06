/**
 * LoadingSpinner Component
 */

import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { colors, typography, spacing } from '../theme';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'large';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message,
  size = 'large',
}) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={colors.primary} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
});

