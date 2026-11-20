import {Linking} from 'react-native';
import InAppBrowser from 'react-native-inappbrowser-reborn';
import {userApi} from '@Api/user';
import {store} from '@Store/index';

export type PaymentSuccessPayload = {
  vesselId?: string;
  sessionId?: string;
};

export type PaymentCancelPayload = {
  vesselId?: string;
  sessionId?: string;
};

const successListeners = new Set<(payload: PaymentSuccessPayload) => void>();
const cancelListeners = new Set<(payload: PaymentCancelPayload) => void>();

export const onPaymentSuccess = (
  callback: (payload: PaymentSuccessPayload) => void,
) => {
  successListeners.add(callback);
  return () => {
    successListeners.delete(callback);
  };
};

export const onPaymentCancel = (
  callback: (payload: PaymentCancelPayload) => void,
) => {
  cancelListeners.add(callback);
  return () => {
    cancelListeners.delete(callback);
  };
};

export const emitPaymentSuccess = (payload: PaymentSuccessPayload) => {
  successListeners.forEach(listener => listener(payload));
};

export const emitPaymentCancel = (payload: PaymentCancelPayload = {}) => {
  cancelListeners.forEach(listener => listener(payload));
};

export type CheckoutBrowserResult = {type?: string; url?: string};

/** Final outcome derived from how the checkout browser closed. */
export type CheckoutOutcome = 'success' | 'cancelled' | 'closed';

const PAYMENT_REDIRECT_SCHEME = 'flagshiptowing://payment';

/**
 * Open Stripe checkout in an auth session (system browser fallback).
 * When our success/cancel page fires the flagshiptowing://payment/... link,
 * the browser closes itself and resolves with that URL — so the app learns
 * the real redirect outcome without relying on pushes or webhooks.
 */
export const openCheckout = async (
  checkoutUrl: string,
): Promise<CheckoutBrowserResult> => {
  const available = await InAppBrowser.isAvailable();

  if (available) {
    return InAppBrowser.openAuth(checkoutUrl, PAYMENT_REDIRECT_SCHEME, {
      // iOS: skip the "wants to sign in" consent dialog (no shared cookies).
      ephemeralWebSession: true,
      dismissButtonStyle: 'close',
      preferredBarTintColor: '#0118FF',
      preferredControlTintColor: '#ffffff',
      readerMode: false,
      animated: true,
      modalEnabled: true,
      showTitle: true,
      enableUrlBarHiding: true,
      enableDefaultShare: false,
    });
  }

  await Linking.openURL(checkoutUrl);
  return {type: 'dismiss'};
};

/**
 * 'success'  — browser came back on the payment/success redirect
 * 'cancelled'— browser came back on the payment/cancel redirect
 * 'closed'   — user closed the browser before any redirect (verify via API)
 */
export const resolveCheckoutOutcome = (
  result: CheckoutBrowserResult | null,
): CheckoutOutcome => {
  if (result?.type === 'success' && result.url) {
    return result.url.toLowerCase().includes('payment/cancel')
      ? 'cancelled'
      : 'success';
  }
  return 'closed';
};

const closeCheckoutBrowser = async () => {
  try {
    if (await InAppBrowser.isAvailable()) {
      await InAppBrowser.close();
      await InAppBrowser.closeAuth();
    }
  } catch {
    // Browser may already be closed
  }
};

/** Invalidate membership-related caches and optionally confirm vessel payment. */
export const refreshMembershipAfterPayment = async (vesselId?: string) => {
  store.dispatch(
    userApi.util.invalidateTags([
      'Vessel',
      'Profile',
      'PaymentLogs',
      'Packages',
    ]),
  );

  const profileSub = store.dispatch(
    userApi.endpoints.getProfile.initiate(undefined, {forceRefetch: true}),
  );
  const vesselSub = store.dispatch(
    userApi.endpoints.getVessel.initiate(undefined, {forceRefetch: true}),
  );

  const tasks: Promise<unknown>[] = [
    Promise.resolve(profileSub).then(() => profileSub.unwrap()).catch(() => undefined),
    Promise.resolve(vesselSub).then(() => vesselSub.unwrap()).catch(() => undefined),
  ];

  let paymentSub: {unwrap: () => Promise<unknown>; unsubscribe: () => void} | null =
    null;
  if (vesselId) {
    paymentSub = store.dispatch(
      userApi.endpoints.getVesselPaymentStatus.initiate(vesselId, {
        forceRefetch: true,
      }),
    );
    tasks.push(
      Promise.resolve(paymentSub)
        .then(() => paymentSub!.unwrap())
        .catch(() => undefined),
    );
  }

  try {
    await Promise.all(tasks);
  } finally {
    profileSub.unsubscribe();
    vesselSub.unsubscribe();
    paymentSub?.unsubscribe();
  }
};

export const handlePaymentDeepLinkSuccess = async (payload: PaymentSuccessPayload) => {
  await closeCheckoutBrowser();
  await refreshMembershipAfterPayment(payload.vesselId);
  emitPaymentSuccess(payload);
};

export const handlePaymentDeepLinkCancel = async (
  payload: PaymentCancelPayload = {},
) => {
  await closeCheckoutBrowser();
  emitPaymentCancel(payload);
};
