/**
 * Dual-read auth token fields during backend migration
 * (legacy `token`/`refresh_token` + preferred `accessToken`/`refreshToken`).
 */

export function pickAccessToken(payload) {
  if (!payload || typeof payload !== "object") return null;
  return payload.accessToken || payload.token || null;
}

export function pickRefreshToken(payload) {
  if (!payload || typeof payload !== "object") return null;
  return payload.refreshToken || payload.refresh_token || null;
}

/** Dual-send refresh body for logout / refresh requests. */
export function refreshBody(refresh) {
  if (!refresh) return {};
  return {
    refresh_token: refresh,
    refreshToken: refresh,
  };
}
