package com.library.payload.request;

import com.library.domain.ReservationStatus;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ReservationSearchRequest {

    private Long userId;

    // Bộ lọc sách
    private Long bookId;

    // Bộ lọc trạng thái
    private ReservationStatus status;

    // Chỉ các mục đang hoạt động (ĐANG CHỜ hoặc CÓ SẴN)
    private Boolean activeOnly;

    // Phân trang
    private int page = 0;
    private int size = 20;

    // Sắp xếp
    private String sortBy = "reservedAt"; // reservedAt, availableAt, queuePosition, status
    private String sortDirection = "DESC"; // ASC or DESC
}
