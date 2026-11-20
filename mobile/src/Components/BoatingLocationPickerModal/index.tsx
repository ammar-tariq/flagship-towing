import React, {memo, useCallback} from 'react';
import {ActivityIndicator, View} from 'react-native';
import AppText from '@Components/AppText';
import AppBottomSheet, {
  AppBottomSheetScrollView,
} from '@Components/AppBottomSheet';
import {images} from '@Assets/Images';
import {colors} from '@Utils/color';
import {heightPixel, font} from '@Utils/helpers';
import {SheetOption, sheetStyles} from '@Components/Sheet';

interface IBoatingLocationPickerModal {
  visible: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
  currentValue?: string;
  options: string[];
  loading?: boolean;
  title?: string;
}

const LOADING_WRAP = {
  paddingVertical: heightPixel(40),
  alignItems: 'center' as const,
};

const BoatingLocationPickerModal = ({
  visible,
  onClose,
  onSelect,
  currentValue,
  options,
  loading = false,
  title = 'Primary boating location',
}: IBoatingLocationPickerModal) => {
  const handleSelect = useCallback(
    (option: string) => {
      onSelect(option);
      onClose();
    },
    [onClose, onSelect],
  );

  return (
    <AppBottomSheet
      visible={visible}
      onClose={onClose}
      title={title}
      subtitle="Choose your usual waters"
      icon={images.icons.ship}
      snapPoints={['70%']}
      fill>
      {loading ? (
        <View style={LOADING_WRAP}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <AppBottomSheetScrollView
          style={sheetStyles.listFlex}
          contentContainerStyle={sheetStyles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {options.length === 0 ? (
            <AppText style={[sheetStyles.emptyText, {fontSize: font(14)}]}>
              No locations available. Please try again later.
            </AppText>
          ) : (
            options.map(option => (
              <SheetOption
                key={option}
                label={option}
                selected={currentValue === option}
                leadingIcon={images.icons.vessel}
                onPress={() => handleSelect(option)}
              />
            ))
          )}
        </AppBottomSheetScrollView>
      )}
    </AppBottomSheet>
  );
};

export {BoatingLocationPickerModal};
export default memo(BoatingLocationPickerModal);
