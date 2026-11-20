import {DrawerContentScrollView} from '@react-navigation/drawer';
import {Image, View} from 'react-native';
import {images} from '@Assets/Images';
import AppText from '@Components/AppText';
import PressableScale from '@Components/PressableScale';
import DrawerItemList from './DrawerItemList';
import {toggleDrawer} from '@Utils/navigation';
import {styles} from './styles';
import {useAuthMode} from '@Hooks/useAuthMode';
import {useDeviceLayout} from '@Hooks/useDeviceLayout';
import React, {memo, useCallback, useMemo} from 'react';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {heightPixel} from '@Utils/helpers';
import {HEADER_HEIGHT} from 'src/app/navigation/NavigationOptions/styles';

const CustomDrawer = memo((props: any) => {
  const {user, isUser, requireAuth} = useAuthMode();
  const {isDual} = useDeviceLayout();
  const {top, bottom} = useSafeAreaInsets();
  const {navigation} = props;

  const greeting = useMemo(() => {
    if (user?.first_name || user?.last_name) {
      return [user?.first_name, user?.last_name].filter(Boolean).join(' ');
    }
    return isUser ? 'Member' : 'Guest';
  }, [isUser, user?.first_name, user?.last_name]);

  const subtitle = useMemo(() => {
    if (user?.email) {
      return user.email;
    }
    return isUser ? 'Signed in' : 'Browsing as guest';
  }, [isUser, user?.email]);

  const openProfile = useCallback(() => {
    requireAuth(() => {
      navigation.navigate('Home', {
        screen: 'ProfileStack',
        params: {screen: 'Profile'},
      });
    });
  }, [navigation, requireAuth]);

  return (
    <View
      style={[
        styles.root,
        isDual
          ? {paddingBottom: bottom}
          : {
              paddingTop: top + heightPixel(8),
              paddingBottom: bottom + heightPixel(8),
            },
      ]}>
      <View
        style={[
          styles.header,
          isDual && {
            height: HEADER_HEIGHT,
            paddingTop: top,
            paddingBottom: 0,
            justifyContent: 'center',
          },
        ]}>
        <View style={styles.header_top}>
          <PressableScale
            variant="soft"
            onPress={openProfile}
            style={styles.profile_row}
            accessibilityRole="button"
            accessibilityLabel="Open profile">
            <View style={styles.avatar_ring}>
              <Image
                source={images.icons.profile}
                style={styles.avatar_fallback_icon}
              />
            </View>
            <View style={styles.identity}>
              <AppText weight="semibold" lines={1} style={styles.name}>
                {greeting}
              </AppText>
              <AppText weight="medium" lines={1} style={styles.subtitle}>
                {subtitle}
              </AppText>
            </View>
          </PressableScale>
          {isDual ? null : (
            <PressableScale
              variant="icon"
              onPress={toggleDrawer}
              style={styles.close_btn}
              accessibilityRole="button"
              accessibilityLabel="Close menu">
              <Image source={images.icons.cross} style={styles.close_icon} />
            </PressableScale>
          )}
        </View>
      </View>

      <DrawerContentScrollView
        {...props}
        style={styles.scroll}
        contentContainerStyle={styles.scroll_content}
        showsVerticalScrollIndicator={false}>
        <DrawerItemList {...props} />
      </DrawerContentScrollView>
    </View>
  );
});

CustomDrawer.displayName = 'CustomDrawer';

export default CustomDrawer;
