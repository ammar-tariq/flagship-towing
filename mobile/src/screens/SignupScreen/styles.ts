import { colors } from '@Utils/color';
import { heightPixel, vh, vw, widthPixel } from '@Utils/helpers';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: heightPixel(15),
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  image_style: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover'
  },
  terms_style: { color: colors.black },
  terms_row: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    marginTop: heightPixel(10)
  },
  section: {
    alignSelf: 'stretch',
    marginTop: heightPixel(24),
    marginBottom: heightPixel(8),
  },
  section_header: {
    marginBottom: heightPixel(12),
  },
  terms_text: {
    marginLeft: widthPixel(5)
  },
  gallery_image: {
    height: heightPixel(20),
    width: widthPixel(26),
    resizeMode: 'contain'
  },
  image_box: {
    height: heightPixel(100),
    width: heightPixel(100),
    borderRadius: heightPixel(200),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: colors.lightGray
  },
  upload_container: {
    height: heightPixel(25),
    width: heightPixel(25),
    borderRadius: heightPixel(25),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    position: 'absolute',
    right: widthPixel(10)
  },
  upload_icon: {
    height: '45%',
    width: '45%',
    resizeMode: 'contain'
  },
  header_style: {
    marginVertical: vh,
    // backgroundColor: 'red',
  },
  row_style: {
    marginBottom: vh * 4
  },
  sub_header: {
    color: colors.granite,
    textTransform: 'capitalize',
    marginTop: heightPixel(10),
    marginBottom: heightPixel(30),
    textAlign: 'center',
    lineHeight: heightPixel(23),
    maxWidth: widthPixel(335),
  },
  link_text: {
    lineHeight: heightPixel(15)
  },
  granite_text: {
    color: colors.granite
  },
  btn_style: {
    marginVertical: vh * 3,
  },
});
