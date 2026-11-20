import React, {FC, memo} from 'react';
import {ActivityIndicator, StyleProp, TextStyle, ViewStyle} from 'react-native';
import {styles} from './styles';
import AppText from '@Components/AppText';
import Row from '@Components/Row';
import PressableScale from '@Components/PressableScale';
import {font} from '@Utils/helpers';

export type ButtonProps = {
  text: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  weight?: 'regular' | 'medium' | 'bold' | 'semibold';
  secondary?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
  /** Maps to text fontSize via styles. */
  size?: number;
  active?: boolean;
  rightIcon?: boolean;
  loaderColor?: string;
  text_style?: StyleProp<TextStyle>;
};

const Button: FC<ButtonProps> = ({
  text,
  onPress,
  style,
  weight = 'semibold',
  secondary,
  isLoading,
  disabled,
  loaderColor = 'white',
  text_style,
  size = 15,
}) => {
  const isDisabled = Boolean(isLoading || disabled);

  return (
    <PressableScale
      variant="soft"
      disabled={isDisabled}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{disabled: isDisabled, busy: Boolean(isLoading)}}
      style={[
        styles.btnStyle,
        secondary && styles.secondary_style,
        isDisabled && styles.disabledStyle,
        style,
      ]}>
      {isLoading ? (
        <ActivityIndicator size={'small'} color={loaderColor} />
      ) : (
        <Row>
          <AppText
            weight={weight}
            style={[styles.textStyle, {fontSize: font(size)}, text_style]}>
            {text}
          </AppText>
        </Row>
      )}
    </PressableScale>
  );
};

export default memo(Button);
