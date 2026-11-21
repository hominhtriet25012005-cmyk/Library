package com.library.repository;

import com.library.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, Long>, org.springframework.data.jpa.repository.JpaSpecificationExecutor<Payment> {
    java.util.List<Payment> findByUserIdAndPaymentTypeAndGatewayAndStatusInOrderByIdDesc(
            Long userId, com.library.domain.PaymentType paymentType,
            com.library.domain.PaymentGateway gateway,
            java.util.Collection<com.library.domain.PaymentStatus> statuses,
            org.springframework.data.domain.Pageable pageable);
    /** Current locking read after the account lock: covers all plans and uncertain gateway calls. */
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select p from Payment p where p.user.id = :userId "
            + "and p.paymentType = 'MEMBERSHIP' and p.gateway = 'PAYOS' "
            + "and p.status in ('PENDING', 'PROCESSING') order by p.id")
    java.util.List<Payment> findOpenMembershipPaymentsForUpdate(
            @org.springframework.data.repository.query.Param("userId") Long userId);

    java.util.Optional<Payment> findFirstByFineIdAndGatewayAndStatusInOrderByIdDesc(
            Long fineId, com.library.domain.PaymentGateway gateway,
            java.util.Collection<com.library.domain.PaymentStatus> statuses);
    java.util.Optional<Payment> findFirstBySubscriptionIdAndGatewayAndStatusInOrderByIdDesc(
            Long subscriptionId, com.library.domain.PaymentGateway gateway,
            java.util.Collection<com.library.domain.PaymentStatus> statuses);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select p from Payment p where p.id = :id")
    java.util.Optional<Payment> findLockedById(@org.springframework.data.repository.query.Param("id") Long id);
}
