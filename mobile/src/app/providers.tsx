import React, {ReactNode, useMemo} from 'react';
import {StatusBar, StyleSheet} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from 'react-native-safe-area-context';
import {BottomSheetModalProvider} from '@gorhom/bottom-sheet';
import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import {DefaultTheme, NavigationContainer} from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import {colors} from '@Utils/color';
import {navigationRef} from '@Utils/navigation';
import {persistor, store} from '@Store/index';
import MainNavigator from './navigation/MainNavigator';
import SplashOverlay from '@Components/SplashOverlay';
import {toastConfig} from '@Utils/toastConfig';
import {DeviceLayoutProvider} from '@Hooks/useDeviceLayout';

type AppProvidersProps = {
  children?: ReactNode;
  showSplash: boolean;
  onBeforeLift?: () => void | Promise<void>;
};

/**
 * App-level providers: SafeArea, Redux, Persist, Navigation, Bottom sheets.
 * Auth is owned by Redux + useAuthMode — no separate AuthProvider.
 */
export function AppProviders({
  children,
  showSplash,
  onBeforeLift,
}: AppProvidersProps) {
  const navigationTheme = useMemo(
    () => ({
      ...DefaultTheme,
      colors: {...DefaultTheme.colors, background: colors.white},
    }),
    [],
  );

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <DeviceLayoutProvider style={styles.root}>
          <Provider store={store}>
            <PersistGate
              loading={null}
              persistor={persistor}
              onBeforeLift={onBeforeLift}>
              <StatusBar
                translucent
                backgroundColor={'transparent'}
                barStyle={'dark-content'}
              />
              <NavigationContainer
                ref={navigationRef}
                theme={navigationTheme}>
                {/* Provider must sit under NavigationContainer so portals stack correctly */}
                <BottomSheetModalProvider>
                  <MainNavigator />
                  <Toast config={toastConfig} />
                  {children}
                </BottomSheetModalProvider>
              </NavigationContainer>
              <SplashOverlay visible={showSplash} />
            </PersistGate>
          </Provider>
        </DeviceLayoutProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
});
