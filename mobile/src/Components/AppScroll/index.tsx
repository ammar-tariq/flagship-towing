import React, {memo} from 'react';
import {
  ScrollView,
  ScrollViewProps,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {heightPixel} from '@Utils/helpers';

export type AppScrollProps = ScrollViewProps & {
  keyboardAware?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** KeyboardAwareScrollView-only extras */
  extraScrollHeight?: number;
  extraHeight?: number;
  enableOnAndroid?: boolean;
  enableAutomaticScroll?: boolean;
  keyboardOpeningTime?: number;
};

function AppScroll({
  style,
  contentContainerStyle,
  keyboardAware = false,
  keyboardShouldPersistTaps = 'handled',
  showsVerticalScrollIndicator = false,
  extraScrollHeight = heightPixel(100),
  extraHeight,
  enableOnAndroid = true,
  enableAutomaticScroll = true,
  keyboardOpeningTime = 0,
  children,
  ...rest
}: AppScrollProps) {
  if (keyboardAware) {
    return (
      <KeyboardAwareScrollView
        enableOnAndroid={enableOnAndroid}
        enableAutomaticScroll={enableAutomaticScroll}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        keyboardOpeningTime={keyboardOpeningTime}
        extraScrollHeight={extraScrollHeight}
        extraHeight={extraHeight}
        {...rest}
        style={[styles.flex, style]}
        contentContainerStyle={[styles.content, contentContainerStyle]}>
        {children}
      </KeyboardAwareScrollView>
    );
  }

  return (
    <ScrollView
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      {...rest}
      style={[styles.flex, style]}
      contentContainerStyle={[styles.content, contentContainerStyle]}>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  content: {flexGrow: 1},
});

export default memo(AppScroll);
