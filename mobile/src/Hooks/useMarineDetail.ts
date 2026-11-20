import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import dayjs from 'dayjs';
import {devLog} from '@Utils/devLog';
import {
  findNearestCoastalServiceArea,
  findNearestServiceArea,
  getServiceAreaById,
  SERVICE_AREAS,
  serviceAreaSupportsTides,
  type ServiceArea,
} from '@Utils/serviceAreas';
import {
  fetchWeatherForecastDays,
  fetchWeatherTides,
} from '@Utils/weatherApi';
import type {WeatherIconKey, WeatherIconPeriod} from '@Utils/weatherIcons';
import {WeatherUpdateData} from '@Hooks/useWeatherUpdate';

export type MarineDayForecast = {
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

export type TideChartPoint = {
  timestamp: number;
  height: number;
  label: string;
};

export type TideMarker = {
  type: 'H' | 'L';
  timestamp: number;
  height: number;
};

export type MarineTideDetail = {
  serviceAreaId: string;
  serviceAreaName: string;
  stationId: string;
  dayStartTimestamp?: number;
  dayEndTimestamp?: number;
  chartLow: number;
  chartHigh: number;
  chartPoints: TideChartPoint[];
  markers: TideMarker[];
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

type MarineDetailState = {
  days: MarineDayForecast[];
  tides: MarineTideDetail | null;
  isLoading: boolean;
  isTidesLoading: boolean;
};

const SEVEN_DAY_COUNT = 7;
const WEEKDAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const shiftYmd = (ymd: string, days: number) => {
  const [year, month, day] = ymd.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days))
    .toISOString()
    .slice(0, 10);
};

const weekdayLabelForYmd = (ymd: string) => {
  const [year, month, day] = ymd.split('-').map(Number);
  return WEEKDAY_LABELS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
};

const dateNumForYmd = (ymd: string) => Number(ymd.slice(-2));

const getSevenDayKeys = (): string[] => {
  const today = dayjs().format('YYYY-MM-DD');
  return Array.from({length: SEVEN_DAY_COUNT}, (_, index) =>
    shiftYmd(today, index),
  );
};

const createEmptyDayForecast = (
  dateKey: string,
  index: number,
): MarineDayForecast => ({
  key: dateKey,
  dayLabel: index === 0 ? 'TODAY' : weekdayLabelForYmd(dateKey),
  dateNum: dateNumForYmd(dateKey),
  temp: null,
  tempHigh: null,
  tempLow: null,
  precipPercent: null,
  windDirection: '-',
  windSpeed: '-',
  gust: '-',
  visibility: '-',
  pressure: '-',
  wave: '-',
  period: '-',
  weatherIconKey: 'sct',
  weatherIconPeriod: 'day',
});

const normalizeDay = (
  day: MarineDayForecast,
  index: number,
): MarineDayForecast => ({
  ...day,
  wave: day.wave ?? '-',
  period: day.period ?? '-',
  dayLabel: index === 0 ? 'TODAY' : weekdayLabelForYmd(day.key),
  dateNum: dateNumForYmd(day.key),
});

const ensureSevenDays = (days: MarineDayForecast[]): MarineDayForecast[] => {
  const byKey = new Map(days.map(day => [day.key, day]));
  return getSevenDayKeys().map((key, index) => {
    const existing = byKey.get(key);
    return existing
      ? normalizeDay(existing, index)
      : createEmptyDayForecast(key, index);
  });
};

const buildDaysFromSummary = (
  summary?: WeatherUpdateData,
): MarineDayForecast[] => {
  if (!summary?.address) {
    return [];
  }

  const today = dayjs();
  const tempMatch = summary.temperature.match(/(\d+)/);
  const windMatch = summary.windLabel.match(/^([A-Za-z]{1,2})-\s*(\d+)/);

  return ensureSevenDays([
    {
      key: today.format('YYYY-MM-DD'),
      dayLabel: 'TODAY',
      dateNum: today.date(),
      temp: tempMatch ? parseInt(tempMatch[1], 10) : null,
      tempHigh: tempMatch ? parseInt(tempMatch[1], 10) : null,
      tempLow: null,
      precipPercent: null,
      windDirection: windMatch?.[1]?.toUpperCase() ?? '-',
      windSpeed: windMatch?.[2] ? `${windMatch[2]} mph` : summary.windLabel,
      gust: summary.gust,
      visibility: '-',
      pressure: '-',
      wave: summary.wave ?? '-',
      period: summary.period ?? '-',
      weatherIconKey: summary.weatherIconKey,
      weatherIconPeriod: summary.weatherIconPeriod,
    },
  ]);
};

const mergeSummaryIntoDays = (
  days: MarineDayForecast[],
  summaryDays: MarineDayForecast[],
) => {
  if (!summaryDays.length) {
    return days;
  }

  if (!days.length) {
    return ensureSevenDays(summaryDays);
  }

  const summaryToday = summaryDays[0];
  const mergedDays = [...days];

  mergedDays[0] = {
    ...mergedDays[0],
    gust:
      mergedDays[0].gust === '-'
        ? summaryToday.gust
        : mergedDays[0].gust,
    wave:
      mergedDays[0].wave === '-'
        ? summaryToday.wave
        : mergedDays[0].wave,
    period:
      mergedDays[0].period === '-'
        ? summaryToday.period
        : mergedDays[0].period,
    weatherIconKey:
      mergedDays[0].weatherIconKey ?? summaryToday.weatherIconKey,
    weatherIconPeriod:
      mergedDays[0].weatherIconPeriod ??
      summaryToday.weatherIconPeriod,
    temp: mergedDays[0].temp ?? summaryToday.temp,
    windDirection:
      mergedDays[0].windDirection === '-'
        ? summaryToday.windDirection
        : mergedDays[0].windDirection,
    windSpeed:
      mergedDays[0].windSpeed === '-'
        ? summaryToday.windSpeed
        : mergedDays[0].windSpeed,
  };

  return ensureSevenDays(mergedDays);
};

const resolveInitialServiceArea = (
  latitude?: number,
  longitude?: number,
  summary?: WeatherUpdateData,
): ServiceArea | null => {
  if (summary?.serviceAreaId) {
    const fromSummary = getServiceAreaById(summary.serviceAreaId);
    if (fromSummary && serviceAreaSupportsTides(fromSummary)) {
      return fromSummary;
    }
  }

  if (latitude != null && longitude != null) {
    const nearest = findNearestServiceArea(latitude, longitude);
    if (serviceAreaSupportsTides(nearest)) {
      return nearest;
    }
    return findNearestCoastalServiceArea(latitude, longitude) ?? nearest;
  }

  return null;
};

export const useMarineDetail = (
  latitude?: number,
  longitude?: number,
  summary?: WeatherUpdateData,
) => {
  const summaryDays = useMemo(
    () => buildDaysFromSummary(summary),
    [
      summary?.address,
      summary?.temperature,
      summary?.windLabel,
      summary?.gust,
      summary?.wave,
      summary?.period,
      summary?.lowTide,
      summary?.highTide,
      summary?.weatherIconKey,
      summary?.weatherIconPeriod,
      summary?.windDirectionDeg,
    ],
  );

  const [selectedServiceAreaId, setSelectedServiceAreaId] = useState<
    string | null
  >(() => resolveInitialServiceArea(latitude, longitude, summary)?.id ?? null);

  const selectedServiceArea = useMemo(
    () =>
      selectedServiceAreaId
        ? getServiceAreaById(selectedServiceAreaId)
        : null,
    [selectedServiceAreaId],
  );

  const [weatherCoords, setWeatherCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(() =>
    latitude != null && longitude != null ? {latitude, longitude} : null,
  );

  const [weatherLocationLabel, setWeatherLocationLabel] = useState(
    summary?.address?.trim() || 'Select location',
  );

  const [state, setState] = useState<MarineDetailState>(() => ({
    days: summaryDays,
    tides: null,
    isLoading: true,
    isTidesLoading: true,
  }));

  const tideRequestIdRef = useRef(0);
  const weatherRequestIdRef = useRef(0);

  useEffect(() => {
    const initial = resolveInitialServiceArea(latitude, longitude, summary);
    if (!initial) {
      return;
    }
    setSelectedServiceAreaId(prev => prev ?? initial.id);
  }, [latitude, longitude, summary?.serviceAreaId]);

  useEffect(() => {
    if (weatherCoords != null) {
      return;
    }
    if (latitude != null && longitude != null) {
      setWeatherCoords({latitude, longitude});
    }
  }, [latitude, longitude, weatherCoords]);

  const loadWeatherDays = useCallback(async () => {
    const requestId = ++weatherRequestIdRef.current;
    const weatherLatitude = weatherCoords?.latitude;
    const weatherLongitude = weatherCoords?.longitude;

    if (weatherLatitude == null || weatherLongitude == null) {
      if (requestId === weatherRequestIdRef.current) {
        setState(prev => ({
          ...prev,
          days: summaryDays,
          isLoading: false,
        }));
      }
      return;
    }

    setState(prev => ({
      ...prev,
      days: prev.days.length ? prev.days : summaryDays,
      isLoading: true,
    }));

    try {
      const fetchedDays = await fetchWeatherForecastDays(
        weatherLatitude,
        weatherLongitude,
      );
      if (requestId !== weatherRequestIdRef.current) {
        return;
      }

      const usingGpsCoords =
        latitude != null &&
        longitude != null &&
        weatherLatitude === latitude &&
        weatherLongitude === longitude;
      const mergedDays = usingGpsCoords
        ? mergeSummaryIntoDays(ensureSevenDays(fetchedDays), summaryDays)
        : ensureSevenDays(fetchedDays);

      setState(prev => ({
        ...prev,
        days: mergedDays,
        isLoading: false,
      }));
    } catch (error) {
      if (requestId !== weatherRequestIdRef.current) {
        return;
      }
      devLog('Marine detail weather error ======>' + error);
      setState(prev => ({
        ...prev,
        days: prev.days.length ? prev.days : summaryDays,
        isLoading: false,
      }));
    }
  }, [latitude, longitude, summaryDays, weatherCoords]);

  const loadTidesForArea = useCallback(async (area: ServiceArea | null) => {
    const requestId = ++tideRequestIdRef.current;

    if (!area) {
      if (requestId === tideRequestIdRef.current) {
        setState(prev => ({
          ...prev,
          tides: null,
          isTidesLoading: false,
        }));
      }
      return;
    }

    // Keep previous tides visible while refetching to avoid empty→pop flash.
    setState(prev => ({
      ...prev,
      isTidesLoading: true,
    }));

    try {
      const tides = await fetchWeatherTides(area.id);
      if (requestId !== tideRequestIdRef.current) {
        return;
      }
      setState(prev => ({
        ...prev,
        tides,
        isTidesLoading: false,
      }));
    } catch (error) {
      if (requestId !== tideRequestIdRef.current) {
        return;
      }
      devLog('Marine detail tides error ======>' + error);
      setState(prev => ({
        ...prev,
        tides: null,
        isTidesLoading: false,
      }));
    }
  }, []);

  useEffect(() => {
    loadWeatherDays();
  }, [loadWeatherDays]);

  useEffect(() => {
    loadTidesForArea(selectedServiceArea);
  }, [loadTidesForArea, selectedServiceArea]);

  const selectServiceArea = useCallback((areaId: string) => {
    setSelectedServiceAreaId(areaId);
  }, []);

  const selectWeatherLocation = useCallback(
    (
      next: {
        latitude: number;
        longitude: number;
        label?: string;
      },
    ) => {
      setWeatherCoords({
        latitude: next.latitude,
        longitude: next.longitude,
      });
      if (next.label?.trim()) {
        setWeatherLocationLabel(next.label.trim());
      }
    },
    [],
  );

  return {
    ...state,
    serviceAreas: SERVICE_AREAS,
    selectedServiceArea,
    selectServiceArea,
    weatherLocationLabel,
    selectWeatherLocation,
  };
};
