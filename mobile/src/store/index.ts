import AsyncStorage from '@react-native-async-storage/async-storage';
import {combineReducers, configureStore} from '@reduxjs/toolkit';
import {setupListeners} from '@reduxjs/toolkit/query';
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  createTransform,
  persistReducer,
  persistStore,
} from 'redux-persist';
import {authApi} from '@Api/auth';
import Toast from 'react-native-toast-message';
import {devLog} from '@Utils/devLog';
import {LOCALLY_HANDLED_MUTATIONS, FALLBACK_ERROR_MESSAGE} from '@Utils/formErrors';
import {userApi} from '@Api/user';
import {userSlice} from './userSlice';

/** Never write the JWT into AsyncStorage — only profile / login flags. */
const stripTokenTransform = createTransform(
  (inboundState: any) => {
    if (!inboundState || typeof inboundState !== 'object') {
      return inboundState;
    }
    const {token: _token, refreshToken: _refresh, ...rest} = inboundState;
    return rest;
  },
  (outboundState: any) => {
    if (!outboundState || typeof outboundState !== 'object') {
      return outboundState;
    }
    return {...outboundState, token: null, refreshToken: null};
  },
  {whitelist: ['user']},
);

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['user'],
  transforms: [stripTokenTransform],
};

const rootReducer = combineReducers({
  user: userSlice.reducer,
  [authApi.reducerPath]: authApi.reducer,
  [userApi.reducerPath]: userApi.reducer,
});

const apiErrorHandler = (store: any) => (next: any) => (action: any) => {
  // 401 / refresh is handled in baseQueryWithReauth — do not clear session here.
  if (action.type.endsWith('/rejected')) {
    if (__DEV__) {
      devLog(JSON.stringify(action.payload, null, 4));
    }
    const payload = action.payload || {};
    const {data} = payload;
    const {message, code, errors} = data || {};
    const endpointName = action.meta?.arg?.endpointName as string | undefined;
    const abortText = String(payload.error ?? payload.message ?? '');

    // resetApiState / unmount aborts in-flight requests — not user-facing errors.
    if (
      payload.name === 'AbortError' ||
      action.meta?.aborted === true ||
      /abort/i.test(abortText)
    ) {
      return next(action);
    }

    if (code === 'ACTIVE_MEMBERSHIP' || code === 'MEMBERSHIP_EXPIRED') {
      return next(action);
    }

    // Skip toast for auth failures that already trigger login UI
    if (payload?.status === 401) {
      return next(action);
    }

    // Callers that map field errors or show their own toast/dialog.
    if (endpointName && LOCALLY_HANDLED_MUTATIONS.has(endpointName)) {
      return next(action);
    }

    // Payment-status probe is polled/best-effort — the payment flow owns
    // its UX, a failed probe must never toast.
    if (endpointName === 'getVesselPaymentStatus') {
      return next(action);
    }

    // Structured field errors — prefer callers that map them under inputs.
    if (errors && typeof errors === 'object' && Object.keys(errors).length > 0) {
      return next(action);
    }

    const serverMessage =
      typeof message === 'string' && message.trim() ? message : null;

    // Background query refetches (cache invalidation, focus refetch) fail
    // noisily on network flaps or non-JSON error pages. Screens render their
    // own query error states — only toast queries when the server actually
    // said something. Mutations (user actions) keep the generic fallback.
    const isQuery = action.meta?.arg?.type === 'query';
    if (isQuery && !serverMessage) {
      return next(action);
    }

    Toast.show({
      text1: 'Error',
      text2: serverMessage ?? FALLBACK_ERROR_MESSAGE,
      type: 'error',
    });
  }

  return next(action);
};

const persistedReducer = persistReducer(persistConfig, rootReducer as any) as any;

export const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    })
      .concat(authApi.middleware)
      .concat(userApi.middleware)
      .concat(apiErrorHandler),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const persistor = persistStore(store);
