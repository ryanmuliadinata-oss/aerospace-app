package com.aerospace.service;
 
import com.aerospace.model.Waypoint;
import org.springframework.stereotype.Service;
 
import java.util.*;
 
/**
 * EtopsService — Extended Operations compliance checker.
 *
 * Regulations: FAR 121.161 / EASA OPS 1.245
 * For each point along the route, verifies the nearest adequate
 * alternate airport is within the approved ETOPS time limit at
 * single-engine diversion speed.
 *
 * Adequate alternate = paved runway ≥ 6000 ft, ILS or equivalent,
 * not the departure or destination airport.
 */
@Service
public class EtopsService {
 
    // ETOPS-rated alternate airports with runway/nav data
    // { lat, lon, minRunwayFt, hasIls }
    private static final Map<String, EtopsAlternate> ALTERNATES = new LinkedHashMap<>();
    static {
        // North Atlantic corridor
        ALTERNATES.put("EINN", new EtopsAlternate("Shannon",          52.702, -8.925,  10495, true));
        ALTERNATES.put("BIKF", new EtopsAlternate("Keflavik",         63.985, -22.605, 10056, true));
        ALTERNATES.put("CYQX", new EtopsAlternate("Gander",           48.937, -54.568, 10500, true));
        ALTERNATES.put("CYYT", new EtopsAlternate("St. John's",       47.619, -52.732, 8892,  true));
        ALTERNATES.put("EGPD", new EtopsAlternate("Aberdeen",         57.202, -2.198,  6001,  true));
        ALTERNATES.put("LPLA", new EtopsAlternate("Lajes/Azores",     38.762, -27.091, 10865, true));
        ALTERNATES.put("GCTS", new EtopsAlternate("Tenerife Sur",     28.044, -16.572, 10728, true));
 
        // North Pacific corridor
        ALTERNATES.put("PADK", new EtopsAlternate("Adak",             51.878, -176.646, 7943, true));
        ALTERNATES.put("PASY", new EtopsAlternate("Shemya/Eareckson", 52.711, 174.113,  9997, true));
        ALTERNATES.put("RJSM", new EtopsAlternate("Misawa",           40.703, 141.368,  9843, true));
        ALTERNATES.put("PANC", new EtopsAlternate("Anchorage",        61.174, -149.996, 12400, true));
        ALTERNATES.put("PHOG", new EtopsAlternate("Maui/Kahului",     20.899, -156.430, 6995, true));
        ALTERNATES.put("PHNL", new EtopsAlternate("Honolulu",         21.318, -157.922, 12000, true));
        ALTERNATES.put("PGUM", new EtopsAlternate("Guam",             13.484, 144.796,  10000, true));
        ALTERNATES.put("ROAH", new EtopsAlternate("Naha/Okinawa",     26.196, 127.646,  9840, true));
 
        // Indian Ocean / Mideast
        ALTERNATES.put("VOBL", new EtopsAlternate("Bangalore",        13.198, 77.706,   9367, true));
        ALTERNATES.put("HECA", new EtopsAlternate("Cairo",            30.122, 31.406,   13116, true));
        ALTERNATES.put("FAOR", new EtopsAlternate("Johannesburg",    -26.139, 28.246,   14495, true));
        ALTERNATES.put("FMEE", new EtopsAlternate("Reunion/Roland",  -20.887, 55.511,   8858, true));
        ALTERNATES.put("DXXX", new EtopsAlternate("Diego Garcia",    -7.313,  72.411,   12001, true));
 
        // South Pacific
        ALTERNATES.put("NFTF", new EtopsAlternate("Fua'amotu/Tonga", -21.242, -175.150, 9843, true));
        ALTERNATES.put("NFFN", new EtopsAlternate("Nadi/Fiji",       -17.755, 177.443,  10171, true));
        ALTERNATES.put("NTAA", new EtopsAlternate("Papeete/Tahiti",  -17.553, -149.607, 11204, true));
        ALTERNATES.put("YBBN", new EtopsAlternate("Brisbane",        -27.384, 153.118,  11483, true));
 
        // Polar / Arctic
        ALTERNATES.put("CYYR", new EtopsAlternate("Goose Bay",       53.320, -60.425,  11050, true));
        ALTERNATES.put("BGGH", new EtopsAlternate("Nuuk/Greenland",  64.190, -51.678,  9826, true));
        ALTERNATES.put("BGSF", new EtopsAlternate("Kangerlussuaq",   67.012, -50.711,  9219, true));
    }
 
    // Single-engine cruise speeds (kts) per aircraft type
    // Typically ~10% below normal cruise
    private static final Map<String, Integer> SE_SPEED_KTS = Map.of(
        "B737", 420,
        "A320", 410,
        "B777", 455,
        "B747", 450,  // not technically ETOPS (quad), but included for reference
        "A380", 480   // not ETOPS (quad), included for reference
    );
 
    // Standard ETOPS thresholds in minutes
    public static final int[] ETOPS_RATINGS = { 60, 90, 120, 138, 180, 207, 240 };
 
    // Number of sample points along the route
    private static final int SAMPLES = 30;
 
    // Earth radius in NM
    private static final double R_NM = 3440.065;
 
    // ── main entry point ─────────────────────────────────────────────────────
 
    public EtopsResult check(List<Waypoint> waypoints, String aircraftType,
                              int etopsRatingMinutes, List<String> excludeIcaos) {
 
        int seSpeedKts = SE_SPEED_KTS.getOrDefault(aircraftType, 430);
        double maxDiversionNm = seSpeedKts * (etopsRatingMinutes / 60.0);
 
        // Sample points evenly along the route
        List<Waypoint> samples = sampleRoute(waypoints, SAMPLES);
 
        List<RoutePoint> routePoints = new ArrayList<>();
        double worstDiversionMin = 0;
        RoutePoint criticalPoint  = null;
 
        for (Waypoint sample : samples) {
            // Find nearest adequate alternate (excluding origin/dest)
            NearestAlternate nearest = nearestAlternate(
                sample.latitude, sample.longitude, excludeIcaos);
 
            double diversionNm  = nearest != null ? nearest.distanceNm : Double.MAX_VALUE;
            double diversionMin = nearest != null
                ? (diversionNm / seSpeedKts) * 60.0 : Double.MAX_VALUE;
            boolean compliant   = diversionMin <= etopsRatingMinutes;
 
            RoutePoint rp = new RoutePoint(
                sample.latitude, sample.longitude, sample.name,
                nearest != null ? nearest.icao : "NONE",
                nearest != null ? nearest.alternate.name() : "No alternate",
                diversionNm, diversionMin, compliant
            );
            routePoints.add(rp);
 
            if (diversionMin > worstDiversionMin) {
                worstDiversionMin = diversionMin;
                criticalPoint = rp;
            }
        }
 
        // Determine effective ETOPS rating needed
        int requiredRating = 60;
        for (int rating : ETOPS_RATINGS) {
            if (worstDiversionMin <= rating) { requiredRating = rating; break; }
        }
        if (worstDiversionMin > ETOPS_RATINGS[ETOPS_RATINGS.length - 1])
            requiredRating = 999; // beyond known ratings
 
        boolean compliant = worstDiversionMin <= etopsRatingMinutes;
 
        // Build alternate airports used list (unique, sorted by usage)
        List<String> alternatesUsed = routePoints.stream()
            .map(rp -> rp.nearestAlternateIcao)
            .distinct()
            .filter(icao -> !icao.equals("NONE"))
            .toList();
 
        List<AlternateDetail> alternateDetails = alternatesUsed.stream()
            .filter(ALTERNATES::containsKey)
            .map(icao -> {
                EtopsAlternate alt = ALTERNATES.get(icao);
                double coveredMin = routePoints.stream()
                    .filter(rp -> rp.nearestAlternateIcao.equals(icao))
                    .count() * 100.0 / SAMPLES;
                return new AlternateDetail(icao, alt.name(), alt.lat(), alt.lon(),
                    alt.runwayFt(), alt.hasIls(), coveredMin);
            })
            .sorted(Comparator.comparingDouble(AlternateDetail::coveragePct).reversed())
            .toList();
 
        String assessment = buildAssessment(compliant, worstDiversionMin,
            etopsRatingMinutes, requiredRating, criticalPoint);
 
        return new EtopsResult(
            compliant, etopsRatingMinutes, requiredRating,
            worstDiversionMin, seSpeedKts, criticalPoint,
            routePoints, alternateDetails, assessment
        );
    }
 
    // ── helpers ──────────────────────────────────────────────────────────────
 
    private List<Waypoint> sampleRoute(List<Waypoint> waypoints, int numSamples) {
        if (waypoints.size() <= 2) {
            // Interpolate between origin and destination
            return interpolate(waypoints.get(0), waypoints.get(waypoints.size() - 1), numSamples);
        }
        // Distribute samples proportionally across legs
        List<Waypoint> result = new ArrayList<>();
        double totalDist = 0;
        double[] legDists = new double[waypoints.size() - 1];
        for (int i = 0; i < waypoints.size() - 1; i++) {
            legDists[i] = haversineNm(waypoints.get(i), waypoints.get(i + 1));
            totalDist += legDists[i];
        }
        result.add(waypoints.get(0));
        for (int i = 0; i < waypoints.size() - 1; i++) {
            int legSamples = Math.max(1, (int) Math.round((legDists[i] / totalDist) * numSamples));
            Waypoint a = waypoints.get(i), b = waypoints.get(i + 1);
            for (int j = 1; j <= legSamples; j++) {
                double f = (double) j / (legSamples + 1);
                double[] pt = interpolatePt(a.latitude, a.longitude,
                    b.latitude, b.longitude, f);
                result.add(new Waypoint(String.format("S%02d", result.size()),
                    pt[0], pt[1], a.altitudeFt));
            }
        }
        result.add(waypoints.get(waypoints.size() - 1));
        return result;
    }
 
    private List<Waypoint> interpolate(Waypoint a, Waypoint b, int n) {
        List<Waypoint> pts = new ArrayList<>();
        pts.add(a);
        for (int i = 1; i < n - 1; i++) {
            double f = (double) i / (n - 1);
            double[] pt = interpolatePt(a.latitude, a.longitude, b.latitude, b.longitude, f);
            pts.add(new Waypoint("S" + i, pt[0], pt[1], a.altitudeFt));
        }
        pts.add(b);
        return pts;
    }
 
    private double[] interpolatePt(double lat1, double lon1,
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
 
    private NearestAlternate nearestAlternate(double lat, double lon,
                                               List<String> excludeIcaos) {
        NearestAlternate best = null;
        for (Map.Entry<String, EtopsAlternate> entry : ALTERNATES.entrySet()) {
            if (excludeIcaos != null && excludeIcaos.contains(entry.getKey())) continue;
            EtopsAlternate alt = entry.getValue();
            double dist = haversineNm(lat, lon, alt.lat(), alt.lon());
            if (best == null || dist < best.distanceNm) {
                best = new NearestAlternate(entry.getKey(), alt, dist);
            }
        }
        return best;
    }
 
    private double haversineNm(Waypoint a, Waypoint b) {
        return haversineNm(a.latitude, a.longitude, b.latitude, b.longitude);
    }
 
    private double haversineNm(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                 + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                 * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return 2 * R_NM * Math.asin(Math.sqrt(a));
    }
 
    private String buildAssessment(boolean compliant, double worstMin,
                                    int rating, int required, RoutePoint cp) {
        if (compliant) {
            return String.format(
                "Route is ETOPS-%d compliant. Worst-case diversion %.0f min at %s → %s.",
                rating, worstMin,
                cp != null ? String.format("(%.1f°,%.1f°)", cp.lat, cp.lon) : "unknown",
                cp != null ? cp.nearestAlternateName : "unknown");
        }
        return String.format(
            "Route EXCEEDS ETOPS-%d. Worst diversion %.0f min — requires ETOPS-%d approval. " +
            "Critical point near %s, nearest alternate: %s.",
            rating, worstMin, required,
            cp != null ? String.format("%.1f°N %.1f°E", cp.lat, cp.lon) : "unknown",
            cp != null ? cp.nearestAlternateName : "unknown");
    }
 
    // ── result types ─────────────────────────────────────────────────────────
 
    public record EtopsAlternate(
        String name, double lat, double lon, int runwayFt, boolean hasIls) {}
 
    public record EtopsResult(
        boolean compliant,
        int     approvedRatingMinutes,
        int     requiredRatingMinutes,
        double  worstDiversionMinutes,
        int     seSpeedKts,
        RoutePoint criticalPoint,
        List<RoutePoint>    routePoints,
        List<AlternateDetail> alternates,
        String  assessment
    ) {}
 
    public record RoutePoint(
        double  lat, double lon, String name,
        String  nearestAlternateIcao,
        String  nearestAlternateName,
        double  diversionNm,
        double  diversionMinutes,
        boolean compliant
    ) {}
 
    public record AlternateDetail(
        String icao, String name, double lat, double lon,
        int runwayFt, boolean hasIls, double coveragePct
    ) {}
 
    private record NearestAlternate(
        String icao, EtopsAlternate alternate, double distanceNm) {}
}