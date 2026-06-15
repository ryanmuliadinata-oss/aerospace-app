package com.aerospace.util;

import com.aerospace.model.Waypoint;

import java.util.List;

public final class GeoMath {

    private static final double R_NM = 3440.065;

    private GeoMath() {}

    public static double haversineNm(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                 + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                 * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return 2 * R_NM * Math.asin(Math.sqrt(a));
    }

    public static double haversineNm(Waypoint a, Waypoint b) {
        return haversineNm(a.latitude, a.longitude, b.latitude, b.longitude);
    }

    public static double routeDistanceNm(List<Waypoint> waypoints) {
        if (waypoints == null || waypoints.size() < 2) return 0;
        double total = 0;
        for (int i = 0; i < waypoints.size() - 1; i++)
            total += haversineNm(waypoints.get(i), waypoints.get(i + 1));
        return total;
    }

    public static double initialBearingDeg(double lat1, double lon1, double lat2, double lon2) {
        double lat1r = Math.toRadians(lat1);
        double lat2r = Math.toRadians(lat2);
        double dLon  = Math.toRadians(lon2 - lon1);
        double x = Math.sin(dLon) * Math.cos(lat2r);
        double y = Math.cos(lat1r) * Math.sin(lat2r)
                 - Math.sin(lat1r) * Math.cos(lat2r) * Math.cos(dLon);
        return (Math.toDegrees(Math.atan2(x, y)) + 360) % 360;
    }

    // Great-circle Slerp: returns {lat, lon} in degrees at fraction f along the arc.
    public static double[] interpolatePt(double lat1, double lon1,
                                          double lat2, double lon2, double f) {
        double lat1r = Math.toRadians(lat1), lon1r = Math.toRadians(lon1);
        double lat2r = Math.toRadians(lat2), lon2r = Math.toRadians(lon2);
        double d = 2 * Math.asin(Math.sqrt(
            Math.pow(Math.sin((lat2r - lat1r) / 2), 2)
            + Math.cos(lat1r) * Math.cos(lat2r)
            * Math.pow(Math.sin((lon2r - lon1r) / 2), 2)));
        if (d < 1e-10) return new double[]{ lat1, lon1 };
        double A = Math.sin((1 - f) * d) / Math.sin(d);
        double B = Math.sin(f * d) / Math.sin(d);
        double x = A * Math.cos(lat1r) * Math.cos(lon1r) + B * Math.cos(lat2r) * Math.cos(lon2r);
        double y = A * Math.cos(lat1r) * Math.sin(lon1r) + B * Math.cos(lat2r) * Math.sin(lon2r);
        double z = A * Math.sin(lat1r) + B * Math.sin(lat2r);
        return new double[]{
            Math.toDegrees(Math.atan2(z, Math.sqrt(x * x + y * y))),
            Math.toDegrees(Math.atan2(y, x))
        };
    }
}
