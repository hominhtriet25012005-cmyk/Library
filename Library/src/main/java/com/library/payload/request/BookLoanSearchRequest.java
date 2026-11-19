package com.library.payload.request;

import com.library.domain.BookLoanStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
public class BookLoanSearchRequest {

    @jakarta.validation.constraints.Positive(message = "ID người dùng phải là số dương.")
    private Long userId;

    @jakarta.validation.constraints.Positive(message = "ID sách phải là số dương.")
    private Long bookId;

    private BookLoanStatus status;

    private Boolean overdueOnly;

    private Boolean unpaidFinesOnly;

    private LocalDate startDate;

    private LocalDate endDate;

    private Integer page = 0;

    private Integer size = 20;

    private String sortBy = "createdAt";

    private String sortDirection = "DESC";

    @com.fasterxml.jackson.annotation.JsonIgnore
    @jakarta.validation.constraints.AssertTrue(message = "Ngày bắt đầu không được sau ngày kết thúc.")
    public boolean isDateRangeValid() {
        return startDate == null || endDate == null || !startDate.isAfter(endDate);
    }
}
