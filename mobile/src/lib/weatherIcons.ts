import {ImageSourcePropType} from 'react-native';
import {images} from '@Assets/Images';

/** NWS icon codes from https://github.com/weather-gov/weather.gov/blob/main/docs/icons.md */
export type WeatherIconKey =
  | 'skc'
  | 'few'
  | 'sct'
  | 'bkn'
  | 'ovc'
  | 'wind_skc'
  | 'wind_few'
  | 'wind_sct'
  | 'wind_bkn'
  | 'wind_ovc'
  | 'snow'
  | 'rain_snow'
  | 'rain_sleet'
  | 'snow_sleet'
  | 'fzra'
  | 'rain_fzra'
  | 'snow_fzra'
  | 'sleet'
  | 'rain'
  | 'rain_showers'
  | 'rain_showers_hi'
  | 'tsra'
  | 'tsra_sct'
  | 'tsra_hi'
  | 'tornado'
  | 'hurricane'
  | 'tropical_storm'
  | 'dust'
  | 'smoke'
  | 'haze'
  | 'hot'
  | 'cold'
  | 'blizzard'
  | 'fog';

export type WeatherIconPeriod = 'day' | 'night';

const NWS_CODES: WeatherIconKey[] = [
  'skc',
  'few',
  'sct',
  'bkn',
  'ovc',
  'wind_skc',
  'wind_few',
  'wind_sct',
  'wind_bkn',
  'wind_ovc',
  'snow',
  'rain_snow',
  'rain_sleet',
  'snow_sleet',
  'fzra',
  'rain_fzra',
  'snow_fzra',
  'sleet',
  'rain',
  'rain_showers',
  'rain_showers_hi',
  'tsra',
  'tsra_sct',
  'tsra_hi',
  'tornado',
  'hurricane',
  'tropical_storm',
  'dust',
  'smoke',
  'haze',
  'hot',
  'cold',
  'blizzard',
  'fog',
];

const NWS_CODE_SET = new Set<string>(NWS_CODES);

const FORECAST_TEXT_RULES: Array<{pattern: RegExp; icon: WeatherIconKey}> = [
  {
    pattern: /tornado/i,
    icon: 'tornado',
  },
  {
    pattern: /hurricane/i,
    icon: 'hurricane',
  },
  {
    pattern: /tropical storm/i,
    icon: 'tropical_storm',
  },
  {
    pattern: /blizzard/i,
    icon: 'blizzard',
  },
  {
    pattern: /thunder|t-storm/i,
    icon: 'tsra',
  },
  {
    pattern: /freezing rain.*snow|snow.*freezing rain/i,
    icon: 'snow_fzra',
  },
  {
    pattern: /rain.*freezing rain|freezing rain.*rain/i,
    icon: 'rain_fzra',
  },
  {
    pattern: /freezing rain|freezing drizzle/i,
    icon: 'fzra',
  },
  {
    pattern: /rain.*sleet|sleet.*rain/i,
    icon: 'rain_sleet',
  },
  {
    pattern: /snow.*sleet|sleet.*snow/i,
    icon: 'snow_sleet',
  },
  {
    pattern: /rain.*snow|snow.*rain|wintry mix/i,
    icon: 'rain_snow',
  },
  {
    pattern: /sleet|ice pellets/i,
    icon: 'sleet',
  },
  {
    pattern: /snow|flurries/i,
    icon: 'snow',
  },
  {
    pattern: /rain shower/i,
    icon: 'rain_showers',
  },
  {
    pattern: /rain|shower|drizzle/i,
    icon: 'rain',
  },
  {
    pattern: /fog|mist/i,
    icon: 'fog',
  },
  {
    pattern: /haze/i,
    icon: 'haze',
  },
  {
    pattern: /smoke/i,
    icon: 'smoke',
  },
  {
    pattern: /dust|sand/i,
    icon: 'dust',
  },
  {
    pattern: /hot/i,
    icon: 'hot',
  },
  {
    pattern: /cold/i,
    icon: 'cold',
  },
  {
    pattern: /windy|breezy|blustery/i,
    icon: 'wind_skc',
  },
  {
    pattern: /overcast/i,
    icon: 'ovc',
  },
  {
    pattern: /mostly cloudy|considerable cloudiness/i,
    icon: 'bkn',
  },
  {
    pattern: /partly (cloudy|sunny)|mostly sunny/i,
    icon: 'sct',
  },
  {
    pattern: /mostly clear|few clouds/i,
    icon: 'few',
  },
  {
    pattern: /clear|sunny|fair/i,
    icon: 'skc',
  },
];

const extractNwsIconPath = (
  iconUrl?: string | null,
): {period: WeatherIconPeriod; codes: string[]} => {
  if (!iconUrl) {
    return {period: 'day', codes: []};
  }

  try {
    const path = iconUrl.split('?')[0] ?? '';
    const match = path.match(/\/(?:land|marine)\/(day|night)\/(.+)$/i);
    if (!match?.[2]) {
      return {period: 'day', codes: []};
    }

    const period: WeatherIconPeriod =
      match[1].toLowerCase() === 'night' ? 'night' : 'day';

    const codes = match[2]
      .split('/')
      .flatMap(segment => segment.split(','))
      .map(token => token.trim().toLowerCase())
      .filter(token => token.length > 0 && !/^\d+$/.test(token));

    return {period, codes};
  } catch {
    return {period: 'day', codes: []};
  }
};

const iconFromNwsCodes = (codes: string[]): WeatherIconKey | null => {
  for (const code of codes) {
    if (NWS_CODE_SET.has(code)) {
      return code as WeatherIconKey;
    }
  }
  return null;
};

const iconFromForecastText = (
  shortForecast?: string | null,
): WeatherIconKey | null => {
  if (!shortForecast) {
    return null;
  }

  const lower = shortForecast.toLowerCase();
  if (/mostly cloudy|considerable cloudiness/.test(lower)) {
    return 'bkn';
  }
  if (/partly (cloudy|sunny)|mostly sunny/.test(lower)) {
    return 'sct';
  }
  if (/overcast/.test(lower)) {
    return 'ovc';
  }
  if (/\bcloudy\b/.test(lower) && !/mostly|partly/.test(lower)) {
    return 'ovc';
  }

  for (const rule of FORECAST_TEXT_RULES) {
    if (rule.pattern.test(shortForecast)) {
      return rule.icon;
    }
  }

  return null;
};

export const resolveWeatherIconKey = (
  shortForecast?: string | null,
  iconUrl?: string | null,
): WeatherIconKey => {
  const {codes} = extractNwsIconPath(iconUrl);
  const fromCodes = iconFromNwsCodes(codes);
  if (fromCodes) {
    return fromCodes;
  }

  const fromText = iconFromForecastText(shortForecast);
  if (fromText) {
    return fromText;
  }

  return 'sct';
};

export const resolveWeatherIconPeriod = (
  iconUrl?: string | null,
  isDaytime?: boolean | null,
): WeatherIconPeriod => {
  if (typeof isDaytime === 'boolean') {
    return isDaytime ? 'day' : 'night';
  }

  return extractNwsIconPath(iconUrl).period;
};

export const getWeatherIconSource = (
  key?: WeatherIconKey | null,
  period: WeatherIconPeriod = 'day',
): ImageSourcePropType => {
  const code = key ?? 'sct';
  const set = period === 'night' ? images.weather.night : images.weather.day;
  return set[code] ?? set.sct ?? images.weather.day.sct;
};
