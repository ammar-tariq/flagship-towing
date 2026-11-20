import {Loader} from '@Components/Loader';
import PressableScale from '@Components/PressableScale';
import {WEATHER_MAP_PROVIDER} from '@Lib/configs/weatherMap';
import {DEFAULT_WIND_CENTER} from '@Lib/configs/mapLibre';
import {colors} from '@Utils/color';
import {heightPixel} from '@Utils/helpers';
import {navigate} from '@Utils/navigation';
import React, {memo, useEffect, useMemo, useRef, useState} from 'react';
import {Platform, StyleSheet, View} from 'react-native';
import MapView, {Marker, type Region} from 'react-native-maps';
import Animated, {FadeIn} from 'react-native-reanimated';

type CurrentLocationMapProps = {
  latitude?: number | null;
  longitude?: number | null;
};

const PREVIEW_DELTA = 0.04;
const FALLBACK_DELTA = 10;

const regionFor = (
  latitude: number,
  longitude: number,
  wide: boolean,
): Region => ({
  latitude,
  longitude,
  latitudeDelta: wide ? FALLBACK_DELTA : PREVIEW_DELTA,
  longitudeDelta: wide ? FALLBACK_DELTA : PREVIEW_DELTA,
});

const CurrentLocationMap = ({
  latitude,
  longitude,
}: CurrentLocationMapProps) => {
  const mapRef = useRef<MapView>(null);
  const [mapReady, setMapReady] = useState(false);
  const hasPin =
    latitude != null &&
    longitude != null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);

  const previewRegion = useMemo(
    () =>
      regionFor(
        hasPin ? latitude : DEFAULT_WIND_CENTER[1],
        hasPin ? longitude : DEFAULT_WIND_CENTER[0],
        !hasPin,
      ),
    [hasPin, latitude, longitude],
  );

  useEffect(() => {
    if (!mapReady) {
      return;
    }
    mapRef.current?.animateToRegion(previewRegion, 400);
  }, [mapReady, previewRegion]);

  const handlePress = () => {
    navigate('Map', {
      latitude: hasPin ? latitude : undefined,
      longitude: hasPin ? longitude : undefined,
    });
  };

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeIn.duration(280)} style={styles.mapWrap}>
        {!mapReady ? (
          <View style={styles.centered}>
            <Loader />
          </View>
        ) : null}
        <MapView
          ref={mapRef}
          key={
            Platform.OS === 'android'
              ? hasPin
                ? `${latitude.toFixed(4)},${longitude.toFixed(4)}`
                : 'fallback'
              : 'ios-preview'
          }
          provider={WEATHER_MAP_PROVIDER}
          style={styles.map}
          initialRegion={previewRegion}
          liteMode={Platform.OS === 'android'}
          pointerEvents="none"
          scrollEnabled={false}
          zoomEnabled={false}
          zoomTapEnabled={false}
          zoomControlEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
          toolbarEnabled={false}
          showsCompass={false}
          showsScale={false}
          showsMyLocationButton={false}
          showsBuildings={false}
          showsTraffic={false}
          showsIndoors={false}
          showsPointsOfInterests={false}
          loadingEnabled
          loadingBackgroundColor={colors.lightGray}
          onMapReady={() => setMapReady(true)}>
          {hasPin ? (
            <Marker
              coordinate={{latitude, longitude}}
              tappable={false}
            />
          ) : null}
        </MapView>
      </Animated.View>
      <PressableScale style={styles.hitLayer} onPress={handlePress}>
        <View style={styles.hitFill} />
      </PressableScale>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignSelf: 'stretch',
    height: heightPixel(160),
    borderRadius: heightPixel(10),
    overflow: 'hidden',
    backgroundColor: colors.lightGray,
  },
  mapWrap: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.lightGray,
  },
  centered: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  hitLayer: {
    ...StyleSheet.absoluteFill,
    zIndex: 2,
  },
  hitFill: {
    flex: 1,
  },
});

export default memo(CurrentLocationMap);
