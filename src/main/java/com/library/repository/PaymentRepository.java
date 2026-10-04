package com.library.repository;

import com.library.modal.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    java.util.Optional<Payment> findFirstByFineIdAndGatewayOrderByIdDesc(
            Long fineId, com.library.domain.PaymentGateway gateway);
    java.util.Optional<Payment> findFirstBySubscriptionIdAndGatewayOrderByIdDesc(
            Long subscriptionId, com.library.domain.PaymentGateway gateway);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select p from Payment p where p.id = :id")
    java.util.Optional<Payment> findLockedById(@org.springframework.data.repository.query.Param("id") Long id);
}
