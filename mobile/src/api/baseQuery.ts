import {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  fetchBaseQuery,
} from '@reduxjs/toolkit/query';
import {DEVELOPMENT, PRODUCTION} from '@Lib/configs/apiEndpoints';
import {refreshSession} from '@Lib/authSession';
import {clearAuthToken, getRefreshToken} from '@Utils/secureToken';
import {userSlice} from '@Store/userSlice';

export const API_BASE_URL = __DEV__
  ? DEVELOPMENT.apiBaseUrl
  : PRODUCTION.apiBaseUrl;

type AuthSliceState = {
  user?: {
    token?: string | null;
    refreshToken?: string | null;
  };
};

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers, {getState}) => {
    const token = (getState() as AuthSliceState)?.user?.token;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    headers.set('Accept', 'application/json');
    // Do not set Content-Type here — FormData needs the multipart boundary
    // that fetch sets automatically. JSON bodies are typed by fetchBaseQuery.
    return headers;
  },
});

let refreshPromise: Promise<'ok' | 'invalid' | 'unavailable'> | null = null;

function isFormDataLike(body: unknown): boolean {
  if (!body || typeof body !== 'object') {
    return false;
  }
  if (typeof FormData !== 'undefined' && body instanceof FormData) {
    return true;
  }
  const ctor = (body as {constructor?: {name?: string}}).constructor?.name;
  return (
    ctor === 'FormData' ||
    typeof (body as {append?: unknown}).append === 'function'
  );
}

async function tryRefresh(api: {
  getState: () => unknown;
  dispatch: (action: unknown) => void;
}): Promise<'ok' | 'invalid' | 'unavailable'> {
  const state = api.getState() as AuthSliceState;
  const refresh = state?.user?.refreshToken || (await getRefreshToken());
  if (!refresh) {
    return 'invalid';
  }

  const outcome = await refreshSession(refresh);
  if (outcome.status !== 'ok') {
    return outcome.status;
  }

  api.dispatch(
    userSlice.actions.setAuthTokens({
      token: outcome.access,
      refreshToken: outcome.refresh,
    }),
  );
  return 'ok';
}

/**
 * Base query that refreshes the access token once on 401, then retries.
 */
export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let finalArgs: string | FetchArgs = args;
  if (typeof args !== 'string' && isFormDataLike(args.body)) {
    const headers = new Headers(args.headers as any);
    // RN multipart must not carry application/json (breaks multer / no file).
    headers.delete('content-type');
    finalArgs = {...args, headers};
  }

  let result = await rawBaseQuery(finalArgs, api, extraOptions);

  if (result.error && result.error.status === 401) {
    const state = api.getState() as AuthSliceState;
    const hadSession = Boolean(
      state?.user?.token || state?.user?.refreshToken,
    );

    if (!refreshPromise) {
      refreshPromise = tryRefresh(api).finally(() => {
        refreshPromise = null;
      });
    }
    const outcome = await refreshPromise;
    if (outcome === 'ok') {
      result = await rawBaseQuery(finalArgs, api, extraOptions);
    } else if (outcome === 'invalid' && hadSession) {
      await clearAuthToken();
      // Only tear down a real session. Anonymous calls (e.g. signup image upload)
      // can 401 without meaning "please log in" — and resetApiState would abort
      // the in-flight signup mutation with a bogus "Aborted" toast.
      api.dispatch(userSlice.actions.expireSession());
      // Lazy require avoids circular imports with user/auth services.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const {userApi} = require('./user');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const {authApi} = require('./auth');
      api.dispatch(userApi.util.resetApiState());
      api.dispatch(authApi.util.resetApiState());
    }
  }

  return result;
};
