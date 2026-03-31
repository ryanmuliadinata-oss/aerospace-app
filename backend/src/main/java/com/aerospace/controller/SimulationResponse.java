package com.aerospace.controller;

import com.aerospace.model.FlightSimulationReport;
import com.aerospace.model.FuelReport;
import java.util.List;

public class SimulationResponse {
    public String          flightId;
    public String          origin;
    public String          destination;
    public String          aircraftType;
    public double          estimatedFlightTimeHrs;
    public String          recommendedAltitude;
    public String          goNoGoDecision;
    public boolean         isGo;
    public FuelSummary     fuel;
    public List<WxPoint>   weather;
    public List<TurbPoint> turbulence;
    public List<WindPoint> windLayers;

    public static SimulationResponse from(FlightSimulationReport r) {
        SimulationResponse res     = new SimulationResponse();
        res.flightId               = r.flightPlan.flightId;
        res.origin                 = r.flightPlan.origin;
        res.destination            = r.flightPlan.destination;
        res.aircraftType           = r.flightPlan.aircraftType;
        res.estimatedFlightTimeHrs = r.estimatedFlightTimeHrs;
        res.recommendedAltitude    = r.recommendedAltitude;
        res.goNoGoDecision         = r.goNoGoDecision;
        res.isGo                   = r.goNoGoDecision.startsWith("GO");

        FuelReport f = r.fuelReport;
        res.fuel = new FuelSummary(
            f.estimatedFuelBurnKg, f.reserveFuelKg,
            f.totalFuelRequiredKg, f.fuelOnBoardKg,
            f.fuelSufficient);

        res.weather = r.weatherReports.stream().map(w -> new WxPoint(
            w.waypoint.name, w.windSpeedKts, w.windDirectionDeg,
            w.temperatureCelsius, w.pressureHpa,
            w.flightCategory, w.rawMetar, w.sigmetAlert)).toList();

        res.turbulence = r.turbulenceReports.stream().map(t -> new TurbPoint(
            t.waypoint.name, t.severity,
            t.altitudeFt, t.source)).toList();

        res.windLayers = r.windLayers.stream().map(wl -> new WindPoint(
            wl.altitudeFt, wl.speedKts,
            wl.directionDeg, wl.temperatureCelsius)).toList();

        return res;
    }

    public record FuelSummary(
        double burnKg, double reserveKg,
        double totalRequiredKg, double onBoardKg,
        boolean sufficient) {}

    public record WxPoint(
        String icao, double windSpeedKts, double windDirDeg,
        double tempC, double pressureHpa, String category,
        String rawMetar, boolean sigmet) {}

    public record TurbPoint(
        String icao, String severity,
        double altitudeFt, String source) {}

    public record WindPoint(
        double altitudeFt, double speedKts,
        double dirDeg, double tempC) {}
}