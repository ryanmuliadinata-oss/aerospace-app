package com.aerospace.client;

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
public class NotamClient {

    private static final String BASE =
        "https://external-api.faa.gov/notamapi/v1/notams";

    private final HttpClient http = HttpClient.newHttpClient();

    public List<NotamItem> fetchNotams(String icaoCode) {
        try {
            String url = BASE
                + "?icaoLocation=" + icaoCode
                + "&pageSize=5"
                + "&sortBy=issueDate"
                + "&sortOrder=Desc";

            HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Accept", "application/json")
                .GET()
                .build();

            HttpResponse<String> res = http.send(
                req, HttpResponse.BodyHandlers.ofString());

            if (res.statusCode() != 200) return List.of();

            JSONObject body  = new JSONObject(res.body());
            JSONArray  items = body.optJSONArray("items");
            if (items == null) return List.of();

            List<NotamItem> notams = new ArrayList<>();
            for (int i = 0; i < items.length(); i++) {
                JSONObject item       = items.getJSONObject(i);
                JSONObject properties = item.optJSONObject("properties");
                if (properties == null) continue;

                String id       = properties.optString("coreNOTAMData", "");
                JSONObject core = properties.optJSONObject("coreNOTAMData");
                if (core == null) continue;

                JSONObject notam = core.optJSONObject("notam");
                if (notam == null) continue;

                String number    = notam.optString("number",      "N/A");
                String text      = notam.optString("text",        "N/A");
                String effective = notam.optString("effectiveStart", "");
                String expires   = notam.optString("effectiveEnd",   "");
                String type      = notam.optString("classification", "");

                notams.add(new NotamItem(number, text, effective, expires, type));
            }
            return notams;

        } catch (Exception e) {
            System.err.println("[NOTAM] Failed for " + icaoCode + ": " + e.getMessage());
            return List.of();
        }
    }

    public record NotamItem(
        String number,
        String text,
        String effectiveStart,
        String effectiveEnd,
        String classification
    ) {}
}