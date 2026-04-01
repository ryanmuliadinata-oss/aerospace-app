package com.aerospace.client;

import org.json.JSONObject;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

@Component
public class SunriseSunsetClient {

    private static final String BASE = "https://api.sunrise-sunset.org/json";
    private final HttpClient http = HttpClient.newHttpClient();

    public SunriseSunsetResult fetch(double lat, double lon) {
        try {
            String url = BASE + "?lat=" + lat + "&lng=" + lon + "&formatted=0";

            HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Accept", "application/json")
                .GET()
                .build();

            HttpResponse<String> res = http.send(
                req, HttpResponse.BodyHandlers.ofString());

            if (res.statusCode() != 200) return defaultResult();

            JSONObject body    = new JSONObject(res.body());
            JSONObject results = body.optJSONObject("results");
            if (results == null) return defaultResult();

            String sunrise     = results.optString("sunrise",       "N/A");
            String sunset      = results.optString("sunset",        "N/A");
            String solarNoon   = results.optString("solar_noon",    "N/A");
            int    dayLength   = results.optInt("day_length",        0);
            String civilTwilightBegin = results.optString("civil_twilight_begin", "N/A");
            String civilTwilightEnd   = results.optString("civil_twilight_end",   "N/A");

            return new SunriseSunsetResult(sunrise, sunset, solarNoon,
                dayLength, civilTwilightBegin, civilTwilightEnd);

        } catch (Exception e) {
            System.err.println("[SunriseSunset] Failed: " + e.getMessage());
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