/**
 * CategoriesScreen - Browse videos by category
 */

import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { colors, typography, spacing, borderRadius } from '../theme';
import { useLibraryStore } from '../store/useLibraryStore';

interface CategoriesScreenProps {
  navigation: any;
}

export const CategoriesScreen: React.FC<CategoriesScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const categories = useLibraryStore((state) => state.categories);
  const fetchHome = useLibraryStore((state) => state.fetchHome);
  const loading = useLibraryStore((state) => state.loading);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!categories.length && !loading) {
        fetchHome().catch(() => void 0);
      }
    }, [categories.length, loading, fetchHome])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchHome();
    } finally {
      setRefreshing(false);
    }
  };

  const handleCategoryPress = (categoryId: string, categoryName: string) => {
    navigation.navigate('CategoryDetail', { categoryId, categoryName });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{t('filters.category')}</Text>
        </View>

        <View style={styles.grid}>
          {categories.map((category) => {
            const count = category.video_count ?? (category.metadata?.videoCount as number | undefined);
            return (
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
              <Text style={styles.categoryCount}>
                {count ? t('search.results', { count }) : t('search.noResults')}
              </Text>
            </TouchableOpacity>
          );
          })}
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

