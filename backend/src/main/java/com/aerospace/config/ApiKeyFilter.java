package com.aerospace.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Optional API key gate for all non-health endpoints.
 *
 * Activation: set AEROSPACE_API_KEY in the environment (or
 * aerospace.api.key in application.properties). If the env var is
 * absent or blank, the filter is a no-op — safe for local dev.
 *
 * Clients must send:  X-Api-Key: <key>
 *
 * Runs before RateLimitFilter (@Order 10) so unauthenticated requests
 * never consume rate-limit tokens.
 */
@Component
@Order(5)
public class ApiKeyFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(ApiKeyFilter.class);
    private static final String HEADER = "X-Api-Key";

    @Value("${aerospace.api.key:}")
    private String configuredKey;

    @Override
    protected void doFilterInternal(HttpServletRequest  request,
                                    HttpServletResponse response,
                                    FilterChain         filterChain)
            throws ServletException, IOException {

        if ("/api/health".equals(request.getRequestURI())) {
            filterChain.doFilter(request, response);
            return;
        }

        if (configuredKey == null || configuredKey.isBlank()) {
            // Auth not configured — allow all (dev mode). Logged once at startup
            // via @PostConstruct would be cleaner, but a per-request warn is fine.
            filterChain.doFilter(request, response);
            return;
        }

        String provided = request.getHeader(HEADER);
        if (provided == null || !provided.equals(configuredKey)) {
            log.warn("[ApiKey] Rejected {} {} — missing or invalid key",
                request.getMethod(), request.getRequestURI());
            response.setStatus(401);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Missing or invalid API key\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }
}
