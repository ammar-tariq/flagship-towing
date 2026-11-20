/**
 * Shared API + auth helpers for membershipFlagship member portal.
 * Endpoints align with mobileFlagship (source: "user").
 * Access token: sessionStorage. Refresh token: localStorage (survives tab close).
 */
(function (global) {
  const API_BASE = String("__API_BASE__").replace(/\/+$/, "");
  if (!API_BASE || API_BASE.indexOf("__API_BASE") === 0) {
    throw new Error(
      "Missing VITE_API_BASE_URL. Copy membershipFlagship/.env.example to .env and rebuild/restart the membership portal.",
    );
  }

  function joinApiUrl(path) {
    const raw = String(path || "");
    if (/^https?:\/\//i.test(raw)) return raw;
    const suffix = !raw ? "" : raw.charAt(0) === "/" ? raw : "/" + raw;
    return API_BASE + suffix;
  }

  const IMAGE_BASE = API_BASE.replace(
    /\/flagship-towing(?:-staging)?\/v1\/api$/i,
    "",
  )
    .replace(/\/v1\/api$/i, "")
    .replace(/\/+$/, "");

  function resolveMediaUrl(pathOrUrl) {
    if (!pathOrUrl || typeof pathOrUrl !== "string") return "";
    let value = pathOrUrl.trim().replace(/\\/g, "/");
    if (!value) return "";
    if (/^https?:\/\//i.test(value)) return value;
    const uploadsIdx = value.indexOf("uploads/");
    if (uploadsIdx >= 0) value = value.slice(uploadsIdx);
    return IMAGE_BASE + "/" + value.replace(/^\//, "");
  }

  const TOKEN_KEY = "flagship_access_token";
  const REFRESH_KEY = "flagship_refresh_token";
  const USER_KEY = "flagship_user";
  const LOGGED_IN_HOME = "user.html";

  let refreshInFlight = null;

  function pickAccessToken(payload) {
    if (!payload || typeof payload !== "object") return null;
    return payload.accessToken || payload.token || null;
  }

  function pickRefreshToken(payload) {
    if (!payload || typeof payload !== "object") return null;
    return payload.refreshToken || payload.refresh_token || null;
  }

  function refreshBody(refresh) {
    if (!refresh) return {};
    return { refresh_token: refresh, refreshToken: refresh };
  }

  function safeGet(storage, key) {
    try {
      return storage.getItem(key) || "";
    } catch (e) {
      return "";
    }
  }

  function safeSet(storage, key, value) {
    try {
      if (value == null || value === "") storage.removeItem(key);
      else storage.setItem(key, value);
    } catch (e) {
      /* ignore */
    }
  }

  function getToken() {
    return (
      safeGet(sessionStorage, TOKEN_KEY) ||
      safeGet(localStorage, TOKEN_KEY) ||
      ""
    );
  }

  function getRefreshToken() {
    return (
      safeGet(localStorage, REFRESH_KEY) ||
      safeGet(sessionStorage, REFRESH_KEY) ||
      ""
    );
  }

  function setSession(token, user, refreshToken) {
    safeSet(sessionStorage, TOKEN_KEY, token || "");
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch (e) {
      /* ignore */
    }
    if (refreshToken) {
      safeSet(localStorage, REFRESH_KEY, refreshToken);
    }
    if (user != null) {
      try {
        sessionStorage.setItem(USER_KEY, JSON.stringify(user));
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      } catch (e) {
        /* ignore */
      }
    }
  }

  function getUser() {
    try {
      const raw =
        sessionStorage.getItem(USER_KEY) || localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function clearSession() {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(REFRESH_KEY);
      sessionStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (e) {
      /* ignore */
    }
  }

  function isLoggedIn() {
    return !!(getToken() || getRefreshToken());
  }

  function requireAuth(redirectTo) {
    if (!isLoggedIn()) {
      window.location.href = redirectTo || "signin.html";
      return false;
    }
    return true;
  }

  function redirectIfLoggedIn(target) {
    if (!isLoggedIn()) return false;
    window.location.replace(target || LOGGED_IN_HOME);
    return true;
  }

  function isAllowedCheckoutUrl(url) {
    try {
      const u = new URL(String(url));
      return (
        u.protocol === "https:" &&
        (u.hostname === "checkout.stripe.com" ||
          u.hostname.endsWith(".stripe.com"))
      );
    } catch (e) {
      return false;
    }
  }

  async function refreshAccessToken() {
    const refresh = getRefreshToken();
    if (!refresh) return false;
    try {
      const res = await fetch(joinApiUrl("/auth/refresh"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(refreshBody(refresh)),
      });
      const data = await res.json().catch(function () {
        return {};
      });
      const access = pickAccessToken(data);
      if (!res.ok || !access) return false;
      setSession(access, getUser(), pickRefreshToken(data) || refresh);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * @param {string} path - e.g. "/auth/login"
   * @param {RequestInit & { auth?: boolean, _retried?: boolean }} options
   */
  async function apiFetch(path, options) {
    options = options || {};
    const headers = Object.assign(
      { Accept: "application/json" },
      options.headers || {}
    );
    if (!options.formData) {
      headers["Content-Type"] = "application/json";
    }
    if (options.auth !== false) {
      const token = getToken();
      if (token) headers.Authorization = "Bearer " + token;
    }
    const res = await fetch(joinApiUrl(path), {
      method: options.method || "GET",
      headers: headers,
      body: options.body,
    });
    let data = {};
    try {
      data = await res.json();
    } catch (_) {
      data = {};
    }

    if (res.status === 401 && options.auth !== false && !options._retried) {
      if (!refreshInFlight) {
        refreshInFlight = refreshAccessToken().finally(function () {
          refreshInFlight = null;
        });
      }
      const ok = await refreshInFlight;
      if (ok) {
        return apiFetch(path, Object.assign({}, options, { _retried: true }));
      }
      clearSession();
    }

    if (!res.ok) {
      const err = new Error(
        data.message || data.error || "Request failed (" + res.status + ")"
      );
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  async function logout() {
    const refresh = getRefreshToken();
    const token = getToken();
    try {
      await fetch(joinApiUrl("/auth/logout"), {
        method: "POST",
        headers: Object.assign(
          { "Content-Type": "application/json", Accept: "application/json" },
          token ? { Authorization: "Bearer " + token } : {}
        ),
        body: JSON.stringify(refreshBody(refresh)),
      });
    } catch (e) {
      /* ignore network errors on logout */
    }
    clearSession();
  }

  function digitsOnlyPhone(value) {
    return String(value || "")
      .replace(/\D/g, "")
      .slice(0, 10);
  }

  function isValidEmail(str) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(str || "").trim());
  }

  const FlagshipAPI = {
    API_BASE,
    IMAGE_BASE,
    TOKEN_KEY,
    REFRESH_KEY,
    USER_KEY,
    LOGGED_IN_HOME,
    joinApiUrl,
    resolveMediaUrl,
    getToken,
    getRefreshToken,
    setSession,
    getUser,
    clearSession,
    logout,
    isLoggedIn,
    requireAuth,
    redirectIfLoggedIn,
    apiFetch,
    isAllowedCheckoutUrl,
    digitsOnlyPhone,
    isValidEmail,
    pickAccessToken,
    pickRefreshToken,

    login(credentials) {
      return apiFetch("/auth/login", {
        method: "POST",
        auth: false,
        body: JSON.stringify(
          Object.assign({}, credentials, {
            source: "user",
            device_id: "web",
          })
        ),
      });
    },

    forgotPassword(email) {
      return apiFetch("/auth/forgot-password", {
        method: "POST",
        auth: false,
        body: JSON.stringify({ email }),
      });
    },

    verifyOtp(email, otp) {
      return apiFetch("/auth/verify-otp", {
        method: "POST",
        auth: false,
        body: JSON.stringify({ email, otp }),
      });
    },

    resetPassword(email, password) {
      return apiFetch("/auth/reset-password", {
        method: "POST",
        auth: false,
        body: JSON.stringify({ email, password }),
      });
    },

    getProfile() {
      return apiFetch("/user/my-profile");
    },

    getVessels() {
      return apiFetch("/vessel/get");
    },

    deleteVessel(id) {
      return apiFetch("/vessel/delete/" + encodeURIComponent(id), {
        method: "DELETE",
      });
    },

    updateVessel(id, body) {
      return apiFetch("/vessel/update/" + encodeURIComponent(id), {
        method: "PATCH",
        body: JSON.stringify(body),
      });
    },

    uploadImage(file) {
      const formData = new FormData();
      formData.append("image", file);
      return apiFetch("/general/upload-image", {
        method: "POST",
        formData: true,
        body: formData,
      });
    },

    getPackages() {
      return apiFetch("/package/get?active=true", { auth: false });
    },

    getBoatingLocations() {
      return apiFetch("/general/boating-locations", { auth: false });
    },

    checkEmail(email) {
      return apiFetch(
        "/user/check-email?email=" + encodeURIComponent(email),
        { auth: false }
      );
    },

    createFormUser(body) {
      return apiFetch("/user/create-form-user", {
        method: "POST",
        auth: false,
        body: JSON.stringify(body),
      });
    },

    createVessel(priceId, body) {
      return apiFetch("/vessel/create/" + encodeURIComponent(priceId), {
        method: "POST",
        body: JSON.stringify(body),
      });
    },

    getFamily(params) {
      const qs = params
        ? "?" +
          Object.keys(params)
            .filter(function (k) {
              return params[k] != null && params[k] !== "";
            })
            .map(function (k) {
              return (
                encodeURIComponent(k) + "=" + encodeURIComponent(params[k])
              );
            })
            .join("&")
        : "";
      return apiFetch("/family/get" + qs);
    },

    getPaymentLogs() {
      return apiFetch("/package/payment-logs");
    },

    getIncidents() {
      return apiFetch("/incident/get");
    },

    createFamily(body) {
      return apiFetch("/family/create", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
  };

  global.FlagshipAPI = FlagshipAPI;
})(typeof window !== "undefined" ? window : global);
