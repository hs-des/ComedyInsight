/**
 * CategoriesScreen - Browse videos by category
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../theme';
import { mockCategories } from '../data/mockData';

interface CategoriesScreenProps {
  navigation: any;
}

export const CategoriesScreen: React.FC<CategoriesScreenProps> = ({ navigation }) => {
  const handleCategoryPress = (categoryId: string, categoryName: string) => {
    navigation.navigate('CategoryDetail', { categoryId, categoryName });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Browse Categories</Text>
        </View>

        <View style={styles.grid}>
          {mockCategories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryCard}
              onPress={() => handleCategoryPress(category.id, category.name)}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>🎭</Text>
              </View>
              <Text style={styles.categoryName}>{category.name}</Text>
              <Text style={styles.categoryCount}>{category.count} videos</Text>
            </TouchableOpacity>
          ))}
        </View>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
  },
  categoryCard: {
    width: '48%',
    marginBottom: spacing.md,
    marginRight: '4%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  icon: {
    fontSize: 32,
  },
  categoryName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  categoryCount: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});

