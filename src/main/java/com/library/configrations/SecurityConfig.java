package com.library.configrations;

import jakarta.servlet.http.HttpServletRequest;
import com.library.service.impl.CustomUserServiceImplementation;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import java.util.Arrays;
import java.util.Collections;

@Configuration
@EnableConfigurationProperties(JwtProperties.class)
public class SecurityConfig {

    private final JwtProvider jwtProvider;
    private final CustomUserServiceImplementation userDetailsService;

    public SecurityConfig(JwtProvider jwtProvider, CustomUserServiceImplementation userDetailsService) {
        this.jwtProvider = jwtProvider;
        this.userDetailsService = userDetailsService;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .sessionManagement(managment -> managment.sessionCreationPolicy(
                        SessionCreationPolicy.STATELESS
                ))
                .authorizeHttpRequests(Authorize -> Authorize
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/payments/webhook/payos").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/book-covers/**").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/users/list").hasRole("ADMIN")
                        .requestMatchers("/api/subscriptions/activate").denyAll()
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/fines", "/api/fines/", "/api/fines/waive").hasRole("ADMIN")
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/fines", "/api/fines/").hasRole("ADMIN")
                        .requestMatchers("/api/subscriptions/admin", "/api/subscriptions/admin/**").hasRole("ADMIN")
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/payments", "/api/payments/").hasRole("ADMIN")
                        .requestMatchers("/api/subscription-plans/admin", "/api/subscription-plans/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/reviews/admin", "/api/reviews/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/book-loans/admin/**").hasRole("ADMIN")
                        .requestMatchers(org.springframework.http.HttpMethod.POST,
                                "/api/book-loans/checkout/user/**", "/api/book-loans/search",
                                "/api/reservations/user/**", "/api/reservations/search",
                                "/api/reservations/*/fulfill").hasRole("ADMIN")
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/books/bulk", "/api/genres/create").hasRole("ADMIN")
                        .requestMatchers(org.springframework.http.HttpMethod.PUT, "/api/books/**", "/api/genres/**").hasRole("ADMIN")
                        .requestMatchers(org.springframework.http.HttpMethod.DELETE, "/api/books/**", "/api/genres/**").hasRole("ADMIN")
                        .requestMatchers("/api/**").authenticated()
                        .anyRequest().permitAll()
                )
                .addFilterBefore(new JwtValidator(jwtProvider, userDetailsService), BasicAuthenticationFilter.class)
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors-> cors.configurationSource(corsConfigrationSource()))
                .build();
    }

    private CorsConfigurationSource corsConfigrationSource() {
        return new CorsConfigurationSource() {

            @Override
            public CorsConfiguration getCorsConfiguration(HttpServletRequest request) {
                CorsConfiguration cfg = new CorsConfiguration();
                cfg.setAllowCredentials(true);
                cfg.setAllowedOrigins(
                        Arrays.asList(
                                "http://localhost:5173",
                                "https://library.com"
                        )
                );
                cfg.setAllowedMethods(Collections.singletonList("*"));
                cfg.setAllowedHeaders(Collections.singletonList("*"));
                cfg.setExposedHeaders(Collections.singletonList("Authorization"));
                cfg.setMaxAge(360L);
                return cfg;
            }
        };
    }

    @Bean
    public PasswordEncoder passwordEncoder(){
        return new BCryptPasswordEncoder();
    }
}


