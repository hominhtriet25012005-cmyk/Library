package com.library.service;

import com.library.domain.NotificationEventType;
import com.library.domain.UserRole;

public interface NotificationPublisher {

    void publish(
            Long recipientUserId,
            Long createdByUserId,
            NotificationEventType eventType,
            String title,
            String message,
            String actionUrl,
            String sourceType,
            Long sourceId,
            String occurrenceKey);

    void publishToRole(
            UserRole role,
            Long createdByUserId,
            NotificationEventType eventType,
            String title,
            String message,
            String actionUrl,
            String sourceType,
            Long sourceId,
            String occurrenceKey);

    default int publishGeneralAnnouncement(
            Long adminUserId,
            String requestKey,
            String title,
            String message,
            String actionUrl) {
        return publishGeneralAnnouncement(adminUserId, requestKey, title, message, actionUrl, false);
    }

    int publishGeneralAnnouncement(
            Long adminUserId,
            String requestKey,
            String title,
            String message,
            String actionUrl,
            boolean sendEmail);
}
