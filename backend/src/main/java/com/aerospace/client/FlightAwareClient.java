package com.aerospace.client;

import com.aerospace.model.AerospaceApi;
import com.aerospace.model.FlightPlan;
import com.aerospace.model.FuelReport;
import com.aerospace.store.ApiCredential;
import com.aerospace.store.ApiKeyStore;
import org.json.JSONObject;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

@Component
public class FlightAwareClient {

    private static final double GAL_TO_KG = 2.85;

    private final ApiKeyStore store;
    private final HttpClient  http = HttpClient.newHttpClient();

    public FlightAwareClient(ApiKeyStore store) { this.store = store; }

    public FuelReport fetchFuelEstimate(String userId, FlightPlan plan)
            throws Exception {

        ApiCredential cred = store.get(userId, AerospaceApi.FLIGHTAWARE);

        HttpRequest req = HttpRequest.newBuilder()
            .uri(URI.create(AerospaceApi.FLIGHTAWARE.baseUrl
                + "/flights/" + plan.flightId + "/fuel_estimate"))
            .header("x-apikey", cred.rawKey())
            .header("Accept", "application/json; charset=UTF-8")
            .GET()
            .build();

        HttpResponse<String> res = http.send(
            req, HttpResponse.BodyHandlers.ofString());

        if (res.statusCode() != 200)
            throw new RuntimeException(
                "[FlightAware] HTTP " + res.statusCode()
                + " for flight " + plan.flightId + ": " + res.body());

        JSONObject fuel = new JSONObject(res.body())
            .getJSONObject("fuel_estimate");

        return new FuelReport(plan.flightId,
            fuel.getDouble("burn_gallons")      * GAL_TO_KG,
            fuel.getDouble("reserve_gallons")   * GAL_TO_KG,
            fuel.getDouble("alternate_gallons") * GAL_TO_KG,
            plan.fuelCapacityKg);
    }
}