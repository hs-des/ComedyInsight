/**
 * VideoDetailScreen - Video landing page with details
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { colors, typography, spacing, borderRadius } from '../theme';
import { AdBanner } from '../components/AdBanner';
import { usePreRollAd } from '../components/PreRollAd';
import type { Video, Subtitle } from '../types/content';
import { useLibraryStore } from '../store/useLibraryStore';
import { useMonetizationStore } from '../store/useMonetizationStore';
import { downloadService } from '../services/download.service';
import { EmptyState } from '../components/EmptyState';
import { VideoCard } from '../components/VideoCard';

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
  const initialVideo = route.params.video;
  const videoId = route.params.videoId;
  const { t } = useTranslation();

  const [video, setVideo] = useState<Video | null>(initialVideo || null);
  const [subtitles, setSubtitles] = useState<Subtitle[]>(initialVideo?.subtitles || []);
  const [downloading, setDownloading] = useState(false);

  const fetchVideoById = useLibraryStore((state) => state.fetchVideoById);
  const fetchSubtitles = useLibraryStore((state) => state.fetchSubtitles);
  const toggleFavorite = useLibraryStore((state) => state.toggleFavorite);
  const favorites = useLibraryStore((state) => state.favorites);
  const hasPremiumAccess = useLibraryStore((state) => state.hasPremiumAccess);
  const videos = useLibraryStore((state) => state.videos);

  const isPremiumEntitled = useMonetizationStore((state) => state.isPremium);

  const { showPreRoll } = usePreRollAd();

  const handlePlay = async () => {
    if (!video) return;
    if (video.is_premium && !(hasPremiumAccess || isPremiumEntitled)) {
      navigation.navigate('Subscription');
      return;
    }
    // Show pre-roll ad before video playback
    await showPreRoll();
    
    // Navigate to video player
    navigation.navigate('VideoPlayer', { video });
  };

  const handleDownload = async () => {
    if (!video) return;
    try {
      setDownloading(true);
      await downloadService.downloadVideo(video.id, video.title, video.thumbnail_url);
      Alert.alert('Download started', 'Check Downloads to monitor progress.');
    } catch (error) {
      Alert.alert('Download failed', 'Unable to download this video.');
    } finally {
      setDownloading(false);
    }
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

  useEffect(() => {
    let mounted = true;
    if (!video) {
      fetchVideoById(videoId).then((fetched) => {
        if (mounted && fetched) {
          setVideo(fetched);
        }
      }).catch(() => void 0);
    }

    if (!subtitles.length) {
      fetchSubtitles(videoId)
        .then((items) => {
          if (mounted) {
            setSubtitles(items);
          }
        })
        .catch(() => void 0);
    }

    return () => {
      mounted = false;
    };
  }, [video, subtitles.length, videoId, fetchVideoById, fetchSubtitles]);

  const isFavorite = useMemo(() => {
    if (!video) return false;
    return Boolean(favorites[video.id]);
  }, [favorites, video]);

  const recommended = useMemo(() => {
    if (!video) return [] as Video[];
    return videos
      .filter((item) => item.id !== video.id && item.categories?.some((category) => video.categories?.some((c) => c.id === category.id)))
      .slice(0, 10);
  }, [videos, video]);

  if (!video) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <EmptyState icon="🎬" title={t('video.description')} message={t('search.noResults')} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.thumbnailContainer}>
          <Image source={{ uri: video.thumbnail_url }} style={styles.thumbnail} />
          <TouchableOpacity style={styles.playButton} onPress={handlePlay} activeOpacity={0.8}>
            <Text style={styles.playIcon}>▶</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{video.title}</Text>

          <View style={styles.metaRow}>
            {typeof video.visible_view_count === 'number' && (
              <Text style={styles.views}>{formatViews(video.visible_view_count)} views</Text>
            )}
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

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.primaryButton} activeOpacity={0.7} onPress={handlePlay}>
              <Text style={styles.buttonIcon}>▶</Text>
              <Text style={styles.buttonText}>{t('video.play')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} activeOpacity={0.7} onPress={handleDownload} disabled={downloading}>
              <Text style={styles.buttonIcon}>{downloading ? '⏳' : '⬇️'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconButton, isFavorite && styles.iconButtonActive]}
              activeOpacity={0.7}
              onPress={() => toggleFavorite(video)}
            >
              <Text style={styles.buttonIcon}>{isFavorite ? '💖' : '🤍'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
              <Text style={styles.buttonIcon}>📤</Text>
            </TouchableOpacity>
          </View>

          {video.artists && video.artists.length > 0 && (
            <TouchableOpacity style={styles.artistContainer} activeOpacity={0.7}>
              <View style={styles.artistAvatar}>
                <Text style={styles.artistAvatarText}>{video.artists[0].name[0]}</Text>
              </View>
              <View>
                <Text style={styles.artistName}>{video.artists[0].name}</Text>
                <Text style={styles.artistFollowers}>{t('video.moreLikeThis')}</Text>
              </View>
            </TouchableOpacity>
          )}

          <Text style={styles.descriptionTitle}>{t('video.description')}</Text>
          <Text style={styles.description}>{video.description}</Text>

          {subtitles.length > 0 && (
            <View style={styles.subtitleSection}>
              <Text style={styles.subtitleTitle}>{t('player.subtitles')}</Text>
              <View style={styles.subtitleList}>
                {subtitles.map((subtitle) => (
                  <View key={subtitle.id} style={styles.subtitleChip}>
                    <Text style={styles.subtitleText}>{subtitle.label || subtitle.language.toUpperCase()}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        <AdBanner />

        <View style={styles.moreLikeThisSection}>
          <Text style={styles.moreLikeThisTitle}>{t('video.moreLikeThis')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {recommended.map((item) => (
              <View key={item.id} style={{ marginRight: spacing.md }}>
                <VideoCard video={item} onPress={() => navigation.push('VideoDetail', { videoId: item.id, video: item })} />
              </View>
            ))}
            {recommended.length === 0 && (
              <EmptyState icon="🤔" title={t('search.noResults')} message="" />
            )}
          </ScrollView>
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
  iconButtonActive: {
    backgroundColor: colors.primary,
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
  subtitleSection: {
    marginBottom: spacing.lg,
  },
  subtitleTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitleList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  subtitleChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  subtitleText: {
    ...typography.bodySmall,
    color: colors.text,
  },
});

