package com.aerospace.client;

import com.aerospace.model.AerospaceApi;
import com.aerospace.model.Waypoint;
import com.aerospace.model.WeatherReport;
import com.aerospace.store.ApiKeyStore;
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

    private final ApiKeyStore store;
    private final HttpClient  http = HttpClient.newHttpClient();

    public AviationWeatherClient(ApiKeyStore store) { this.store = store; }

    public WeatherReport fetchMetar(String userId, Waypoint waypoint)
            throws Exception {

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
        JSONArray arr = new JSONArray(res.body());
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
        JSONArray arr = new JSONArray(res.body());
        if (arr.isEmpty()) return "No TAF available";
        return arr.getJSONObject(0).optString("rawTAF", "N/A");
    }

    private boolean checkAirSigmet(Waypoint wp) throws Exception {
        // ── Domestic SIGMET/AIRMET endpoint per OpenAPI spec ───────────
        // GET /api/data/airsigmet?format=json&hazard=turb
        // hazard options per spec: conv, turb, ice, ifr
        String url = BASE + "/api/data/airsigmet"
            + "?format=json"
            + "&hazard=turb";

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
        JSONArray sigmets = new JSONArray(res.body());
        for (int i = 0; i < sigmets.length(); i++) {
            JSONObject s = sigmets.getJSONObject(i);

            // Each SIGMET has a coords array of {lat, lon} objects
            if (!s.has("coords")) continue;
            JSONArray coords = s.getJSONArray("coords");

            double minLat =  90, maxLat = -90;
            double minLon = 180, maxLon = -180;

            for (int j = 0; j < coords.length(); j++) {
                JSONObject pt  = coords.getJSONObject(j);
                double    lat  = pt.optDouble("lat", 0);
                double    lon  = pt.optDouble("lon", 0);
                if (lat < minLat) minLat = lat;
                if (lat > maxLat) maxLat = lat;
                if (lon < minLon) minLon = lon;
                if (lon > maxLon) maxLon = lon;
            }

            if (wp.latitude  >= minLat && wp.latitude  <= maxLat
             && wp.longitude >= minLon && wp.longitude <= maxLon)
                return true;
        }

        // Also check international SIGMETs for transatlantic routes
        return checkISigmet(wp);
    }

    private boolean checkISigmet(Waypoint wp) throws Exception {
        // ── International SIGMET endpoint per OpenAPI spec ─────────────
        // GET /api/data/isigmet?format=json&hazard=turb
        String url = BASE + "/api/data/isigmet"
            + "?format=json"
            + "&hazard=turb";

        HttpRequest req = HttpRequest.newBuilder()
            .uri(URI.create(url))
            .header("Accept", "application/json")
            .GET()
            .build();

        HttpResponse<String> res = http.send(
            req, HttpResponse.BodyHandlers.ofString());

        if (res.statusCode() != 200) return false;

        JSONArray sigmets = new JSONArray(res.body());
        for (int i = 0; i < sigmets.length(); i++) {
            JSONObject s = sigmets.getJSONObject(i);
            if (!s.has("coords")) continue;
            JSONArray coords = s.getJSONArray("coords");

            double minLat =  90, maxLat = -90;
            double minLon = 180, maxLon = -180;

            for (int j = 0; j < coords.length(); j++) {
                JSONObject pt = coords.getJSONObject(j);
                double lat    = pt.optDouble("lat", 0);
                double lon    = pt.optDouble("lon", 0);
                if (lat < minLat) minLat = lat;
                if (lat > maxLat) maxLat = lat;
                if (lon < minLon) minLon = lon;
                if (lon > maxLon) maxLon = lon;
            }

            if (wp.latitude  >= minLat && wp.latitude  <= maxLat
             && wp.longitude >= minLon && wp.longitude <= maxLon)
                return true;
        }
        return false;
    }
}