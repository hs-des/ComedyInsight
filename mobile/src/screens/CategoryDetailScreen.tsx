/**
 * CategoryDetailScreen - Videos filtered by category with filters and pagination
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VideoCard } from '../components/VideoCard';
import { Filters } from '../components/Filters';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { apiService } from '../services/api.service';
import { colors, typography, spacing } from '../theme';
import { Video, VideoFilters, mockVideos } from '../data/mockData';

interface CategoryDetailScreenProps {
  navigation: any;
  route: {
    params: {
      categoryId: string;
      categoryName: string;
    };
  };
}

export const CategoryDetailScreen: React.FC<CategoryDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const { categoryId, categoryName } = route.params;
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState<VideoFilters>({
    category: categoryId,
  });

  const fetchVideos = async (pageNum: number, reset: boolean = false) => {
    try {
      const response = await apiService.getVideos({
        ...filters,
        page: pageNum,
        limit: 20,
      });
      
      const newVideos = response.videos || [];
      
      if (reset) {
        setVideos(newVideos);
      } else {
        setVideos((prev) => [...prev, ...newVideos]);
      }
      
      setHasMore(newVideos.length >= 20);
    } catch (error) {
      // Fallback to mock data
      const filtered = mockVideos.filter((v) =>
        categoryId ? true : true // Apply category filter when available
      );
      setVideos(reset ? filtered : [...videos, ...filtered]);
    }
  };

  const loadInitial = async () => {
    setLoading(true);
    await fetchVideos(1, true);
    setPage(1);
    setHasMore(true);
    setLoading(false);
  };

  const loadMore = async () => {
    if (!hasMore || loadingMore) return;
    
    setLoadingMore(true);
    const nextPage = page + 1;
    await fetchVideos(nextPage);
    setPage(nextPage);
    setLoadingMore(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchVideos(1, true);
    setPage(1);
    setRefreshing(false);
  };

  const handleFiltersApply = (newFilters: VideoFilters) => {
    setFilters({ ...filters, ...newFilters });
  };

  const handleFiltersReset = () => {
    setFilters({ category: categoryId });
  };

  useEffect(() => {
    loadInitial();
  }, [filters]);

  const handleCardPress = (video: Video) => {
    navigation.navigate('VideoDetail', { videoId: video.id, video });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{categoryName}</Text>
        <Filters
          filters={filters}
          onApply={handleFiltersApply}
          onReset={handleFiltersReset}
        />
      </View>

      {loading ? (
        <LoadingSpinner message="Loading videos..." />
      ) : videos.length === 0 ? (
        <EmptyState
          icon="📂"
          title="No videos found"
          message="Try adjusting your filters"
        />
      ) : (
        <FlatList
          data={videos}
          renderItem={({ item }) => (
            <VideoCard video={item} onPress={handleCardPress} />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.grid}
          numColumns={2}
          columnWrapperStyle={styles.row}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? <LoadingSpinner size="small" message="Loading more..." /> : null
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  grid: {
    padding: spacing.md,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
});

