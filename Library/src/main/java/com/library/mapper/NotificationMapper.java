package com.library.mapper;

import com.library.model.Notification;
import com.library.model.UserNotificationPreference;
import com.library.payload.dto.NotificationDTO;
import com.library.payload.dto.NotificationPreferencesDTO;
import org.springframework.stereotype.Component;

@Component
public class NotificationMapper {

    public NotificationDTO toDTO(Notification notification) {
        return NotificationDTO.builder()
                .id(notification.getId())
                .eventType(notification.getEventType())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .actionUrl(notification.getActionUrl())
                .sourceType(notification.getSourceType())
                .sourceId(notification.getSourceId())
                .readAt(notification.getReadAt())
                .createdAt(notification.getCreatedAt())
                .build();
    }

    public NotificationPreferencesDTO toDTO(UserNotificationPreference preference) {
        return NotificationPreferencesDTO.builder()
                .emailDueReminder(preference.getEmailDueReminder())
                .emailOverdueAlert(preference.getEmailOverdueAlert())
                .emailReservationUpdates(preference.getEmailReservationUpdates())
                .emailMembershipUpdates(preference.getEmailMembershipUpdates())
                .emailGeneralAnnouncements(preference.getEmailGeneralAnnouncements())
                .emailAdminReturnRequests(preference.getEmailAdminReturnRequests())
                .build();
    }

    public NotificationPreferencesDTO defaultPreferences() {
        return NotificationPreferencesDTO.builder()
                .emailDueReminder(true)
                .emailOverdueAlert(true)
                .emailReservationUpdates(true)
                .emailMembershipUpdates(true)
                .emailGeneralAnnouncements(true)
                .emailAdminReturnRequests(true)
                .build();
    }
}
