import notifee, {AndroidImportance} from '@notifee/react-native';
import {
  FirebaseMessagingTypes,
  getInitialNotification,
  getMessaging,
  getToken,
  onMessage,
  onNotificationOpenedApp,
  registerDeviceForRemoteMessages,
  requestPermission as requestFcmPermission,
  AuthorizationStatus,
} from '@react-native-firebase/messaging';
import Toast from 'react-native-toast-message';
import {
  Platform,
} from 'react-native';
import {devLog} from '@Utils/devLog';
import {
  ensureNotificationPermission,
  isPermissionGranted,
  checkNotificationPermission,
} from '@Utils/permissions';
import {handlePaymentDeepLinkSuccess} from '@Utils/paymentCompletion';

const messagingInstance = getMessaging();
const CHANNEL_ID = 'channel-id2';

export const createNotificationChannel = async () => {
  if (Platform.OS === 'android') {
    await notifee.createChannel({
      id: CHANNEL_ID,
      name: 'Flagship Towing',
      importance: AndroidImportance.HIGH,
    });
  }
};

export const displayNotification = async (
  remoteMessage: FirebaseMessagingTypes.RemoteMessage,
) => {
  if (remoteMessage?.data?.type === 'subscription_success') {
    return;
  }

  await createNotificationChannel();

  await notifee.displayNotification({
    title: remoteMessage?.notification?.title,
    body: remoteMessage?.notification?.body,
    data: remoteMessage?.data,
    android: {
      channelId: CHANNEL_ID,
      // Must be a white-on-transparent drawable — launcher icons show as a white blob.
      smallIcon: 'ic_notification',
      color: '#0A1FEA',
      pressAction: {
        id: 'default',
      },
    },
  });
};

export const onBackgroundMessage = async (
  remoteMessage: FirebaseMessagingTypes.RemoteMessage,
) => {
  if (remoteMessage?.data?.type === 'subscription_success') {
    await handlePaymentDeepLinkSuccess({
      vesselId:
        typeof remoteMessage?.data?.vessel_id === 'string'
          ? remoteMessage.data.vessel_id
          : undefined,
    });
    return;
  }

  await displayNotification(remoteMessage);
};

/**
 * Full notification permission flow for iOS + Android:
 * 1) OS notification permission (POST_NOTIFICATIONS / UNUserNotification)
 * 2) FCM / APNs registration
 * 3) Return FCM token when granted
 */
export const requestUserPermission = async (options?: {
  promptIfBlocked?: boolean;
}): Promise<string | undefined> => {
  try {
    const granted = await ensureNotificationPermission({
      promptIfBlocked: options?.promptIfBlocked,
    });

    if (!granted) {
      const status = await checkNotificationPermission();
      if (!isPermissionGranted(status)) {
        return undefined;
      }
    }

    if (Platform.OS === 'ios') {
      await registerDeviceForRemoteMessages(messagingInstance);
    }

    await createNotificationChannel();

    const authStatus = await requestFcmPermission(messagingInstance);
    const enabled =
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      return undefined;
    }

    return getFcmToken();
  } catch (error) {
    devLog('Notification permission error ======>' + error);
    return undefined;
  }
};

export const getFcmToken = async () => {
  try {
    if (Platform.OS === 'ios') {
      await registerDeviceForRemoteMessages(messagingInstance);
    }
    const token = await getToken(messagingInstance);
    devLog(token, 'fcm token');
    return token || undefined;
  } catch (error) {
    devLog('FCM token error ======>' + error);
    return undefined;
  }
};

class NotificationListener {
  hasBeenCalled: boolean;

  constructor() {
    this.hasBeenCalled = false;
  }

  init(handleNotification: (notification: any) => void) {
    if (this.hasBeenCalled) {
      devLog('NotificationListener can only be called once.');
      return;
    }
    this.hasBeenCalled = true;

    onNotificationOpenedApp(messagingInstance, remoteMessage => {
      devLog(
        'Notification caused app to open from background state:',
        remoteMessage,
      );
    });

    onMessage(messagingInstance, async remoteMessage => {
      devLog('on message what happened:', remoteMessage);

      // subscription_success is an internal signal (close checkout browser,
      // refresh membership) — the PaymentStatus screen shows the outcome, so
      // never surface it as a banner or toast.
      const isPaymentSignal =
        remoteMessage?.data?.type === 'subscription_success';

      if (!isPaymentSignal) {
        await displayNotification(remoteMessage);

        if (Platform.OS === 'ios') {
          Toast.show({
            type: 'success',
            text1: remoteMessage?.notification?.body,
          });
        }
      }

      if (handleNotification) {
        handleNotification(remoteMessage);
      }
    });

    getInitialNotification(messagingInstance).then(remoteMessage => {
      devLog(
        'Notification caused app to open from quit state:',
        remoteMessage,
      );
    });
  }
}

export const notificationListenerInstance = new NotificationListener();
