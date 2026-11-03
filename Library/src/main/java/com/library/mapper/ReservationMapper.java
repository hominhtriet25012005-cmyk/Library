package com.library.mapper;

import com.library.model.Reservation;
import com.library.payload.dto.ReservationDTO;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDateTime;

@Component
public class ReservationMapper {

    public ReservationDTO toDTO(Reservation reservation) {
        if (reservation == null) {
            return null;
        }

        ReservationDTO dto = new ReservationDTO();
        dto.setId(reservation.getId());

        // Thông tin người dùng
        if (reservation.getUser() != null) {
            dto.setUserId(reservation.getUser().getId());
            dto.setUserName(reservation.getUser().getFullName());
            dto.setUserEmail(reservation.getUser().getEmail());
        }

        // Thông tin sách
        if (reservation.getBook() != null) {
            dto.setBookId(reservation.getBook().getId());
            dto.setBookTitle(reservation.getBook().getTitle());
            dto.setBookIsbn(reservation.getBook().getIsbn());
            dto.setBookAuthor(reservation.getBook().getAuthor());
            dto.setIsBookAvailable(reservation.getBook().getAvailableCopies() > 0);
        }

        // Thông tin đặt chỗ
        dto.setStatus(reservation.getStatus());
        dto.setReservedAt(reservation.getReservedAt());
        dto.setAvailableAt(reservation.getAvailableAt());
        dto.setAvailableUntil(reservation.getAvailableUntil());
        dto.setFulfilledAt(reservation.getFulfilledAt());
        dto.setCancelledAt(reservation.getCancelledAt());
        dto.setQueuePosition(reservation.getQueuePosition());
        dto.setNotificationSent(reservation.getNotificationSent());
        dto.setNotes(reservation.getNotes());
        dto.setCreatedAt(reservation.getCreatedAt());
        dto.setUpdatedAt(reservation.getUpdatedAt());

        // Các trường được tính toán
        dto.setExpired(reservation.hasExpired());
        dto.setCanBeCancelled(reservation.canBeCancelled());

        // Tính số giờ còn lại cho đến khi hết hạn
        if (reservation.getAvailableUntil() != null) {
            LocalDateTime now = LocalDateTime.now();

            if (now.isBefore(reservation.getAvailableUntil())) {
                long hours = Duration.between(
                        now,
                        reservation.getAvailableUntil()
                ).toHours();

                dto.setHoursUntilExpiry(hours);
            } else {
                dto.setHoursUntilExpiry(0L);
            }
        }

        return dto;
    }
}
