package com.aerospace.client;

import com.aerospace.model.AerospaceApi;
import com.aerospace.model.TurbulenceReport;
import com.aerospace.model.Waypoint;
import com.aerospace.store.ApiKeyStore;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.List;

@Component
public class TurbulenceClient {

    private static final String BASE = "https://aviationweather.gov";

    private final HttpClient http = HttpClient.newHttpClient();

    // ApiKeyStore kept for consistency but AviationWeather needs no key
    public TurbulenceClient(ApiKeyStore store) {}

    public List<TurbulenceReport> fetchTurbulence(
            String userId, List<Waypoint> waypoints) throws Exception {

        List<TurbulenceReport> reports = new ArrayList<>();

        for (Waypoint wp : waypoints) {
            // ── PIREP endpoint per OpenAPI spec ────────────────────────
            // GET /api/data/pirep
            //   id       = airport ID for center of search
            //   distance = radial distance in nm
            //   age      = hours back
            //   format   = json
            //   level    = altitude +-3000ft to search
            //   inten    = minimum intensity: lgt, mod, sev
            String url = BASE + "/api/data/pirep"
                + "?id="       + wp.name
                + "&distance=150"
                + "&age=3"
                + "&format=json"
                + "&level="    + (int)(wp.altitudeFt / 100); // convert ft to FL

            HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Accept", "application/json")
                .GET()
                .build();

            HttpResponse<String> res = http.send(
                req, HttpResponse.BodyHandlers.ofString());

            if (res.statusCode() != 200) {
                System.err.printf(
                    "[Turbulence] PIREP %s HTTP %d — marking UNKNOWN%n",
                    wp.name, res.statusCode());
                reports.add(new TurbulenceReport(
                    wp, "UNKNOWN", wp.altitudeFt, "PIREP-UNAVAILABLE"));
                continue;
            }

            // PIREPJSON schema per spec:
            // array of objects with fields:
            //   tbInt   = turbulence intensity (0-7)
            //   tbFreq  = turbulence frequency
            //   tbType  = turbulence type
            //   fltlvl  = flight level
            //   acType  = aircraft type
            //   rawOb   = raw PIREP string
            JSONArray pireps = new JSONArray(res.body());
            String worstSeverity = "NIL";
            double worstAlt      = wp.altitudeFt;

            for (int i = 0; i < pireps.length(); i++) {
                JSONObject p = pireps.getJSONObject(i);
                if (!p.has("tbInt")) continue;

                int    tbInt    = p.getInt("tbInt");
                String severity = mapIntensity(tbInt);

                // Track the altitude of the worst turbulence report
                if (p.has("fltlvl") && severityRank(severity) >= severityRank(worstSeverity)) {
                    worstAlt = p.getDouble("fltlvl") * 100; // FL to feet
                }

                if (severityRank(severity) > severityRank(worstSeverity)) {
                    worstSeverity = severity;
                }
            }

            System.out.printf("[Turbulence] PIREP %-6s → %d reports, worst: %s%n",
                wp.name, pireps.length(), worstSeverity);

            reports.add(new TurbulenceReport(
                wp, worstSeverity, worstAlt, "PIREP"));
        }

        return reports;
    }

    // tbInt scale per AviationWeather spec:
    // 0 = none, 1-2 = light, 3-4 = moderate, 5-6 = severe, 7 = extreme
    private String mapIntensity(int tbInt) {
        return switch (tbInt) {
            case 0     -> "NIL";
            case 1, 2  -> "LIGHT";
            case 3, 4  -> "MODERATE";
            case 5, 6  -> "SEVERE";
            default    -> "EXTREME";
        };
    }

    private int severityRank(String s) {
        return switch (s) {
            case "LIGHT"    -> 1;
            case "MODERATE" -> 2;
            case "SEVERE"   -> 3;
            case "EXTREME"  -> 4;
            default         -> 0;
        };
    }
}