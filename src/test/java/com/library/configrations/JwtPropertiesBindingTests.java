package com.library.configrations;

import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Configuration;

import static org.assertj.core.api.Assertions.assertThat;

class JwtPropertiesBindingTests {

    private final ApplicationContextRunner runner = new ApplicationContextRunner()
            .withUserConfiguration(JwtPropertiesConfiguration.class)
            .withPropertyValues("app.jwt.expiration-ms=60000");

    @Configuration(proxyBeanMethods = false)
    @EnableConfigurationProperties(JwtProperties.class)
    static class JwtPropertiesConfiguration {
    }

    @Test
    void startupFailsClearlyWhenJwtSecretIsMissing() {
        runner.run(context -> {
            assertThat(context).hasFailed();
            assertThat(context.getStartupFailure())
                    .hasRootCauseMessage(
                            "JWT_SECRET is required. Configure it in the runtime environment; do not commit it to source.");
        });
    }

    @Test
    void startupAcceptsAValidRuntimeJwtSecret() {
        runner.withPropertyValues(
                        "app.jwt.secret=test-only-jwt-secret-with-at-least-32-bytes")
                .run(context -> {
                    assertThat(context).hasNotFailed();
                    assertThat(context).hasSingleBean(JwtProperties.class);
                });
    }
}
