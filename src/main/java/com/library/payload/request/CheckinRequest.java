package com.library.payload.request;

import com.library.domain.BookLoanStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CheckinRequest {

    @NotNull(message = "Mã số mượn sách là bắt buộc.")
    private Long bookLoanId;

    private BookLoanStatus condition = BookLoanStatus.RETURNED; // RETURNED, LOST, DAMAGED

    private String notes;
}
