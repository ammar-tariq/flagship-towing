import type {Feature, FeatureCollection} from 'geojson';
import type {WindFieldResponse} from '@Utils/weatherApi';

const COMPASS_16 = [
  'N',
  'NNE',
  'NE',
  'ENE',
  'E',
  'ESE',
  'SE',
  'SSE',
  'S',
  'SSW',
  'SW',
  'WSW',
  'W',
  'WNW',
  'NW',
  'NNW',
] as const;

export const WIND_ACCENT = '#F5A31A';

export const WIND_LEGEND_STOPS = [1, 3, 5, 10, 15, 20, 25, 30, 40, 50, 60, 80];

export const WIND_LEGEND_COLORS = [
  '#7EC8E3',
  '#5BC4C0',
  '#4CBF8A',
  '#7BC94A',
  '#A8D034',
  '#D4D020',
  '#F0C020',
  '#F0A010',
  '#E07020',
  '#D04030',
  '#C02060',
  '#902090',
];

export const WIND_FILL_COLOR: unknown[] = [
  'interpolate',
  ['linear'],
  ['get', 'speedMph'],
  1,
  '#7EC8E3',
  5,
  '#4CBF8A',
  15,
  '#7BC94A',
  25,
  '#F0C020',
  40,
  '#E07020',
  60,
  '#C02060',
  80,
  '#902090',
];

export const EMPTY_FEATURE_COLLECTION: FeatureCollection = {
  type: 'FeatureCollection',
  features: [],
};

const DEFAULT_GRID = 9;
const HEAT_SIZE = 15;
const STREAK_SIZE = 22;

export const compassFromDeg = (deg: number): string => {
  const normalized = ((deg % 360) + 360) % 360;
  const index = Math.round(normalized / 22.5) % 16;
  return COMPASS_16[index];
};

const FROM_ARROWS = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖'] as const;

export const fromDirectionArrow = (fromDeg: number): string => {
  const normalized = ((fromDeg % 360) + 360) % 360;
  const index = Math.round(normalized / 45) % 8;
  return FROM_ARROWS[index];
};

export const flowDegFromMeteorological = (fromDeg: number): number =>
  (fromDeg + 180) % 360;

export const nearestHourIndex = (hours: string[]): number => {
  if (!hours.length) {
    return 0;
  }
  const now = Date.now();
  let best = 0;
  let bestDist = Number.POSITIVE_INFINITY;
  hours.forEach((hour, index) => {
    const time = new Date(hour).getTime();
    if (!Number.isFinite(time)) {
      return;
    }
    const dist = Math.abs(time - now);
    if (dist < bestDist) {
      best = index;
      bestDist = dist;
    }
  });
  return best;
};

const ordinal = (day: number): string => {
  const teen = day % 100;
  if (teen >= 11 && teen <= 13) {
    return `${day}th`;
  }
  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
};

export const formatWindHourLabel = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const weekday = date.toLocaleDateString('en-US', {weekday: 'long'});
  const day = date.getDate();
  const hour = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    hour12: true,
  });
  return `${weekday} the ${ordinal(day)} - ${hour}`;
};

const toFlowUV = (speed: number, fromDeg: number) => {
  const flowRad = ((fromDeg + 180) * Math.PI) / 180;
  return {
    u: speed * Math.sin(flowRad),
    v: speed * Math.cos(flowRad),
  };
};

const fromFlowUV = (u: number, v: number) => {
  const speed = Math.hypot(u, v);
  const flowDeg = ((Math.atan2(u, v) * 180) / Math.PI + 360) % 360;
  const fromDeg = (flowDeg + 180) % 360;
  return {speed, fromDeg, flowDeg};
};

const inferGrid = (field: WindFieldResponse) => {
  const size = Math.round(Math.sqrt(field.points.length));
  return size > 1 ? size : DEFAULT_GRID;
};

const fract = (n: number) => {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

type Corner = {
  lat: number;
  lon: number;
  speed: number;
  fromDeg: number;
};

const sampleCorner = (
  field: WindFieldResponse,
  hourIndex: number,
  hourFrac: number,
  row: number,
  col: number,
  gridSize: number,
): Corner | null => {
  const point = field.points[row * gridSize + col];
  if (!point) {
    return null;
  }
  const speed0 = point.speeds[hourIndex];
  const from0 = point.directions[hourIndex];
  if (speed0 == null || from0 == null) {
    return null;
  }
  if (hourFrac <= 0.001) {
    return {lat: point.lat, lon: point.lon, speed: speed0, fromDeg: from0};
  }
  const nextIndex =
    hourIndex + 1 < point.speeds.length ? hourIndex + 1 : 0;
  const speed1 = point.speeds[nextIndex];
  const from1 = point.directions[nextIndex];
  if (speed1 == null || from1 == null) {
    return {lat: point.lat, lon: point.lon, speed: speed0, fromDeg: from0};
  }
  const a = toFlowUV(speed0, from0);
  const b = toFlowUV(speed1, from1);
  const mixed = fromFlowUV(
    a.u + (b.u - a.u) * hourFrac,
    a.v + (b.v - a.v) * hourFrac,
  );
  return {
    lat: point.lat,
    lon: point.lon,
    speed: mixed.speed,
    fromDeg: mixed.fromDeg,
  };
};

type Sample = {
  lat: number;
  lon: number;
  speed: number;
  fromDeg: number;
  flowDeg: number;
  pointIndex: number;
};

const densify = (
  field: WindFieldResponse,
  hourIndex: number,
  hourFrac: number,
  displaySize: number,
): Sample[] => {
  const gridSize = inferGrid(field);
  const samples: Sample[] = [];
  const max = gridSize - 1;
  for (let row = 0; row < displaySize; row += 1) {
    for (let col = 0; col < displaySize; col += 1) {
      const fy = (row / (displaySize - 1)) * max;
      const fx = (col / (displaySize - 1)) * max;
      const r0 = Math.min(max - 1, Math.floor(fy));
      const c0 = Math.min(max - 1, Math.floor(fx));
      const r1 = r0 + 1;
      const c1 = c0 + 1;
      const ty = fy - r0;
      const tx = fx - c0;
      const corners = [
        sampleCorner(field, hourIndex, hourFrac, r0, c0, gridSize),
        sampleCorner(field, hourIndex, hourFrac, r0, c1, gridSize),
        sampleCorner(field, hourIndex, hourFrac, r1, c0, gridSize),
        sampleCorner(field, hourIndex, hourFrac, r1, c1, gridSize),
      ];
      if (corners.some(corner => corner == null)) {
        continue;
      }
      const [a, b, c, d] = corners as Corner[];
      const uv = corners.map(corner => toFlowUV(corner!.speed, corner!.fromDeg));
      const mix = (get: (corner: Corner, flow: {u: number; v: number}) => number) =>
        get(a, uv[0]) * (1 - tx) * (1 - ty) +
        get(b, uv[1]) * tx * (1 - ty) +
        get(c, uv[2]) * (1 - tx) * ty +
        get(d, uv[3]) * tx * ty;
      const lat = mix(corner => corner.lat);
      const lon = mix(corner => corner.lon);
      const u = mix((_corner, flow) => flow.u);
      const v = mix((_corner, flow) => flow.v);
      const vector = fromFlowUV(u, v);
      samples.push({
        lat,
        lon,
        speed: vector.speed,
        fromDeg: vector.fromDeg,
        flowDeg: vector.flowDeg,
        pointIndex: Math.round(fy) * gridSize + Math.round(fx),
      });
    }
  }
  return samples;
};

const sampleProperties = (sample: Sample) => ({
  speedMph: sample.speed,
  directionDeg: sample.fromDeg,
  flowDeg: sample.flowDeg,
  abbrev: compassFromDeg(sample.fromDeg),
  pointIndex: sample.pointIndex,
});

export const interpolatePointWind = (
  field: WindFieldResponse | null,
  pointIndex: number,
  hourIndex: number,
  hourFrac = 0,
) => {
  const point = field?.points[pointIndex];
  if (!point || !field) {
    return null;
  }
  const gridSize = inferGrid(field);
  const row = Math.floor(pointIndex / gridSize);
  const col = pointIndex % gridSize;
  const sample = sampleCorner(field, hourIndex, hourFrac, row, col, gridSize);
  if (!sample) {
    return null;
  }
  return {
    speedMph: sample.speed,
    fromDeg: sample.fromDeg,
    abbrev: compassFromDeg(sample.fromDeg),
  };
};

export type WindCollections = {
  heat: FeatureCollection;
  streaks: FeatureCollection;
  hits: FeatureCollection;
};

const buildHits = (
  field: WindFieldResponse,
  hourIndex: number,
  hourFrac: number,
): Feature[] => {
  const gridSize = inferGrid(field);
  const features: Feature[] = [];
  field.points.forEach((point, index) => {
    const row = Math.floor(index / gridSize);
    const col = index % gridSize;
    const sample = sampleCorner(field, hourIndex, hourFrac, row, col, gridSize);
    if (!sample) {
      return;
    }
    const flowDeg = flowDegFromMeteorological(sample.fromDeg);
    features.push({
      type: 'Feature',
      properties: {
        speedMph: sample.speed,
        directionDeg: sample.fromDeg,
        flowDeg,
        abbrev: compassFromDeg(sample.fromDeg),
        pointIndex: index,
      },
      geometry: {type: 'Point', coordinates: [point.lon, point.lat]},
    });
  });
  return features;
};

export const buildWindHeatHits = (
  field: WindFieldResponse | null,
  hourIndex: number,
  hourFrac = 0,
): Pick<WindCollections, 'heat' | 'hits'> => {
  if (!field?.points?.length) {
    return {
      heat: EMPTY_FEATURE_COLLECTION,
      hits: EMPTY_FEATURE_COLLECTION,
    };
  }
  const heatFeatures: Feature[] = densify(
    field,
    hourIndex,
    hourFrac,
    HEAT_SIZE,
  ).map(sample => ({
    type: 'Feature',
    properties: sampleProperties(sample),
    geometry: {type: 'Point', coordinates: [sample.lon, sample.lat]},
  }));
  return {
    heat: {type: 'FeatureCollection', features: heatFeatures},
    hits: {type: 'FeatureCollection', features: buildHits(field, hourIndex, hourFrac)},
  };
};

export const buildWindStreaks = (
  field: WindFieldResponse | null,
  hourIndex: number,
  hourFrac = 0,
  phase = 0,
): FeatureCollection => {
  if (!field?.points?.length) {
    return EMPTY_FEATURE_COLLECTION;
  }
  const latStep = field.cellLatDeg;
  const lonStep = field.cellLonDeg;
  const features: Feature[] = [];
  densify(field, hourIndex, hourFrac, STREAK_SIZE).forEach((sample, index) => {
    if (fract(index + 3.7) < 0.12) {
      return;
    }
    const flowRad = (sample.flowDeg * Math.PI) / 180;
    const jitter = (fract(index * 1.17) - 0.5) * 0.55;
    const perp = flowRad + Math.PI / 2;
    const streakLen =
      Math.max(latStep, lonStep) *
      (0.07 + Math.min(sample.speed, 36) / 220 + fract(index) * 0.04);
    const travel = ((index * 0.13 + phase) % 1) - 0.5;
    const cx =
      sample.lon +
      Math.sin(flowRad) * lonStep * travel * 1.15 +
      Math.sin(perp) * lonStep * jitter * 0.22;
    const cy =
      sample.lat +
      Math.cos(flowRad) * latStep * travel * 1.15 +
      Math.cos(perp) * latStep * jitter * 0.22;
    const dx = Math.sin(flowRad) * streakLen * 0.5;
    const dy = Math.cos(flowRad) * streakLen * 0.5;
    features.push({
      type: 'Feature',
      properties: sampleProperties(sample),
      geometry: {
        type: 'LineString',
        coordinates: [
          [cx - dx, cy - dy],
          [cx + dx, cy + dy],
        ],
      },
    });
  });
  return {type: 'FeatureCollection', features};
};

export const buildWindGeoJSON = (
  field: WindFieldResponse | null,
  hourIndex: number,
  phase = 0,
  hourFrac = 0,
): WindCollections => {
  const {heat, hits} = buildWindHeatHits(field, hourIndex, hourFrac);
  return {
    heat,
    streaks: buildWindStreaks(field, hourIndex, hourFrac, phase),
    hits,
  };
};

export type WindGoogleHit = {
  latitude: number;
  longitude: number;
  speedMph: number;
  fromDeg: number;
  abbrev: string;
  pointIndex: number;
};

/** One entry per forecast grid point, used for tap-to-inspect on the map. */
export const buildWindHits = (
  field: WindFieldResponse | null,
  hourIndex: number,
): WindGoogleHit[] => {
  if (!field?.points?.length) {
    return [];
  }
  const gridSize = inferGrid(field);
  const hits: WindGoogleHit[] = [];
  field.points.forEach((point, index) => {
    const row = Math.floor(index / gridSize);
    const col = index % gridSize;
    const sample = sampleCorner(field, hourIndex, 0, row, col, gridSize);
    if (!sample) {
      return;
    }
    hits.push({
      latitude: point.lat,
      longitude: point.lon,
      speedMph: sample.speed,
      fromDeg: sample.fromDeg,
      abbrev: compassFromDeg(sample.fromDeg),
      pointIndex: index,
    });
  });
  return hits;
};

export type WindEngineField = {
  hours: number;
  rows: number;
  cols: number;
  minLat: number;
  minLon: number;
  dLat: number;
  dLon: number;
  /** Flat `[hour][row][col]` east component (mph). `null` = missing. */
  u: Array<number | null>;
  /** Flat `[hour][row][col]` north component (mph). `null` = missing. */
  v: Array<number | null>;
};

/**
 * Repack the API field as a regular lat/lon grid of flow vectors for the
 * canvas engine. Vectors (not speed/direction) interpolate correctly between
 * hours and across cells, and the engine only ever needs u/v.
 */
export const buildWindEngineField = (
  field: WindFieldResponse | null,
): WindEngineField | null => {
  if (!field?.points?.length || !field.hours.length) {
    return null;
  }
  let minLat = Number.POSITIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;
  let minLon = Number.POSITIVE_INFINITY;
  let maxLon = Number.NEGATIVE_INFINITY;
  field.points.forEach(point => {
    minLat = Math.min(minLat, point.lat);
    maxLat = Math.max(maxLat, point.lat);
    minLon = Math.min(minLon, point.lon);
    maxLon = Math.max(maxLon, point.lon);
  });
  const dLat = field.cellLatDeg || (maxLat - minLat) / Math.max(1, inferGrid(field) - 1);
  const dLon = field.cellLonDeg || (maxLon - minLon) / Math.max(1, inferGrid(field) - 1);
  if (!(dLat > 0) || !(dLon > 0)) {
    return null;
  }
  const rows = Math.round((maxLat - minLat) / dLat) + 1;
  const cols = Math.round((maxLon - minLon) / dLon) + 1;
  const hours = field.hours.length;
  const size = hours * rows * cols;
  const u: Array<number | null> = new Array(size).fill(null);
  const v: Array<number | null> = new Array(size).fill(null);
  field.points.forEach(point => {
    const row = Math.round((point.lat - minLat) / dLat);
    const col = Math.round((point.lon - minLon) / dLon);
    if (row < 0 || row >= rows || col < 0 || col >= cols) {
      return;
    }
    for (let hour = 0; hour < hours; hour += 1) {
      const speed = point.speeds[hour];
      const from = point.directions[hour];
      if (speed == null || from == null) {
        continue;
      }
      const flow = toFlowUV(speed, from);
      const index = (hour * rows + row) * cols + col;
      u[index] = Math.round(flow.u * 100) / 100;
      v[index] = Math.round(flow.v * 100) / 100;
    }
  });
  return {hours, rows, cols, minLat, minLon, dLat, dLon, u, v};
};

export const nearestWindHit = (
  hits: WindGoogleHit[],
  latitude: number,
  longitude: number,
  maxDeg = 0.4,
): WindGoogleHit | null => {
  let best: WindGoogleHit | null = null;
  let bestDist = maxDeg;
  hits.forEach(hit => {
    const dist = Math.hypot(hit.latitude - latitude, hit.longitude - longitude);
    if (dist < bestDist) {
      best = hit;
      bestDist = dist;
    }
  });
  return best;
};
