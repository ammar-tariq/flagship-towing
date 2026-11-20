import {DEVELOPMENT, PRODUCTION} from '@Lib/configs/apiEndpoints';
import {
  pickAccessToken,
  pickRefreshToken,
  type AuthTokensResponse,
} from '@Types/api/auth';
import {getStoredAuth, saveAuthTokens} from '@Utils/secureToken';

const API_BASE_URL = __DEV__ ? DEVELOPMENT.apiBaseUrl : PRODUCTION.apiBaseUrl;

export type RefreshOutcome =
  | {status: 'ok'; access: string; refresh: string}
  | {status: 'invalid'}
  | {status: 'unavailable'};

/**
 * Exchange a refresh token for a new pair.
 * `invalid` means the server rejected this refresh token.
 * `unavailable` means the network or server failed and the saved token should stay.
 */
export async function refreshSession(refresh: string): Promise<RefreshOutcome> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        refresh_token: refresh,
        refreshToken: refresh,
      }),
    });

    const text = (await res.text()).trim();
    let data: unknown = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        return {status: 'unavailable'};
      }
    }

    if (res.status === 401 || res.status === 403) {
      return {status: 'invalid'};
    }

    const body =
      data && typeof data === 'object' ? (data as AuthTokensResponse) : null;
    const access = pickAccessToken(body);
    if (!res.ok || !access) {
      return {status: 'unavailable'};
    }

    const nextRefresh = pickRefreshToken(body) || refresh;

    try {
      await saveAuthTokens(access, nextRefresh);
    } catch {
      // Memory can still hold the new pair for this launch.
    }

    return {status: 'ok', access, refresh: nextRefresh};
  } catch {
    return {status: 'unavailable'};
  }
}

export async function loadStoredSession(): Promise<{
  access: string | null;
  refresh: string | null;
}> {
  const stored = await getStoredAuth();
  return {
    access: stored?.access || null,
    refresh: stored?.refresh || null,
  };
}
