package com.library;

import com.library.configrations.PayOSConfiguration;
import com.library.service.gateway.PayOSService;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import vn.payos.PayOS;

import static org.assertj.core.api.Assertions.assertThat;

class PayOSConfigurationTests {
    private final ApplicationContextRunner runner = new ApplicationContextRunner()
            .withUserConfiguration(PayOSConfiguration.class);

    @Test
    void disabledByDefaultWithoutCredentials() {
        runner.run(context -> {
            assertThat(context).hasNotFailed();
            assertThat(context).doesNotHaveBean(PayOS.class);
            assertThat(context).doesNotHaveBean(PayOSService.class);
        });
    }

    @Test
    void explicitDisableDoesNotNeedCredentials() {
        runner.withPropertyValues("payos.enabled=false").run(context ->
                assertThat(context).doesNotHaveBean(PayOSService.class));
    }

    @Test
    void enabledWithoutCredentialsFailsClosed() {
        runner.withPropertyValues("payos.enabled=true").run(context ->
                assertThat(context).hasFailed());
    }

    @Test
    void enabledWithDummyCredentialsCreatesBeansWithoutNetwork() {
        runner.withPropertyValues("payos.enabled=true", "payos.client-id=test-client",
                "payos.api-key=test-key", "payos.checksum-key=test-checksum")
                .run(context -> {
                    assertThat(context).hasNotFailed();
                    assertThat(context).hasSingleBean(PayOS.class);
                    assertThat(context).hasSingleBean(PayOSService.class);
                });
    }
}
