import React, {memo} from 'react';
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native';
import {
  Edge,
  SafeAreaView,
} from 'react-native-safe-area-context';
import {colors} from '@Utils/color';

export type AppScreenProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Safe-area edges. Default top+bottom for auth-style screens. */
  edges?: Edge[];
};

function AppScreen({
  children,
  style,
  edges = ['top', 'bottom'],
}: AppScreenProps) {
  return (
    <SafeAreaView edges={edges} style={[styles.screen, style]}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
  },
});

export default memo(AppScreen);
