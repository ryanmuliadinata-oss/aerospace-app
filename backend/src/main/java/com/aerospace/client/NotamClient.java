package com.aerospace.client;

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
public class NotamClient {

    private static final Logger log = LoggerFactory.getLogger(NotamClient.class);
    private static final String BASE =
        "https://external-api.faa.gov/notamapi/v1/notams";

    private final HttpClient http;

    public NotamClient(HttpClient http) { this.http = http; }

    public List<NotamItem> fetchNotams(String icaoCode) {
        try {
            String id  = URLEncoder.encode(icaoCode, StandardCharsets.UTF_8);
            String url = BASE
                + "?icaoLocation=" + id
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

            if (res.statusCode() != 200) {
                log.warn("[NOTAM] HTTP {} for {}", res.statusCode(), icaoCode);
                return List.of();
            }

            JSONObject body  = new JSONObject(res.body());
            JSONArray  items = body.optJSONArray("items");
            if (items == null) return List.of();

            List<NotamItem> notams = new ArrayList<>();
            for (int i = 0; i < items.length(); i++) {
                JSONObject item       = items.getJSONObject(i);
                JSONObject properties = item.optJSONObject("properties");
                if (properties == null) continue;

                JSONObject core = properties.optJSONObject("coreNOTAMData");
                if (core == null) continue;

                JSONObject notam = core.optJSONObject("notam");
                if (notam == null) continue;

                notams.add(new NotamItem(
                    notam.optString("number",         "N/A"),
                    notam.optString("text",           "N/A"),
                    notam.optString("effectiveStart", ""),
                    notam.optString("effectiveEnd",   ""),
                    notam.optString("classification", "")));
            }
            return notams;

        } catch (Exception e) {
            log.warn("[NOTAM] Failed for {}", icaoCode, e);
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
