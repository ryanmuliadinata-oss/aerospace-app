package com.aerospace.store;

import com.aerospace.model.AerospaceApi;
import org.springframework.stereotype.Component;
import java.util.HashMap;
import java.util.Map;

@Component
public class ApiKeyStore {
    private final Map<String, Map<AerospaceApi, ApiCredential>> store
        = new HashMap<>();

    public void register(String userId, AerospaceApi api, String key) {
        store.computeIfAbsent(userId, k -> new HashMap<>())
             .put(api, new ApiCredential(userId, api, key));
    }

    public ApiCredential get(String userId, AerospaceApi api) {
        Map<AerospaceApi, ApiCredential> userApis = store.get(userId);
        if (userApis == null || !userApis.containsKey(api))
            throw new IllegalArgumentException(
                String.format("No [%s] credential for user '%s'", api, userId));
        return userApis.get(api);
    }
}