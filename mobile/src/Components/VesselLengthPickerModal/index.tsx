import React, {memo, useCallback, useEffect, useMemo, useState} from 'react';
import {ListRenderItem, StyleSheet, View} from 'react-native';
import {fonts} from '@Assets/Fonts';
import {images} from '@Assets/Images';
import {colors} from '@Utils/color';
import {font, heightPixel, widthPixel} from '@Utils/helpers';
import AppText from '@Components/AppText';
import AppBottomSheet, {
  AppBottomSheetFlatList,
  AppBottomSheetTextInput,
} from '@Components/AppBottomSheet';
import {SheetOption, sheetStyles} from '@Components/Sheet';

interface IVesselLengthPickerModal {
  visible: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
  currentValue?: string;
}

const MAX_LENGTH_FT = 50;
const LENGTHS = Array.from({length: MAX_LENGTH_FT}, (_, i) => String(i + 1));
const LIST_FOOTER = <View style={{height: heightPixel(8)}} />;
const ITEM_HEIGHT = heightPixel(52);

const VesselLengthPickerModal = ({
  visible,
  onClose,
  onSelect,
  currentValue,
}: IVesselLengthPickerModal) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!visible) {
      setQuery('');
    }
  }, [visible]);

  const filteredLengths = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      return LENGTHS;
    }
    return LENGTHS.filter(item => item.startsWith(trimmed));
  }, [query]);

  const handleSelect = useCallback(
    (value: string) => {
      onSelect(value);
      onClose();
    },
    [onClose, onSelect],
  );

  const keyExtractor = useCallback((item: string) => item, []);

  const getItemLayout = useCallback(
    (_: ArrayLike<string> | null | undefined, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    [],
  );

  const renderItem: ListRenderItem<string> = useCallback(
    ({item}) => (
      <SheetOption
        label={`${item} ft`}
        selected={currentValue === item}
        leadingIcon={images.icons.vessel}
        onPress={() => handleSelect(item)}
      />
    ),
    [currentValue, handleSelect],
  );

  return (
    <AppBottomSheet
      visible={visible}
      onClose={onClose}
      title="Vessel length"
      subtitle="1 to 50 feet"
      icon={images.icons.vessel}
      snapPoints={['70%']}
      fill
      stickyHeader={
        <View style={styles.searchWrap}>
          <AppBottomSheetTextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search length (1–50)"
            placeholderTextColor={colors.placeholder}
            keyboardType="number-pad"
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="done"
            clearButtonMode="while-editing"
            style={styles.searchInput}
          />
        </View>
      }>
      <AppBottomSheetFlatList
        data={filteredLengths}
        keyExtractor={keyExtractor}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator
        style={sheetStyles.listFlex}
        contentContainerStyle={sheetStyles.scrollContent}
        initialNumToRender={16}
        getItemLayout={query.trim() ? undefined : getItemLayout}
        renderItem={renderItem}
        ListFooterComponent={LIST_FOOTER}
        ListEmptyComponent={
          <AppText style={[styles.emptyText, {fontSize: font(14)}]}>
            No matching lengths
          </AppText>
        }
      />
    </AppBottomSheet>
  );
};

const styles = StyleSheet.create({
  searchWrap: {
    paddingHorizontal: widthPixel(14),
    paddingBottom: heightPixel(8),
  },
  searchInput: {
    height: heightPixel(48),
    borderRadius: heightPixel(24),
    backgroundColor: colors.lightGray,
    paddingHorizontal: widthPixel(16),
    fontFamily: fonts.Hellix.regular,
    fontSize: font(14),
    color: colors.black,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.placeholder,
    paddingVertical: heightPixel(24),
  },
});

export {VesselLengthPickerModal};
export default memo(VesselLengthPickerModal);
