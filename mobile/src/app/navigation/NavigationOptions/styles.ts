import {colors} from '@Utils/color';
import {heightPixel, STATUSBAR_HEIGHT, widthPixel} from '@Utils/helpers';
import {StyleSheet} from 'react-native';

/** Room for heightPixel(40) nav buttons inside the header content row. */
export const HEADER_CONTENT_HEIGHT = heightPixel(56);
export const HEADER_HEIGHT = STATUSBAR_HEIGHT + HEADER_CONTENT_HEIGHT;

/** Nav button size — fits HEADER_CONTENT_HEIGHT. */
const NAV_BTN = heightPixel(40);
const NAV_ICON = heightPixel(18);

export const styles = StyleSheet.create({
  icon: {
    width: NAV_ICON,
    height: NAV_ICON,
    resizeMode: 'contain',
    tintColor: colors.primary,
    marginHorizontal: widthPixel(12),
  },
  bell_box: {
    width: NAV_BTN,
    height: NAV_BTN,
    borderRadius: NAV_BTN,
    backgroundColor: colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: widthPixel(10),
  },
  header_spacer: {
    width: NAV_BTN,
    height: NAV_BTN,
    marginHorizontal: widthPixel(10),
  },
  icon_style: {
    height: NAV_ICON,
    width: NAV_ICON,
    resizeMode: 'contain',
  },
  icon_box: {
    height: heightPixel(39),
    width: heightPixel(39),
    borderRadius: heightPixel(39),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    marginLeft: widthPixel(7),
  },
  logo: {
    width: widthPixel(160),
    height: heightPixel(24),
    resizeMode: 'contain',
    alignSelf: 'center',
  },
  bell: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  title: {
    textTransform: 'capitalize',
    maxWidth: widthPixel(200),
    textAlign: 'center',
    alignSelf: 'center',
    color: colors.darkBlack,
  },
  titleOnBanner: {
    color: colors.white,
  },
  headerTitleWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: widthPixel(200),
    alignSelf: 'center',
  },
  breadcrumb: {
    color: colors.granite,
    textAlign: 'center',
    marginTop: heightPixel(2),
  },
  header: {
    elevation: 0,
    shadowOpacity: 0,
    backgroundColor: 'white',
  },
});
