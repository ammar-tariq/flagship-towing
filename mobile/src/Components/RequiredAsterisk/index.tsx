import React from 'react';
import {StyleSheet, Text, type StyleProp, type TextStyle} from 'react-native';
import {fonts} from '@Assets/Fonts';
import {colors} from '@Utils/color';
import {font, heightPixel, widthPixel} from '@Utils/helpers';

/**
 * Required-field indicator — one color app-wide (see REQUIRED_ASTERISK_COLOR).
 * Uses RN Text so styling is not affected by the shared Text wrapper.
 */
export const REQUIRED_ASTERISK_COLOR = colors.red;

type Props = {
  style?: StyleProp<TextStyle>;
};

const RequiredAsterisk = ({style}: Props) => (
  <Text style={[styles.star, style]} allowFontScaling={false}>
    *
  </Text>
);

const styles = StyleSheet.create({
  star: {
    color: REQUIRED_ASTERISK_COLOR,
    fontSize: font(14),
    marginLeft: widthPixel(4),
    marginTop: heightPixel(1),
    fontFamily: fonts.Hellix.semibold,
  },
});

export default RequiredAsterisk;
