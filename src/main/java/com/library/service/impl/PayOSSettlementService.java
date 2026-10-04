package com.library.service.impl;

import com.library.domain.*;
import com.library.modal.Payment;
import com.library.repository.PaymentRepository;
import com.library.repository.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.Objects;

/** Called only with server-verified payment evidence, never directly from client input. */
@Service
@RequiredArgsConstructor
public class PayOSSettlementService {
    private final PaymentRepository payments;
    private final SubscriptionRepository subscriptions;
    @jakarta.persistence.PersistenceContext
    private jakarta.persistence.EntityManager entityManager;

    @Transactional
    public void complete(Long id, String linkId, Long amount, String currency, String reference) {
        Payment observed = payments.findById(id).orElseThrow(() -> new IllegalArgumentException("Unknown payment"));
        if (observed.getSubscription() == null) throw new IllegalArgumentException("Membership payment required");
        // Same lock order as creation: subscription then payment.
        var subscription = subscriptions.findLockedById(observed.getSubscription().getId()).orElseThrow();
        Payment payment = payments.findLockedById(id).orElseThrow();
        // OSIV may have loaded these rows before a competing callback committed.
        entityManager.refresh(subscription, jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
        entityManager.refresh(payment, jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
        if (payment.getGateway() != PaymentGateway.PAYOS || payment.getPaymentType() != PaymentType.MEMBERSHIP
                || payment.getSubscription() == null || !Objects.equals(payment.getSubscription().getId(), subscription.getId())
                || !Objects.equals(payment.getUser().getId(), subscription.getUser().getId())
                || !"VND".equals(currency) || !"VND".equals(payment.getCurrency())
                || !"VND".equals(subscription.getCurrency()) || amount == null || amount <= 0
                || !amount.equals(payment.getAmount()) || !amount.equals(subscription.getPrice())
                || linkId == null || linkId.isBlank() || reference == null || reference.isBlank()
                || reference.length() > 255 || linkId.length() > 255
                || (payment.getGatewayOrderId() != null && !linkId.equals(payment.getGatewayOrderId()))) {
            throw new IllegalArgumentException("Payment evidence does not match stored order");
        }
        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            if (!reference.equals(payment.getGatewayPaymentId())) throw new IllegalArgumentException("Receipt mismatch");
            return; // Do not reset dates or reactivate a subsequently cancelled/expired membership.
        }
        if ((payment.getStatus() != PaymentStatus.PENDING && payment.getStatus() != PaymentStatus.PROCESSING)
                || subscription.getCancelledAt() != null || Boolean.TRUE.equals(subscription.getIsActive())) {
            throw new IllegalStateException("Payment requires manual reconciliation");
        }
        if (subscription.getStartDate() == null || subscription.getEndDate() == null) {
            throw new IllegalStateException("Missing membership duration");
        }
        long days = ChronoUnit.DAYS.between(subscription.getStartDate(), subscription.getEndDate());
        if (days <= 0) throw new IllegalStateException("Invalid membership duration");
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        subscription.setStartDate(today);
        subscription.setEndDate(today.plusDays(days));
        subscription.setIsActive(true);
        payment.setGatewayOrderId(linkId);
        payment.setGatewayPaymentId(reference);
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setCompletedAt(LocalDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh")));
        // Any failure rolls back both writes. No asynchronous activation event for PAYOS.
        subscriptions.saveAndFlush(subscription);
        payments.saveAndFlush(payment);
    }
}
