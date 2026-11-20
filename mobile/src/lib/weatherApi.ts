import {API_BASE_URL} from '@Api/baseQuery';
import {devLog} from '@Utils/devLog';
import type {WeatherIconKey, WeatherIconPeriod} from '@Utils/weatherIcons';

export type WeatherSummaryResponse = {
  fallbackAddress: string;
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
};

export type WeatherForecastDayResponse = {
  key: string;
  dayLabel: string;
  dateNum: number;
  temp: number | null;
  tempHigh: number | null;
  tempLow: number | null;
  precipPercent: number | null;
  windDirection: string;
  windSpeed: string;
  gust: string;
  visibility: string;
  pressure: string;
  wave: string;
  period: string;
  weatherIconKey: WeatherIconKey;
  weatherIconPeriod: WeatherIconPeriod;
};

export type WeatherTideDetailResponse = {
  serviceAreaId: string;
  serviceAreaName: string;
  stationId: string;
  dayStartTimestamp?: number;
  dayEndTimestamp?: number;
  chartLow: number;
  chartHigh: number;
  chartPoints: Array<{timestamp: number; height: number; label: string}>;
  markers: Array<{type: 'H' | 'L'; timestamp: number; height: number}>;
  currentTimestamp: number;
  currentHeight: number | null;
  currentTrend: 'up' | 'down';
  moonPhase: string;
  nextHighCountdown: string;
  nextLowCountdown: string;
  highTideTime: string;
  highTideHeight: string;
  lowTideTime: string;
  lowTideHeight: string;
};

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

const requestWeather = async <T,>(path: string): Promise<T> => {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });

  const payload = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok || payload?.success === false) {
    throw new Error(
      payload?.message || `Weather request failed (${response.status})`,
    );
  }

  if (payload?.data === undefined) {
    throw new Error(payload?.message || 'Weather response missing data');
  }

  return payload.data;
};

export const fetchWeatherSummary = async (
  latitude: number,
  longitude: number,
): Promise<WeatherSummaryResponse> => {
  try {
    return await requestWeather<WeatherSummaryResponse>(
      `/weather/summary?lat=${encodeURIComponent(String(latitude))}&lon=${encodeURIComponent(String(longitude))}`,
    );
  } catch (error) {
    devLog('fetchWeatherSummary error ======>' + error);
    throw error;
  }
};

const deviceTimeZone = () =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

const withTimeZone = (path: string) => {
  const tz = deviceTimeZone();
  const joiner = path.includes('?') ? '&' : '?';
  return `${path}${joiner}timeZone=${encodeURIComponent(tz)}`;
};

export const fetchWeatherForecastDays = async (
  latitude: number,
  longitude: number,
): Promise<WeatherForecastDayResponse[]> => {
  try {
    const data = await requestWeather<{days: WeatherForecastDayResponse[]}>(
      withTimeZone(
        `/weather/forecast?lat=${encodeURIComponent(String(latitude))}&lon=${encodeURIComponent(String(longitude))}`,
      ),
    );
    return data?.days ?? [];
  } catch (error) {
    devLog('fetchWeatherForecastDays error ======>' + error);
    throw error;
  }
};

export const fetchWeatherTides = async (
  serviceAreaId: string,
): Promise<WeatherTideDetailResponse | null> => {
  try {
    return await requestWeather<WeatherTideDetailResponse | null>(
      withTimeZone(
        `/weather/tides?serviceAreaId=${encodeURIComponent(serviceAreaId)}`,
      ),
    );
  } catch (error) {
    devLog('fetchWeatherTides error ======>' + error);
    throw error;
  }
};

export type WindFieldPoint = {
  lat: number;
  lon: number;
  speeds: Array<number | null>;
  directions: Array<number | null>;
};

export type WindFieldResponse = {
  hours: string[];
  cellLatDeg: number;
  cellLonDeg: number;
  points: WindFieldPoint[];
};

export type WindFieldBbox = {
  minLat: number;
  minLon: number;
  maxLat: number;
  maxLon: number;
};

export const fetchWindField = async (
  bbox: WindFieldBbox,
): Promise<WindFieldResponse> => {
  try {
    const params = new URLSearchParams({
      minLat: String(bbox.minLat),
      minLon: String(bbox.minLon),
      maxLat: String(bbox.maxLat),
      maxLon: String(bbox.maxLon),
    });
    return await requestWindFieldJson(
      `${API_BASE_URL}/weather/wind-field?${params.toString()}`,
    );
  } catch (error) {
    devLog('fetchWindField backend unavailable, using Open-Meteo ======>' + error);
    return fetchOpenMeteoWindField(bbox);
  }
};

const requestWindFieldJson = async (url: string): Promise<WindFieldResponse> => {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });
  const text = (await response.text()).trim();
  if (!text || text.startsWith('<')) {
    throw new Error('Wind field endpoint unavailable');
  }
  let payload: ApiEnvelope<WindFieldResponse>;
  try {
    payload = JSON.parse(text) as ApiEnvelope<WindFieldResponse>;
  } catch {
    throw new Error('Wind field endpoint unavailable');
  }
  if (!response.ok || payload?.success === false || payload?.data == null) {
    throw new Error(payload?.message || 'Unable to load wind map');
  }
  return payload.data;
};

const WIND_GRID_SIZE = 9;
const WIND_MAX_SPAN_DEG = 18;
const WIND_MIN_SPAN_DEG = 0.6;
const WIND_FORECAST_DAYS = 3;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const normalizeBbox = (bbox: WindFieldBbox) => {
  let south = Math.min(bbox.minLat, bbox.maxLat);
  let north = Math.max(bbox.minLat, bbox.maxLat);
  let west = Math.min(bbox.minLon, bbox.maxLon);
  let east = Math.max(bbox.minLon, bbox.maxLon);

  south = clamp(south, -85, 85);
  north = clamp(north, -85, 85);
  west = clamp(west, -180, 180);
  east = clamp(east, -180, 180);

  const latMid = (south + north) / 2;
  const lonMid = (west + east) / 2;
  let latSpan = north - south;
  let lonSpan = east - west;

  if (latSpan < WIND_MIN_SPAN_DEG) {
    south = clamp(latMid - WIND_MIN_SPAN_DEG / 2, -85, 85);
    north = clamp(latMid + WIND_MIN_SPAN_DEG / 2, -85, 85);
    latSpan = north - south;
  }
  if (lonSpan < WIND_MIN_SPAN_DEG) {
    west = clamp(lonMid - WIND_MIN_SPAN_DEG / 2, -180, 180);
    east = clamp(lonMid + WIND_MIN_SPAN_DEG / 2, -180, 180);
    lonSpan = east - west;
  }
  if (latSpan > WIND_MAX_SPAN_DEG) {
    south = latMid - WIND_MAX_SPAN_DEG / 2;
    north = latMid + WIND_MAX_SPAN_DEG / 2;
    latSpan = WIND_MAX_SPAN_DEG;
  }
  if (lonSpan > WIND_MAX_SPAN_DEG) {
    west = lonMid - WIND_MAX_SPAN_DEG / 2;
    east = lonMid + WIND_MAX_SPAN_DEG / 2;
    lonSpan = WIND_MAX_SPAN_DEG;
  }

  return {south, west, north, east, latSpan, lonSpan};
};

const toIsoUtcHour = (value: string): string | null => {
  const withZone = /Z|[+-]\d{2}:\d{2}$/.test(value) ? value : `${value}Z`;
  const date = new Date(withZone);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
};

type OpenMeteoLocation = {
  error?: boolean;
  reason?: string;
  hourly?: {
    time?: string[];
    wind_speed_10m?: Array<number | null>;
    wind_direction_10m?: Array<number | null>;
  };
};

const fetchOpenMeteoWindField = async (
  bbox: WindFieldBbox,
): Promise<WindFieldResponse> => {
  const normalized = normalizeBbox(bbox);
  const steps = WIND_GRID_SIZE - 1;
  const latStep = normalized.latSpan / steps;
  const lonStep = normalized.lonSpan / steps;
  const lats: number[] = [];
  const lons: number[] = [];
  for (let row = 0; row < WIND_GRID_SIZE; row += 1) {
    for (let col = 0; col < WIND_GRID_SIZE; col += 1) {
      lats.push(Number((normalized.south + row * latStep).toFixed(4)));
      lons.push(Number((normalized.west + col * lonStep).toFixed(4)));
    }
  }

  const url =
    'https://api.open-meteo.com/v1/forecast' +
    `?latitude=${lats.join(',')}` +
    `&longitude=${lons.join(',')}` +
    '&hourly=wind_speed_10m,wind_direction_10m' +
    '&wind_speed_unit=mph' +
    `&forecast_days=${WIND_FORECAST_DAYS}` +
    '&timezone=UTC';

  const response = await fetch(url, {
    method: 'GET',
    headers: {Accept: 'application/json'},
  });
  const text = (await response.text()).trim();
  if (response.status === 429) {
    throw new Error('Wind data is busy. Try again in a moment.');
  }
  if (!response.ok || !text || text.startsWith('<')) {
    throw new Error('Unable to load wind map. Try again.');
  }

  let payload: OpenMeteoLocation | OpenMeteoLocation[];
  try {
    payload = JSON.parse(text) as OpenMeteoLocation | OpenMeteoLocation[];
  } catch {
    throw new Error('Unable to load wind map. Try again.');
  }

  const locations = Array.isArray(payload) ? payload : [payload];
  if (!locations.length || locations[0]?.error) {
    throw new Error(locations[0]?.reason || 'Unable to load wind map. Try again.');
  }

  const hours = (locations[0]?.hourly?.time ?? [])
    .map(toIsoUtcHour)
    .filter((hour): hour is string => Boolean(hour));

  const points = lats.map((lat, index) => {
    const location = locations[index] ?? locations[0];
    const speeds = (location?.hourly?.wind_speed_10m ?? []).map(speed =>
      speed == null || !Number.isFinite(Number(speed))
        ? null
        : Math.round(Number(speed) * 10) / 10,
    );
    const directions = (location?.hourly?.wind_direction_10m ?? []).map(deg =>
      deg == null || !Number.isFinite(Number(deg))
        ? null
        : Math.round(Number(deg)),
    );
    return {
      lat,
      lon: lons[index],
      speeds,
      directions,
    };
  });

  return {
    hours,
    cellLatDeg: Number(latStep.toFixed(4)),
    cellLonDeg: Number(lonStep.toFixed(4)),
    points,
  };
};

export type RadarFrameKind = 'past' | 'nowcast';

export type RadarFrame = {
  time: number;
  iso: string;
  kind: RadarFrameKind;
  path: string;
  tileUrl: string;
};

export type RadarFramesResponse = {
  generated: number;
  host: string;
  tileSize: number;
  maxzoom: number;
  nowIndex: number;
  frames: RadarFrame[];
  satelliteFrames: RadarFrame[];
  satelliteNowIndex: number;
};

export const fetchRadarFrames = async (): Promise<RadarFramesResponse> => {
  try {
    return await requestRadarJson(`${API_BASE_URL}/weather/radar`);
  } catch (error) {
    devLog('fetchRadarFrames backend unavailable, using RainViewer ======>' + error);
    return fetchRainViewerRadarFrames();
  }
};

const requestRadarJson = async (url: string): Promise<RadarFramesResponse> => {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });
  const text = (await response.text()).trim();
  if (!text || text.startsWith('<')) {
    throw new Error('Radar endpoint unavailable');
  }
  let payload: ApiEnvelope<RadarFramesResponse>;
  try {
    payload = JSON.parse(text) as ApiEnvelope<RadarFramesResponse>;
  } catch {
    throw new Error('Radar endpoint unavailable');
  }
  if (!response.ok || payload?.success === false || payload?.data == null) {
    throw new Error(payload?.message || 'Unable to load radar');
  }
  if (!payload.data.frames?.length) {
    throw new Error('Radar frames unavailable');
  }
  return {
    ...payload.data,
    satelliteFrames: payload.data.satelliteFrames ?? [],
    satelliteNowIndex:
      payload.data.satelliteNowIndex ??
      Math.max((payload.data.satelliteFrames?.length ?? 1) - 1, 0),
  };
};

const RAINVIEWER_MAPS_URL = 'https://api.rainviewer.com/public/weather-maps.json';
const RADAR_TILE_SIZE = 256;
const RADAR_COLOR_SCHEME = 6;
const RADAR_OPTIONS = '1_1';
const RADAR_MAXZOOM = 7;

const buildRadarTileUrl = (host: string, path: string) =>
  `${host.replace(/\/$/, '')}${path}/${RADAR_TILE_SIZE}/{z}/{x}/{y}/${RADAR_COLOR_SCHEME}/${RADAR_OPTIONS}.png`;

type RainViewerFrame = {
  time?: number;
  path?: string;
};

type RainViewerMaps = {
  generated?: number;
  host?: string;
  radar?: {
    past?: RainViewerFrame[];
    nowcast?: RainViewerFrame[];
  };
  satellite?: {
    infrared?: RainViewerFrame[];
  };
};

const mapRainViewerFrame = (
  item: RainViewerFrame,
  kind: RadarFrameKind,
  host: string,
): RadarFrame | null => {
  const time = Number(item?.time);
  const path = String(item?.path || '').trim();
  if (!Number.isFinite(time) || time <= 0 || !path) {
    return null;
  }
  return {
    time,
    iso: new Date(time * 1000).toISOString(),
    kind,
    path,
    tileUrl: buildRadarTileUrl(host, path),
  };
};

const fetchRainViewerRadarFrames = async (): Promise<RadarFramesResponse> => {
  const response = await fetch(RAINVIEWER_MAPS_URL, {
    method: 'GET',
    headers: {Accept: 'application/json'},
  });
  const text = (await response.text()).trim();
  if (!response.ok || !text || text.startsWith('<')) {
    throw new Error('Unable to load radar. Try again.');
  }

  let payload: RainViewerMaps;
  try {
    payload = JSON.parse(text) as RainViewerMaps;
  } catch {
    throw new Error('Unable to load radar. Try again.');
  }

  const host = String(payload.host || 'https://tilecache.rainviewer.com').replace(
    /\/$/,
    '',
  );
  const pastFrames = (payload.radar?.past ?? [])
    .map(item => mapRainViewerFrame(item, 'past', host))
    .filter((frame): frame is RadarFrame => Boolean(frame));
  const nowcastFrames = (payload.radar?.nowcast ?? [])
    .map(item => mapRainViewerFrame(item, 'nowcast', host))
    .filter((frame): frame is RadarFrame => Boolean(frame));
  const frames = [...pastFrames, ...nowcastFrames];
  if (!frames.length) {
    throw new Error('Unable to load radar. Try again.');
  }

  const satelliteFrames = (payload.satellite?.infrared ?? [])
    .map(item => mapRainViewerFrame(item, 'past', host))
    .filter((frame): frame is RadarFrame => Boolean(frame));

  return {
    generated: Number(payload.generated) || Math.floor(Date.now() / 1000),
    host,
    tileSize: RADAR_TILE_SIZE,
    maxzoom: RADAR_MAXZOOM,
    nowIndex: Math.max(pastFrames.length - 1, 0),
    frames,
    satelliteFrames,
    satelliteNowIndex: Math.max(satelliteFrames.length - 1, 0),
  };
};
