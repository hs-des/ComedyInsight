/**
 * InterstitialAd Component - Full-screen interstitial ads
 */

import { useEffect, useState } from 'react';
import mobileAds from 'react-native-google-mobile-ads';
import { Platform } from 'react-native';

const UNIT_ID = Platform.OS === 'ios' 
  ? 'ca-app-pub-3940256099942544/4411468910'
  : 'ca-app-pub-3940256099942544/1033173712';

export const useInterstitialAd = () => {
  const [interstitial, setInterstitial] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const initAd = async () => {
      await mobileAds().initialize();
      
      const ad = mobileAds()
        .interstitialAdManager()
        .createForAdRequest(__DEV__ ? 'ca-app-pub-3940256099942544/4411468910' : UNIT_ID, {
          requestNonPersonalizedAdsOnly: true,
        });

      ad.addAdEventListener('load', () => {
        console.log('Interstitial ad loaded');
        setLoaded(true);
      });

      ad.addAdEventListener('error', (error: any) => {
        console.log('Interstitial ad error:', error);
        setLoaded(false);
      });

      ad.addAdEventListener('closed', () => {
        console.log('Interstitial ad closed');
        setLoaded(false);
        // Reload ad for next time
        ad.load();
      });

      setInterstitial(ad);
      ad.load();
    };

    initAd();
  }, []);

  const showAd = async () => {
    if (interstitial && loaded) {
      await interstitial.show();
    } else {
      console.log('Interstitial ad not loaded yet');
    }
  };

  return { showAd, loaded };
};

