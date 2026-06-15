package com.aerospace.model;

public enum AerospaceApi {
    AVIATION_WEATHER(
        "https://aviationweather.gov/api/data",
        "ApiKey"
    ),
    FLIGHTAWARE(
        "https://aeroapi.flightaware.com/aeroapi",
        "x-apikey"
    ),
    OPEN_METEO(
        "https://api.open-meteo.com/v1",
        ""
    );

    public final String baseUrl;
    public final String authScheme;

    AerospaceApi(String baseUrl, String authScheme) {
        this.baseUrl     = baseUrl;
        this.authScheme  = authScheme;
    }
}