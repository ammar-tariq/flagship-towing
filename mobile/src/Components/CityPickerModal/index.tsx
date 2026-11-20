import React, {FC, memo, useCallback, useEffect, useRef, useState} from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import AppText from '@Components/AppText';
import Button from '@Components/Button';
import PressableScale from '@Components/PressableScale';
import AppBottomSheet, {
  AppBottomSheetFlatList,
  AppBottomSheetTextInput,
} from '@Components/AppBottomSheet';
import {SearchEmpty, SearchResultRow, sheetStyles} from '@Components/Sheet';
import {colors} from '@Utils/color';
import {font, heightPixel, widthPixel} from '@Utils/helpers';
import {fonts} from '@Assets/Fonts';
import {images} from '@Assets/Images';
import {GOOGLE_PLACES_API_KEY} from '@Lib/configs/googleMaps';

interface ICityPickerModal {
  visible: boolean;
  onClose: () => void;
  onCitySelect: (city: string) => void;
  currentState?: string;
  currentStateName?: string;
  currentValue?: string;
}

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  types?: string[];
}

export const CityPickerModal: FC<ICityPickerModal> = ({
  visible,
  onClose,
  onCitySelect,
  currentState,
  currentStateName,
  currentValue,
}) => {
  const [searchText, setSearchText] = useState('');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchEntireCountry, setSearchEntireCountry] = useState(false);
  const fetchAbortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!visible) {
      fetchAbortRef.current?.abort();
      return;
    }

    setSearchText('');
    setPredictions([]);
    setSearchEntireCountry(false);
    setLoading(false);
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    if (searchText.trim().length < 2) {
      setPredictions([]);
      setLoading(false);
      return;
    }

    const debounceTimer = setTimeout(() => {
      fetchCities(searchText.trim());
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchText, currentState, visible, searchEntireCountry]);

  useEffect(() => {
    return () => {
      fetchAbortRef.current?.abort();
    };
  }, []);

  const stateCode =
    currentState && currentState.length === 2
      ? currentState.toUpperCase()
      : undefined;

  const fetchCities = async (input: string) => {
    fetchAbortRef.current?.abort();
    const controller = new AbortController();
    fetchAbortRef.current = controller;
    const requestId = ++requestIdRef.current;

    setLoading(true);
    try {
      // Place Autocomplete only supports country in `components`.
      // Bias to the selected state by including it in the query string.
      const biasedInput =
        stateCode && !searchEntireCountry ? `${input}, ${stateCode}` : input;

      const url =
        `https://maps.googleapis.com/maps/api/place/autocomplete/json` +
        `?input=${encodeURIComponent(biasedInput)}` +
        `&key=${GOOGLE_PLACES_API_KEY}` +
        `&components=country:us` +
        `&types=(cities)`;

      const response = await fetch(url, {signal: controller.signal});
      const data = await response.json();

      if (controller.signal.aborted || requestId !== requestIdRef.current) {
        return;
      }

      if (data.status && data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.error('City autocomplete error:', data.status, data.error_message);
        setPredictions([]);
        return;
      }

      const cities = (data.predictions || []).filter((pred: PlacePrediction) => {
        const isCity =
          pred.types?.includes('locality') ||
          pred.types?.includes('sublocality') ||
          pred.types?.includes('postal_town') ||
          pred.types?.includes('administrative_area_level_3');
        if (!isCity) {
          return false;
        }
        if (stateCode && !searchEntireCountry) {
          const haystack = `${pred.description} ${pred.structured_formatting?.secondary_text || ''}`.toUpperCase();
          return (
            haystack.includes(`, ${stateCode}`) ||
            haystack.includes(` ${stateCode},`) ||
            haystack.endsWith(` ${stateCode}`)
          );
        }
        return true;
      });

      setPredictions(cities);
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        return;
      }
      console.error('Error fetching cities:', error);
      if (requestId === requestIdRef.current) {
        setPredictions([]);
      }
    } finally {
      if (!controller.signal.aborted && requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  };

  const handleSelectCity = useCallback(
    async (prediction: PlacePrediction) => {
      const cityName =
        prediction.structured_formatting?.main_text ||
        prediction.description.split(',')[0];

      try {
        const detailsUrl =
          `https://maps.googleapis.com/maps/api/place/details/json` +
          `?place_id=${prediction.place_id}` +
          `&key=${GOOGLE_PLACES_API_KEY}` +
          `&fields=address_components`;
        const response = await fetch(detailsUrl);
        const data = await response.json();

        if (data.result?.address_components) {
          const component = data.result.address_components.find((comp: any) =>
            comp.types.includes('locality'),
          );
          onCitySelect(component?.long_name || cityName);
        } else {
          onCitySelect(cityName);
        }
      } catch (error) {
        console.error('Error fetching city details:', error);
        onCitySelect(cityName);
      }
      onClose();
    },
    [onCitySelect, onClose],
  );

  const handleDone = useCallback(() => {
    const trimmed = searchText.trim();
    if (trimmed) {
      onCitySelect(trimmed);
    }
    onClose();
  }, [onCitySelect, onClose, searchText]);

  const emptyMessage =
    searchText.trim().length >= 2
      ? stateCode && !searchEntireCountry
        ? `No cities found in ${currentStateName || stateCode}`
        : 'No cities found'
      : searchText.trim().length > 0
        ? 'Type at least 2 characters to search'
        : currentValue
          ? `Current: ${currentValue}. Start typing to change`
          : 'Start typing to find a city';

  return (
    <AppBottomSheet
      visible={visible}
      onClose={onClose}
      title="City"
      subtitle={
        currentStateName || stateCode
          ? `Search cities in ${currentStateName || stateCode}`
          : 'Search and select a city'
      }
      icon={images.icons.home}
      snapPoints={['88%']}
      fill
      stickyHeader={
        <View style={localStyles.searchWrap}>
          <AppBottomSheetTextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder={
              currentStateName || stateCode
                ? `Enter city in ${currentStateName || stateCode}`
                : 'Enter city'
            }
            placeholderTextColor={colors.placeholder}
            autoCorrect={false}
            autoCapitalize="words"
            autoFocus
            returnKeyType="search"
            style={localStyles.searchInput}
            clearButtonMode="while-editing"
          />
          {loading ? (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={localStyles.searchSpinner}
            />
          ) : null}
        </View>
      }
      footer={
        <Button text="Done" onPress={handleDone} style={localStyles.doneBtn} />
      }>
      <AppBottomSheetFlatList
        data={predictions}
        keyExtractor={(item: PlacePrediction) => item.place_id}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={localStyles.list}
        contentContainerStyle={sheetStyles.scrollContent}
        renderItem={({item}: {item: PlacePrediction}) => (
          <SearchResultRow
            title={
              item.structured_formatting?.main_text ||
              item.description.split(',')[0]
            }
            subtitle={item.structured_formatting?.secondary_text}
            icon={images.icons.home}
            onPress={() => handleSelectCity(item)}
          />
        )}
        ListEmptyComponent={
          <View>
            <SearchEmpty message={emptyMessage} icon={images.icons.home} />
            {searchText.trim().length >= 2 &&
            stateCode &&
            !searchEntireCountry &&
            !loading ? (
              <PressableScale
                variant="soft"
                onPress={() => setSearchEntireCountry(true)}
                style={localStyles.linkButton}>
                <AppText
                  weight="semibold"
                  style={[localStyles.linkText, {fontSize: font(14)}]}>
                  Search entire country instead
                </AppText>
              </PressableScale>
            ) : null}
          </View>
        }
      />
    </AppBottomSheet>
  );
};

const localStyles = StyleSheet.create({
  searchWrap: {
    paddingHorizontal: widthPixel(14),
    paddingBottom: heightPixel(8),
    justifyContent: 'center',
  },
  searchInput: {
    height: heightPixel(48),
    borderRadius: heightPixel(24),
    backgroundColor: colors.lightGray,
    paddingHorizontal: widthPixel(16),
    paddingRight: widthPixel(44),
    fontFamily: fonts.Hellix.regular,
    fontSize: font(14),
    color: colors.black,
  },
  searchSpinner: {
    position: 'absolute',
    right: widthPixel(28),
  },
  list: {
    flex: 1,
  },
  doneBtn: {
    width: '100%',
    marginVertical: 0,
  },
  linkButton: {
    alignSelf: 'center',
    paddingVertical: heightPixel(10),
    paddingHorizontal: heightPixel(14),
    borderRadius: heightPixel(20),
    backgroundColor: colors.lightGray,
    marginTop: heightPixel(4),
  },
  linkText: {
    color: colors.primary,
  },
});

export default memo(CityPickerModal);
