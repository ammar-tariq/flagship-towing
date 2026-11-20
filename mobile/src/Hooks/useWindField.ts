import {useCallback, useRef, useState} from 'react';
import {devLog} from '@Utils/devLog';
import {
  fetchWindField,
  type WindFieldBbox,
  type WindFieldResponse,
} from '@Utils/weatherApi';
import {nearestHourIndex} from '@Utils/windMap';

const bboxKey = (bbox: WindFieldBbox) =>
  `${bbox.minLat.toFixed(2)}:${bbox.minLon.toFixed(2)}:${bbox.maxLat.toFixed(2)}:${bbox.maxLon.toFixed(2)}`;

export const useWindField = () => {
  const [field, setField] = useState<WindFieldResponse | null>(null);
  const [hourIndex, setHourIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastKeyRef = useRef('');
  const requestIdRef = useRef(0);
  const hourIsoRef = useRef<string | null>(null);
  const lastBboxRef = useRef<WindFieldBbox | null>(null);
  const hasFieldRef = useRef(false);

  const load = useCallback(async (bbox: WindFieldBbox, force = false) => {
    const key = bboxKey(bbox);
    if (!force && key === lastKeyRef.current) {
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    lastKeyRef.current = key;
    lastBboxRef.current = bbox;
    if (!hasFieldRef.current) {
      setIsLoading(true);
    }

    try {
      const data = await fetchWindField(bbox);
      if (requestId !== requestIdRef.current) {
        return;
      }
      const preferredIso = hourIsoRef.current;
      const nextIndex =
        preferredIso && data.hours.includes(preferredIso)
          ? data.hours.indexOf(preferredIso)
          : nearestHourIndex(data.hours);
      setField(data);
      hasFieldRef.current = true;
      setHourIndex(nextIndex);
      hourIsoRef.current = data.hours[nextIndex] ?? null;
      setError(null);
    } catch (caught) {
      if (requestId !== requestIdRef.current) {
        return;
      }
      lastKeyRef.current = '';
      const message =
        caught instanceof Error
          ? caught.message
          : 'Unable to load wind map. Try again.';
      setError(message);
      devLog('useWindField error ======>' + caught);
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const selectHour = useCallback(
    (nextIndex: number) => {
      setHourIndex(nextIndex);
      hourIsoRef.current = field?.hours[nextIndex] ?? hourIsoRef.current;
    },
    [field?.hours],
  );

  const reload = useCallback(() => {
    if (lastBboxRef.current) {
      load(lastBboxRef.current, true);
    }
  }, [load]);

  return {
    field,
    hourIndex,
    setHourIndex: selectHour,
    isLoading,
    error,
    load,
    reload,
  };
};
