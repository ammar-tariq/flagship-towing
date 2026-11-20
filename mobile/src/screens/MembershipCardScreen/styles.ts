import {colors} from '@Utils/color';
import {font, heightPixel, widthPixel} from '@Utils/helpers';
import {Dimensions, StyleSheet} from 'react-native';

const SCREEN_W = Dimensions.get('window').width;
/** ISO/IEC 7810 ID-1 credit card (85.60 × 53.98 mm) */
const CARD_ASPECT = 85.6 / 53.98;
const CARD_W = SCREEN_W * 0.9;
const CARD_H = Math.round(CARD_W / CARD_ASPECT);
const CARD_RADIUS = widthPixel(12);

export const styles = StyleSheet.create({
  list: {
    paddingBottom: heightPixel(24),
    alignItems: 'center',
  },
  card_wrap: {
    width: CARD_W,
    marginVertical: heightPixel(12),
  },
  card_clip: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
    backgroundColor: colors.primary,
  },
  card_pressable: {
    width: CARD_W,
    height: CARD_H,
  },
  logo_style: {
    width: CARD_W * 0.36,
    height: Math.round(CARD_W * 0.36 * 0.151),
    marginTop: heightPixel(8),
    marginBottom: heightPixel(3),
    alignSelf: 'center',
    resizeMode: 'contain',
  },
  bar_style: {
    width: '100%',
    backgroundColor: colors.white,
    height: heightPixel(22),
    alignItems: 'center',
    justifyContent: 'center',
  },
  title_style: {
    color: colors.primary,
    fontSize: font(14),
    lineHeight: heightPixel(18),
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: widthPixel(14),
    paddingTop: heightPixel(8),
    paddingBottom: heightPixel(26),
    gap: widthPixel(10),
  },
  column: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'space-evenly',
  },
  field: {
    width: '100%',
  },
  field_row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  field_label: {
    color: colors.white,
    fontSize: font(11),
    lineHeight: heightPixel(14),
  },
  field_value: {
    color: colors.white,
    fontSize: font(11),
    lineHeight: heightPixel(14),
    flexShrink: 1,
  },
  name_value: {
    color: colors.white,
    fontSize: font(13),
    lineHeight: heightPixel(16),
  },
  statusContainer: {
    position: 'absolute',
    bottom: heightPixel(8),
    left: widthPixel(14),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    zIndex: 2,
  },
  status_text: {
    color: colors.white,
    fontSize: font(11),
    lineHeight: heightPixel(14),
  },
  dot_style: {
    height: heightPixel(8),
    width: heightPixel(8),
    borderRadius: heightPixel(8),
    backgroundColor: colors.green,
    marginRight: heightPixel(5),
  },
  btn_style: {
    width: CARD_W,
    backgroundColor: 'transparent',
    height: heightPixel(38),
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: heightPixel(8),
    marginTop: heightPixel(10),
  },
  btn_text: {
    color: colors.primary,
  },
  ribbon1: {
    position: 'absolute',
    bottom: heightPixel(24),
    right: widthPixel(-24),
    width: widthPixel(100),
    height: heightPixel(8),
    backgroundColor: colors.white,
    transform: [{rotate: '135deg'}],
    zIndex: 1,
  },
  ribbon2: {
    position: 'absolute',
    bottom: heightPixel(8),
    right: widthPixel(-14),
    width: widthPixel(76),
    height: heightPixel(8),
    backgroundColor: colors.white,
    transform: [{rotate: '135deg'}],
    zIndex: 1,
  },
});
