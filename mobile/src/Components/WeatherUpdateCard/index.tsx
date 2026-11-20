import Row from '@Components/Row';
import AppText from '@Components/AppText';
import {Loader} from '@Components/Loader';
import {colors} from '@Utils/color';
import {heightPixel, widthPixel, font} from '@Utils/helpers';
import {navigate} from '@Utils/navigation';
import React, {FC, memo, type ReactNode} from 'react';
import {Image, StyleSheet, View} from 'react-native';
import Animated, {FadeIn} from 'react-native-reanimated';
import {type WeatherUpdateController} from '@Hooks/useWeatherUpdate';
import {useAuthMode} from '@Hooks/useAuthMode';
import {getWeatherIconSource} from '@Utils/weatherIcons';
import PressableScale from '@Components/PressableScale';
import {DEFAULT_WIND_CENTER} from '@Lib/configs/mapLibre';

/** TEMP: let anyone open Weather / View Winds without login or GPS. Remove after testing. */
const UNLOCK_WEATHER_DETAIL_FOR_TESTING = true;

const METRICS = [
  {key: 'gust', label: 'Gust'},
  {key: 'wave', label: 'Wave'},
  {key: 'period', label: 'Period'},
  {key: 'highTide', label: 'High Tide'},
] as const;

const LocationIcon: FC<{size?: number}> = ({size = heightPixel(14)}) => (
  <View style={[styles.locationIconWrap, {width: size, height: size}]}>
    <View
      style={[
        styles.locationIconHead,
        {
          width: size * 0.45,
          height: size * 0.45,
          borderRadius: size * 0.225,
        },
      ]}
    />
    <View
      style={[
        styles.locationIconTail,
        {
          borderLeftWidth: size * 0.18,
          borderRightWidth: size * 0.18,
          borderTopWidth: size * 0.32,
          marginTop: -heightPixel(2),
        },
      ]}
    />
  </View>
);

const WindArrow: FC<{directionDeg: number | null}> = ({directionDeg}) => {
  const rotation = directionDeg != null ? directionDeg + 180 : 180;

  return (
    <View
      style={[
        styles.windArrowWrap,
        {transform: [{rotate: `${rotation}deg`}]},
      ]}>
      <View style={styles.windArrowHead} />
    </View>
  );
};

const MetricCell: FC<{
  label: string;
  value: string;
  showDivider?: boolean;
}> = ({label, value, showDivider = false}) => (
  <View style={styles.metricCell}>
    {showDivider ? <View style={styles.metricDivider} /> : null}
    <AppText weight="regular" style={[styles.metricLabel, {fontSize: font(12)}]}>
      {label}
    </AppText>
    <AppText weight="semibold" style={[styles.metricValue, {fontSize: font(13)}]}>
      {value}
    </AppText>
  </View>
);

const WeatherUpdateCard = ({
  weather,
}: {
  weather: WeatherUpdateController;
}) => {
  const {user} = useAuthMode();
  const isPressable =
    UNLOCK_WEATHER_DETAIL_FOR_TESTING ||
    (Boolean(user) && !weather.needsPermission);
  const hasWeatherData =
    weather.latitude != null &&
    !weather.needsPermission &&
    weather.temperature !== '-';

  const metricValues = {
    gust: weather.gust,
    wave: weather.wave,
    period: weather.period,
    highTide: weather.highTide,
  };

  const handlePress = () => {
    const latitude = weather.latitude ?? DEFAULT_WIND_CENTER[1];
    const longitude = weather.longitude ?? DEFAULT_WIND_CENTER[0];
    if (
      !UNLOCK_WEATHER_DETAIL_FOR_TESTING &&
      (weather.latitude == null || weather.longitude == null)
    ) {
      return;
    }

    navigate('WeatherUpdateDetail', {
      address: weather.address || 'Test location',
      latitude,
      longitude,
      windLabel: weather.windLabel,
      windDirectionDeg: weather.windDirectionDeg,
      temperature: weather.temperature,
      weatherIconKey: weather.weatherIconKey,
      weatherIconPeriod: weather.weatherIconPeriod,
      gust: weather.gust,
      wave: weather.wave,
      period: weather.period,
      lowTide: weather.lowTide,
      highTide: weather.highTide,
      serviceAreaId: weather.serviceAreaId,
      serviceAreaName: weather.serviceAreaName,
    });
  };

  const permissionActionLabel = weather.canOpenSettings
    ? 'Open Settings'
    : 'Enable Location';

  const showLoadFailure =
    !weather.isLoading &&
    !weather.needsPermission &&
    weather.temperature === '-' &&
    Boolean(weather.address);

  const showInitialLoader = weather.isLoading && !hasWeatherData;

  let cardContent: ReactNode;

  if (showInitialLoader) {
    cardContent = <Loader />;
  } else if (weather.needsPermission) {
    cardContent = (
      <Animated.View entering={FadeIn.duration(220)}>
        <Row style={styles.locationTitleRow}>
          <AppText weight="bold" style={[styles.locationTitle, {fontSize: font(15)}]}>
            Location Needed
          </AppText>
          <LocationIcon />
        </Row>

        <AppText weight="regular" style={[styles.addressText, {fontSize: font(13)}]}>
          {weather.address}
        </AppText>

        <PressableScale
          variant="soft"
          style={styles.permissionButton}
          onPress={weather.requestPermission}>
          <AppText weight="semibold" style={[styles.permissionButtonText, {fontSize: font(14)}]}>
            {permissionActionLabel}
          </AppText>
        </PressableScale>
      </Animated.View>
    );
  } else if (showLoadFailure) {
    cardContent = (
      <Animated.View entering={FadeIn.duration(220)}>
        <Row style={styles.locationTitleRow}>
          <AppText weight="bold" style={[styles.locationTitle, {fontSize: font(15)}]}>
            Weather Unavailable
          </AppText>
          <LocationIcon />
        </Row>

        <AppText weight="regular" style={[styles.addressText, {fontSize: font(13)}]}>
          {weather.address}
        </AppText>

        <PressableScale
          variant="soft"
          style={styles.permissionButton}
          onPress={weather.refresh}>
          <AppText weight="semibold" style={[styles.permissionButtonText, {fontSize: font(14)}]}>
            Try Again
          </AppText>
        </PressableScale>
      </Animated.View>
    );
  } else {
    cardContent = (
      <Animated.View entering={FadeIn.duration(280)}>
        <Row style={styles.locationTitleRow}>
          <AppText weight="bold" style={[styles.locationTitle, {fontSize: font(15)}]}>
            Current Location
          </AppText>
          <LocationIcon />
        </Row>

        <AppText weight="regular" style={[styles.addressText, {fontSize: font(13)}]}>
          {weather.address}
        </AppText>

        <Row justify="space-between" align="center" style={styles.summaryRow}>
          <Row style={styles.windRow}>
            <WindArrow directionDeg={weather.windDirectionDeg} />
            <AppText weight="bold" style={[styles.windText, {fontSize: font(15)}]}>
              {weather.windLabel}
            </AppText>
          </Row>

          <Row style={styles.tempRow}>
            <Image
              source={getWeatherIconSource(
                weather.weatherIconKey,
                weather.weatherIconPeriod,
              )}
              style={styles.weatherIcon}
              resizeMode="contain"
            />
            <AppText weight="bold" style={[styles.temperatureText, {fontSize: font(22)}]}>
              {weather.temperature}
            </AppText>
          </Row>
        </Row>

        <View style={styles.horizontalDivider} />

        <Row style={styles.metricsRow}>
          {METRICS.map((metric, index) => (
            <MetricCell
              key={metric.key}
              label={metric.label}
              value={metricValues[metric.key]}
              showDivider={index > 0}
            />
          ))}
        </Row>

        {weather.serviceAreaName ? (
          <AppText weight="regular" style={[styles.serviceAreaText, {fontSize: font(11)}]}>
            Tides · {weather.serviceAreaName}
          </AppText>
        ) : null}

        {weather.isLoading ? (
          <View style={styles.refreshOverlay} pointerEvents="none">
            <Loader />
          </View>
        ) : null}
      </Animated.View>
    );
  }

  return (
    <View style={styles.section}>
      <AppText weight="bold" style={[styles.sectionTitle, {fontSize: font(18)}]}>
        Weather Update
      </AppText>
      {isPressable ? (
        <PressableScale
          style={styles.card}
          disabled={!UNLOCK_WEATHER_DETAIL_FOR_TESTING && !hasWeatherData}
          onPress={handlePress}>
          {cardContent}
        </PressableScale>
      ) : (
        <View style={styles.card}>{cardContent}</View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    width: '100%',
    alignSelf: 'stretch',
    marginTop: heightPixel(20),
    backgroundColor: colors.white,
  },
  sectionTitle: {
    color: colors.black,
    marginBottom: heightPixel(12),
  },
  card: {
    width: '100%',
    borderRadius: heightPixel(10),
    backgroundColor: colors.lightGray,
    paddingHorizontal: widthPixel(16),
    paddingTop: heightPixel(16),
    paddingBottom: heightPixel(14),
    minHeight: heightPixel(160),
    justifyContent: 'center',
    overflow: 'hidden',
  },
  locationTitleRow: {
    marginVertical: 0,
    marginBottom: heightPixel(4),
  },
  locationTitle: {
    color: colors.black,
    marginRight: widthPixel(6),
  },
  addressText: {
    color: colors.granite,
    marginBottom: heightPixel(14),
  },
  permissionButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: heightPixel(8),
    paddingHorizontal: widthPixel(14),
    paddingVertical: heightPixel(10),
    marginBottom: heightPixel(4),
  },
  permissionButtonText: {
    color: colors.white,
  },
  summaryRow: {
    marginVertical: 0,
    marginBottom: heightPixel(14),
  },
  windRow: {
    marginVertical: 0,
    alignItems: 'center',
  },
  windArrowWrap: {
    width: widthPixel(16),
    height: widthPixel(16),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: widthPixel(8),
  },
  windArrowHead: {
    width: 0,
    height: 0,
    borderLeftWidth: widthPixel(5),
    borderRightWidth: widthPixel(5),
    borderBottomWidth: widthPixel(10),
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: colors.black,
  },
  windText: {
    color: colors.black,
  },
  tempRow: {
    marginVertical: 0,
    alignItems: 'center',
  },
  weatherIcon: {
    width: widthPixel(28),
    height: widthPixel(28),
    marginRight: widthPixel(6),
  },
  temperatureText: {
    color: colors.black,
    lineHeight: heightPixel(28),
  },
  horizontalDivider: {
    height: heightPixel(1),
    backgroundColor: colors.cardSectionBorder,
    marginBottom: heightPixel(12),
  },
  metricsRow: {
    marginVertical: 0,
    alignItems: 'stretch',
  },
  metricCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingHorizontal: widthPixel(4),
    minHeight: heightPixel(44),
  },
  metricDivider: {
    position: 'absolute',
    left: 0,
    top: heightPixel(2),
    bottom: heightPixel(2),
    width: heightPixel(1),
    backgroundColor: colors.cardSectionBorder,
  },
  metricLabel: {
    color: colors.black,
    marginBottom: heightPixel(4),
    textAlign: 'center',
  },
  metricValue: {
    color: colors.black,
    textAlign: 'center',
  },
  serviceAreaText: {
    color: colors.granite,
    marginTop: heightPixel(10),
  },
  locationIconWrap: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  locationIconHead: {
    borderWidth: heightPixel(2),
    borderColor: colors.black,
    backgroundColor: colors.lightGray,
  },
  locationIconTail: {
    width: 0,
    height: 0,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.black,
  },
  refreshOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(245,245,245,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default memo(WeatherUpdateCard);
