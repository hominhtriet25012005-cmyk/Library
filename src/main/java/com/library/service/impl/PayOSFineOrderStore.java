package com.library.service.impl;

import com.library.domain.*;
import com.library.modal.Payment;
import com.library.repository.*;
import jakarta.persistence.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import java.util.*;

@Service
@RequiredArgsConstructor
public class PayOSFineOrderStore {
    private final FineRepository fines;
    private final PaymentRepository payments;
    @PersistenceContext private EntityManager entityManager;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public PayOSOrderStore.Prepared prepare(Long fineId, Long userId) {
        if (fineId == null) throw new IllegalArgumentException("Fine ID is required");
        var fine = fines.findLockedById(fineId).orElseThrow(() -> new IllegalArgumentException("Fine not found"));
        entityManager.refresh(fine, LockModeType.PESSIMISTIC_WRITE);
        if (!Objects.equals(fine.getUser().getId(), userId)) throw new AccessDeniedException("Fine access denied");
        if ((fine.getStatus() != FineStatus.PENDING && fine.getStatus() != FineStatus.PARTIALLY_PAID)
                || fine.getAmount() == null || fine.getAmountPaid() == null || fine.getAmountPaid() < 0
                || fine.getAmount() <= fine.getAmountPaid()) throw new IllegalStateException("Fine is not payable");
        var existing = payments.findFirstByFineIdAndGatewayOrderByIdDesc(fineId, PaymentGateway.PAYOS);
        if (existing.isPresent()) return new PayOSOrderStore.Prepared(existing.get(), false);
        var payment = Payment.builder().user(fine.getUser()).fine(fine).bookLoan(fine.getBookLoan())
                .paymentType(PaymentType.FINE).gateway(PaymentGateway.PAYOS)
                .amount(fine.getAmount() - fine.getAmountPaid()).currency("VND")
                .status(PaymentStatus.PENDING).transactionId("TXN_" + UUID.randomUUID())
                .description("LIBRARY FINE").build();
        return new PayOSOrderStore.Prepared(payments.saveAndFlush(payment), true);
    }
}
