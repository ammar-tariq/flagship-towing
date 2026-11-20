import React, {FC, memo, useContext, useEffect, useState} from 'react';
import {
  Image,
  Keyboard,
  Pressable,
  ReturnKeyTypeOptions,
  TextInput,
  Text as RNText,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import {FormikContext} from 'formik';
import AppText from '@Components/AppText';
import RequiredAsterisk from '@Components/RequiredAsterisk';
import {images} from '@Assets/Images';
import {colors} from '@Utils/color';
import {getCountryByCode} from '@Utils/countries';
import useServerErrorShake from '@Hooks/useServerErrorShake';
import CountryCodeSheet from './CountryCodeSheet';
import {styles} from './styles';
import {StyleProp, TextStyle, ViewStyle} from 'react-native';
import {font} from '@Utils/helpers';

export type PhoneNumberInputProps = {
  required?: boolean;
  requiredStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  onChange: (e: string) => void;
  onChangeCountry?: (e: string) => void;
  name?: string;
  label?: string;
  value?: string;
  country_code?: any;
  /** National number max digits (default 10 for US). */
  maxLength?: number;
  returnKeyType?: ReturnKeyTypeOptions;
  onSubmitEditing?: () => void;
};

export const PhoneNumberInput: FC<PhoneNumberInputProps> = ({
  labelStyle,
  onChange,
  onChangeCountry,
  name,
  label,
  style,
  value,
  country_code = 'US',
  required,
  requiredStyle,
  maxLength = 10,
  returnKeyType = 'next',
  onSubmitEditing,
}) => {
  const formik = useContext(FormikContext);
  const [focused, setFocused] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [country, setCountry] = useState(() =>
    getCountryByCode(String(country_code || 'US')),
  );
  const shakeStyle = useServerErrorShake(name);

  useEffect(() => {
    setCountry(getCountryByCode(String(country_code || 'US')));
  }, [country_code]);

  const showFieldError =
    formik &&
    name &&
    Boolean(formik.errors?.[name]) &&
    (Boolean(formik.touched?.[name]) || (formik.submitCount ?? 0) > 0);
  const errorName = showFieldError ? formik.errors[name] : null;

  const handleChangeText = (text: string) => {
    const digits = (text || '').replace(/\D/g, '').slice(0, maxLength);
    onChange(digits);
    if (name && formik && (formik.submitCount ?? 0) > 0) {
      formik.setFieldTouched(name, true, false);
    }
  };

  return (
    <View style={styles.mainStyle}>
      <View style={styles.row}>
        <AppText weight="semibold" style={[styles.label, focused && {color: colors.black}, labelStyle, {fontSize: font(16)}]}>
          {label ? label : 'Phone Number'}
        </AppText>
        {required ? <RequiredAsterisk style={requiredStyle} /> : null}
      </View>

      <Animated.View style={shakeStyle}>
        <View
          style={[
            styles.fieldContainer,
            focused && styles.fieldContainerFocused,
            style,
          ]}>
          <Pressable
            onPress={() => {
              Keyboard.dismiss();
              setPickerOpen(true);
            }}
            style={styles.countryButton}
            accessibilityRole="button"
            accessibilityLabel={`Country code +${country.callingCode}`}>
            <RNText allowFontScaling={false} style={styles.flag}>
              {country.flag}
            </RNText>
            <RNText allowFontScaling={false} style={styles.callingCode}>
              +{country.callingCode}
            </RNText>
            <Image source={images.icons.forward} style={styles.chevron} />
          </Pressable>

          <View style={styles.divider} />

          <TextInput
            value={value != null ? String(value) : ''}
            onChangeText={handleChangeText}
            placeholder="Enter phone number"
            placeholderTextColor={colors.placeholder}
            keyboardType="phone-pad"
            returnKeyType={returnKeyType}
            blurOnSubmit
            maxLength={maxLength}
            onSubmitEditing={onSubmitEditing}
            underlineColorAndroid="transparent"
            selectionColor={colors.primary}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              setFocused(false);
              if (name && formik) {
                formik.setFieldTouched(name, true);
              }
            }}
            style={styles.textInput}
          />
        </View>

        <View style={styles.errorSlot}>
          {errorName != null ? (
            <AppText style={styles.errorText}>{String(errorName)}</AppText>
          ) : null}
        </View>
      </Animated.View>

      <CountryCodeSheet
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        selectedCode={country.cca2}
        onSelect={next => {
          setCountry(next);
          onChangeCountry?.(next.cca2);
        }}
      />
    </View>
  );
};

export default memo(PhoneNumberInput);
