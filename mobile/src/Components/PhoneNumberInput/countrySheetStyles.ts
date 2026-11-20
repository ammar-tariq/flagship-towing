import {fonts} from '@Assets/Fonts';
import {colors} from '@Utils/color';
import {font, heightPixel, widthPixel} from '@Utils/helpers';
import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  searchWrap: {
    paddingHorizontal: widthPixel(14),
    paddingBottom: heightPixel(8),
  },
  searchInput: {
    height: heightPixel(48),
    borderRadius: heightPixel(24),
    backgroundColor: colors.lightGray,
    paddingHorizontal: widthPixel(16),
    fontFamily: fonts.Hellix.regular,
    fontSize: font(14),
    color: colors.black,
  },
  list: {
    flex: 1,
  },
  flagWrap: {
    width: heightPixel(36),
    height: heightPixel(36),
    borderRadius: heightPixel(10),
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    flex: 1,
  },
  dialCode: {
    color: colors.granite,
    marginTop: heightPixel(2),
  },
  selectedMark: {
    color: colors.primary,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.placeholder,
    paddingVertical: heightPixel(24),
  },
});
