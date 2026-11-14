package com.library.repository;

import com.library.domain.EmailOutboxStatus;
import com.library.model.EmailOutbox;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface EmailOutboxRepository extends JpaRepository<EmailOutbox, Long> {

    boolean existsByDeduplicationKey(String deduplicationKey);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select e from EmailOutbox e where e.status = :status "
            + "and e.nextAttemptAt <= :now order by e.nextAttemptAt, e.id")
    List<EmailOutbox> findDueForUpdate(
            @Param("status") EmailOutboxStatus status,
            @Param("now") LocalDateTime now,
            Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    List<EmailOutbox> findByStatusAndLockedAtBeforeOrderByLockedAtAsc(
            EmailOutboxStatus status,
            LocalDateTime cutoff,
            Pageable pageable);

    Optional<EmailOutbox> findByIdAndLockedBy(Long id, String lockedBy);

    @Modifying(flushAutomatically = true)
    @Query(value = "UPDATE email_outbox SET status = 'CANCELLED' "
            + "WHERE deduplication_key = :deduplicationKey AND status = 'PENDING'", nativeQuery = true)
    int cancelPendingByDeduplicationKey(@Param("deduplicationKey") String deduplicationKey);

    @Modifying(flushAutomatically = true)
    @Query(value = """
            INSERT INTO email_outbox (
                recipient_user_id, notification_id, event_type, recipient_email,
                subject, body_html, status, attempt_count, max_attempts,
                next_attempt_at, deduplication_key
            ) VALUES (
                :recipientUserId, :notificationId, :eventType, :recipientEmail,
                :subject, :bodyHtml, 'PENDING', 0, 4, CURRENT_TIMESTAMP, :deduplicationKey
            )
            ON DUPLICATE KEY UPDATE id = id
            """, nativeQuery = true)
    int insertIfAbsent(
            @Param("recipientUserId") Long recipientUserId,
            @Param("notificationId") Long notificationId,
            @Param("eventType") String eventType,
            @Param("recipientEmail") String recipientEmail,
            @Param("subject") String subject,
            @Param("bodyHtml") String bodyHtml,
            @Param("deduplicationKey") String deduplicationKey);
}
