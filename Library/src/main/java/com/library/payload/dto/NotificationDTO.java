package com.library.payload.dto;

import com.library.domain.NotificationEventType;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDTO {
    private Long id;
    private NotificationEventType eventType;
    private String title;
    private String message;
    private String actionUrl;
    private String sourceType;
    private Long sourceId;
    private LocalDateTime readAt;
    private LocalDateTime createdAt;
}
