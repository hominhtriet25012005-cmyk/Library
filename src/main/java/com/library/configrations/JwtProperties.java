package com.library.configrations;

import io.jsonwebtoken.security.Keys;
import org.springframework.boot.context.properties.ConfigurationProperties;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

@ConfigurationProperties(prefix = "app.jwt")
public record JwtProperties(String secret, long expirationMs) {

    private static final int MINIMUM_SECRET_BYTES = 32;
    private static final long MINIMUM_EXPIRATION_MS = 60_000L;

    public JwtProperties {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException(
                    "JWT_SECRET is required. Configure it in the runtime environment; do not commit it to source.");
        }
        if (secret.getBytes(StandardCharsets.UTF_8).length < MINIMUM_SECRET_BYTES) {
            throw new IllegalStateException("JWT_SECRET must contain at least 32 bytes for HS256.");
        }
        if (expirationMs < MINIMUM_EXPIRATION_MS) {
            throw new IllegalStateException("JWT_EXPIRATION_MS must be at least 60000 milliseconds.");
        }
    }

    SecretKey signingKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }
}
