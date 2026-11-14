package com.library.controller;

import com.library.domain.UserRole;
import com.library.payload.request.CreateGeneralNotificationRequest;
import com.library.payload.response.GeneralNotificationResponse;
import com.library.repository.UserRepository;
import com.library.service.NotificationPublisher;
import com.library.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/notifications")
public class AdminNotificationController {

    private final NotificationPublisher notificationPublisher;
    private final UserRepository userRepository;
    private final UserService userService;

    @PostMapping("/announcements")
    public ResponseEntity<GeneralNotificationResponse> createAnnouncement(
            @Valid @RequestBody CreateGeneralNotificationRequest request) {
        Long adminUserId = userService.getCurrentUser().getId();
        int recipientCount = userRepository.findIdsByRole(UserRole.ROLE_USER).size();
        int storedCount = request.isSendEmail()
                ? notificationPublisher.publishGeneralAnnouncement(
                        adminUserId,
                        request.getRequestKey(),
                        request.getTitle(),
                        request.getMessage(),
                        request.getActionUrl(),
                        true)
                : notificationPublisher.publishGeneralAnnouncement(
                        adminUserId,
                        request.getRequestKey(),
                        request.getTitle(),
                        request.getMessage(),
                        request.getActionUrl());
        String deliveryMessage = request.isSendEmail()
                ? " Email sẽ được xếp hàng cho tài khoản đã xác minh và đã bật nhận thông báo chung."
                : " Email không được chọn gửi.";
        return ResponseEntity.ok(new GeneralNotificationResponse(
                request.getRequestKey(),
                recipientCount,
                storedCount,
                "Đã bảo đảm thông báo chung được lưu cho " + storedCount
                        + " tài khoản người dùng; gửi lại cùng requestKey không tạo trùng."
                        + deliveryMessage));
    }
}
