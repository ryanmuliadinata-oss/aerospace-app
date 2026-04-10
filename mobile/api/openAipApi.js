import { OPENAIP_API_KEY } from '../config';
 
const OPENAIP_BASE = 'https://api.core.openaip.net/api';
 
// Helper — degrees to radians
const toRad = (deg) => deg * (Math.PI / 180);
 
/**
 * Search for an airport by ICAO code.
 * Returns the airport object including runways, elevation, coordinates.
 *
 * @param {string} icao - 4-letter ICAO code e.g. 'KLAX'
 * @returns {Promise<AirportInfo|null>}
 */
export const fetchAirportByIcao = async (icao) => {
  if (!OPENAIP_API_KEY || OPENAIP_API_KEY === 'YOUR_OPENAIP_KEY_HERE') {
    console.warn('[OpenAIP] No API key set in config.js');
    return null;
  }
 
  try {
    const res = await fetch(
      `${OPENAIP_BASE}/airports?icaoCode=${icao.toUpperCase()}&limit=1`,
      {
        headers: {
          'x-openaip-api-key': OPENAIP_API_KEY,
          'Accept': 'application/json',
        },
      }
    );
 
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
 
    const json = await res.json();
    const airport = json.items?.[0];
    if (!airport) return null;
 
    // Parse runways into a clean structure
    const runways = (airport.runways || []).map(rwy => ({
      designator:   rwy.designator || 'RWY',
      trueHeading:  rwy.trueHeading ?? null,    // degrees true
      lengthM:      rwy.dimension?.length?.value ?? null,
      widthM:       rwy.dimension?.width?.value  ?? null,
      lengthFt:     rwy.dimension?.length?.value
                      ? Math.round(rwy.dimension.length.value * 3.281) : null,
      surface:      rwy.surface?.mainComposite ?? 'Unknown',
      condition:    rwy.condition ?? 'Unknown',
      pilotCtrl:    rwy.pilotCtrlLighting ?? false,
    }));
 
    return {
      icao:         airport.icaoCode,
      name:         airport.name,
      type:         airport.type,
      elevationFt:  airport.elevation?.value != null
                      ? Math.round(airport.elevation.value * 3.281) : null,
      elevationM:   airport.elevation?.value ?? null,
      latitude:     airport.geometry?.coordinates?.[1] ?? null,
      longitude:    airport.geometry?.coordinates?.[0] ?? null,
      runways,
      // Best runway = longest
      longestRunwayFt: runways.length > 0
        ? Math.max(...runways.map(r => r.lengthFt ?? 0))
        : null,
    };
  } catch (err) {
    console.warn(`[OpenAIP] fetch failed for ${icao}:`, err.message);
    return null;
  }
};
 
/**
 * Given a wind direction and a list of runways, find the runway
 * with the smallest crosswind component (best runway to use).
 *
 * @param {number} windDirDeg  - wind direction in degrees true
 * @param {number} windSpeedKts
 * @param {Array}  runways     - from fetchAirportByIcao
 * @returns {{ runway, headwindKts, crosswindKts } | null}
 */
export const bestRunwayForWind = (windDirDeg, windSpeedKts, runways) => {
  if (!runways || runways.length === 0) return null;
 
  const scored = runways
    .filter(r => r.trueHeading != null)
    .map(r => {
      const angleDiff = windDirDeg - r.trueHeading;
      const headwind  = windSpeedKts * Math.cos(toRad(angleDiff));
      const crosswind = Math.abs(windSpeedKts * Math.sin(toRad(angleDiff)));
      return { runway: r, headwindKts: +headwind.toFixed(1), crosswindKts: +crosswind.toFixed(1) };
    });
 
  if (scored.length === 0) return null;
 
  // Best = lowest crosswind (and prefer headwind over tailwind)
  return scored.sort((a, b) => a.crosswindKts - b.crosswindKts)[0];
};
 