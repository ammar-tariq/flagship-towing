import React, {memo} from 'react';
import {Image, ImageSourcePropType, View} from 'react-native';
import AppText from '@Components/AppText';
import PressableScale from '@Components/PressableScale';
import {images} from '@Assets/Images';
import {sheetStyles as styles} from './styles';
import {font} from '@Utils/helpers';

type SheetOptionProps = {
  label: string;
  selected?: boolean;
  onPress: () => void;
  leadingIcon?: ImageSourcePropType;
};

const SheetOption = ({
  label,
  selected,
  onPress,
  leadingIcon,
}: SheetOptionProps) => (
  <PressableScale
    variant="soft"
    onPress={onPress}
    style={[styles.optionRow, selected && styles.optionRowSelected]}>
    {leadingIcon ? (
      <View style={styles.optionLeading}>
        <Image source={leadingIcon} style={styles.optionLeadingIcon} />
      </View>
    ) : null}
    <AppText weight={selected ? 'semibold' : 'regular'} style={[styles.optionLabel, selected && styles.optionLabelSelected, {fontSize: font(15)}]}>
      {label}
    </AppText>
    {selected ? (
      <Image source={images.icons.tick} style={styles.optionTick} />
    ) : null}
  </PressableScale>
);

export default memo(SheetOption);
