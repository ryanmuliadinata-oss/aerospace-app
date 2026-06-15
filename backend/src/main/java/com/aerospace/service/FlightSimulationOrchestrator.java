package com.aerospace.service;

import com.aerospace.client.*;
import com.aerospace.client.NotamClient.NotamItem;
import com.aerospace.model.*;
import com.aerospace.service.FuelOptimizationService.FuelOptimizationResult;
import com.aerospace.util.GeoMath;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;

@Service
public class FlightSimulationOrchestrator {

    private final AviationWeatherClient   weatherClient;
    private final OpenMeteoClient         windClient;
    private final FlightAwareClient       fuelClient;
    private final TurbulenceClient        turbulenceClient;
    private final AlternateAirportService alternateService;
    private final NotamClient             notamClient;
    private final SunriseSunsetClient     sunriseSunsetClient;
    private final FuelOptimizationService fuelOptService;

    public FlightSimulationOrchestrator(
            AviationWeatherClient   weatherClient,
            OpenMeteoClient         windClient,
            FlightAwareClient       fuelClient,
            TurbulenceClient        turbulenceClient,
            AlternateAirportService alternateService,
            NotamClient             notamClient,
            SunriseSunsetClient     sunriseSunsetClient,
            FuelOptimizationService fuelOptService) {
        this.weatherClient       = weatherClient;
        this.windClient          = windClient;
        this.fuelClient          = fuelClient;
        this.turbulenceClient    = turbulenceClient;
        this.alternateService    = alternateService;
        this.notamClient         = notamClient;
        this.sunriseSunsetClient = sunriseSunsetClient;
        this.fuelOptService      = fuelOptService;
    }

    public FlightSimulationReport simulate(FlightPlan plan) throws Exception {
        Waypoint origin = plan.waypoints.get(0);
        Waypoint dest   = plan.waypoints.get(plan.waypoints.size() - 1);

        // Fan out all network I/O simultaneously ──────────────────────────────
        List<CompletableFuture<WeatherReport>> metarFutures = plan.waypoints.stream()
            .map(wp -> CompletableFuture.supplyAsync(() -> {
                try {
                    return weatherClient.fetchMetar(wp);
                } catch (Exception e) {
                    System.err.println("[Weather] METAR failed for " + wp.name + ": " + e.getMessage());
                    return new WeatherReport(wp, 0, 0, 0, 1013.25, "UNKN", "N/A", false);
                }
            }))
            .toList();

        var windFuture = CompletableFuture.supplyAsync(() -> {
            try {
                return windClient.fetchWindLayers(origin.latitude, origin.longitude);
            } catch (Exception e) {
                System.err.println("[Wind] OpenMeteo failed: " + e.getMessage());
                return List.<WindLayer>of();
            }
        });

        var fuelFuture = CompletableFuture.supplyAsync(() -> {
            try {
                return fuelClient.fetchFuelEstimate(plan);
            } catch (Exception e) {
                System.err.println("[Fuel] FlightAware unavailable: " + e.getMessage());
                return new FuelReport(plan.flightId,
                    plan.fuelCapacityKg * 0.65,
                    plan.fuelCapacityKg * 0.05,
                    plan.fuelCapacityKg * 0.10,
                    plan.fuelCapacityKg);
            }
        });

        var turbFuture = CompletableFuture.supplyAsync(() -> {
            try {
                return turbulenceClient.fetchTurbulence(plan.waypoints);
            } catch (Exception e) {
                System.err.println("[Turbulence] PIREP failed: " + e.getMessage());
                return List.<TurbulenceReport>of();
            }
        });

        // NOTAMs: origin and destination fetched concurrently
        var notamFuture = CompletableFuture.supplyAsync(() -> {
            var of = CompletableFuture.supplyAsync(() -> notamClient.fetchNotams(plan.origin));
            var df = CompletableFuture.supplyAsync(() -> notamClient.fetchNotams(plan.destination));
            List<NotamItem> notams = new ArrayList<>(of.join());
            notams.addAll(df.join());
            return notams;
        });

        var sunFuture = CompletableFuture.supplyAsync(() ->
            sunriseSunsetClient.fetch(origin.latitude, origin.longitude));

        // Collect all I/O results ─────────────────────────────────────────────
        List<WeatherReport>    weatherReports    = metarFutures.stream().map(CompletableFuture::join).toList();
        List<WindLayer>        windLayers        = windFuture.join();
        FuelReport             fuelReport        = fuelFuture.join();
        List<TurbulenceReport> turbulenceReports = turbFuture.join();

        // Local computation (no network I/O) ──────────────────────────────────
        double flightTimeHrs  = plan.cruiseSpeedKts > 0
            ? GeoMath.routeDistanceNm(plan.waypoints) / plan.cruiseSpeedKts
            : 0;
        String recommendedAlt = optimizeFlightLevel(windLayers, plan);

        FuelOptimizationResult fuelOpt = null;
        try {
            fuelOpt = fuelOptService.optimize(plan, windLayers);
        } catch (Exception e) {
            System.err.println("[FuelOpt] Optimization failed: " + e.getMessage());
        }

        FlightSimulationReport report = new FlightSimulationReport(
            plan, weatherReports, fuelReport,
            windLayers, turbulenceReports, recommendedAlt, flightTimeHrs);

        report.flightLevelReason = buildFlightLevelReason(windLayers, recommendedAlt);
        report.fuelOptimization  = fuelOpt;

        if (!report.goNoGoDecision.startsWith("GO")) {
            report.alternates = alternateService.suggest(plan.origin, plan.destination, dest);
        }

        // These were already in flight while local computation ran
        report.notams        = notamFuture.join();
        report.sunriseSunset = sunFuture.join();

        return report;
    }

    private String optimizeFlightLevel(List<WindLayer> windLayers, FlightPlan plan) {
        if (windLayers.isEmpty()) return "FL350";

        return windLayers.stream()
            .map(w -> {
                double headwindPenalty = w.speedKts * 0.5;
                double isaTemp   = 15 - 1.98 * (w.altitudeFt / 1000);
                double tempBonus = (isaTemp - w.temperatureCelsius) * 0.3;
                double altBonus  = Math.min(w.altitudeFt / 1000, 39) * 0.5;
                double score = headwindPenalty - tempBonus - altBonus;
                return new double[]{ score, w.altitudeFt };
            })
            .min((a, b) -> Double.compare(a[0], b[0]))
            .map(w -> "FL" + (int)(w[1] / 100))
            .orElse("FL350");
    }

    private String buildFlightLevelReason(List<WindLayer> windLayers, String selectedAlt) {
        if (windLayers.isEmpty())
            return "Default cruise altitude — no wind data available";

        return windLayers.stream()
            .filter(w -> selectedAlt.equals("FL" + (int)(w.altitudeFt / 100)))
            .findFirst()
            .map(w -> String.format(
                "Best efficiency: %.0f kts wind, %.1f°C at %s",
                w.speedKts, w.temperatureCelsius, selectedAlt))
            .orElse("Optimal based on winds aloft data");
    }
}
