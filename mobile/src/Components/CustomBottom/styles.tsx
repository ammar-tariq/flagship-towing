import { colors } from '@Utils/color';
import { heightPixel, vh, vw, widthPixel } from '@Utils/helpers';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  buttonStyle: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    color: colors.blueish,
    marginTop: heightPixel(5),
  },
  labelFocused: {
    color: colors.primary,
  },
  labelBlurred: {
    color: colors.blueish,
  },
  iconFocused: {
    tintColor: colors.primary,
  },
  iconBlurred: {
    tintColor: colors.blueish,
  },
  iconStyle: {
    width: heightPixel(25),
    height: heightPixel(22),
    resizeMode: 'contain',
  },
  bar_style: {
    width: widthPixel(28),
    height: heightPixel(3),
    borderRadius: heightPixel(2),
    backgroundColor: colors.primary,
    bottom : heightPixel(1),
    position : 'absolute'
  },
  main_style: {
    // position: 'absolute',
    flexDirection: 'row',
    height: heightPixel(75),
    borderTopLeftRadius: heightPixel(20),
    borderTopRightRadius: heightPixel(20),
    backgroundColor: 'white',
    // bottom: 0,
    width: '100%',
    justifyContent: 'space-evenly',
    boxShadow: '0px 0px 15px rgba(1, 24, 255,0.1)',
  },
});
