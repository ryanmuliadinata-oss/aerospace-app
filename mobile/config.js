export const API_BASE_URL = 'https://aerospace-app-production.up.railway.app';
// Set EXPO_PUBLIC_OPENAIP_API_KEY in mobile/.env (see .env.example). Rotate
// the previously committed key at https://core.openaip.net — it is in git history.
export const OPENAIP_API_KEY = process.env.EXPO_PUBLIC_OPENAIP_API_KEY ?? '';