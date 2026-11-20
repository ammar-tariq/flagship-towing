/**
 * Maps JavaScript + Places key from adminFlagship/.env (VITE_GOOGLE_MAPS_KEY).
 * Restrict this key by HTTP referrer in Google Cloud Console.
 */
const key = String(import.meta.env.VITE_GOOGLE_MAPS_KEY || "").trim();
if (!key) {
  throw new Error(
    "Missing VITE_GOOGLE_MAPS_KEY. Copy adminFlagship/.env.example to .env and paste the web Maps JavaScript key from Google Cloud Console.",
  );
}

export const GOOGLE_PLACES_API_KEY = key;
