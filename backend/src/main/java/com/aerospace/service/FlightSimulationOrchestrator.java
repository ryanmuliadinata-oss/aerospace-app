package com.aerospace.service;

import com.aerospace.client.*;
import com.aerospace.model.*;
import com.aerospace.store.ApiKeyStore;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class FlightSimulationOrchestrator {

    private final AviationWeatherClient  weatherClient;
    private final OpenMeteoClient        windClient;
    private final FlightAwareClient      fuelClient;
    private final TurbulenceClient       turbulenceClient;
    private final ApiKeyStore            keyStore;
    private final AlternateAirportService alternateService;
    private final NotamClient notamClient;
    public FlightSimulationOrchestrator(
            AviationWeatherClient  weatherClient,
            OpenMeteoClient        windClient,
            FlightAwareClient      fuelClient,
            TurbulenceClient       turbulenceClient,
            ApiKeyStore            keyStore,
            AlternateAirportService alternateService,
            NotamClient notamClient) 
            {
        this.weatherClient    = weatherClient;
        this.windClient       = windClient;
        this.fuelClient       = fuelClient;
        this.turbulenceClient = turbulenceClient;
        this.keyStore         = keyStore;
        this.alternateService = alternateService;
        this.notamClient = notamClient;
    }

    public FlightSimulationReport simulate(String userId, FlightPlan plan)
            throws Exception {

        List<WeatherReport> weatherReports = new ArrayList<>();
        for (Waypoint wp : plan.waypoints) {
            try {
                weatherReports.add(weatherClient.fetchMetar(userId, wp));
            } catch (Exception e) {
                System.err.println("[Weather] METAR failed for " + wp.name + ": " + e.getMessage());
                weatherReports.add(new WeatherReport(wp, 0, 0, 0, 1013.25, "UNKN", "N/A", false));
            }
        }

        List<WindLayer> windLayers = new ArrayList<>();
        try {
            Waypoint first = plan.waypoints.get(0);
            windLayers = windClient.fetchWindLayers(first.latitude, first.longitude);
        } catch (Exception e) {
            System.err.println("[Wind] OpenMeteo failed: " + e.getMessage());
        }

        FuelReport fuelReport;
        try {
            fuelReport = fuelClient.fetchFuelEstimate(userId, plan);
        } catch (Exception e) {
            System.err.println("[Fuel] FlightAware unavailable: " + e.getMessage());
            double estimatedBurn    = plan.fuelCapacityKg * 0.65;
            double estimatedReserve = plan.fuelCapacityKg * 0.05;
            double estimatedAltn    = plan.fuelCapacityKg * 0.10;
            fuelReport = new FuelReport(plan.flightId, estimatedBurn,
                estimatedReserve, estimatedAltn, plan.fuelCapacityKg);
        }

        List<TurbulenceReport> turbulenceReports = new ArrayList<>();
        try {
            turbulenceReports = turbulenceClient.fetchTurbulence(userId, plan.waypoints);
        } catch (Exception e) {
            System.err.println("[Turbulence] PIREP failed: " + e.getMessage());
        }

        double flightTimeHrs = plan.cruiseSpeedKts > 0
            ? estimateDistanceNm(plan.waypoints) / plan.cruiseSpeedKts
            : 0;

        String recommendedAlt = windLayers.isEmpty() ? "FL350" : windLayers.stream()
            .min((a, b) -> Double.compare(a.speedKts, b.speedKts))
            .map(w -> "FL" + (int)(w.altitudeFt / 100))
            .orElse("FL350");

        FlightSimulationReport report = new FlightSimulationReport(
            plan, weatherReports, fuelReport,
            windLayers, turbulenceReports, recommendedAlt, flightTimeHrs);

        // Suggest alternates only on NO-GO
        if (!report.goNoGoDecision.startsWith("GO")) {
            Waypoint dest = plan.waypoints.get(plan.waypoints.size() - 1);
            report.alternates = alternateService.suggest(
                plan.origin, plan.destination, dest);
        }
// Fetch NOTAMs for origin and destination
List<com.aerospace.client.NotamClient.NotamItem> notams = new ArrayList<>();
notams.addAll(notamClient.fetchNotams(plan.origin));
notams.addAll(notamClient.fetchNotams(plan.destination));
report.notams = notams;
        return report;
    }

    private double estimateDistanceNm(List<Waypoint> waypoints) {
        if (waypoints == null || waypoints.size() < 2) return 0;
        double total = 0;
        for (int i = 0; i < waypoints.size() - 1; i++) {
            total += haversineNm(waypoints.get(i), waypoints.get(i + 1));
        }
        return total;
    }

    private double haversineNm(Waypoint a, Waypoint b) {
        final double R = 3440.065;
        double dLat = Math.toRadians(b.latitude  - a.latitude);
        double dLon = Math.toRadians(b.longitude - a.longitude);
        double sinDLat = Math.sin(dLat / 2);
        double sinDLon = Math.sin(dLon / 2);
        double h = sinDLat * sinDLat
            + Math.cos(Math.toRadians(a.latitude))
            * Math.cos(Math.toRadians(b.latitude))
            * sinDLon * sinDLon;
        return 2 * R * Math.asin(Math.sqrt(h));
    }
}