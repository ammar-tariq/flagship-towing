import React, {useEffect, useRef, useState} from 'react';
import BootSplash from 'react-native-bootsplash';
import {requestUserPermission} from '@Utils/Notification';
import {configureLocationServices} from '@Utils/locationPermission';
import {loadStoredSession, refreshSession} from '@Lib/authSession';
import {clearAuthToken} from '@Utils/secureToken';
import {setAuthTokens, signOut} from '@Store/userSlice';
import {store} from '@Store/index';
import {AppProviders} from './src/app/providers';
import { withStallion } from 'react-native-stallion';

configureLocationServices();

const BOOT_SPLASH_DELAY_MS = 1000;
const JS_SPLASH_DURATION_MS = 4000;
const NOTIFICATION_PROMPT_DELAY_MS = 800;

/**
 * Load the saved session after persist rehydrate.
 * Access tokens are short-lived, so a stored refresh token is exchanged
 * before the UI makes any API call.
 */
const hydrateAuthToken = async () => {
  try {
    const stored = await loadStoredSession();

    if (stored.refresh) {
      const outcome = await refreshSession(stored.refresh);
      if (outcome.status === 'ok') {
        store.dispatch(
          setAuthTokens({
            token: outcome.access,
            refreshToken: outcome.refresh,
          }),
        );
        return;
      }
      if (outcome.status === 'invalid') {
        await clearAuthToken();
        store.dispatch(signOut());
        return;
      }
      if (stored.access) {
        store.dispatch(
          setAuthTokens({
            token: stored.access,
            refreshToken: stored.refresh,
          }),
        );
      }
      return;
    }

    if (stored.access) {
      store.dispatch(
        setAuthTokens({token: stored.access, refreshToken: null}),
      );
    }
  } catch {
    // Keychain unavailable — user will need to log in again
  }
};

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const didRequestNotifications = useRef(false);

  // Request notifications after splash so it does not race the system location dialog.
  useEffect(() => {
    if (showSplash || didRequestNotifications.current) {
      return;
    }

    const timer = setTimeout(() => {
      didRequestNotifications.current = true;
      requestUserPermission();
    }, NOTIFICATION_PROMPT_DELAY_MS);

    return () => clearTimeout(timer);
  }, [showSplash]);

  useEffect(() => {
    let hideSplashTimer: ReturnType<typeof setTimeout>;

    const bootSplashTimer = setTimeout(async () => {
      try {
        await BootSplash.hide({fade: true});
      } finally {
        hideSplashTimer = setTimeout(() => {
          setShowSplash(false);
        }, JS_SPLASH_DURATION_MS);
      }
    }, BOOT_SPLASH_DELAY_MS);

    return () => {
      clearTimeout(bootSplashTimer);
      clearTimeout(hideSplashTimer);
    };
  }, []);

  return (
    <AppProviders showSplash={showSplash} onBeforeLift={hydrateAuthToken} />
  );
};

// export default App;
export default withStallion(App)

