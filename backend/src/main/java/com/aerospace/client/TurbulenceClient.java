package com.aerospace.client;

import com.aerospace.model.TurbulenceReport;
import com.aerospace.model.Waypoint;
import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Component
public class TurbulenceClient {

    private static final Logger log = LoggerFactory.getLogger(TurbulenceClient.class);
    private static final String BASE = "https://aviationweather.gov";

    private final HttpClient http;

    public TurbulenceClient(HttpClient http) { this.http = http; }

    public List<TurbulenceReport> fetchTurbulence(List<Waypoint> waypoints) throws Exception {

        List<TurbulenceReport> reports = new ArrayList<>();

        for (Waypoint wp : waypoints) {
            String id  = URLEncoder.encode(wp.name, StandardCharsets.UTF_8);
            String url = BASE + "/api/data/pirep"
                + "?id="       + id
                + "&distance=150"
                + "&age=3"
                + "&format=json"
                + "&level="    + (int)(wp.altitudeFt / 100);

            HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Accept", "application/json")
                .GET()
                .build();

            HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString());

            if (res.statusCode() != 200) {
                log.warn("[Turbulence] PIREP {} HTTP {} — marking UNKNOWN",
                    wp.name, res.statusCode());
                reports.add(new TurbulenceReport(wp, "UNKNOWN", wp.altitudeFt, "PIREP-UNAVAILABLE"));
                continue;
            }

            JSONArray pireps = new JSONArray(res.body());
            String worstSeverity = "NIL";
            double worstAlt      = wp.altitudeFt;

            for (int i = 0; i < pireps.length(); i++) {
                JSONObject p = pireps.getJSONObject(i);
                if (!p.has("tbInt")) continue;

                int    tbInt    = p.optInt("tbInt", 0);
                String severity = mapIntensity(tbInt);

                if (p.has("fltlvl") && severityRank(severity) >= severityRank(worstSeverity)) {
                    worstAlt = p.optDouble("fltlvl", wp.altitudeFt / 100.0) * 100;
                }
                if (severityRank(severity) > severityRank(worstSeverity)) {
                    worstSeverity = severity;
                }
            }

            log.info("[Turbulence] PIREP {} → {} reports, worst: {}",
                wp.name, pireps.length(), worstSeverity);
            reports.add(new TurbulenceReport(wp, worstSeverity, worstAlt, "PIREP"));
        }

        return reports;
    }

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
