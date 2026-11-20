import {createSlice} from '@reduxjs/toolkit';
import type {PayloadAction} from '@reduxjs/toolkit';
import type {AuthMode} from '@Types/auth';
import type {User} from '@Types/models/user';
import {RootState} from './index';
import {authApi} from '@Api/auth';
import {userApi} from '@Api/user';
import {clearAuthToken, saveAuthTokens} from '@Utils/secureToken';
import {
  pickAccessToken,
  pickRefreshToken,
  type AuthSessionResponse,
} from '@Types/api/auth';

interface UserState {
  mode: AuthMode;
  /** @deprecated Prefer `mode`. Kept for persist / nav compat. */
  isLoggedIn: boolean;
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  /** Prompt login UI (guest gate / session expired). */
  unauthenticated: boolean;
}

const deriveLoggedIn = (mode: AuthMode) => mode !== 'loggedOut';

const initialState: UserState = {
  mode: 'loggedOut',
  isLoggedIn: false,
  user: null,
  token: null,
  refreshToken: null,
  unauthenticated: false,
};

const persistTokens = (
  access: string | null | undefined,
  refresh?: string | null,
) => {
  if (access) {
    saveAuthTokens(access, refresh).catch(() => {});
  } else {
    clearAuthToken().catch(() => {});
  }
};

const setMode = (state: UserState, mode: AuthMode) => {
  state.mode = mode;
  state.isLoggedIn = deriveLoggedIn(mode);
};

const applyAuthPayload = (state: UserState, payload: AuthSessionResponse) => {
  const access = pickAccessToken(payload);
  const refresh = pickRefreshToken(payload);
  state.user = payload?.data ?? null;
  state.token = access;
  state.refreshToken = refresh;
  setMode(state, access ? 'user' : 'loggedOut');
  state.unauthenticated = false;
  persistTokens(access, refresh);
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    enterGuest: state => {
      setMode(state, 'guest');
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.unauthenticated = false;
      persistTokens(null);
    },
    promptLogin: state => {
      state.unauthenticated = true;
    },
    dismissLoginPrompt: state => {
      state.unauthenticated = false;
    },
    setSecureToken: (state, action: PayloadAction<string | null>) => {
      state.token = action.payload;
      if (action.payload) {
        setMode(state, 'user');
      }
    },
    setAuthTokens: (
      state,
      action: PayloadAction<{token: string; refreshToken?: string | null}>,
    ) => {
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken ?? state.refreshToken;
      setMode(state, 'user');
      state.unauthenticated = false;
      persistTokens(state.token, state.refreshToken);
    },
    expireSession: state => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      setMode(state, 'loggedOut');
      // Already leaving for Auth — do not raise the guest "login to continue" dialog.
      state.unauthenticated = false;
      persistTokens(null);
    },
    signOut: state => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      setMode(state, 'loggedOut');
      state.unauthenticated = false;
      persistTokens(null);
    },
  },
  extraReducers: builder => {
    builder.addMatcher(
      authApi.endpoints.login.matchFulfilled,
      (state, {payload}) => applyAuthPayload(state, payload),
    );
    builder.addMatcher(
      authApi.endpoints.socialLogin.matchFulfilled,
      (state, {payload}) => applyAuthPayload(state, payload),
    );
    // Delete-account session clear is owned by the UI (`signOut`) so the confirm
    // Modal can dismiss before AppNavigator unmounts (avoids native crash).
    builder.addMatcher(
      userApi.endpoints.getProfile.matchFulfilled,
      (state, {payload}) => {
        state.user = payload?.data;
        if (state.token) {
          setMode(state, 'user');
        }
      },
    );
    builder.addMatcher(
      userApi.endpoints.updateProfile.matchFulfilled,
      (state, {payload}) => {
        state.user = payload?.data;
      },
    );
  },
});

export const {
  enterGuest,
  promptLogin,
  dismissLoginPrompt,
  signOut,
  setSecureToken,
  setAuthTokens,
  expireSession,
} = userSlice.actions;

export const getUser = (state: RootState) => state.user;
export const selectAuthMode = (state: RootState): AuthMode => {
  const userState = state.user;
  if (!userState) return 'loggedOut';
  const {mode, isLoggedIn, token} = userState;
  if (mode) return mode;
  if (isLoggedIn && token) return 'user';
  if (isLoggedIn) return 'guest';
  return 'loggedOut';
};
export const selectIsLoggedIn = (state: RootState) =>
  selectAuthMode(state) !== 'loggedOut';
export const selectIsGuest = (state: RootState) =>
  selectAuthMode(state) === 'guest';
export const selectIsUser = (state: RootState) =>
  selectAuthMode(state) === 'user';
export const selectUnauthenticated = (state: RootState) =>
  Boolean(state.user?.unauthenticated);
export const selectUserProfile = (state: RootState) => state.user?.user ?? null;
export const selectToken = (state: RootState) => state.user?.token ?? null;
export const selectRefreshToken = (state: RootState) =>
  state.user?.refreshToken ?? null;

export default userSlice.reducer;
