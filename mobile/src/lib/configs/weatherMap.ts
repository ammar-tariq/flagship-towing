import {
  PROVIDER_GOOGLE,
  type Camera,
  type MapStyleElement,
  type Region,
} from 'react-native-maps';
import {DEFAULT_WIND_CENTER, DEFAULT_WIND_ZOOM} from '@Lib/configs/mapLibre';

/** Always Google Maps — never Apple MapKit on iOS. */
export const WEATHER_MAP_PROVIDER = PROVIDER_GOOGLE;

export const WEATHER_MAP_BACKGROUND = '#38435C';

export const WEATHER_MAP_PADDING = {
  top: 8,
  right: 0,
  bottom: 108,
  left: 0,
};

/** Dark nautical basemap so radar/wind overlays read like the previous Fiord style. */
export const WEATHER_GOOGLE_MAP_STYLE: MapStyleElement[] = [
  {elementType: 'geometry', stylers: [{color: '#38435c'}]},
  {elementType: 'labels.icon', stylers: [{visibility: 'off'}]},
  {elementType: 'labels.text.fill', stylers: [{color: '#8b9bb4'}]},
  {elementType: 'labels.text.stroke', stylers: [{color: '#2b3448'}]},
  {
    featureType: 'administrative',
    elementType: 'geometry',
    stylers: [{color: '#4a5670'}],
  },
  {
    featureType: 'administrative.country',
    elementType: 'geometry.stroke',
    stylers: [{color: '#6a7894'}],
  },
  {
    featureType: 'administrative.land_parcel',
    stylers: [{visibility: 'off'}],
  },
  {featureType: 'poi', stylers: [{visibility: 'off'}]},
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{color: '#3a4a3f'}, {visibility: 'on'}],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{color: '#44506a'}],
  },
  {
    featureType: 'road',
    elementType: 'labels.icon',
    stylers: [{visibility: 'off'}],
  },
  {featureType: 'transit', stylers: [{visibility: 'off'}]},
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{color: '#1c2738'}],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{color: '#6d7d96'}],
  },
];

/**
 * RainViewer radar tiles exist from this zoom through `maxzoom` (usually 7).
 * Past the top of that range each tile is blown up into a square.
 */
export const RADAR_MIN_ZOOM = 3;
/** Opens wide enough to see the weather around you without pinching out. */
export const RADAR_USER_ZOOM = 5;

export type ZoomLock = {
  minZoom: number;
  maxZoom: number;
  initialZoom: number;
  zoomEnabled: boolean;
};

/** One supported zoom becomes a fixed camera. A span stays pinchable inside it. */
export const zoomLock = (
  minZoom: number,
  maxZoom: number,
  preferred: number,
): ZoomLock => {
  const max = maxZoom;
  const min = Math.min(minZoom, max);
  const fixed = max - min < 0.05;
  const zoom = fixed ? min : Math.min(max, Math.max(min, preferred));
  return {
    minZoom: min,
    maxZoom: fixed ? min : max,
    initialZoom: zoom,
    zoomEnabled: !fixed,
  };
};

/**
 * Google zoom that fits `spanDeg` inside the visible map.
 * Uses the tighter of width and height so the whole overlay is on screen.
 */
export const zoomToFitSpan = (
  spanDeg: number,
  mapWidth: number,
  mapHeight: number,
  latitude = 29,
) => {
  const span = Math.max(spanDeg, 0.05);
  const width = Math.max(mapWidth, 1);
  const height = Math.max(mapHeight, 1);
  const cosLat = Math.max(Math.cos((latitude * Math.PI) / 180), 0.2);
  const lonZoom = Math.log2((360 * width) / (span * 256));
  const latZoom = Math.log2((360 * height * cosLat) / (span * 256));
  return Math.min(lonZoom, latZoom);
};

export const defaultWeatherCamera = (): Camera => ({
  center: {
    latitude: DEFAULT_WIND_CENTER[1],
    longitude: DEFAULT_WIND_CENTER[0],
  },
  heading: 0,
  pitch: 0,
  zoom: DEFAULT_WIND_ZOOM,
});

export const DEFAULT_WEATHER_CAMERA = defaultWeatherCamera();

export const weatherCameraAt = (
  lng: number,
  lat: number,
  zoom = DEFAULT_WIND_ZOOM,
): Partial<Camera> => ({
  center: {latitude: lat, longitude: lng},
  heading: 0,
  pitch: 0,
  zoom,
});

export const bboxFromRegion = (region: Region) => ({
  minLat: region.latitude - region.latitudeDelta / 2,
  minLon: region.longitude - region.longitudeDelta / 2,
  maxLat: region.latitude + region.latitudeDelta / 2,
  maxLon: region.longitude + region.longitudeDelta / 2,
});

export const bboxAroundLngLat = (
  lng: number,
  lat: number,
  span = 3.2,
) => ({
  minLat: lat - span / 2,
  minLon: lng - span / 2,
  maxLat: lat + span / 2,
  maxLon: lng + span / 2,
});
