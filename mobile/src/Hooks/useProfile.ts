import {useEffect, useRef, useState} from 'react';
import {InteractionManager} from 'react-native';
import {CommonActions} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import useToggle from '@Hooks/useToggle';
import {
  useDeleteAccountMutation,
  useLazyGetDeletePreviewQuery,
} from '@Api/user';
import {selectUserProfile, signOut} from '@Store/userSlice';
import {navigationRef} from '@Utils/navigation';
import {resetSessionCaches} from '@Utils/resetCaches';
import {getApiErrorBody, showGeneralError} from '@Utils/formErrors';
import type {DeleteAccountPreview, DeleteAccountRequest} from '@Types/api/user';
import Toast from 'react-native-toast-message';

/** Let the warning modal finish closing before the password step. */
const PASSWORD_MODAL_DELAY_MS = 450;
/** Match DialogBox exit animation before navigator swap. */
const DELETE_NAV_DELAY_MS = 180;

const expiryWhen = (days: number) => {
  if (days <= 0) {
    return 'today';
  }
  if (days === 1) {
    return 'in 1 day';
  }
  return `in ${days} days`;
};

export const buildDeleteWarning = (preview: DeleteAccountPreview | null) => {
  if (preview?.has_active_membership) {
    const count = preview.active_membership_count || 1;
    const days = preview.days_remaining;
    let lead = 'You have a running membership.';
    if (typeof days === 'number') {
      const when = expiryWhen(days);
      lead =
        count > 1
          ? `You have running memberships. Your latest membership expires ${when}.`
          : `You have a running membership that expires ${when}.`;
    } else if (count > 1) {
      lead =
        'You have running memberships. Your latest membership is still active.';
    }
    const cancelled =
      count > 1 ? 'those memberships' : 'that membership';
    return {
      heading: 'Running membership',
      message: `${lead} Deleting your account cancels ${cancelled} and you will lose access to Flagship Towing services, your vessels, and the app. This cannot be undone.`,
    };
  }

  return {
    heading: 'Delete account',
    message:
      'If you delete your account, you will lose access to the Flagship Towing app. Your profile and related data will be permanently removed. This cannot be undone.',
  };
};

const conflictPreview = (err: unknown): DeleteAccountPreview | null => {
  if (!err || typeof err !== 'object') {
    return null;
  }
  const data = (err as {data?: Record<string, unknown>}).data;
  if (!data || data.code !== 'ACTIVE_MEMBERSHIP') {
    return null;
  }
  const count = Number(data.active_membership_count);
  const days = data.days_remaining;
  return {
    has_active_membership: true,
    has_expired_membership: false,
    active_membership_count: Number.isFinite(count) && count > 0 ? count : 1,
    days_remaining: typeof days === 'number' ? days : null,
    requires_password: data.requires_password !== false,
  };
};

const useProfile = () => {
  const dispatch = useDispatch();
  const [modal, setModal, toggleModal] = useToggle();
  const [passwordModal, setPasswordModal] = useState(false);
  const [preview, setPreview] = useState<DeleteAccountPreview | null>(null);
  const [confirmValue, setConfirmValue] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [checking, setChecking] = useState(false);
  const passwordModalTimer = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (passwordModalTimer.current) {
        clearTimeout(passwordModalTimer.current);
      }
      if (leaveTimer.current) {
        clearTimeout(leaveTimer.current);
      }
    };
  }, []);

  const user = useSelector(selectUserProfile);
  const [deleteAccount, {isLoading}] = useDeleteAccountMutation();
  const [fetchDeletePreview] = useLazyGetDeletePreviewQuery();

  const clearSessionAndLeave = () => {
    resetSessionCaches(dispatch);
    dispatch(signOut());
    requestAnimationFrame(() => {
      if (!navigationRef.isReady()) {
        return;
      }
      navigationRef.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            {
              name: 'AuthNavigator',
              state: {
                routes: [{name: 'Login'}],
                index: 0,
              },
            },
          ],
        }),
      );
    });
  };

  const closePasswordModal = () => {
    if (passwordModalTimer.current) {
      clearTimeout(passwordModalTimer.current);
      passwordModalTimer.current = null;
    }
    setPasswordModal(false);
    setConfirmValue('');
    setConfirmError('');
  };

  const onDeleteSuccess = (hadActiveMembership: boolean) => {
    if (passwordModalTimer.current) {
      clearTimeout(passwordModalTimer.current);
      passwordModalTimer.current = null;
    }
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }

    if (mountedRef.current) {
      setModal(false);
      setPasswordModal(false);
      setConfirmValue('');
      setConfirmError('');
    }

    Toast.show({
      text1: 'Account deleted',
      text2: hadActiveMembership
        ? 'Your membership has been cancelled and your account has been removed.'
        : 'Your account has been permanently removed.',
      type: 'success',
    });

    leaveTimer.current = setTimeout(() => {
      leaveTimer.current = null;
      InteractionManager.runAfterInteractions(() => {
        clearSessionAndLeave();
      });
    }, DELETE_NAV_DELAY_MS);
  };

  const openDeleteWarning = async () => {
    if (checking || isLoading) {
      return;
    }
    setChecking(true);
    try {
      const result = await fetchDeletePreview().unwrap();
      setPreview(result.data);
      setModal(true);
    } catch (err: unknown) {
      showGeneralError(
        getApiErrorBody(err).message,
        'Unable to check your membership',
      );
    } finally {
      setChecking(false);
    }
  };

  const acceptWarning = () => {
    setModal(false);
    setConfirmValue('');
    setConfirmError('');
    if (passwordModalTimer.current) {
      clearTimeout(passwordModalTimer.current);
    }
    passwordModalTimer.current = setTimeout(() => {
      setPasswordModal(true);
      passwordModalTimer.current = null;
    }, PASSWORD_MODAL_DELAY_MS);
  };

  const submitDelete = async (nextPreview?: DeleteAccountPreview | null) => {
    const current = nextPreview ?? preview;
    const requiresPassword = current?.requires_password !== false;
    const value = confirmValue.trim();
    if (!value) {
      setConfirmError(
        requiresPassword
          ? 'Enter your password to delete this account.'
          : 'Type the email on this account to confirm.',
      );
      return;
    }

    const body: DeleteAccountRequest = {
      cancelMembership: Boolean(current?.has_active_membership),
      confirmAccountDelete: !current?.has_active_membership,
    };
    if (requiresPassword) {
      body.password = confirmValue;
    } else {
      body.confirm_email = value;
    }

    try {
      await deleteAccount(body).unwrap();
      onDeleteSuccess(Boolean(current?.has_active_membership));
    } catch (err: unknown) {
      const conflict = conflictPreview(err);
      if (conflict) {
        setPreview(conflict);
        setPasswordModal(false);
        if (passwordModalTimer.current) {
          clearTimeout(passwordModalTimer.current);
        }
        passwordModalTimer.current = setTimeout(() => {
          setModal(true);
          passwordModalTimer.current = null;
        }, PASSWORD_MODAL_DELAY_MS);
        return;
      }
      const apiBody = getApiErrorBody(err);
      if (
        apiBody.code === 'INVALID_PASSWORD' ||
        apiBody.code === 'PASSWORD_REQUIRED' ||
        apiBody.code === 'CONFIRM_EMAIL_REQUIRED'
      ) {
        setConfirmError(
          apiBody.message || 'That password does not match.',
        );
        return;
      }
      showGeneralError(apiBody.message, 'Unable to delete account');
    }
  };

  const warning = buildDeleteWarning(preview);
  const requiresPassword = preview?.requires_password !== false;

  return {
    values: {
      modal,
      passwordModal,
      user,
      isLoading,
      checking,
      warning,
      requiresPassword,
      confirmValue,
      confirmError,
    },
    functions: {
      toggleModal,
      openDeleteWarning,
      acceptWarning,
      closePasswordModal,
      setConfirmValue: (value: string) => {
        setConfirmValue(value);
        if (confirmError) {
          setConfirmError('');
        }
      },
      submitDelete: () => submitDelete(),
    },
  };
};

export default useProfile;
