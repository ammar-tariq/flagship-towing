import {colors} from '@Utils/color';
import {font, heightPixel, widthPixel} from '@Utils/helpers';
import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    paddingHorizontal: widthPixel(16),
    paddingBottom: heightPixel(16),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  header_top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  profile_row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    marginRight: widthPixel(8),
  },
  avatar_ring: {
    height: heightPixel(52),
    width: heightPixel(52),
    borderRadius: heightPixel(26),
    backgroundColor: colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatar: {
    height: heightPixel(52),
    width: heightPixel(52),
    borderRadius: heightPixel(26),
  },
  avatar_fallback_icon: {
    width: heightPixel(22),
    height: heightPixel(22),
    resizeMode: 'contain',
    tintColor: colors.primary,
  },
  identity: {
    flex: 1,
    minWidth: 0,
    marginLeft: widthPixel(12),
  },
  name: {
    color: colors.darkBlack,
    fontSize: font(16),
    lineHeight: heightPixel(20),
  },
  subtitle: {
    color: colors.granite,
    fontSize: font(12),
    lineHeight: heightPixel(16),
    marginTop: heightPixel(2),
  },
  close_btn: {
    width: heightPixel(36),
    height: heightPixel(36),
    borderRadius: heightPixel(18),
    backgroundColor: colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  close_icon: {
    width: heightPixel(12),
    height: heightPixel(12),
    resizeMode: 'contain',
    tintColor: colors.darkBlack,
  },
  scroll: {
    flex: 1,
  },
  scroll_content: {
    paddingHorizontal: widthPixel(12),
    paddingTop: heightPixel(12),
    paddingBottom: heightPixel(16),
  },
  section_label: {
    color: colors.placeholder,
    fontSize: font(11),
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginLeft: widthPixel(8),
    marginBottom: heightPixel(8),
    marginTop: heightPixel(4),
  },
  section_follow: {
    marginTop: heightPixel(16),
  },
  drawer_item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: heightPixel(11),
    paddingHorizontal: widthPixel(10),
    borderRadius: heightPixel(12),
    marginBottom: heightPixel(4),
  },
  drawer_item_active: {
    backgroundColor: 'rgba(1, 24, 255, 0.08)',
  },
  icon_wrap: {
    width: heightPixel(36),
    height: heightPixel(36),
    borderRadius: heightPixel(10),
    backgroundColor: colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon_wrap_active: {
    backgroundColor: 'rgba(1, 24, 255, 0.14)',
  },
  icon: {
    width: heightPixel(18),
    height: heightPixel(18),
    resizeMode: 'contain',
    tintColor: colors.darkBlack,
  },
  icon_active: {
    tintColor: colors.primary,
  },
  item_label: {
    flex: 1,
    color: colors.darkBlack,
    fontSize: font(15),
    marginLeft: widthPixel(12),
    lineHeight: heightPixel(20),
  },
  item_label_active: {
    color: colors.primary,
  },
  footer: {
    paddingHorizontal: widthPixel(12),
    paddingTop: heightPixel(8),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  logout_item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: heightPixel(12),
    paddingHorizontal: widthPixel(10),
    borderRadius: heightPixel(12),
  },
  logout_icon_wrap: {
    width: heightPixel(36),
    height: heightPixel(36),
    borderRadius: heightPixel(10),
    backgroundColor: colors.scarlet,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logout_icon: {
    width: heightPixel(18),
    height: heightPixel(18),
    resizeMode: 'contain',
    tintColor: colors.red,
  },
  logout_label: {
    flex: 1,
    color: colors.red,
    fontSize: font(15),
    marginLeft: widthPixel(12),
    lineHeight: heightPixel(20),
  },
  signin_icon_wrap: {
    backgroundColor: 'rgba(1, 24, 255, 0.08)',
  },
  signin_icon: {
    tintColor: colors.primary,
  },
  signin_label: {
    color: colors.primary,
  },
});
