import {Alert, Linking, Platform} from 'react-native';
import {
  PERMISSIONS,
  RESULTS,
  check,
  checkNotifications,
  openSettings,
  request,
  requestNotifications,
  type Permission,
  type PermissionStatus,
} from 'react-native-permissions';

export type AppPermissionState =
  | 'unavailable'
  | 'denied'
  | 'blocked'
  | 'granted'
  | 'limited';

export type PermissionKind = 'camera' | 'photos' | 'notifications' | 'location';

const mapStatus = (status: PermissionStatus): AppPermissionState => {
  switch (status) {
    case RESULTS.GRANTED:
      return 'granted';
    case RESULTS.LIMITED:
      return 'limited';
    case RESULTS.BLOCKED:
      return 'blocked';
    case RESULTS.UNAVAILABLE:
      return 'unavailable';
    case RESULTS.DENIED:
    default:
      return 'denied';
  }
};

export const isPermissionGranted = (status: AppPermissionState) =>
  status === 'granted' || status === 'limited';

const permissionCopy: Record<
  PermissionKind,
  {title: string; message: string}
> = {
  camera: {
    title: 'Camera Access Needed',
    message:
      'Camera access is turned off. Open Settings to allow Flagship Towing to take photos.',
  },
  photos: {
    title: 'Photo Library Access Needed',
    message:
      'Photo library access is turned off. Open Settings to allow Flagship Towing to upload photos.',
  },
  notifications: {
    title: 'Notifications Needed',
    message:
      'Notifications are turned off. Open Settings to get membership and service updates.',
  },
  location: {
    title: 'Location Access Needed',
    message:
      'Location access is turned off. Open Settings to see weather, tides, and your map position.',
  },
};

export const openAppSettings = () => openSettings().catch(() => Linking.openSettings());

/** Show Settings alert when permission is permanently denied. */
export const promptOpenSettings = (kind: PermissionKind): Promise<boolean> =>
  new Promise(resolve => {
    const copy = permissionCopy[kind];
    Alert.alert(copy.title, copy.message, [
      {text: 'Not Now', style: 'cancel', onPress: () => resolve(false)},
      {
        text: 'Open Settings',
        onPress: () => {
          openAppSettings();
          resolve(true);
        },
      },
    ]);
  });

const ensurePermission = async (
  permission: Permission,
): Promise<AppPermissionState> => {
  const current = mapStatus(await check(permission));
  if (isPermissionGranted(current)) {
    return current;
  }
  if (current === 'blocked' || current === 'unavailable') {
    return current;
  }
  return mapStatus(await request(permission));
};

export const checkCameraPermission =
  async (): Promise<AppPermissionState> => {
    const permission =
      Platform.OS === 'ios'
        ? PERMISSIONS.IOS.CAMERA
        : PERMISSIONS.ANDROID.CAMERA;
    return mapStatus(await check(permission));
  };

export const requestCameraPermission =
  async (): Promise<AppPermissionState> => {
    const permission =
      Platform.OS === 'ios'
        ? PERMISSIONS.IOS.CAMERA
        : PERMISSIONS.ANDROID.CAMERA;
    return ensurePermission(permission);
  };

/**
 * Ensures camera permission. If blocked, prompts to open Settings.
 * Returns true when the feature can proceed.
 */
export const ensureCameraPermission = async (): Promise<boolean> => {
  const status = await requestCameraPermission();
  if (isPermissionGranted(status)) {
    return true;
  }
  if (status === 'blocked') {
    await promptOpenSettings('camera');
  }
  return false;
};

export const checkPhotoLibraryPermission =
  async (): Promise<AppPermissionState> => {
    // Android gallery uses the system photo picker, which needs no storage grant.
    if (Platform.OS !== 'ios') {
      return 'granted';
    }
    return mapStatus(await check(PERMISSIONS.IOS.PHOTO_LIBRARY));
  };

export const requestPhotoLibraryPermission =
  async (): Promise<AppPermissionState> => {
    if (Platform.OS !== 'ios') {
      return 'granted';
    }
    return ensurePermission(PERMISSIONS.IOS.PHOTO_LIBRARY);
  };

export const ensurePhotoLibraryPermission = async (): Promise<boolean> => {
  const status = await requestPhotoLibraryPermission();
  if (isPermissionGranted(status)) {
    return true;
  }
  if (status === 'blocked') {
    await promptOpenSettings('photos');
  }
  return false;
};

export const checkNotificationPermission =
  async (): Promise<AppPermissionState> => {
    const {status} = await checkNotifications();
    return mapStatus(status);
  };

export const requestNotificationPermission =
  async (): Promise<AppPermissionState> => {
    const current = await checkNotificationPermission();
    if (isPermissionGranted(current)) {
      return current;
    }
    if (current === 'blocked' || current === 'unavailable') {
      return current;
    }

    const {status} = await requestNotifications(['alert', 'badge', 'sound']);
    return mapStatus(status);
  };

/**
 * Request notification permission when the feature is needed.
 * Optionally prompts Settings if previously blocked.
 */
export const ensureNotificationPermission = async (options?: {
  promptIfBlocked?: boolean;
}): Promise<boolean> => {
  const status = await requestNotificationPermission();
  if (isPermissionGranted(status)) {
    return true;
  }
  if (options?.promptIfBlocked && status === 'blocked') {
    await promptOpenSettings('notifications');
  }
  return false;
};
