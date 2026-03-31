package com.aerospace.model;

public class FuelReport {
    public final String  flightId;
    public final double  estimatedFuelBurnKg;
    public final double  reserveFuelKg;
    public final double  alternateRequiredKg;
    public final double  totalFuelRequiredKg;
    public final double  fuelOnBoardKg;
    public final boolean fuelSufficient;

    public FuelReport(String flightId, double burnKg, double reserveKg,
                      double alternateKg, double onBoardKg) {
        this.flightId            = flightId;
        this.estimatedFuelBurnKg = burnKg;
        this.reserveFuelKg       = reserveKg;
        this.alternateRequiredKg = alternateKg;
        this.totalFuelRequiredKg = burnKg + reserveKg + alternateKg;
        this.fuelOnBoardKg       = onBoardKg;
        this.fuelSufficient      = onBoardKg >= totalFuelRequiredKg;
    }
}