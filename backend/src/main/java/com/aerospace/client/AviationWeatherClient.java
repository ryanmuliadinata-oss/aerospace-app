package com.aerospace.client;

import com.aerospace.model.Waypoint;
import com.aerospace.model.WeatherReport;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

@Component
public class AviationWeatherClient {

    private static final String BASE = "https://aviationweather.gov";

    private final HttpClient http;

    public AviationWeatherClient(HttpClient http) { this.http = http; }

    public WeatherReport fetchMetar(Waypoint waypoint) throws Exception {

        // ── METAR endpoint per OpenAPI spec ───────────────────────────
        // GET /api/data/metar?ids=KLAX&format=json&taf=false&hours=2
        String url = BASE + "/api/data/metar"
            + "?ids="    + waypoint.name
            + "&format=json"
            + "&taf=false"
            + "&hours=2";

        HttpRequest req = HttpRequest.newBuilder()
            .uri(URI.create(url))
            .header("Accept", "application/json")
            .GET()
            .build();

        HttpResponse<String> res = http.send(
            req, HttpResponse.BodyHandlers.ofString());

        if (res.statusCode() != 200)
            throw new RuntimeException(
                "[AviationWeather] METAR HTTP " + res.statusCode()
                + " for " + waypoint.name + ": " + res.body());

        // Response is a JSON array of METAR objects
        // Field names per METARJSON schema in openapi.yaml:
        //   wspd  = wind speed (knots)
        //   wdir  = wind direction (degrees)
        //   temp  = temperature (Celsius)
        //   altim = altimeter setting (hPa)
        //   fltcat = flight category (VFR/MVFR/IFR/LIFR)
        //   rawOb  = raw METAR string
        JSONArray arr;
        try {
            arr = new JSONArray(res.body());
        } catch (Exception e) {
            throw new RuntimeException(
                "[AviationWeather] METAR non-JSON response for " + waypoint.name
                + ": " + res.body().substring(0, Math.min(200, res.body().length())));
        }
        if (arr.isEmpty())
            throw new RuntimeException(
                "No METAR returned for station: " + waypoint.name);

        JSONObject m = arr.getJSONObject(0);

        double windSpeed  = m.optDouble("wspd",  0.0);
        double windDir    = m.optDouble("wdir",  0.0);
        double temp       = m.optDouble("temp",  0.0);
        double altimeter  = m.optDouble("altim", 1013.25);
        String category   = m.optString("fltcat", "UNKN");
        String rawMetar   = m.optString("rawOb",  "N/A");

        // ── Check SIGMETs along route ──────────────────────────────────
        boolean sigmetActive = checkAirSigmet(waypoint);

        return new WeatherReport(waypoint, windSpeed, windDir,
            temp, altimeter, category, rawMetar, sigmetActive);
    }

    public String fetchTaf(String icaoCode) throws Exception {
        // ── TAF endpoint per OpenAPI spec ──────────────────────────────
        // GET /api/data/taf?ids=KLAX&format=json
        String url = BASE + "/api/data/taf"
            + "?ids="    + icaoCode
            + "&format=json";

        HttpRequest req = HttpRequest.newBuilder()
            .uri(URI.create(url))
            .header("Accept", "application/json")
            .GET()
            .build();

        HttpResponse<String> res = http.send(
            req, HttpResponse.BodyHandlers.ofString());

        if (res.statusCode() != 200)
            throw new RuntimeException(
                "[AviationWeather] TAF HTTP " + res.statusCode()
                + " for " + icaoCode);

        // Return raw TAF text for display
        JSONArray arr;
        try {
            arr = new JSONArray(res.body());
        } catch (Exception e) {
            return "TAF parse error for " + icaoCode;
        }
        if (arr.isEmpty()) return "No TAF available";
        return arr.getJSONObject(0).optString("rawTAF", "N/A");
    }

    private boolean checkAirSigmet(Waypoint wp) throws Exception {
        // ── Domestic SIGMET/AIRMET endpoint per OpenAPI spec ───────────
        // No hazard filter — check all hazards (conv, turb, ice, ifr)
        String url = BASE + "/api/data/airsigmet?format=json";

        HttpRequest req = HttpRequest.newBuilder()
            .uri(URI.create(url))
            .header("Accept", "application/json")
            .GET()
            .build();

        HttpResponse<String> res = http.send(
            req, HttpResponse.BodyHandlers.ofString());

        if (res.statusCode() != 200) return false;

        // AirSigmetJSON schema per spec:
        // array of objects with coords array [{lat, lon}] and hazard string
        JSONArray sigmets;
        try { sigmets = new JSONArray(res.body()); } catch (Exception e) { return false; }

        for (int i = 0; i < sigmets.length(); i++) {
            JSONObject s = sigmets.getJSONObject(i);
            if (!s.has("coords")) continue;
            if (waypointInSigmet(wp, s.getJSONArray("coords"))) return true;
        }

        // Also check international SIGMETs for transatlantic/transpacific routes
        return checkISigmet(wp);
    }

    private boolean checkISigmet(Waypoint wp) throws Exception {
        // ── International SIGMET endpoint per OpenAPI spec ─────────────
        // No hazard filter — check all hazards
        String url = BASE + "/api/data/isigmet?format=json";

        HttpRequest req = HttpRequest.newBuilder()
            .uri(URI.create(url))
            .header("Accept", "application/json")
            .GET()
            .build();

        HttpResponse<String> res = http.send(
            req, HttpResponse.BodyHandlers.ofString());

        if (res.statusCode() != 200) return false;

        JSONArray sigmets;
        try { sigmets = new JSONArray(res.body()); } catch (Exception e) { return false; }

        for (int i = 0; i < sigmets.length(); i++) {
            JSONObject s = sigmets.getJSONObject(i);
            if (!s.has("coords")) continue;
            if (waypointInSigmet(wp, s.getJSONArray("coords"))) return true;
        }
        return false;
    }

    // Bounding-box containment check with antimeridian-crossing support.
    // Tracks the minimum positive longitude and maximum negative longitude
    // separately so Pacific SIGMETs (e.g. 170°E–170°W) are handled correctly
    // without collapsing into a near-global false-positive bbox.
    private boolean waypointInSigmet(Waypoint wp, JSONArray coords) {
        double minLat =  90, maxLat = -90;
        double minLon = 180, maxLon = -180;
        double minPositiveLon = 180, maxNegativeLon = -180;
        boolean hasPositiveLon = false, hasNegativeLon = false;

        for (int j = 0; j < coords.length(); j++) {
            JSONObject pt = coords.getJSONObject(j);
            double lat = pt.optDouble("lat", 0);
            double lon = pt.optDouble("lon", 0);
            if (lat < minLat) minLat = lat;
            if (lat > maxLat) maxLat = lat;
            if (lon < minLon) minLon = lon;
            if (lon > maxLon) maxLon = lon;
            if (lon >= 0) {
                hasPositiveLon = true;
                if (lon < minPositiveLon) minPositiveLon = lon;
            } else {
                hasNegativeLon = true;
                if (lon > maxNegativeLon) maxNegativeLon = lon;
            }
        }

        if (wp.latitude < minLat || wp.latitude > maxLat) return false;

        // Antimeridian-crossing polygons have both positive and negative
        // longitudes with a total span > 180°. In that case the "inside"
        // region wraps through 180° so the check is inverted.
        boolean crossesAntimeridian =
            hasPositiveLon && hasNegativeLon && (maxLon - minLon) > 180;

        if (crossesAntimeridian) {
            return wp.longitude >= minPositiveLon || wp.longitude <= maxNegativeLon;
        }
        return wp.longitude >= minLon && wp.longitude <= maxLon;
    }
}