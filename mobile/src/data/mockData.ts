/**
 * Mock Data for Development
 */

export interface Video {
  id: string;
  title: string;
  thumbnail_url: string;
  visible_view_count: number;
  duration_seconds?: number;
  language?: string;
  rating?: number;
  artist?: string;
  is_premium?: boolean;
}

export const mockVideos: Video[] = [
  {
    id: '1',
    title: 'Hilarious Stand-up Special',
    thumbnail_url: 'https://picsum.photos/seed/video1/400/600',
    visible_view_count: 1250000,
    duration_seconds: 3600,
    language: 'EN',
    rating: 4.5,
    artist: 'John Comedian',
    is_premium: false,
  },
  {
    id: '2',
    title: 'Comedy Central Presents',
    thumbnail_url: 'https://picsum.photos/seed/video2/400/600',
    visible_view_count: 890000,
    duration_seconds: 1800,
    language: 'EN',
    rating: 4.8,
    artist: 'Sarah Funny',
    is_premium: true,
  },
  {
    id: '3',
    title: 'Late Night Laughs',
    thumbnail_url: 'https://picsum.photos/seed/video3/400/600',
    visible_view_count: 2450000,
    duration_seconds: 2700,
    language: 'EN',
    rating: 4.2,
    artist: 'Mike Laughs',
    is_premium: false,
  },
  {
    id: '4',
    title: 'Roast Battle Championship',
    thumbnail_url: 'https://picsum.photos/seed/video4/400/600',
    visible_view_count: 3200000,
    duration_seconds: 2400,
    language: 'EN',
    rating: 4.9,
    artist: 'Various Artists',
    is_premium: true,
  },
  {
    id: '5',
    title: 'Improv Comedy Show',
    thumbnail_url: 'https://picsum.photos/seed/video5/400/600',
    visible_view_count: 678000,
    duration_seconds: 3600,
    language: 'EN',
    rating: 4.0,
    artist: 'The Improv Group',
    is_premium: false,
  },
  {
    id: '6',
    title: 'Funny Moments Compilation',
    thumbnail_url: 'https://picsum.photos/seed/video6/400/600',
    visible_view_count: 1560000,
    duration_seconds: 1800,
    language: 'EN',
    rating: 4.3,
    artist: 'Compilation',
    is_premium: false,
  },
];

export const mockFeaturedVideos: Video[] = [
  {
    id: 'f1',
    title: 'Best of 2024 - Comedy Special',
    thumbnail_url: 'https://picsum.photos/seed/featured1/800/450',
    visible_view_count: 5000000,
    duration_seconds: 4200,
    language: 'EN',
    rating: 4.9,
    artist: 'Top Comedians',
    is_premium: true,
  },
  {
    id: 'f2',
    title: 'Stand-up Comedy Marathon',
    thumbnail_url: 'https://picsum.photos/seed/featured2/800/450',
    visible_view_count: 3200000,
    duration_seconds: 10800,
    language: 'EN',
    rating: 4.7,
    artist: 'Various Artists',
    is_premium: false,
  },
  {
    id: 'f3',
    title: 'Award-Winning Comedy Series',
    thumbnail_url: 'https://picsum.photos/seed/featured3/800/450',
    visible_view_count: 8900000,
    duration_seconds: 3600,
    language: 'EN',
    rating: 5.0,
    artist: 'Elite Comedians',
    is_premium: true,
  },
];

export const mockArtists = [
  { id: 'a1', name: 'John Comedian', image: 'https://picsum.photos/seed/artist1/200/200' },
  { id: 'a2', name: 'Sarah Funny', image: 'https://picsum.photos/seed/artist2/200/200' },
  { id: 'a3', name: 'Mike Laughs', image: 'https://picsum.photos/seed/artist3/200/200' },
  { id: 'a4', name: 'The Improv Group', image: 'https://picsum.photos/seed/artist4/200/200' },
];

export const mockCategories = [
  { id: '1', name: 'Stand-up Comedy', slug: 'stand-up', count: 234 },
  { id: '2', name: 'Sketch Comedy', slug: 'sketch', count: 156 },
  { id: '3', name: 'Improv Comedy', slug: 'improv', count: 89 },
  { id: '4', name: 'Comedy Specials', slug: 'specials', count: 412 },
  { id: '5', name: 'Funny Moments', slug: 'funny-moments', count: 567 },
  { id: '6', name: 'Roast Battles', slug: 'roast-battles', count: 78 },
];

export interface VideoFilters {
  category?: string;
  language?: string;
  min_rating?: number;
  max_duration?: number;
  artist?: string;
}

