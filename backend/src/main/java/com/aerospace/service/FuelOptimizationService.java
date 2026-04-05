package com.aerospace.service;
 
import com.aerospace.model.FlightPlan;
import com.aerospace.model.WindLayer;
import com.aerospace.model.Waypoint;
import org.springframework.stereotype.Service;
 
import java.util.*;
 
/**
 * FuelOptimizationService
 *
 * For a given route and set of winds-aloft layers, computes the
 * fuel burn at every available flight level and recommends the
 * most fuel-efficient altitude.
 *
 * Physics model:
 *  - Specific Air Range (SAR) degrades with headwind and improves with tailwind
 *  - Fuel flow scales with True Airspeed, air density, and a per-aircraft
 *    Thrust Specific Fuel Consumption (TSFC) factor
 *  - ISA temperature deviation adds a small penalty (hot = denser fuel burn)
 *  - Step-climb option: checks if splitting the route into two FLs saves fuel
 */
@Service
public class FuelOptimizationService {
 
    // Jet-A price per kg USD — industry average 2024
    private static final double JET_A_USD_PER_KG = 0.90;
 
    // Per-aircraft: { baseFuelFlowKgPerHr at FL350/ISA, optimalFL, maxFL }
    private static final Map<String, double[]> AIRCRAFT_DATA = Map.of(
        "B737", new double[]{ 2_400, 350, 390 },
        "A320", new double[]{ 2_350, 350, 390 },
        "B777", new double[]{ 7_200, 350, 430 },
        "B747", new double[]{ 9_800, 350, 430 },
        "A380", new double[]{ 11_500, 350, 430 }
    );
 
    // Flight levels we evaluate (in hundreds of feet)
    private static final int[] CANDIDATE_FLS = { 280, 300, 320, 330, 340, 350, 360, 370, 380, 390 };
 
    public FuelOptimizationResult optimize(FlightPlan plan, List<WindLayer> windLayers) {
 
        double distanceNm   = estimateDistanceNm(plan.waypoints);
        double routeBearing = estimateBearing(plan.waypoints);
        double[] aircraftData = AIRCRAFT_DATA.getOrDefault(
            plan.aircraftType, new double[]{ 2_400, 350, 390 });
 
        double baseFuelFlowKgHr = aircraftData[0];
        int    maxFL            = (int) aircraftData[2];
 
        List<FlightLevelOption> options = new ArrayList<>();
 
        for (int fl : CANDIDATE_FLS) {
            if (fl > maxFL) continue;
 
            double altFt = fl * 100.0;
 
            // Find the closest wind layer to this FL
            WindLayer wind = closestLayer(windLayers, altFt);
 
            // Headwind component along route bearing (negative = tailwind)
            double headwindKts = wind != null
                ? headwindComponent(wind.speedKts, wind.directionDeg, routeBearing)
                : 0;
 
            // ISA temperature at this altitude
            double isaTempC = 15.0 - (altFt / 1000.0) * 1.98;
            double tempDeviationC = wind != null
                ? wind.temperatureCelsius - isaTempC
                : 0;
 
            // Altitude density factor — thinner air = lower fuel flow but also less thrust
            // Net effect: fuel flow reduces ~1.5% per 1,000 ft above FL280 baseline
            double altitudeFactor = 1.0 - Math.max(0, (altFt - 28_000) / 1_000.0) * 0.015;
 
            // Temperature deviation penalty — hot air increases fuel burn ~0.4% per °C above ISA
            double tempFactor = 1.0 + Math.max(0, tempDeviationC) * 0.004;
 
            // Adjusted fuel flow at this FL
            double fuelFlowKgHr = baseFuelFlowKgHr * altitudeFactor * tempFactor;
 
            // Effective ground speed = cruise TAS adjusted for headwind
            // TAS increases slightly with altitude: ~2 kts per 1,000 ft above FL280
            double tas = plan.cruiseSpeedKts + Math.max(0, (altFt - 28_000) / 1_000.0) * 2.0;
            double groundSpeedKts = Math.max(100, tas - headwindKts);
 
            // Flight time at this FL
            double flightTimeHrs = distanceNm / groundSpeedKts;
 
            // Total block fuel (burn only — reserves added separately)
            double blockFuelKg = fuelFlowKgHr * flightTimeHrs;
 
            // Dollar cost
            double costUsd = blockFuelKg * JET_A_USD_PER_KG;
 
            options.add(new FlightLevelOption(
                fl,
                blockFuelKg,
                flightTimeHrs,
                costUsd,
                headwindKts,
                wind != null ? wind.temperatureCelsius : isaTempC,
                tempDeviationC,
                groundSpeedKts
            ));
        }
 
        // Sort by fuel burn ascending
        options.sort(Comparator.comparingDouble(o -> o.blockFuelKg));
 
        if (options.isEmpty()) {
            return new FuelOptimizationResult(Collections.emptyList(), 350, 0, 0, 0, "No wind data available", false, null);
        }
 
        FlightLevelOption best    = options.get(0);
        FlightLevelOption current = options.stream()
            .filter(o -> o.flightLevel == nearestCandidateFL(plan.waypoints))
            .findFirst()
            .orElse(options.get(options.size() / 2)); // mid-point as baseline
 
        double fuelSavedKg  = current.blockFuelKg - best.blockFuelKg;
        double costSavedUsd = fuelSavedKg * JET_A_USD_PER_KG;
 
        // Step climb check — is splitting at midpoint into two FLs worth it?
        boolean stepClimbWorthIt = false;
        String  stepClimbAdvice  = "";
        if (options.size() >= 2) {
            FlightLevelOption second = options.get(1);
            // If second best is adjacent FL and saves >100kg, recommend step climb
            if (Math.abs(second.flightLevel - best.flightLevel) == 10
                    && (current.blockFuelKg - second.blockFuelKg) > 100) {
                stepClimbWorthIt = true;
                stepClimbAdvice = String.format(
                    "Consider step climb: depart at FL%d, climb to FL%d at mid-route",
                    second.flightLevel, best.flightLevel);
            }
        }
 
        String recommendation = buildRecommendation(best, fuelSavedKg, costSavedUsd);
 
        return new FuelOptimizationResult(
            options,
            best.flightLevel,
            fuelSavedKg,
            costSavedUsd,
            best.blockFuelKg,
            recommendation,
            stepClimbWorthIt,
            stepClimbAdvice
        );
    }
 
    // ── helpers ──────────────────────────────────────────────────────────────
 
    private double headwindComponent(double windSpeedKts, double windDirDeg,
                                      double routeBearingDeg) {
        // Wind direction is where wind is FROM; we want component opposing route
        double angleDiff = Math.toRadians(windDirDeg - routeBearingDeg);
        return windSpeedKts * Math.cos(angleDiff);
    }
 
    private WindLayer closestLayer(List<WindLayer> layers, double altFt) {
        if (layers == null || layers.isEmpty()) return null;
        return layers.stream()
            .min(Comparator.comparingDouble(l -> Math.abs(l.altitudeFt - altFt)))
            .orElse(null);
    }
 
    private double estimateDistanceNm(List<Waypoint> waypoints) {
        if (waypoints == null || waypoints.size() < 2) return 1000;
        double total = 0;
        for (int i = 0; i < waypoints.size() - 1; i++) {
            total += haversineNm(waypoints.get(i), waypoints.get(i + 1));
        }
        return total;
    }
 
    private double estimateBearing(List<Waypoint> waypoints) {
        if (waypoints == null || waypoints.size() < 2) return 90;
        Waypoint a = waypoints.get(0);
        Waypoint b = waypoints.get(waypoints.size() - 1);
        double dLon = Math.toRadians(b.longitude - a.longitude);
        double lat1 = Math.toRadians(a.latitude);
        double lat2 = Math.toRadians(b.latitude);
        double x = Math.sin(dLon) * Math.cos(lat2);
        double y = Math.cos(lat1) * Math.sin(lat2)
                 - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
        return (Math.toDegrees(Math.atan2(x, y)) + 360) % 360;
    }
 
    private int nearestCandidateFL(List<Waypoint> waypoints) {
        // Use filed altitude from first waypoint as baseline, snap to candidate
        if (waypoints == null || waypoints.isEmpty()) return 350;
        double filed = waypoints.stream()
            .mapToDouble(w -> w.altitudeFt)
            .filter(a -> a > 0)
            .max().orElse(35000);
        int filedFL = (int) Math.round(filed / 100.0);
        int nearest = CANDIDATE_FLS[0];
        for (int fl : CANDIDATE_FLS) {
            if (Math.abs(fl - filedFL) < Math.abs(nearest - filedFL)) nearest = fl;
        }
        return nearest;
    }
 
    private double haversineNm(Waypoint a, Waypoint b) {
        final double R = 3440.065;
        double dLat = Math.toRadians(b.latitude  - a.latitude);
        double dLon = Math.toRadians(b.longitude - a.longitude);
        double h = Math.sin(dLat/2) * Math.sin(dLat/2)
                 + Math.cos(Math.toRadians(a.latitude))
                 * Math.cos(Math.toRadians(b.latitude))
                 * Math.sin(dLon/2) * Math.sin(dLon/2);
        return 2 * R * Math.asin(Math.sqrt(h));
    }
 
    private String buildRecommendation(FlightLevelOption best,
                                        double savedKg, double savedUsd) {
        String wind = best.headwindKts > 5
            ? String.format("despite %.0f kt headwind", best.headwindKts)
            : best.headwindKts < -5
            ? String.format("aided by %.0f kt tailwind", Math.abs(best.headwindKts))
            : "near-calm winds";
 
        if (savedKg < 50) {
            return String.format("FL%d is optimal (%s). Marginal difference across levels.",
                best.flightLevel, wind);
        }
        return String.format(
            "FL%d saves %.0f kg (US$%.0f) vs filed altitude — %s, ISA%+.1f°C",
            best.flightLevel, savedKg, savedUsd, wind, best.tempDeviationC);
    }
 
    // ── result types ─────────────────────────────────────────────────────────
 
    public record FlightLevelOption(
        int    flightLevel,
        double blockFuelKg,
        double flightTimeHrs,
        double costUsd,
        double headwindKts,
        double tempCelsius,
        double tempDeviationC,
        double groundSpeedKts
    ) {}
 
    public static class FuelOptimizationResult {
        public final List<FlightLevelOption> flightLevels;
        public final int    optimalFL;
        public final double fuelSavedKg;
        public final double costSavedUsd;
        public final double optimalBlockFuelKg;
        public final String recommendation;
        public final boolean stepClimbRecommended;
        public final String  stepClimbAdvice;
 
        public FuelOptimizationResult(
                List<FlightLevelOption> flightLevels,
                int optimalFL, double fuelSavedKg, double costSavedUsd,
                double optimalBlockFuelKg, String recommendation,
                boolean stepClimbRecommended, String stepClimbAdvice) {
            this.flightLevels          = flightLevels;
            this.optimalFL             = optimalFL;
            this.fuelSavedKg           = fuelSavedKg;
            this.costSavedUsd          = costSavedUsd;
            this.optimalBlockFuelKg    = optimalBlockFuelKg;
            this.recommendation        = recommendation;
            this.stepClimbRecommended  = stepClimbRecommended;
            this.stepClimbAdvice       = stepClimbAdvice;
        }
    }
}