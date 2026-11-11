package com.library.payload.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class BookReviewDTO {

    private Long id;

    @NotNull(message = "ID người dùng là bắt buộc")
    private Long userId;

    private String userName;

    @NotNull(message = "ID sách là bắt buộc")
    private Long bookId;

    private String bookTitle;

    @NotNull(message = "Bắt buộc phải đánh giá")
    @Min(value = 1, message = "Xếp hạng phải ít nhất là 1.")
    @Max(value = 5, message = "Điểm đánh giá không được vượt quá 5.")
    private Integer rating;

    @Size(max = 2000, message = "Bài đánh giá không được vượt quá 2000 ký tự")
    private String reviewText;

    @Size(max = 200, message = "Tiêu đề đánh giá không được vượt quá 200 ký tự")
    private String title;

    private Boolean isActive;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
}
