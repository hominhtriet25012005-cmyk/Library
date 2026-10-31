package com.library.configrations;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;

class JwtSecurityTests {

    private static final String TEST_SECRET = "test-only-jwt-secret-with-at-least-32-bytes";

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void jwtConfigurationRejectsMissingOrWeakSecrets() {
        assertThatThrownBy(() -> new JwtProperties("", 86_400_000L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("JWT_SECRET");
        assertThatThrownBy(() -> new JwtProperties("too-short", 86_400_000L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("32 bytes");
    }

    @Test
    void jwtConfigurationRejectsUnsafeExpiration() {
        assertThatThrownBy(() -> new JwtProperties(TEST_SECRET, 0))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("JWT_EXPIRATION_MS");
    }

    @Test
    void providerSignsAndReadsConfiguredToken() {
        JwtProvider provider = new JwtProvider(new JwtProperties(TEST_SECRET, 60_000L));
        var authentication = new UsernamePasswordAuthenticationToken(
                "member@example.test",
                null,
                List.of(new SimpleGrantedAuthority("ROLE_USER")));

        String token = provider.generateToken(authentication);

        assertThat(provider.getEmailFromJwtToken("Bearer " + token))
                .isEqualTo("member@example.test");
    }

    @Test
    void validatorUsesCurrentDatabaseRoleInsteadOfRoleStoredInToken() throws Exception {
        JwtProvider provider = new JwtProvider(new JwtProperties(TEST_SECRET, 60_000L));
        String token = provider.generateToken(new UsernamePasswordAuthenticationToken(
                "changed@example.test",
                null,
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))));
        UserDetailsService users = username -> User.withUsername(username)
                .password("unused")
                .authorities("ROLE_USER")
                .build();
        JwtValidator validator = new JwtValidator(provider, users);
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/users/list");
        request.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        validator.doFilter(request, response, chain);

        assertThat(response.getStatus()).isEqualTo(200);
        assertThat(SecurityContextHolder.getContext().getAuthentication().getAuthorities())
                .extracting(Object::toString)
                .containsExactly("ROLE_USER");
    }

    @Test
    void validatorRejectsTokenWhenUserNoLongerExists() throws Exception {
        JwtProvider provider = new JwtProvider(new JwtProperties(TEST_SECRET, 60_000L));
        String token = provider.generateToken(new UsernamePasswordAuthenticationToken(
                "deleted@example.test",
                null,
                List.of(new SimpleGrantedAuthority("ROLE_USER"))));
        UserDetailsService users = username -> {
            throw new UsernameNotFoundException(username);
        };
        JwtValidator validator = new JwtValidator(provider, users);
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/books/1");
        request.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse response = new MockHttpServletResponse();

        validator.doFilter(request, response, mock(FilterChain.class));

        assertThat(response.getStatus()).isEqualTo(401);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void validatorDoesNotTurnApplicationErrorsIntoInvalidTokenResponses() {
        JwtProvider provider = new JwtProvider(new JwtProperties(TEST_SECRET, 60_000L));
        String token = provider.generateToken(new UsernamePasswordAuthenticationToken(
                "member@example.test",
                null,
                List.of(new SimpleGrantedAuthority("ROLE_USER"))));
        UserDetailsService users = username -> User.withUsername(username)
                .password("unused")
                .authorities("ROLE_USER")
                .build();
        JwtValidator validator = new JwtValidator(provider, users);
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/books/1");
        request.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse response = new MockHttpServletResponse();

        assertThatThrownBy(() -> validator.doFilter(request, response,
                (servletRequest, servletResponse) -> {
                    throw new ServletException("application failure");
                }))
                .isInstanceOf(ServletException.class)
                .hasMessage("application failure");
        assertThat(response.getStatus()).isEqualTo(200);
    }
}
