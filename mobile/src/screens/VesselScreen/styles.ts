import {colors} from '@Utils/color';
import {heightPixel, widthPixel} from '@Utils/helpers';
import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  main_style: {
    flex: 1,
    backgroundColor: colors.lightGray,
    paddingTop: heightPixel(16),
  },
  list_content: {
    flexGrow: 1,
    paddingHorizontal: widthPixel(15),
    paddingBottom: heightPixel(24),
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: heightPixel(14),
    marginBottom: heightPixel(14),
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  image_style: {
    width: '100%',
    height: heightPixel(180),
    resizeMode: 'cover',
    backgroundColor: colors.brightGray,
  },
  image_placeholder: {
    width: '100%',
    height: heightPixel(140),
    backgroundColor: colors.brightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image_placeholder_icon: {
    width: heightPixel(40),
    height: heightPixel(40),
    resizeMode: 'contain',
    tintColor: colors.gray,
  },
  card_body: {
    paddingHorizontal: widthPixel(14),
    paddingTop: heightPixel(12),
    paddingBottom: heightPixel(14),
  },
  card_title_wrap: {
    flex: 1,
    minWidth: 0,
    marginRight: widthPixel(8),
  },
  card_title: {
    color: colors.darkBlack,
    lineHeight: heightPixel(22),
  },
  card_subtitle: {
    color: colors.placeholder,
    marginTop: heightPixel(2),
    fontSize: heightPixel(12),
    lineHeight: heightPixel(16),
  },
  owner_header: {
    marginBottom: heightPixel(6),
  },
  menu_btn: {
    width: heightPixel(36),
    height: heightPixel(36),
    borderRadius: heightPixel(18),
    backgroundColor: colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menu_icon: {
    height: heightPixel(16),
    width: heightPixel(16),
    resizeMode: 'contain',
    tintColor: colors.darkBlack,
    transform: [{rotate: '90deg'}],
  },
  section_divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: heightPixel(12),
  },
  section_header: {
    color: colors.darkBlack,
    marginBottom: heightPixel(4),
    lineHeight: heightPixel(22),
  },
  label_text: {
    color: colors.placeholder,
    flexShrink: 0,
    maxWidth: '42%',
    marginRight: widthPixel(12),
  },
  value_wrap: {
    flex: 1,
    minWidth: 0,
  },
  value_text: {
    textAlign: 'right',
    color: colors.darkBlack,
    lineHeight: heightPixel(20),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: heightPixel(100),
    paddingHorizontal: widthPixel(20),
  },
  emptyAddButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyAddBox: {
    backgroundColor: colors.primary,
    height: heightPixel(50),
    width: heightPixel(50),
    borderRadius: heightPixel(50),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: heightPixel(10),
  },
  emptyAddIcon: {
    width: heightPixel(25),
    height: heightPixel(25),
    resizeMode: 'contain',
    tintColor: colors.white,
  },
  footerContainer: {
    paddingVertical: heightPixel(12),
    paddingBottom: heightPixel(24),
  },
  footerButton: {
    width: '100%',
  },
});
