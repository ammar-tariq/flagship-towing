import type {RadarFrame} from '@Utils/weatherApi';

export const RADAR_OPACITY = 0.78;
export const RADAR_MAXZOOM = 7;
export const RADAR_TILE_SIZE = 256;
export const PLAY_FRAME_MS = 720;
/** Incoming frame fades up over this window while the previous frame stays put. */
export const RADAR_CROSSFADE_MS = 300;

export type RadarLayerId = 'precip' | 'snow' | 'satellite';

export type RadarLayer = {
  id: RadarLayerId;
  label: string;
  hint: string;
  legendTitle: string;
  legendStops: string[];
  legendColors: string[];
  colorScheme: number;
  options: string;
  product: 'radar' | 'satellite';
};

/** NEXRAD reflectivity — rain and storms. */
const PRECIP_COLORS = [
  '#00ECEC',
  '#01A0F6',
  '#00FF00',
  '#00C800',
  '#FFFF00',
  '#FF9000',
  '#FF0000',
  '#D60000',
  '#FF00F0',
  '#AD90F0',
];

/** Same radar with snow drawn in pinks/purples. */
const SNOW_COLORS = [
  '#00ECEC',
  '#00FF00',
  '#FFFF00',
  '#FF9000',
  '#FF0000',
  '#FF6EC7',
  '#C44DFF',
  '#AD90F0',
];

/** Infrared cloud tops, cold (white) to warmer (dark). */
const SATELLITE_COLORS = [
  '#F4F7FF',
  '#C5D4F5',
  '#7B8FD4',
  '#5B3FA0',
  '#2A1B4A',
];

export const RADAR_LAYERS: RadarLayer[] = [
  {
    id: 'precip',
    label: 'Rain',
    hint: 'Precipitation intensity',
    legendTitle: 'Rain',
    legendStops: ['Light', '20', '35', '50', 'Heavy'],
    legendColors: PRECIP_COLORS,
    colorScheme: 6,
    options: '1_0',
    product: 'radar',
  },
  {
    id: 'snow',
    label: 'Snow',
    hint: 'Snow in separate colors',
    legendTitle: 'Rain & snow',
    legendStops: ['Rain', 'Mix', 'Snow', 'Heavy'],
    legendColors: SNOW_COLORS,
    colorScheme: 6,
    options: '1_1',
    product: 'radar',
  },
  {
    id: 'satellite',
    label: 'Satellite',
    hint: 'Infrared cloud tops',
    legendTitle: 'Satellite IR',
    legendStops: ['Cold', '-40', '-20', '0', 'Warm'],
    legendColors: SATELLITE_COLORS,
    colorScheme: 0,
    options: '0_0',
    product: 'satellite',
  },
];

export const DEFAULT_RADAR_LAYER: RadarLayerId = 'precip';

export const getRadarLayer = (id: RadarLayerId): RadarLayer =>
  RADAR_LAYERS.find(layer => layer.id === id) ?? RADAR_LAYERS[0];

export const buildRadarLayerTileUrl = (
  host: string,
  path: string,
  layer: RadarLayer,
  tileSize = RADAR_TILE_SIZE,
) =>
  `${host.replace(/\/$/, '')}${path}/${tileSize}/{z}/{x}/{y}/${layer.colorScheme}/${layer.options}.png`;

/** @deprecated Use layer legend colors. */
export const RADAR_LEGEND_COLORS = PRECIP_COLORS;
/** @deprecated Use layer legend stops. */
export const RADAR_LEGEND_STOPS = ['Light', '20', '35', '50', 'Heavy'];

const ordinal = (value: number) => {
  const remainder = value % 100;
  if (remainder >= 11 && remainder <= 13) {
    return `${value}th`;
  }
  switch (value % 10) {
    case 1:
      return `${value}st`;
    case 2:
      return `${value}nd`;
    case 3:
      return `${value}rd`;
    default:
      return `${value}th`;
  }
};

export const formatRadarFrameLabel = (
  frame: RadarFrame | undefined,
  isNow: boolean,
): string => {
  if (!frame) {
    return '';
  }
  const date = new Date(frame.iso || frame.time * 1000);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const weekday = date.toLocaleDateString('en-US', {weekday: 'long'});
  const day = date.getDate();
  const time = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  if (frame.kind === 'nowcast') {
    return `Forecast · ${time}`;
  }
  if (isNow) {
    return `Now · ${time}`;
  }
  return `${weekday} the ${ordinal(day)} - ${time}`;
};
