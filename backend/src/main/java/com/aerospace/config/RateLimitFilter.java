package com.aerospace.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import org.springframework.core.annotation.Order;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Per-IP rate limiter.
 *
 * /api/health  — exempt (used by uptime monitors).
 * All others   — 5 requests per 15 minutes per IP.
 *               Greedy refill: 1 token every 3 minutes, so clients
 *               recover incrementally rather than waiting the full window.
 */
@Component
@Order(10)  // Runs after ApiKeyFilter (@Order 5) — unauthenticated requests never consume tokens.
public class RateLimitFilter extends OncePerRequestFilter {

    private static final int      MAX_TRACKED_IPS    = 10_000;
    private static final int      CAPACITY           = 5;
    private static final Duration REFILL_PERIOD      = Duration.ofMinutes(15);
    // seconds until next token is available (REFILL_PERIOD / CAPACITY)
    private static final int      RETRY_AFTER_SECS   = (int) REFILL_PERIOD.toSeconds() / CAPACITY;

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest  request,
                                    HttpServletResponse response,
                                    FilterChain         filterChain)
            throws ServletException, IOException {

        if ("/api/health".equals(request.getRequestURI())) {
            filterChain.doFilter(request, response);
            return;
        }

        String ip = clientIp(request);

        // Evict all entries when the map is full to cap memory use.
        if (buckets.size() >= MAX_TRACKED_IPS && !buckets.containsKey(ip)) {
            buckets.clear();
        }

        Bucket bucket = buckets.computeIfAbsent(ip, k -> newBucket());

        if (bucket.tryConsume(1)) {
            filterChain.doFilter(request, response);
        } else {
            response.setStatus(429);
            response.setContentType("application/json");
            response.setHeader("Retry-After", String.valueOf(RETRY_AFTER_SECS));
            response.getWriter().write(
                "{\"error\":\"Rate limit exceeded — max 5 requests per 15 minutes.\"}");
        }
    }

    private static Bucket newBucket() {
        return Bucket.builder()
            .addLimit(Bandwidth.builder()
                .capacity(CAPACITY)
                .refillGreedy(CAPACITY, REFILL_PERIOD)
                .build())
            .build();
    }

    // Railway rewrites X-Forwarded-For before it reaches this filter, so the
    // leftmost value is the originating client IP, not a spoofable user header.
    // If the deployment platform changes, verify that XFF is still overwritten
    // by the trusted proxy rather than appended to attacker-controlled values.
    private static String clientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
