import {images} from '@Assets/Images';
import PressableScale from '@Components/PressableScale';
import {colors} from '@Utils/color';
import {heightPixel} from '@Utils/helpers';
import React, {FC} from 'react';
import {Image, StyleSheet} from 'react-native';

interface ICheckBox {
  active: boolean;
  onPress: () => void;
}

const CheckBox: FC<ICheckBox> = ({active, onPress}) => {
  return (
    <PressableScale
      variant="icon"
      accessibilityRole="checkbox"
      accessibilityState={{checked: active}}
      hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}
      onPress={onPress}
      style={[styles.main_style, active && styles.active]}>
      {active ? (
        <Image
          source={images.icons.tick}
          style={styles.icon_style}
          tintColor={colors.white}
        />
      ) : null}
    </PressableScale>
  );
};

const styles = StyleSheet.create({
  main_style: {
    height: heightPixel(22),
    width: heightPixel(22),
    borderRadius: heightPixel(6),
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  active: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  icon_style: {
    height: '55%',
    width: '55%',
    resizeMode: 'contain',
  },
});

export default CheckBox;
