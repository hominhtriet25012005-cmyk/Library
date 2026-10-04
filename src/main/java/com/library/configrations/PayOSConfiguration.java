package com.library.configrations;

import com.library.service.gateway.PayOSService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;
import vn.payos.PayOS;
import vn.payos.core.ClientOptions;
import okhttp3.OkHttpClient;

import java.time.Duration;

@Configuration(proxyBeanMethods = false)
@ConditionalOnProperty(name = "payos.enabled", havingValue = "true")
public class PayOSConfiguration {
    @Bean
    public PayOS payOS(@Value("${payos.client-id:}") String clientId,
                       @Value("${payos.api-key:}") String apiKey,
                       @Value("${payos.checksum-key:}") String checksumKey) {
        requireCredential(clientId, "PAYOS_CLIENT_ID");
        requireCredential(apiKey, "PAYOS_API_KEY");
        requireCredential(checksumKey, "PAYOS_CHECKSUM_KEY");
        // A timeout is ambiguous: reconcile the order before retrying creation.
        OkHttpClient httpClient = new OkHttpClient.Builder()
                .connectTimeout(Duration.ofSeconds(10))
                .readTimeout(Duration.ofSeconds(15))
                .callTimeout(Duration.ofSeconds(20))
                .retryOnConnectionFailure(false)
                .build();
        return new PayOS(ClientOptions.builder()
                .clientId(clientId).apiKey(apiKey).checksumKey(checksumKey)
                .maxRetries(0).httpClient(httpClient).build());
    }

    @Bean
    public PayOSService payOSService(PayOS payOS) {
        return new PayOSService(payOS);
    }

    private static void requireCredential(String value, String name) {
        if (!StringUtils.hasText(value)) {
            throw new IllegalStateException("Missing payOS configuration: " + name);
        }
    }
}
