import React, {memo} from 'react';
import {
  Text as RNText,
  TextProps,
  StyleProp,
  TextStyle,
} from 'react-native';
import {styles} from './styles';

export type AppTextWeight = 'regular' | 'medium' | 'semibold' | 'bold';

export type AppTextProps = TextProps & {
  weight?: AppTextWeight;
  /** Maps to numberOfLines when set. */
  lines?: number;
};

function AppText({
  style,
  weight = 'regular',
  lines,
  children,
  allowFontScaling = false,
  ...rest
}: AppTextProps) {
  const weightStyle = styles[weight] ?? styles.regular;

  return (
    <RNText
      allowFontScaling={allowFontScaling}
      numberOfLines={lines ?? rest.numberOfLines}
      ellipsizeMode={
        lines != null || rest.numberOfLines != null ? 'tail' : rest.ellipsizeMode
      }
      {...rest}
      style={[styles.text, weightStyle, style as StyleProp<TextStyle>]}>
      {children}
    </RNText>
  );
}

export default memo(AppText);
