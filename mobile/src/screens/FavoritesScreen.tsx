/**
 * FavoritesScreen - List of favorite videos
 */

import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VideoCard } from '../components/VideoCard';
import { EmptyState } from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { colors, typography, spacing } from '../theme';
import { Video, mockVideos } from '../data/mockData';

interface FavoritesScreenProps {
  navigation: any;
}

export const FavoritesScreen: React.FC<FavoritesScreenProps> = ({ navigation }) => {
  // In real app, fetch from API
  const favorites: Video[] = mockVideos.slice(0, 4);

  const handleCardPress = (video: Video) => {
    navigation.navigate('VideoDetail', { videoId: video.id, video });
  };

  if (favorites.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Favorites</Text>
        </View>
        <EmptyState
          icon="❤️"
          title="No favorites yet"
          message="Start adding videos to your favorites"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Favorites</Text>
        <Text style={styles.subtitle}>{favorites.length} video{favorites.length !== 1 ? 's' : ''}</Text>
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

