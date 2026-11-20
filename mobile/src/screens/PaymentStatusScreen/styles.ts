import {StyleSheet} from 'react-native';
import {colors} from '@Utils/color';
import {font, heightPixel, widthPixel} from '@Utils/helpers';

export const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: widthPixel(28),
    paddingVertical: heightPixel(24),
  },
  status_icon: {
    width: heightPixel(96),
    height: heightPixel(96),
    resizeMode: 'contain',
  },
  spinner_box: {
    width: heightPixel(96),
    height: heightPixel(96),
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    marginTop: heightPixel(20),
    color: colors.darkBlack,
    fontSize: font(20),
    lineHeight: heightPixel(26),
    textAlign: 'center',
  },
  body: {
    marginTop: heightPixel(10),
    color: colors.granite,
    fontSize: font(14),
    lineHeight: heightPixel(21),
    textAlign: 'center',
  },
  actions: {
    alignSelf: 'stretch',
    marginTop: heightPixel(28),
  },
  action_btn: {
    marginTop: heightPixel(10),
    height: heightPixel(50),
  },
  neutral_btn: {
    backgroundColor: colors.lightGray,
  },
  neutral_text: {
    color: colors.darkBlack,
  },
});
