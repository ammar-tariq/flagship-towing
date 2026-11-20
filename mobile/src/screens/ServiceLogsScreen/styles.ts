import {colors} from '@Utils/color';
import {font, heightPixel, widthPixel} from '@Utils/helpers';
import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.lightGray,
    paddingTop: heightPixel(12),
  },
  list: {
    flex: 1,
  },
  list_content: {
    flexGrow: 1,
    paddingBottom: heightPixel(12),
  },
  list_content_empty: {
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: heightPixel(14),
    marginBottom: heightPixel(12),
    paddingHorizontal: widthPixel(14),
    paddingTop: heightPixel(14),
    paddingBottom: heightPixel(14),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  row: {
    marginVertical: heightPixel(3),
  },
  label_text: {
    color: colors.placeholder,
    flexShrink: 0,
    maxWidth: '42%',
    marginRight: widthPixel(12),
    fontSize: font(13),
    lineHeight: heightPixel(18),
  },
  value_wrap: {
    flex: 1,
    minWidth: 0,
  },
  value_text: {
    textAlign: 'right',
    color: colors.darkBlack,
    fontSize: font(13),
    lineHeight: heightPixel(18),
  },
});
