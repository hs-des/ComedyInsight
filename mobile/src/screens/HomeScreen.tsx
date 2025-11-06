/**
 * HomeScreen - Main landing screen with featured content
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VideoCard } from '../components/VideoCard';
import { AdBanner } from '../components/AdBanner';
import { colors, typography, spacing } from '../theme';
import { mockVideos, mockFeaturedVideos, Video } from '../data/mockData';

const SLIDER_HEIGHT = Dimensions.get('window').height * 0.3;

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const handleCardPress = (video: Video) => {
    navigation.navigate('VideoDetail', { videoId: video.id, video });
  };

  const renderSlider = () => {
    const [currentIndex, setCurrentIndex] = React.useState(0);

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const scrollPosition = event.nativeEvent.contentOffset.x;
      const index = Math.round(scrollPosition / Dimensions.get('window').width);
      setCurrentIndex(index);
    };

    return (
      <View style={styles.sliderContainer}>
        <FlatList
          data={mockFeaturedVideos}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          renderItem={({ item }) => (
            <View style={styles.slide}>
              <VideoCard video={item} onPress={handleCardPress} width={Dimensions.get('window').width} />
            </View>
          )}
          keyExtractor={(item) => item.id}
        />
        <View style={styles.pagination}>
          {mockFeaturedVideos.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === currentIndex && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>
      </View>
    );
  };

  const renderVideoSection = (title: string, videos: Video[]) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <FlatList
        data={videos}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <VideoCard video={item} onPress={handleCardPress} />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.sectionContent}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Featured Slider */}
        {renderSlider()}

        {/* New Releases */}
        {renderVideoSection('New Releases', mockVideos.slice(0, 4))}

        {/* Ad Banner */}
        <AdBanner />

        {/* Top Rated */}
        {renderVideoSection('Top Rated', mockVideos.slice(2, 6))}

        {/* Ad Banner */}
        <AdBanner />

        {/* By Artist */}
        {renderVideoSection('By Artist', mockVideos.slice(4))}
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
  sliderContainer: {
    height: SLIDER_HEIGHT,
    marginBottom: spacing.lg,
  },
  slide: {
    width: Dimensions.get('window').width,
    paddingHorizontal: spacing.md,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: spacing.md,
    left: 0,
    right: 0,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textTertiary,
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: colors.primary,
    width: 24,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  sectionContent: {
    paddingHorizontal: spacing.md,
  },
});

