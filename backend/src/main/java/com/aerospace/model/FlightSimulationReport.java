package com.aerospace.model;

import java.util.ArrayList;
import java.util.List;

public class FlightSimulationReport {
    public final FlightPlan             flightPlan;
    public final List<WeatherReport>    weatherReports;
    public final FuelReport             fuelReport;
    public final List<WindLayer>        windLayers;
    public final List<TurbulenceReport> turbulenceReports;
    public final String                 recommendedAltitude;
    public final double                 estimatedFlightTimeHrs;
    public final String                 goNoGoDecision;

    public FlightSimulationReport(
            FlightPlan plan,
            List<WeatherReport> weather,
            FuelReport fuel,
            List<WindLayer> windLayers,
            List<TurbulenceReport> turbulence,
            String recommendedAlt,
            double flightTimeHrs) {

        this.flightPlan             = plan;
        this.weatherReports         = weather;
        this.fuelReport             = fuel;
        this.windLayers             = windLayers;
        this.turbulenceReports      = turbulence;
        this.recommendedAltitude    = recommendedAlt;
        this.estimatedFlightTimeHrs = flightTimeHrs;

        boolean hasSigmet  = weather.stream().anyMatch(w -> w.sigmetAlert);
        boolean severeTurb = turbulence.stream().anyMatch(t ->
            t.severity.equals("SEVERE") || t.severity.equals("EXTREME"));

        this.goNoGoDecision = (!hasSigmet && !severeTurb && fuel.fuelSufficient)
            ? "GO"
            : "NO-GO:" + buildReason(hasSigmet, severeTurb, fuel.fuelSufficient);
    }

    private String buildReason(boolean sigmet, boolean turb, boolean fuelOk) {
        List<String> r = new ArrayList<>();
        if (sigmet)  r.add("Active SIGMET");
        if (turb)    r.add("Severe turbulence");
        if (!fuelOk) r.add("Insufficient fuel");
        return String.join("|", r);
    }
}