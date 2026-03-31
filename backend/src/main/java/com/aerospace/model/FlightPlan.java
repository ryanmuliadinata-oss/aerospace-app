package com.aerospace.model;

import java.time.Instant;
import java.util.List;

public class FlightPlan {
    public final String         flightId;
    public final String         aircraftType;
    public final String         origin;
    public final String         destination;
    public final double         fuelCapacityKg;
    public final double         cruiseSpeedKts;
    public final List<Waypoint> waypoints;
    public final Instant        departureTime;

    public FlightPlan(String flightId, String aircraftType,
                      String origin, String destination,
                      double fuelCapacityKg, double cruiseSpeedKts,
                      List<Waypoint> waypoints, Instant departureTime) {
        this.flightId       = flightId;
        this.aircraftType   = aircraftType;
        this.origin         = origin;
        this.destination    = destination;
        this.fuelCapacityKg = fuelCapacityKg;
        this.cruiseSpeedKts = cruiseSpeedKts;
        this.waypoints      = waypoints;
        this.departureTime  = departureTime;
    }
}