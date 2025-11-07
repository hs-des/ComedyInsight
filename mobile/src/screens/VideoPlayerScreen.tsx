import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video, AVPlaybackStatus } from 'expo-av';
import { useTranslation } from 'react-i18next';

import type { Video as VideoType, Subtitle } from '../types/content';
import { colors, spacing, typography, borderRadius } from '../theme';
import { useLibraryStore } from '../store/useLibraryStore';
import { downloadService } from '../services/download.service';
import { EmptyState } from '../components/EmptyState';

interface VideoPlayerScreenProps {
  navigation: any;
  route: {
    params: {
      video: VideoType;
    };
  };
}

export const VideoPlayerScreen: React.FC<VideoPlayerScreenProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const videoProp = route.params.video;
  const playerRef = useRef<Video>(null);

  const fetchVideoById = useLibraryStore((state) => state.fetchVideoById);
  const fetchSubtitles = useLibraryStore((state) => state.fetchSubtitles);
  const addToHistory = useLibraryStore((state) => state.addToHistory);

  const [video, setVideo] = useState<VideoType>(videoProp);
  const [subtitles, setSubtitles] = useState<Subtitle[]>(videoProp.subtitles || []);
  const [selectedSubtitle, setSelectedSubtitle] = useState<string | null>(null);
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const [sourceUri, setSourceUri] = useState<string | null>(videoProp.stream_url || videoProp.metadata?.stream_url as string);
  const [loading, setLoading] = useState(false);
  const [offlinePath, setOfflinePath] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const hydrate = async () => {
      if (!videoProp.stream_url) {
        const fetched = await fetchVideoById(videoProp.id);
        if (fetched && mounted) {
          setVideo(fetched);
          setSourceUri(fetched.stream_url || (fetched.metadata?.stream_url as string) || fetched.trailer_url || null);
        }
      }

      if (!videoProp.subtitles?.length) {
        const subs = await fetchSubtitles(videoProp.id);
        if (mounted) {
          setSubtitles(subs);
        }
      }

      try {
        const downloadMetadata = await downloadService.getDownloadMetadata(videoProp.id);
        if (downloadMetadata) {
          setOfflinePath(downloadMetadata.file_path || downloadMetadata.encrypted_file_path);
        }
      } catch (error) {
        // ignore
      }
    };

    hydrate().catch(() => void 0);

    return () => {
      mounted = false;
    };
  }, [videoProp, fetchVideoById, fetchSubtitles]);

  useEffect(() => {
    if (status && status.isLoaded && 'positionMillis' in status) {
      const progress = status.durationMillis ? status.positionMillis / status.durationMillis : 0;
      if (progress > 0.05) {
        addToHistory({
          videoId: video.id,
          progress,
          watchedAt: new Date().toISOString(),
          positionSeconds: Math.floor(status.positionMillis / 1000),
        });
      }

      if (status.didJustFinish) {
        addToHistory({
          videoId: video.id,
          progress: 1,
          watchedAt: new Date().toISOString(),
        });
      }
    }
  }, [status, video, addToHistory]);

  const textTracks = useMemo(() => {
    if (!subtitles.length) return undefined;
    return subtitles.map((subtitle) => ({
      type: 'text/vtt' as const,
      language: subtitle.language,
      uri: subtitle.file_url,
      name: subtitle.label ?? subtitle.language.toUpperCase(),
    }));
  }, [subtitles]);

  const handleSelectSubtitle = (language: string | null) => {
    setSelectedSubtitle(language);
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      playerRef.current?.setStatusAsync({
        selectedTextTrack: language
          ? { type: 'language', value: language }
          : { type: 'disabled' },
      }).catch(() => void 0);
    }
  };

  const handleUseOffline = async () => {
    if (!offlinePath) return;
    try {
      const playablePath = await downloadService.playDownloadedVideo(video.id);
      setSourceUri(playablePath);
      Alert.alert('Offline mode', 'Playing downloaded copy.');
    } catch (error) {
      Alert.alert('Unavailable', 'Offline copy is not valid.');
    }
  };

  if (!sourceUri) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <EmptyState icon="🚫" title="Stream unavailable" message="Try again later" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {video.title}
        </Text>
        <TouchableOpacity onPress={handleUseOffline} disabled={!offlinePath} style={styles.headerButton}>
          <Text style={[styles.headerButtonText, !offlinePath && { opacity: 0.4 }]}>⬇️</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.playerContainer}>
        <Video
          ref={playerRef}
          style={styles.video}
          source={{ uri: sourceUri }}
          useNativeControls
          shouldPlay
          resizeMode="contain"
          textTracks={textTracks}
          selectedTextTrack={selectedSubtitle ? { type: 'language', value: selectedSubtitle } : { type: 'system' }}
          onPlaybackStatusUpdate={(playbackStatus) => setStatus(playbackStatus)}
        />
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        )}
      </View>

      {subtitles.length > 0 && (
        <ScrollSelector
          label={t('player.subtitles')}
          value={selectedSubtitle}
          options={[
            { label: t('filters.all'), value: null },
            ...subtitles.map((subtitle) => ({
              label: subtitle.label ?? subtitle.language.toUpperCase(),
              value: subtitle.language,
            })),
          ]}
          onChange={handleSelectSubtitle}
        />
      )}
    </SafeAreaView>
  );
};

interface ScrollSelectorProps {
  label: string;
  options: { label: string; value: string | null }[];
  value: string | null;
  onChange: (value: string | null) => void;
}

const ScrollSelector: React.FC<ScrollSelectorProps> = ({ label, options, value, onChange }) => {
  return (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorLabel}>{label}</Text>
      <View style={styles.selectorChips}>
        {options.map((option) => {
          const active = value === option.value;
          return (
            <TouchableOpacity
              key={option.label}
              style={[styles.selectorChip, active && styles.selectorChipActive]}
              onPress={() => onChange(option.value)}
            >
              <Text style={[styles.selectorChipText, active && styles.selectorChipTextActive]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonText: {
    ...typography.h3,
    color: colors.text,
  },
  headerTitle: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  playerContainer: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  video: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  selectorLabel: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  selectorChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  selectorChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectorChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  selectorChipText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  selectorChipTextActive: {
    color: colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

