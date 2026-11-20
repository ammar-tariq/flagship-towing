import {useCallback, useEffect, useRef, useState} from 'react';
import {AppState, type AppStateStatus} from 'react-native';
import {
  checkLocationPermission,
  configureLocationServices,
  ensureLocationPermission,
  isLocationGranted,
  readCoordinatesForPermission,
  requestLocationPermission,
  type Coordinates,
  type LocationPermissionState,
} from '@Utils/locationPermission';

/**
 * Point-of-use location for maps. Same request / check / GPS path as
 * `useWeatherUpdate` (Home). Does not invent a second permission model.
 */
export const useDeviceLocation = () => {
  const [permissionStatus, setPermissionStatus] =
    useState<LocationPermissionState | null>(null);
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const coordsRef = useRef<Coordinates | null>(null);
  const loadInFlight = useRef(false);
  const [isReady, setIsReady] = useState(false);

  const load = useCallback(async (shouldRequest: boolean) => {
    if (loadInFlight.current) {
      return coordsRef.current;
    }

    loadInFlight.current = true;
    configureLocationServices();

    let status: LocationPermissionState | null = null;

    try {
      status = shouldRequest
        ? await requestLocationPermission()
        : await checkLocationPermission();
      setPermissionStatus(status);

      const located = await readCoordinatesForPermission(status);
      if (!located) {
        return null;
      }

      setPermissionStatus(located.permissionStatus);
      coordsRef.current = located.coords;
      setCoords(located.coords);
      return located.coords;
    } catch {
      const resolved = status ?? (await checkLocationPermission());
      setPermissionStatus(resolved);
      return coordsRef.current;
    } finally {
      loadInFlight.current = false;
      setIsReady(true);
    }
  }, []);

  const requestAccess = useCallback(async () => {
    const granted = await ensureLocationPermission();
    if (granted) {
      return load(false);
    }

    const status = await checkLocationPermission();
    setPermissionStatus(status);
    const located = await readCoordinatesForPermission(status);
    if (!located) {
      return null;
    }
    setPermissionStatus(located.permissionStatus);
    coordsRef.current = located.coords;
    setCoords(located.coords);
    return located.coords;
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    let resumeTimer: ReturnType<typeof setTimeout> | null = null;

    load(true);

    const onAppStateChange = (nextState: AppStateStatus) => {
      if (nextState !== 'active' || cancelled) {
        return;
      }

      if (resumeTimer) {
        clearTimeout(resumeTimer);
      }

      // Permission dialog / Settings backgrounds the app. Wait for the OS
      // to publish the grant, and do not race an in-flight request().
      resumeTimer = setTimeout(() => {
        if (cancelled || loadInFlight.current) {
          return;
        }
        if (coordsRef.current) {
          checkLocationPermission().then(status => {
            if (!cancelled) {
              setPermissionStatus(status);
            }
          });
          return;
        }
        load(false);
      }, 250);
    };

    const subscription = AppState.addEventListener('change', onAppStateChange);

    return () => {
      cancelled = true;
      if (resumeTimer) {
        clearTimeout(resumeTimer);
      }
      subscription.remove();
    };
  }, [load]);

  return {
    coords,
    permissionStatus,
    isReady,
    needsPermission:
      permissionStatus != null &&
      !isLocationGranted(permissionStatus) &&
      coords == null,
    requestAccess,
  };
};
