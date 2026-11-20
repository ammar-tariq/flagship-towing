import {colors} from '@Utils/color';
import {font, heightPixel, widthPixel} from '@Utils/helpers';
import {StyleSheet} from 'react-native';
import {HEADER_HEIGHT} from 'src/app/navigation/NavigationOptions/styles';

/** Shared Profile / Edit Profile layout tokens */
export const profileLayout = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scroll_content: {
    flexGrow: 1,
    paddingTop: HEADER_HEIGHT,
    paddingBottom: heightPixel(48),
    backgroundColor: colors.white,
  },
  content: {
    paddingHorizontal: widthPixel(20),
    paddingTop: heightPixel(16),
  },
  card: {
    backgroundColor: colors.lightGray,
    borderRadius: heightPixel(16),
    paddingHorizontal: widthPixel(16),
    paddingVertical: heightPixel(4),
    marginBottom: heightPixel(16),
  },
  form_card: {
    backgroundColor: colors.lightGray,
    borderRadius: heightPixel(16),
    paddingHorizontal: widthPixel(16),
    paddingTop: heightPixel(16),
    paddingBottom: heightPixel(8),
    marginBottom: heightPixel(16),
  },
  input_surface: {
    backgroundColor: colors.white,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: heightPixel(14),
  },
  field_icon_wrap: {
    width: heightPixel(36),
    height: heightPixel(36),
    borderRadius: heightPixel(10),
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: widthPixel(12),
  },
  field_icon: {
    height: heightPixel(16),
    width: heightPixel(16),
    resizeMode: 'contain',
    tintColor: colors.primary,
  },
  field_content: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    minHeight: heightPixel(36),
  },
  field_label: {
    color: colors.placeholder,
    fontSize: font(12),
    lineHeight: heightPixel(16),
    marginBottom: heightPixel(2),
  },
  field_value: {
    color: colors.darkBlack,
    fontSize: font(15),
    lineHeight: heightPixel(20),
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: widthPixel(48),
  },
  action_row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: heightPixel(14),
  },
  action_label: {
    flex: 1,
    color: colors.darkBlack,
    fontSize: font(15),
    marginLeft: widthPixel(12),
  },
  action_chevron: {
    width: heightPixel(12),
    height: heightPixel(12),
    resizeMode: 'contain',
    tintColor: colors.placeholder,
  },
  delete_btn: {
    alignSelf: 'center',
    paddingVertical: heightPixel(14),
    marginTop: heightPixel(8),
  },
  delete_text: {
    color: colors.red,
    fontSize: font(14),
  },
  update_btn: {
    marginVertical: 0,
  },
});
