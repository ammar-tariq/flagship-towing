import React, {memo} from 'react';
import { images } from '@Assets/Images';
import { goBack, navigate, toggleDrawer } from '@Utils/navigation';
import { colors } from '@Utils/color';
import { Image, StyleSheet, View } from 'react-native';
import { styles, HEADER_HEIGHT } from './styles';
import AppText from '@Components/AppText';
import PressableScale from '@Components/PressableScale';
import { StackNavigationOptions } from '@react-navigation/stack';
import { useAuthMode } from '@Hooks/useAuthMode';
import {font} from '@Utils/helpers';
import {useDeviceLayout} from '@Hooks/useDeviceLayout';

const routes = [
  {
    route_name: 'Profile',
    title: 'My Account',
    drawer: true,
    notification: true,
  },
  {
    route_name: 'ContactUs',
    title: 'Contact Us',
    drawer: true,
  },
  {
    route_name: 'Notifications',
    title: 'Notifications',
    back: true,
  },
  {
    route_name: 'EditProfile',
    title: 'Edit Profile',
    back: true,
  },
  {
    route_name: 'ChangePassword',
    title: 'Change Password',
    back: true,
  },
  {
    route_name: 'FamilyMembers',
    title: 'Authorized Users',
    back: true,
  },
  {
    route_name: 'AddFamilyMember',
    title: 'Add Authorized User',
    back: true,
  },
  {
    route_name: 'Emergency',
    title: 'Emergency Situation',
    back: true,
  },
  {
    route_name: 'ServicesList',
    title: 'List of Services',
    back: true,
  },
  {
    route_name: 'ServiceDetail',
    title: 'Services Detail',
    back: true,
  },
  {
    route_name: 'Memberships',
    title: 'Memberships',
    back: true,
  },
  {
    route_name: 'MembershipDetail',
    title: 'Membership Detail',
    back: true,
  },
  {
    route_name: 'AddVessel',
    title: 'Add Vessel',
    back: true,
  },
  {
    route_name: 'PaymentStatus',
    title: 'Payment Status',
    back: true,
  },
  {
    route_name: 'Map',
    Image: true,
    back: true,
  },
  {
    route_name: 'WeatherUpdateDetail',
    title: 'Current Location',
    back: true,
  },
  {
    route_name: 'WeatherMap',
    title: 'View Winds',
    back: true,
  },
  {
    route_name: 'WeatherRadar',
    title: 'View Radar',
    back: true,
  },
  {
    route_name: 'Safety',
    title: 'Safety Tips',
    drawer: true,
    notification: true,
  },
  {
    route_name: 'Vessel',
    title: 'Vessel Management',
    drawer: true,
    notification: true,
  },
  {
    route_name: 'Home',
    Image: true,
    notification: true,
    drawer: true,
  },
  {
    route_name: 'DrawerNavigator',
    Image: true,
    notification: true,
    drawer: true,
  },
  {
    route_name: 'MembershipCard',
    title: 'Membership Card',
    back: true,
  },
  {
    route_name: 'ServiceLogs',
    title: 'Incident Logs',
    drawer: true,
  },
  {
    route_name: 'MembershipLogs',
    title: 'Membership History',
    drawer: true,
  },
  {
    route_name: 'MembershipTypes',
    title: 'Membership Types',
    drawer: true,
  },
  {
    route_name: 'FAQs',
    title: "FAQ's",
    drawer: true,
  },
  {
    route_name: 'PrivacyPolicy',
    title: 'Privacy Policy',
    drawer: true,
  },
  {
    route_name: 'AboutUs',
    title: 'About Us',
    drawer: true,
  },
  {
    route_name: 'TermsAndConditions',
    title: 'Terms & Conditions',
    back: true,
  },
  {
    route_name: 'MemberAgreement',
    title: 'Member Agreement',
    back: true,
  },
];

const HeaderLeft = memo(({routeName}: {routeName?: string}) => {
  const route = routes.find(item => item.route_name === routeName);
  const {isDual} = useDeviceLayout();

  if (!route) {
    return null;
  }

  // Wide layout already shows the menu, so the hamburger would do nothing.
  // Keep a spacer only when the bell is on the right, so the title stays centered.
  if (isDual && route.drawer && !route.back) {
    if (!route.notification) {
      return null;
    }
    return <View style={styles.header_spacer} />;
  }

  if (!route.back && !route.drawer) {
    return null;
  }

  return (
    <PressableScale
      variant="icon"
      style={styles.bell_box}
      onPress={route.back ? goBack : toggleDrawer}>
      <Image
        style={styles.icon}
        source={route.back ? images.icons.back : images.icons.hamburg}
      />
    </PressableScale>
  );
});

HeaderLeft.displayName = 'HeaderLeft';

const HeaderRight = memo(({routeName}: {routeName: string}) => {
  const route = routes.find(item => item.route_name === routeName);
  const {user, promptLogin} = useAuthMode();

  if (!route?.notification) {
    return null;
  }

  return (
    <PressableScale
      variant="icon"
      onPress={() => {
        if (!user?._id) {
          promptLogin();
        } else {
          navigate('Notifications');
        }
      }}
      style={styles.bell_box}>
      <Image source={images.icons.bell} style={styles.icon} />
    </PressableScale>
  );
});

const renderRight = (props: any) => (
  <HeaderRight routeName={props?.route?.name} />
);

const renderTitle = (props: any, onBanner = false) => {
  const routeName = props?.route?.name;
  let route = routes.find(item => item.route_name === routeName);
  const titleStyle = [
    styles.title,
    onBanner && styles.titleOnBanner,
    {fontSize: font(17), lineHeight: 22},
  ];

  if (routeName === 'WeatherUpdateDetail') {
    const address = props?.route?.params?.address ?? '';
    const headerSubtitle = address ? `Weather · ${address}` : 'Weather';

    return (
      <View style={styles.headerTitleWrap}>
        <AppText lines={1} weight="semibold" style={titleStyle}>
          Current Location
        </AppText>
        <AppText lines={1} weight="regular" style={[styles.breadcrumb, {fontSize: font(12)}]}>
          {headerSubtitle}
        </AppText>
      </View>
    );
  }

  if (route && route?.title) {
    return (
      <AppText lines={1} weight="semibold" style={titleStyle}>
        {route?.title}
      </AppText>
    );
  } else {
    return <Image source={images.main.logo} style={styles.logo} />;
  }
};

const profileBannerRoutes = new Set([
  'Profile',
  'EditProfile',
  'ChangePassword',
]);

const ProfileHeaderBackground = () => (
  <Image
    source={images.covers.banner}
    resizeMode="cover"
    style={[StyleSheet.absoluteFillObject, {height: HEADER_HEIGHT}]}
  />
);

const StackOptions = (props: any): StackNavigationOptions => {
  const routeName = props?.route?.name;
  const isWeatherDetail = routeName === 'WeatherUpdateDetail';
  const isProfileBanner = profileBannerRoutes.has(routeName);

  return {
    headerShown: true,
    headerShadowVisible: false,
    headerTransparent: isProfileBanner,
    headerBackground: isProfileBanner ? ProfileHeaderBackground : undefined,
    headerStyle: {
      height: HEADER_HEIGHT,
      backgroundColor: isWeatherDetail
        ? colors.lightGray
        : isProfileBanner
          ? 'transparent'
          : colors.white,
      elevation: 0,
      shadowOpacity: 0,
    },
    headerTitleContainerStyle: isWeatherDetail
      ? {paddingVertical: 2}
      : undefined,
    headerTitle: () => renderTitle(props, isProfileBanner),
    headerTitleAlign: 'center',
    headerLeft: () => <HeaderLeft routeName={routeName} />,
    headerRight: () => renderRight(props),
  };
};

export { StackOptions };
