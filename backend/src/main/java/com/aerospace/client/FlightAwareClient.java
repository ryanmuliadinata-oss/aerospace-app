package com.aerospace.client;

import com.aerospace.model.FlightPlan;
import com.aerospace.model.FuelReport;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

@Component
public class FlightAwareClient {

    private static final String  BASE       = "https://aeroapi.flightaware.com/aeroapi";
    private static final double  GAL_TO_KG  = 2.85;

    @Value("${aerospace.api.flightaware.key:}")
    private String apiKey;

    private final HttpClient http;

    public FlightAwareClient(HttpClient http) { this.http = http; }

    public FuelReport fetchFuelEstimate(FlightPlan plan) throws Exception {
        if (apiKey == null || apiKey.isBlank())
            throw new RuntimeException("[FlightAware] API key not configured — set FLIGHTAWARE_API_KEY");

        HttpRequest req = HttpRequest.newBuilder()
            .uri(URI.create(BASE + "/flights/" + plan.flightId + "/fuel_estimate"))
            .header("x-apikey", apiKey)
            .header("Accept", "application/json; charset=UTF-8")
            .GET()
            .build();

        HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString());

        if (res.statusCode() != 200)
            throw new RuntimeException(
                "[FlightAware] HTTP " + res.statusCode()
                + " for flight " + plan.flightId + ": " + res.body());

        JSONObject fuel = new JSONObject(res.body()).getJSONObject("fuel_estimate");

        return new FuelReport(plan.flightId,
            fuel.getDouble("burn_gallons")      * GAL_TO_KG,
            fuel.getDouble("reserve_gallons")   * GAL_TO_KG,
            fuel.getDouble("alternate_gallons") * GAL_TO_KG,
            plan.fuelCapacityKg);
    }
}
