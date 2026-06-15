package com.aerospace.client;

import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

@Component
public class SunriseSunsetClient {

    private static final Logger log = LoggerFactory.getLogger(SunriseSunsetClient.class);
    private static final String BASE = "https://api.sunrise-sunset.org/json";

    private final HttpClient http;

    public SunriseSunsetClient(HttpClient http) { this.http = http; }

    public SunriseSunsetResult fetch(double lat, double lon) {
        try {
            // lat/lon are validated doubles — format to fixed precision to avoid
            // scientific notation (e.g. 1.23E-5) which would break the URL.
            String url = String.format("%s?lat=%.6f&lng=%.6f&formatted=0", BASE, lat, lon);

            HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Accept", "application/json")
                .GET()
                .build();

            HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString());

            if (res.statusCode() != 200) {
                log.warn("[SunriseSunset] HTTP {}", res.statusCode());
                return defaultResult();
            }

            JSONObject body    = new JSONObject(res.body());
            JSONObject results = body.optJSONObject("results");
            if (results == null) return defaultResult();

            return new SunriseSunsetResult(
                results.optString("sunrise",              "N/A"),
                results.optString("sunset",               "N/A"),
                results.optString("solar_noon",           "N/A"),
                results.optInt("day_length",               0),
                results.optString("civil_twilight_begin", "N/A"),
                results.optString("civil_twilight_end",   "N/A"));

        } catch (Exception e) {
            log.warn("[SunriseSunset] Failed", e);
            return defaultResult();
        }
    }

    private SunriseSunsetResult defaultResult() {
        return new SunriseSunsetResult("N/A", "N/A", "N/A", 0, "N/A", "N/A");
    }

    public record SunriseSunsetResult(
        String sunrise,
        String sunset,
        String solarNoon,
        int    dayLengthSeconds,
        String civilTwilightBegin,
        String civilTwilightEnd
    ) {}
}
