package com.library;

import com.library.service.gateway.PayOSService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import vn.payos.PayOS;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;
import vn.payos.service.blocking.v2.paymentRequests.PaymentRequestsService;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class PayOSServiceTests {
    private final PayOS client = mock(PayOS.class);
    private final PaymentRequestsService requests = mock(PaymentRequestsService.class);
    private final PayOSService service = new PayOSService(client);

    @Test
    void realSdkSerializesSignedJsonAndHandlesHttpErrorWithoutNetwork() throws Exception {
        var capturedBody = new java.util.concurrent.atomic.AtomicReference<String>();
        var calls = new java.util.concurrent.atomic.AtomicInteger();
        var http = new okhttp3.OkHttpClient.Builder().addInterceptor(chain -> {
            calls.incrementAndGet();
            var buffer = new okio.Buffer();
            chain.request().body().writeTo(buffer);
            capturedBody.set(buffer.readUtf8());
            // Intercept before network; these are dummy credentials only.
            return new okhttp3.Response.Builder().request(chain.request())
                    .protocol(okhttp3.Protocol.HTTP_1_1).code(401).message("Unauthorized")
                    .body(okhttp3.ResponseBody.create(
                            "{\"code\":\"401\",\"desc\":\"simulated rejection\"}",
                            okhttp3.MediaType.get("application/json")))
                    .build();
        }).build();
        var sdk = new PayOS(vn.payos.core.ClientOptions.builder()
                .clientId("dummy-client").apiKey("dummy-api-key").checksumKey("dummy-checksum")
                .maxRetries(0).httpClient(http).build());
        assertThatThrownBy(() -> new PayOSService(sdk).createPaymentLink(42, 100000,
                "Plan", "https://example.test/success", "https://example.test/cancel"))
                .isInstanceOf(vn.payos.exception.PayOSException.class);
        assertThat(calls.get()).isEqualTo(1);
        var json = new com.fasterxml.jackson.databind.ObjectMapper().readTree(capturedBody.get());
        assertThat(json.get("amount").asLong()).isEqualTo(100000L);
        assertThat(json.get("orderCode").asLong()).isEqualTo(42L);
        assertThat(json.get("signature").asText()).matches("[0-9a-f]{64}");
        assertThat(capturedBody.get()).doesNotContain("dummy-api-key", "dummy-checksum");
    }

    @Test
    void createsLinkWithUnscaledVndAndReturnsQr() {
        when(client.paymentRequests()).thenReturn(requests);
        var response = CreatePaymentLinkResponse.builder().orderCode(42L).amount(100000L)
                .bin("970422").accountNumber("0000000000").accountName("TEST ONLY")
                .description("Membership").status(vn.payos.model.v2.paymentRequests.PaymentLinkStatus.PENDING)
                .currency("VND").paymentLinkId("test-link").qrCode("test-qr")
                .checkoutUrl("https://example.test/checkout").build();
        when(requests.create(any(CreatePaymentLinkRequest.class))).thenReturn(response);
        assertThat(service.createPaymentLink(42, 100000, "Membership", "http://localhost:5173/success",
                "http://localhost:5173/cancel")).isSameAs(response);
        var captor = ArgumentCaptor.forClass(CreatePaymentLinkRequest.class);
        verify(requests).create(captor.capture());
        assertThat(captor.getValue().getAmount()).isEqualTo(100000L);
        assertThat(captor.getValue().getOrderCode()).isEqualTo(42L);
        assertThat(captor.getValue().getReturnUrl()).isEqualTo("http://localhost:5173/success");
        assertThat(captor.getValue().getCancelUrl()).isEqualTo("http://localhost:5173/cancel");
    }

    @Test
    void rejectsInvalidInputWithoutCallingSdk() {
        assertThatThrownBy(() -> service.createPaymentLink(0, 100, "Plan", "https://example.test", "https://example.test"))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.createPaymentLink(1, 0, "Plan", "https://example.test", "https://example.test"))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.createPaymentLink(1, 100, " ", "https://example.test", "https://example.test"))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.createPaymentLink(1, 100, "Plan", "http://localhost:5173}", "https://example.test"))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.createPaymentLink(1, 100, "Plan", "https://example.test", "/cancel"))
                .isInstanceOf(IllegalArgumentException.class);
        verifyNoInteractions(client, requests);
    }

    @Test
    void propagatesErrorWithoutRetryOrSuccessResult() {
        when(client.paymentRequests()).thenReturn(requests);
        var failure = new IllegalStateException("simulated gateway failure");
        when(requests.create(any(CreatePaymentLinkRequest.class))).thenThrow(failure);
        assertThatThrownBy(() -> service.createPaymentLink(42, 100000, "Plan", "https://example.test/success",
                "https://example.test/cancel")).isSameAs(failure);
        verify(requests, times(1)).create(any(CreatePaymentLinkRequest.class));
    }
}
