package com.library.payload.request;

import com.library.domain.BookLoanStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class CheckinRequest {

    @NotNull(message = "Mã số mượn sách là bắt buộc.")
    private Long bookLoanId;

    private BookLoanStatus condition = BookLoanStatus.RETURNED; // RETURNED, LOST, DAMAGED

    @jakarta.validation.constraints.Size(max = 500)
    private String notes;
}
