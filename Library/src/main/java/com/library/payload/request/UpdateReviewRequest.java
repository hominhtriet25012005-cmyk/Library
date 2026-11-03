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
public class UpdateReviewRequest {

    @NotNull(message = "Bắt buộc phải đánh giá")
    @Min(value = 1, message = "Xếp hạng phải ít nhất là 1.")
    @Max(value = 5, message = "Điểm đánh giá không được vượt quá 5.")
    private Integer rating;

    @Size(max = 2000, message = "Bài đánh giá không được vượt quá 2000 ký tự")
    private String reviewText;

    @Size(max = 200, message = "Tiêu đề đánh giá không được vượt quá 200 ký tự")
    private String title;
}
