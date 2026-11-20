import {useEffect, useRef} from 'react';
import {Linking} from 'react-native';
import Toast from 'react-native-toast-message';
import {navigationRef} from '@Utils/navigation';
import {
  handlePaymentDeepLinkCancel,
  handlePaymentDeepLinkSuccess,
} from '@Utils/paymentCompletion';
import {store} from '@Store/index';
import {promptLogin, selectIsLoggedIn, selectIsUser} from '@Store/userSlice';

const SCHEME_PREFIX = /^flagshiptowing:\/\/?/i;

function parseDeepLink(url: string | null): {
  path: string;
  params: Record<string, string>;
} | null {
  if (!url) return null;
  const trimmed = url.replace(SCHEME_PREFIX, '').replace(/^\/+/, '');
  const [pathPart, queryPart = ''] = trimmed.split('?');
  const path = (pathPart || '').split('#')[0];
  const params: Record<string, string> = {};
  if (queryPart) {
    try {
      const search = new URLSearchParams(queryPart.split('#')[0]);
      search.forEach((value, key) => {
        params[key] = value;
      });
    } catch {
      // ignore malformed query
    }
  }
  return {path: path || '', params};
}

function navigateForPath(path: string) {
  if (!navigationRef.isReady()) return false;

  const normalized = path.toLowerCase();
  const isLoggedIn = selectIsLoggedIn(store.getState());

  if (normalized === 'signin' || normalized === 'login') {
    if (isLoggedIn) {
      navigationRef.navigate('Memberships');
    } else {
      navigationRef.navigate('AuthNavigator', {screen: 'Login'});
    }
    return true;
  }

  if (
    normalized === 'become-a-member' ||
    normalized === 'membership' ||
    normalized === 'memberships' ||
    normalized === 'index.html' ||
    normalized === ''
  ) {
    if (isLoggedIn) {
      navigationRef.navigate('Memberships');
    } else {
      navigationRef.navigate('AuthNavigator', {screen: 'Signup'});
    }
    return true;
  }

  if (normalized === 'add-vessel') {
    if (selectIsUser(store.getState())) {
      navigationRef.navigate('AddVessel');
    } else if (isLoggedIn) {
      store.dispatch(promptLogin());
    } else {
      navigationRef.navigate('AuthNavigator', {screen: 'Login'});
    }
    return true;
  }

  if (normalized === 'user' || normalized === 'profile') {
    if (isLoggedIn) {
      navigationRef.navigate('AppNavigator');
    } else {
      navigationRef.navigate('AuthNavigator', {screen: 'Login'});
    }
    return true;
  }

  return false;
}

async function handlePaymentPath(
  path: string,
  params: Record<string, string>,
): Promise<boolean> {
  const normalized = path.toLowerCase();
  const vesselId = params.vessel_id || params.vesselId;
  const sessionId = params.session_id || params.sessionId;
  const isLoggedIn = selectIsLoggedIn(store.getState());

  if (normalized === 'payment/success') {
    await handlePaymentDeepLinkSuccess({vesselId, sessionId});

    if (!navigationRef.isReady()) return false;

    if (isLoggedIn) {
      navigationRef.navigate('PaymentStatus', {status: 'success', vesselId});
    } else {
      navigationRef.navigate('AuthNavigator', {screen: 'Login'});
      Toast.show({
        type: 'success',
        text1: 'Payment received',
        text2: 'Log in to see your membership status.',
      });
    }
    return true;
  }

  if (normalized === 'payment/cancel') {
    await handlePaymentDeepLinkCancel({vesselId, sessionId});

    if (!navigationRef.isReady()) return false;

    if (isLoggedIn) {
      navigationRef.navigate('PaymentStatus', {status: 'cancelled', vesselId});
    } else {
      navigationRef.navigate('AuthNavigator', {screen: 'Login'});
      Toast.show({
        type: 'error',
        text1: 'Payment cancelled',
        text2: 'No membership was activated.',
      });
    }
    return true;
  }

  return false;
}

function handleDeepLink(
  url: string | null,
  cancelledRef?: {current: boolean},
) {
  const parsed = parseDeepLink(url);
  if (!parsed) return;

  let attempts = 0;
  const tryOpen = async () => {
    if (cancelledRef?.current) return;

    const handledPayment = await handlePaymentPath(parsed.path, parsed.params);
    if (handledPayment || navigateForPath(parsed.path)) return;

    attempts += 1;
    if (attempts < 30) {
      setTimeout(tryOpen, 100);
    }
  };
  tryOpen();
}

export function useDeepLinking() {
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    Linking.getInitialURL().then(url => {
      if (!cancelledRef.current) {
        handleDeepLink(url, cancelledRef);
      }
    });

    const subscription = Linking.addEventListener('url', event => {
      handleDeepLink(event.url, cancelledRef);
    });

    return () => {
      cancelledRef.current = true;
      subscription.remove();
    };
  }, []);
}
