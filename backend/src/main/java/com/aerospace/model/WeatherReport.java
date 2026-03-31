package com.aerospace.model;

public class WeatherReport {
    public final Waypoint waypoint;
    public final double   windSpeedKts;
    public final double   windDirectionDeg;
    public final double   temperatureCelsius;
    public final double   pressureHpa;
    public final String   flightCategory;
    public final String   rawMetar;
    public final boolean  sigmetAlert;

    public WeatherReport(Waypoint wp, double windSpeedKts, double windDirDeg,
                         double tempC, double pressureHpa,
                         String flightCategory, String rawMetar,
                         boolean sigmetAlert) {
        this.waypoint           = wp;
        this.windSpeedKts       = windSpeedKts;
        this.windDirectionDeg   = windDirDeg;
        this.temperatureCelsius = tempC;
        this.pressureHpa        = pressureHpa;
        this.flightCategory     = flightCategory;
        this.rawMetar           = rawMetar;
        this.sigmetAlert        = sigmetAlert;
    }
}