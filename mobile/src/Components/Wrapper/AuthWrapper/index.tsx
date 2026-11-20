import {images} from '@Assets/Images';
import AppText from '@Components/AppText';
import AppScreen from '@Components/AppScreen';
import AppScroll from '@Components/AppScroll';
import {useDeviceLayout} from '@Hooks/useDeviceLayout';
import {usesWideAuthLayout} from '@Lib/deviceLayout';
import {colors} from '@Utils/color';
import {font, heightPixel, widthPixel} from '@Utils/helpers';
import React, {FC, ReactNode} from 'react';
import {Image, StyleSheet, View} from 'react-native';

type AuthWrapperProps = {
  children: ReactNode;
  header: string;
  subheader: string;
  login?: boolean;
};

const Brand = ({
  header,
  subheader,
  wide,
  compact,
}: {
  header: string;
  subheader: string;
  wide: boolean;
  compact: boolean;
}) => (
  <>
    <Image
      source={images.main.logo}
      style={wide ? styles.logo_wide : compact ? styles.logo_compact : styles.logo}
    />
    <AppText
      weight="bold"
      style={[
        styles.header_style,
        wide && styles.header_wide,
        compact && styles.header_compact,
      ]}>
      {header}
    </AppText>
    <AppText
      style={[
        styles.sub_header,
        wide && styles.sub_header_wide,
        compact && styles.sub_header_compact,
      ]}>
      {subheader}
    </AppText>
  </>
);

const AuthWrapper: FC<AuthWrapperProps> = ({children, header, subheader}) => {
  const layout = useDeviceLayout();
  const wide = usesWideAuthLayout(layout);
  // Tall unfolded fold, Duo book posture, and tablet portrait. The hinge on a
  // foldable sits in the middle, so the logo stays in the top half and the
  // form stays in the bottom half.
  const stackedPanes = !wide && layout.isDual;
  const compact = !wide && !stackedPanes && layout.height < 520 && layout.width > layout.height;
  const form = (
    <AppScroll
      keyboardAware
      style={styles.form_scroll}
      contentContainerStyle={styles.form_scroll_content}
      extraHeight={heightPixel(16)}>
      <View style={styles.form_body}>{children}</View>
    </AppScroll>
  );

  if (wide) {
    return (
      <AppScreen edges={['top', 'bottom', 'left', 'right']} style={styles.screen}>
        <View style={styles.split}>
          <View style={styles.brand}>
            <Brand header={header} subheader={subheader} wide compact={false} />
          </View>
          {form}
        </View>
      </AppScreen>
    );
  }

  if (stackedPanes) {
    return (
      <AppScreen edges={['top', 'bottom', 'left', 'right']} style={styles.screen}>
        <View style={styles.split_vertical}>
          <View style={styles.brand_vertical}>
            <Brand header={header} subheader={subheader} wide compact={false} />
          </View>
          {form}
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen edges={['top', 'bottom']} style={styles.screen}>
      <AppScroll
        keyboardAware
        contentContainerStyle={[styles.scroll, compact && styles.scroll_compact]}
        extraHeight={heightPixel(compact ? 12 : 24)}>
        <View style={[styles.container, compact && styles.container_compact]}>
          <Brand header={header} subheader={subheader} wide={false} compact={compact} />
          <View style={styles.form_body}>{children}</View>
        </View>
      </AppScroll>
    </AppScreen>
  );
};

export default AuthWrapper;

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.white,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
  },
  scroll_compact: {
    justifyContent: 'center',
  },
  container: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 480,
    paddingHorizontal: heightPixel(15),
    paddingTop: heightPixel(24),
    paddingBottom: heightPixel(24),
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  container_compact: {
    flexGrow: 0,
    paddingTop: 8,
    paddingBottom: 12,
  },
  split: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  brand: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 36,
    paddingVertical: 24,
    backgroundColor: colors.background,
  },
  split_vertical: {
    flex: 1,
  },
  brand_vertical: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    backgroundColor: colors.background,
  },
  form_scroll: {
    flex: 1,
    backgroundColor: colors.white,
  },
  form_scroll_content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 20,
  },
  form_body: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  header_style: {
    marginTop: heightPixel(20),
    fontSize: font(32),
    lineHeight: 42,
    textAlign: 'center',
  },
  header_wide: {
    marginTop: 16,
    fontSize: 32,
    lineHeight: 40,
  },
  header_compact: {
    marginTop: 8,
    fontSize: font(26),
    lineHeight: 32,
  },
  sub_header: {
    color: colors.granite,
    textTransform: 'capitalize',
    marginTop: heightPixel(10),
    marginBottom: heightPixel(30),
    textAlign: 'center',
    lineHeight: heightPixel(23),
    maxWidth: widthPixel(335),
    fontSize: font(16),
  },
  sub_header_wide: {
    marginTop: 8,
    marginBottom: 0,
    maxWidth: 360,
    fontSize: 16,
    lineHeight: 22,
  },
  sub_header_compact: {
    marginTop: 4,
    marginBottom: 12,
    fontSize: font(14),
    lineHeight: font(18),
  },
  logo: {
    width: widthPixel(279),
    height: heightPixel(43.48),
    resizeMode: 'contain',
    marginVertical: heightPixel(20),
  },
  logo_wide: {
    width: '78%',
    maxWidth: 280,
    height: 48,
    resizeMode: 'contain',
  },
  logo_compact: {
    width: widthPixel(200),
    height: 32,
    resizeMode: 'contain',
    marginVertical: 4,
  },
});
