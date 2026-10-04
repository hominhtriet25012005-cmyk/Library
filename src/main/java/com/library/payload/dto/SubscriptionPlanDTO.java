package com.library.payload.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SubscriptionPlanDTO {

    private Long id;

    @NotBlank(message = "Mã gói thành viên là bắt buộc")
    @Size(max = 100, message = "Mã gói không được vượt quá 100 ký tự")
    private String planCode;

    @NotBlank(message = "Tên gói thành viên là bắt buộc")
    @Size(max = 100, message = "Tên gói không được vượt quá 100 ký tự")
    private String name;

    @Size(max = 500, message = "Mô tả không được vượt quá 500 ký tự")
    private String description;

    @NotNull(message = "Thời hạn gói là bắt buộc")
    @Positive(message = "Thời hạn gói phải lớn hơn 0")
    private Integer durationDays;

    @NotNull(message = "Giá gói là bắt buộc")
    @Positive(message = "Giá gói phải lớn hơn 0")
    @jakarta.validation.constraints.Digits(integer = 8, fraction = 2)
    private java.math.BigDecimal price;

    @Size(min = 3, max = 3, message = "Mã tiền tệ phải có đúng 3 ký tự")
    private String currency;

    @NotNull(message = "Số sách tối đa là bắt buộc")
    @Positive(message = "Số sách tối đa phải lớn hơn 0")
    private Integer maxBooksAllowed;

    @NotNull(message = "Số ngày mượn tối đa là bắt buộc")
    @Positive(message = "Số ngày mượn tối đa phải lớn hơn 0")
    private Integer maxDaysPerBook;

    private Integer displayOrder;

    private Boolean isActive;

    private Boolean isFeatured;

    @Size(max = 255, message = "Nhãn gói không được vượt quá 255 ký tự")
    private String badgeText;

    @Size(max = 255, message = "Ghi chú quản trị không được vượt quá 255 ký tự")
    private String adminNotes;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private String createdBy;

    private String updatedBy;
}
