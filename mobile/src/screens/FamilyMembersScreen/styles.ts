import {colors} from '@Utils/color';
import {font, heightPixel, widthPixel} from '@Utils/helpers';
import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.lightGray,
    paddingTop: 0,
  },
  list_content: {
    flexGrow: 1,
    paddingHorizontal: widthPixel(16),
    paddingBottom: heightPixel(28),
  },
  header_style: {
    textAlign: 'center',
    color: colors.granite,
    lineHeight: heightPixel(22),
    marginTop: heightPixel(12),
    marginBottom: heightPixel(16),
    paddingHorizontal: widthPixel(8),
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: heightPixel(14),
    marginBottom: heightPixel(12),
    paddingHorizontal: widthPixel(14),
    paddingTop: heightPixel(12),
    paddingBottom: heightPixel(14),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  card_header: {
    marginBottom: heightPixel(10),
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
    fontSize: font(12),
    lineHeight: heightPixel(16),
  },
  status_pill: {
    alignSelf: 'flex-start',
    marginTop: heightPixel(8),
    paddingHorizontal: widthPixel(8),
    paddingVertical: heightPixel(3),
    borderRadius: heightPixel(6),
    backgroundColor: colors.lightGray,
  },
  status_pill_pending: {
    backgroundColor: 'rgba(245, 166, 35, 0.15)',
  },
  status_pill_active: {
    backgroundColor: 'rgba(46, 184, 92, 0.12)',
  },
  status_text: {
    color: colors.darkBlack,
    fontSize: font(11),
    lineHeight: heightPixel(14),
    textTransform: 'capitalize',
  },
  status_text_pending: {
    color: '#B7791F',
  },
  status_text_active: {
    color: '#1F7A3F',
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
  row: {
    marginVertical: heightPixel(4),
  },
  label_text: {
    color: colors.placeholder,
    flexShrink: 0,
    maxWidth: '40%',
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
  footer: {
    paddingTop: heightPixel(8),
    paddingBottom: heightPixel(8),
    alignItems: 'center',
  },
  btn_style: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
    width: '100%',
    height: heightPixel(42),
  },
  btn_text: {
    color: colors.primary,
  },
});
