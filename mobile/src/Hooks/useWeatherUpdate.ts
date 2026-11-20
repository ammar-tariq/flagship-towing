import {useCallback, useEffect, useRef, useState} from 'react';
import {
  AppState,
  InteractionManager,
  type AppStateStatus,
} from 'react-native';
import {GOOGLE_PLACES_ADDRESS_API_KEY} from '@Lib/configs/googleMaps';
import {devLog} from '@Utils/devLog';
import {
  checkLocationPermission,
  configureLocationServices,
  isLocationGranted,
  openLocationSettings,
  readCoordinatesForPermission,
  requestLocationPermission,
  type LocationPermissionState,
} from '@Utils/locationPermission';
import {fetchWeatherSummary} from '@Utils/weatherApi';
import {
  type WeatherIconKey,
  type WeatherIconPeriod,
} from '@Utils/weatherIcons';

type WeatherUpdateState = {
  address: string;
  latitude: number | null;
  longitude: number | null;
  windLabel: string;
  windDirectionDeg: number | null;
  temperature: string;
  weatherIconKey: WeatherIconKey;
  weatherIconPeriod: WeatherIconPeriod;
  gust: string;
  wave: string;
  period: string;
  lowTide: string;
  highTide: string;
  serviceAreaId: string | null;
  serviceAreaName: string;
  isLoading: boolean;
  permissionStatus: LocationPermissionState | null;
};

export type WeatherUpdateData = Omit<
  WeatherUpdateState,
  'isLoading' | 'permissionStatus'
>;

const initialState: WeatherUpdateState = {
  address: '',
  latitude: null,
  longitude: null,
  windLabel: '-',
  windDirectionDeg: null,
  temperature: '-',
  weatherIconKey: 'sct',
  weatherIconPeriod: 'day',
  gust: '-',
  wave: '-',
  period: '-',
  lowTide: '-',
  highTide: '-',
  serviceAreaId: null,
  serviceAreaName: '',
  isLoading: true,
  permissionStatus: null,
};

const weatherPermissionMessage = (status: LocationPermissionState) => {
  switch (status) {
    case 'blocked':
      return 'Location access is turned off. Open Settings to enable it.';
    case 'unavailable':
      return 'Location services are unavailable on this device.';
    case 'denied':
    default:
      return 'Enable location to see local weather and tides.';
  }
};

const formatCityState = (
  results: Array<{
    address_components?: Array<{
      long_name: string;
      short_name: string;
      types: string[];
    }>;
    formatted_address?: string;
  }>,
) => {
  const components = results?.[0]?.address_components ?? [];
  const city =
    components.find(component => component.types.includes('locality'))
      ?.long_name ??
    components.find(component =>
      component.types.includes('administrative_area_level_2'),
    )?.long_name;
  const state = components.find(component =>
    component.types.includes('administrative_area_level_1'),
  )?.short_name;

  if (city && state) {
    return `${city}, ${state}`;
  }

  return results?.[0]?.formatted_address ?? '';
};

const reverseGeocode = async (latitude: number, longitude: number) => {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_PLACES_ADDRESS_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    return formatCityState(data.results ?? []);
  } catch (error) {
    devLog('reverseGeocode error ======>' + error);
    return '';
  }
};

export const useWeatherUpdate = () => {
  const [state, setState] = useState<WeatherUpdateState>(initialState);
  const hasLoadedWeather = useRef(false);
  const loadGeneration = useRef(0);
  const loadInFlight = useRef(false);

  const loadWeatherUpdate = useCallback(async (shouldRequest: boolean) => {
    const generation = ++loadGeneration.current;
    loadInFlight.current = true;
    configureLocationServices();
    // Keep previous metrics visible while refreshing.
    setState(prev => ({...prev, isLoading: true}));

    const isStale = () => generation !== loadGeneration.current;

    let permissionStatus: LocationPermissionState | null = null;

    try {
      permissionStatus = shouldRequest
        ? await requestLocationPermission()
        : await checkLocationPermission();

      if (isStale()) {
        return;
      }

      let latitude: number;
      let longitude: number;

      if (isLocationGranted(permissionStatus)) {
        setState(prev => ({
          ...prev,
          isLoading: true,
          permissionStatus,
        }));
      }

      const located = await readCoordinatesForPermission(permissionStatus);

      if (!located) {
        if (isStale()) {
          return;
        }

        let preservedLocation = false;
        setState(prev => {
          if (
            prev.latitude != null &&
            isLocationGranted(prev.permissionStatus ?? 'denied')
          ) {
            preservedLocation = true;
            return {...prev, isLoading: false};
          }

          return {
            ...initialState,
            address: weatherPermissionMessage(permissionStatus!),
            isLoading: false,
            permissionStatus,
          };
        });
        if (!preservedLocation) {
          hasLoadedWeather.current = false;
        }
        return;
      }

      permissionStatus = located.permissionStatus;
      latitude = located.coords.latitude;
      longitude = located.coords.longitude;

      if (isStale()) {
        return;
      }

      // Keep the map pin even if reverse-geocode / weather fails next.
      setState(prev => ({
        ...prev,
        latitude,
        longitude,
        permissionStatus,
        isLoading: true,
      }));

      const [address, weather] = await Promise.all([
        reverseGeocode(latitude, longitude),
        fetchWeatherSummary(latitude, longitude),
      ]);

      if (isStale()) {
        return;
      }

      hasLoadedWeather.current = true;
      setState({
        address:
          address || weather.fallbackAddress || 'Current location unavailable',
        latitude,
        longitude,
        windLabel: weather.windLabel,
        windDirectionDeg: weather.windDirectionDeg,
        temperature: weather.temperature,
        weatherIconKey: weather.weatherIconKey,
        weatherIconPeriod: weather.weatherIconPeriod,
        gust: weather.gust,
        wave: weather.wave,
        period: weather.period ?? '-',
        lowTide: weather.lowTide,
        highTide: weather.highTide,
        serviceAreaId: weather.serviceAreaId,
        serviceAreaName: weather.serviceAreaName,
        isLoading: false,
        permissionStatus,
      });
    } catch (error) {
      if (isStale()) {
        return;
      }

      devLog('Weather update error ======>' + error);

      const resolvedPermission =
        permissionStatus ?? (await checkLocationPermission());

      if (isStale()) {
        return;
      }

      let hadWeather = false;
      setState(prev => {
        const status =
          isLocationGranted(resolvedPermission) || prev.latitude == null
            ? resolvedPermission ?? prev.permissionStatus
            : prev.permissionStatus ?? resolvedPermission;

        if (prev.temperature !== '-') {
          hadWeather = true;
          return {
            ...prev,
            isLoading: false,
            permissionStatus: status,
          };
        }

        return {
          ...initialState,
          latitude: prev.latitude,
          longitude: prev.longitude,
          address: isLocationGranted(status ?? 'denied')
            ? 'Unable to load weather right now. Try again.'
            : weatherPermissionMessage(status ?? 'denied'),
          isLoading: false,
          permissionStatus: status,
        };
      });
      if (!hadWeather) {
        hasLoadedWeather.current = false;
      }
    } finally {
      if (generation === loadGeneration.current) {
        loadInFlight.current = false;
      }
    }
  }, []);

  const requestPermission = useCallback(async () => {
    const current = await checkLocationPermission();
    if (current === 'blocked') {
      await openLocationSettings();
      return;
    }
    await loadWeatherUpdate(true);
  }, [loadWeatherUpdate]);

  useEffect(() => {
    let cancelled = false;
    const didAttemptRequest = {current: false};
    let deferTimer: ReturnType<typeof setTimeout> | null = null;
    let interactionTask: {cancel: () => void} | null = null;

    const runInitialRequest = () => {
      if (cancelled || didAttemptRequest.current) {
        return;
      }
      if (AppState.currentState !== 'active') {
        return;
      }
      didAttemptRequest.current = true;
      loadWeatherUpdate(true);
    };

    interactionTask = InteractionManager.runAfterInteractions(() => {
      if (cancelled) {
        return;
      }
      deferTimer = setTimeout(runInitialRequest, 500);
    });

    let resumeTimer: ReturnType<typeof setTimeout> | null = null;

    const onAppStateChange = (nextState: AppStateStatus) => {
      if (nextState !== 'active' || cancelled) {
        return;
      }

      if (!didAttemptRequest.current) {
        runInitialRequest();
        return;
      }

      // The permission dialog backgrounds the app. Starting a second load
      // here races the in-flight request() and can apply a stale "denied"
      // after GPS already succeeded.
      if (hasLoadedWeather.current || loadInFlight.current) {
        return;
      }

      if (resumeTimer) {
        clearTimeout(resumeTimer);
      }
      // iOS can take a beat to publish a grant made in Settings / the dialog.
      resumeTimer = setTimeout(() => {
        if (
          cancelled ||
          hasLoadedWeather.current ||
          loadInFlight.current
        ) {
          return;
        }
        loadWeatherUpdate(false);
      }, 250);
    };

    const subscription = AppState.addEventListener('change', onAppStateChange);

    return () => {
      cancelled = true;
      if (deferTimer) {
        clearTimeout(deferTimer);
      }
      if (resumeTimer) {
        clearTimeout(resumeTimer);
      }
      interactionTask?.cancel();
      subscription.remove();
    };
  }, [loadWeatherUpdate]);

  return {
    ...state,
    needsPermission:
      state.permissionStatus != null &&
      !isLocationGranted(state.permissionStatus) &&
      state.latitude == null,
    canOpenSettings: state.permissionStatus === 'blocked',
    requestPermission,
    openSettings: openLocationSettings,
    refresh: () => loadWeatherUpdate(false),
  };
};

export type WeatherUpdateController = ReturnType<typeof useWeatherUpdate>;
