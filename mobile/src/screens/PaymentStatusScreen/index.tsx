import React, {useCallback, useEffect, useRef, useState} from 'react';
import {ActivityIndicator, Image, View} from 'react-native';
import {useRoute} from '@react-navigation/native';
import AppScreen from '@Components/AppScreen';
import AppScroll from '@Components/AppScroll';
import AppText from '@Components/AppText';
import Button from '@Components/Button';
import {images} from '@Assets/Images';
import {colors} from '@Utils/color';
import {navigate} from '@Utils/navigation';
import {devLog} from '@Utils/devLog';
import {getApiErrorBody, showGeneralError} from '@Utils/formErrors';
import {
  onPaymentCancel,
  onPaymentSuccess,
  openCheckout,
  refreshMembershipAfterPayment,
  resolveCheckoutOutcome,
} from '@Utils/paymentCompletion';
import {
  useLazyGetVesselPaymentStatusQuery,
  useSubscribeMutation,
} from '@Api/user';
import type {GeneralScreenProps, PaymentFlowStatus} from '@Types/navigation';
import {styles} from './styles';

const POLL_INTERVAL_MS = 2500;
const POLL_ATTEMPTS_DEFAULT = 24;
const POLL_ATTEMPTS_QUICK = 3;

const sleep = (ms: number) =>
  new Promise<void>(resolve => {
    setTimeout(resolve, ms);
  });

const COPY: Record<
  Exclude<PaymentFlowStatus, 'verifying'>,
  {heading: string; body: string}
> = {
  success: {
    heading: 'Payment successful',
    body: 'Your membership is now active and your membership card is ready to use.',
  },
  cancelled: {
    heading: 'Payment cancelled',
    body: 'Checkout was closed before completing, so no membership was activated. Your vessel details are saved — you can finish your membership whenever you are ready.',
  },
  failed: {
    heading: 'Payment not confirmed',
    body: 'We could not confirm this payment yet. If you completed checkout it can take a minute to reflect — try checking again. If you paid and this does not update, contact us from the Contact Us page.',
  },
};

const PaymentStatusScreen = () => {
  const {params} = useRoute<GeneralScreenProps<'PaymentStatus'>['route']>();
  const vesselId = params?.vesselId;
  const packageId = params?.packageId;

  const [status, setStatus] = useState<PaymentFlowStatus>(
    params?.status ?? 'verifying',
  );
  const statusRef = useRef(status);
  statusRef.current = status;

  // Bumped to cancel any in-flight polling loop (new poll, deep link, unmount).
  const pollTokenRef = useRef(0);

  const [getVesselPaymentStatus] = useLazyGetVesselPaymentStatusQuery();
  const [subscribe, {isLoading: isRetrying}] = useSubscribeMutation();

  const setFinalStatus = useCallback((next: PaymentFlowStatus) => {
    pollTokenRef.current += 1;
    setStatus(next);
  }, []);

  const startPolling = useCallback(
    async (attempts: number, timeoutStatus: PaymentFlowStatus) => {
      if (!vesselId) {
        setFinalStatus('failed');
        return;
      }
      const token = ++pollTokenRef.current;
      setStatus('verifying');

      for (let attempt = 0; attempt < attempts; attempt += 1) {
        if (pollTokenRef.current !== token) {
          return;
        }
        try {
          const result = await getVesselPaymentStatus(vesselId).unwrap();
          if (result?.data?.paid || result?.data?.active) {
            if (pollTokenRef.current === token) {
              setStatus('success');
            }
            return;
          }
        } catch (error) {
          devLog('Payment status poll failed', error);
        }
        await sleep(POLL_INTERVAL_MS);
      }

      if (pollTokenRef.current === token) {
        setStatus(timeoutStatus);
      }
    },
    [vesselId, getVesselPaymentStatus, setFinalStatus],
  );

  // Deep link may arrive while this screen is open (or re-navigate with params).
  useEffect(() => {
    const offSuccess = onPaymentSuccess(() => setFinalStatus('success'));
    const offCancel = onPaymentCancel(() => {
      if (statusRef.current !== 'success') {
        setFinalStatus('cancelled');
      }
    });
    return () => {
      offSuccess();
      offCancel();
      pollTokenRef.current += 1;
    };
  }, [setFinalStatus]);

  useEffect(() => {
    if (params?.status && params.status !== 'verifying') {
      setFinalStatus(params.status);
    }
  }, [params?.status, setFinalStatus]);

  // Initial verify when opened without a settled status.
  useEffect(() => {
    if ((params?.status ?? 'verifying') === 'verifying') {
      void startPolling(POLL_ATTEMPTS_DEFAULT, 'failed');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Membership caches must reflect the new state everywhere in the app.
  useEffect(() => {
    if (status === 'success') {
      void refreshMembershipAfterPayment(vesselId);
    }
  }, [status, vesselId]);

  const handleRetry = async () => {
    if (!packageId || !vesselId) {
      navigate('Memberships');
      return;
    }
    try {
      const res = await subscribe({id: packageId, vessel_id: vesselId}).unwrap();
      const url = typeof res?.data === 'string' ? res.data : res?.data?.url;
      if (!url) {
        showGeneralError(
          'No checkout link was returned. Please try again.',
          'Unable to restart payment',
        );
        return;
      }

      setStatus('verifying');
      let browserResult: {type?: string} | null = null;
      try {
        browserResult = await openCheckout(url);
      } catch (err) {
        devLog('Retry checkout browser error', err);
        setFinalStatus('cancelled');
        showGeneralError('Please try again.', 'Could not open payment page');
        return;
      }

      if (statusRef.current === 'success') {
        return;
      }

      const outcome = resolveCheckoutOutcome(browserResult);
      if (outcome === 'success') {
        setFinalStatus('success');
        return;
      }
      if (outcome === 'cancelled') {
        setFinalStatus('cancelled');
        return;
      }
      // Closed without a redirect — the API verifies against Stripe directly.
      await startPolling(POLL_ATTEMPTS_QUICK, 'cancelled');
    } catch (error) {
      showGeneralError(
        getApiErrorBody(error).message,
        'Unable to restart payment',
      );
    }
  };

  const isVerifying = status === 'verifying';
  const copy = isVerifying ? null : COPY[status];

  return (
    <AppScreen edges={['bottom']}>
      <AppScroll contentContainerStyle={styles.container}>
        {isVerifying ? (
          <View style={styles.spinner_box}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <Image
            source={
              status === 'success' ? images.main.correct : images.main.warning
            }
            style={styles.status_icon}
          />
        )}

        <AppText weight="bold" style={styles.heading}>
          {isVerifying ? 'Confirming your payment' : copy!.heading}
        </AppText>
        <AppText weight="medium" style={styles.body}>
          {isVerifying
            ? 'Hold on a moment while we confirm your payment. Keep the app open.'
            : copy!.body}
        </AppText>

        {!isVerifying ? (
          <View style={styles.actions}>
            {status === 'success' ? (
              <Button
                text="View membership card"
                style={styles.action_btn}
                onPress={() =>
                  navigate('AppNavigator', {screen: 'MembershipCardStack'})
                }
              />
            ) : null}
            {status === 'cancelled' ? (
              <Button
                text={packageId && vesselId ? 'Try payment again' : 'View memberships'}
                isLoading={isRetrying}
                style={styles.action_btn}
                onPress={handleRetry}
              />
            ) : null}
            {status === 'failed' ? (
              <Button
                text="Check again"
                style={styles.action_btn}
                onPress={() => startPolling(POLL_ATTEMPTS_QUICK, 'failed')}
              />
            ) : null}
            <Button
              text="Back to home"
              style={[styles.action_btn, styles.neutral_btn]}
              text_style={styles.neutral_text}
              onPress={() => navigate('AppNavigator')}
            />
          </View>
        ) : null}
      </AppScroll>
    </AppScreen>
  );
};

export default PaymentStatusScreen;
