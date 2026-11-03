package com.library.payload.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class WaiveFineRequest {

    @NotNull(message = "Bắt buộc phải có ID phạt")
    private Long fineId;

    @NotBlank(message = "Lý do miễn trừ là bắt buộc")
    private String reason;
}
