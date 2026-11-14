package com.library.controller;

import com.library.payload.dto.NotificationDTO;
import com.library.payload.dto.NotificationPreferencesDTO;
import com.library.payload.request.UpdateNotificationPreferencesRequest;
import com.library.payload.response.ApiResponse;
import com.library.payload.response.PageResponse;
import com.library.payload.response.UnreadNotificationCountResponse;
import com.library.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<PageResponse<NotificationDTO>> getMyNotifications(
            @RequestParam(defaultValue = "false") boolean unreadOnly,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(
                notificationService.getMyNotifications(unreadOnly, page, size));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<UnreadNotificationCountResponse> getMyUnreadCount() {
        return ResponseEntity.ok(new UnreadNotificationCountResponse(
                notificationService.getMyUnreadCount()));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<NotificationDTO> markAsRead(@PathVariable Long id) {
        return ResponseEntity.ok(notificationService.markAsRead(id));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<ApiResponse> markAllAsRead() {
        int updated = notificationService.markAllAsRead();
        return ResponseEntity.ok(new ApiResponse(
                "Đã đánh dấu " + updated + " thông báo là đã đọc.", true));
    }

    @GetMapping("/preferences")
    public ResponseEntity<NotificationPreferencesDTO> getMyPreferences() {
        return ResponseEntity.ok(notificationService.getMyPreferences());
    }

    @PutMapping("/preferences")
    public ResponseEntity<NotificationPreferencesDTO> updateMyPreferences(
            @Valid @RequestBody UpdateNotificationPreferencesRequest request) {
        return ResponseEntity.ok(notificationService.updateMyPreferences(request));
    }
}
