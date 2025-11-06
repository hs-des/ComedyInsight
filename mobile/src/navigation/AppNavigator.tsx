/**
 * AppNavigator - Root navigation with stack for nested screens
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { TabNavigator } from './TabNavigator';
import { VideoDetailScreen } from '../screens/VideoDetailScreen';
import { CategoryDetailScreen } from '../screens/CategoryDetailScreen';
import { AccountScreen } from '../screens/AccountScreen';
import { SubscriptionScreen } from '../screens/SubscriptionScreen';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import { DownloadsScreen } from '../screens/DownloadsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { colors } from '../theme';

const Stack = createStackNavigator();

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.surfaceElevated,
            borderBottomColor: colors.border,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      >
        <Stack.Screen
          name="MainTabs"
          component={TabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="VideoDetail"
          component={VideoDetailScreen}
          options={{
            headerBackTitleVisible: false,
            title: 'Video Details',
          }}
        />
        <Stack.Screen
          name="CategoryDetail"
          component={CategoryDetailScreen}
          options={{
            headerBackTitleVisible: false,
            title: 'Category',
          }}
        />
        <Stack.Screen
          name="Account"
          component={AccountScreen}
          options={{ headerBackTitleVisible: false }}
        />
        <Stack.Screen
          name="Subscription"
          component={SubscriptionScreen}
          options={{ headerBackTitleVisible: false }}
        />
        <Stack.Screen
          name="Favorites"
          component={FavoritesScreen}
          options={{ headerBackTitleVisible: false }}
        />
        <Stack.Screen
          name="Downloads"
          component={DownloadsScreen}
          options={{ headerBackTitleVisible: false }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ headerBackTitleVisible: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

