import React, {FC, memo, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import Button from '@Components/Button';
import AppBottomSheet, {
  AppBottomSheetFlatList,
  AppBottomSheetTextInput,
} from '@Components/AppBottomSheet';
import {SearchEmpty, SearchResultRow, sheetStyles} from '@Components/Sheet';
import {colors} from '@Utils/color';
import {font, heightPixel, widthPixel} from '@Utils/helpers';
import {images} from '@Assets/Images';
import {GOOGLE_PLACES_API_KEY} from '@Lib/configs/googleMaps';
import {fonts} from '@Assets/Fonts';

export type AddressCoords = {
  latitude: number;
  longitude: number;
};

interface IAddressSearchModal {
  visible: boolean;
  onClose: () => void;
  onAddressSelect: (address: string, coords?: AddressCoords) => void;
  currentValue?: string;
  title?: string;
  subtitle?: string;
  placeholder?: string;
  /** Google Places autocomplete `types`. Default `address` for mailing. */
  types?: string;
  /** Prefer "City, ST" when geometry is available (weather). */
  compactLabel?: boolean;
}

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

type PlaceDetailsResult = {
  formatted_address?: string;
  geometry?: {location?: {lat?: number; lng?: number}};
  address_components?: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
};

const formattedMailingAddress = (
  result?: PlaceDetailsResult,
  fallback = '',
) => {
  const formatted = (result?.formatted_address || '')
    .replace(/,\s*USA\s*$/i, '')
    .trim();
  return formatted || fallback;
};

const formattedLocality = (result?: PlaceDetailsResult, fallback = '') => {
  const components = result?.address_components ?? [];
  const city =
    components.find(component => component.types.includes('locality'))
      ?.long_name ??
    components.find(component =>
      component.types.includes('administrative_area_level_2'),
    )?.long_name;
  const state = components.find(component =>
    component.types.includes('administrative_area_level_1'),
  )?.short_name;
  if (city && state) {
    return `${city}, ${state}`;
  }
  return formattedMailingAddress(result, fallback);
};

const coordsFromResult = (
  result?: PlaceDetailsResult,
): AddressCoords | undefined => {
  const lat = result?.geometry?.location?.lat;
  const lng = result?.geometry?.location?.lng;
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return undefined;
  }
  return {latitude: lat, longitude: lng};
};

const geocodeAddress = async (
  address: string,
): Promise<{label: string; coords?: AddressCoords; result?: PlaceDetailsResult}> => {
  const url =
    `https://maps.googleapis.com/maps/api/geocode/json` +
    `?address=${encodeURIComponent(address)}` +
    `&key=${GOOGLE_PLACES_API_KEY}` +
    `&components=country:US`;
  const response = await fetch(url);
  const data = await response.json();
  const result = data.results?.[0] as PlaceDetailsResult | undefined;
  return {
    label: formattedMailingAddress(result, address),
    coords: coordsFromResult(result),
    result,
  };
};

export const AddressSearchModal: FC<IAddressSearchModal> = ({
  visible,
  onClose,
  onAddressSelect,
  currentValue,
  title = 'Mailing address',
  subtitle = 'Search and select an address',
  placeholder = 'Enter address',
  types = 'address',
  compactLabel = false,
}) => {
  const [searchText, setSearchText] = useState('');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const fetchAbortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!visible) {
      fetchAbortRef.current?.abort();
      return;
    }
    setSearchText('');
    setPredictions([]);
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
      fetchPlaces(searchText.trim());
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchText, visible]);

  useEffect(() => {
    return () => {
      fetchAbortRef.current?.abort();
    };
  }, []);

  const fetchPlaces = async (input: string) => {
    fetchAbortRef.current?.abort();
    const controller = new AbortController();
    fetchAbortRef.current = controller;
    const requestId = ++requestIdRef.current;

    setLoading(true);
    try {
      const typesQuery = types ? `&types=${encodeURIComponent(types)}` : '';
      const url =
        `https://maps.googleapis.com/maps/api/place/autocomplete/json` +
        `?input=${encodeURIComponent(input)}` +
        `&key=${GOOGLE_PLACES_API_KEY}` +
        `&components=country:us` +
        typesQuery;
      const response = await fetch(url, {signal: controller.signal});
      const data = await response.json();

      if (controller.signal.aborted || requestId !== requestIdRef.current) {
        return;
      }

      if (data.status && data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.error('Address autocomplete error:', data.status, data.error_message);
        setPredictions([]);
        return;
      }

      setPredictions(data.predictions || []);
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        return;
      }
      console.error('Error fetching places:', error);
      if (requestId === requestIdRef.current) {
        setPredictions([]);
      }
    } finally {
      if (!controller.signal.aborted && requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  };

  const labelFromResult = useCallback(
    (result?: PlaceDetailsResult, fallback = '') =>
      compactLabel
        ? formattedLocality(result, fallback)
        : formattedMailingAddress(result, fallback),
    [compactLabel],
  );

  const handleSelectAddress = useCallback(
    async (prediction: PlacePrediction) => {
      try {
        const detailsUrl =
          `https://maps.googleapis.com/maps/api/place/details/json` +
          `?place_id=${prediction.place_id}` +
          `&key=${GOOGLE_PLACES_API_KEY}` +
          `&fields=formatted_address,geometry,address_components`;
        const response = await fetch(detailsUrl);
        const data = await response.json();
        const result = data.result as PlaceDetailsResult | undefined;

        if (result) {
          onAddressSelect(
            labelFromResult(result, prediction.description),
            coordsFromResult(result),
          );
        } else {
          const geocoded = await geocodeAddress(prediction.description);
          onAddressSelect(
            compactLabel
              ? formattedLocality(geocoded.result, prediction.description)
              : geocoded.label,
            geocoded.coords,
          );
        }
      } catch (error) {
        console.error('Error fetching place details:', error);
        onAddressSelect(prediction.description);
      }
      onClose();
    },
    [compactLabel, labelFromResult, onAddressSelect, onClose],
  );

  const handleDone = useCallback(() => {
    const trimmed = searchText.trim();
    if (!trimmed) {
      onClose();
      return;
    }
    geocodeAddress(trimmed)
      .then(geocoded => {
        onAddressSelect(
          compactLabel
            ? formattedLocality(geocoded.result, trimmed)
            : geocoded.label,
          geocoded.coords,
        );
      })
      .catch(() => {
        onAddressSelect(trimmed);
      })
      .finally(() => {
        onClose();
      });
  }, [compactLabel, onAddressSelect, onClose, searchText]);

  const keyExtractor = useCallback((item: PlacePrediction) => item.place_id, []);

  const renderItem = useCallback(
    ({item}: {item: PlacePrediction}) => (
      <SearchResultRow
        title={item.structured_formatting?.main_text || item.description}
        subtitle={item.structured_formatting?.secondary_text}
        icon={images.icons.home}
        onPress={() => handleSelectAddress(item)}
      />
    ),
    [handleSelectAddress],
  );

  const listEmpty = useMemo(() => {
    if (searchText.trim().length >= 2) {
      return (
        <SearchEmpty
          message={loading ? 'Searching…' : 'No addresses found'}
          icon={images.icons.home}
        />
      );
    }
    if (searchText.trim().length > 0) {
      return (
        <SearchEmpty
          message="Type at least 2 characters to search"
          icon={images.icons.write}
        />
      );
    }
    return (
      <SearchEmpty
        message={
          currentValue
            ? `Current: ${currentValue}. Start typing to change`
            : 'Start typing to find an address'
        }
        icon={images.icons.home}
      />
    );
  }, [currentValue, loading, searchText]);

  return (
    <AppBottomSheet
      visible={visible}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      icon={images.icons.home}
      snapPoints={['88%']}
      fill
      stickyHeader={
        <View style={localStyles.searchWrap}>
          <AppBottomSheetTextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder={placeholder}
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
        keyExtractor={keyExtractor}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={localStyles.list}
        contentContainerStyle={sheetStyles.scrollContent}
        renderItem={renderItem}
        ListEmptyComponent={listEmpty}
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
});

export default memo(AddressSearchModal);
