import {StyleSheet} from 'react-native';
import {colors} from '@Utils/color';
import {heightPixel, vh, vw, widthPixel} from '@Utils/helpers';

export const styles = StyleSheet.create({
  signUpContainer: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vh * 3,
    marginTop: vh,
  },
  btn_continue:{
    marginTop : heightPixel(30)
  },
  resendCode: {
    alignSelf: 'flex-end',
  },
  signUpStyle : {
    marginTop : heightPixel(10)
  },

  noAccountStyle: {
    color: colors.black,
  },
  textInputContainer: {
    // marginBottom: 20,
  },
  roundedTextInput: {
    borderRadius: heightPixel(11),
    height: heightPixel(70),
    width: heightPixel(70),
    borderWidth: heightPixel(2),
  },
  error_style: {
    color: colors.red,
  },
});
