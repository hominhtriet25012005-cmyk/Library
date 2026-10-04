package com.library.modal;

import com.library.domain.ReservationStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.JdbcTypeCode;

import java.sql.Types;
import java.time.LocalDateTime;

@Entity
@Table(name = "reservations")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(optional = false)
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(Types.VARCHAR)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private ReservationStatus status = ReservationStatus.PENDING;

    @Column(name = "reserved_at", nullable = false)
    private LocalDateTime reservedAt;

    @Column(name = "available_at")
    private LocalDateTime availableAt;

    @Column(name = "available_until")
    private LocalDateTime availableUntil;

    @Column(name = "fulfilled_at")
    private LocalDateTime fulfilledAt;

    /**
     * Date and time when reservation was cancelled or expired
     */
    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    /**
     * Position in the reservation queue for this book
     */
    @Column(name = "queue_position")
    private Integer queuePosition;

    /**
     * Whether notification email has been sent when book became available
     */
    @Column(name = "notification_sent", nullable = false)
    @Builder.Default
    private Boolean notificationSent = false;

    /**
     * Additional notes or reason for cancellation
     */
    @Column(columnDefinition = "TEXT")
    private String notes;

    /**
     * Record creation timestamp
     */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false, columnDefinition = "TIMESTAMP")
    private LocalDateTime createdAt;

    /**
     * Record last update timestamp
     */
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false, columnDefinition = "TIMESTAMP")
    private LocalDateTime updatedAt;

    public boolean canBeCancelled() {
        return status == ReservationStatus.PENDING
                || status == ReservationStatus.AVAILABLE;
    }

    /**
     * Check if reservation has expired
     */
    public boolean hasExpired() {
        return status == ReservationStatus.AVAILABLE
                && availableUntil != null
                && LocalDateTime.now().isAfter(availableUntil);
    }
}
