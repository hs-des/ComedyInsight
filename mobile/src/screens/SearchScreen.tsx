/**
 * SearchScreen - Search for videos with live suggestions
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VideoCard } from '../components/VideoCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { useDebounce } from '../hooks/useDebounce';
import { colors, typography, spacing, borderRadius } from '../theme';
import { useLibraryStore } from '../store/useLibraryStore';
import { contentService } from '../services/content.service';
import type { Video } from '../types/content';
import { useTranslation } from 'react-i18next';
import { useMonetizationStore } from '../store/useMonetizationStore';

interface SearchScreenProps {
  navigation: any;
}

export const SearchScreen: React.FC<SearchScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Video[]>([]);
  const [suggestions, setSuggestions] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const libraryVideos = useLibraryStore((state) => state.videos);
  const categories = useLibraryStore((state) => state.categories);
  const languagePreference = useLibraryStore((state) => state.selectedLanguage);
  const hasPremiumAccess = useLibraryStore((state) => state.hasPremiumAccess);
  const isPremiumEntitled = useMonetizationStore((state) => state.isPremium);

  const debouncedQuery = useDebounce(searchQuery, 500);

  // Get live suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedQuery.length > 0) {
        setLoading(true);
        setError(null);
        try {
          const response = await contentService.searchVideos(debouncedQuery, {
            category: selectedCategory || undefined,
            language: selectedLanguage || undefined,
          });
          setSuggestions(response.slice(0, 6));
        } catch (err) {
          const filtered = libraryVideos.filter((video) =>
            video.title.toLowerCase().includes(debouncedQuery.toLowerCase())
          );
          setSuggestions(filtered.slice(0, 5));
        } finally {
          setLoading(false);
        }
      } else {
        setSuggestions([]);
      }
    };

    fetchSuggestions();
  }, [debouncedQuery]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.length === 0) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await contentService.searchVideos(query, {
        category: selectedCategory || undefined,
        language: selectedLanguage || undefined,
      });
      setResults(response);
    } catch (err) {
      const filtered = libraryVideos.filter((video) =>
        video.title.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
      setError(t('search.noResults'));
    } finally {
      setLoading(false);
    }
  };

  const handleCardPress = (video: Video) => {
    if (video.is_premium && !(hasPremiumAccess || isPremiumEntitled)) {
      navigation.navigate('Subscription');
      return;
    }
    navigation.navigate('VideoDetail', { videoId: video.id, video });
  };

  const handleSuggestionPress = (suggestion: Video) => {
    setSearchQuery(suggestion.title);
    handleSearch(suggestion.title);
  };

  useEffect(() => {
    if (languagePreference) {
      setSelectedLanguage(languagePreference);
    }
  }, [languagePreference]);

  const languageOptions = useMemo(() => {
    const languages = new Set<string>();
    libraryVideos.forEach((video) => {
      if (video.language) languages.add(video.language);
    });
    return Array.from(languages);
  }, [libraryVideos]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('search.title')}</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={t('search.placeholder')}
          placeholderTextColor={colors.textTertiary}
          value={searchQuery}
          onChangeText={handleSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.filtersRow}>
        <ScrollSelect
          label={t('filters.category')}
          options={[{ label: t('filters.all'), value: null }, ...categories.map((category) => ({
            label: category.name,
            value: category.id,
          }))]}
          value={selectedCategory}
          onSelect={setSelectedCategory}
        />
        <ScrollSelect
          label={t('filters.language')}
          options={[{ label: t('filters.all'), value: null }, ...languageOptions.map((code) => ({ label: code.toUpperCase(), value: code }))]}
          value={selectedLanguage}
          onSelect={setSelectedLanguage}
        />
      </View>

      {/* Suggestions */}
      {searchQuery.length > 0 && suggestions.length > 0 && results.length === 0 && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>{t('search.suggestions')}</Text>
          <FlatList
            data={suggestions}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionItem}
                onPress={() => handleSuggestionPress(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.suggestionText}>{item.title}</Text>
                {item.artists && item.artists.length > 0 && (
                  <Text style={styles.suggestionArtist}>{item.artists[0].name}</Text>
                )}
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
          />
        </View>
      )}

      {/* Results */}
      {searchQuery.length === 0 ? (
        <EmptyState
          icon="🔍"
          title={t('search.placeholder')}
          message={t('home.title')}
        />
      ) : loading ? (
        <LoadingSpinner message={t('search.title')} />
      ) : error ? (
        <EmptyState icon="⚠️" title={error} message="" />
      ) : results.length === 0 ? (
        <EmptyState
          icon="😕"
          title={t('search.noResults')}
          message={t('filters.sort')}
        />
      ) : (
        <>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsCount}>
              {t('search.results', { count: results.length })}
            </Text>
          </View>
          <FlatList
            data={results}
            renderItem={({ item }) => (
              <View style={styles.resultItem}>
                <VideoCard video={item} onPress={handleCardPress} />
              </View>
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.resultsContainer}
          />
        </>
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: colors.text,
  },
  searchContainer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  searchInput: {
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultsHeader: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultsCount: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  resultsContainer: {
    padding: spacing.md,
  },
  resultItem: {
    marginBottom: spacing.md,
  },
  suggestionsContainer: {
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.md,
  },
  suggestionsTitle: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  suggestionItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  suggestionText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  suggestionArtist: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs / 2,
  },
  filtersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
});

interface ScrollSelectOption {
  label: string;
  value: string | null;
}

interface ScrollSelectProps {
  label: string;
  options: ScrollSelectOption[];
  value: string | null;
  onSelect: (value: string | null) => void;
}

const ScrollSelect: React.FC<ScrollSelectProps> = ({ label, options, value, onSelect }) => {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.suggestionsTitle}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {options.map((option) => {
          const isActive = value === option.value;
          return (
            <TouchableOpacity
              key={`${label}-${option.value ?? 'all'}`}
              style={[styles.suggestionItem, isActive && { backgroundColor: colors.primary }]}
              onPress={() => onSelect(option.value)}
            >
              <Text style={[styles.suggestionText, isActive && { color: colors.background }]}>{option.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

