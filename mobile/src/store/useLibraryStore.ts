import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { contentService } from '../services/content.service';
import type { Video, Category, Artist, Subtitle } from '../types/content';

export interface WatchHistoryEntry {
  videoId: string;
  watchedAt: string;
  progress: number;
  positionSeconds?: number;
}

interface LibraryState {
  loading: boolean;
  error: string | null;
  videos: Video[];
  featured: Video[];
  categories: Category[];
  artists: Artist[];
  favorites: Record<string, Video>;
  history: WatchHistoryEntry[];
  selectedLanguage: string;
  hasPremiumAccess: boolean;
  initialized: boolean;
  fetchHome: () => Promise<void>;
  fetchVideoById: (id: string) => Promise<Video | null>;
  fetchSubtitles: (id: string, language?: string) => Promise<Subtitle[]>;
  toggleFavorite: (video: Video) => void;
  addToHistory: (entry: WatchHistoryEntry) => void;
  setPremiumAccess: (value: boolean) => void;
  setLanguage: (language: string) => void;
  clearLibrary: () => void;
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      loading: false,
      error: null,
      videos: [],
      featured: [],
      categories: [],
      artists: [],
      favorites: {},
      history: [],
      selectedLanguage: 'en',
      hasPremiumAccess: false,
      initialized: false,
      fetchHome: async () => {
        if (get().loading) return;
        set({ loading: true, error: null });
        try {
          const [{ videos, featured }, categories, artists] = await Promise.all([
            contentService.fetchHomeFeed(),
            contentService.fetchCategories(),
            contentService.fetchArtists(),
          ]);

          set({
            videos,
            featured,
            categories,
            artists,
            loading: false,
            initialized: true,
          });
        } catch (error) {
          console.warn('Failed to load home feed', error);
          set({ error: 'Unable to load content', loading: false });
        }
      },
      fetchVideoById: async (id: string) => {
        const cached = get().videos.find((video) => video.id === id);
        if (cached) return cached;
        try {
          const video = await contentService.fetchVideoById(id);
          if (video) {
            set({ videos: [video, ...get().videos.filter((item) => item.id !== id)] });
          }
          return video;
        } catch (error) {
          console.warn('Failed to fetch video', error);
          return null;
        }
      },
      fetchSubtitles: async (id: string, language?: string) => {
        try {
          return await contentService.fetchVideoSubtitles(id, language);
        } catch (error) {
          console.warn('Failed to fetch subtitles', error);
          return [];
        }
      },
      toggleFavorite: (video: Video) => {
        set((state) => {
          const nextFavorites = { ...state.favorites };
          if (nextFavorites[video.id]) {
            delete nextFavorites[video.id];
          } else {
            nextFavorites[video.id] = video;
          }
          return { favorites: nextFavorites };
        });
      },
      addToHistory: (entry: WatchHistoryEntry) => {
        set((state) => {
          const filtered = state.history.filter((item) => item.videoId !== entry.videoId);
          const history = [{ ...entry, watchedAt: new Date().toISOString() }, ...filtered].slice(0, 50);
          return { history };
        });
      },
      setPremiumAccess: (value: boolean) => set({ hasPremiumAccess: value }),
      setLanguage: (language: string) => set({ selectedLanguage: language }),
      clearLibrary: () => {
        set({
          videos: [],
          featured: [],
          categories: [],
          artists: [],
          favorites: {},
          history: [],
          initialized: false,
        });
      },
    }),
    {
      name: 'library-store',
      storage: {
        getItem: async (name) => {
          const value = await AsyncStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (name, value) => {
          await AsyncStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: async (name) => {
          await AsyncStorage.removeItem(name);
        },
      },
      partialize: (state) => ({
        favorites: state.favorites,
        history: state.history,
        selectedLanguage: state.selectedLanguage,
        hasPremiumAccess: state.hasPremiumAccess,
        videos: state.videos,
        featured: state.featured,
        categories: state.categories,
        artists: state.artists,
      }),
    }
  )
);

