import AppText from '@Components/AppText';
import PressableScale from '@Components/PressableScale';
import RadarTileOverlay from '@Components/RadarTileOverlay';
import WeatherGoogleMap from '@Components/WeatherGoogleMap';
import {useRadarFrames} from '@Hooks/useRadarFrames';
import {useDeviceLocation} from '@Hooks/useDeviceLocation';
import {useIsFocused} from '@react-navigation/native';
import {
  defaultWeatherCamera,
  RADAR_MIN_ZOOM,
  RADAR_USER_ZOOM,
  WEATHER_MAP_PADDING,
  weatherCameraAt,
  zoomLock,
} from '@Lib/configs/weatherMap';
import {permissionMessage} from '@Lib/locationPermission';
import {
  buildRadarLayerTileUrl,
  DEFAULT_RADAR_LAYER,
  formatRadarFrameLabel,
  getRadarLayer,
  PLAY_FRAME_MS,
  RADAR_LAYERS,
  RADAR_MAXZOOM,
  type RadarLayer,
  type RadarLayerId,
} from '@Utils/radarMap';
import {colors} from '@Utils/color';
import {font, heightPixel, widthPixel} from '@Utils/helpers';
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
  AppState,
  PanResponder,
  StyleSheet,
  View,
  type AppStateStatus,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import MapView, {Marker} from 'react-native-maps';

const REFRESH_MS = 2 * 60 * 1000;

type UserCoords = {
  latitude: number;
  longitude: number;
};

const RadarMapScreen = () => {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const mapRef = useRef<MapView>(null);
  const mapReadyRef = useRef(false);
  const didFlyRef = useRef(false);
  const playingRef = useRef(false);
  const frameIndexRef = useRef(0);
  const userCoordsRef = useRef<UserCoords | null>(null);

  const {data, frameIndex, setFrameIndex, isLoading, error, load, reload} =
    useRadarFrames();
  const location = useDeviceLocation();
  const {requestAccess} = location;
  const [isPlaying, setIsPlaying] = useState(false);
  const [layerId, setLayerId] = useState<RadarLayerId>(DEFAULT_RADAR_LAYER);
  const [satelliteIndex, setSatelliteIndex] = useState(0);
  const [mapReady, setMapReady] = useState(false);
  const [userCoords, setUserCoords] = useState<UserCoords | null>(null);
  const [trackPin, setTrackPin] = useState(true);

  const layer = getRadarLayer(layerId);
  const radarFrames = data?.frames ?? [];
  const satelliteFrames = data?.satelliteFrames ?? [];
  const satelliteAvailable = satelliteFrames.length > 0;
  const frames = layer.product === 'satellite' ? satelliteFrames : radarFrames;
  const frameCount = frames.length;
  const nowIndex =
    layer.product === 'satellite'
      ? data?.satelliteNowIndex ?? Math.max(frameCount - 1, 0)
      : data?.nowIndex ?? 0;
  const activeIndex =
    layer.product === 'satellite' ? satelliteIndex : frameIndex;
  const activeFrame = frames[activeIndex];
  const hourLabel = formatRadarFrameLabel(
    activeFrame,
    activeIndex === nowIndex,
  );
  const radarTiles = useMemo(() => {
    if (!data?.host) {
      return [];
    }
    return frames.flatMap(frame => {
      const url = frame.path
        ? buildRadarLayerTileUrl(data.host, frame.path, layer)
        : frame.tileUrl;
      if (!url) {
        return [];
      }
      return [{key: `${layer.id}:${frame.time}`, url}];
    });
  }, [data?.host, frames, layer]);
  const mapPadding = useMemo(
    () => ({
      top: WEATHER_MAP_PADDING.top,
      right: 0,
      bottom: heightPixel(168) + insets.bottom,
      left: 0,
    }),
    [insets.bottom],
  );
  const permissionStatus = location.permissionStatus;
  const needsPermission = location.needsPermission;
  const permissionActionLabel =
    permissionStatus === 'blocked' ? 'Open Settings' : 'Enable Location';
  const maxzoom = data?.maxzoom ?? RADAR_MAXZOOM;
  const radarZoom = useMemo(
    () => zoomLock(RADAR_MIN_ZOOM, maxzoom, RADAR_USER_ZOOM),
    [maxzoom],
  );
  const radarZoomRef = useRef(radarZoom);
  radarZoomRef.current = radarZoom;

  playingRef.current = isPlaying;
  frameIndexRef.current = frameCount
    ? Math.min(activeIndex, frameCount - 1)
    : 0;
  const frameCountRef = useRef(frameCount);
  frameCountRef.current = frameCount;
  const layerProductRef = useRef(layer.product);
  layerProductRef.current = layer.product;

  useEffect(() => {
    if (satelliteIndex >= satelliteFrames.length && satelliteFrames.length) {
      setSatelliteIndex(
        data?.satelliteNowIndex ?? Math.max(satelliteFrames.length - 1, 0),
      );
    }
  }, [data?.satelliteNowIndex, satelliteFrames.length, satelliteIndex]);

  const radarInitialCamera = useMemo(
    () => ({
      ...defaultWeatherCamera(),
      zoom: RADAR_USER_ZOOM,
    }),
    [],
  );

  const flyToUser = useCallback((lng: number, lat: number) => {
    mapRef.current?.animateCamera(
      weatherCameraAt(lng, lat, radarZoomRef.current.initialZoom),
      {duration: 700},
    );
  }, []);

  const applyUserCoords = useCallback(
    (lng: number, lat: number, fly: boolean) => {
      const prev = userCoordsRef.current;
      const sameFix =
        prev != null &&
        Math.abs(prev.latitude - lat) < 0.00008 &&
        Math.abs(prev.longitude - lng) < 0.00008;
      if (!sameFix) {
        const next = {latitude: lat, longitude: lng};
        userCoordsRef.current = next;
        setTrackPin(true);
        setUserCoords(next);
      }
      if (!fly || !mapReadyRef.current || didFlyRef.current) {
        return;
      }
      didFlyRef.current = true;
      flyToUser(lng, lat);
    },
    [flyToUser],
  );

  const handleMapReady = useCallback(() => {
    mapReadyRef.current = true;
    setMapReady(true);
    const coords = userCoordsRef.current;
    if (coords && !didFlyRef.current) {
      didFlyRef.current = true;
      flyToUser(coords.longitude, coords.latitude);
    }
  }, [flyToUser]);

  useEffect(() => {
    if (!userCoords || !trackPin) {
      return;
    }
    const timer = setTimeout(() => setTrackPin(false), 600);
    return () => clearTimeout(timer);
  }, [trackPin, userCoords]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!isFocused) {
      return;
    }
    const timer = setInterval(() => {
      load();
    }, REFRESH_MS);
    return () => clearInterval(timer);
  }, [isFocused, load]);

  useEffect(() => {
    if (!location.coords) {
      return;
    }
    applyUserCoords(
      location.coords.longitude,
      location.coords.latitude,
      true,
    );
  }, [applyUserCoords, location.coords]);

  useEffect(() => {
    const onAppStateChange = (nextState: AppStateStatus) => {
      if (nextState !== 'active') {
        return;
      }
      load();
    };
    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, [load]);

  useEffect(() => {
    if (!isFocused || !isPlaying || !mapReady || frameCount < 2) {
      return;
    }
    const timer = setInterval(() => {
      const count = frameCountRef.current;
      if (count < 2) {
        return;
      }
      const nextIndex =
        frameIndexRef.current >= count - 1 ? 0 : frameIndexRef.current + 1;
      frameIndexRef.current = nextIndex;
      if (layerProductRef.current === 'satellite') {
        setSatelliteIndex(nextIndex);
      } else {
        setFrameIndex(nextIndex);
      }
    }, PLAY_FRAME_MS);
    return () => clearInterval(timer);
  }, [frameCount, isFocused, isPlaying, mapReady, setFrameIndex]);

  const handleScrub = useCallback(
    (nextIndex: number) => {
      setIsPlaying(false);
      if (layerProductRef.current === 'satellite') {
        setSatelliteIndex(nextIndex);
      } else {
        setFrameIndex(nextIndex);
      }
    },
    [setFrameIndex],
  );

  const handleLayerChange = useCallback(
    (nextId: RadarLayerId) => {
      if (nextId === layerId) {
        return;
      }
      const next = getRadarLayer(nextId);
      if (next.product === 'satellite' && !satelliteAvailable) {
        return;
      }
      if (next.product !== layer.product) {
        playingRef.current = false;
        setIsPlaying(false);
      }
      layerProductRef.current = next.product;
      setLayerId(nextId);
    },
    [layer.product, layerId, satelliteAvailable],
  );

  const handleRecenter = useCallback(async () => {
    const next = await requestAccess();
    if (!next) {
      return;
    }
    applyUserCoords(next.longitude, next.latitude, false);
    didFlyRef.current = true;
    flyToUser(next.longitude, next.latitude);
  }, [applyUserCoords, flyToUser, requestAccess]);

  return (
    <View style={styles.screen}>
      <WeatherGoogleMap
        ref={mapRef}
        initialCamera={radarInitialCamera}
        minZoomLevel={radarZoom.minZoom}
        maxZoomLevel={radarZoom.maxZoom}
        zoomEnabled={radarZoom.zoomEnabled}
        zoomTapEnabled={radarZoom.zoomEnabled}
        zoomControlEnabled={false}
        mapPadding={mapPadding}
        showsUserLocation={false}
        showsMyLocationButton={false}
        onMapReady={handleMapReady}>
        <RadarTileOverlay
          tiles={radarTiles}
          activeIndex={Math.min(Math.max(activeIndex, 0), Math.max(radarTiles.length - 1, 0))}
          maxzoom={maxzoom}
          layerKey={layer.id}
        />
        {userCoords ? (
          <Marker
            coordinate={userCoords}
            anchor={{x: 0.5, y: 0.72}}
            tracksViewChanges={trackPin}
            zIndex={20}
            title="You are here">
            <View style={styles.userPin} pointerEvents="none">
              <View style={styles.youChip}>
                <AppText weight="semibold" style={styles.youChipText}>
                  You
                </AppText>
              </View>
              <View style={styles.userPinHalo}>
                <View style={styles.userPinDot} />
              </View>
            </View>
          </Marker>
        ) : null}
      </WeatherGoogleMap>

      {isLoading && !data ? (
        <View style={styles.loadingHint} pointerEvents="none">
          <View style={styles.loadingChip}>
            <ActivityIndicator size="small" color={colors.white} />
            <AppText weight="medium" style={styles.loadingChipText}>
              Loading radar
            </AppText>
          </View>
        </View>
      ) : null}

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
        ) : error && !data ? (
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
        ) : null}
        <View style={styles.layerBar}>
          {RADAR_LAYERS.map(item => {
            const selected = item.id === layerId;
            const disabled =
              item.product === 'satellite' && !satelliteAvailable;
            return (
              <PressableScale
                key={item.id}
                variant="soft"
                disabled={disabled}
                onPress={() => handleLayerChange(item.id)}
                style={[
                  styles.layerChip,
                  selected && styles.layerChipActive,
                  disabled && styles.layerChipDisabled,
                ]}
                accessibilityLabel={item.label}
                accessibilityState={{selected, disabled}}>
                <AppText
                  weight={selected ? 'semibold' : 'regular'}
                  style={[
                    styles.layerChipText,
                    selected && styles.layerChipTextActive,
                  ]}>
                  {item.label}
                </AppText>
              </PressableScale>
            );
          })}
        </View>
        <AppText weight="regular" style={styles.layerHint}>
          {satelliteAvailable || layer.product !== 'satellite'
            ? layer.hint
            : 'Satellite frames unavailable'}
        </AppText>
      </View>

      <View style={styles.overlay} pointerEvents="box-none" collapsable={false}>
        <PressableScale
          variant="icon"
          onPress={handleRecenter}
          style={styles.locateButton}
          accessibilityLabel="Center on my location">
          <View style={styles.locateRing}>
            <View style={styles.locateDot} />
          </View>
        </PressableScale>
        <View style={styles.bottomDock} pointerEvents="box-none" collapsable={false}>
          <RadarLegend
            layer={layer}
            bottomInset={insets.bottom}
            isPlaying={isPlaying}
            canPlay={frameCount >= 2}
            isRefreshing={isLoading && !!data}
            onTogglePlay={() => {
              if (frameCount < 2) {
                return;
              }
              setIsPlaying(current => !current);
            }}>
            <HourScrubber
              hourCount={frameCount}
              hourIndex={activeIndex}
              hourLabel={hourLabel}
              nowIndex={nowIndex}
              onChange={handleScrub}
            />
          </RadarLegend>
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
    nowIndex,
    onChange,
  }: {
    hourCount: number;
    hourIndex: number;
    hourLabel: string;
    nowIndex: number;
    onChange: (index: number) => void;
  }) => {
    const trackWidthRef = useRef(1);
    const [trackWidth, setTrackWidth] = useState(1);
    const [pillWidth, setPillWidth] = useState(160);
    const progress = hourCount > 1 ? hourIndex / (hourCount - 1) : 0;
    const nowProgress = hourCount > 1 ? nowIndex / (hourCount - 1) : 1;
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
              {nowIndex < hourCount - 1 ? (
                <View
                  style={[styles.nowMark, {left: `${nowProgress * 100}%`}]}
                />
              ) : null}
              <View style={[styles.thumb, {left: `${progress * 100}%`}]} />
            </View>
          </View>
        </View>
      </View>
    );
  },
);

const RadarLegend = memo(
  ({
    layer,
    bottomInset,
    isPlaying,
    canPlay,
    isRefreshing,
    onTogglePlay,
    children,
  }: {
    layer: RadarLayer;
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
          accessibilityLabel={isPlaying ? 'Pause radar' : 'Play radar'}>
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
        {layer.legendTitle}
      </AppText>
      <LinearGradient
        colors={layer.legendColors}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        style={styles.legendBar}
      />
      <View style={styles.legendLabels}>
        {layer.legendStops.map((stop, index, stops) => (
          <AppText
            key={stop}
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
    marginBottom: heightPixel(8),
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
  layerBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(28,28,28,0.88)',
    borderRadius: heightPixel(10),
    padding: heightPixel(4),
  },
  layerChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: heightPixel(8),
    borderRadius: heightPixel(8),
  },
  layerChipActive: {
    backgroundColor: colors.primary,
  },
  layerChipDisabled: {
    opacity: 0.38,
  },
  layerChipText: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: font(12),
  },
  layerChipTextActive: {
    color: colors.white,
  },
  layerHint: {
    color: colors.white,
    fontSize: font(11),
    textAlign: 'center',
    marginTop: heightPixel(6),
    opacity: 0.88,
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
  locateButton: {
    alignSelf: 'flex-end',
    width: heightPixel(44),
    height: heightPixel(44),
    borderRadius: heightPixel(22),
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: widthPixel(12),
    marginBottom: heightPixel(10),
    shadowColor: colors.black,
    shadowOpacity: 0.22,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: 2},
    elevation: 4,
  },
  locateRing: {
    width: heightPixel(18),
    height: heightPixel(18),
    borderRadius: heightPixel(9),
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locateDot: {
    width: heightPixel(8),
    height: heightPixel(8),
    borderRadius: heightPixel(4),
    backgroundColor: colors.primary,
  },
  userPin: {
    alignItems: 'center',
  },
  youChip: {
    backgroundColor: colors.white,
    borderRadius: heightPixel(10),
    paddingHorizontal: widthPixel(8),
    paddingVertical: heightPixel(2),
    marginBottom: heightPixel(4),
  },
  youChipText: {
    color: colors.primary,
    fontSize: font(11),
  },
  userPinHalo: {
    width: heightPixel(28),
    height: heightPixel(28),
    borderRadius: heightPixel(14),
    backgroundColor: 'rgba(1, 24, 255, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userPinDot: {
    width: heightPixel(14),
    height: heightPixel(14),
    borderRadius: heightPixel(7),
    backgroundColor: colors.primary,
    borderWidth: 2.5,
    borderColor: colors.white,
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
  nowMark: {
    position: 'absolute',
    width: 2,
    height: heightPixel(10),
    marginLeft: -1,
    backgroundColor: colors.white,
    opacity: 0.7,
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
});

export default RadarMapScreen;
