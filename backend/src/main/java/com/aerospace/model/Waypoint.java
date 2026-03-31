package com.aerospace.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

public class Waypoint {
    public final String name;
    public final double latitude;
    public final double longitude;
    public final double altitudeFt;

    @JsonCreator
    public Waypoint(
        @JsonProperty("name")       String name,
        @JsonProperty("latitude")   double latitude,
        @JsonProperty("longitude")  double longitude,
        @JsonProperty("altitudeFt") double altitudeFt) {
        this.name       = name;
        this.latitude   = latitude;
        this.longitude  = longitude;
        this.altitudeFt = altitudeFt;
    }
}