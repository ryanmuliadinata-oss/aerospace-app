package com.aerospace.client;

import com.aerospace.model.WindLayer;
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
public class OpenMeteoClient {

    private static final String BASE =
        "https://api.open-meteo.com/v1/forecast";

    private static final int[][] LEVELS = {
        {250, 34000},
        {300, 30000},
        {500, 18000},
        {700, 10000}
    };

    private final HttpClient http = HttpClient.newHttpClient();

    public List<WindLayer> fetchWindLayers(double lat, double lon)
            throws Exception {

        String url = String.format(
            "%s?latitude=%.4f&longitude=%.4f"
            + "&hourly=windspeed_250hPa,winddirection_250hPa,temperature_250hPa"
            + ",windspeed_300hPa,winddirection_300hPa,temperature_300hPa"
            + ",windspeed_500hPa,winddirection_500hPa,temperature_500hPa"
            + ",windspeed_700hPa,winddirection_700hPa,temperature_700hPa"
            + "&wind_speed_unit=kn&forecast_days=1",
            BASE, lat, lon);

        HttpResponse<String> res = http.send(
            HttpRequest.newBuilder().uri(URI.create(url)).GET().build(),
            HttpResponse.BodyHandlers.ofString());

        if (res.statusCode() != 200)
            throw new RuntimeException(
                "[OpenMeteo] HTTP " + res.statusCode() + ": " + res.body());

        JSONObject hourly = new JSONObject(res.body()).getJSONObject("hourly");

        List<WindLayer> layers = new ArrayList<>();
        for (int[] level : LEVELS) {
            int    hPa   = level[0];
            double altFt = level[1];
            layers.add(new WindLayer(altFt,
                hourly.getJSONArray("windspeed_"     + hPa + "hPa").getDouble(0),
                hourly.getJSONArray("winddirection_" + hPa + "hPa").getDouble(0),
                hourly.getJSONArray("temperature_"   + hPa + "hPa").getDouble(0)));
        }
        return layers;
    }
}