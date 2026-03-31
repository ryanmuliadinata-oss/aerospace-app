package com.aerospace.controller;

import com.aerospace.model.FlightPlan;
import com.aerospace.model.FlightSimulationReport;
import com.aerospace.service.FlightSimulationOrchestrator;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class SimulationController {

    private final FlightSimulationOrchestrator orchestrator;

    public SimulationController(FlightSimulationOrchestrator orchestrator) {
        this.orchestrator = orchestrator;
    }

    @PostMapping("/simulate")
    public SimulationResponse simulate(
            @RequestBody SimulationRequest req) throws Exception {

        FlightPlan plan = new FlightPlan(
            req.flightId,
            req.aircraftType,
            req.origin,
            req.destination,
            req.fuelCapacityKg,
            req.cruiseSpeedKts,
            req.waypoints,
            Instant.now()
        );

        FlightSimulationReport report =
            orchestrator.simulate("system", plan);

        return SimulationResponse.from(report);
    }

    @GetMapping("/health")
    public String health() {
        return "OK";
    }
}