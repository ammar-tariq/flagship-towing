import {images} from '@Assets/Images';
import Button from '@Components/Button';
import {Loader} from '@Components/Loader';
import AppText from '@Components/AppText';
import AppWrapper from '@Components/Wrapper/AppWrapper';
import {formatDateToMMDDYYYY} from '@Utils/helpers';
import React, {useEffect, useMemo, useState} from 'react';
import {FlatList, Image, Platform, View} from 'react-native';
import useMembershipCard from '@Hooks/useMembershipCard';
import useAddToWallet from '@Hooks/useAddToWallet';
import {styles} from './styles';
import {colors} from '@Utils/color';
import PressableScale from '@Components/PressableScale';

const Field = ({
  label,
  value,
  lines = 1,
  emphasize,
}: {
  label?: string;
  value: string;
  lines?: number;
  emphasize?: boolean;
}) => {
  if (!label) {
    return (
      <View style={styles.field}>
        <AppText
          weight="semibold"
          style={styles.name_value}
          numberOfLines={lines}>
          {value}
        </AppText>
      </View>
    );
  }

  return (
    <View style={styles.field}>
      <View style={styles.field_row}>
        <AppText weight="semibold" style={styles.field_label}>
          {label}:{' '}
        </AppText>
        <AppText
          weight={emphasize ? 'semibold' : 'medium'}
          style={styles.field_value}
          numberOfLines={lines}>
          {value}
        </AppText>
      </View>
    </View>
  );
};

const MembershipCardScreen = () => {
  const {values} = useMembershipCard();
  const {addToWallet, removeFromWallet, checkPassInWallet, viewInWallet, isAdding} =
    useAddToWallet();

  const [passesInWallet, setPassesInWallet] = useState<{[key: string]: boolean}>(
    {},
  );

  const membershipCards = useMemo(() => {
    const active = values?.data?.active_subscriptions || [];
    const inactive = values?.data?.inactive_subscriptions || [];
    return [...active, ...inactive];
  }, [values?.data?.active_subscriptions, values?.data?.inactive_subscriptions]);

  const resolveExpiryDate = (item: any): Date | null => {
    const v = item?.vessel;
    const raw =
      (item?.source === 'offline' || item?.source === 'admin') &&
      v?.offline_membership_expires_at
        ? v.offline_membership_expires_at
        : item?.current_period_end;
    if (raw == null || raw === '') {
      return null;
    }
    const d = raw instanceof Date ? raw : new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  /** Active only for live Stripe/trialing/offline terms that have not expired. */
  const isMembershipActive = (item: any): boolean => {
    const status = String(item?.status || '').toLowerCase();
    if (status !== 'active' && status !== 'trialing') {
      return false;
    }
    const end = resolveExpiryDate(item);
    if (end && end.getTime() < Date.now()) {
      return false;
    }
    return true;
  };

  const membershipStatusLabel = (item: any) =>
    isMembershipActive(item) ? 'Active' : 'Expired';

  useEffect(() => {
    const subscriptions = values?.data?.active_subscriptions;
    if (Platform.OS !== 'ios' || !subscriptions?.length) {
      return;
    }
    let cancelled = false;
    const checkAllPasses = async () => {
      const next: {[key: string]: boolean} = {};
      for (const subscription of subscriptions) {
        if (subscription?.source === 'offline' || subscription?.source === 'admin') {
          continue;
        }
        next[subscription.id] = await checkPassInWallet(subscription);
      }
      if (cancelled) {
        return;
      }
      setPassesInWallet(prev => {
        const prevKeys = Object.keys(prev);
        const nextKeys = Object.keys(next);
        if (
          prevKeys.length === nextKeys.length &&
          nextKeys.every(key => prev[key] === next[key])
        ) {
          return prev;
        }
        return next;
      });
    };
    checkAllPasses();
    return () => {
      cancelled = true;
    };
  }, [values?.data?.active_subscriptions, checkPassInWallet]);

  const refreshPassStatus = async (subscription: any) => {
    const inWallet = await checkPassInWallet(subscription);
    setPassesInWallet(prev => ({
      ...prev,
      [subscription.id]: inWallet,
    }));
  };

  const handleAddToWallet = async (item: any) => {
    if (!isMembershipActive(item)) {
      return;
    }
    await addToWallet(item);
    await refreshPassStatus(item);
  };

  const handleRemoveFromWallet = async (item: any) => {
    await removeFromWallet(item);
    await refreshPassStatus(item);
  };

  const handleCardTap = async (item: any) => {
    if (item?.source === 'offline' || item?.source === 'admin') {
      return;
    }
    if (!isMembershipActive(item)) {
      return;
    }
    if (Platform.OS === 'ios') {
      if (passesInWallet[item.id]) {
        await viewInWallet(item);
      } else {
        await handleAddToWallet(item);
      }
    } else {
      await handleAddToWallet(item);
    }
  };

  if (values?.isLoading) {
    return <Loader />;
  }

  const show = (x: unknown) => (x == null || x === '' ? '—' : String(x));

  const renderCard = ({item}: any) => {
    const isInWallet = passesInWallet[item.id] === true;
    const v = item?.vessel;
    const membershipType = item?.name || v?.offline_membership_type || '—';
    const memberName =
      [values?.user?.first_name, values?.user?.last_name]
        .filter(Boolean)
        .join(' ')
        .trim() || '—';
    const email = values?.user?.email?.trim() || '—';
    const expiresRaw =
      (item?.source === 'offline' || item?.source === 'admin') &&
      v?.offline_membership_expires_at
        ? v.offline_membership_expires_at
        : item?.current_period_end;
    const expiresFormatted = formatDateToMMDDYYYY(expiresRaw);
    const expiresOn = expiresFormatted === '-' ? '—' : expiresFormatted;
    const active = isMembershipActive(item);

    return (
      <View style={styles.card_wrap}>
        <View style={styles.card_clip}>
          <PressableScale
            onPress={() => handleCardTap(item)}
            style={styles.card_pressable}>
            <View style={styles.ribbon1} pointerEvents="none" />
            <View style={styles.ribbon2} pointerEvents="none" />

            <Image source={images.main.whiteLogo} style={styles.logo_style} />
            <View style={styles.bar_style}>
              <AppText weight="bold" style={styles.title_style}>
                1-888-BOAT-TOW
              </AppText>
            </View>

            <View style={styles.body}>
              <View style={styles.column}>
                <Field value={memberName} />
                <Field label="Type" value={membershipType} lines={1} />
                <Field label="Registration" value={show(v?.registration)} />
                <Field label="Make" value={show(v?.make)} />
              </View>
              <View style={styles.column}>
                <Field label="Email" value={email} lines={1} />
                <Field label="Expires on" value={expiresOn} />
                <Field
                  label="Year"
                  value={v?.year != null ? String(v.year) : '—'}
                />
                <Field label="Model" value={show(v?.boat_model)} />
              </View>
            </View>

            <View style={styles.statusContainer}>
              <View
                style={[
                  styles.dot_style,
                  {
                    backgroundColor: active ? colors.green : colors.red,
                  },
                ]}
              />
              <AppText weight="semibold" style={styles.status_text}>
                {membershipStatusLabel(item)}
              </AppText>
            </View>
          </PressableScale>
        </View>

        {item?.source !== 'offline' &&
        item?.source !== 'admin' &&
        active ? (
          <Button
            loaderColor={colors.primary}
            isLoading={isAdding}
            style={styles.btn_style}
            text_style={styles.btn_text}
            text={
              Platform.OS === 'ios'
                ? isInWallet
                  ? 'Remove from Apple Wallet'
                  : 'Add to Apple Wallet'
                : 'Add to Google Wallet'
            }
            size={15}
            onPress={() => {
              if (Platform.OS === 'ios' && isInWallet) {
                handleRemoveFromWallet(item);
              } else {
                handleAddToWallet(item);
              }
            }}
          />
        ) : null}
      </View>
    );
  };

  return (
    <AppWrapper edges={['bottom']} style={{backgroundColor: 'white'}}>
      <FlatList
        showsVerticalScrollIndicator={false}
        data={membershipCards}
        renderItem={renderCard}
        keyExtractor={item => item?.id}
        contentContainerStyle={styles.list}
      />
    </AppWrapper>
  );
};

export default MembershipCardScreen;
