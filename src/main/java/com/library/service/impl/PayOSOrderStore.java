package com.library.service.impl;

import com.library.domain.*;
import com.library.modal.Payment;
import com.library.repository.PaymentRepository;
import com.library.repository.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;
import java.util.Objects;
import java.util.UUID;

/** Short database transactions only; gateway I/O happens after commit. */
@Service
@RequiredArgsConstructor
public class PayOSOrderStore {
    private final PaymentRepository payments;
    private final SubscriptionRepository subscriptions;
    private final com.library.repository.UserRepository users;
    private final com.library.repository.SubscriptionPlanRepository plans;
    @jakarta.persistence.PersistenceContext
    private jakarta.persistence.EntityManager entityManager;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Long draftSubscription(Long planId, Long userId, String notes) {
        // Serialize repeated clicks for this user; leave gateway I/O outside the lock.
        var user = users.findLockedById(userId).orElseThrow();
        var plan = plans.findById(planId).orElseThrow(() -> new IllegalArgumentException("Plan not found"));
        if (!Boolean.TRUE.equals(plan.getIsActive())) throw new IllegalArgumentException("Subscription plan is inactive");
        var pending = subscriptions.findAwaitingPayment(userId, planId, PaymentGateway.PAYOS,
                java.util.List.of(PaymentStatus.PENDING, PaymentStatus.PROCESSING),
                org.springframework.data.domain.PageRequest.of(0, 1));
        if (!pending.isEmpty()) return pending.get(0).getId();
        var subscription = new com.library.modal.Subscription();
        subscription.setUser(user);
        subscription.setPlan(plan);
        subscription.initializeFromPlan();
        subscription.setNotes(notes);
        subscription.setIsActive(false);
        return subscriptions.saveAndFlush(subscription).getId();
    }

    public record Prepared(Payment payment, boolean newlyCreated) {}

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Prepared prepare(Long subscriptionId, Long userId) {
        var subscription = subscriptions.findLockedById(subscriptionId)
                .orElseThrow(() -> new IllegalArgumentException("Subscription not found"));
        if (!Objects.equals(subscription.getUser().getId(), userId)) {
            throw new IllegalArgumentException("Subscription does not belong to current user");
        }
        if (Boolean.TRUE.equals(subscription.getIsActive()) || subscription.getCancelledAt() != null) {
            throw new IllegalArgumentException("Subscription is not awaiting payment");
        }
        if (!"VND".equals(subscription.getCurrency()) || subscription.getPrice() == null
                || subscription.getPrice() <= 0) {
            throw new IllegalArgumentException("Subscription requires a positive VND price");
        }
        var existing = payments.findFirstBySubscriptionIdAndGatewayOrderByIdDesc(subscriptionId, PaymentGateway.PAYOS);
        if (existing.isPresent()) return new Prepared(existing.get(), false);
        Payment payment = new Payment();
        payment.setUser(subscription.getUser());
        payment.setSubscription(subscription);
        payment.setPaymentType(PaymentType.MEMBERSHIP);
        payment.setGateway(PaymentGateway.PAYOS);
        payment.setAmount(subscription.getPrice());
        payment.setCurrency("VND");
        payment.setStatus(PaymentStatus.PENDING);
        payment.setTransactionId("TXN_" + UUID.randomUUID());
        payment.setDescription("LIBRARY");
        return new Prepared(payments.saveAndFlush(payment), true);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Payment attachLink(Long id, String linkId) {
        Payment payment = payments.findLockedById(id).orElseThrow();
        // A webhook can commit SUCCESS while the create-link HTTP request is still in flight.
        entityManager.refresh(payment, jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
        if (payment.getGatewayOrderId() != null && !payment.getGatewayOrderId().equals(linkId)) {
            throw new IllegalStateException("Payment link mismatch");
        }
        payment.setGatewayOrderId(linkId);
        // Never overwrite terminal status if a future webhook wins this race.
        if (payment.getStatus() == PaymentStatus.PENDING) payment.setStatus(PaymentStatus.PROCESSING);
        return payments.saveAndFlush(payment);
    }
}
