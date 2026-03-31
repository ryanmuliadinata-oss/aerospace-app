package com.aerospace.model;

public class TurbulenceReport {
    public final Waypoint waypoint;
    public final String   severity;
    public final double   altitudeFt;
    public final String   source;

    public TurbulenceReport(Waypoint wp, String severity,
                             double altFt, String source) {
        this.waypoint   = wp;
        this.severity   = severity;
        this.altitudeFt = altFt;
        this.source     = source;
    }
}