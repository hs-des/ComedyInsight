/**
 * RewardedAd Component - Rewarded video ads
 */

import { useEffect, useState } from 'react';
import mobileAds from 'react-native-google-mobile-ads';
import { Platform } from 'react-native';

const UNIT_ID = Platform.OS === 'ios'
  ? 'ca-app-pub-3940256099942544/1712485313'
  : 'ca-app-pub-3940256099942544/5224354917';

export const useRewardedAd = () => {
  const [rewarded, setRewarded] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const initAd = async () => {
      await mobileAds().initialize();
      
      const ad = mobileAds()
        .rewardedAdManager()
        .createForAdRequest(__DEV__ ? 'ca-app-pub-3940256099942544/5224354917' : UNIT_ID, {
          requestNonPersonalizedAdsOnly: true,
        });

      ad.addAdEventListener('rewarded', (reward: any) => {
        console.log('Reward earned:', reward);
        // Handle reward
      });

      ad.addAdEventListener('load', () => {
        console.log('Rewarded ad loaded');
        setLoaded(true);
      });

      ad.addAdEventListener('error', (error: any) => {
        console.log('Rewarded ad error:', error);
        setLoaded(false);
      });

      ad.addAdEventListener('closed', () => {
        console.log('Rewarded ad closed');
        setLoaded(false);
        ad.load();
      });

      setRewarded(ad);
      ad.load();
    };

    initAd();
  }, []);

  const showAd = async () => {
    if (rewarded && loaded) {
      await rewarded.show();
    } else {
      console.log('Rewarded ad not loaded yet');
    }
  };

  return { showAd, loaded };
};

