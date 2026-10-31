package com.library.configrations;

import com.library.service.impl.CustomUserServiceImplementation;
import org.springframework.boot.test.util.TestPropertyValues;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.context.support.AnnotationConfigWebApplicationContext;

import java.util.List;

final class SecurityTestSupport {

    static final String TEST_SECRET = "test-only-jwt-secret-with-at-least-32-bytes";

    private SecurityTestSupport() {
    }

    static void configure(AnnotationConfigWebApplicationContext context) {
        TestPropertyValues.of(
                "app.jwt.secret=" + TEST_SECRET,
                "app.jwt.expiration-ms=60000")
                .applyTo(context);
    }

    static String token(String role) {
        JwtProvider provider = new JwtProvider(new JwtProperties(TEST_SECRET, 60_000L));
        String email = "ROLE_ADMIN".equals(role)
                ? "admin-security@example.test"
                : "user-security@example.test";
        return "Bearer " + provider.generateToken(new UsernamePasswordAuthenticationToken(
                email,
                null,
                List.of(new SimpleGrantedAuthority(role))));
    }

    @TestConfiguration
    static class Beans {

        @Bean
        JwtProvider jwtProvider(JwtProperties properties) {
            return new JwtProvider(properties);
        }

        @Bean
        CustomUserServiceImplementation userDetailsService() {
            return new CustomUserServiceImplementation(null) {
                @Override
                public org.springframework.security.core.userdetails.UserDetails loadUserByUsername(String username) {
                    return User.withUsername(username)
                            .password("unused")
                            .authorities(username.startsWith("admin-security@") ? "ROLE_ADMIN" : "ROLE_USER")
                            .build();
                }
            };
        }
    }
}
