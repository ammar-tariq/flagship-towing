import {
  WEATHER_GOOGLE_MAP_STYLE,
  WEATHER_MAP_BACKGROUND,
  WEATHER_MAP_PADDING,
  WEATHER_MAP_PROVIDER,
  DEFAULT_WEATHER_CAMERA,
} from '@Lib/configs/weatherMap';
import React, {forwardRef} from 'react';
import {StyleSheet} from 'react-native';
import MapView, {type MapViewProps} from 'react-native-maps';

/**
 * Google Maps canvas for radar / wind.
 * `provider` is forced so iOS cannot fall back to Apple Maps.
 */
const WeatherGoogleMap = forwardRef<MapView, MapViewProps>(
  function WeatherGoogleMap(
    {
      children,
      customMapStyle = WEATHER_GOOGLE_MAP_STYLE,
      initialCamera = DEFAULT_WEATHER_CAMERA,
      mapPadding = WEATHER_MAP_PADDING,
      style,
      ...props
    },
    ref,
  ) {
    return (
      <MapView
        {...props}
        ref={ref}
        provider={WEATHER_MAP_PROVIDER}
        customMapStyle={customMapStyle}
        initialCamera={initialCamera}
        mapPadding={mapPadding}
        mapType="standard"
        userInterfaceStyle="dark"
        loadingBackgroundColor={WEATHER_MAP_BACKGROUND}
        showsCompass={false}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
        moveOnMarkerPress={false}
        style={[styles.map, style]}>
        {children}
      </MapView>
    );
  },
);

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});

export default WeatherGoogleMap;
