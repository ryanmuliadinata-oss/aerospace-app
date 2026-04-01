package com.aerospace.service;

import com.aerospace.model.Waypoint;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class AlternateAirportService {

    // Pre-defined alternates for common routes
    private static final Map<String, List<String>> ROUTE_ALTERNATES = Map.of(
        "KLAX-KJFK", List.of("KBOS", "KEWR", "KPHL"),
        "KJFK-KLAX", List.of("KLAS", "KPHX", "KSAN"),
        "KSFO-KORD", List.of("KMKE", "KMDW", "KGRR"),
        "KORD-KSFO", List.of("KSJC", "KOAK", "KSMF"),
        "EGLL-KJFK", List.of("KBOS", "KEWR", "KBDL"),
        "KJFK-EGLL", List.of("EGKK", "EGGW", "EGSS")
    );

    // Major airports with coordinates for distance-based suggestions
    private static final List<AirportInfo> MAJOR_AIRPORTS = List.of(
        new AirportInfo("KBOS", "Boston Logan",          42.3656, -71.0096),
        new AirportInfo("KEWR", "Newark Liberty",        40.6895, -74.1745),
        new AirportInfo("KPHL", "Philadelphia Intl",     39.8719, -75.2411),
        new AirportInfo("KBDL", "Hartford Bradley",      41.9389, -72.6832),
        new AirportInfo("KLAS", "Las Vegas McCarran",    36.0840, -115.1537),
        new AirportInfo("KPHX", "Phoenix Sky Harbor",    33.4373, -112.0078),
        new AirportInfo("KSAN", "San Diego Intl",        32.7336, -117.1897),
        new AirportInfo("KMKE", "Milwaukee Mitchell",    42.9472, -87.8966),
        new AirportInfo("KMDW", "Chicago Midway",        41.7868, -87.7522),
        new AirportInfo("KGRR", "Grand Rapids Ford",     42.8808, -85.5228),
        new AirportInfo("KSJC", "San Jose Intl",         37.3626, -121.9290),
        new AirportInfo("KOAK", "Oakland Intl",          37.7213, -122.2208),
        new AirportInfo("KSMF", "Sacramento Intl",       38.6954, -121.5908),
        new AirportInfo("KDFW", "Dallas Fort Worth",     32.8998, -97.0403),
        new AirportInfo("KDEN", "Denver Intl",           39.8561, -104.6737),
        new AirportInfo("KATL", "Atlanta Hartsfield",    33.6407, -84.4277),
        new AirportInfo("KMIA", "Miami Intl",            25.7959, -80.2870),
        new AirportInfo("KIAD", "Washington Dulles",     38.9531, -77.4565),
        new AirportInfo("KDCA", "Washington Reagan",     38.8512, -77.0402),
        new AirportInfo("EGKK", "London Gatwick",        51.1481, -0.1903),
        new AirportInfo("EGGW", "London Luton",          51.8747, -0.3683),
        new AirportInfo("EGSS", "London Stansted",       51.8850,  0.2350),
        new AirportInfo("EHAM", "Amsterdam Schiphol",    52.3105,  4.7683),
        new AirportInfo("LFPG", "Paris Charles de Gaulle", 49.0097, 2.5479)
    );

    public List<AlternateSuggestion> suggest(
            String origin, String destination, Waypoint destWaypoint) {

        List<AlternateSuggestion> suggestions = new ArrayList<>();

        // 1. Pre-defined route alternates
        String routeKey = origin + "-" + destination;
        List<String> predefined = ROUTE_ALTERNATES.get(routeKey);
        if (predefined != null) {
            for (String icao : predefined) {
                MAJOR_AIRPORTS.stream()
                    .filter(a -> a.icao.equals(icao))
                    .findFirst()
                    .ifPresent(a -> suggestions.add(new AlternateSuggestion(
                        a.icao, a.name, "Pre-defined alternate",
                        haversineNm(destWaypoint.latitude, destWaypoint.longitude,
                                    a.lat, a.lon))));
            }
        }

        // 2. Closest airports to destination
        MAJOR_AIRPORTS.stream()
            .filter(a -> !a.icao.equals(destination))
            .filter(a -> suggestions.stream()
                .noneMatch(s -> s.icao.equals(a.icao)))
            .map(a -> new AlternateSuggestion(
                a.icao, a.name, "Nearest alternate",
                haversineNm(destWaypoint.latitude, destWaypoint.longitude,
                            a.lat, a.lon)))
            .filter(s -> s.distanceNm < 300)
            .sorted((a, b) -> Double.compare(a.distanceNm, b.distanceNm))
            .limit(3)
            .forEach(suggestions::add);

        return suggestions.stream()
            .sorted((a, b) -> Double.compare(a.distanceNm, b.distanceNm))
            .limit(5)
            .toList();
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

    public record AirportInfo(String icao, String name, double lat, double lon) {}
    public record AlternateSuggestion(String icao, String name,
                                       String reason, double distanceNm) {}
}