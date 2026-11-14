package com.library.service.impl;

import com.library.domain.*;
import com.library.model.Payment;
import com.library.repository.PaymentRepository;
import com.library.repository.SubscriptionRepository;
import com.library.repository.UserRepository;
import com.library.service.NotificationPublisher;
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
    private final UserRepository users;
    private final NotificationPublisher notificationPublisher;
    @jakarta.persistence.PersistenceContext
    private jakarta.persistence.EntityManager entityManager;

    @Transactional
    public void complete(Long id, String linkId, Long amount, String currency, String reference) {
        Payment observed = payments.findById(id).orElseThrow(() -> new IllegalArgumentException("Unknown payment"));

        if (observed.getSubscription() == null) throw new IllegalArgumentException("Membership payment required");

        // Tuần tự hóa tất cả các quyết toán tư cách thành viên cho người dùng trước
        // khi khóa gói đăng ký/khoản thanh toán mục tiêu.
        users.findLockedById(observed.getUser().getId()).orElseThrow();

        var subscription = subscriptions.findLockedById(observed.getSubscription().getId()).orElseThrow();

        Payment payment = payments.findLockedById(id).orElseThrow();
        // OSIV có thể đã tải các hàng này trước khi một callback cạnh tranh thực hiện commit.
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

            if (!reference.equals(payment.getGatewayPaymentId()))
                throw new IllegalArgumentException("Receipt mismatch");
            publishSuccessfulMembershipPayment(payment, subscription);
            return; // Không thiết lập lại ngày hoặc kích hoạt lại tư cách thành viên đã bị hủy/hết hạn sau đó.
        }

        if ((payment.getStatus() != PaymentStatus.PENDING && payment.getStatus() != PaymentStatus.PROCESSING)
                || subscription.getCancelledAt() != null || Boolean.TRUE.equals(subscription.getIsActive())) {
            throw new IllegalStateException("Payment requires manual reconciliation");
        }

        // Một thao tác đọc có khóa (locking read) sẽ quan sát hàng dữ liệu mới nhất đã được xác nhận (committed), ngay cả khi việc tra cứu thanh toán trước đó...
        // đã mở một snapshot MySQL ở chế độ REPEATABLE_READ trước khi chúng tôi giành được khóa người dùng (user lock).
        if (!subscriptions.findOtherCurrentActiveLockedByUserId(subscription.getUser().getId(),
                                                                subscription.getId(),
                                                                LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"))).isEmpty()) {
            // Tiền có thể đã đến payOS. Hãy giữ đơn hàng này ở trạng thái chờ để đối soát thủ công.
            throw new com.library.exception.ActiveMembershipException();
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

        // Bất kỳ lỗi nào cũng sẽ hoàn tác (rollback) cả hai thao tác ghi.
        // Không có sự kiện kích hoạt bất đồng bộ nào cho PAYOS.
        subscriptions.saveAndFlush(subscription);
        payments.saveAndFlush(payment);
        publishSuccessfulMembershipPayment(payment, subscription);
    }

    private void publishSuccessfulMembershipPayment(
            Payment payment,
            com.library.model.Subscription subscription) {
        boolean isRenewal = subscriptions.existsPreviouslyActivatedSubscription(
                subscription.getUser().getId(), subscription.getId(), PaymentStatus.SUCCESS);
        NotificationEventType membershipEvent = isRenewal
                ? NotificationEventType.MEMBERSHIP_RENEWED
                : NotificationEventType.MEMBERSHIP_ACTIVATED;
        notificationPublisher.publish(
                payment.getUser().getId(),
                null,
                membershipEvent,
                isRenewal ? "Gói thành viên đã được gia hạn" : "Gói thành viên đã được kích hoạt",
                "Gói “" + subscription.getPlanName() + "” có hiệu lực đến ngày "
                        + subscription.getEndDate() + ".",
                "/user/subscriptions",
                "SUBSCRIPTION",
                subscription.getId(),
                null);
        notificationPublisher.publish(
                payment.getUser().getId(),
                null,
                NotificationEventType.PAYMENT_SUCCEEDED,
                "Thanh toán payOS thành công",
                "Giao dịch " + payment.getAmount() + " đ cho gói “"
                        + subscription.getPlanName() + "” đã thành công.",
                "/user/subscriptions",
                "PAYMENT",
                payment.getId(),
                null);
    }
}
