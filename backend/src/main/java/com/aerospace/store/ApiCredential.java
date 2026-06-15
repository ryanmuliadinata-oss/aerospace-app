package com.aerospace.store;

import com.aerospace.model.AerospaceApi;

public class ApiCredential {
    public final String       userId;
    public final AerospaceApi api;
    private final String      apiKey;

    public ApiCredential(String userId, AerospaceApi api, String apiKey) {
        this.userId = userId;
        this.api    = api;
        this.apiKey = apiKey;
    }

    public String authHeader() {
        if (api == AerospaceApi.OPEN_METEO || apiKey == null || apiKey.isBlank())
            return "";
        return api.authScheme + " " + apiKey;
    }

    public String rawKey() { return apiKey; }
}