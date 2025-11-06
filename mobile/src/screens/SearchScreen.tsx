/**
 * SearchScreen - Search for videos with live suggestions
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VideoCard } from '../components/VideoCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { useDebounce } from '../hooks/useDebounce';
import { apiService } from '../services/api.service';
import { colors, typography, spacing, borderRadius } from '../theme';
import { mockVideos, Video } from '../data/mockData';

interface SearchScreenProps {
  navigation: any;
}

export const SearchScreen: React.FC<SearchScreenProps> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Video[]>([]);
  const [suggestions, setSuggestions] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedQuery = useDebounce(searchQuery, 500);

  // Get live suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedQuery.length > 0) {
        setLoading(true);
        setError(null);
        try {
          // Try API first, fallback to mock
          const response = await apiService.searchVideos(debouncedQuery, { limit: 5 });
          setSuggestions(response.videos || []);
        } catch (err) {
          // Fallback to mock data
          const filtered = mockVideos.filter(
            (video) =>
              video.title.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
              video.artist?.toLowerCase().includes(debouncedQuery.toLowerCase())
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
      // Try API first, fallback to mock
      const response = await apiService.searchVideos(query);
      setResults(response.videos || []);
    } catch (err) {
      // Fallback to mock data
      const filtered = mockVideos.filter(
        (video) =>
          video.title.toLowerCase().includes(query.toLowerCase()) ||
          video.artist?.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
      setError('Using offline data');
    } finally {
      setLoading(false);
    }
  };

  const handleCardPress = (video: Video) => {
    navigation.navigate('VideoDetail', { videoId: video.id, video });
  };

  const handleSuggestionPress = (suggestion: Video) => {
    setSearchQuery(suggestion.title);
    handleSearch(suggestion.title);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for videos..."
          placeholderTextColor={colors.textTertiary}
          value={searchQuery}
          onChangeText={handleSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Suggestions */}
      {searchQuery.length > 0 && suggestions.length > 0 && results.length === 0 && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>Suggestions</Text>
          <FlatList
            data={suggestions}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionItem}
                onPress={() => handleSuggestionPress(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.suggestionText}>{item.title}</Text>
                {item.artist && <Text style={styles.suggestionArtist}>{item.artist}</Text>}
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
          title="Search for comedy videos"
          message="Find your favorite comedians and content"
        />
      ) : loading ? (
        <LoadingSpinner message="Searching..." />
      ) : error ? (
        <EmptyState icon="⚠️" title={error} message="Limited results available" />
      ) : results.length === 0 ? (
        <EmptyState
          icon="😕"
          title="No results found"
          message="Try a different search term"
        />
      ) : (
        <>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsCount}>
              {results.length} result{results.length !== 1 ? 's' : ''}
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
});

