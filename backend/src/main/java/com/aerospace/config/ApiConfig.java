package com.aerospace.config;

import com.aerospace.model.AerospaceApi;
import com.aerospace.store.ApiKeyStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ApiConfig {

    @Value("${aerospace.api.flightaware.key:}")
    private String flightAwareKey;

    @Bean
    public ApiKeyStore apiKeyStore() {
        ApiKeyStore store = new ApiKeyStore();
        store.register("system", AerospaceApi.FLIGHTAWARE, flightAwareKey);
        return store;
    }
}