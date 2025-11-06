/**
 * PreRollAd Component - Show pre-roll ads for free users
 */

import React from 'react';
import { useInterstitialAd } from './InterstitialAd';
import { useAuth } from '../context/AuthContext';

interface PreRollAdProps {
  onAdClosed?: () => void;
  onAdFailed?: () => void;
}

/**
 * Hook to show pre-roll ad for free users before video playback
 */
export const usePreRollAd = ({ onAdClosed, onAdFailed }: PreRollAdProps = {}) => {
  const { user, isAuthenticated } = useAuth();
  const { showAd, loaded } = useInterstitialAd();

  // Check if user has subscription (free users see ads)
  const isFreeUser = isAuthenticated ? !user?.subscription_active : true;

  const showPreRoll = async () => {
    if (isFreeUser && loaded) {
      try {
        await showAd();
        onAdClosed?.();
      } catch (error) {
        console.log('Pre-roll ad error:', error);
        onAdFailed?.();
      }
    } else if (!isFreeUser) {
      // Subscribed users skip ads
      onAdClosed?.();
    } else {
      // Ad not loaded, continue anyway
      onAdClosed?.();
    }
  };

  return { showPreRoll, isFreeUser };
};

