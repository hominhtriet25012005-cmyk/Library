package com.library.payload.dto;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class BookDTO {

    private Long id;

    @Size(max = 20, message = "ISBN không được vượt quá 20 ký tự.")
    private String isbn;

    @NotBlank(message = "Bắt buộc phải có tiêu đề.")
    @Size(min = 1, max = 255, message = "Tiêu đề phải có độ dài từ 1 đến 255 ký tự.")
    private String title;

    @NotBlank(message = "Bắt buộc phải có tên tác giả.")
    @Size(min = 1, max = 255, message = "Tên tác giả phải có độ dài từ 1 đến 255 ký tự.")
    private String author;

    @NotNull(message = "Bắt buộc phải chọn thể loại.")
    private Long genreId;

    private String genreName;

    private String genreCode;

    @Size(max = 100, message = "Tên nhà xuất bản không được vượt quá 100 ký tự.")
    private String publisher;

    private LocalDate publicationDate;

    @Min(value = 1, message = "Năm xuất bản phải từ 1 đến 9999.")
    @Max(value = 9999, message = "Năm xuất bản phải từ 1 đến 9999.")
    private Integer publicationYear;

    @Size(max = 20, message = "Ngôn ngữ không được vượt quá 20 ký tự.")
    private String language;

    @Min(value = 1, message = "Mỗi trang phải có ít nhất 1 trang.")
    @Max(value = 50000, message = "Số trang không được vượt quá 50.000.")
    private Integer pages;

    @Size(max = 2000, message = "Phần mô tả không được vượt quá 2000 ký tự.")
    private String description;

    @Min(value = 0, message = "Tổng số bản sao không được là số âm.")
    @NotNull(message = "Bắt buộc phải có tổng số bản sao.")
    private Integer totalCopies;

    @Min(value = 0, message = "Số lượng bản sao hiện có không được là số âm.")
    @NotNull(message = "Bắt buộc phải có các bản sao.")
    private Integer availableCopies;

    @DecimalMin(value = "0.0", inclusive = true, message = "Giá không thể là số âm.")
    @Digits(integer = 8, fraction = 2, message = "Giá phải có tối đa 8 chữ số phần nguyên và 2 chữ số thập phân.")
    private BigDecimal price;

    @Size(max = 500, message = "URL hình ảnh không được vượt quá 500 ký tự.")
    private String coverImageUrl;

    private Boolean alreadyHaveLoan;
    private Boolean alreadyHaveReservation;

    private Boolean active;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
