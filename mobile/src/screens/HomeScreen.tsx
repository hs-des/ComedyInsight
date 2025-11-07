/**
 * HomeScreen - Main landing screen with featured content
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { VideoCard } from '../components/VideoCard';
import { AdBanner } from '../components/AdBanner';
import { colors, typography, spacing, borderRadius } from '../theme';
import { useLibraryStore } from '../store/useLibraryStore';
import { useMonetizationStore } from '../store/useMonetizationStore';
import type { Video } from '../types/content';

const SLIDER_HEIGHT = Dimensions.get('window').height * 0.3;

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const videos = useLibraryStore((state) => state.videos);
  const featured = useLibraryStore((state) => state.featured);
  const categories = useLibraryStore((state) => state.categories);
  const loading = useLibraryStore((state) => state.loading);
  const fetchHome = useLibraryStore((state) => state.fetchHome);
  const hasPremiumAccess = useLibraryStore((state) => state.hasPremiumAccess);

  const isPremiumEntitled = useMonetizationStore((state) => state.isPremium);

  useFocusEffect(
    useCallback(() => {
      if (!featured.length && !loading) {
        fetchHome().catch(() => void 0);
      }
    }, [featured.length, loading, fetchHome])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchHome();
    } finally {
      setRefreshing(false);
    }
  };

  const handleCardPress = (video: Video) => {
    if (video.is_premium && !(hasPremiumAccess || isPremiumEntitled)) {
      navigation.navigate('Subscription');
      return;
    }
    navigation.navigate('VideoDetail', { videoId: video.id, video });
  };

  const renderSlider = () => {
    const [currentIndex, setCurrentIndex] = React.useState(0);

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const scrollPosition = event.nativeEvent.contentOffset.x;
      const index = Math.round(scrollPosition / Dimensions.get('window').width);
      setCurrentIndex(index);
    };

    return (
      <View style={styles.sliderContainer}>
        <FlatList
          data={featured}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          renderItem={({ item }) => (
            <View style={styles.slide}>
              <VideoCard video={item} onPress={handleCardPress} width={Dimensions.get('window').width - spacing.md * 2} />
            </View>
          )}
          keyExtractor={(item) => item.id}
        />
        <View style={styles.pagination}>
          {featured.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === currentIndex && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>
      </View>
    );
  };

  const renderVideoSection = (title: string, data: Video[]) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <FlatList
        data={data}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <VideoCard video={item} onPress={handleCardPress} />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.sectionContent}
      />
    </View>
  );

  const filteredVideos = useMemo(() => {
    if (!selectedCategory) return videos;
    return videos.filter((video) =>
      video.categories?.some((category) => category.id === selectedCategory || category.slug === selectedCategory)
    );
  }, [videos, selectedCategory]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {featured.length > 0 && renderSlider()}

        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.filterPill, !selectedCategory && styles.filterPillActive]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text style={[styles.filterText, !selectedCategory && styles.filterTextActive]}>{t('filters.all')}</Text>
            </TouchableOpacity>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[styles.filterPill, selectedCategory === category.id && styles.filterPillActive]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Text style={[styles.filterText, selectedCategory === category.id && styles.filterTextActive]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {renderVideoSection(t('home.newReleases'), filteredVideos.slice(0, 8))}
        <AdBanner />
        {renderVideoSection(t('home.topRated'), filteredVideos.slice(8, 16))}
        <AdBanner />
        {renderVideoSection(t('home.byArtist'), filteredVideos.slice(16, 24))}
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
  sliderContainer: {
    height: SLIDER_HEIGHT,
    marginBottom: spacing.lg,
  },
  slide: {
    width: Dimensions.get('window').width,
    paddingHorizontal: spacing.md,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: spacing.md,
    left: 0,
    right: 0,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textTertiary,
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: colors.primary,
    width: 24,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  sectionContent: {
    paddingHorizontal: spacing.md,
  },
  filterSection: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  filterPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  filterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  filterTextActive: {
    color: colors.text,
  },
});

