import React from 'react';
import {StyleSheet} from 'react-native';
import {
  BaseToast,
  BaseToastProps,
  ErrorToast,
  SuccessToast,
} from 'react-native-toast-message';
import {colors} from '@Utils/color';
import {font, heightPixel, widthPixel} from '@Utils/helpers';

const sharedProps = (props: BaseToastProps): BaseToastProps => ({
  ...props,
  text1NumberOfLines: 2,
  text2NumberOfLines: 4,
  style: [styles.toast, props.style],
  contentContainerStyle: [styles.content, props.contentContainerStyle],
  text1Style: [styles.text1, props.text1Style],
  text2Style: [styles.text2, props.text2Style],
});

export const toastConfig = {
  success: (props: BaseToastProps) => (
    <SuccessToast
      {...sharedProps(props)}
      style={[styles.toast, {borderLeftColor: '#69C779'}, props.style]}
    />
  ),
  error: (props: BaseToastProps) => (
    <ErrorToast
      {...sharedProps(props)}
      style={[styles.toast, {borderLeftColor: '#FE6301'}, props.style]}
    />
  ),
  info: (props: BaseToastProps) => (
    <BaseToast
      {...sharedProps(props)}
      style={[styles.toast, {borderLeftColor: colors.primary}, props.style]}
    />
  ),
};

const styles = StyleSheet.create({
  toast: {
    width: '90%',
    minHeight: heightPixel(64),
    borderRadius: heightPixel(12),
    borderLeftWidth: widthPixel(4),
    paddingVertical: heightPixel(12),
    paddingHorizontal: widthPixel(4),
    marginHorizontal: widthPixel(16),
  },
  content: {
    paddingHorizontal: widthPixel(14),
    paddingVertical: heightPixel(2),
    flexShrink: 1,
  },
  text1: {
    fontSize: font(12),
    lineHeight: heightPixel(16),
    fontWeight: '600',
    color: colors.darkBlack,
    flexWrap: 'wrap',
    marginBottom: heightPixel(2),
  },
  text2: {
    fontSize: font(11),
    lineHeight: heightPixel(15),
    color: colors.granite,
    flexWrap: 'wrap',
  },
});
