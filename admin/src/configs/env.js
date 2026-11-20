const requireEnv = (name) => {
  const value = String(import.meta.env[name] || "").trim();
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy adminFlagship/.env.example to .env and set it.`,
    );
  }
  return value;
};

const BASE_URL = requireEnv("VITE_API_BASE_URL").replace(/\/+$/, "");

/**
 * Uploads origin. Uses VITE_IMAGE_BASE_URL when set, otherwise the API base
 * with a legacy /v1/api suffix removed.
 */
const deriveImageBaseFromApi = (apiBase) => {
  const trimmed = String(apiBase || "").replace(/\/+$/, "");
  const origin =
    trimmed.replace(/\/flagship-towing(?:-staging)?\/v1\/api$/i, "") ||
    trimmed.replace(/\/v1\/api$/i, "") ||
    trimmed;
  return `${origin.replace(/\/+$/, "")}/`;
};

const IMAGE_BASE_URL = String(import.meta.env.VITE_IMAGE_BASE_URL || "").trim()
  ? `${String(import.meta.env.VITE_IMAGE_BASE_URL).trim().replace(/\/+$/, "")}/`
  : deriveImageBaseFromApi(BASE_URL);

const VAPID_KEY = requireEnv("VITE_VAPID_KEY");
const REACT_APP_MODE = String(import.meta.env.VITE_APP_MODE || "dev").trim();

/**
 * Resolve a stored media path/URL for <img src>.
 * - Absolute http(s) → as-is
 * - Relative uploads/… → IMAGE_BASE_URL + path
 */
const resolveMediaUrl = (pathOrUrl) => {
  if (!pathOrUrl || typeof pathOrUrl !== "string") return "";
  let value = pathOrUrl.trim().replace(/\\/g, "/");
  if (!value) return "";

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  const uploadsIdx = value.indexOf("uploads/");
  if (uploadsIdx >= 0) {
    value = value.slice(uploadsIdx);
  }
  const base = IMAGE_BASE_URL.replace(/\/+$/, "");
  return `${base}/${value.replace(/^\//, "")}`;
};

export { VAPID_KEY, BASE_URL, IMAGE_BASE_URL, REACT_APP_MODE, resolveMediaUrl };
