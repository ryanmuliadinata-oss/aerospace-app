package com.aerospace.model;

public class WindLayer {
    public final double altitudeFt;
    public final double speedKts;
    public final double directionDeg;
    public final double temperatureCelsius;

    public WindLayer(double altFt, double speedKts,
                     double dirDeg, double tempC) {
        this.altitudeFt         = altFt;
        this.speedKts           = speedKts;
        this.directionDeg       = dirDeg;
        this.temperatureCelsius = tempC;
    }
}