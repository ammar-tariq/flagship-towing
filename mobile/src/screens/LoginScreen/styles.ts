import { StyleSheet } from 'react-native';
import { colors } from '@Utils/color';
import { heightPixel, vh, vw, widthPixel } from '@Utils/helpers';

export const styles = StyleSheet.create({
  rememberText: {
    marginLeft: vw * 2,
  },
  hyperlink: {
    marginTop: heightPixel(20)
  },
  granite_text: {
    color: colors.granite
  },
  forgot_text: {
    alignSelf: 'flex-end'
  },
  scan_text: {
    width: "80%",
    textAlign: 'center'
  },
  qr_icon: {
    height: heightPixel(60),
    width: widthPixel(60),
    resizeMode: 'contain',
    marginBottom: heightPixel(15)
  },
  btn_login: {
    marginTop: heightPixel(30)
  },
  signUpContainer: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    width: "100%",
    marginVertical: heightPixel(15)
  },
  noAccountStyle: {
    color: colors.black,
  },
  signUpStyle: {
    marginLeft: widthPixel(5),
  },
  line_style: {
    width: '40%',
    flex: 1,
    height: heightPixel(1),
    backgroundColor: colors.border,
  },
});
