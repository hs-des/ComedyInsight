import { Platform } from 'react-native';
import Purchases, { PurchasesOffering, PurchasesPackage, CustomerInfo } from 'react-native-purchases';
import Constants from 'expo-constants';

const getApiKey = () => {
  const extra = Constants.expoConfig?.extra || (Constants.manifest as any)?.extra;
  if (!extra) return null;
  return Platform.OS === 'ios' ? extra.REVENUECAT_IOS_KEY : extra.REVENUECAT_ANDROID_KEY;
};

export const initializeRevenueCat = async (userId?: string) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('RevenueCat API key missing. Skipping initialization.');
    return false;
  }

  try {
    await Purchases.configure({ apiKey, appUserID: userId || undefined });
    return true;
  } catch (error) {
    console.warn('RevenueCat configure failed', error);
    return false;
  }
};

export const fetchOfferings = async (): Promise<PurchasesOffering | null> => {
  const offerings = await Purchases.getOfferings();
  return offerings.current ?? null;
};

export const purchasePackage = async (pkg: PurchasesPackage): Promise<CustomerInfo> => {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
};

export const restorePurchases = async (): Promise<CustomerInfo> => {
  const { customerInfo } = await Purchases.restorePurchases();
  return customerInfo;
};

export const hasActiveSubscription = (customerInfo: CustomerInfo | null) => {
  if (!customerInfo) return false;
  const entitlements = customerInfo.entitlements.active;
  if (!entitlements) return false;
  return Object.keys(entitlements).length > 0;
};

