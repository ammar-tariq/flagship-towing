import {colors} from '@Utils/color';
import {heightPixel, widthPixel} from '@Utils/helpers';
import {StyleSheet} from 'react-native';

/** Original design size 343×142 — keep the same ratio as width grows. */
const MEMBERSHIP_CARD_ASPECT_RATIO = 343 / 142;

export const styles = StyleSheet.create({
  list_content: {
    paddingHorizontal: widthPixel(8),
    paddingBottom: heightPixel(16),
  },
  card_pressable: {
    marginVertical: heightPixel(10),
  },
  card: {
    width: '100%',
    aspectRatio: MEMBERSHIP_CARD_ASPECT_RATIO,
    borderRadius: heightPixel(10),
    overflow: 'hidden',
    backgroundColor: colors.lightGray,
    justifyContent: 'flex-end',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  card_text: {
    color: colors.white,
    maxWidth: '85%',
  },
  card_content: {
    width: '100%',
    justifyContent: 'flex-end',
    padding: heightPixel(15),
  },
});
