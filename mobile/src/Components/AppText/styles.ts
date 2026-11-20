import {fonts} from '@Assets/Fonts';
import {colors} from '@Utils/color';
import {font} from '@Utils/helpers';
import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  text: {
    color: colors.darkBlack,
    fontSize: font(14),
  },
  regular: {
    fontFamily: fonts.Hellix.regular,
  },
  medium: {
    fontFamily: fonts.Hellix.medium,
  },
  bold: {
    fontFamily: fonts.Hellix.bold,
  },
  semibold: {
    fontFamily: fonts.Hellix.semibold,
  },
});
