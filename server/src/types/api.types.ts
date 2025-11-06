/**
 * API Response Types
 * 
 * Standardized TypeScript types for all API request/response payloads
 */

import { SuccessResponse, ErrorResponse } from '../utils/error-handler';

/**
 * Standard API Response wrapper
 */
export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Video types
 */
export interface Video {
  id: string;
  title: string;
  slug: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  duration_seconds?: number;
  video_type: 'full' | 'short' | 'preview';
  quality?: string;
  file_size_mb?: number;
  mime_type?: string;
  language?: string;
  subtitles_available: boolean;
  is_featured: boolean;
  is_premium: boolean;
  is_active: boolean;
  published_at?: string;
  metadata?: {
    rating?: number;
    trailer_url?: string;
    [key: string]: any;
  };
  tags?: string[];
  visible_view_count: number;
  real_view_count: number;
  created_at: string;
  updated_at?: string;
  artists?: Artist[];
  categories?: Category[];
}

/**
 * Artist types
 */
export interface Artist {
  id: string;
  name: string;
  slug: string;
  bio?: string;
  profile_image_url?: string;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at?: string;
}

/**
 * Category types
 */
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parent_id?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

/**
 * User types
 */
export interface User {
  id: string;
  username?: string;
  email?: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  profile_picture_url?: string;
  is_active: boolean;
  is_email_verified: boolean;
  created_at: string;
  updated_at?: string;
}

/**
 * Subscription types
 */
export interface Subscription {
  id: string;
  user_id: string;
  type: 'monthly' | 'yearly' | 'lifetime';
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  start_date: string;
  end_date?: string;
  amount: number;
  currency: string;
  stripe_subscription_id?: string;
  created_at: string;
  updated_at?: string;
}

/**
 * Subtitle types
 */
export interface Subtitle {
  id: string;
  video_id: string;
  language: string;
  subtitle_url: string;
  format: 'srt' | 'vtt';
  created_at: string;
  updated_at?: string;
}

/**
 * Ad types
 */
export interface Ad {
  id: string;
  title: string;
  ad_type: 'banner' | 'interstitial' | 'rewarded';
  position: string;
  ad_url?: string;
  image_url?: string;
  video_url?: string;
  click_url?: string;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  max_impressions?: number;
  current_impressions: number;
  max_clicks?: number;
  current_clicks: number;
  created_at: string;
  updated_at?: string;
}

/**
 * Notification types
 */
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  notification_type: 'general' | 'subscription' | 'video' | 'system';
  is_read: boolean;
  created_at: string;
  read_at?: string;
}

/**
 * Audit log types
 */
export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

/**
 * Fake views campaign types
 */
export interface FakeViewCampaign {
  id: string;
  video_id: string;
  request_type: 'boost' | 'remove';
  fake_views_count: number;
  notes?: string;
  created_by?: string;
  created_at: string;
}

/**
 * Download types
 */
export interface Download {
  id: string;
  user_id: string;
  video_id: string;
  download_url: string;
  expires_at: string;
  device_id?: string;
  status: 'pending' | 'completed' | 'expired' | 'revoked';
  created_at: string;
  updated_at?: string;
}

/**
 * Auth response types
 */
export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  user: User;
}

/**
 * OTP request/response
 */
export interface OTPRequest {
  phone: string;
}

export interface OTPVerifyRequest {
  phone: string;
  otp_code: string;
}

/**
 * OAuth request
 */
export interface OAuthRequest {
  provider: 'google' | 'apple' | 'facebook';
  access_token: string;
}

/**
 * Video list query parameters
 */
export interface VideoListQuery {
  page?: number;
  limit?: number;
  category?: string;
  artist?: string;
  search?: string;
  is_premium?: boolean;
  is_featured?: boolean;
  sort?: 'created_at' | 'published_at' | 'views' | 'title';
}

/**
 * Video upload request
 */
export interface VideoUploadRequest {
  video: File;
  thumbnail?: File;
  title: string;
  description?: string;
  rating?: number;
  trailer_url?: string;
  videoType?: 'full' | 'short' | 'preview';
  language?: string;
  isPremium?: boolean;
  isFeatured?: boolean;
  isActive?: boolean;
  tags?: string;
  publishedAt?: string;
  artistIds?: string[];
  categoryIds?: string[];
}

