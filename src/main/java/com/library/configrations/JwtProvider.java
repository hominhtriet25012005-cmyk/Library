package com.library.configrations;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Instant;
import java.util.Collection;
import java.util.Date;
import java.util.Set;
import java.util.TreeSet;

@Service
public class JwtProvider {

    private final JwtProperties properties;
    private final Clock clock;

    public JwtProvider(JwtProperties properties) {
        this.properties = properties;
        this.clock = Clock.systemUTC();
    }

    public String generateToken(Authentication authentication) {
        Instant issuedAt = clock.instant();
        Instant expiresAt = issuedAt.plusMillis(properties.expirationMs());

        return Jwts.builder()
                .subject(authentication.getName())
                .issuedAt(Date.from(issuedAt))
                .expiration(Date.from(expiresAt))
                .claim("email", authentication.getName())
                // Compatibility metadata only. Authorization is reloaded from MySQL per request.
                .claim("authorities", populateAuthorities(authentication.getAuthorities()))
                .signWith(properties.signingKey())
                .compact();
    }

    public String getEmailFromJwtToken(String token) {
        Claims claims = parseClaims(token);
        String subject = claims.getSubject();
        if (subject != null && !subject.isBlank()) {
            return subject;
        }
        Object legacyEmail = claims.get("email");
        if (legacyEmail == null || legacyEmail.toString().isBlank()) {
            throw new IllegalArgumentException("JWT does not contain a subject");
        }
        return legacyEmail.toString();
    }

    Claims parseClaims(String token) {
        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException("JWT is required");
        }
        String rawToken = token.startsWith(JwtConstant.BEARER_PREFIX)
                ? token.substring(JwtConstant.BEARER_PREFIX.length())
                : token;
        if (rawToken.isBlank()) {
            throw new IllegalArgumentException("JWT is required");
        }
        return Jwts.parser()
                .verifyWith(properties.signingKey())
                .build()
                .parseSignedClaims(rawToken)
                .getPayload();
    }

    private String populateAuthorities(Collection<? extends GrantedAuthority> authorities) {
        Set<String> values = new TreeSet<>();
        for (GrantedAuthority authority : authorities) {
            values.add(authority.getAuthority());
        }
        return String.join(",", values);
    }
}
