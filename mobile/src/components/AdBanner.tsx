/**
 * AdBanner Component - Google AdMob Banner Ads
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { colors } from '../theme';
import { trackAdImpression } from '../services/ad-tracking.service';

interface AdBannerProps {
  size?: BannerAdSize;
  unitId?: string;
  adId?: string; // Server-side ad ID for tracking
}

export const AdBanner: React.FC<AdBannerProps> = ({
  size = BannerAdSize.ANCHORED_ADAPTIVE_BANNER,
  unitId = Platform.OS === 'ios' ? 'ca-app-pub-3940256099942544/2934735716' : 'ca-app-pub-3940256099942544/6300978111',
  adId,
}) => {
  return (
    <View style={styles.container}>
      <BannerAd
        unitId={__DEV__ ? TestIds.BANNER : unitId}
        size={size}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdLoaded={() => {
          console.log('Banner ad loaded');
          // Track impression on server
          if (adId) {
            trackAdImpression(adId);
          }
        }}
        onAdFailedToLoad={(error) => {
          console.log('Banner ad failed to load:', error);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    marginVertical: 8,
  },
});
