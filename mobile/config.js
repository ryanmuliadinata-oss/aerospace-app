// API base URL defaults to production. Override in mobile/.env for dev/staging:
//   EXPO_PUBLIC_API_BASE_URL=http://localhost:8080
export const API_BASE_URL =
    process.env.EXPO_PUBLIC_API_BASE_URL
    ?? 'https://aerospace-app-production.up.railway.app';

// Backend API key — required when AEROSPACE_API_KEY is set server-side.
// Set EXPO_PUBLIC_API_KEY in mobile/.env (never commit the real value).
export const API_KEY = process.env.EXPO_PUBLIC_API_KEY ?? '';

// OpenAIP key — rotate at https://core.openaip.net if compromised.
// Set EXPO_PUBLIC_OPENAIP_API_KEY in mobile/.env (see .env.example).
export const OPENAIP_API_KEY = process.env.EXPO_PUBLIC_OPENAIP_API_KEY ?? '';
