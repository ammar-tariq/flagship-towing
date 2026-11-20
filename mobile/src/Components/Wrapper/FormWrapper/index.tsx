import React, {FC, ReactNode} from 'react';
import {StyleSheet, View} from 'react-native';

interface IFormWrapper {
  children: ReactNode;
}

/** Lightweight layout wrapper — parent screen owns KeyboardAwareScrollView. */
const FormWrapper: FC<IFormWrapper> = ({children}) => {
  return <View style={styles.container}>{children}</View>;
};

export default FormWrapper;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignSelf: 'stretch',
  },
});
