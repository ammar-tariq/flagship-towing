import React, {FC, memo, useContext} from 'react';
import {
  Image,
  ImageSourcePropType,
  ImageStyle,
  StyleProp,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import Animated from 'react-native-reanimated';
import AppText from '@Components/AppText';
import RequiredAsterisk from '@Components/RequiredAsterisk';
import PressableScale from '@Components/PressableScale';
import {FormikContext} from 'formik';
import styles from './styles';
import {colors} from '@Utils/color';
import {images} from '@Assets/Images';
import useServerErrorShake from '@Hooks/useServerErrorShake';
import {font} from '@Utils/helpers';

export type TouchableInputProps = {
  name?: string;
  containerStyle?: StyleProp<ViewStyle>;
  placeholder: string;
  onPress: () => void;
  value?: any;
  textInputContainerStyle?: StyleProp<TextStyle>;
  placeholderTextColor?: any;
  rightIcon?: ImageSourcePropType;
  leftIcon?: ImageSourcePropType;
  rightIconStyle?: StyleProp<ImageStyle>;
  label?: string;
  labelStyle?: StyleProp<TextStyle>;
  required?: boolean;
  requiredStyle?: StyleProp<ViewStyle>;
  textInputStyle?: StyleProp<TextStyle>;
};

const TouchableInput: FC<TouchableInputProps> = ({
  name,
  containerStyle,
  placeholder,
  onPress,
  value,
  textInputContainerStyle,
  rightIcon = images.icons.forward,
  leftIcon,
  rightIconStyle,
  label,
  labelStyle,
  required,
  requiredStyle,
  textInputStyle,
}) => {
  const formik = useContext(FormikContext);
  const shakeStyle = useServerErrorShake(name);

  const showFieldError =
    formik &&
    name &&
    Boolean(formik.errors?.[name]) &&
    (Boolean(formik.touched?.[name]) || (formik.submitCount ?? 0) > 0);
  const errorName = showFieldError ? formik.errors[name] : null;
  const displayValue = value ? String(value) : '';

  return (
    <PressableScale
      variant="soft"
      onPress={onPress}
      style={[styles.container, containerStyle]}>
      {label ? (
        <View style={styles.row}>
          <AppText weight="semibold" style={[styles.label, labelStyle, {fontSize: font(16)}]}>
            {label}
          </AppText>
          {required ? <RequiredAsterisk style={requiredStyle} /> : null}
        </View>
      ) : null}
      <Animated.View style={shakeStyle}>
        <View
          style={[
            styles.row,
            styles.textInputContainer,
            textInputContainerStyle,
          ]}>
          {leftIcon ? (
            <View style={styles.eyeView}>
              <Image
                style={[styles.leftIcon, rightIconStyle]}
                source={leftIcon}
              />
            </View>
          ) : null}
          <AppText lines={1} style={[ styles.textInput, { color: displayValue ? colors.black : colors.placeholder, }, textInputStyle, , {fontSize: font(14)}]}>
            {displayValue || placeholder}
          </AppText>
          {rightIcon ? (
            <View style={styles.eyeView}>
              <Image
                style={[styles.rightIcon, rightIconStyle]}
                source={rightIcon}
              />
            </View>
          ) : null}
        </View>

        <View style={styles.errorSlot}>
          {errorName != null ? (
            <AppText style={styles.errorText}>{String(errorName)}</AppText>
          ) : null}
        </View>
      </Animated.View>
    </PressableScale>
  );
};

export default memo(TouchableInput);
