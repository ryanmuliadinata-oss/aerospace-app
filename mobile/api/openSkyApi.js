



const OPENSKY_BASE = 'https://opensky-network.org/api';
 
/**
 * Fetch all live aircraft within a bounding box.
 * Returns an array of simplified aircraft objects.
 *
 * @param {number} minLat  - South latitude
 * @param {number} maxLat  - North latitude
 * @param {number} minLon  - West longitude
 * @param {number} maxLon  - East longitude
 */
export const fetchLiveAircraft = async (minLat, maxLat, minLon, maxLon) => {
  try {
    const url =
      `${OPENSKY_BASE}/states/all` +
      `?lamin=${minLat}&lamax=${maxLat}&lomin=${minLon}&lomax=${maxLon}`;
 
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      // 10-second timeout via AbortController
      signal: AbortSignal.timeout(10000),
    });
 
    if (!res.ok) throw new Error(`OpenSky HTTP ${res.status}`);
 
    const json = await res.json();
 
    if (!json.states) return [];
 
    // State vector indices (per OpenSky docs):
    // 0  icao24, 1 callsign, 2 origin_country, 3 time_position,
    // 4  last_contact, 5 longitude, 6 latitude, 7 baro_altitude,
    // 8  on_ground, 9 velocity, 10 true_track, 11 vertical_rate,
    // 12 sensors, 13 geo_altitude, 14 squawk, 15 spi, 16 position_source
    return json.states
      .filter(s => s[5] != null && s[6] != null && !s[8]) // has position, airborne
      .map(s => ({
        icao24:     s[0],
        callsign:   (s[1] || '').trim() || s[0].toUpperCase(),
        country:    s[2],
        longitude:  s[5],
        latitude:   s[6],
        altitudeM:  s[7] ?? s[13] ?? 0,
        altitudeFt: Math.round((s[7] ?? s[13] ?? 0) * 3.281),
        speedKts:   s[9] != null ? Math.round(s[9] * 1.944) : 0,
        headingDeg: s[10] ?? 0,
        onGround:   s[8],
        squawk:     s[14] ?? '',
      }));
  } catch (err) {
    console.warn('[OpenSky] fetch failed:', err.message);
    return [];
  }
};
 
/**
 * Compute a bounding box around a set of waypoints with padding.
 * Useful for fetching aircraft along a route.
 *
 * @param {Array<{latitude, longitude}>} waypoints
 * @param {number} paddingDeg - degrees of padding around the route
 */
export const bboxFromWaypoints = (waypoints, paddingDeg = 2) => {
  const lats = waypoints.map(w => w.latitude);
  const lons = waypoints.map(w => w.longitude);
  return {
    minLat: Math.min(...lats) - paddingDeg,
    maxLat: Math.max(...lats) + paddingDeg,
    minLon: Math.min(...lons) - paddingDeg,
    maxLon: Math.max(...lons) + paddingDeg,
  };
};
 
/**
 * Fetch aircraft for a given ICAO24 hex code (specific plane).
 */
export const fetchAircraftByIcao = async (icao24) => {
  try {
    const res = await fetch(
      `${OPENSKY_BASE}/states/all?icao24=${icao24.toLowerCase()}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.states || !json.states[0]) return null;
    const s = json.states[0];
    return {
      icao24:     s[0],
      callsign:   (s[1] || '').trim(),
      longitude:  s[5],
      latitude:   s[6],
      altitudeFt: Math.round((s[7] ?? 0) * 3.281),
      speedKts:   s[9] != null ? Math.round(s[9] * 1.944) : 0,
      headingDeg: s[10] ?? 0,
    };
  } catch (err) {
    console.warn('[OpenSky] single aircraft fetch failed:', err.message);
    return null;
  }
};