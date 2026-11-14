package com.library.repository;

import com.library.model.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Optional<Notification> findByDeduplicationKey(String deduplicationKey);

    @Query("select n from Notification n where n.recipient.id = :userId")
    Page<Notification> findForUser(@Param("userId") Long userId, Pageable pageable);

    @Query("select n from Notification n where n.recipient.id = :userId and n.readAt is null")
    Page<Notification> findUnreadForUser(@Param("userId") Long userId, Pageable pageable);

    @Query("select count(n) from Notification n where n.recipient.id = :userId and n.readAt is null")
    long countUnreadForUser(@Param("userId") Long userId);

    long countByBatchKey(String batchKey);

    @Query("select n from Notification n where n.id = :notificationId and n.recipient.id = :userId")
    Optional<Notification> findOwnedNotification(
            @Param("notificationId") Long notificationId,
            @Param("userId") Long userId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update Notification n set n.readAt = :readAt "
            + "where n.recipient.id = :userId and n.readAt is null")
    int markAllReadForUser(
            @Param("userId") Long userId,
            @Param("readAt") LocalDateTime readAt);

    @Modifying(flushAutomatically = true)
    @Query(value = """
            INSERT INTO notifications (
                recipient_user_id,
                created_by_user_id,
                event_type,
                title,
                message,
                action_url,
                source_type,
                source_id,
                batch_key,
                deduplication_key,
                created_at
            ) VALUES (
                :recipientUserId,
                :createdByUserId,
                :eventType,
                :title,
                :message,
                :actionUrl,
                :sourceType,
                :sourceId,
                :batchKey,
                :deduplicationKey,
                CURRENT_TIMESTAMP
            )
            ON DUPLICATE KEY UPDATE
                id = id
            """, nativeQuery = true)
    int insertIfAbsent(
            @Param("recipientUserId") Long recipientUserId,
            @Param("createdByUserId") Long createdByUserId,
            @Param("eventType") String eventType,
            @Param("title") String title,
            @Param("message") String message,
            @Param("actionUrl") String actionUrl,
            @Param("sourceType") String sourceType,
            @Param("sourceId") Long sourceId,
            @Param("batchKey") String batchKey,
            @Param("deduplicationKey") String deduplicationKey);
}
