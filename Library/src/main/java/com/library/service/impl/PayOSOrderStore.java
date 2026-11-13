package com.library.service.impl;

import com.library.domain.*;
import com.library.model.Payment;
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
        // Tuần tự hóa các lượt nhấp liên tiếp của người dùng này;
        // giữ các thao tác I/O cổng kết nối (gateway I/O) nằm ngoài phạm vi khóa.
        var user = users.findLockedById(userId).orElseThrow();

        if (subscriptions.existsCurrentActiveByUserId(userId,
                java.time.LocalDate.now(java.time.ZoneId.of("Asia/Ho_Chi_Minh")))) {
            throw new com.library.exception.ActiveMembershipException();
        }

        var plan = plans.findById(planId).orElseThrow(() -> new IllegalArgumentException("Plan not found"));

        if (!Boolean.TRUE.equals(plan.getIsActive())) throw new IllegalArgumentException("Subscription plan is inactive");

        var pending = subscriptions.findAwaitingPayment(userId, planId, PaymentGateway.PAYOS,
                java.util.List.of(PaymentStatus.PENDING, PaymentStatus.PROCESSING),
                org.springframework.data.domain.PageRequest.of(0, 1));

        if (!pending.isEmpty()) return pending.get(0).getId();

        var subscription = new com.library.model.Subscription();
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
        users.findLockedById(userId).orElseThrow();

        if (subscriptions.existsCurrentActiveByUserId(userId,
                java.time.LocalDate.now(java.time.ZoneId.of("Asia/Ho_Chi_Minh")))) {
            throw new com.library.exception.ActiveMembershipException();
        }

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

        var existing = payments.findFirstBySubscriptionIdAndGatewayAndStatusInOrderByIdDesc(
                subscriptionId, PaymentGateway.PAYOS,
                java.util.List.of(PaymentStatus.PENDING, PaymentStatus.PROCESSING));

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

        // Một webhook có thể xác nhận trạng thái THÀNH CÔNG ngay cả khi yêu cầu HTTP
        // tạo liên kết vẫn đang trong quá trình thực hiện.
        entityManager.refresh(payment, jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);

        if (payment.getGatewayOrderId() != null && !payment.getGatewayOrderId().equals(linkId)) {
            throw new IllegalStateException("Payment link mismatch");
        }

        payment.setGatewayOrderId(linkId);
        // Không bao giờ ghi đè trạng thái cuối cùng nếu một webhook
        // đến sau giành chiến thắng trong cuộc đua này.

        if (payment.getStatus() == PaymentStatus.PENDING) payment.setStatus(PaymentStatus.PROCESSING);

        return payments.saveAndFlush(payment);
    }
}
