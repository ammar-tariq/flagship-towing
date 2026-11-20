import type {DeviceTier} from '@Lib/deviceTier';
import {buildWindEngineHtml} from '@Lib/windEngineHtml';
import {
  WIND_LEGEND_COLORS,
  WIND_LEGEND_STOPS,
  type WindEngineField,
} from '@Lib/windMap';
import {useIsFocused} from '@react-navigation/native';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AppState,
  Platform,
  StyleSheet,
  View,
  type AppStateStatus,
  type LayoutChangeEvent,
} from 'react-native';
import type MapView from 'react-native-maps';
import type {Region} from 'react-native-maps';
import {WebView, type WebViewMessageEvent} from 'react-native-webview';

export type WindParticleLayerHandle = {
  onRegionChangeStart: () => void;
  onRegionChange: (region: Region) => void;
  onRegionChangeComplete: (region: Region) => void;
};

type Props = {
  mapRef: React.RefObject<MapView | null>;
  field: WindEngineField | null;
  hourIndex: number;
  /** How long the engine should take to glide to `hourIndex`. 0 = jump. */
  hourTransitionMs: number;
  hourEase: 'linear' | 'out';
  tier: DeviceTier;
  washAlpha?: number;
};

const ENGINE_HTML = buildWindEngineHtml();
const ENGINE_SOURCE =
  Platform.OS === 'android'
    ? {html: ENGINE_HTML, baseUrl: 'https://localhost/'}
    : {html: ENGINE_HTML};
const DATA_DETECTOR_TYPES = ['none'] as const;

/**
 * Transparent, touch-through canvas layer that sits exactly over the map.
 *
 * All continuous animation stays in the WebView. This wrapper is a plain View
 * on purpose: Reanimated/native-animated opacity on a stack screen races
 * react-native-screens during pop (`mutated while being enumerated`).
 *
 * During map gestures the engine fades the overlay itself. RN only sends
 * field / camera / hour when those change.
 */
const WindParticleLayer = forwardRef<WindParticleLayerHandle, Props>(
  function WindParticleLayer(
    {mapRef, field, hourIndex, hourTransitionMs, hourEase, tier, washAlpha = 0.44},
    ref,
  ) {
    const webRef = useRef<WebView>(null);
    const readyRef = useRef(false);
    const queueRef = useRef<string[]>([]);
    const sizeRef = useRef({width: 0, height: 0});
    const projectSeqRef = useRef(0);
    const interactingRef = useRef(false);
    const lastRegionRef = useRef<Region | null>(null);
    const [hasLayout, setHasLayout] = useState(false);
    const isFocused = useIsFocused();

    const send = useCallback((message: Record<string, unknown>) => {
      const js = `window.__wind&&window.__wind.onMessage(${JSON.stringify(
        message,
      )});true;`;
      if (readyRef.current) {
        webRef.current?.injectJavaScript(js);
      } else {
        queueRef.current.push(js);
      }
    }, []);

    const project = useCallback(
      async (region: Region) => {
        const map = mapRef.current;
        const {width, height} = sizeRef.current;
        if (!map || !width || !height) {
          return;
        }
        const seq = ++projectSeqRef.current;
        let topLeft: {latitude: number; longitude: number};
        let bottomRight: {latitude: number; longitude: number};
        try {
          [topLeft, bottomRight] = await Promise.all([
            map.coordinateForPoint({x: 0, y: 0}),
            map.coordinateForPoint({x: width, y: height}),
          ]);
        } catch {
          send({type: 'interact', active: false});
          return;
        }
        if (seq !== projectSeqRef.current) {
          return;
        }
        const lonSpan = bottomRight.longitude - topLeft.longitude;
        if (!(lonSpan > 0)) {
          return;
        }
        send({
          type: 'projection',
          w: width,
          h: height,
          lon0: topLeft.longitude,
          lat0: topLeft.latitude,
          lon1: bottomRight.longitude,
          lat1: bottomRight.latitude,
          zoom: Math.log2((360 * width) / (lonSpan * 256)),
        });
      },
      [mapRef, send],
    );

    useImperativeHandle(
      ref,
      () => ({
        onRegionChangeStart: () => {
          if (interactingRef.current) {
            return;
          }
          interactingRef.current = true;
          send({type: 'interact', active: true});
        },
        onRegionChange: () => {
          // Gesture tracking stays in the WebView. RN must not drive
          // transform/opacity here or screens will crash on pop.
        },
        onRegionChangeComplete: (region: Region) => {
          interactingRef.current = false;
          lastRegionRef.current = region;
          project(region).then(() => {
            if (!interactingRef.current) {
              send({type: 'interact', active: false});
            }
          });
        },
      }),
      [project, send],
    );

    const handleMessage = useCallback(
      (event: WebViewMessageEvent) => {
        let message: {type?: string; message?: string};
        try {
          message = JSON.parse(event.nativeEvent.data);
        } catch {
          return;
        }
        switch (message.type) {
          case 'ready': {
            readyRef.current = true;
            const queued = queueRef.current;
            queueRef.current = [];
            queued.forEach(js => webRef.current?.injectJavaScript(js));
            if (lastRegionRef.current) {
              project(lastRegionRef.current);
            }
            break;
          }
          case 'error':
            if (__DEV__) {
              console.warn('[wind-engine]', message.message);
            }
            break;
          default:
            break;
        }
      },
      [project],
    );

    useEffect(() => {
      send({
        type: 'init',
        tier,
        stops: WIND_LEGEND_STOPS,
        colors: WIND_LEGEND_COLORS,
        washAlpha,
      });
    }, [send, tier, washAlpha]);

    useEffect(() => {
      if (field) {
        send({type: 'field', ...field});
        if (lastRegionRef.current && readyRef.current) {
          project(lastRegionRef.current);
        }
      }
    }, [field, project, send]);

    useEffect(() => {
      send({type: 'hour', pos: hourIndex, ms: hourTransitionMs, ease: hourEase});
    }, [hourEase, hourIndex, hourTransitionMs, send]);

    useEffect(() => {
      const apply = (state: AppStateStatus) => {
        send({type: 'visibility', paused: !isFocused || state !== 'active'});
      };
      apply(AppState.currentState);
      const subscription = AppState.addEventListener('change', apply);
      return () => subscription.remove();
    }, [isFocused, send]);

    useEffect(() => {
      return () => {
        readyRef.current = false;
        queueRef.current = [];
      };
    }, []);

    const handleLayout = useCallback(
      (event: LayoutChangeEvent) => {
        const {width, height} = event.nativeEvent.layout;
        const prev = sizeRef.current;
        sizeRef.current = {width, height};
        setHasLayout(width > 0 && height > 0);
        if (
          lastRegionRef.current &&
          width > 0 &&
          height > 0 &&
          (prev.width !== width || prev.height !== height)
        ) {
          project(lastRegionRef.current);
        }
      },
      [project],
    );

    const webViewStyle = useMemo(() => [styles.fill, styles.transparent], []);

    return (
      <View
        style={styles.fill}
        pointerEvents="none"
        collapsable={false}
        onLayout={handleLayout}>
        {hasLayout ? (
          <WebView
            ref={webRef}
            source={ENGINE_SOURCE}
            originWhitelist={ORIGIN_WHITELIST}
            onMessage={handleMessage}
            style={webViewStyle}
            containerStyle={styles.transparent}
            pointerEvents="none"
            scrollEnabled={false}
            overScrollMode="never"
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            javaScriptEnabled
            cacheEnabled={false}
            incognito
            setBuiltInZoomControls={false}
            setDisplayZoomControls={false}
            setSupportMultipleWindows={false}
            dataDetectorTypes={DATA_DETECTOR_TYPES}
            // Hardware layers over Google Maps SIGSEGV on some Android GPUs.
            androidLayerType={Platform.OS === 'android' ? 'software' : 'none'}
            webviewDebuggingEnabled={__DEV__}
          />
        ) : null}
      </View>
    );
  },
);

const ORIGIN_WHITELIST = ['*'];

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFill,
  },
  transparent: {
    backgroundColor: 'transparent',
  },
});

export default WindParticleLayer;
