import {Platform} from 'react-native';
import Geolocation, {
  type GeolocationError,
  type GeolocationResponse,
} from '@react-native-community/geolocation';
import {
  PERMISSIONS,
  RESULTS,
  check,
  request,
  requestMultiple,
  type PermissionStatus,
} from 'react-native-permissions';
import {
  openAppSettings,
  promptOpenSettings,
  type AppPermissionState,
} from '@Utils/permissions';

export type LocationPermissionState = AppPermissionState;

export type Coordinates = {
  latitude: number;
  longitude: number;
};

let didConfigureGeolocation = false;

const mapStatus = (status: PermissionStatus): LocationPermissionState => {
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

export const isLocationGranted = (status: LocationPermissionState) =>
  status === 'granted' || status === 'limited';

export const configureLocationServices = () => {
  if (didConfigureGeolocation) {
    return;
  }

  didConfigureGeolocation = true;
  Geolocation.setRNConfiguration({
    skipPermissionRequests: true,
    authorizationLevel: 'whenInUse',
    enableBackgroundLocationUpdates: false,
    locationProvider: 'auto',
  });
};

export const checkLocationPermission =
  async (): Promise<LocationPermissionState> => {
    configureLocationServices();

    if (Platform.OS === 'ios') {
      return mapStatus(await check(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE));
    }

    const fine = await check(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
    if (fine === RESULTS.GRANTED) {
      return 'granted';
    }

    const coarse = await check(PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION);
    return mapStatus(coarse === RESULTS.GRANTED ? RESULTS.GRANTED : fine);
  };

const delay = (ms: number) =>
  new Promise<void>(resolve => {
    setTimeout(resolve, ms);
  });

/**
 * The system location dialog backgrounds the app. `request()` can then
 * resolve as denied/blocked even after the user allowed access. A follow-up
 * check is the source of truth.
 */
const verifyAfterRequest = async (
  requested: LocationPermissionState,
): Promise<LocationPermissionState> => {
  if (isLocationGranted(requested)) {
    return requested;
  }

  await delay(150);
  return checkLocationPermission();
};

export const requestLocationPermission =
  async (): Promise<LocationPermissionState> => {
    configureLocationServices();

    if (Platform.OS === 'ios') {
      const current = await check(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
      if (current === RESULTS.GRANTED || current === RESULTS.LIMITED) {
        return mapStatus(current);
      }
      if (current === RESULTS.BLOCKED || current === RESULTS.UNAVAILABLE) {
        return mapStatus(current);
      }

      const requested = mapStatus(
        await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE),
      );
      return verifyAfterRequest(requested);
    }

    const fineNow = await check(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
    const coarseNow = await check(PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION);
    if (fineNow === RESULTS.GRANTED || coarseNow === RESULTS.GRANTED) {
      return 'granted';
    }
    if (fineNow === RESULTS.BLOCKED && coarseNow === RESULTS.BLOCKED) {
      return 'blocked';
    }
    if (fineNow === RESULTS.UNAVAILABLE && coarseNow === RESULTS.UNAVAILABLE) {
      return 'unavailable';
    }

    const results = await requestMultiple([
      PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
      PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION,
    ]);

    const fine = results[PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION];
    const coarse = results[PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION];

    if (fine === RESULTS.GRANTED || coarse === RESULTS.GRANTED) {
      return 'granted';
    }

    return verifyAfterRequest(
      fine === RESULTS.BLOCKED || coarse === RESULTS.BLOCKED
        ? 'blocked'
        : fine === RESULTS.UNAVAILABLE && coarse === RESULTS.UNAVAILABLE
          ? 'unavailable'
          : 'denied',
    );
  };

export const openLocationSettings = () => openAppSettings();

/** Prefer Settings CTA when blocked; otherwise request the system dialog. */
export const ensureLocationPermission = async (): Promise<boolean> => {
  const current = await checkLocationPermission();
  if (current === 'granted' || current === 'limited') {
    return true;
  }
  if (current === 'blocked') {
    await promptOpenSettings('location');
    return false;
  }

  const next = await requestLocationPermission();
  if (next === 'granted' || next === 'limited') {
    return true;
  }
  if (next === 'blocked') {
    await promptOpenSettings('location');
  }
  return false;
};

export const getCurrentCoordinates = (
  options?: {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
  },
): Promise<Coordinates> =>
  new Promise((resolve, reject) => {
    configureLocationServices();
    Geolocation.getCurrentPosition(
      (position: GeolocationResponse) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error: GeolocationError) => reject(error),
      {
        enableHighAccuracy: options?.enableHighAccuracy ?? true,
        timeout: options?.timeout ?? 15000,
        maximumAge: options?.maximumAge ?? 60000,
      },
    );
  });

/** High-accuracy first, then a cached/low-accuracy retry — same path Home weather uses. */
export const resolveCoordinates = async (): Promise<Coordinates> => {
  try {
    return await getCurrentCoordinates({
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000,
    });
  } catch {
    return getCurrentCoordinates({
      enableHighAccuracy: false,
      timeout: 20000,
      maximumAge: 300000,
    });
  }
};

/**
 * Read a fix when the OS says location is allowed, or a brief cached
 * lookup when the permission API is still stale after a grant.
 */
export const readCoordinatesForPermission = async (
  permissionStatus: LocationPermissionState,
): Promise<{
  coords: Coordinates;
  permissionStatus: LocationPermissionState;
} | null> => {
  if (isLocationGranted(permissionStatus)) {
    const coords = await resolveCoordinates();
    return {coords, permissionStatus};
  }

  try {
    const coords = await getCurrentCoordinates({
      enableHighAccuracy: false,
      timeout: 2500,
      maximumAge: 120000,
    });
    return {coords, permissionStatus: 'granted'};
  } catch {
    return null;
  }
};

export const permissionMessage = (status: LocationPermissionState) => {
  switch (status) {
    case 'blocked':
      return 'Location access is turned off. Open Settings to enable it.';
    case 'unavailable':
      return 'Location services are unavailable on this device.';
    case 'denied':
    default:
      return 'Enable location to see your position on the map.';
  }
};
