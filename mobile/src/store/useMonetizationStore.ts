import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Purchases, { CustomerInfo, PurchasesPackage, PurchasesOffering } from 'react-native-purchases';

import {
  initializeRevenueCat,
  fetchOfferings,
  hasActiveSubscription,
  purchasePackage,
  restorePurchases,
} from '../services/revenuecat.service';

interface MonetizationState {
  offerings: PurchasesOffering | null;
  customerInfo: CustomerInfo | null;
  isPremium: boolean;
  loading: boolean;
  initialize: (userId?: string | null) => Promise<void>;
  refreshOfferings: () => Promise<void>;
  purchase: (pkg: PurchasesPackage) => Promise<void>;
  refreshCustomerInfo: () => Promise<void>;
}

export const useMonetizationStore = create<MonetizationState>()(
  persist(
    (set, get) => ({
      offerings: null,
      customerInfo: null,
      isPremium: false,
      loading: false,
      initialize: async (userId) => {
        if (get().loading) return;
        set({ loading: true });
        try {
          const configured = await initializeRevenueCat(userId || undefined);
          if (!configured) {
            set({ loading: false });
            return;
          }
          const [offerings, customerInfo] = await Promise.all([
            fetchOfferings(),
            Purchases.getCustomerInfo(),
          ]);
          set({
            offerings: offerings ?? null,
            customerInfo,
            isPremium: hasActiveSubscription(customerInfo),
            loading: false,
          });
        } catch (error) {
          console.warn('Failed to initialize RevenueCat', error);
          set({ loading: false });
        }
      },
      refreshOfferings: async () => {
        try {
          const offerings = await fetchOfferings();
          set({ offerings: offerings ?? null });
        } catch (error) {
          console.warn('Failed to refresh offerings', error);
        }
      },
      purchase: async (pkg: PurchasesPackage) => {
        try {
          const customerInfo = await purchasePackage(pkg);
          set({ customerInfo, isPremium: hasActiveSubscription(customerInfo) });
        } catch (error) {
          console.warn('Purchase failed', error);
          throw error;
        }
      },
      refreshCustomerInfo: async () => {
        try {
          const info = await restorePurchases();
          set({ customerInfo: info, isPremium: hasActiveSubscription(info) });
        } catch (error) {
          console.warn('Failed to restore purchases', error);
        }
      },
    }),
    {
      name: 'monetization-store',
      partialize: (state) => ({
        customerInfo: state.customerInfo,
        isPremium: state.isPremium,
      }),
    }
  )
);

