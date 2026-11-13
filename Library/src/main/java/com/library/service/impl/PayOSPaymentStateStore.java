package com.library.service.impl;

import com.library.domain.PaymentStatus;
import com.library.model.Payment;
import com.library.repository.PaymentRepository;
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
                || payment.getStatus() == PaymentStatus.CANCELLED
                || payment.getStatus() == PaymentStatus.FAILED
                || gatewayStatus == PaymentLinkStatus.PAID) {
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

        return changed ? payments.saveAndFlush(payment) : payment;
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
}
