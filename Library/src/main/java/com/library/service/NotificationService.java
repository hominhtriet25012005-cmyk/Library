package com.library.service;

import com.library.payload.dto.NotificationDTO;
import com.library.payload.dto.NotificationPreferencesDTO;
import com.library.payload.request.UpdateNotificationPreferencesRequest;
import com.library.payload.response.PageResponse;

public interface NotificationService {

    PageResponse<NotificationDTO> getMyNotifications(boolean unreadOnly, int page, int size);

    long getMyUnreadCount();

    NotificationDTO markAsRead(Long notificationId);

    int markAllAsRead();

    NotificationPreferencesDTO getMyPreferences();

    NotificationPreferencesDTO updateMyPreferences(UpdateNotificationPreferencesRequest request);
}
