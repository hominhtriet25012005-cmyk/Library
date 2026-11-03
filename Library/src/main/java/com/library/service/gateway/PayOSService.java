package com.library.service.gateway;

import vn.payos.PayOS;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;

import java.net.URI;
import java.util.Objects;

/** SDK adapter only. No persistence, activation or public API in stage B1. */
public class PayOSService {
    private final PayOS client;

    public PayOSService(PayOS client) {
        this.client = Objects.requireNonNull(client);
    }

    /** Amount is whole VND. URLs must come from server configuration, not client input. */
    public CreatePaymentLinkResponse createPaymentLink(long orderCode, long amountVnd,
            String description, String returnUrl, String cancelUrl) {
        if (orderCode <= 0 || amountVnd <= 0) {
            throw new IllegalArgumentException("Order code and VND amount must be positive");
        }
        if (description == null || description.isBlank()) {
            throw new IllegalArgumentException("Payment description is required");
        }
        validateUrl(returnUrl);
        validateUrl(cancelUrl);
        var request = CreatePaymentLinkRequest.builder()
                .orderCode(orderCode).amount(amountVnd).description(description)
                .returnUrl(returnUrl).cancelUrl(cancelUrl).build();
        // Preserve SDK errors for the application layer; never translate timeout to paid/failed.
        return client.paymentRequests().create(request);
    }

    public vn.payos.model.v2.paymentRequests.PaymentLink getPaymentLink(Long orderCode) {
        if (orderCode == null || orderCode <= 0) throw new IllegalArgumentException("Invalid order code");
        return client.paymentRequests().get(orderCode);
    }

    public vn.payos.model.webhooks.WebhookData verifyWebhook(java.util.Map<String, Object> body) {
        try {
            return client.webhooks().verify(body);
        } catch (RuntimeException ex) {
            throw new IllegalArgumentException("Invalid payOS webhook signature or payload");
        }
    }

    public static void validateUrl(String value) {
        try {
            URI uri = URI.create(value);
            if (!("https".equalsIgnoreCase(uri.getScheme()) || "http".equalsIgnoreCase(uri.getScheme()))
                    || uri.getHost() == null || uri.getUserInfo() != null) {
                throw new IllegalArgumentException();
            }
        } catch (IllegalArgumentException | NullPointerException ex) {
            throw new IllegalArgumentException("Payment return/cancel URL must be an absolute HTTP(S) URL");
        }
    }
}
