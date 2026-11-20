import * as Keychain from 'react-native-keychain';

const SERVICE = 'com.genesysglobal.flagship.auth';

type StoredAuth = {
  access: string;
  refresh?: string | null;
};

/**
 * Persist access (+ optional refresh) JWT in Keychain / Keystore.
 */
export async function saveAuthTokens(
  access: string,
  refresh?: string | null,
): Promise<void> {
  const payload: StoredAuth = {access, refresh: refresh || null};
  await Keychain.setGenericPassword('auth', JSON.stringify(payload), {
    service: SERVICE,
    // Readable on the next cold start, including after the access token expires.
    accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK,
    securityLevel: Keychain.SECURITY_LEVEL.ANY,
  });
}

/** @deprecated use saveAuthTokens */
export async function saveAuthToken(token: string): Promise<void> {
  await saveAuthTokens(token, null);
}

export async function getStoredAuth(): Promise<StoredAuth | null> {
  try {
    const creds = await Keychain.getGenericPassword({service: SERVICE});
    if (!creds || typeof creds === 'boolean') {
      return null;
    }
    const raw = creds.password || '';
    if (!raw) return null;
    if (raw.startsWith('{')) {
      return JSON.parse(raw) as StoredAuth;
    }
    // Legacy: bare access token string
    return {access: raw, refresh: null};
  } catch {
    return null;
  }
}

export async function getAuthToken(): Promise<string | null> {
  const stored = await getStoredAuth();
  return stored?.access || null;
}

export async function getRefreshToken(): Promise<string | null> {
  const stored = await getStoredAuth();
  return stored?.refresh || null;
}

export async function clearAuthToken(): Promise<void> {
  try {
    await Keychain.resetGenericPassword({service: SERVICE});
  } catch {
    // ignore
  }
}
