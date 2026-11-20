/**
 * Places + Geocoding REST key from mobileFlagship/.env (gitignored).
 * Restrict this key in Google Cloud Console (Places API + Geocoding API only).
 * react-native-dotenv inlines GOOGLE_PLACES_API_KEY at bundle time.
 */
const key = (process.env.GOOGLE_PLACES_API_KEY || '').trim();
if (!key) {
  throw new Error(
    'Missing GOOGLE_PLACES_API_KEY. Copy mobileFlagship/.env.example to .env and paste the mobile Places REST key from Google Cloud Console.',
  );
}

export const GOOGLE_PLACES_API_KEY = key;

/** @deprecated Use GOOGLE_PLACES_API_KEY */
export const GOOGLE_PLACES_ADDRESS_API_KEY = GOOGLE_PLACES_API_KEY;

/** @deprecated Use GOOGLE_PLACES_API_KEY — previous regions key was expired */
export const GOOGLE_PLACES_REGIONS_API_KEY = GOOGLE_PLACES_API_KEY;
