/**
 * Ad Tracking Service - Track impressions and clicks
 */

import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Platform } from 'react-native';

const API_BASE_URL = 'http://localhost:3000/api'; // Update with your API URL

export const trackAdImpression = async (adId: string) => {
  try {
    await axios.post(`${API_BASE_URL}/ads/track/impression`, {
      ad_id: adId,
      device_type: 'mobile',
      platform: Platform.OS,
    });
  } catch (error) {
    console.error('Failed to track impression:', error);
  }
};

export const trackAdClick = async (adId: string) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/ads/track/click`, {
      ad_id: adId,
      device_type: 'mobile',
      platform: Platform.OS,
    });
    return response.data.click_url;
  } catch (error) {
    console.error('Failed to track click:', error);
    return null;
  }
};

export const getAds = async (position: 'home' | 'pre_roll' | 'sidebar' | 'top_banner') => {
  try {
    const response = await axios.get(`${API_BASE_URL}/ads`, {
      params: { position },
    });
    return response.data.ads;
  } catch (error) {
    console.error('Failed to fetch ads:', error);
    return [];
  }
};

