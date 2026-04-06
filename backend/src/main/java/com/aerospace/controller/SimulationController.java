package com.aerospace.controller;
 
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
 
@RestController
@RequestMapping("/api")
public class SimulationController {
 
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
 
    @PostMapping("/simulate")
    public ResponseEntity<?> simulate(
            @RequestBody SimulationRequest req) throws Exception {
 
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
 
    @GetMapping("/greatcircle")
    public ResponseEntity<?> greatCircle(
            @RequestParam String origin,
            @RequestParam String destination,
            @RequestParam(defaultValue = "3") int waypoints,
            @RequestParam(defaultValue = "35000") double altitude) {
 
        if (origin == null || origin.length() != 4 ||
            destination == null || destination.length() != 4)
            return ResponseEntity.badRequest()
                .body("{\"error\":\"Invalid ICAO codes\"}");
 
        try {
            return ResponseEntity.ok(greatCircleService.calculate(
                origin.toUpperCase(), destination.toUpperCase(),
                waypoints, altitude));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }
 
    @PostMapping("/runway")
    public ResponseEntity<?> runway(@RequestBody RunwayRequest req) {
        if (req.aircraftType == null || req.weather == null)
            return ResponseEntity.badRequest()
                .body("{\"error\":\"aircraftType and weather required\"}");
        try {
            return ResponseEntity.ok(runwayService.analyze(
                req.aircraftType, req.weather,
                req.fuelKg, req.payloadKg));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }
 
    // ── ETOPS compliance check ────────────────────────────────────────────────
 
    public static class EtopsRequest {
        public List<Waypoint> waypoints;
        public String         aircraftType  = "B737";
        public int            etopsRating   = 180;
        public List<String>   excludeIcaos  = List.of();
    }
 
    @PostMapping("/etops")
    public ResponseEntity<?> etops(@RequestBody EtopsRequest req) {
        if (req.waypoints == null || req.waypoints.size() < 2)
            return ResponseEntity.badRequest()
                .body("{\"error\":\"At least 2 waypoints required\"}");
 
        if (req.etopsRating < 60 || req.etopsRating > 240)
            return ResponseEntity.badRequest()
                .body("{\"error\":\"ETOPS rating must be between 60 and 240 minutes\"}");
 
        try {
            EtopsResult result = etopsService.check(
                req.waypoints, req.aircraftType,
                req.etopsRating, req.excludeIcaos);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }
}