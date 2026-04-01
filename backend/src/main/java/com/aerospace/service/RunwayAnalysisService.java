package com.aerospace.service;

import com.aerospace.model.WeatherReport;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class RunwayAnalysisService {

    // Aircraft performance data: {baseTakeoffM, baseLandingM, maxCrosswindKts}
    private static final Map<String, double[]> AIRCRAFT_PERF = Map.of(
        "B737", new double[]{2090, 1710, 33},
        "A320", new double[]{2100, 1440, 29},
        "B777", new double[]{3050, 1750, 38},
        "B747", new double[]{3090, 1920, 35},
        "A380", new double[]{3100, 2000, 35}
    );

    public RunwayResult analyze(String aircraftType,
                                 WeatherReport weather,
                                 double fuelKg,
                                 double payloadKg) {

        double[] perf = AIRCRAFT_PERF.getOrDefault(
            aircraftType, new double[]{2500, 1800, 30});

        double baseTakeoff = perf[0];
        double baseLanding = perf[1];
        double maxCrosswind = perf[2];

        // Temperature correction: +1% per °C above ISA (15°C)
        double tempCorrection = 1 + Math.max(0, weather.temperatureCelsius - 15) * 0.01;

        // Pressure altitude correction using altimeter setting
        // ISA pressure = 1013.25 hPa
        double pressureAlt = (1013.25 - weather.pressureHpa) * 30;
        double altCorrection = 1 + (pressureAlt / 1000) * 0.033;

        // Wind correction: headwind reduces distance, tailwind increases
        double windComponent = weather.windSpeedKts
            * Math.cos(Math.toRadians(weather.windDirectionDeg));
        double windCorrection = 1 - (windComponent * 0.005);

        // Crosswind component
        double crosswind = Math.abs(weather.windSpeedKts
            * Math.sin(Math.toRadians(weather.windDirectionDeg)));

        double takeoffDist = baseTakeoff * tempCorrection
            * altCorrection * windCorrection;
        double landingDist = baseLanding * tempCorrection
            * altCorrection * windCorrection;

        boolean crosswindOk = crosswind <= maxCrosswind;
        boolean conditionsNormal = weather.flightCategory.equals("VFR")
            || weather.flightCategory.equals("MVFR");

        String assessment;
        if (!crosswindOk)
            assessment = "CAUTION: Crosswind exceeds limits";
        else if (!conditionsNormal)
            assessment = "CAUTION: Low visibility conditions";
        else
            assessment = "NORMAL: Conditions within limits";

        return new RunwayResult(
            aircraftType,
            (int) takeoffDist,
            (int) landingDist,
            (int) crosswind,
            (int) maxCrosswind,
            crosswindOk,
            assessment,
            weather.flightCategory,
            (int) weather.windSpeedKts,
            (int) weather.windDirectionDeg
        );
    }

    public record RunwayResult(
        String aircraftType,
        int takeoffDistanceM,
        int landingDistanceM,
        int crosswindKts,
        int maxCrosswindKts,
        boolean crosswindOk,
        String assessment,
        String flightCategory,
        int windSpeedKts,
        int windDirectionDeg
    ) {}
}