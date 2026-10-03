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

    @NotNull(message = "Fine ID is mandatory")
    private Long fineId;

    @NotBlank(message = "Waiver reason is mandatory")
    private String reason;
}
