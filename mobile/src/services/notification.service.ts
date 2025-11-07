import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export const registerForPushNotificationsAsync = async (): Promise<string | undefined> => {
  try {
    if (!Device.isDevice) {
      console.warn('Push notifications require a physical device');
      return undefined;
    }

    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const permission = await Notifications.requestPermissionsAsync();
      status = permission.status;
    }

    if (status !== 'granted') {
      console.warn('Push notification permission denied');
      return undefined;
    }

    const projectId = Constants.expoConfig?.extra?.EAS?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenData.data;

    // Send token to backend for targeting notifications
    try {
      await fetch('http://localhost:3000/api/notifications/register-device', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, platform: Device.osName }),
      });
    } catch (error) {
      console.warn('Failed to register device token', error);
    }

    return token;
  } catch (error) {
    console.warn('Push notification setup failed', error);
    return undefined;
  }
};

