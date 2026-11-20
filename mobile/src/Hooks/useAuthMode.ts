import {useCallback} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import type {AuthMode} from '@Types/auth';
import {
  dismissLoginPrompt,
  enterGuest,
  promptLogin,
  selectAuthMode,
  selectIsGuest,
  selectIsLoggedIn,
  selectIsUser,
  selectRefreshToken,
  selectUnauthenticated,
  selectUserProfile,
  signOut,
} from '@Store/userSlice';

export type UseAuthModeResult = {
  mode: AuthMode;
  isLoggedIn: boolean;
  isGuest: boolean;
  isUser: boolean;
  user: ReturnType<typeof selectUserProfile>;
  refreshToken: string | null;
  loginPromptVisible: boolean;
  enterGuest: () => void;
  promptLogin: () => void;
  dismissLoginPrompt: () => void;
  signOut: () => void;
  /** Returns false if guest/loggedOut and blocked; otherwise runs onAuthorized. */
  requireAuth: (onAuthorized?: () => void) => boolean;
};

export function useAuthMode(): UseAuthModeResult {
  const dispatch = useDispatch();
  const mode = useSelector(selectAuthMode);
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const isGuest = useSelector(selectIsGuest);
  const isUser = useSelector(selectIsUser);
  const user = useSelector(selectUserProfile);
  const refreshToken = useSelector(selectRefreshToken);
  const loginPromptVisible = useSelector(selectUnauthenticated);

  const requireAuth = useCallback(
    (onAuthorized?: () => void) => {
      if (mode === 'user') {
        onAuthorized?.();
        return true;
      }
      dispatch(promptLogin());
      return false;
    },
    [dispatch, mode],
  );

  return {
    mode,
    isLoggedIn,
    isGuest,
    isUser,
    user,
    refreshToken,
    loginPromptVisible,
    enterGuest: () => dispatch(enterGuest()),
    promptLogin: () => dispatch(promptLogin()),
    dismissLoginPrompt: () => dispatch(dismissLoginPrompt()),
    signOut: () => dispatch(signOut()),
    requireAuth,
  };
}
