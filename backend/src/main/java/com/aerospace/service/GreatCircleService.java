package com.aerospace.service;

import com.aerospace.model.Waypoint;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class GreatCircleService {

    // Airport database with coordinates
    private static final Map<String, double[]> AIRPORTS = Map.ofEntries(
        Map.entry("KLAX", new double[]{33.9425, -118.4081}),
        Map.entry("KJFK", new double[]{40.6413, -73.7781}),
        Map.entry("KSFO", new double[]{37.6213, -122.3790}),
        Map.entry("KORD", new double[]{41.9742, -87.9073}),
        Map.entry("KDFW", new double[]{32.8998, -97.0403}),
        Map.entry("KDEN", new double[]{39.8561, -104.6737}),
        Map.entry("KATL", new double[]{33.6407, -84.4277}),
        Map.entry("KMIA", new double[]{25.7959, -80.2870}),
        Map.entry("KLAS", new double[]{36.0840, -115.1537}),
        Map.entry("KPHX", new double[]{33.4373, -112.0078}),
        Map.entry("KSEA", new double[]{47.4502, -122.3088}),
        Map.entry("KBOS", new double[]{42.3656, -71.0096}),
        Map.entry("KEWR", new double[]{40.6895, -74.1745}),
        Map.entry("KIAD", new double[]{38.9531, -77.4565}),
        Map.entry("KSAN", new double[]{32.7336, -117.1897}),
        Map.entry("KSLC", new double[]{40.7884, -111.9778}),
        Map.entry("KMSP", new double[]{44.8848, -93.2223}),
        Map.entry("KDTW", new double[]{42.2124, -83.3534}),
        Map.entry("KPHL", new double[]{39.8719, -75.2411}),
        Map.entry("EGLL", new double[]{51.4775, -0.4614}),
        Map.entry("EGKK", new double[]{51.1481, -0.1903}),
        Map.entry("EHAM", new double[]{52.3105,  4.7683}),
        Map.entry("LFPG", new double[]{49.0097,  2.5479}),
        Map.entry("EDDF", new double[]{50.0379,  8.5622}),
        Map.entry("LEMD", new double[]{40.4936, -3.5668}),
        Map.entry("LIRF", new double[]{41.8003, 12.2389}),
        Map.entry("LSZH", new double[]{47.4647,  8.5492}),
        Map.entry("EINN", new double[]{52.7020, -8.9248}),
        Map.entry("CYYZ", new double[]{43.6772, -79.6306}),
        Map.entry("CYVR", new double[]{49.1967, -123.1815}),
        Map.entry("CYUL", new double[]{45.4706, -73.7408}),
        Map.entry("MMMX", new double[]{19.4363, -99.0721}),
        Map.entry("SBGR", new double[]{-23.4356, -46.4731}),
        Map.entry("SAEZ", new double[]{-34.8222, -58.5358}),
        Map.entry("OMDB", new double[]{25.2532,  55.3657}),
        Map.entry("VHHH", new double[]{22.3080, 113.9185}),
        Map.entry("RJTT", new double[]{35.5494, 139.7798}),
        Map.entry("YSSY", new double[]{-33.9461, 151.1772}),
        Map.entry("WSSS", new double[]{1.3644,  103.9915}),
        Map.entry("ZBAA", new double[]{40.0799, 116.6031}),
        Map.entry("CYYT", new double[]{47.6186, -52.7319})
    );

    public GreatCircleResult calculate(String origin, String destination,
                                        int numWaypoints, double altitudeFt) {

        double[] orig = AIRPORTS.get(origin);
        double[] dest = AIRPORTS.get(destination);

        if (orig == null)
            throw new IllegalArgumentException("Unknown airport: " + origin);
        if (dest == null)
            throw new IllegalArgumentException("Unknown airport: " + destination);

        List<Waypoint> waypoints = interpolate(
            origin, orig[0], orig[1],
            destination, dest[0], dest[1],
            numWaypoints, altitudeFt);

        double distanceNm = haversineNm(orig[0], orig[1], dest[0], dest[1]);
        double initialBearing = initialBearing(orig[0], orig[1], dest[0], dest[1]);

        return new GreatCircleResult(origin, destination,
            distanceNm, initialBearing, waypoints);
    }

    private List<Waypoint> interpolate(
            String originName, double lat1, double lon1,
            String destName,   double lat2, double lon2,
            int numPoints, double altitudeFt) {

        List<Waypoint> points = new ArrayList<>();
        double lat1r = Math.toRadians(lat1);
        double lon1r = Math.toRadians(lon1);
        double lat2r = Math.toRadians(lat2);
        double lon2r = Math.toRadians(lon2);
        double d = 2 * Math.asin(Math.sqrt(
            Math.pow(Math.sin((lat2r - lat1r) / 2), 2)
            + Math.cos(lat1r) * Math.cos(lat2r)
            * Math.pow(Math.sin((lon2r - lon1r) / 2), 2)));

        for (int i = 0; i <= numPoints + 1; i++) {
            double f = (double) i / (numPoints + 1);
            if (i == 0) {
                points.add(new Waypoint(originName, lat1, lon1, 0));
                continue;
            }
            if (i == numPoints + 1) {
                points.add(new Waypoint(destName, lat2, lon2, 0));
                continue;
            }

            double A = Math.sin((1 - f) * d) / Math.sin(d);
            double B = Math.sin(f * d) / Math.sin(d);
            double x = A * Math.cos(lat1r) * Math.cos(lon1r)
                     + B * Math.cos(lat2r) * Math.cos(lon2r);
            double y = A * Math.cos(lat1r) * Math.sin(lon1r)
                     + B * Math.cos(lat2r) * Math.sin(lon2r);
            double z = A * Math.sin(lat1r) + B * Math.sin(lat2r);
            double lat = Math.toDegrees(Math.atan2(z, Math.sqrt(x*x + y*y)));
            double lon = Math.toDegrees(Math.atan2(y, x));

            String name = "WP" + String.format("%02d", i);
            points.add(new Waypoint(name, lat, lon, altitudeFt));
        }
        return points;
    }

    private double haversineNm(double lat1, double lon1,
                                double lat2, double lon2) {
        final double R = 3440.065;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat/2) * Math.sin(dLat/2)
                 + Math.cos(Math.toRadians(lat1))
                 * Math.cos(Math.toRadians(lat2))
                 * Math.sin(dLon/2) * Math.sin(dLon/2);
        return 2 * R * Math.asin(Math.sqrt(a));
    }

    private double initialBearing(double lat1, double lon1,
                                   double lat2, double lon2) {
        double lat1r = Math.toRadians(lat1);
        double lat2r = Math.toRadians(lat2);
        double dLon  = Math.toRadians(lon2 - lon1);
        double x = Math.sin(dLon) * Math.cos(lat2r);
        double y = Math.cos(lat1r) * Math.sin(lat2r)
                 - Math.sin(lat1r) * Math.cos(lat2r) * Math.cos(dLon);
        return (Math.toDegrees(Math.atan2(x, y)) + 360) % 360;
    }

    public record GreatCircleResult(
        String origin,
        String destination,
        double distanceNm,
        double initialBearing,
        List<Waypoint> waypoints) {}
}