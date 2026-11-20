import { fetchBaseQuery } from "@reduxjs/toolkit/query";
import { BASE_URL } from "../configs/env";
import {
  extractAuthData,
  hasRememberedSession,
  insertAuthData,
  resetData,
} from "../utils/storage";
import {
  pickAccessToken,
  pickRefreshToken,
  refreshBody,
} from "../utils/authTokens";

let refreshPromise = null;

async function tryRefresh() {
  const refresh = extractAuthData("refresh_token");
  if (!refresh) return false;
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(refreshBody(refresh)),
    });
    const data = await res.json().catch(() => ({}));
    const access = pickAccessToken(data);
    if (!res.ok || !access) return false;
    const remember = hasRememberedSession();
    insertAuthData(access, "access_token", remember);
    const nextRefresh = pickRefreshToken(data);
    if (nextRefresh) {
      insertAuthData(nextRefresh, "refresh_token", remember);
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * RTK Query baseQuery with Bearer auth + single-flight refresh on 401.
 * @param {string} baseUrl
 */
export const baseQueryWithReauth = (baseUrl) => {
  const raw = fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers) => {
      const token = extractAuthData("access_token");
      if (token) headers.set("authorization", `Bearer ${token}`);
      return headers;
    },
  });

  return async (args, api, extraOptions) => {
    let result = await raw(args, api, extraOptions);

    if (result.error && result.error.status === 401) {
      if (!refreshPromise) {
        refreshPromise = tryRefresh().finally(() => {
          refreshPromise = null;
        });
      }
      const ok = await refreshPromise;
      if (ok) {
        result = await raw(args, api, extraOptions);
      } else {
        resetData();
        if (
          typeof window !== "undefined" &&
          !window.location.pathname.includes("/login")
        ) {
          window.location.assign("/login");
        }
      }
    }

    return result;
  };
};

export async function revokeSessionOnServer() {
  const refresh = extractAuthData("refresh_token");
  const token = extractAuthData("access_token");
  try {
    await fetch(`${BASE_URL}/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(refreshBody(refresh)),
    });
  } catch {
    // ignore
  }
}
