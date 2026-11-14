package com.library.service.impl;

import com.library.domain.NotificationEventType;
import com.library.domain.UserRole;
import com.library.repository.NotificationRepository;
import com.library.repository.UserRepository;
import com.library.service.impl.EmailOutboxEnqueueService;
import com.library.service.NotificationPublisher;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationPublisherImpl implements NotificationPublisher {

    private static final int MAX_TITLE_LENGTH = 200;
    private static final int MAX_MESSAGE_LENGTH = 2000;
    private static final int MAX_ACTION_URL_LENGTH = 500;
    private static final int MAX_SOURCE_TYPE_LENGTH = 50;
    private static final int MAX_KEY_LENGTH = 191;

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final EmailOutboxEnqueueService emailOutboxEnqueueService;

    @Override
    @Transactional
    public void publish(
            Long recipientUserId,
            Long createdByUserId,
            NotificationEventType eventType,
            String title,
            String message,
            String actionUrl,
            String sourceType,
            Long sourceId,
            String occurrenceKey) {
        validateBusinessNotification(
                recipientUserId, eventType, title, message, actionUrl, sourceType, sourceId);
        String deduplicationKey = businessDeduplicationKey(
                eventType, sourceType, sourceId, recipientUserId, occurrenceKey);
        int inserted = notificationRepository.insertIfAbsent(
                recipientUserId,
                createdByUserId,
                eventType.name(),
                title.trim(),
                message.trim(),
                normalizeActionUrl(actionUrl),
                sourceType,
                sourceId,
                null,
                deduplicationKey);
        if (inserted > 0) {
            notificationRepository.findByDeduplicationKey(deduplicationKey)
                    .ifPresent(notification -> emailOutboxEnqueueService.enqueueNotification(notification, false));
        }
    }

    @Override
    @Transactional
    public void publishToRole(
            UserRole role,
            Long createdByUserId,
            NotificationEventType eventType,
            String title,
            String message,
            String actionUrl,
            String sourceType,
            Long sourceId,
            String occurrenceKey) {
        if (role == null) {
            throw new IllegalArgumentException("Vai trò người nhận thông báo là bắt buộc.");
        }
        for (Long recipientId : userRepository.findIdsByRole(role)) {
            publish(recipientId, createdByUserId, eventType, title, message,
                    actionUrl, sourceType, sourceId, occurrenceKey);
        }
    }

    @Override
    @Transactional
    public int publishGeneralAnnouncement(
            Long adminUserId,
            String requestKey,
            String title,
            String message,
            String actionUrl,
            boolean sendEmail) {
        if (adminUserId == null) {
            throw new IllegalArgumentException("ADMIN tạo thông báo là bắt buộc.");
        }
        String normalizedRequestKey = requireText(requestKey, 80, "Khóa yêu cầu");
        if (!normalizedRequestKey.matches("[A-Za-z0-9_-]{8,80}")) {
            throw new IllegalArgumentException(
                    "Khóa yêu cầu chỉ được chứa chữ, số, dấu gạch ngang hoặc gạch dưới.");
        }
        String normalizedTitle = requireText(title, MAX_TITLE_LENGTH, "Tiêu đề");
        String normalizedMessage = requireText(message, MAX_MESSAGE_LENGTH, "Nội dung");
        String normalizedActionUrl = normalizeActionUrl(actionUrl);
        List<Long> recipientIds = userRepository.findIdsByRole(UserRole.ROLE_USER);
        String batchKey = "GA:" + normalizedRequestKey;
        for (Long recipientId : recipientIds) {
            String deduplicationKey = limitKey(batchKey + ":U:" + recipientId);
            int inserted = notificationRepository.insertIfAbsent(
                    recipientId,
                    adminUserId,
                    NotificationEventType.GENERAL_ANNOUNCEMENT.name(),
                    normalizedTitle,
                    normalizedMessage,
                    normalizedActionUrl,
                    null,
                    null,
                    batchKey,
                    deduplicationKey);
            if (inserted > 0 && sendEmail) {
                notificationRepository.findByDeduplicationKey(deduplicationKey)
                        .ifPresent(notification -> emailOutboxEnqueueService.enqueueNotification(notification, true));
            }
        }
        return Math.toIntExact(notificationRepository.countByBatchKey(batchKey));
    }

    private void validateBusinessNotification(
            Long recipientUserId,
            NotificationEventType eventType,
            String title,
            String message,
            String actionUrl,
            String sourceType,
            Long sourceId) {
        if (recipientUserId == null || eventType == null) {
            throw new IllegalArgumentException("Người nhận và loại thông báo là bắt buộc.");
        }
        requireText(title, MAX_TITLE_LENGTH, "Tiêu đề");
        requireText(message, MAX_MESSAGE_LENGTH, "Nội dung");
        normalizeActionUrl(actionUrl);
        if (sourceType == null || sourceType.isBlank() || sourceId == null) {
            throw new IllegalArgumentException("Nguồn thông báo nghiệp vụ là bắt buộc.");
        }
        if (sourceType.length() > MAX_SOURCE_TYPE_LENGTH) {
            throw new IllegalArgumentException("Loại nguồn thông báo quá dài.");
        }
    }

    private String businessDeduplicationKey(
            NotificationEventType eventType,
            String sourceType,
            Long sourceId,
            Long recipientUserId,
            String occurrenceKey) {
        StringBuilder key = new StringBuilder()
                .append(eventType.name())
                .append(':').append(sourceType)
                .append(':').append(sourceId)
                .append(":U:").append(recipientUserId);
        if (occurrenceKey != null && !occurrenceKey.isBlank()) {
            key.append(':').append(occurrenceKey.trim());
        }
        return limitKey(key.toString());
    }

    private String requireText(String value, int maxLength, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(fieldName + " là bắt buộc.");
        }
        String normalized = value.trim();
        if (normalized.length() > maxLength) {
            throw new IllegalArgumentException(fieldName + " vượt quá " + maxLength + " ký tự.");
        }
        return normalized;
    }

    private String normalizeActionUrl(String actionUrl) {
        if (actionUrl == null || actionUrl.isBlank()) {
            return null;
        }
        String normalized = actionUrl.trim();
        if (normalized.length() > MAX_ACTION_URL_LENGTH) {
            throw new IllegalArgumentException("Đường dẫn thao tác vượt quá 500 ký tự.");
        }
        if (!normalized.startsWith("/") || normalized.startsWith("//")
                || normalized.contains("\r") || normalized.contains("\n")) {
            throw new IllegalArgumentException("Đường dẫn thao tác phải là đường dẫn nội bộ hợp lệ.");
        }
        return normalized;
    }

    private String limitKey(String key) {
        if (key.length() > MAX_KEY_LENGTH) {
            throw new IllegalArgumentException("Khóa chống trùng thông báo vượt quá 191 ký tự.");
        }
        return key;
    }
}
