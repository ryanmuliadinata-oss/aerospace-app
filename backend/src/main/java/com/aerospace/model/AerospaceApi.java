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
    ),
    NASA_EARTHDATA(
        "https://appeears.earthdatacloud.nasa.gov/api",
        "Bearer"
    ),
    OPENSKY_NETWORK(
        "https://opensky-network.org/api",
        "Basic"
    );

    public final String baseUrl;
    public final String authScheme;

    AerospaceApi(String baseUrl, String authScheme) {
        this.baseUrl     = baseUrl;
        this.authScheme  = authScheme;
    }
}