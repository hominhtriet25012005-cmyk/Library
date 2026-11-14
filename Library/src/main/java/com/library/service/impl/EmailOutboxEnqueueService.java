package com.library.service.impl;

import com.library.domain.NotificationEventType;
import com.library.domain.UserRole;
import com.library.model.EmailVerificationToken;
import com.library.model.Notification;
import com.library.model.User;
import com.library.model.UserNotificationPreference;
import com.library.repository.EmailOutboxRepository;
import com.library.repository.FineRepository;
import com.library.repository.PaymentRepository;
import com.library.repository.UserNotificationPreferenceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;

@Service
@RequiredArgsConstructor
public class EmailOutboxEnqueueService {

    private final EmailOutboxRepository outboxRepository;
    private final UserNotificationPreferenceRepository preferenceRepository;
    private final PaymentRepository paymentRepository;
    private final FineRepository fineRepository;
    private final EmailTemplateRenderer templateRenderer;
    private final VerificationTokenCipher verificationTokenCipher;

    @Transactional
    public boolean enqueueNotification(Notification notification, boolean sendGeneralAnnouncementEmail) {
        User recipient = notification.getRecipient();
        if (recipient == null || !Boolean.TRUE.equals(recipient.getVerified())) return false;

        UserNotificationPreference preferences = preferenceRepository.findById(recipient.getId())
                .orElseGet(() -> UserNotificationPreference.builder().user(recipient).build());
        NotificationEventType type = notification.getEventType();
        if (!isEnabled(type, recipient, preferences, sendGeneralAnnouncementEmail)) return false;

        var payment = "PAYMENT".equals(notification.getSourceType())
                ? paymentRepository.findById(notification.getSourceId()).orElse(null) : null;
        var fine = "FINE".equals(notification.getSourceType())
                ? fineRepository.findById(notification.getSourceId()).orElse(null) : null;
        String subject = "Thư viện số: " + notification.getTitle();
        String body = templateRenderer.notificationBody(notification, payment, fine);
        outboxRepository.insertIfAbsent(
                recipient.getId(),
                notification.getId(),
                type.name(),
                recipient.getEmail(),
                subject,
                body,
                emailDeduplicationKey(notification.getDeduplicationKey()));
        return true;
    }

    @Transactional
    public void enqueueVerificationEmail(EmailVerificationToken token, String rawToken) {
        User recipient = token.getUser();
        String encryptedToken = verificationTokenCipher.encrypt(rawToken);
        String key = "EMAIL:VERIFY:" + sha256(token.getTokenHash());
        outboxRepository.insertIfAbsent(
                recipient.getId(),
                null,
                NotificationEventType.EMAIL_VERIFICATION.name(),
                recipient.getEmail(),
                "Thư viện số: Xác minh địa chỉ email",
                encryptedToken,
                key);
    }

    @Transactional
    public void cancelVerificationEmail(String tokenHash) {
        outboxRepository.cancelPendingByDeduplicationKey("EMAIL:VERIFY:" + sha256(tokenHash));
    }

    private boolean isEnabled(
            NotificationEventType type,
            User user,
            UserNotificationPreference preference,
            boolean sendGeneralAnnouncementEmail) {
        if (type == null) return false;
        return switch (type) {
            case RETURN_CHECKED_IN, FINE_CREATED, FINE_PARTIALLY_PAID, FINE_PAID,
                    PAYMENT_SUCCEEDED, PAYMENT_FAILED, MEMBERSHIP_ACTIVATED, MEMBERSHIP_RENEWED -> true;
            case LOAN_DUE_SOON, LOAN_DUE_TODAY -> Boolean.TRUE.equals(preference.getEmailDueReminder());
            case LOAN_OVERDUE -> Boolean.TRUE.equals(preference.getEmailOverdueAlert());
            case RETURN_REQUESTED -> user.getRole() == UserRole.ROLE_ADMIN
                    && Boolean.TRUE.equals(preference.getEmailAdminReturnRequests());
            case RESERVATION_CREATED, RESERVATION_AVAILABLE, RESERVATION_PICKUP_EXPIRING,
                    RESERVATION_FULFILLED, RESERVATION_CANCELLED, RESERVATION_EXPIRED ->
                    Boolean.TRUE.equals(preference.getEmailReservationUpdates());
            case MEMBERSHIP_EXPIRING, MEMBERSHIP_EXPIRED ->
                    Boolean.TRUE.equals(preference.getEmailMembershipUpdates());
            case GENERAL_ANNOUNCEMENT -> sendGeneralAnnouncementEmail
                    && Boolean.TRUE.equals(preference.getEmailGeneralAnnouncements());
            case EMAIL_VERIFICATION -> false;
        };
    }

    private String emailDeduplicationKey(String notificationKey) {
        return "EMAIL:" + sha256(notificationKey);
    }

    private String sha256(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("Không thể tạo khóa chống gửi email trùng.", exception);
        }
    }
}
