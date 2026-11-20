import {Loader} from '@Components/Loader';
import CoordinatesCard from '@Components/CoordinatesCard';
import {useWeatherUpdate} from '@Hooks/useWeatherUpdate';
import {GeneralParamList} from '@Types/navigation';
import {colors} from '@Utils/color';
import {
  COVERAGE_MAP_URL,
  coverageLocationHook,
  coverageWebViewProps,
  showCoverageUserScript,
} from '@Utils/coverageMap';
import {heightPixel, widthPixel} from '@Utils/helpers';
import {RouteProp, useRoute} from '@react-navigation/native';
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import WebView from 'react-native-webview';

const MapScreen = () => {
  const route = useRoute<RouteProp<GeneralParamList, 'Map'>>();
  const weather = useWeatherUpdate();
  const insets = useSafeAreaInsets();
  const [mapReady, setMapReady] = useState(false);
  const webViewRef = useRef<WebView>(null);

  const latitude = route.params?.latitude ?? weather.latitude ?? null;
  const longitude = route.params?.longitude ?? weather.longitude ?? null;

  useEffect(() => {
    if (!mapReady || latitude == null || longitude == null) {
      return;
    }
    webViewRef.current?.injectJavaScript(
      showCoverageUserScript(latitude, longitude),
    );
  }, [latitude, longitude, mapReady]);

  const permissionMessage = useMemo(() => {
    if (weather.needsPermission) {
      return weather.address;
    }
    if (latitude == null) {
      return 'Unable to get current location';
    }
    return undefined;
  }, [weather.needsPermission, weather.address, latitude]);

  return (
    <View style={styles.screen}>
      {!mapReady ? (
        <View style={styles.loader} pointerEvents="none">
          <Loader />
        </View>
      ) : null}
      <WebView
        ref={webViewRef}
        {...coverageWebViewProps}
        source={{uri: COVERAGE_MAP_URL}}
        style={styles.webview}
        injectedJavaScriptBeforeContentLoaded={coverageLocationHook}
        onLoadEnd={() => setMapReady(true)}
      />
      <View
        pointerEvents="box-none"
        style={[
          styles.coordsOverlay,
          {paddingBottom: Math.max(insets.bottom, heightPixel(12))},
        ]}>
        <CoordinatesCard
          latitude={latitude}
          longitude={longitude}
          isLoading={weather.isLoading}
          needsPermission={weather.needsPermission}
          canOpenSettings={weather.canOpenSettings}
          message={permissionMessage}
          onRequestPermission={weather.requestPermission}
          onRetry={weather.refresh}
          style={styles.coordsCard}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.black,
  },
  webview: {
    flex: 1,
    backgroundColor: colors.black,
  },
  loader: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  coordsOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  coordsCard: {
    marginTop: 0,
    marginHorizontal: widthPixel(16),
    paddingTop: heightPixel(12),
    borderRadius: heightPixel(10),
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 2},
    elevation: 4,
  },
});

export default MapScreen;
