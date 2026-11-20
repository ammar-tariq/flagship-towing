import AppText from '@Components/AppText';
import {Loader} from '@Components/Loader';
import {BoatingLocationPickerModal} from '@Components/BoatingLocationPickerModal';
import {AddressSearchModal} from '@Components/AddressSearchModal';
import {GeneralParamList, type WeatherDetailTab} from '@Types/navigation';
import {colors} from '@Utils/color';
import {heightPixel, widthPixel, font} from '@Utils/helpers';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {Pressable, StyleSheet, TouchableOpacity, View} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import AppScreen from '@Components/AppScreen';
import {useMarineDetail} from '@Hooks/useMarineDetail';
import TidesTab from './TidesTab';
import WeatherTab from './WeatherTab';
import {styles as navStyles} from 'src/app/navigation/NavigationOptions/styles';

const WeatherUpdateDetailScreen = () => {
  const route = useRoute<RouteProp<GeneralParamList, 'WeatherUpdateDetail'>>();
  const navigation =
    useNavigation<StackNavigationProp<GeneralParamList, 'WeatherUpdateDetail'>>();
  const params = route.params;
  const [activeTab, setActiveTab] = useState<WeatherDetailTab>(
    params?.initialTab === 'tides' ? 'tides' : 'weather',
  );
  const tabProgress = useSharedValue(activeTab === 'tides' ? 1 : 0);

  const weatherSummary = useMemo(
    () =>
      params
        ? {
            address: params.address,
            latitude: params.latitude,
            longitude: params.longitude,
            windLabel: params.windLabel,
            windDirectionDeg: params.windDirectionDeg,
            temperature: params.temperature,
            weatherIconKey: params.weatherIconKey,
            weatherIconPeriod: params.weatherIconPeriod,
            gust: params.gust,
            wave: params.wave,
            period: params.period,
            lowTide: params.lowTide,
            highTide: params.highTide,
            serviceAreaId: params.serviceAreaId,
            serviceAreaName: params.serviceAreaName,
          }
        : undefined,
    [
      params?.address,
      params?.latitude,
      params?.longitude,
      params?.windLabel,
      params?.windDirectionDeg,
      params?.temperature,
      params?.weatherIconKey,
      params?.weatherIconPeriod,
      params?.gust,
      params?.wave,
      params?.period,
      params?.lowTide,
      params?.highTide,
      params?.serviceAreaId,
      params?.serviceAreaName,
    ],
  );

  const {
    days,
    tides,
    isLoading,
    isTidesLoading,
    serviceAreas,
    selectedServiceArea,
    selectServiceArea,
    weatherLocationLabel,
    selectWeatherLocation,
  } = useMarineDetail(params?.latitude, params?.longitude, weatherSummary);

  const [dayKey, setDayKey] = useState('');
  const [tidesPickerVisible, setTidesPickerVisible] = useState(false);
  const [weatherPickerVisible, setWeatherPickerVisible] = useState(false);
  const forecastTodayKeyRef = useRef(days[0]?.key ?? '');

  useEffect(() => {
    if (!days.length) {
      return;
    }
    const todayKey = days[0].key;
    if (forecastTodayKeyRef.current !== todayKey) {
      forecastTodayKeyRef.current = todayKey;
      setDayKey(todayKey);
      return;
    }
    setDayKey(prev =>
      prev && days.some(day => day.key === prev) ? prev : todayKey,
    );
  }, [days]);

  useEffect(() => {
    tabProgress.value = withTiming(activeTab === 'tides' ? 1 : 0, {
      duration: 220,
    });
  }, [activeTab, tabProgress]);

  const weatherIndicatorStyle = useAnimatedStyle(() => ({
    opacity: 1 - tabProgress.value,
    transform: [{scaleX: 0.5 + (1 - tabProgress.value) * 0.5}],
  }));

  const tidesIndicatorStyle = useAnimatedStyle(() => ({
    opacity: tabProgress.value,
    transform: [{scaleX: 0.5 + tabProgress.value * 0.5}],
  }));

  const weatherSubtitleLocation =
    weatherLocationLabel?.trim() || params?.address || 'Select location';

  const tidesSubtitleLocation =
    selectedServiceArea?.name ?? 'Select location';

  const areaOptions = useMemo(
    () => serviceAreas.map(area => area.name),
    [serviceAreas],
  );

  const handleSelectAreaName = (name: string) => {
    const area = serviceAreas.find(item => item.name === name);
    if (area) {
      selectServiceArea(area.id);
    }
  };

  const handleSelectWeatherAddress = (
    address: string,
    coords?: {latitude: number; longitude: number},
  ) => {
    if (!coords) {
      return;
    }
    selectWeatherLocation({
      latitude: coords.latitude,
      longitude: coords.longitude,
      label: address,
    });
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={navStyles.headerTitleWrap}>
          <AppText
            lines={1}
            weight="bold"
            style={[navStyles.title, {fontSize: font(17), lineHeight: 22}]}>
            Current Location
          </AppText>
          <View style={styles.headerSubtitleRow}>
            <AppText
              lines={1}
              weight="regular"
              style={[navStyles.breadcrumb, {fontSize: font(12)}]}>
              {activeTab === 'tides' ? 'Tides · ' : 'Weather · '}
            </AppText>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={
                activeTab === 'tides'
                  ? 'Change service area'
                  : 'Change weather location'
              }
              hitSlop={8}
              onPress={() =>
                activeTab === 'tides'
                  ? setTidesPickerVisible(true)
                  : setWeatherPickerVisible(true)
              }>
              <AppText
                lines={1}
                weight="regular"
                style={[
                  navStyles.breadcrumb,
                  styles.headerLocationLink,
                  {fontSize: font(12)},
                ]}>
                {activeTab === 'tides'
                  ? tidesSubtitleLocation
                  : weatherSubtitleLocation}
              </AppText>
            </Pressable>
          </View>
        </View>
      ),
    });
  }, [navigation, activeTab, tidesSubtitleLocation, weatherSubtitleLocation]);

  return (
    <AppScreen edges={['bottom']} style={styles.screen}>
      <View style={styles.tabBar}>
        {(['weather', 'tides'] as WeatherDetailTab[]).map(tab => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={styles.tabButton}
              onPress={() => setActiveTab(tab)}>
              <AppText
                weight={isActive ? 'bold' : 'regular'}
                style={[
                  styles.tabLabel,
                  isActive && styles.tabLabelActive,
                  {fontSize: font(16)},
                ]}>
                {tab === 'weather' ? 'Weather' : 'Tides'}
              </AppText>
              <Animated.View
                style={[
                  styles.tabIndicator,
                  tab === 'weather'
                    ? weatherIndicatorStyle
                    : tidesIndicatorStyle,
                ]}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.content}>
        {isLoading && !days.length && activeTab === 'weather' ? (
          <Loader />
        ) : activeTab === 'weather' ? (
          <Animated.View
            key="weather"
            entering={FadeIn.duration(220)}
            exiting={FadeOut.duration(140)}
            style={styles.tabPane}>
            <WeatherTab
              days={days}
              selectedDayKey={dayKey}
              onSelectDay={setDayKey}
              isLoading={isLoading}
            />
          </Animated.View>
        ) : (
          <Animated.View
            key="tides"
            entering={FadeIn.duration(220)}
            exiting={FadeOut.duration(140)}
            style={styles.tabPane}>
            <TidesTab
              tides={tides}
              isLoading={isTidesLoading}
              selectedServiceArea={selectedServiceArea}
              onChangeLocation={() => setTidesPickerVisible(true)}
            />
          </Animated.View>
        )}
      </View>
      <BoatingLocationPickerModal
        visible={tidesPickerVisible}
        onClose={() => setTidesPickerVisible(false)}
        onSelect={handleSelectAreaName}
        currentValue={selectedServiceArea?.name}
        options={areaOptions}
        title="Select service area"
      />
      <AddressSearchModal
        visible={weatherPickerVisible}
        onClose={() => setWeatherPickerVisible(false)}
        onAddressSelect={handleSelectWeatherAddress}
        currentValue={weatherSubtitleLocation}
        title="Weather location"
        subtitle="Search a US city or address"
        placeholder="City or address"
        types="geocode"
        compactLabel
      />
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.lightGray,
    paddingHorizontal: widthPixel(16),
    paddingTop: heightPixel(8),
  },
  tabBar: {
    flexDirection: 'row',
    marginBottom: heightPixel(16),
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: heightPixel(12),
  },
  tabLabel: {
    color: colors.granite,
    marginBottom: heightPixel(8),
  },
  tabLabelActive: {
    color: colors.black,
  },
  tabIndicator: {
    width: '100%',
    height: heightPixel(3),
    backgroundColor: colors.primary,
    borderRadius: heightPixel(2),
  },
  content: {
    flex: 1,
  },
  tabPane: {
    flex: 1,
  },
  headerSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: widthPixel(220),
  },
  headerLocationLink: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
});

export default WeatherUpdateDetailScreen;
