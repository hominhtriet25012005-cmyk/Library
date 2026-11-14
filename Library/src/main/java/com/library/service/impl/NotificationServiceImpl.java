package com.library.service.impl;

import com.library.exception.ResourceNotFoundException;
import com.library.mapper.NotificationMapper;
import com.library.model.Notification;
import com.library.model.User;
import com.library.model.UserNotificationPreference;
import com.library.payload.dto.NotificationDTO;
import com.library.payload.dto.NotificationPreferencesDTO;
import com.library.payload.request.UpdateNotificationPreferencesRequest;
import com.library.payload.response.PageResponse;
import com.library.repository.NotificationRepository;
import com.library.repository.UserNotificationPreferenceRepository;
import com.library.service.NotificationService;
import com.library.service.UserService;
import com.library.support.PaginationRules;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserNotificationPreferenceRepository preferenceRepository;
    private final NotificationMapper notificationMapper;
    private final UserService userService;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<NotificationDTO> getMyNotifications(
            boolean unreadOnly,
            int page,
            int size) {
        PaginationRules.validatePageAndSize(page, size);
        Long userId = userService.getCurrentUser().getId();
        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by(Sort.Direction.DESC, "createdAt", "id"));
        Page<Notification> result = unreadOnly
                ? notificationRepository.findUnreadForUser(userId, pageable)
                : notificationRepository.findForUser(userId, pageable);
        List<NotificationDTO> content = result.getContent().stream()
                .map(notificationMapper::toDTO)
                .toList();

        return new PageResponse<>(
                content,
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages(),
                result.isLast(),
                result.isFirst(),
                result.isEmpty());
    }

    @Override
    @Transactional(readOnly = true)
    public long getMyUnreadCount() {
        Long userId = userService.getCurrentUser().getId();
        return notificationRepository.countUnreadForUser(userId);
    }

    @Override
    @Transactional
    public NotificationDTO markAsRead(Long notificationId) {
        Long userId = userService.getCurrentUser().getId();
        Notification notification = notificationRepository
                .findOwnedNotification(notificationId, userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "NOTIFICATION_NOT_FOUND",
                        "Không tìm thấy thông báo."));
        if (notification.getReadAt() == null) {
            notification.setReadAt(LocalDateTime.now());
        }
        return notificationMapper.toDTO(notification);
    }

    @Override
    @Transactional
    public int markAllAsRead() {
        Long userId = userService.getCurrentUser().getId();
        return notificationRepository.markAllReadForUser(userId, LocalDateTime.now());
    }

    @Override
    @Transactional(readOnly = true)
    public NotificationPreferencesDTO getMyPreferences() {
        Long userId = userService.getCurrentUser().getId();
        return preferenceRepository.findById(userId)
                .map(notificationMapper::toDTO)
                .orElseGet(notificationMapper::defaultPreferences);
    }

    @Override
    @Transactional
    public NotificationPreferencesDTO updateMyPreferences(
            UpdateNotificationPreferencesRequest request) {
        User user = userService.getCurrentUser();
        UserNotificationPreference preference = preferenceRepository.findById(user.getId())
                .orElseGet(() -> UserNotificationPreference.builder().user(user).build());
        preference.setEmailDueReminder(request.getEmailDueReminder());
        preference.setEmailOverdueAlert(request.getEmailOverdueAlert());
        preference.setEmailReservationUpdates(request.getEmailReservationUpdates());
        preference.setEmailMembershipUpdates(request.getEmailMembershipUpdates());
        preference.setEmailGeneralAnnouncements(request.getEmailGeneralAnnouncements());
        preference.setEmailAdminReturnRequests(request.getEmailAdminReturnRequests());

        return notificationMapper.toDTO(preferenceRepository.save(preference));
    }
}
