package com.library.service.impl;

import com.library.domain.*;
import com.library.modal.Payment;
import com.library.repository.PaymentRepository;
import com.library.service.UserService;
import com.library.service.gateway.PayOSService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import vn.payos.model.v2.paymentRequests.PaymentLinkStatus;
import vn.payos.model.webhooks.WebhookData;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@lombok.extern.slf4j.Slf4j
public class PayOSConfirmationService {
    private final ObjectProvider<PayOSService> gateways;
    private final PaymentRepository payments;
    private final PayOSSettlementService settlement;
    private final UserService users;
    private final PayOSFineSettlementService fineSettlement;

    public record Status(Long paymentId, Long subscriptionId, Long fineId, Long amount, String currency,
                         PaymentStatus status, java.time.LocalDateTime completedAt) {}

    public String webhook(Map<String, Object> body) {
        var gateway = gateway();
        WebhookData data = gateway.verifyWebhook(body);
        if (data == null || data.getOrderCode() == null || data.getOrderCode() <= 0) {
            throw new IllegalArgumentException("Invalid webhook order");
        }
        // A signed setup probe or unknown order must never create rows or grant membership.
        var payment = payments.findById(data.getOrderCode());
        if (payment.isEmpty()) {
            log.warn("Signed payOS webhook for unknown order {}; no database changes", data.getOrderCode());
            return "IGNORED_UNKNOWN_ORDER";
        }
        if (!"00".equals(data.getCode())) return "IGNORED_NON_SUCCESS";
        if (!"VND".equals(data.getCurrency()) || !Objects.equals(data.getAmount(), payment.get().getAmount())) {
            throw new IllegalArgumentException("Webhook amount/currency mismatch");
        }
        confirm(payment.get(), data);
        return "OK";
    }

    public Status status(Long id) { return snapshot(authorized(id)); }

    public Status reconcile(Long id) {
        Payment payment = authorized(id);
        confirm(payment, null);
        return snapshot(authorized(id));
    }

    private void confirm(Payment payment, WebhookData webhook) {
        if (payment.getGateway() != PaymentGateway.PAYOS || (payment.getPaymentType() != PaymentType.MEMBERSHIP
                && payment.getPaymentType() != PaymentType.FINE)
                || !"VND".equals(payment.getCurrency())) {
            throw new IllegalArgumentException("payOS membership or fine payment required");
        }
        var link = gateway().getPaymentLink(payment.getId());
        if (link == null || !Objects.equals(link.getOrderCode(), payment.getId())
                || !Objects.equals(link.getAmount(), payment.getAmount()) || link.getId() == null || link.getId().isBlank()
                || (payment.getGatewayOrderId() != null && !payment.getGatewayOrderId().equals(link.getId()))
                || (webhook != null && !link.getId().equals(webhook.getPaymentLinkId()))) {
            throw new IllegalArgumentException("Gateway order mismatch");
        }
        if (link.getStatus() != PaymentLinkStatus.PAID) {
            if (webhook != null) throw new IllegalStateException("Payment not confirmed by gateway yet");
            return; // Never infer SUCCESS or failure from a browser redirect or a timeout.
        }
        if (!Objects.equals(link.getAmountPaid(), payment.getAmount()) || !Long.valueOf(0).equals(link.getAmountRemaining())
                || link.getTransactions() == null || link.getTransactions().size() != 1) {
            throw new IllegalArgumentException("Partial/overpaid or multiple receipts require manual reconciliation");
        }
        var receipt = link.getTransactions().get(0);
        if (!Objects.equals(receipt.getAmount(), payment.getAmount())
                || (webhook != null && !Objects.equals(receipt.getReference(), webhook.getReference()))) {
            throw new IllegalArgumentException("Gateway receipt mismatch");
        }
        if (payment.getPaymentType() == PaymentType.FINE) {
            fineSettlement.complete(payment.getId(), link.getId(), link.getAmount(), "VND", receipt.getReference());
        } else {
            settlement.complete(payment.getId(), link.getId(), link.getAmount(), "VND", receipt.getReference());
        }
    }

    private PayOSService gateway() {
        var gateway = gateways.getIfAvailable();
        if (gateway == null) throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "payOS is disabled");
        return gateway;
    }

    private Payment authorized(Long id) {
        com.library.modal.User user;
        try { user = users.getCurrentUser(); }
        catch (Exception ex) { throw new AccessDeniedException("Authentication required"); }
        Payment payment = payments.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));
        if (user.getRole() != UserRole.ROLE_ADMIN && !Objects.equals(payment.getUser().getId(), user.getId())) {
            throw new AccessDeniedException("Payment access denied");
        }
        return payment;
    }

    private Status snapshot(Payment payment) {
        return new Status(payment.getId(), payment.getSubscription() == null ? null : payment.getSubscription().getId(),
                payment.getFine() == null ? null : payment.getFine().getId(),
                payment.getAmount(), payment.getCurrency(), payment.getStatus(), payment.getCompletedAt());
    }
}
