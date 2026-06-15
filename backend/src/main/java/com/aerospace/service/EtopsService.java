package com.aerospace.service;
 
import com.aerospace.model.Waypoint;
import com.aerospace.util.GeoMath;
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
        ALTERNATES.put("EINN", new EtopsAlternate("Shannon",           52.702,  -8.925,  10495, true));
        ALTERNATES.put("BIKF", new EtopsAlternate("Keflavik",          63.985, -22.605,  10056, true));
        ALTERNATES.put("BIAR", new EtopsAlternate("Akureyri",          65.660, -18.073,   8858, true));
        ALTERNATES.put("CYQX", new EtopsAlternate("Gander",            48.937, -54.568,  10500, true));
        ALTERNATES.put("CYYT", new EtopsAlternate("St. John's",        47.619, -52.732,   8892, true));
        ALTERNATES.put("CYYR", new EtopsAlternate("Goose Bay",         53.320, -60.425,  11050, true));
        ALTERNATES.put("EGPD", new EtopsAlternate("Aberdeen",          57.202,  -2.198,   6001, true));
        ALTERNATES.put("LPLA", new EtopsAlternate("Lajes/Azores",      38.762, -27.091,  10865, true));
        ALTERNATES.put("GCTS", new EtopsAlternate("Tenerife Sur",      28.044, -16.572,  10728, true));
        ALTERNATES.put("TXKF", new EtopsAlternate("Bermuda",           32.364, -64.679,   9000, true));
        ALTERNATES.put("BGGH", new EtopsAlternate("Nuuk/Greenland",    64.190, -51.678,   9826, true));
        ALTERNATES.put("BGSF", new EtopsAlternate("Kangerlussuaq",     67.012, -50.711,   9219, true));

        // North Pacific corridor
        ALTERNATES.put("PANC", new EtopsAlternate("Anchorage",         61.174,-149.996,  12400, true));
        ALTERNATES.put("PAFA", new EtopsAlternate("Fairbanks",         64.815,-147.856,  11800, true));
        ALTERNATES.put("PADK", new EtopsAlternate("Adak",              51.878,-176.646,   7943, true));
        ALTERNATES.put("PASY", new EtopsAlternate("Shemya/Eareckson",  52.711, 174.113,   9997, true));
        ALTERNATES.put("RJSM", new EtopsAlternate("Misawa",            40.703, 141.368,   9843, true));
        ALTERNATES.put("ROAH", new EtopsAlternate("Naha/Okinawa",      26.196, 127.646,   9840, true));
        ALTERNATES.put("PHNL", new EtopsAlternate("Honolulu",          21.318,-157.922,  12000, true));
        ALTERNATES.put("PHOG", new EtopsAlternate("Maui/Kahului",      20.899,-156.430,   6995, true));
        ALTERNATES.put("PGUM", new EtopsAlternate("Guam",              13.484, 144.796,  10000, true));

        // Caribbean / Central America
        ALTERNATES.put("TNCM", new EtopsAlternate("Sint Maarten",      18.041, -63.109,   7546, true));
        ALTERNATES.put("TTPP", new EtopsAlternate("Port of Spain",     10.595, -61.337,  10500, true));
        ALTERNATES.put("MROC", new EtopsAlternate("San José/Costa Rica", 9.994, -84.209,  9882, true));

        // South America
        ALTERNATES.put("SBGL", new EtopsAlternate("Rio de Janeiro",   -22.810, -43.251,  13123, true));
        ALTERNATES.put("SBBR", new EtopsAlternate("Brasília",         -15.871, -47.919,  10827, true));
        ALTERNATES.put("SBGR", new EtopsAlternate("São Paulo/Guarulhos",-23.436,-46.473, 12139, true));

        // West Africa / Mid-Atlantic
        ALTERNATES.put("GVAC", new EtopsAlternate("Sal/Cape Verde",    16.741, -22.950,   9350, true));
        ALTERNATES.put("GOOY", new EtopsAlternate("Dakar/Yoff",        14.740, -17.490,  10827, true));
        ALTERNATES.put("GLRB", new EtopsAlternate("Monrovia/Roberts",   6.234, -10.362,  11155, true));
        ALTERNATES.put("DIAP", new EtopsAlternate("Abidjan",            5.261,  -3.926,   8858, true));
        ALTERNATES.put("DNMM", new EtopsAlternate("Lagos/Murtala",      6.577,   3.321,  12795, true));

        // East / Southern Africa & Indian Ocean islands
        ALTERNATES.put("HAAB", new EtopsAlternate("Addis Ababa/Bole",  8.978,  38.799,  12467, true));
        ALTERNATES.put("HTDA", new EtopsAlternate("Dar es Salaam",     -6.878,  39.203,   9843, true));
        ALTERNATES.put("HECA", new EtopsAlternate("Cairo",             30.122,  31.406,  13116, true));
        ALTERNATES.put("FAOR", new EtopsAlternate("Johannesburg",     -26.139,  28.246,  14495, true));
        ALTERNATES.put("FMEE", new EtopsAlternate("Reunion/Roland",   -20.887,  55.511,   8858, true));
        ALTERNATES.put("DXXX", new EtopsAlternate("Diego Garcia",      -7.313,  72.411,  12001, true));

        // Middle East & South Asia
        ALTERNATES.put("OERK", new EtopsAlternate("Riyadh/King Khalid", 24.958, 46.699,  13944, true));
        ALTERNATES.put("OOMS", new EtopsAlternate("Muscat/Seeb",        23.593,  58.284,  11483, true));
        ALTERNATES.put("OPKC", new EtopsAlternate("Karachi/Jinnah",    24.907,  67.161,  11155, true));
        ALTERNATES.put("VABB", new EtopsAlternate("Mumbai",            19.090,  72.866,  11446, true));
        ALTERNATES.put("VOBL", new EtopsAlternate("Bangalore",         13.198,  77.706,   9367, true));

        // Southeast Asia
        ALTERNATES.put("VTBS", new EtopsAlternate("Bangkok/Suvarnabhumi", 13.681, 100.748, 13123, true));
        ALTERNATES.put("WMKK", new EtopsAlternate("Kuala Lumpur",      2.746, 101.710,  13976, true));
        ALTERNATES.put("WADD", new EtopsAlternate("Bali/Ngurah Rai",  -8.748, 115.167,   9843, true));
        ALTERNATES.put("AYPY", new EtopsAlternate("Port Moresby",      -9.443, 147.220,   9022, true));

        // South Pacific
        ALTERNATES.put("NFFN", new EtopsAlternate("Nadi/Fiji",        -17.755, 177.443,  10171, true));
        ALTERNATES.put("NFTF", new EtopsAlternate("Fua'amotu/Tonga",  -21.242,-175.150,   9843, true));
        ALTERNATES.put("NTAA", new EtopsAlternate("Papeete/Tahiti",   -17.553,-149.607,  11204, true));
        ALTERNATES.put("NSTU", new EtopsAlternate("Pago Pago",        -14.331,-170.711,   9000, true));
        ALTERNATES.put("NSFA", new EtopsAlternate("Apia/Faleolo",     -13.830,-172.008,   8858, true));
        ALTERNATES.put("NWWW", new EtopsAlternate("Nouméa/La Tontouta",-22.015, 166.213,  10499, true));
        ALTERNATES.put("NVVV", new EtopsAlternate("Port Vila/Vanuatu", -17.699, 168.320,   8858, true));
        ALTERNATES.put("YBBN", new EtopsAlternate("Brisbane",         -27.384, 153.118,  11483, true));
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
            legDists[i] = GeoMath.haversineNm(waypoints.get(i), waypoints.get(i + 1));
            totalDist += legDists[i];
        }
        result.add(waypoints.get(0));
        for (int i = 0; i < waypoints.size() - 1; i++) {
            int legSamples = Math.max(1, (int) Math.round((legDists[i] / totalDist) * numSamples));
            Waypoint a = waypoints.get(i), b = waypoints.get(i + 1);
            for (int j = 1; j <= legSamples; j++) {
                double f = (double) j / (legSamples + 1);
                double[] pt = GeoMath.interpolatePt(a.latitude, a.longitude,
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
            double[] pt = GeoMath.interpolatePt(a.latitude, a.longitude, b.latitude, b.longitude, f);
            pts.add(new Waypoint("S" + i, pt[0], pt[1], a.altitudeFt));
        }
        pts.add(b);
        return pts;
    }
 
    private NearestAlternate nearestAlternate(double lat, double lon,
                                               List<String> excludeIcaos) {
        NearestAlternate best = null;
        for (Map.Entry<String, EtopsAlternate> entry : ALTERNATES.entrySet()) {
            if (excludeIcaos != null && excludeIcaos.contains(entry.getKey())) continue;
            EtopsAlternate alt = entry.getValue();
            double dist = GeoMath.haversineNm(lat, lon, alt.lat(), alt.lon());
            if (best == null || dist < best.distanceNm) {
                best = new NearestAlternate(entry.getKey(), alt, dist);
            }
        }
        return best;
    }
 
    private String buildAssessment(boolean compliant, double worstMin,
                                    int rating, int required, RoutePoint cp) {
        String cpStr = cp != null
            ? String.format("(%.1f°, %.1f°)", cp.lat, cp.lon) : "unknown position";
        String altStr = cp != null ? cp.nearestAlternateName : "unknown";

        if (compliant) {
            return String.format(
                "Route is ETOPS-%d compliant. Worst-case diversion %.0f min at %s → %s.",
                rating, worstMin, cpStr, altStr);
        }
        if (required == 999) {
            return String.format(
                "NO ETOPS COVERAGE: Critical point near %s has no known alternate within range " +
                "(worst diversion %.0f min). Route cannot be dispatched ETOPS without additional " +
                "alternates identified along this corridor.",
                cpStr, worstMin);
        }
        return String.format(
            "Route EXCEEDS ETOPS-%d. Worst diversion %.0f min — requires ETOPS-%d approval. " +
            "Critical point near %s, nearest alternate: %s.",
            rating, worstMin, required, cpStr, altStr);
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