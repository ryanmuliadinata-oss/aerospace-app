const AQ_BASE = 'https://air-quality-api.open-meteo.com/v1/air-quality';
 
/**
 * Fetch air quality for a single coordinate.
 * @param {number} lat
 * @param {number} lon
 * @param {string} name  - label for logging (e.g. waypoint ICAO)
 * @returns {Promise<AirQualityResult>}
 */
export const fetchAirQuality = async (lat, lon, name = '') => {
  try {
    const params = new URLSearchParams({
      latitude:  lat,
      longitude: lon,
      hourly:    'pm10,pm2_5,dust,uv_index,european_aqi,visibility',
      timezone:  'auto',
      forecast_days: 1,
    });
 
    const res = await fetch(`${AQ_BASE}?${params}`, {
      signal: AbortSignal.timeout(8000),
    });
 
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
 
    const json = await res.json();
    const hourly = json.hourly;
    if (!hourly) throw new Error('No hourly data');
 
    // Use the most recent hour that has data
    const now = new Date();
    const idx = Math.min(now.getHours(), (hourly.time?.length ?? 1) - 1);
 
    const pm25       = hourly.pm2_5?.[idx]       ?? null;
    const pm10       = hourly.pm10?.[idx]        ?? null;
    const dust       = hourly.dust?.[idx]        ?? null;
    const uv         = hourly.uv_index?.[idx]    ?? null;
    const aqi        = hourly.european_aqi?.[idx]?? null;
    const visM       = hourly.visibility?.[idx]  ?? null;
 
    return {
      name,
      pm25,
      pm10,
      dust,
      uv,
      aqi,
      visibilityKm:   visM != null ? +(visM / 1000).toFixed(1) : null,
      aqiLabel:       aqiToLabel(aqi),
      aqiColor:       aqiToColor(aqi),
    };
  } catch (err) {
    console.warn(`[AirQuality] fetch failed for ${name}:`, err.message);
    return { name, pm25: null, pm10: null, dust: null, uv: null,
             aqi: null, visibilityKm: null, aqiLabel: 'N/A', aqiColor: '#556677' };
  }
};
 
/**
 * Fetch air quality for multiple waypoints in parallel.
 * @param {Array<{name, latitude, longitude}>} waypoints
 */
export const fetchRouteAirQuality = async (waypoints) => {
  const results = await Promise.all(
    waypoints.map(wp => fetchAirQuality(wp.latitude, wp.longitude, wp.name))
  );
  return results;
};
 
// European AQI scale: 0-20 Good, 20-40 Fair, 40-60 Moderate,
//                     60-80 Poor, 80-100 Very Poor, >100 Extremely Poor
const aqiToLabel = (aqi) => {
  if (aqi == null)   return 'N/A';
  if (aqi <= 20)     return 'GOOD';
  if (aqi <= 40)     return 'FAIR';
  if (aqi <= 60)     return 'MODERATE';
  if (aqi <= 80)     return 'POOR';
  if (aqi <= 100)    return 'VERY POOR';
  return 'HAZARDOUS';
};
 
const aqiToColor = (aqi) => {
  if (aqi == null)   return '#556677';
  if (aqi <= 20)     return '#00FF88';
  if (aqi <= 40)     return '#AAD400';
  if (aqi <= 60)     return '#FFD700';
  if (aqi <= 80)     return '#FF8C00';
  if (aqi <= 100)    return '#FF3333';
  return '#CC0000';
};