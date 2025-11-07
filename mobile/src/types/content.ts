export interface Artist {
  id: string;
  name: string;
  bio?: string | null;
  profile_image_url?: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  thumbnail_url?: string | null;
  video_count?: number;
  metadata?: Record<string, unknown>;
}

export interface Subtitle {
  id: string;
  language: string;
  label?: string | null;
  file_url: string;
}

export interface Video {
  id: string;
  title: string;
  description?: string | null;
  thumbnail_url: string;
  visible_view_count?: number;
  duration_seconds?: number;
  language?: string;
  rating?: number;
  is_premium?: boolean;
  stream_url?: string;
  trailer_url?: string | null;
  tags?: string[];
  artists?: Artist[];
  categories?: Category[];
  subtitles?: Subtitle[];
  metadata?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    page_size: number;
  };
}

