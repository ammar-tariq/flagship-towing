import {Platform, StyleSheet} from 'react-native';

import {font, heightPixel, vh, vw, widthPixel} from '@Utils/helpers';
import {colors} from '@Utils/color';
import {fonts} from '@Assets/Fonts';
const styles = StyleSheet.create({
  container: {
    marginTop: heightPixel(4),
    marginBottom: heightPixel(4),
    width: '100%',
    zIndex: 99,
  },
  row: {
    alignItems: 'flex-start',
    flexDirection: 'row',
  },
  label: {
    color: colors.darkBlack,
    marginTop: heightPixel(1),
    marginBottom: heightPixel(8),
  },
  textInputContainer: {
    paddingHorizontal: widthPixel(8),
    borderRadius: heightPixel(30),
    backgroundColor: colors.lightGray,
    width: '100%',
    height: heightPixel(56),
  },
  disabledContainer: {
    opacity: 0.65,
  },
  leftIcon: {
    width: '10%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    paddingTop: Platform.OS == 'ios' ? 0 : heightPixel(10),
    height: '100%',
    fontSize: font(14),
    alignSelf: 'center',
    fontFamily: fonts.Hellix.regular,
    color: colors.black,
    width: '100%',
  },
  eyeView: {
    width: '10%',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  eyeImage: {
    tintColor: colors.placeholder,
    width: '65%',
    height: '65%',
    resizeMode: 'contain',
  },
  rightIcon: {
    width: '45%',
    height: '45%',
    resizeMode: 'contain',
  },
  inheritContainer: {
    width: '55%',
    height: '55%',
    resizeMode: 'contain',
    tintColor: colors.primary,
  },
  errorSlot: {
    minHeight: heightPixel(18),
    justifyContent: 'center',
  },
  errorText: {
    color: 'red',
    marginTop: heightPixel(4),
    marginLeft: widthPixel(20),
    fontSize: font(12),
  },
});
export default styles;
