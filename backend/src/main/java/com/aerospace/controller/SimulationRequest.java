package com.aerospace.controller;

import com.aerospace.model.Waypoint;
import java.util.List;

public class SimulationRequest {
    public String         flightId;
    public String         aircraftType;
    public String         origin;
    public String         destination;
    public double         fuelCapacityKg;
    public double         cruiseSpeedKts;
    public List<Waypoint> waypoints;
}