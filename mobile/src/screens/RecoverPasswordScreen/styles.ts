import {StyleSheet} from 'react-native';
import {colors} from '@Utils/color';
import {heightPixel, vh, vw} from '@Utils/helpers';

export const styles = StyleSheet.create({
  signUpContainer: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vh * 3,
    marginTop: vh,
  },
  signUpStyle: {
    marginTop: heightPixel(15)
  },

  noAccountStyle: {
    color: colors.black,
  },
});
