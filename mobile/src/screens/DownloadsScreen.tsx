/**
 * DownloadsScreen - List of downloaded videos
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VideoCard } from '../components/VideoCard';
import { EmptyState } from '../components/EmptyState';
import { colors, typography, spacing, borderRadius } from '../theme';
import { downloadService, DownloadMetadata } from '../services/download.service';
import { Video } from '../data/mockData';

interface DownloadsScreenProps {
  navigation: any;
}

export const DownloadsScreen: React.FC<DownloadsScreenProps> = ({ navigation }) => {
  // In real app, fetch from AsyncStorage
  const [downloads, setDownloads] = useState<DownloadMetadata[]>([]);

  const handleDelete = async (videoId: string) => {
    Alert.alert(
      'Delete Download',
      'Are you sure you want to delete this downloaded video?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await downloadService.deleteDownload(videoId);
            setDownloads(downloads.filter((d) => d.video_id !== videoId));
            Alert.alert('Success', 'Download deleted');
          },
        },
      ]
    );
  };

  const handlePlay = (download: DownloadMetadata) => {
    // Check if file exists and is valid
    if (download.status === 'completed') {
      navigation.navigate('VideoDetail', {
        videoId: download.video_id,
        playFromPath: download.file_path,
      });
    } else {
      Alert.alert('Error', 'Download not completed or file expired');
    }
  };

  if (downloads.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Downloads</Text>
        </View>
        <EmptyState
          icon="⬇️"
          title="No downloads yet"
          message="Download videos to watch offline"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Downloads</Text>
        <Text style={styles.subtitle}>{downloads.length} video{downloads.length !== 1 ? 's' : ''}</Text>
      </View>

      <FlatList
        data={downloads}
        renderItem={({ item }) => (
          <View style={styles.downloadCard}>
            <TouchableOpacity
              style={styles.playButton}
              onPress={() => handlePlay(item)}
              activeOpacity={0.7}
            >
              <Text style={styles.playIcon}>▶</Text>
            </TouchableOpacity>
            
            <View style={styles.downloadInfo}>
              <Text style={styles.downloadTitle} numberOfLines={1}>
                {item.video_title}
              </Text>
              <Text style={styles.downloadSize}>
                {item.file_size ? `${(item.file_size / 1024 / 1024).toFixed(1)} MB` : 'N/A'}
              </Text>
              <View style={styles.downloadMeta}>
                <Text style={styles.downloadStatus}>{item.status}</Text>
                <Text style={styles.downloadDate}>
                  {new Date(item.created_at).toLocaleDateString()}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDelete(item.video_id)}
              activeOpacity={0.7}
            >
              <Text style={styles.deleteIcon}>🗑️</Text>
            </TouchableOpacity>
          </View>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
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
  downloadCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  playIcon: {
    fontSize: 20,
    color: colors.text,
  },
  downloadInfo: {
    flex: 1,
  },
  downloadTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs / 2,
  },
  downloadSize: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs / 2,
  },
  downloadMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  downloadStatus: {
    ...typography.caption,
    color: colors.success,
    marginRight: spacing.sm,
  },
  downloadDate: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  deleteButton: {
    padding: spacing.sm,
  },
  deleteIcon: {
    fontSize: 24,
  },
});

