import {
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import React, {FC, memo} from 'react';
import {colors} from '@Utils/color';
import AppText from '@Components/AppText';
import {font} from '@Utils/helpers';

export type HyperLinkProps = {
  text: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
  underline?: boolean;
  size?: number;
  weight?: 'regular' | 'medium' | 'bold' | 'semibold';
};

const HyperLink: FC<HyperLinkProps> = ({
  text,
  onPress,
  style,
  textStyle,
  disabled,
  weight,
  size,
  underline = true,
}) => {
  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={onPress}
      activeOpacity={1}
      style={[styles.container, style]}>
      <AppText
        weight={weight || 'semibold'}
        style={[
          styles.text,
          underline && {textDecorationLine: 'underline'},
          size != null ? {fontSize: font(size)} : null,
          textStyle,
        ]}>
        {text}
      </AppText>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {},
  text: {
    color: colors.primary,
  },
});

export default memo(HyperLink);
