import {fonts} from '@Assets/Fonts';
import {colors} from '@Utils/color';
import {font, heightPixel, widthPixel} from '@Utils/helpers';
import {StyleSheet} from 'react-native';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: heightPixel(4),
    marginTop: heightPixel(4),
  },
  row: {
    alignItems: 'center',
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
    alignItems: 'center',
    height: heightPixel(56),
    overflow: 'hidden',
  },
  leftIcon: {
    width: '65%',
    height: '65%',
    resizeMode: 'contain',
  },
  textInput: {
    flex: 1,
    paddingHorizontal: widthPixel(10),
    fontSize: font(14),
    fontFamily: fonts.Hellix.regular,
  },
  eyeView: {
    width: widthPixel(36),
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  rightIcon: {
    width: heightPixel(12),
    height: heightPixel(12),
    resizeMode: 'contain',
    tintColor: colors.placeholder,
  },
  errorSlot: {
    minHeight: heightPixel(18),
    justifyContent: 'center',
  },
  errorText: {
    color: colors.red,
    marginTop: heightPixel(4),
    marginLeft: widthPixel(20),
    fontSize: font(12),
  },
});

export default styles;
