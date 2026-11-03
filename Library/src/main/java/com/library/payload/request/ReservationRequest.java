package com.library.payload.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;


@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ReservationRequest {

    @NotNull(message = "ID sách là bắt buộc")
    private Long bookId;

    private String notes;

}
