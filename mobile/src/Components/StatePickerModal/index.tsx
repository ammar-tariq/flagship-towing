import React, {FC, memo, useCallback, useEffect, useMemo, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import Button from '@Components/Button';
import AppBottomSheet, {
  AppBottomSheetFlatList,
  AppBottomSheetTextInput,
} from '@Components/AppBottomSheet';
import {SearchEmpty, SearchResultRow, sheetStyles} from '@Components/Sheet';
import {colors} from '@Utils/color';
import {font, heightPixel, widthPixel} from '@Utils/helpers';
import {fonts} from '@Assets/Fonts';
import {images} from '@Assets/Images';
import {filterUsStates, type UsState} from '@Lib/usStates';

interface IStatePickerModal {
  visible: boolean;
  onClose: () => void;
  onStateSelect: (state: string, stateCode: string) => void;
  currentValue?: string;
}

export const StatePickerModal: FC<IStatePickerModal> = ({
  visible,
  onClose,
  onStateSelect,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (visible) {
      setQuery('');
    }
  }, [visible]);

  const states = useMemo(() => filterUsStates(query), [query]);

  const handleSelect = useCallback(
    (state: UsState) => {
      onStateSelect(state.name, state.code);
      onClose();
    },
    [onClose, onStateSelect],
  );

  const handleDone = useCallback(() => {
    const match = filterUsStates(query);
    if (match.length === 1) {
      handleSelect(match[0]);
      return;
    }
    onClose();
  }, [handleSelect, onClose, query]);

  const keyExtractor = useCallback((item: UsState) => item.code, []);

  const renderItem = useCallback(
    ({item}: {item: UsState}) => (
      <SearchResultRow
        title={item.name}
        subtitle={item.code}
        icon={images.icons.safety}
        onPress={() => handleSelect(item)}
      />
    ),
    [handleSelect],
  );

  return (
    <AppBottomSheet
      visible={visible}
      onClose={onClose}
      title="State"
      subtitle="Search and select a state"
      icon={images.icons.safety}
      snapPoints={['88%']}
      fill
      stickyHeader={
        <View style={localStyles.searchWrap}>
          <AppBottomSheetTextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name or code (e.g. FL)"
            placeholderTextColor={colors.placeholder}
            autoCorrect={false}
            autoCapitalize="words"
            autoFocus
            returnKeyType="search"
            style={localStyles.searchInput}
            clearButtonMode="while-editing"
          />
        </View>
      }
      footer={
        <Button text="Done" onPress={handleDone} style={localStyles.doneBtn} />
      }>
      <AppBottomSheetFlatList
        data={states}
        keyExtractor={keyExtractor}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={localStyles.list}
        contentContainerStyle={sheetStyles.scrollContent}
        initialNumToRender={20}
        renderItem={renderItem}
        ListEmptyComponent={
          <SearchEmpty message="No states found" icon={images.icons.safety} />
        }
      />
    </AppBottomSheet>
  );
};

const localStyles = StyleSheet.create({
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
  list: {
    flex: 1,
  },
  doneBtn: {
    width: '100%',
    marginVertical: 0,
  },
});

export default memo(StatePickerModal);
