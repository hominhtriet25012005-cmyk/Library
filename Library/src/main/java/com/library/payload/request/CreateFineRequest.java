package com.library.payload.request;

import com.library.domain.FineType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CreateFineRequest {

    @NotNull(message = "Mã mượn sách là bắt buộc")
    private Long bookLoanId;

    @NotNull(message = "Loại tiền phạt là bắt buộc.")
    private FineType type;

    @NotNull(message = "Số tiền phạt là bắt buộc")
    @Positive(message = "Số tiền phạt phải là số dương")
    private Long amount;

    private String reason;

    private String notes;
}
