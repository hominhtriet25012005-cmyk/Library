package com.library.payload.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CreateReviewRequest {

    @NotNull(message = "Book ID is mandatory")
    private Long bookId;

    @NotNull(message = "Rating is mandatory")
    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 5, message = "Rating must not exceed 5")
    private Integer rating;

    @Size(max = 2000, message = "Review must not exceed 2000 characters")
    private String reviewText;

    @Size(max = 200, message = "Review title must not exceed 200 characters")
    private String title;
}
