/**
 * VideoDetailScreen - Video landing page with details
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../theme';
import { AdBanner } from '../components/AdBanner';
import { usePreRollAd } from '../components/PreRollAd';
import { Video } from '../data/mockData';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface VideoDetailScreenProps {
  navigation: any;
  route: {
    params: {
      videoId: string;
      video: Video;
    };
  };
}

export const VideoDetailScreen: React.FC<VideoDetailScreenProps> = ({ navigation, route }) => {
  const { video } = route.params;
  const { showPreRoll } = usePreRollAd();

  const handlePlay = async () => {
    // Show pre-roll ad before video playback
    await showPreRoll();
    
    // Navigate to video player
    navigation.navigate('VideoPlayer', { video });
  };

  const formatViews = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const renderStars = (rating: number = 0) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push('★');
      } else if (i === fullStars && hasHalfStar) {
        stars.push('☆');
      } else {
        stars.push('☆');
      }
    }
    return stars.join('');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Video Thumbnail */}
        <View style={styles.thumbnailContainer}>
          <Image source={{ uri: video.thumbnail_url }} style={styles.thumbnail} />
          <View style={styles.playButton}>
            <Text style={styles.playIcon}>▶</Text>
          </View>
        </View>

        {/* Video Info */}
        <View style={styles.content}>
          <Text style={styles.title}>{video.title}</Text>

          <View style={styles.metaRow}>
            <Text style={styles.views}>{formatViews(video.visible_view_count)} views</Text>
            {video.language && (
              <>
                <Text style={styles.separator}>•</Text>
                <Text style={styles.language}>{video.language}</Text>
              </>
            )}
            {video.rating && (
              <>
                <Text style={styles.separator}>•</Text>
                <Text style={styles.rating}>{renderStars(video.rating)}</Text>
              </>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.primaryButton} activeOpacity={0.7} onPress={handlePlay}>
              <Text style={styles.buttonIcon}>▶</Text>
              <Text style={styles.buttonText}>Play</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
              <Text style={styles.buttonIcon}>⬇️</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
              <Text style={styles.buttonIcon}>❤️</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
              <Text style={styles.buttonIcon}>📤</Text>
            </TouchableOpacity>
          </View>

          {/* Artist Info */}
          {video.artist && (
            <TouchableOpacity style={styles.artistContainer} activeOpacity={0.7}>
              <View style={styles.artistAvatar}>
                <Text style={styles.artistAvatarText}>{video.artist[0]}</Text>
              </View>
              <View>
                <Text style={styles.artistName}>{video.artist}</Text>
                <Text style={styles.artistFollowers}>1.2M followers</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Description */}
          <Text style={styles.descriptionTitle}>Description</Text>
          <Text style={styles.description}>{video.description}</Text>
        </View>

        {/* Ad Banner */}
        <AdBanner />

        {/* More Like This */}
        <View style={styles.moreLikeThisSection}>
          <Text style={styles.moreLikeThisTitle}>More Like This</Text>
          {/* More videos list */}
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
  thumbnailContainer: {
    width: '100%',
    height: SCREEN_WIDTH * 0.6,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -40 }, { translateY: -40 }],
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontSize: 32,
    color: colors.primary,
  },
  content: {
    padding: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  views: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  separator: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    marginHorizontal: spacing.xs,
  },
  language: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  rating: {
    ...typography.bodySmall,
    color: colors.warning,
  },
  actionButtons: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  buttonIcon: {
    fontSize: 20,
    color: colors.text,
  },
  buttonText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  iconButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  artistContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  artistAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  artistAvatarText: {
    ...typography.h3,
    color: colors.text,
    fontWeight: 'bold',
  },
  artistName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  artistFollowers: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  descriptionTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  moreLikeThisSection: {
    padding: spacing.md,
  },
  moreLikeThisTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
});

