package com.aerospace.controller;

import com.aerospace.controller.RunwayRequest.WeatherInput;
import com.aerospace.model.FlightPlan;
import com.aerospace.model.FlightSimulationReport;
import com.aerospace.model.Waypoint;
import com.aerospace.service.FlightSimulationOrchestrator;
import com.aerospace.service.GreatCircleService;
import com.aerospace.service.RunwayAnalysisService;
import com.aerospace.service.EtopsService;
import com.aerospace.service.EtopsService.EtopsResult;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api")
public class SimulationController {

    private static final Set<String> VALID_FLIGHT_CATEGORIES =
        Set.of("VFR", "MVFR", "IFR", "LIFR", "UNKN");

    private final FlightSimulationOrchestrator orchestrator;
    private final GreatCircleService           greatCircleService;
    private final RunwayAnalysisService        runwayService;
    private final EtopsService                 etopsService;

    public SimulationController(FlightSimulationOrchestrator orchestrator,
                                GreatCircleService greatCircleService,
                                RunwayAnalysisService runwayService,
                                EtopsService etopsService) {
        this.orchestrator       = orchestrator;
        this.greatCircleService = greatCircleService;
        this.runwayService      = runwayService;
        this.etopsService       = etopsService;
    }

    // ── /api/simulate ─────────────────────────────────────────────────────────

    @PostMapping("/simulate")
    public ResponseEntity<?> simulate(@RequestBody SimulationRequest req) throws Exception {

        if (req == null)
            return err("Request body is required");

        if (req.flightId == null || req.flightId.isBlank() || req.flightId.length() > 20
                || !req.flightId.matches("[A-Z0-9]{1,20}"))
            return err("flightId must be 1–20 uppercase alphanumeric characters");

        if (!isValidIcao(req.origin))
            return err("Invalid origin ICAO code");

        if (!isValidIcao(req.destination))
            return err("Invalid destination ICAO code");

        if (req.aircraftType == null || req.aircraftType.isBlank()
                || !req.aircraftType.matches("[A-Z0-9]{2,10}"))
            return err("aircraftType must be 2–10 uppercase alphanumeric characters");

        if (req.fuelCapacityKg <= 0 || req.fuelCapacityKg > 500_000)
            return err("fuelCapacityKg must be between 1 and 500000");

        if (req.cruiseSpeedKts <= 0 || req.cruiseSpeedKts > 2_000)
            return err("cruiseSpeedKts must be between 1 and 2000");

        if (req.waypoints == null || req.waypoints.size() < 2 || req.waypoints.size() > 20)
            return err("waypoints must contain 2–20 entries");

        for (Waypoint wp : req.waypoints) {
            if (wp == null)
                return err("Waypoint must not be null");
            if (wp.name == null || wp.name.isBlank() || wp.name.length() > 10)
                return err("Waypoint name must be 1–10 characters");
            if (wp.latitude < -90 || wp.latitude > 90
                    || wp.longitude < -180 || wp.longitude > 180)
                return err("Waypoint coordinates out of range");
            if (wp.altitudeFt < -1_000 || wp.altitudeFt > 60_000)
                return err("Waypoint altitudeFt must be between -1000 and 60000");
        }

        FlightPlan plan = new FlightPlan(
            req.flightId.trim(),
            req.aircraftType.trim(),
            req.origin.trim(),
            req.destination.trim(),
            req.fuelCapacityKg,
            req.cruiseSpeedKts,
            req.waypoints,
            Instant.now()
        );

        FlightSimulationReport report = orchestrator.simulate(plan);
        return ResponseEntity.ok(SimulationResponse.from(report));
    }

    // ── /api/health ───────────────────────────────────────────────────────────

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("OK");
    }

    // ── /api/greatcircle ──────────────────────────────────────────────────────

    @GetMapping("/greatcircle")
    public ResponseEntity<?> greatCircle(
            @RequestParam String origin,
            @RequestParam String destination,
            @RequestParam(defaultValue = "3")     int    waypoints,
            @RequestParam(defaultValue = "35000") double altitude) {

        if (!isValidIcao(origin))
            return err("Invalid origin ICAO code");

        if (!isValidIcao(destination))
            return err("Invalid destination ICAO code");

        if (waypoints < 0 || waypoints > 20)
            return err("waypoints must be between 0 and 20");

        if (altitude < 0 || altitude > 60_000)
            return err("altitude must be between 0 and 60000 ft");

        try {
            return ResponseEntity.ok(greatCircleService.calculate(
                origin.toUpperCase(), destination.toUpperCase(),
                waypoints, altitude));
        } catch (IllegalArgumentException e) {
            return jsonError(e.getMessage());
        }
    }

    // ── /api/runway ───────────────────────────────────────────────────────────

    @PostMapping("/runway")
    public ResponseEntity<?> runway(@RequestBody RunwayRequest req) {

        if (req == null)
            return err("Request body is required");

        if (req.aircraftType == null || req.aircraftType.isBlank()
                || !req.aircraftType.matches("[A-Z0-9]{2,10}"))
            return err("aircraftType must be 2–10 uppercase alphanumeric characters");

        if (req.weather == null)
            return err("weather is required");

        WeatherInput w = req.weather;

        if (w.windSpeedKts < 0 || w.windSpeedKts > 250)
            return err("windSpeedKts must be between 0 and 250");

        if (w.windDirectionDeg < 0 || w.windDirectionDeg > 360)
            return err("windDirectionDeg must be between 0 and 360");

        if (w.temperatureCelsius < -90 || w.temperatureCelsius > 60)
            return err("temperatureCelsius must be between -90 and 60");

        if (w.pressureHpa < 850 || w.pressureHpa > 1_100)
            return err("pressureHpa must be between 850 and 1100");

        if (w.flightCategory == null || !VALID_FLIGHT_CATEGORIES.contains(w.flightCategory))
            return err("flightCategory must be one of: VFR, MVFR, IFR, LIFR, UNKN");

        if (w.rawMetar != null && w.rawMetar.length() > 500)
            return err("rawMetar must not exceed 500 characters");

        if (req.fuelKg < 0 || req.fuelKg > 600_000)
            return err("fuelKg must be between 0 and 600000");

        if (req.payloadKg < 0 || req.payloadKg > 200_000)
            return err("payloadKg must be between 0 and 200000");

        try {
            return ResponseEntity.ok(runwayService.analyze(
                req.aircraftType, req.weather,
                req.fuelKg, req.payloadKg));
        } catch (Exception e) {
            return jsonError(e.getMessage());
        }
    }

    // ── /api/etops ────────────────────────────────────────────────────────────

    public static class EtopsRequest {
        public List<Waypoint> waypoints;
        public String         aircraftType  = "B737";
        public int            etopsRating   = 180;
        public List<String>   excludeIcaos  = List.of();
    }

    @PostMapping("/etops")
    public ResponseEntity<?> etops(@RequestBody EtopsRequest req) {

        if (req == null)
            return err("Request body is required");

        if (req.waypoints == null || req.waypoints.size() < 2)
            return err("At least 2 waypoints are required");

        if (req.waypoints.size() > 100)
            return err("Too many waypoints (max 100)");

        if (req.etopsRating < 60 || req.etopsRating > 240)
            return err("etopsRating must be between 60 and 240 minutes");

        if (req.aircraftType != null && !req.aircraftType.isBlank()
                && !req.aircraftType.matches("[A-Z0-9]{2,10}"))
            return err("aircraftType must be 2–10 uppercase alphanumeric characters");

        if (req.excludeIcaos != null) {
            if (req.excludeIcaos.size() > 20)
                return err("excludeIcaos must not exceed 20 entries");
            for (String icao : req.excludeIcaos) {
                if (!isValidIcao(icao))
                    return err("Invalid ICAO in excludeIcaos: " + icao);
            }
        }

        for (Waypoint wp : req.waypoints) {
            if (wp == null)
                return err("Waypoint must not be null");
            if (wp.name == null || wp.name.isBlank() || wp.name.length() > 20)
                return err("Waypoint name must be 1–20 characters");
            if (wp.latitude < -90 || wp.latitude > 90
                    || wp.longitude < -180 || wp.longitude > 180)
                return err("Waypoint coordinates out of range");
            if (wp.altitudeFt < -1_000 || wp.altitudeFt > 60_000)
                return err("Waypoint altitudeFt must be between -1000 and 60000");
        }

        try {
            EtopsResult result = etopsService.check(
                req.waypoints, req.aircraftType,
                req.etopsRating, req.excludeIcaos);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return jsonError(e.getMessage());
        }
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private static boolean isValidIcao(String code) {
        return code != null && code.length() == 4 && code.matches("[A-Z0-9]{4}");
    }

    private static ResponseEntity<String> err(String msg) {
        return ResponseEntity.badRequest()
            .body("{\"error\":\"" + msg + "\"}");
    }

    // Safely embeds an untrusted message in a JSON string.
    private static ResponseEntity<String> jsonError(String msg) {
        String safe = msg == null ? "Unknown error"
            : msg.replace("\\", "\\\\").replace("\"", "\\\"");
        return ResponseEntity.badRequest()
            .body("{\"error\":\"" + safe + "\"}");
    }
}
