import {fonts} from '@Assets/Fonts';
import Row from '@Components/Row';
import AppText from '@Components/AppText';
import {Loader} from '@Components/Loader';
import {colors} from '@Utils/color';
import {heightPixel, widthPixel, font} from '@Utils/helpers';
import React, {FC, useEffect, useRef, useState} from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {MarineDayForecast} from '@Hooks/useMarineDetail';
import {getWeatherIconSource} from '@Utils/weatherIcons';
import {navigate} from '@Utils/navigation';
import PressableScale from '@Components/PressableScale';

type WeatherTabProps = {
  days: MarineDayForecast[];
  selectedDayKey: string;
  onSelectDay: (key: string) => void;
  isLoading: boolean;
};

const DAY_CIRCLE_SIZE = heightPixel(36);
const SWAP_IN_MS = 240;

const DayPickerItem: FC<{
  day: MarineDayForecast;
  isSelected: boolean;
  onSelect: () => void;
}> = ({day, isSelected, onSelect}) => {
  const progress = useSharedValue(isSelected ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(isSelected ? 1 : 0, {
      duration: 260,
      easing: Easing.out(Easing.cubic),
    });
  }, [isSelected, progress]);

  const circleStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ['rgba(0,0,0,0)', colors.primary],
    ),
    transform: [{scale: 0.88 + progress.value * 0.12}],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      progress.value,
      [0, 1],
      [colors.granite, colors.black],
    ),
  }));

  const numberStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      progress.value,
      [0, 1],
      [colors.black, colors.white],
    ),
  }));

  return (
    <TouchableOpacity
      style={styles.dayItem}
      activeOpacity={0.7}
      onPress={onSelect}>
      <Animated.Text
        style={[
          styles.dayLabel,
          {
            fontSize: 10,
            fontFamily: isSelected ? fonts.Hellix.bold : fonts.Hellix.regular,
          },
          labelStyle,
        ]}
        numberOfLines={1}>
        {day.dayLabel}
      </Animated.Text>
      <Animated.View style={[styles.dayCircle, circleStyle]}>
        <Animated.Text
          style={[
            styles.dayNumber,
            {fontSize: 14, fontFamily: fonts.Hellix.bold},
            numberStyle,
          ]}>
          {day.dateNum}
        </Animated.Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const WindDirectionIcon: FC<{direction?: string}> = ({direction = 'S'}) => (
  <View style={styles.windIconWrap}>
    <AppText weight="bold" style={[styles.windIconLabel, {fontSize: font(12)}]}>
      {direction.slice(0, 1).toUpperCase()}
    </AppText>
    <View style={styles.windIconArrow} />
  </View>
);

const DayForecastPanel: FC<{day: MarineDayForecast}> = ({day}) => {
  const [displayed, setDisplayed] = useState(day);
  const shownKeyRef = useRef(day.key);
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);

  useEffect(() => {
    // Same day: refresh values and keep the panel visible.
    if (day.key === shownKeyRef.current) {
      setDisplayed(day);
      opacity.value = 1;
      translateY.value = 0;
      return;
    }

    shownKeyRef.current = day.key;
    setDisplayed(day);
    opacity.value = 0;
    translateY.value = 8;
    opacity.value = withTiming(1, {
      duration: SWAP_IN_MS,
      easing: Easing.out(Easing.cubic),
    });
    translateY.value = withTiming(0, {
      duration: SWAP_IN_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [day, opacity, translateY]);

  const panelStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{translateY: translateY.value}],
  }));

  const windSpeedValue = displayed.windSpeed.replace(/\s*mph/i, '').trim();

  return (
    <Animated.View style={panelStyle}>
      <View style={styles.tempCard}>
        <Row justify="space-between" align="flex-start" style={styles.tempTop}>
          <View>
            <AppText style={[styles.cardLabel, {fontSize: font(12)}]}>
              TEMP
            </AppText>
            <AppText weight="bold" style={[styles.tempValue, {fontSize: font(34)}]}>
              {displayed.temp != null ? `${displayed.temp}°` : '-'}
            </AppText>
            <AppText weight="semibold" style={[styles.tempRange, {fontSize: font(13)}]}>
              H {displayed.tempHigh ?? '-'}° L {displayed.tempLow ?? '-'}°
            </AppText>
          </View>
          <Image
            source={getWeatherIconSource(
              displayed.weatherIconKey,
              displayed.weatherIconPeriod,
            )}
            style={styles.weatherIcon}
            resizeMode="contain"
          />
        </Row>
        <View style={styles.cardDivider} />
        <AppText style={[styles.cardLabel, {fontSize: font(12)}]}>
          Precipitation
        </AppText>
        <AppText weight="bold" style={[styles.metricValue, {fontSize: font(18)}]}>
          {displayed.precipPercent != null
            ? `${displayed.precipPercent}%`
            : '-'}
        </AppText>
      </View>

      <Row justify="space-between" style={styles.splitRow}>
        <View
          style={[
            styles.metricCard,
            styles.metricCardHalf,
            styles.metricCardLeft,
          ]}>
          <AppText style={[styles.cardLabel, {fontSize: font(12)}]}>
            WIND
          </AppText>
          <Row style={styles.windRow}>
            <WindDirectionIcon direction={displayed.windDirection} />
            <AppText weight="bold" style={[styles.metricValue, {fontSize: font(22)}]}>
              {windSpeedValue || '-'}
              {windSpeedValue ? ' mph' : ''}
            </AppText>
          </Row>
          <View style={styles.cardDivider} />
          <AppText style={[styles.cardLabel, {fontSize: font(12)}]}>
            Gusts
          </AppText>
          <AppText weight="bold" style={[styles.metricValue, {fontSize: font(18)}]}>
            {displayed.gust}
          </AppText>
        </View>

        <View style={[styles.metricCard, styles.metricCardHalf]}>
          <AppText style={[styles.cardLabel, {fontSize: font(12)}]}>
            VISIBILITY
          </AppText>
          <AppText weight="bold" style={[styles.metricValue, {fontSize: font(22)}]}>
            {displayed.visibility}
          </AppText>
          <View style={styles.cardDivider} />
          <AppText style={[styles.cardLabel, {fontSize: font(12)}]}>
            Pressure
          </AppText>
          <AppText weight="bold" style={[styles.metricValue, {fontSize: font(18)}]}>
            {displayed.pressure}
          </AppText>
        </View>
      </Row>

      <Row justify="space-between" style={styles.splitRow}>
        <View
          style={[
            styles.metricCard,
            styles.metricCardHalf,
            styles.metricCardLeft,
          ]}>
          <AppText style={[styles.cardLabel, {fontSize: font(12)}]}>
            WAVES
          </AppText>
          <AppText weight="bold" style={[styles.metricValue, {fontSize: font(22)}]}>
            {displayed.wave}
          </AppText>
        </View>

        <View style={[styles.metricCard, styles.metricCardHalf]}>
          <AppText style={[styles.cardLabel, {fontSize: font(12)}]}>
            PERIOD
          </AppText>
          <AppText weight="bold" style={[styles.metricValue, {fontSize: font(22)}]}>
            {displayed.period}
          </AppText>
        </View>
      </Row>
    </Animated.View>
  );
};

const WeatherTab: FC<WeatherTabProps> = ({
  days,
  selectedDayKey,
  onSelectDay,
  isLoading,
}) => {
  if (isLoading && !days.length) {
    return <Loader />;
  }

  const selectedDay =
    days.find(day => day.key === selectedDayKey) ?? days[0] ?? null;

  if (!selectedDay) {
    return (
      <View style={styles.emptyState}>
        <AppText style={[styles.emptyText, {fontSize: font(14)}]}>
          Weather forecast unavailable
        </AppText>
        <WeatherMapLinks />
      </View>
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}>
      <View style={styles.dayPicker}>
        {days.map(day => (
          <DayPickerItem
            key={day.key}
            day={day}
            isSelected={day.key === selectedDay.key}
            onSelect={() => onSelectDay(day.key)}
          />
        ))}
      </View>

      <Animated.View entering={FadeIn.duration(280)}>
        <DayForecastPanel day={selectedDay} />
        <WeatherMapLinks />
      </Animated.View>
    </ScrollView>
  );
};

const WeatherMapLinks = () => (
  <View style={styles.mapButtons}>
    <PressableScale
      variant="soft"
      onPress={() => navigate('WeatherRadar')}
      style={[styles.mapButton, styles.mapButtonLeft]}>
      <AppText weight="semibold" style={[styles.mapButtonText, {fontSize: font(15)}]}>
        View radar
      </AppText>
    </PressableScale>
    <PressableScale
      variant="soft"
      onPress={() => navigate('WeatherMap')}
      style={styles.mapButton}>
      <AppText weight="semibold" style={[styles.mapButtonText, {fontSize: font(15)}]}>
        View wind
      </AppText>
    </PressableScale>
  </View>
);

const styles = StyleSheet.create({
  content: {
    paddingBottom: heightPixel(20),
  },
  dayPicker: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: heightPixel(18),
  },
  dayItem: {
    flex: 1,
    alignItems: 'center',
  },
  dayLabel: {
    marginBottom: heightPixel(8),
    textAlign: 'center',
  },
  dayCircle: {
    width: DAY_CIRCLE_SIZE,
    height: DAY_CIRCLE_SIZE,
    borderRadius: DAY_CIRCLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  dayNumber: {
    textAlign: 'center',
  },
  tempCard: {
    backgroundColor: colors.white,
    borderRadius: heightPixel(12),
    padding: widthPixel(16),
    marginBottom: heightPixel(12),
  },
  metricCard: {
    backgroundColor: colors.white,
    borderRadius: heightPixel(12),
    paddingHorizontal: widthPixel(16),
    paddingTop: widthPixel(16),
    paddingBottom: widthPixel(18),
    marginBottom: heightPixel(12),
    overflow: 'visible',
  },
  metricCardHalf: {
    flex: 1,
    marginBottom: 0,
    minHeight: heightPixel(150),
  },
  metricCardLeft: {
    marginRight: widthPixel(10),
  },
  splitRow: {
    marginVertical: 0,
    alignItems: 'stretch',
    marginBottom: heightPixel(12),
  },
  tempTop: {
    marginVertical: 0,
  },
  cardLabel: {
    color: colors.granite,
    marginBottom: heightPixel(6),
  },
  tempValue: {
    color: colors.black,
    lineHeight: heightPixel(42),
  },
  tempRange: {
    color: colors.black,
    marginTop: heightPixel(2),
  },
  weatherIcon: {
    width: widthPixel(42),
    height: widthPixel(42),
  },
  cardDivider: {
    height: heightPixel(1),
    backgroundColor: colors.cardSectionBorder,
    marginVertical: heightPixel(12),
  },
  windRow: {
    marginVertical: 0,
    alignItems: 'center',
    marginBottom: heightPixel(4),
  },
  windIconWrap: {
    alignItems: 'center',
    marginRight: widthPixel(8),
  },
  windIconLabel: {
    color: colors.black,
    marginBottom: heightPixel(2),
  },
  windIconArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: widthPixel(5),
    borderRightWidth: widthPixel(5),
    borderBottomWidth: widthPixel(10),
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: colors.black,
    transform: [{rotate: '45deg'}],
  },
  metricValue: {
    color: colors.black,
  },
  emptyState: {
    paddingVertical: heightPixel(40),
    alignItems: 'center',
    width: '100%',
  },
  emptyText: {
    color: colors.granite,
  },
  mapButtons: {
    flexDirection: 'row',
    marginTop: heightPixel(16),
    alignSelf: 'stretch',
  },
  mapButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: heightPixel(10),
    paddingVertical: heightPixel(14),
    alignItems: 'center',
  },
  mapButtonLeft: {
    marginRight: widthPixel(10),
  },
  mapButtonText: {
    color: colors.white,
  },
});

export default WeatherTab;
