import {images} from '@Assets/Images';
import {DialogBox} from '@Components/DialogBox';
import AppText from '@Components/AppText';
import {useDeviceLayout} from '@Hooks/useDeviceLayout';
import {Image, InteractionManager, View} from 'react-native';
import React, {memo, useEffect, useRef} from 'react';
import {useDispatch} from 'react-redux';
import useToggle from '@Hooks/useToggle';
import {useAuthMode} from '@Hooks/useAuthMode';
import {useLogoutMutation} from '@Api/user';
import {getRefreshToken} from '@Utils/secureToken';
import {resetSessionCaches} from '@Utils/resetCaches';
import PressableScale from '@Components/PressableScale';
import {styles} from './styles';

/** Match DialogBox exit animation so Modal is gone before navigator swap. */
const LOGOUT_NAV_DELAY_MS = 180;

const icons: Record<string, any> = {
  Home: images.icons.home,
  HomeStack: images.icons.home,
  VesselStack: images.icons.vessel,
  SafetyStack: images.icons.safety,
  ProfileStack: images.icons.profile,
  MembershipCard: images.icons.card,
  MembershipCardStack: images.icons.card,
  ServiceStack: images.icons.serviceLogs,
  MembershipStack: images.icons.card,
  MembershipTypesStack: images.icons.card,
  MemberAgreementStack: images.icons.card,
  ServiceListStack: images.icons.services,
  PrivacyStack: images.icons.privacy,
  ContactStack: images.icons.contact,
  AboutStack: images.icons.about,
  FAQsStack: images.icons.faqs,
};

type MenuEntry =
  | {kind: 'section'; label: string}
  | {kind: 'home'}
  | {kind: 'tab'; screen: string; label: string; guest?: boolean}
  | {kind: 'drawer'; name: string; member?: boolean; guest?: boolean};

/** Same destinations as before, grouped the way the wide layout shows them. */
const MENU: MenuEntry[] = [
  {kind: 'home'},
  {kind: 'tab', screen: 'VesselStack', label: 'Vessel', guest: true},
  {kind: 'tab', screen: 'SafetyStack', label: 'Safety'},
  {kind: 'tab', screen: 'ProfileStack', label: 'Profile', guest: true},
  {kind: 'section', label: 'Membership'},
  {kind: 'drawer', name: 'MembershipTypesStack'},
  {kind: 'drawer', name: 'MembershipCardStack', guest: true},
  {kind: 'drawer', name: 'MemberAgreementStack'},
  {kind: 'section', label: 'Services'},
  {kind: 'drawer', name: 'ServiceListStack'},
  {kind: 'drawer', name: 'ServiceStack', member: true},
  {kind: 'section', label: 'More'},
  {kind: 'drawer', name: 'MembershipStack', member: true},
  {kind: 'drawer', name: 'PrivacyStack'},
  {kind: 'drawer', name: 'AboutStack'},
  {kind: 'drawer', name: 'ContactStack'},
  {kind: 'drawer', name: 'FAQsStack'},
];

const listedDrawerRoutes = new Set(
  MENU.filter((entry): entry is Extract<MenuEntry, {kind: 'drawer'}> => {
    return entry.kind === 'drawer';
  }).map(entry => entry.name),
);

const activeTabName = (state: any): string | null => {
  const route = state.routes[state.index];
  if (!route || route.name !== 'Home') {
    return null;
  }
  const tabState = route.state;
  if (!tabState || typeof tabState.index !== 'number') {
    return 'HomeStack';
  }
  return tabState.routes[tabState.index]?.name ?? 'HomeStack';
};

type DrawerMenuProps = {
  state: any;
  descriptors: any;
  navigation: any;
  isDual: boolean;
  isGuest: boolean;
  hasUser: boolean;
  promptLogin: () => void;
};

const DrawerMenu = ({
  state,
  descriptors,
  navigation,
  isDual,
  isGuest,
  hasUser,
  promptLogin,
}: DrawerMenuProps) => {
  const tab = activeTabName(state);

  const closeOverlay = () => {
    if (!isDual) {
      navigation.closeDrawer();
    }
  };

  const openTab = (screen: string) => {
    if (tab !== screen) {
      navigation.navigate('Home', {screen});
    }
    closeOverlay();
  };

  const openDrawerRoute = (name: string) => {
    const current = state.routes[state.index]?.name;
    if (current !== name) {
      navigation.navigate(name);
    }
    closeOverlay();
  };

  const rows: React.ReactNode[] = [];

  const pushItem = (key: string, label: string, iconName: string, active: boolean, onPress: () => void) => {
    rows.push(
      <DrawerItem
        key={key}
        label={label}
        name={iconName}
        active={active}
        onPress={onPress}
      />,
    );
  };

  MENU.forEach((entry, index) => {
    if (entry.kind === 'section') {
      rows.push(
        <AppText
          key={`section-${entry.label}`}
          weight="semibold"
          style={[styles.section_label, index > 0 && styles.section_follow]}>
          {entry.label}
        </AppText>,
      );
      return;
    }

    if (entry.kind === 'home') {
      pushItem('home', 'Home', 'Home', tab === 'HomeStack', () => openTab('HomeStack'));
      return;
    }

    if (entry.kind === 'tab') {
      pushItem(entry.screen, entry.label, entry.screen, tab === entry.screen, () => {
        if (entry.guest && isGuest) {
          promptLogin();
          return;
        }
        openTab(entry.screen);
      });
      return;
    }

    const route = state.routes.find((item: any) => item.name === entry.name);
    if (!route) {
      return;
    }
    const title = descriptors[route.key]?.options?.title ?? entry.name;
    const active = state.routes[state.index]?.name === entry.name;
    pushItem(route.key, title, entry.name, active, () => {
      if ((entry.member && !hasUser) || (entry.guest && isGuest)) {
        promptLogin();
        return;
      }
      openDrawerRoute(entry.name);
    });
  });

  state.routes.forEach((route: any) => {
    if (route.name === 'Home' || listedDrawerRoutes.has(route.name)) {
      return;
    }
    const title = descriptors[route.key]?.options?.title ?? route.name;
    const active = state.routes[state.index]?.name === route.name;
    pushItem(route.key, title, route.name, active, () => openDrawerRoute(route.name));
  });

  return <>{rows}</>;
};

type DrawerItemProps = {
  label: string;
  name: string;
  active: boolean;
  onPress: () => void;
};

const DrawerItem = memo(({label, name, active, onPress}: DrawerItemProps) => {
  return (
    <PressableScale
      variant="soft"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{selected: active}}
      style={[styles.drawer_item, active && styles.drawer_item_active]}>
      <View style={[styles.icon_wrap, active && styles.icon_wrap_active]}>
        <Image
          style={[styles.icon, active && styles.icon_active]}
          source={icons[name] || images.icons.home}
        />
      </View>
      <AppText
        weight={active ? 'semibold' : 'medium'}
        style={[styles.item_label, active && styles.item_label_active]}>
        {label}
      </AppText>
    </PressableScale>
  );
});

DrawerItem.displayName = 'DrawerItem';

const DrawerItemList = ({state, descriptors, navigation}: any) => {
  const {isDual} = useDeviceLayout();
  const [visible, setVisible, toggleVisible] = useToggle();
  const logoutSafetyRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutNavRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const [logout, {isLoading}] = useLogoutMutation();
  const {user, isGuest, refreshToken, signOut, promptLogin} = useAuthMode();
  const dispatch = useDispatch();

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (logoutSafetyRef.current) {
        clearTimeout(logoutSafetyRef.current);
        logoutSafetyRef.current = null;
      }
      if (logoutNavRef.current) {
        clearTimeout(logoutNavRef.current);
        logoutNavRef.current = null;
      }
    };
  }, []);

  const clearSessionAndLeave = () => {
    resetSessionCaches(dispatch);
    signOut();
  };

  const finishLogoutUi = () => {
    if (logoutSafetyRef.current) {
      clearTimeout(logoutSafetyRef.current);
      logoutSafetyRef.current = null;
    }
    if (logoutNavRef.current) {
      clearTimeout(logoutNavRef.current);
      logoutNavRef.current = null;
    }

    // Dismiss Modal while AppNavigator is still mounted, then swap auth.
    if (mountedRef.current) {
      setVisible(false);
    }

    logoutNavRef.current = setTimeout(() => {
      logoutNavRef.current = null;
      InteractionManager.runAfterInteractions(() => {
        clearSessionAndLeave();
      });
    }, LOGOUT_NAV_DELAY_MS);
  };

  const handleLogout = async () => {
    if (!user) {
      toggleVisible();
      signOut();
      return;
    }
    logoutSafetyRef.current = setTimeout(finishLogoutUi, 12000);
    let refresh = refreshToken;
    if (!refresh) {
      try {
        refresh = await getRefreshToken();
      } catch {
        refresh = null;
      }
    }
    logout({
      refresh_token: refresh || undefined,
      refreshToken: refresh || undefined,
    })
      .unwrap()
      .catch(() => {})
      .finally(() => {
        finishLogoutUi();
      });
  };

  return (
    <View>
      <DialogBox
        onClose={toggleVisible}
        visible={visible}
        subheading="Are You Sure You Want To Logout?"
        button={[
          {
            text: 'Yes',
            onPress: handleLogout,
            isLoading,
          },
          {text: 'No', onPress: toggleVisible},
        ]}
      />

      <DrawerMenu
        state={state}
        descriptors={descriptors}
        navigation={navigation}
        isDual={isDual}
        isGuest={isGuest}
        hasUser={!!user}
        promptLogin={promptLogin}
      />

      <View style={styles.footer}>
        <PressableScale
          variant="soft"
          onPress={user ? toggleVisible : promptLogin}
          accessibilityRole="button"
          style={styles.logout_item}>
          <View
            style={[
              styles.logout_icon_wrap,
              !user && styles.signin_icon_wrap,
            ]}>
            <Image
              style={[styles.logout_icon, !user && styles.signin_icon]}
              source={user ? images.icons.logout : images.icons.profile}
            />
          </View>
          <AppText
            weight="semibold"
            style={[styles.logout_label, !user && styles.signin_label]}>
            {user ? 'Logout' : 'Sign in / Sign up'}
          </AppText>
        </PressableScale>
      </View>
    </View>
  );
};

export default DrawerItemList;
