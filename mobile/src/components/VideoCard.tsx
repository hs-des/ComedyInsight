/**
 * VideoCard Component - Display video thumbnail with info
 */

import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme';
import { Video } from '../data/mockData';

interface VideoCardProps {
  video: Video;
  onPress: (video: Video) => void;
  width?: number;
}

const CARD_WIDTH = Dimensions.get('window').width * 0.45;

export const VideoCard: React.FC<VideoCardProps> = ({ video, onPress, width = CARD_WIDTH }) => {
  const formatViews = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M views`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K views`;
    }
    return `${count} views`;
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
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
    <TouchableOpacity
      style={[styles.card, { width }]}
      onPress={() => onPress(video)}
      activeOpacity={0.7}
    >
      <View style={styles.thumbnailContainer}>
        <Image
          source={{ uri: video.thumbnail_url }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
        {video.duration_seconds && (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{formatDuration(video.duration_seconds)}</Text>
          </View>
        )}
        {video.is_premium && (
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumText}>PRO</Text>
          </View>
        )}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={2}>
          {video.title}
        </Text>

        <View style={styles.metaRow}>
          <Text style={styles.views}>{formatViews(video.visible_view_count)}</Text>
          {video.language && (
            <>
              <Text style={styles.separator}>•</Text>
              <Text style={styles.language}>{video.language}</Text>
            </>
          )}
        </View>

        {video.rating && (
          <View style={styles.ratingContainer}>
            <Text style={styles.stars}>{renderStars(video.rating)}</Text>
            <Text style={styles.ratingText}>{video.rating.toFixed(1)}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginRight: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  thumbnailContainer: {
    width: '100%',
    aspectRatio: 2 / 3,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  durationBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
  },
  durationText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  premiumBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
  },
  premiumText: {
    ...typography.caption,
    color: colors.background,
    fontWeight: 'bold',
  },
  infoContainer: {
    padding: spacing.md,
  },
  title: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  views: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  separator: {
    ...typography.caption,
    color: colors.textTertiary,
    marginHorizontal: spacing.xs,
  },
  language: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stars: {
    fontSize: 12,
    color: colors.starActive,
    marginRight: spacing.xs / 2,
  },
  ratingText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});

