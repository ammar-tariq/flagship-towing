import React, {memo, useCallback} from 'react';
import {images} from '@Assets/Images';
import {ADV_SOURCE_OPTIONS} from '@Utils/data';
import AppBottomSheet, {
  AppBottomSheetView,
} from '@Components/AppBottomSheet';
import {SheetOption, sheetStyles} from '@Components/Sheet';

export type AdvSourceOption = (typeof ADV_SOURCE_OPTIONS)[number];

interface IAdvSourcePickerModal {
  visible: boolean;
  onClose: () => void;
  onSelect: (value: AdvSourceOption) => void;
  currentValue?: string;
}

const AdvSourcePickerModal = ({
  visible,
  onClose,
  onSelect,
  currentValue,
}: IAdvSourcePickerModal) => {
  const handleSelect = useCallback(
    (option: AdvSourceOption) => {
      onSelect(option);
      onClose();
    },
    [onClose, onSelect],
  );

  return (
    <AppBottomSheet
      visible={visible}
      onClose={onClose}
      title="How did you hear about us?"
      subtitle="Select one option"
      icon={images.icons.bell}
      dynamicSizing>
      <AppBottomSheetView style={sheetStyles.scrollContent}>
        {ADV_SOURCE_OPTIONS.map(option => (
          <SheetOption
            key={option}
            label={option}
            selected={currentValue === option}
            leadingIcon={images.icons.write}
            onPress={() => handleSelect(option)}
          />
        ))}
      </AppBottomSheetView>
    </AppBottomSheet>
  );
};

export {AdvSourcePickerModal};
export default memo(AdvSourcePickerModal);
