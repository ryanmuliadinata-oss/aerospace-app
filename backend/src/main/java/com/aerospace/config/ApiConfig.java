package com.aerospace.config;

import com.aerospace.model.AerospaceApi;
import com.aerospace.store.ApiKeyStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ApiConfig {

    @Value("${aerospace.api.aviation-weather.key:}")
    private String aviationWeatherKey;

    @Value("${aerospace.api.flightaware.key:}")
    private String flightAwareKey;

    @Value("${aerospace.api.nasa.key:}")
    private String nasaKey;

    @Bean
    public ApiKeyStore apiKeyStore() {
        ApiKeyStore store = new ApiKeyStore();
        store.register("system", AerospaceApi.AVIATION_WEATHER, aviationWeatherKey);
        store.register("system", AerospaceApi.FLIGHTAWARE,      flightAwareKey);
        store.register("system", AerospaceApi.NASA_EARTHDATA,   nasaKey);
        return store;
    }
}