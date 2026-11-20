import {deviceTier} from '@Lib/deviceTier';
import {
  RADAR_CROSSFADE_MS,
  RADAR_OPACITY,
  RADAR_TILE_SIZE,
} from '@Utils/radarMap';
import React, {memo, useEffect, useRef, useState} from 'react';
import {UrlTile} from 'react-native-maps';

export type RadarTile = {
  key: string;
  url: string;
};

type Slot = {
  key: string;
  url: string;
  opacity: number;
  zIndex: number;
};

type Props = {
  tiles: RadarTile[];
  activeIndex: number;
  maxzoom: number;
  /** Changes when the product (rain / snow / satellite) changes. */
  layerKey: string;
};

const JUMP_MS = 110;
const TIER = deviceTier();
const CAN_CROSSFADE = TIER !== 'low';
const CAN_PREFETCH = TIER === 'high';

const uniqueSlots = (next: Slot[]): Slot[] => {
  const seen = new Set<string>();
  return next.filter(slot => {
    if (seen.has(slot.key)) {
      return false;
    }
    seen.add(slot.key);
    return true;
  });
};

/**
 * Dual-buffer radar tiles.
 *
 * A single UrlTile whose `urlTemplate` changes rebuilds the native tile layer
 * and pops to the next frame. Keeping the previous layer mounted and fading
 * the incoming one on top hides that rebuild, and a hidden prefetch layer
 * lets Google Maps start fetching the next frame during playback.
 *
 * Opacity updates stay inside this component so playback does not re-render
 * the rest of the radar screen.
 */
const RadarTileOverlay = memo(function RadarTileOverlay({
  tiles,
  activeIndex,
  maxzoom,
  layerKey,
}: Props) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const tilesRef = useRef(tiles);
  const shownIndexRef = useRef(-1);
  const layerRef = useRef(layerKey);
  const lastChangeRef = useRef(0);
  const activeKey = tiles[activeIndex]?.key;

  tilesRef.current = tiles;

  useEffect(() => {
    const list = tilesRef.current;
    const incoming = list[activeIndex];
    if (!incoming) {
      shownIndexRef.current = -1;
      setSlots([]);
      return;
    }

    const now = Date.now();
    const layerChanged = layerRef.current !== layerKey;
    layerRef.current = layerKey;
    const previousIndex = shownIndexRef.current;
    const rapid = now - lastChangeRef.current < JUMP_MS;
    lastChangeRef.current = now;
    shownIndexRef.current = activeIndex;

    const prefetchTile =
      CAN_PREFETCH && list.length > 1
        ? list[(activeIndex + 1) % list.length]
        : undefined;
    const prefetch =
      prefetchTile && prefetchTile.key !== incoming.key
        ? {
            key: prefetchTile.key,
            url: prefetchTile.url,
            opacity: 0,
            zIndex: 1,
          }
        : null;

    const jump =
      layerChanged ||
      !CAN_CROSSFADE ||
      previousIndex < 0 ||
      rapid ||
      previousIndex === activeIndex;

    let fadeIn: ReturnType<typeof setTimeout> | undefined;
    let fadeFull: ReturnType<typeof setTimeout> | undefined;
    let settle: ReturnType<typeof setTimeout> | undefined;

    if (jump) {
      setSlots(
        uniqueSlots([
          {
            key: incoming.key,
            url: incoming.url,
            opacity: RADAR_OPACITY,
            zIndex: 3,
          },
          ...(prefetch ? [prefetch] : []),
        ]),
      );
    } else {
      const outgoingTile = list[previousIndex];
      const outgoing =
        outgoingTile && outgoingTile.key !== incoming.key
          ? {
              key: outgoingTile.key,
              url: outgoingTile.url,
              opacity: RADAR_OPACITY,
              zIndex: 2,
            }
          : null;

      setSlots(
        uniqueSlots([
          ...(outgoing ? [outgoing] : []),
          {
            key: incoming.key,
            url: incoming.url,
            opacity: 0,
            zIndex: 3,
          },
          ...(prefetch ? [prefetch] : []),
        ]),
      );

      fadeIn = setTimeout(() => {
        setSlots(current =>
          current.map(slot =>
            slot.key === incoming.key
              ? {...slot, opacity: RADAR_OPACITY * 0.55, zIndex: 3}
              : slot,
          ),
        );
      }, 20);

      fadeFull = setTimeout(() => {
        setSlots(current =>
          current.map(slot =>
            slot.key === incoming.key
              ? {...slot, opacity: RADAR_OPACITY, zIndex: 3}
              : slot,
          ),
        );
      }, 140);

      settle = setTimeout(() => {
        setSlots(
          uniqueSlots([
            {
              key: incoming.key,
              url: incoming.url,
              opacity: RADAR_OPACITY,
              zIndex: 3,
            },
            ...(prefetch ? [prefetch] : []),
          ]),
        );
      }, RADAR_CROSSFADE_MS);
    }

    return () => {
      if (fadeIn) {
        clearTimeout(fadeIn);
      }
      if (fadeFull) {
        clearTimeout(fadeFull);
      }
      if (settle) {
        clearTimeout(settle);
      }
    };
  }, [activeIndex, activeKey, layerKey, tiles.length]);

  if (!slots.length) {
    return null;
  }

  return (
    <>
      {slots.map(slot => (
        <UrlTile
          key={slot.key}
          urlTemplate={slot.url}
          opacity={slot.opacity}
          maximumNativeZ={maxzoom}
          maximumZ={maxzoom}
          tileSize={RADAR_TILE_SIZE}
          zIndex={slot.zIndex}
        />
      ))}
    </>
  );
});

export default RadarTileOverlay;
