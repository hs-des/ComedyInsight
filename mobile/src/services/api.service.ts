/**
 * API Service - Axios configuration and API calls
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Video } from '../data/mockData';

const API_BASE_URL = __DEV__
  ? 'http://localhost:3000/api'
  : 'https://api.comedyinsight.com/api';

class APIService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for auth token
    this.api.interceptors.request.use(async (config) => {
      const token = await AsyncStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Handle unauthorized - maybe redirect to login
          console.error('Unauthorized access');
        }
        return Promise.reject(error);
      }
    );
  }

  // Search videos
  async searchVideos(query: string, params?: { artist?: string; limit?: number }) {
    try {
      const response = await this.api.get('/videos', {
        params: {
          search: query,
          ...params,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }

  // Get videos with filters
  async getVideos(params?: {
    category?: string;
    artist?: string;
    page?: number;
    limit?: number;
    language?: string;
    min_rating?: number;
    max_duration?: number;
  }) {
    try {
      const response = await this.api.get('/videos', { params });
      return response.data;
    } catch (error) {
      console.error('Get videos error:', error);
      throw error;
    }
  }

  // Get categories
  async getCategories() {
    try {
      const response = await this.api.get('/categories');
      return response.data;
    } catch (error) {
      console.error('Get categories error:', error);
      throw error;
    }
  }
}

export const apiService = new APIService();

