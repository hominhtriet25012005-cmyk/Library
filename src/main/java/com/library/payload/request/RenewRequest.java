package com.library.payload.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class RenewRequest {

    @NotNull(message = "Mã số mượn sách là bắt buộc.")
    private Long bookLoanId;

    @Min(value = 1, message = "Số ngày gia hạn phải ít nhất là 1.")
    @NotNull
    private Integer extensionDays = 14; // Mặc định: gia hạn thêm 14 ngày

    @jakarta.validation.constraints.Size(max = 500)
    private String notes;
}
