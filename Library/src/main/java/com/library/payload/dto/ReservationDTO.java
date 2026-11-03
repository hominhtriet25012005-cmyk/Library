package com.library.payload.dto;

import com.library.domain.ReservationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ReservationDTO {

    private Long id;

    // Thông tin người dùng
    private Long userId;
    private String userName;
    private String userEmail;

    // Thông tin sách
    private Long bookId;
    private String bookTitle;
    private String bookIsbn;
    private String bookAuthor;
    private Boolean isBookAvailable;

    // Thông tin đặt chỗ
    private ReservationStatus status;
    private LocalDateTime reservedAt;
    private LocalDateTime availableAt;
    private LocalDateTime availableUntil;
    private LocalDateTime fulfilledAt;
    private LocalDateTime cancelledAt;
    private Integer queuePosition;
    private Boolean notificationSent;
    private String notes;

    // Dấu thời gian
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Các trường được tính toán
    private boolean isExpired;
    private boolean canBeCancelled;
    private Long hoursUntilExpiry; // Số giờ còn lại để nhận hàng
}
