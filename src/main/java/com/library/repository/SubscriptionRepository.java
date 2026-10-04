package com.library.repository;

import com.library.modal.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {
    @Query("select s from Subscription s where s.user.id = :userId and s.plan.id = :planId "
            + "and s.isActive = false and s.cancelledAt is null and "
            + "(not exists (select p.id from Payment p where p.subscription = s) "
            + "or exists (select p.id from Payment p where p.subscription = s and p.gateway = :gateway "
            + "and p.status in :statuses)) order by s.id desc")
    List<Subscription> findAwaitingPayment(@Param("userId") Long userId, @Param("planId") Long planId,
            @Param("gateway") com.library.domain.PaymentGateway gateway,
            @Param("statuses") java.util.Collection<com.library.domain.PaymentStatus> statuses,
            org.springframework.data.domain.Pageable pageable);
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from Subscription s where s.id = :id")
    Optional<Subscription> findLockedById(@Param("id") Long id);

    @Query("select s from Subscription s where s.user.id = :userId AND " +
            "s.isActive = true and " +
            "s.startDate <= :today and s.endDate >= :today"
    )
    Optional<Subscription> findActiveSubscriptionByUserId(
            @Param("userId") Long userId,
            @Param("today") LocalDate today
    );

    @Query("select s from Subscription s where s.isActive = true " +
            "AND s.endDate < :today")
    List<Subscription> findExpiredActiveSubscriptions(
            @Param("today") LocalDate today
    );
}
