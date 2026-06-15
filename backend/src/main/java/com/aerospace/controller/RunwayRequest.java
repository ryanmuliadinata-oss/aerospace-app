package com.aerospace.controller;

public class RunwayRequest {
    public String       aircraftType;
    public WeatherInput weather;
    public double       fuelKg;
    public double       payloadKg;

    public static class WeatherInput {
        public double windSpeedKts;
        public double windDirectionDeg;
        public double temperatureCelsius;
        public double pressureHpa;
        public String flightCategory;
        public String rawMetar;
    }
}
