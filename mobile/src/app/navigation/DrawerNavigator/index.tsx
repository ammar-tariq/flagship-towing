import {GeneralParamList} from '@Types/navigation';
import React, {
  createContext,
  FC,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import {StyleSheet, View} from 'react-native';
import {DrawerActions} from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import BottomNavigator from '../BottomNavigator';
import CustomDrawer from '@Components/CustomDrawer';
import ServiceStack from '../StackNavigators/ServiceStack';
import MembershipStack from '../StackNavigators/MembershipStack';
import PrivacyStack from '../StackNavigators/PrivacyStack';
import AboutStack from '../StackNavigators/AboutStack';
import ContactStack from '../StackNavigators/ContactStack';
import FAQsStack from '../StackNavigators/FAQsStack';
import ServiceListStack from '../StackNavigators/ServiceListStack';
import MembershipTypesStack from '../StackNavigators/MemberTypesStack';
import MembershipCardStack from '../StackNavigators/MembershipCardStack';
import MemberAgreementStack from '../StackNavigators/MemberAgreementStack';
import {useDeviceLayout} from '@Hooks/useDeviceLayout';
import {navigationRef} from '@Utils/navigation';
import {colors} from '@Utils/color';

const Drawer = createDrawerNavigator<GeneralParamList>();

type DrawerBridge = {
  props: any;
  subscribe: (listener: () => void) => () => void;
  setProps: (next: any) => void;
};

const DrawerBridgeContext = createContext<DrawerBridge | null>(null);

const menuSignature = (props: any) => {
  const state = props?.state;
  if (!state) {
    return '';
  }
  const route = state.routes?.[state.index];
  const nested = route?.state;
  const nestedRoute = nested?.routes?.[nested?.index ?? 0];
  return [
    state.index,
    route?.name,
    nested?.index ?? '',
    nestedRoute?.name ?? '',
    nestedRoute?.state?.index ?? '',
  ].join(':');
};

const DrawerContent = (props: any) => {
  const bridge = useContext(DrawerBridgeContext);
  const {isDual} = useDeviceLayout();

  useLayoutEffect(() => {
    bridge?.setProps(props);
  });

  // The open fold draws its own menu column. The overlay drawer stays closed.
  if (isDual) {
    return null;
  }
  return <CustomDrawer {...props} />;
};

const SideMenu = () => {
  const bridge = useContext(DrawerBridgeContext);
  const layout = useDeviceLayout();
  const [, setVersion] = useState(0);

  useLayoutEffect(() => {
    if (!bridge) {
      return;
    }
    const unsubscribe = bridge.subscribe(() => setVersion(version => version + 1));
    if (bridge.props) {
      setVersion(version => version + 1);
    }
    return unsubscribe;
  }, [bridge]);

  if (!layout.isDual || !bridge?.props) {
    return null;
  }

  return (
    <View style={[styles.sideMenu, {width: layout.drawerWidth}]}>
      <CustomDrawer {...bridge.props} />
    </View>
  );
};

const DrawerNavigator: FC = () => {
  const layout = useDeviceLayout();
  const bridge = useMemo<DrawerBridge>(() => {
    let props: any = null;
    const listeners = new Set<() => void>();
    return {
      get props() {
        return props;
      },
      subscribe(listener) {
        listeners.add(listener);
        return () => {
          listeners.delete(listener);
        };
      },
      setProps(next) {
        const previous = props;
        props = next;
        if (menuSignature(previous) === menuSignature(next)) {
          return;
        }
        listeners.forEach(listener => listener());
      },
    };
  }, []);

  useEffect(() => {
    if (navigationRef.isReady()) {
      navigationRef.dispatch(DrawerActions.closeDrawer());
    }
  }, [layout.isDual]);

  const overlayDrawerWidth = Math.min(Math.round(layout.width * 0.82), 340);

  return (
    <DrawerBridgeContext.Provider value={bridge}>
    <View style={styles.shell}>
    <SideMenu />
    <View style={styles.content}>
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        headerTransparent: true,
        // Always an overlay. A permanent drawer stays behind as a blank
        // column after the cover screen takes over.
        drawerType: 'front',
        overlayColor: 'rgba(0,0,0,0.6)',
        swipeEnabled: !layout.isDual,
        swipeEdgeWidth: layout.isDual ? 0 : 100,
        drawerStyle: {
          width: overlayDrawerWidth,
          backgroundColor: colors.white,
          borderTopRightRadius: 20,
          borderBottomRightRadius: 20,
          overflow: 'hidden',
        },
      }}
      drawerContent={DrawerContent}>
      <Drawer.Screen name="Home" options={{ title: 'Home' }} component={BottomNavigator} />
      <Drawer.Screen name="MembershipTypesStack" options={{ title: 'Membership Types' }} component={MembershipTypesStack} />
      <Drawer.Screen name="MembershipCardStack" options={{ title: 'Membership Card' }} component={MembershipCardStack} />
      <Drawer.Screen name="MemberAgreementStack" options={{ title: 'Member Agreement' }} component={MemberAgreementStack} />

      <Drawer.Screen name="ServiceStack" options={{ title: 'Incident Logs' }} component={ServiceStack} />
      <Drawer.Screen name="MembershipStack" options={{ title: 'Membership History' }} component={MembershipStack} />
      <Drawer.Screen name="ServiceListStack" options={{ title: 'List of Services' }} component={ServiceListStack} />
      <Drawer.Screen name="PrivacyStack" options={{ title: 'Privacy Policy' }} component={PrivacyStack} />
      <Drawer.Screen name="AboutStack" options={{ title: 'About Us' }} component={AboutStack} />
      <Drawer.Screen name="ContactStack" options={{ title: 'Contact Us' }} component={ContactStack} />
      <Drawer.Screen name="FAQsStack" options={{ title: `FAQ's` }} component={FAQsStack} />
    </Drawer.Navigator>
    </View>
    </View>
    </DrawerBridgeContext.Provider>
  );
};

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  sideMenu: {
    backgroundColor: colors.white,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.border,
  },
});

export default DrawerNavigator;
