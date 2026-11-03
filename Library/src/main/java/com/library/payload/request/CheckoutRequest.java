package com.library.payload.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class CheckoutRequest {

    @NotNull(message = "ID sách là bắt buộc.")
    private Long bookId;

    @Min(value = 1, message = "Số ngày trả phải ít nhất là 1")
    @NotNull
    private Integer checkoutDays = 14; // Mặc định: 14 ngày

    @jakarta.validation.constraints.Size(max = 500)
    private String notes;
}
