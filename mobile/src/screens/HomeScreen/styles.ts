import { colors } from '@Utils/color';
import { heightPixel, widthPixel } from '@Utils/helpers';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  membership_card: {
    height: heightPixel(312.67),
    width: widthPixel(205),
    borderRadius: heightPixel(10),
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  membership_active_card: {
    height: heightPixel(190),
    width: '100%',
    borderRadius: heightPixel(10),
    backgroundColor: colors.primary,
    alignItems: 'center',
    marginVertical: heightPixel(5),
  },
  half_card: {
    flex: 1,
    minWidth: 0,
  },
  active_row: {
    marginVertical: 0,
    gap: widthPixel(12),
  },
  step_text: {
    color: colors.white,
    flex: 1,
    marginRight: widthPixel(12),
    lineHeight: heightPixel(25),
  },
  btn_style: {
    borderRadius: heightPixel(10),
    height: heightPixel(55),
  },
  step_forward: {
    width: widthPixel(17),
    height: heightPixel(19),
    resizeMode: 'contain',
    tintColor: colors.primary,
  },
  card_row: {
    width: '100%',
    height: '100%',
    marginVertical: 0,
    paddingHorizontal: widthPixel(16),
  },
  card_image: {
    height: heightPixel(120),
    width: '100%',
    borderRadius: heightPixel(20),
    overflow: 'hidden',
    resizeMode: 'stretch',
    marginBottom: heightPixel(10),
  },
  forward_box: {
    width: heightPixel(50),
    height: heightPixel(50),
    borderRadius: heightPixel(50),
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  map_style: {
    width: '100%',
    height: heightPixel(160),
    borderRadius: heightPixel(10),
    overflow: 'hidden',
  },
  current_text: {
    marginVertical: heightPixel(20),
  },
  card_text: {
    color: colors.white,
    maxWidth: widthPixel(96),
    textAlign: 'center',
  },
  small_card: {
    width: '100%',
    height: heightPixel(100),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: heightPixel(10),
    overflow: 'hidden',
  },

  row_style: {
    width: '84%',
    position: 'absolute',
    bottom: heightPixel(10),
  },
  status_text: {
    color: colors.white,
  },
  dot_style: {
    height: heightPixel(9.44),
    width: widthPixel(9.44),
    borderRadius: heightPixel(9.44),
    backgroundColor: colors.green,
    marginRight: heightPixel(5),
  },
  membership_text: {
    margin: heightPixel(10),
    color: colors.white,
  },
  logo_style: {
    height: heightPixel(25),
    width: widthPixel(160.43),
    marginTop: heightPixel(5),
    marginBottom: heightPixel(13),
  },
  bar_style: {
    width: '100%',
    backgroundColor: colors.white,
    height: heightPixel(30),
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar_active_style: {
    marginTop: heightPixel(20),
    alignItems: 'flex-start',
    paddingHorizontal: widthPixel(25),
  },
  title_style: {
    color: colors.primary,
  },
  forward_icon: {
    height: heightPixel(16),
    width: widthPixel(13),
    resizeMode: 'contain',
  },
  help_btn_text: {
    textDecorationLine: 'underline',
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
  },
  membership_text_spacing: {
    marginVertical: heightPixel(10),
  },
  logo_scale: {
    transform: [{scale: 1.7}],
  },
  dot_inactive: {
    backgroundColor: 'red',
  },
  map_preview: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
