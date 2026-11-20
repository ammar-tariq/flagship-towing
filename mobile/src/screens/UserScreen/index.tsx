import {images} from '@Assets/Images';
import Button from '@Components/Button';
import AppText from '@Components/AppText';
import {useDeviceLayout} from '@Hooks/useDeviceLayout';
import {useAuthMode} from '@Hooks/useAuthMode';
import {usesWideAuthLayout} from '@Lib/deviceLayout';
import {colors} from '@Utils/color';
import {font, heightPixel} from '@Utils/helpers';
import {navigate} from '@Utils/navigation';
import React from 'react';
import {Image, ImageBackground, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

/** splash2.png is 1560×3377: marina at the top, solid blue below. */
const SPLASH_ASPECT = 1560 / 3377;

const Actions = ({
  onGuest,
  wide,
}: {
  onGuest: () => void;
  wide: boolean;
}) => (
  <View style={[styles.actions, wide && styles.actionsWide]}>
    <AppText
      weight="bold"
      style={[styles.titleText, wide && styles.titleWide, {fontSize: wide ? 34 : font(35)}]}>
      Join Us
    </AppText>
    <Button
      text="Sign Up"
      style={[styles.guestButton, wide && styles.buttonWide, styles.buttonFirst]}
      text_style={styles.guestButtonText}
      onPress={() => navigate('Signup')}
    />
    <Button
      text="Join as a Guest User"
      style={[styles.guestButton, wide && styles.buttonWide]}
      text_style={styles.guestButtonText}
      onPress={onGuest}
    />
    <Button
      text="Sign in with a Password"
      style={[styles.signinButton, wide && styles.buttonWide]}
      onPress={() => navigate('Login')}
    />
  </View>
);

const Marina = () => (
  <Image
    source={images.main.splash2}
    resizeMode="cover"
    style={styles.marina}
  />
);

const UserScreen = () => {
  const {enterGuest} = useAuthMode();
  const layout = useDeviceLayout();
  const insets = useSafeAreaInsets();
  const wide = usesWideAuthLayout(layout);

  if (wide) {
    return (
      <View style={styles.root}>
        <View style={styles.photoSide}>
          <Marina />
        </View>
        <View
          style={[
            styles.actionSide,
            {
              paddingRight: Math.max(28, insets.right + 12),
              paddingLeft: 28,
              paddingBottom: insets.bottom,
            },
          ]}>
          <Actions onGuest={enterGuest} wide />
        </View>
      </View>
    );
  }

  return (
    <ImageBackground source={images.main.splash2} style={styles.background}>
      <Actions onGuest={enterGuest} wide={false} />
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.primary,
  },
  background: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoSide: {
    flex: 1.15,
    overflow: 'hidden',
    backgroundColor: colors.primary,
  },
  marina: {
    width: '100%',
    aspectRatio: SPLASH_ASPECT,
  },
  actionSide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  actions: {
    width: '85%',
    maxWidth: 520,
    alignItems: 'center',
  },
  actionsWide: {
    width: '100%',
    maxWidth: 420,
  },
  titleText: {
    color: colors.white,
    marginBottom: heightPixel(10),
    lineHeight: 42,
    textAlign: 'center',
  },
  titleWide: {
    marginBottom: 16,
    lineHeight: 40,
  },
  guestButton: {
    backgroundColor: colors.white,
    width: '100%',
    marginVertical: heightPixel(15),
  },
  buttonWide: {
    marginVertical: 10,
  },
  buttonFirst: {
    marginTop: heightPixel(10),
  },
  guestButtonText: {
    color: colors.black,
  },
  signinButton: {
    borderWidth: 1,
    borderColor: colors.white,
    width: '100%',
  },
});

export default UserScreen;
