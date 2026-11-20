import {fonts} from '@Assets/Fonts';
import {colors} from '@Utils/color';
import {font, heightPixel, widthPixel} from '@Utils/helpers';
import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  mainStyle: {
    marginTop: heightPixel(4),
    marginBottom: heightPixel(4),
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  label: {
    color: colors.darkBlack,
    marginTop: heightPixel(1),
    marginBottom: heightPixel(8),
  },
  fieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: heightPixel(56),
    borderRadius: heightPixel(30),
    backgroundColor: colors.lightGray,
    paddingLeft: widthPixel(4),
    paddingRight: widthPixel(12),
    borderWidth: 1,
    borderColor: 'transparent',
  },
  fieldContainerFocused: {
    borderColor: colors.primary,
  },
  countryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: widthPixel(10),
    height: heightPixel(54),
  },
  flag: {
    fontSize: font(18),
    marginRight: widthPixel(6),
  },
  callingCode: {
    color: colors.black,
    fontSize: font(14),
    fontFamily: fonts.Hellix.semibold,
    marginRight: widthPixel(4),
  },
  chevron: {
    width: heightPixel(10),
    height: heightPixel(10),
    resizeMode: 'contain',
    tintColor: colors.placeholder,
    transform: [{rotate: '90deg'}],
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'center',
    height: heightPixel(22),
    backgroundColor: colors.border,
    marginRight: widthPixel(4),
  },
  textInput: {
    flex: 1,
    height: heightPixel(54),
    paddingHorizontal: widthPixel(6),
    paddingVertical: 0,
    margin: 0,
    fontSize: font(14),
    fontFamily: fonts.Hellix.regular,
    color: colors.black,
    backgroundColor: 'transparent',
    textAlignVertical: 'center',
    includeFontPadding: false,
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
