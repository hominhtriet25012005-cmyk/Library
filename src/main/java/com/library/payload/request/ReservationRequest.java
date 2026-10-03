package com.library.payload.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;


@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ReservationRequest {

    @NotNull(message = "Book ID is mandatory")
    private Long bookId;

    private String notes;

}
