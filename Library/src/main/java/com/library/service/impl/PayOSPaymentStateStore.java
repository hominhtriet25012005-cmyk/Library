package com.library.service.impl;

import com.library.domain.PaymentStatus;
import com.library.domain.NotificationEventType;
import com.library.domain.PaymentType;
import com.library.model.Payment;
import com.library.repository.PaymentRepository;
import com.library.service.NotificationPublisher;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import vn.payos.model.v2.paymentRequests.PaymentLinkStatus;

import java.time.LocalDateTime;
import java.time.ZoneId;

/** Đồng bộ trạng thái không thành công từ payOS mà không cấp quyền hay ghi nhận tiền. */
@Service
@RequiredArgsConstructor
public class PayOSPaymentStateStore {
    private static final ZoneId BUSINESS_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final PaymentRepository payments;
    private final NotificationPublisher notificationPublisher;

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Payment synchronizeNonPaidStatus(Long paymentId, PaymentLinkStatus gatewayStatus) {
        if (gatewayStatus == null) {
            throw new IllegalArgumentException("payOS payment status is missing");
        }

        Payment payment = payments.findLockedById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));
        entityManager.refresh(payment, LockModeType.PESSIMISTIC_WRITE);

        if (payment.getStatus() == PaymentStatus.SUCCESS
                || payment.getStatus() == PaymentStatus.REFUNDED
                || gatewayStatus == PaymentLinkStatus.PAID) {
            return payment;
        }
        if (payment.getStatus() == PaymentStatus.CANCELLED
                || payment.getStatus() == PaymentStatus.FAILED) {
            publishFailedPayment(payment);
            return payment;
        }

        boolean changed = switch (gatewayStatus) {
            case CANCELLED -> markTerminal(payment, PaymentStatus.CANCELLED, "payOS status: CANCELLED");
            case FAILED, EXPIRED -> markTerminal(payment, PaymentStatus.FAILED,
                    "payOS status: " + gatewayStatus.name());
            case UNDERPAID -> markProcessing(payment,
                    "payOS status: UNDERPAID; manual reconciliation required");
            case PROCESSING -> markProcessing(payment, null);
            case PENDING -> false;
            case PAID -> false;
        };

        Payment result = changed ? payments.saveAndFlush(payment) : payment;
        if (result.getStatus() == PaymentStatus.CANCELLED
                || result.getStatus() == PaymentStatus.FAILED) {
            publishFailedPayment(result);
        }
        return result;
    }

    private boolean markTerminal(Payment payment, PaymentStatus status, String reason) {
        payment.setStatus(status);
        payment.setFailureReason(reason);
        payment.setCompletedAt(LocalDateTime.now(BUSINESS_ZONE));
        return true;
    }

    private boolean markProcessing(Payment payment, String reason) {
        boolean changed = payment.getStatus() != PaymentStatus.PROCESSING
                || !java.util.Objects.equals(payment.getFailureReason(), reason);
        payment.setStatus(PaymentStatus.PROCESSING);
        payment.setFailureReason(reason);
        payment.setCompletedAt(null);
        return changed;
    }

    private void publishFailedPayment(Payment payment) {
        boolean membership = payment.getPaymentType() == PaymentType.MEMBERSHIP;
        String statusText = payment.getStatus() == PaymentStatus.CANCELLED
                ? "đã bị hủy" : "không thành công";
        notificationPublisher.publish(
                payment.getUser().getId(),
                null,
                NotificationEventType.PAYMENT_FAILED,
                "Thanh toán payOS không hoàn tất",
                "Giao dịch " + payment.getAmount() + " đ " + statusText
                        + ". Bạn có thể tạo yêu cầu thanh toán mới.",
                membership ? "/user/subscriptions" : "/user/my-fines",
                "PAYMENT",
                payment.getId(),
                null);
    }
}
