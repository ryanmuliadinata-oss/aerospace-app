package com.aerospace.controller;

import com.aerospace.model.FlightPlan;
import com.aerospace.model.FlightSimulationReport;
import com.aerospace.model.Waypoint;
import com.aerospace.service.FlightSimulationOrchestrator;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@RestController
@RequestMapping("/api")
public class SimulationController {

    private final FlightSimulationOrchestrator orchestrator;

    public SimulationController(FlightSimulationOrchestrator orchestrator) {
        this.orchestrator = orchestrator;
    }

    @PostMapping("/simulate")
    public ResponseEntity<?> simulate(
            @RequestBody SimulationRequest req) throws Exception {

        // Input validation
        if (req == null)
            return ResponseEntity.badRequest()
                .body("{\"error\":\"Request body is required\"}");

        if (req.flightId == null || req.flightId.isBlank() ||
            req.flightId.length() > 20)
            return ResponseEntity.badRequest()
                .body("{\"error\":\"Invalid flightId\"}");

        if (req.origin == null || req.origin.length() != 4 ||
            !req.origin.matches("[A-Z0-9]+"))
            return ResponseEntity.badRequest()
                .body("{\"error\":\"Invalid origin ICAO code\"}");

        if (req.destination == null || req.destination.length() != 4 ||
            !req.destination.matches("[A-Z0-9]+"))
            return ResponseEntity.badRequest()
                .body("{\"error\":\"Invalid destination ICAO code\"}");

        if (req.fuelCapacityKg <= 0 || req.fuelCapacityKg > 500000)
            return ResponseEntity.badRequest()
                .body("{\"error\":\"Invalid fuel capacity\"}");

        if (req.cruiseSpeedKts <= 0 || req.cruiseSpeedKts > 2000)
            return ResponseEntity.badRequest()
                .body("{\"error\":\"Invalid cruise speed\"}");

        if (req.waypoints == null || req.waypoints.size() < 2 ||
            req.waypoints.size() > 20)
            return ResponseEntity.badRequest()
                .body("{\"error\":\"Waypoints must be between 2 and 20\"}");

        for (Waypoint wp : req.waypoints) {
            if (wp.latitude < -90 || wp.latitude > 90 ||
                wp.longitude < -180 || wp.longitude > 180)
                return ResponseEntity.badRequest()
                    .body("{\"error\":\"Invalid waypoint coordinates\"}");
        }

        FlightPlan plan = new FlightPlan(
            req.flightId.trim(),
            req.aircraftType,
            req.origin.trim(),
            req.destination.trim(),
            req.fuelCapacityKg,
            req.cruiseSpeedKts,
            req.waypoints,
            Instant.now()
        );

        FlightSimulationReport report =
            orchestrator.simulate("system", plan);

        return ResponseEntity.ok(SimulationResponse.from(report));
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("OK");
    }
}