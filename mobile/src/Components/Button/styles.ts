import { colors } from '@Utils/color';
import { heightPixel, vh, vw } from '@Utils/helpers';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  btnStyle: {
    width: '100%',
    height: heightPixel(50),
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginVertical: heightPixel(5),
    backgroundColor: colors.primary,
    borderRadius: heightPixel(40),
    overflow: 'hidden',
  },
  secondary_style: {
    backgroundColor: colors.red,
  },
  disabledStyle: {
    opacity: 0.55,
  },
  icon_style: {
    height: heightPixel(12),
    width: heightPixel(12),
    resizeMode: 'contain',
  },
  textStyle: {
    fontSize: vh * 1.8,
    color: colors.white,
    // marginRight: vw * 3,
  },
});
