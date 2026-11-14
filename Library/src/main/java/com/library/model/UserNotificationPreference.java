package com.library.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_notification_preferences")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserNotificationPreference {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @OneToOne(optional = false, fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "email_due_reminder", nullable = false)
    @Builder.Default
    private Boolean emailDueReminder = true;

    @Column(name = "email_overdue_alert", nullable = false)
    @Builder.Default
    private Boolean emailOverdueAlert = true;

    @Column(name = "email_reservation_updates", nullable = false)
    @Builder.Default
    private Boolean emailReservationUpdates = true;

    @Column(name = "email_membership_updates", nullable = false)
    @Builder.Default
    private Boolean emailMembershipUpdates = true;

    @Column(name = "email_general_announcements", nullable = false)
    @Builder.Default
    private Boolean emailGeneralAnnouncements = true;

    @Column(name = "email_admin_return_requests", nullable = false)
    @Builder.Default
    private Boolean emailAdminReturnRequests = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
