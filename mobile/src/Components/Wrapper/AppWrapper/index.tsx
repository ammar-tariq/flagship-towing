import {heightPixel} from '@Utils/helpers';
import {colors} from '@Utils/color';
import React, {FC, memo} from 'react';
import {StyleProp, StyleSheet, ViewStyle} from 'react-native';
import type {Edge} from 'react-native-safe-area-context';
import AppScreen from '@Components/AppScreen';
import AppScroll from '@Components/AppScroll';

type AppWrapperProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scroll?: boolean;
  /** Apply device safe-area on these edges. Default none — nav headers / tab bar usually own insets. */
  edges?: Edge[];
};

const AppWrapper: FC<AppWrapperProps> = memo(
  ({children, style, scroll = false, edges = []}) => {
    const body = scroll ? (
      <AppScroll
        style={styles.scroll_style}
        contentContainerStyle={[styles.main_style, style]}>
        {children}
      </AppScroll>
    ) : (
      children
    );

    return (
      <AppScreen
        edges={edges}
        style={[styles.screen_style, !scroll && styles.main_style, !scroll && style]}>
        {body}
      </AppScreen>
    );
  },
);

AppWrapper.displayName = 'AppWrapper';

const styles = StyleSheet.create({
  screen_style: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scroll_style: {
    flex: 1,
    backgroundColor: colors.white,
  },
  main_style: {
    padding: heightPixel(15),
    paddingTop: heightPixel(16),
    backgroundColor: colors.white,
  },
});

export default AppWrapper;
