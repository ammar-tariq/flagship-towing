import React, {useContext, useState} from 'react';
import {
  Image,
  ImageSourcePropType,
  ImageStyle,
  KeyboardTypeOptions,
  ReturnKeyType,
  StyleProp,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import Animated from 'react-native-reanimated';
import styles from './styles';
import {FormikContext} from 'formik';
import AppText from '@Components/AppText';
import RequiredAsterisk from '@Components/RequiredAsterisk';
import {colors} from '@Utils/color';
import {images} from '@Assets/Images';
import PressableScale from '@Components/PressableScale';
import useServerErrorShake from '@Hooks/useServerErrorShake';
import {vh, vw, font} from '@Utils/helpers';

export type InputFieldProps = TextInputProps & {
  name?: string;
  label?: string;
  error?: string;
  leftIcon?: ImageSourcePropType;
  children?: React.ReactElement;
  rightIcon?: ImageSourcePropType;
  leftIconStyle?: StyleProp<ImageStyle>;
  rightIconStyle?: StyleProp<ImageStyle>;
  onPressRightIcon?: () => void;
  secureTextEntry?: boolean;
  eyeIconStyle?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  disabled?: boolean;
  textInputContainerStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  requiredStyle?: StyleProp<TextStyle>;
  placeholderTextColor?: string;
  onChangeText?: (value?: any) => void;
  value?: string;
  placeholder?: string;
  style?: StyleProp<TextStyle>;
  returnKeyType?: ReturnKeyType | 'default';
  multiline?: boolean;
  required?: boolean;
  keyboardType?: KeyboardTypeOptions;
};

type Ref = TextInput;

const InputField = React.forwardRef<Ref, InputFieldProps>(
  (
    {
      name,
      label,
      error,
      leftIcon,
      children,
      rightIcon,
      leftIconStyle,
      rightIconStyle,
      onPressRightIcon,
      secureTextEntry = false,
      eyeIconStyle,
      containerStyle,
      disabled,
      textInputContainerStyle,
      placeholderTextColor,
      onChangeText,
      value,
      placeholder,
      style,
      labelStyle,
      returnKeyType = 'done',
      multiline,
      keyboardType,
      required,
      requiredStyle,
      onFocus,
      onBlur,
      onSubmitEditing,
      blurOnSubmit,
      ...props
    },
    ref,
  ) => {
    const formik = useContext(FormikContext);
    const [hidden, setHidden] = useState(secureTextEntry);
    const [focused, setFocused] = useState(false);
    const shakeStyle = useServerErrorShake(name);

    const resolvedValue =
      value ??
      (name && formik?.values?.[name] != null
        ? String(formik.values[name])
        : '');

    const changeHandler = name
      ? formik
        ? onChangeText ?? formik.handleChange(name)
        : onChangeText
      : onChangeText;

    const inputProps = {
      editable: !disabled,
      ...props,
      ref,
      placeholderTextColor: placeholderTextColor
        ? placeholderTextColor
        : colors.placeholder,
      secureTextEntry: hidden,
      onChangeText: changeHandler,
      returnKeyType,
      autoCorrect: false,
      keyboardType,
      value: resolvedValue,
      placeholder: placeholder ? placeholder : '',
      multiline: Boolean(multiline),
      blurOnSubmit: blurOnSubmit ?? !multiline,
      onSubmitEditing,
      style: [
        styles.textInput,
        (leftIcon || rightIcon || secureTextEntry) ? {width: '90%' as const} : null,
        !leftIcon ? {paddingLeft: vw * 3} : null,
        leftIcon && secureTextEntry ? {width: '80%' as const} : null,
        style,
      ] as StyleProp<TextStyle>,
      onFocus: (e: any) => {
        setFocused(true);
        onFocus?.(e);
      },
      onBlur: (e: any) => {
        setFocused(false);
        onBlur?.(e);
        if (name && formik) {
          formik.handleBlur(name)(e);
        }
      },
      ...(multiline ? {textAlignVertical: 'top' as const} : {}),
    };

    const showFieldError =
      formik &&
      name &&
      Boolean(formik.errors?.[name]) &&
      (Boolean(formik.touched?.[name]) || (formik.submitCount ?? 0) > 0);
    const errorName = showFieldError ? formik.errors[name] : error ?? null;

    return (
      <View style={[styles.container, containerStyle]}>
        {label && (
          <View style={[styles.row]}>
            <AppText weight="semibold" style={[styles.label, focused && {color: 'black'}, labelStyle, {fontSize: font(16)}]}>
              {label}
            </AppText>
            {required && <RequiredAsterisk style={requiredStyle} />}
          </View>
        )}
        <Animated.View style={shakeStyle}>
          <View
            style={[
              styles.row,
              styles.textInputContainer,
              focused && {
                borderColor: colors.primary,
                borderWidth: 1,
              },
              disabled && styles.disabledContainer,
              multiline && {height: vh * 15, borderRadius: vh},
              textInputContainerStyle,
            ]}>
            {leftIcon && (
              <View style={styles.leftIcon}>
                <Image
                  style={[styles.inheritContainer, leftIconStyle]}
                  source={leftIcon}
                />
              </View>
            )}
            {children ? (
              React.cloneElement(children as React.ReactElement, inputProps)
            ) : (
              <TextInput {...inputProps} />
            )}
            {rightIcon ? (
              <PressableScale
                variant="icon"
                onPress={onPressRightIcon}
                style={[styles.eyeView]}>
                <Image
                  style={[styles.inheritContainer, rightIconStyle]}
                  source={rightIcon}
                />
              </PressableScale>
            ) : secureTextEntry ? (
              <PressableScale
                variant="icon"
                onPress={() => setHidden(!hidden)}
                hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
                style={[styles.eyeView]}>
                <Image
                  style={[styles.inheritContainer, eyeIconStyle]}
                  source={hidden ? images.icons.eye : images.icons.hideEye}
                />
              </PressableScale>
            ) : null}
          </View>

          <View style={styles.errorSlot}>
            {errorName != null ? (
              <AppText style={styles.errorText}>{String(errorName)}</AppText>
            ) : null}
          </View>
        </Animated.View>
      </View>
    );
  },
);

InputField.displayName = 'InputField';

export default React.memo(InputField);
