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
  noAccountStyle: {
    color: colors.black,
  },
  btn_style :{
    marginVertical : heightPixel(20)
  },
  signUpStyle: {
    marginLeft: vw * 1,
  },
});
