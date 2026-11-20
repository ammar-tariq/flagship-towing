import {heightPixel} from '@Utils/helpers';
import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: heightPixel(15),
  },
  message_input: {
    height: heightPixel(124),
    borderRadius: heightPixel(10),
    paddingTop: heightPixel(10),
  },
  btnStyle: {
    marginVertical: heightPixel(20),
  },
});
