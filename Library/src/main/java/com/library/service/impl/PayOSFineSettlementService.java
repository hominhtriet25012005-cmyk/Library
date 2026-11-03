package com.library.service.impl;

import com.library.domain.*;
import com.library.repository.*;
import jakarta.persistence.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.Objects;

/** Only called after signature and server-side gateway verification. */
@Service
@RequiredArgsConstructor
public class PayOSFineSettlementService {
    private final PaymentRepository payments;
    private final FineRepository fines;
    @PersistenceContext private EntityManager entityManager;

    @Transactional
    public void complete(Long id, String linkId, Long amount, String currency, String reference) {
        var observed = payments.findById(id).orElseThrow();
        if (observed.getFine() == null) throw new IllegalArgumentException("Fine payment required");
        // Creation and waiver use the same fine-first lock order.
        var fine = fines.findLockedById(observed.getFine().getId()).orElseThrow();
        var payment = payments.findLockedById(id).orElseThrow();
        entityManager.refresh(fine, LockModeType.PESSIMISTIC_WRITE);
        entityManager.refresh(payment, LockModeType.PESSIMISTIC_WRITE);
        if (payment.getGateway() != PaymentGateway.PAYOS || payment.getPaymentType() != PaymentType.FINE
                || payment.getFine() == null || !Objects.equals(payment.getFine().getId(), fine.getId())
                || payment.getSubscription() != null || payment.getBookLoan() == null
                || !Objects.equals(payment.getBookLoan().getId(), fine.getBookLoan().getId())
                || !Objects.equals(payment.getUser().getId(), fine.getUser().getId())
                || !"VND".equals(currency) || !"VND".equals(payment.getCurrency())
                || amount == null || amount <= 0 || !amount.equals(payment.getAmount())
                || linkId == null || linkId.isBlank() || linkId.length() > 255
                || reference == null || reference.isBlank() || reference.length() > 100
                || (payment.getGatewayOrderId() != null && !linkId.equals(payment.getGatewayOrderId()))) {
            throw new IllegalArgumentException("Payment evidence does not match stored fine order");
        }
        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            if (!reference.equals(payment.getGatewayPaymentId())) throw new IllegalArgumentException("Receipt mismatch");
            return;
        }
        if ((payment.getStatus() != PaymentStatus.PENDING && payment.getStatus() != PaymentStatus.PROCESSING)
                || fine.getAmount() == null || fine.getAmountPaid() == null || fine.getAmountPaid() < 0
                || fine.getAmountPaid() > fine.getAmount() || amount != fine.getAmount() - fine.getAmountPaid()) {
            throw new IllegalStateException("Fine payment requires manual reconciliation");
        }
        fine.applyPayment(amount);
        fine.setTransactionId(reference);
        payment.setGatewayOrderId(linkId);
        payment.setGatewayPaymentId(reference);
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setCompletedAt(LocalDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh")));
        fines.saveAndFlush(fine);
        payments.saveAndFlush(payment);
    }
}
