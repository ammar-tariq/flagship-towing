import React, {memo, useCallback, useEffect, useMemo, useState} from 'react';
import {View} from 'react-native';
import AppText from '@Components/AppText';
import PressableScale from '@Components/PressableScale';
import AppBottomSheet, {
  AppBottomSheetFlatList,
  AppBottomSheetTextInput,
} from '@Components/AppBottomSheet';
import {sheetStyles} from '@Components/Sheet';
import {images} from '@Assets/Images';
import {colors} from '@Utils/color';
import {heightPixel, font} from '@Utils/helpers';
import {CountryOption, filterCountries} from '@Utils/countries';
import {styles} from './countrySheetStyles';

type CountryCodeSheetProps = {
  visible: boolean;
  onClose: () => void;
  selectedCode: string;
  onSelect: (country: CountryOption) => void;
};

const CountryCodeSheet = ({
  visible,
  onClose,
  selectedCode,
  onSelect,
}: CountryCodeSheetProps) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (visible) {
      setQuery('');
    }
  }, [visible]);

  const data = useMemo(() => filterCountries(query), [query]);

  const keyExtractor = useCallback((item: CountryOption) => item.cca2, []);

  const handleSelect = useCallback(
    (item: CountryOption) => {
      onSelect(item);
      onClose();
    },
    [onClose, onSelect],
  );

  const renderItem = useCallback(
    ({item}: {item: CountryOption}) => {
      const selected = item.cca2 === selectedCode;
      return (
        <PressableScale
          variant="soft"
          onPress={() => handleSelect(item)}
          style={[
            sheetStyles.optionRow,
            selected && sheetStyles.optionRowSelected,
          ]}>
          <View style={styles.flagWrap}>
            <AppText style={{fontSize: font(20)}}>{item.flag}</AppText>
          </View>
          <View style={styles.meta}>
            <AppText
              weight={selected ? 'semibold' : 'regular'}
              style={[
                sheetStyles.optionLabel,
                selected && sheetStyles.optionLabelSelected,
                {fontSize: font(15)},
              ]}
              lines={1}>
              {item.name}
            </AppText>
            <AppText style={[styles.dialCode, {fontSize: font(12)}]}>
              +{item.callingCode}
            </AppText>
          </View>
          {selected ? (
            <AppText
              weight="semibold"
              style={[styles.selectedMark, {fontSize: font(12)}]}>
              Selected
            </AppText>
          ) : null}
        </PressableScale>
      );
    },
    [handleSelect, selectedCode],
  );

  const listFooter = useMemo(
    () => <View style={{height: heightPixel(8)}} />,
    [],
  );

  return (
    <AppBottomSheet
      visible={visible}
      onClose={onClose}
      title="Country code"
      subtitle="Search by name or dial code"
      icon={images.icons.phone}
      snapPoints={['78%']}
      fill
      stickyHeader={
        <View style={styles.searchWrap}>
          <AppBottomSheetTextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search countries"
            placeholderTextColor={colors.placeholder}
            autoCorrect={false}
            autoCapitalize="none"
            style={styles.searchInput}
            clearButtonMode="while-editing"
          />
        </View>
      }>
      <AppBottomSheetFlatList
        data={data}
        keyExtractor={keyExtractor}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.list}
        contentContainerStyle={sheetStyles.scrollContent}
        initialNumToRender={18}
        ListEmptyComponent={
          <AppText style={[styles.emptyText, {fontSize: font(14)}]}>
            No countries found
          </AppText>
        }
        renderItem={renderItem}
        ListFooterComponent={listFooter}
      />
    </AppBottomSheet>
  );
};

export default memo(CountryCodeSheet);
