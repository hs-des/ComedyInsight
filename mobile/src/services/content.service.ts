import AsyncStorage from '@react-native-async-storage/async-storage';

import { apiService } from './api.service';
import type { Video, Category, Artist, Subtitle } from '../types/content';

const CACHE_KEYS = {
  home: 'content_cache_home',
  categories: 'content_cache_categories',
  artists: 'content_cache_artists',
};

interface HomeFeedResponse {
  videos: Video[];
  featured: Video[];
}

const fallback = async <T>(key: string, fetcher: () => Promise<T>): Promise<T> => {
  try {
    const data = await fetcher();
    await AsyncStorage.setItem(key, JSON.stringify({ data, fetchedAt: Date.now() }));
    return data;
  } catch (error) {
    const cached = await AsyncStorage.getItem(key);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as { data: T };
        return parsed.data;
      } catch (_) {
        // ignore parse error
      }
    }
    throw error;
  }
};

export const contentService = {
  async fetchHomeFeed(): Promise<HomeFeedResponse> {
    return fallback(CACHE_KEYS.home, async () => {
      const [latest, popular] = await Promise.all([
        apiService.getVideos({ limit: 20, sort: 'latest' }),
        apiService.getVideos({ limit: 10, sort: 'popular' }),
      ]);

      const videos: Video[] = latest.items ?? latest;
      const featured: Video[] = popular.items ?? popular;
      return {
        videos,
        featured,
      };
    });
  },

  async fetchVideoById(id: string): Promise<Video | null> {
    const video = await apiService.getVideo(id);
    return video ?? null;
  },

  async fetchVideoSubtitles(id: string, language?: string): Promise<Subtitle[]> {
    return apiService.getVideoSubtitles(id, language);
  },

  async fetchCategories(): Promise<Category[]> {
    return fallback(CACHE_KEYS.categories, async () => {
      const response = await apiService.getCategories();
      return response.items ?? response;
    });
  },

  async fetchArtists(): Promise<Artist[]> {
    return fallback(CACHE_KEYS.artists, async () => {
      const response = await apiService.getArtists();
      return response.items ?? response;
    });
  },

  async searchVideos(query: string, params?: { category?: string; artist?: string; language?: string }) {
    const response = await apiService.searchVideos(query, params);
    return response.videos ?? response.items ?? [];
  },
};

