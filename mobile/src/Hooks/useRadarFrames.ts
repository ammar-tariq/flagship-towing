import {useCallback, useRef, useState} from 'react';
import {devLog} from '@Utils/devLog';
import {
  fetchRadarFrames,
  type RadarFramesResponse,
} from '@Utils/weatherApi';

export const useRadarFrames = () => {
  const [data, setData] = useState<RadarFramesResponse | null>(null);
  const [frameIndex, setFrameIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const frameTimeRef = useRef<number | null>(null);
  const hasDataRef = useRef(false);

  const load = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    if (!hasDataRef.current) {
      setIsLoading(true);
    }

    try {
      const next = await fetchRadarFrames();
      if (requestId !== requestIdRef.current) {
        return;
      }
      const preferredTime = frameTimeRef.current;
      const preferredIndex =
        preferredTime != null
          ? next.frames.findIndex(frame => frame.time === preferredTime)
          : -1;
      const nextIndex = preferredIndex >= 0 ? preferredIndex : next.nowIndex;
      setData(next);
      hasDataRef.current = true;
      setFrameIndex(nextIndex);
      frameTimeRef.current = next.frames[nextIndex]?.time ?? preferredTime;
      setError(null);
    } catch (caught) {
      if (requestId !== requestIdRef.current) {
        return;
      }
      const message =
        caught instanceof Error
          ? caught.message
          : 'Unable to load radar. Try again.';
      setError(message);
      devLog('useRadarFrames error ======>' + caught);
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const selectFrame = useCallback(
    (nextIndex: number) => {
      setFrameIndex(nextIndex);
      frameTimeRef.current = data?.frames[nextIndex]?.time ?? frameTimeRef.current;
    },
    [data?.frames],
  );

  const reload = useCallback(() => {
    load();
  }, [load]);

  return {
    data,
    frameIndex,
    setFrameIndex: selectFrame,
    isLoading,
    error,
    load,
    reload,
  };
};
