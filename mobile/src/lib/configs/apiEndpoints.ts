/** Live API. Nginx serves this host at `/live` and strips that prefix before Node. */
export const PUBLIC_ORIGIN = 'https://apis.flagshiptowingadmin.us/live' as const

const API_BASE_URL = PUBLIC_ORIGIN

export const PRODUCTION = {
  apiBaseUrl: API_BASE_URL,
  imageBaseUrl: PUBLIC_ORIGIN,
} as const

export const DEVELOPMENT = {
  apiBaseUrl: API_BASE_URL,
  imageBaseUrl: PUBLIC_ORIGIN,
} as const
