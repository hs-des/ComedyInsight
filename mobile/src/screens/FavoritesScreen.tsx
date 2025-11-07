/**
 * FavoritesScreen - List of favorite videos
 */

import React, { useMemo } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { VideoCard } from '../components/VideoCard';
import { EmptyState } from '../components/EmptyState';
import { colors, typography, spacing } from '../theme';
import { useLibraryStore } from '../store/useLibraryStore';
import type { Video } from '../types/content';

interface FavoritesScreenProps {
  navigation: any;
}

export const FavoritesScreen: React.FC<FavoritesScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const favoritesMap = useLibraryStore((state) => state.favorites);
  const favorites: Video[] = useMemo(() => Object.values(favoritesMap), [favoritesMap]);

  const handleCardPress = (video: Video) => {
    navigation.navigate('VideoDetail', { videoId: video.id, video });
  };

  if (favorites.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('favorites.title')}</Text>
        </View>
        <EmptyState
          icon="❤️"
          title={t('favorites.empty')}
          message={t('video.moreLikeThis')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('favorites.title')}</Text>
        <Text style={styles.subtitle}>{t('search.results', { count: favorites.length })}</Text>
      </View>

      <FlatList
        data={favorites}
        renderItem={({ item }) => (
          <View style={styles.cardContainer}>
            <VideoCard video={item} onPress={handleCardPress} />
          </View>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        numColumns={2}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  listContent: {
    padding: spacing.md,
  },
  cardContainer: {
    marginBottom: spacing.md,
    width: '48%',
    marginRight: '4%',
  },
});

