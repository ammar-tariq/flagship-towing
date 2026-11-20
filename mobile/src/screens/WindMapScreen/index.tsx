import AppText from '@Components/AppText';
import PressableScale from '@Components/PressableScale';
import WeatherGoogleMap from '@Components/WeatherGoogleMap';
import WindParticleLayer, {
  type WindParticleLayerHandle,
} from '@Components/WindParticleLayer';
import {useWindField} from '@Hooks/useWindField';
import {useDeviceLocation} from '@Hooks/useDeviceLocation';
import {
  bboxAroundLngLat,
  bboxFromRegion,
  defaultWeatherCamera,
  WEATHER_MAP_PADDING,
  weatherCameraAt,
  zoomLock,
  zoomToFitSpan,
} from '@Lib/configs/weatherMap';
import {DEFAULT_WIND_CENTER} from '@Lib/configs/mapLibre';
import {deviceTier} from '@Lib/deviceTier';
import {
  isLocationGranted,
  permissionMessage,
} from '@Lib/locationPermission';
import {useIsFocused} from '@react-navigation/native';
import {colors} from '@Utils/color';
import {font, heightPixel, widthPixel} from '@Utils/helpers';
import {
  buildWindEngineField,
  buildWindHits,
  formatWindHourLabel,
  fromDirectionArrow,
  interpolatePointWind,
  nearestWindHit,
  WIND_LEGEND_COLORS,
  WIND_LEGEND_STOPS,
} from '@Utils/windMap';
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Dimensions,
  PanResponder,
  StyleSheet,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import MapView, {
  Marker,
  type MapPressEvent,
  type Region,
} from 'react-native-maps';

type SelectedWind = {
  lng: number;
  lat: number;
  pointIndex: number;
  speedMph: number;
  fromDeg: number;
  abbrev: string;
};

const PLAY_STEP_MS = 800;
const SCRUB_STEP_MS = 280;
const REGION_DEBOUNCE_MS = 700;
const DEVICE_TIER = deviceTier();
const WASH_ALPHA =
  DEVICE_TIER === 'low' ? 0.36 : DEVICE_TIER === 'medium' ? 0.42 : 0.46;
const VIEW_PAD = 0.4;
const COVER_MARGIN = 0.12;
const DEFAULT_SPAN_DEG = 2.4;
/** Matches the wind grid limits in the backend. Outside this, the field is not returned. */
const WIND_MIN_SPAN_DEG = 0.6;
const WIND_MAX_SPAN_DEG = 18;
/** Extra first-open zoom so the field fills the map instead of sitting in a small box. */
const START_ZOOM_IN = 0.55;

type ViewBbox = {
  minLat: number;
  minLon: number;
  maxLat: number;
  maxLon: number;
};

const expandBbox = (bbox: ViewBbox, pad = VIEW_PAD): ViewBbox => {
  const latSpan = Math.max(bbox.maxLat - bbox.minLat, 0.4);
  const lonSpan = Math.max(bbox.maxLon - bbox.minLon, 0.4);
  return {
    minLat: bbox.minLat - latSpan * pad,
    minLon: bbox.minLon - lonSpan * pad,
    maxLat: bbox.maxLat + latSpan * pad,
    maxLon: bbox.maxLon + lonSpan * pad,
  };
};

const fieldExtent = (
  field: {points: Array<{lat: number; lon: number}>} | null,
): ViewBbox | null => {
  if (!field?.points.length) {
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
  if (!Number.isFinite(minLat)) {
    return null;
  }
  return {minLat, minLon, maxLat, maxLon};
};

const fieldCoversView = (extent: ViewBbox | null, visible: ViewBbox) => {
  if (!extent) {
    return false;
  }
  const latPad = Math.max((extent.maxLat - extent.minLat) * COVER_MARGIN, 0.05);
  const lonPad = Math.max((extent.maxLon - extent.minLon) * COVER_MARGIN, 0.05);
  return (
    visible.minLat >= extent.minLat + latPad &&
    visible.maxLat <= extent.maxLat - latPad &&
    visible.minLon >= extent.minLon + lonPad &&
    visible.maxLon <= extent.maxLon - lonPad
  );
};

const WindMapScreen = () => {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const mapRef = useRef<MapView>(null);
  const particlesRef = useRef<WindParticleLayerHandle>(null);
  const didCenterRef = useRef(false);
  const didFlyToUserRef = useRef(false);
  const didLoadFallbackRef = useRef(false);
  const regionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ignoreRegionRef = useRef(false);
  const hourIndexRef = useRef(0);
  const lastRegionRef = useRef<Region | null>(null);
  const hourTweenRef = useRef<{ms: number; ease: 'linear' | 'out'}>({
    ms: 0,
    ease: 'out',
  });

  const {field, hourIndex, setHourIndex, isLoading, error, load, reload} =
    useWindField();
  const fieldRef = useRef(field);
  if (fieldRef.current !== field) {
    hourTweenRef.current = {ms: 0, ease: 'out'};
    fieldRef.current = field;
  }
  const location = useDeviceLocation();
  const {requestAccess} = location;
  const [isPlaying, setIsPlaying] = useState(false);
  const [selected, setSelected] = useState<SelectedWind | null>(null);
  const [mapReady, setMapReady] = useState(false);

  hourIndexRef.current = hourIndex;

  const windZoom = useMemo(() => {
    const {width, height} = Dimensions.get('window');
    const mapHeight = Math.max(height * 0.62, 280);
    const latitude = DEFAULT_WIND_CENTER[1];
    const fit =
      zoomToFitSpan(DEFAULT_SPAN_DEG, width, mapHeight, latitude) +
      START_ZOOM_IN;
    const minZoom = zoomToFitSpan(
      WIND_MAX_SPAN_DEG,
      width,
      mapHeight,
      latitude,
    );
    const maxZoom = zoomToFitSpan(
      WIND_MIN_SPAN_DEG,
      width,
      mapHeight,
      latitude,
    );
    return zoomLock(minZoom, maxZoom, fit);
  }, []);
  const windZoomRef = useRef(windZoom);
  windZoomRef.current = windZoom;
  const windInitialCamera = useMemo(
    () => ({
      ...defaultWeatherCamera(),
      zoom: windZoom.initialZoom,
    }),
    // Applied once. Rebuilding it when insets settle would jump the camera.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const engineField = useMemo(() => buildWindEngineField(field), [field]);
  const hits = useMemo(() => buildWindHits(field, hourIndex), [field, hourIndex]);
  const hourTween = hourTweenRef.current;
  const mapPadding = useMemo(
    () => ({
      top: WEATHER_MAP_PADDING.top,
      right: 0,
      bottom: heightPixel(168) + insets.bottom,
      left: 0,
    }),
    [insets.bottom],
  );

  const hourCount = field?.hours.length ?? 0;
  const hourLabel = field?.hours[hourIndex]
    ? formatWindHourLabel(field.hours[hourIndex])
    : '';
  const permissionStatus = location.permissionStatus;
  const needsPermission = location.needsPermission;
  const permissionActionLabel =
    permissionStatus === 'blocked' ? 'Open Settings' : 'Enable Location';

  useEffect(() => {
    if (!mapReady || !lastRegionRef.current) {
      return;
    }
    particlesRef.current?.onRegionChangeComplete(lastRegionRef.current);
  }, [engineField, mapReady]);

  useEffect(() => {
    setSelected(prev => {
      if (!prev || !field) {
        return prev;
      }
      const next = interpolatePointWind(field, prev.pointIndex, hourIndex, 0);
      if (!next) {
        return null;
      }
      return {
        ...prev,
        speedMph: next.speedMph,
        fromDeg: next.fromDeg,
        abbrev: next.abbrev,
      };
    });
  }, [field, hourIndex]);

  const flyTo = useCallback(
    (lng: number, lat: number) => {
      ignoreRegionRef.current = true;
      mapRef.current?.animateCamera(
        weatherCameraAt(lng, lat, windZoomRef.current.initialZoom),
        {duration: 700},
      );
      load(bboxAroundLngLat(lng, lat, DEFAULT_SPAN_DEG));
      setTimeout(() => {
        ignoreRegionRef.current = false;
      }, 1100);
    },
    [load],
  );

  useEffect(() => {
    if (location.coords) {
      if (didFlyToUserRef.current) {
        return;
      }
      didFlyToUserRef.current = true;
      didCenterRef.current = true;
      flyTo(location.coords.longitude, location.coords.latitude);
      return;
    }
    if (!location.isReady) {
      return;
    }
    if (didLoadFallbackRef.current || didFlyToUserRef.current) {
      return;
    }
    didLoadFallbackRef.current = true;
    const [lng, lat] = DEFAULT_WIND_CENTER;
    load(bboxAroundLngLat(lng, lat, DEFAULT_SPAN_DEG));
  }, [flyTo, load, location.coords, location.isReady]);

  useEffect(() => {
    return () => {
      if (regionTimerRef.current) {
        clearTimeout(regionTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isFocused || !isPlaying || hourCount < 2) {
      return;
    }
    const timer = setInterval(() => {
      const current = hourIndexRef.current;
      const wrapping = current >= hourCount - 1;
      const next = wrapping ? 0 : current + 1;
      hourTweenRef.current = {
        ms: wrapping ? 0 : PLAY_STEP_MS,
        ease: 'linear',
      };
      hourIndexRef.current = next;
      setHourIndex(next);
    }, PLAY_STEP_MS);
    return () => clearInterval(timer);
  }, [hourCount, isFocused, isPlaying, setHourIndex]);

  const requestField = useCallback(
    (visible: ViewBbox, force = false) => {
      if (!force && fieldCoversView(fieldExtent(fieldRef.current), visible)) {
        return;
      }
      load(expandBbox(visible));
    },
    [load],
  );

  const loadFromRegion = useCallback(
    (region: Region, force = false) => {
      requestField(bboxFromRegion(region), force);
    },
    [requestField],
  );

  const handleRegionChangeStart = useCallback(() => {
    particlesRef.current?.onRegionChangeStart();
  }, []);

  const handleRegionChange = useCallback((region: Region) => {
    particlesRef.current?.onRegionChangeStart();
    particlesRef.current?.onRegionChange(region);
  }, []);

  const handleRegionChangeComplete = useCallback(
    (region: Region) => {
      lastRegionRef.current = region;
      particlesRef.current?.onRegionChangeComplete(region);
      if (ignoreRegionRef.current) {
        return;
      }
      if (regionTimerRef.current) {
        clearTimeout(regionTimerRef.current);
      }
      regionTimerRef.current = setTimeout(() => {
        loadFromRegion(region);
      }, REGION_DEBOUNCE_MS);
    },
    [loadFromRegion],
  );

  const handleMapReady = useCallback(async () => {
    setMapReady(true);
    try {
      const [camera, bounds] = await Promise.all([
        mapRef.current?.getCamera(),
        mapRef.current?.getMapBoundaries(),
      ]);
      if (camera && bounds) {
        const region = {
          latitude: camera.center.latitude,
          longitude: camera.center.longitude,
          latitudeDelta: Math.abs(
            bounds.northEast.latitude - bounds.southWest.latitude,
          ),
          longitudeDelta: Math.abs(
            bounds.northEast.longitude - bounds.southWest.longitude,
          ),
        };
        lastRegionRef.current = region;
        particlesRef.current?.onRegionChangeComplete(region);
      }
    } catch {
      // First camera query can fail if the native map is still attaching.
    }
    if (didFlyToUserRef.current || didLoadFallbackRef.current) {
      return;
    }
    try {
      const bounds = await mapRef.current?.getMapBoundaries();
      if (!bounds) {
        const [lng, lat] = DEFAULT_WIND_CENTER;
        requestField(bboxAroundLngLat(lng, lat, 4), true);
        return;
      }
      requestField(
        {
          minLat: bounds.southWest.latitude,
          minLon: bounds.southWest.longitude,
          maxLat: bounds.northEast.latitude,
          maxLon: bounds.northEast.longitude,
        },
        true,
      );
    } catch {
      const [lng, lat] = DEFAULT_WIND_CENTER;
      requestField(bboxAroundLngLat(lng, lat, 4), true);
    }
  }, [requestField]);

  const handleMapPress = useCallback(
    (event: MapPressEvent) => {
      const {latitude, longitude} = event.nativeEvent.coordinate;
      const hit = nearestWindHit(hits, latitude, longitude);
      if (!hit) {
        setSelected(null);
        return;
      }
      setIsPlaying(false);
      setSelected({
        lng: hit.longitude,
        lat: hit.latitude,
        pointIndex: hit.pointIndex,
        speedMph: hit.speedMph,
        fromDeg: hit.fromDeg,
        abbrev: hit.abbrev,
      });
    },
    [hits],
  );

  const handleScrub = useCallback(
    (nextIndex: number) => {
      setIsPlaying(false);
      const delta = Math.abs(nextIndex - hourIndexRef.current);
      hourTweenRef.current = {
        ms: delta <= 1 ? SCRUB_STEP_MS : 0,
        ease: 'out',
      };
      hourIndexRef.current = nextIndex;
      setHourIndex(nextIndex);
    },
    [setHourIndex],
  );

  const handleRecenter = useCallback(async () => {
    const next = await requestAccess();
    if (!next) {
      return;
    }
    didCenterRef.current = true;
    didFlyToUserRef.current = true;
    flyTo(next.longitude, next.latitude);
  }, [flyTo, requestAccess]);

  return (
    <View style={styles.screen}>
      <WeatherGoogleMap
        ref={mapRef}
        initialCamera={windInitialCamera}
        mapPadding={mapPadding}
        minZoomLevel={windZoom.minZoom}
        maxZoomLevel={windZoom.maxZoom}
        zoomEnabled={windZoom.zoomEnabled}
        zoomTapEnabled={windZoom.zoomEnabled}
        zoomControlEnabled={false}
        showsUserLocation={
          permissionStatus != null && isLocationGranted(permissionStatus)
        }
        onMapReady={handleMapReady}
        onRegionChangeStart={handleRegionChangeStart}
        onRegionChange={handleRegionChange}
        onRegionChangeComplete={handleRegionChangeComplete}
        onPress={handleMapPress}>
        {selected ? (
          <Marker
            coordinate={{latitude: selected.lat, longitude: selected.lng}}
            anchor={{x: 0.5, y: 1}}
            tracksViewChanges={false}
            zIndex={10}>
            <View style={styles.tooltipWrap} pointerEvents="none">
              <View style={styles.tooltip}>
                <AppText weight="regular" style={styles.tooltipWind}>
                  Wind
                </AppText>
                <View style={styles.tooltipRow}>
                  <AppText weight="bold" style={styles.tooltipValue}>
                    {Math.round(selected.speedMph)} mph
                  </AppText>
                  <AppText weight="semibold" style={styles.tooltipDir}>
                    {fromDirectionArrow(selected.fromDeg)} {selected.abbrev}
                  </AppText>
                </View>
              </View>
              <View style={styles.tooltipStem} />
              <View style={styles.tooltipDot} />
            </View>
          </Marker>
        ) : null}
      </WeatherGoogleMap>

      {mapReady && isFocused ? (
        <View
          style={styles.particleLayer}
          pointerEvents="none"
          collapsable={false}>
          <WindParticleLayer
            ref={particlesRef}
            mapRef={mapRef}
            field={engineField}
            hourIndex={hourIndex}
            hourTransitionMs={hourTween.ms}
            hourEase={hourTween.ease}
            tier={DEVICE_TIER}
            washAlpha={WASH_ALPHA}>
          </WindParticleLayer>
        </View>
      ) : null}

      {isLoading && !field ? (
        <View style={styles.loadingHint} pointerEvents="none">
          <View style={styles.loadingChip}>
            <ActivityIndicator size="small" color={colors.white} />
            <AppText weight="medium" style={styles.loadingChipText}>
              Loading wind
            </AppText>
          </View>
        </View>
      ) : null}

      {needsPermission || (error && !field) ? (
        <View style={styles.topStack} pointerEvents="box-none">
          {needsPermission ? (
            <View style={styles.banner}>
              <AppText weight="regular" style={styles.bannerText}>
                {permissionMessage(permissionStatus ?? 'denied')}
              </AppText>
              <PressableScale
                variant="soft"
                onPress={handleRecenter}
                style={styles.bannerButton}>
                <AppText weight="semibold" style={styles.bannerButtonText}>
                  {permissionActionLabel}
                </AppText>
              </PressableScale>
            </View>
          ) : (
            <View style={styles.banner}>
              <AppText weight="medium" style={styles.errorText}>
                {error}
              </AppText>
              <PressableScale
                variant="soft"
                onPress={reload}
                style={styles.bannerButton}>
                <AppText weight="semibold" style={styles.bannerButtonText}>
                  Try again
                </AppText>
              </PressableScale>
            </View>
          )}
        </View>
      ) : null}

      <View style={styles.overlay} pointerEvents="box-none" collapsable={false}>
        <View style={styles.bottomDock} pointerEvents="box-none" collapsable={false}>
          <WindLegend
            bottomInset={insets.bottom}
            isPlaying={isPlaying}
            canPlay={hourCount >= 2}
            isRefreshing={isLoading && !!field}
            onTogglePlay={() => {
              if (hourCount < 2) {
                return;
              }
              setIsPlaying(current => !current);
            }}>
            <HourScrubber
              hourCount={hourCount}
              hourIndex={hourIndex}
              hourLabel={hourLabel}
              onChange={handleScrub}
            />
          </WindLegend>
        </View>
      </View>
    </View>
  );
};

const HourScrubber = memo(
  ({
    hourCount,
    hourIndex,
    hourLabel,
    onChange,
  }: {
    hourCount: number;
    hourIndex: number;
    hourLabel: string;
    onChange: (index: number) => void;
  }) => {
    const trackWidthRef = useRef(1);
    const [trackWidth, setTrackWidth] = useState(1);
    const [pillWidth, setPillWidth] = useState(160);
    const progress = hourCount > 1 ? hourIndex / (hourCount - 1) : 0;
    const pillLeft = Math.min(
      Math.max(0, progress * trackWidth - pillWidth / 2),
      Math.max(0, trackWidth - pillWidth),
    );

    const panResponder = useMemo(
      () =>
        PanResponder.create({
          onStartShouldSetPanResponder: () => hourCount > 1,
          onMoveShouldSetPanResponder: () => hourCount > 1,
          onPanResponderGrant: event => {
            const x = event.nativeEvent.locationX;
            const ratio = Math.min(1, Math.max(0, x / trackWidthRef.current));
            onChange(Math.round(ratio * (hourCount - 1)));
          },
          onPanResponderMove: event => {
            const x = event.nativeEvent.locationX;
            const ratio = Math.min(1, Math.max(0, x / trackWidthRef.current));
            onChange(Math.round(ratio * (hourCount - 1)));
          },
        }),
      [hourCount, onChange],
    );

    return (
      <View style={styles.scrubberRow}>
        <View style={styles.sliderCol}>
          {hourLabel ? (
            <View style={styles.pillTrack}>
              <View
                style={[styles.hourPill, {transform: [{translateX: pillLeft}]}]}
                onLayout={event => {
                  setPillWidth(event.nativeEvent.layout.width);
                }}>
                <AppText weight="semibold" style={styles.hourPillText}>
                  {hourLabel}
                </AppText>
                <View style={styles.hourPillCaret} />
              </View>
            </View>
          ) : (
            <View style={styles.pillTrack} />
          )}
          <View
            style={styles.trackHit}
            onLayout={event => {
              trackWidthRef.current = event.nativeEvent.layout.width;
              setTrackWidth(event.nativeEvent.layout.width);
            }}
            {...panResponder.panHandlers}>
            <View style={styles.track}>
              <View style={[styles.trackFill, {width: `${progress * 100}%`}]} />
              <View style={[styles.thumb, {left: `${progress * 100}%`}]} />
            </View>
          </View>
        </View>
      </View>
    );
  },
);

const WindLegend = memo(
  ({
    bottomInset,
    isPlaying,
    canPlay,
    isRefreshing,
    onTogglePlay,
    children,
  }: {
    bottomInset: number;
    isPlaying: boolean;
    canPlay: boolean;
    isRefreshing: boolean;
    onTogglePlay: () => void;
    children: React.ReactNode;
  }) => (
    <View style={[styles.legend, {paddingBottom: bottomInset + heightPixel(12)}]}>
      <View style={styles.legendRow}>
        <PressableScale
          variant="icon"
          onPress={onTogglePlay}
          style={[styles.playButton, !canPlay && styles.playButtonDisabled]}
          disabled={!canPlay}
          hitSlop={8}
          accessibilityLabel={isPlaying ? 'Pause forecast' : 'Play forecast'}>
          {isPlaying ? (
            <View style={styles.pauseMarks}>
              <View style={styles.pauseBar} />
              <View style={styles.pauseBar} />
            </View>
          ) : (
            <View style={styles.playTriangle} />
          )}
        </PressableScale>
        <View style={styles.legendScale}>{children}</View>
        {isRefreshing ? (
          <ActivityIndicator
            size="small"
            color={colors.primary}
            style={styles.legendSpinner}
          />
        ) : null}
      </View>
      <AppText weight="medium" style={styles.legendUnit}>
        mph
      </AppText>
      <LinearGradient
        colors={WIND_LEGEND_COLORS}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        style={styles.legendBar}
      />
      <View style={styles.legendLabels}>
        {WIND_LEGEND_STOPS.map((stop, index, stops) => (
          <AppText
            key={`${stop}-${index}`}
            weight="regular"
            style={[
              styles.legendLabel,
              index === 0 && styles.legendLabelStart,
              index === stops.length - 1 && styles.legendLabelEnd,
            ]}>
            {stop}
          </AppText>
        ))}
      </View>
    </View>
  ),
);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#38435C',
  },
  particleLayer: {
    ...StyleSheet.absoluteFill,
    zIndex: 1,
  },
  loadingHint: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  loadingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(28,28,28,0.78)',
    borderRadius: heightPixel(16),
    paddingHorizontal: widthPixel(12),
    paddingVertical: heightPixel(8),
  },
  loadingChipText: {
    color: colors.white,
    fontSize: font(13),
    marginLeft: widthPixel(8),
  },
  topStack: {
    position: 'absolute',
    top: heightPixel(12),
    left: widthPixel(16),
    right: widthPixel(16),
    zIndex: 3,
  },
  banner: {
    backgroundColor: 'rgba(28,28,28,0.88)',
    borderRadius: heightPixel(10),
    paddingHorizontal: widthPixel(12),
    paddingVertical: heightPixel(10),
  },
  bannerText: {
    color: colors.white,
    fontSize: font(13),
    textAlign: 'center',
    marginBottom: heightPixel(8),
  },
  bannerButton: {
    alignSelf: 'center',
    backgroundColor: colors.primary,
    borderRadius: heightPixel(8),
    paddingHorizontal: widthPixel(14),
    paddingVertical: heightPixel(8),
  },
  bannerButtonText: {
    color: colors.white,
    fontSize: font(13),
  },
  errorText: {
    color: colors.white,
    fontSize: font(13),
    textAlign: 'center',
    marginBottom: heightPixel(8),
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-end',
    zIndex: 2,
    elevation: 8,
  },
  bottomDock: {
    elevation: 8,
  },
  playback: {
    paddingHorizontal: widthPixel(12),
    marginBottom: heightPixel(6),
  },
  scrubberRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  playButton: {
    width: heightPixel(46),
    height: heightPixel(46),
    borderRadius: heightPixel(23),
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: widthPixel(12),
  },
  playButtonDisabled: {
    opacity: 0.45,
  },
  playTriangle: {
    width: 0,
    height: 0,
    marginLeft: widthPixel(2),
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderLeftWidth: 13,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: colors.white,
  },
  pauseMarks: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pauseBar: {
    width: widthPixel(4),
    height: heightPixel(14),
    borderRadius: 1,
    backgroundColor: colors.white,
    marginHorizontal: widthPixel(2),
  },
  sliderCol: {
    flex: 1,
  },
  pillTrack: {
    height: heightPixel(28),
    marginBottom: heightPixel(6),
    overflow: 'visible',
  },
  hourPill: {
    position: 'absolute',
    left: 0,
    backgroundColor: colors.primary,
    borderRadius: heightPixel(14),
    paddingHorizontal: widthPixel(12),
    paddingVertical: heightPixel(5),
  },
  hourPillText: {
    color: colors.white,
    fontSize: font(12),
  },
  hourPillCaret: {
    position: 'absolute',
    bottom: -6,
    alignSelf: 'center',
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.primary,
  },
  trackHit: {
    height: heightPixel(28),
    justifyContent: 'center',
  },
  track: {
    height: heightPixel(6),
    borderRadius: heightPixel(3),
    backgroundColor: 'rgba(18,18,18,0.16)',
    justifyContent: 'center',
  },
  trackFill: {
    height: '100%',
    borderRadius: heightPixel(3),
    backgroundColor: colors.primary,
  },
  thumb: {
    position: 'absolute',
    width: heightPixel(20),
    height: heightPixel(20),
    marginLeft: -heightPixel(10),
    borderRadius: heightPixel(10),
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.white,
  },
  legend: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    paddingHorizontal: widthPixel(14),
    paddingTop: heightPixel(10),
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendScale: {
    flex: 1,
  },
  legendSpinner: {
    marginLeft: widthPixel(8),
  },
  legendUnit: {
    color: colors.granite,
    fontSize: font(12),
    marginTop: heightPixel(8),
    marginBottom: heightPixel(6),
  },
  legendBar: {
    height: heightPixel(10),
    borderRadius: heightPixel(5),
  },
  legendLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: heightPixel(6),
  },
  legendLabel: {
    color: colors.granite,
    fontSize: font(11),
    flex: 1,
    textAlign: 'center',
  },
  legendLabelStart: {
    textAlign: 'left',
  },
  legendLabelEnd: {
    textAlign: 'right',
  },
  tooltipWrap: {
    alignItems: 'center',
  },
  tooltip: {
    backgroundColor: 'rgba(40,40,40,0.94)',
    borderRadius: heightPixel(6),
    paddingHorizontal: widthPixel(10),
    paddingVertical: heightPixel(7),
    minWidth: widthPixel(118),
  },
  tooltipWind: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: font(11),
  },
  tooltipRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: heightPixel(1),
  },
  tooltipValue: {
    color: colors.white,
    fontSize: font(16),
    marginRight: widthPixel(8),
  },
  tooltipDir: {
    color: colors.white,
    fontSize: font(13),
  },
  tooltipStem: {
    width: 1.5,
    height: heightPixel(16),
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  tooltipDot: {
    width: heightPixel(8),
    height: heightPixel(8),
    borderRadius: heightPixel(4),
    backgroundColor: colors.white,
  },
});

export default WindMapScreen;
