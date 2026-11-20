import {colors} from '@Utils/color';
import {font, heightPixel, widthPixel} from '@Utils/helpers';
import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  modalContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: widthPixel(24),
  },
  dialogContainer: {
    width: '100%',
    maxWidth: widthPixel(340),
    backgroundColor: 'white',
    borderRadius: heightPixel(20),
    borderWidth: heightPixel(1.5),
    borderColor: colors.border,
    paddingTop: heightPixel(20),
    paddingBottom: heightPixel(20),
    paddingHorizontal: widthPixel(20),
    alignItems: 'center',
  },
  textStyle: {
    color: colors.granite,
    textAlign: 'center',
    alignSelf: 'stretch',
    paddingHorizontal: widthPixel(8),
  },
  heading_style: {
    marginTop: heightPixel(14),
    marginBottom: heightPixel(4),
    color: colors.darkBlack,
    fontSize: font(16),
    lineHeight: heightPixel(22),
  },
  sub_text: {
    marginTop: heightPixel(6),
    marginBottom: heightPixel(4),
    fontSize: font(13),
    lineHeight: heightPixel(19),
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    marginTop: heightPixel(18),
    gap: widthPixel(10),
  },
  actionBtn: {
    marginTop: 0,
    height: heightPixel(44),
    minWidth: 0,
  },
  actionBtnSingle: {
    flexGrow: 1,
    width: '100%',
  },
  actionBtnHalf: {
    flex: 1,
  },
});
