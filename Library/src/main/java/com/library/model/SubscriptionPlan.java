package com.library.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "subscription_plans")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SubscriptionPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String planCode;

    @Column(name = "title", nullable = false, unique = true, length = 150)
    private String name;


    @Column(length = 500)
    private String description;

    @Column(name = "duration_in_days", nullable = false)
    @NotNull(message = "Thời hạn gói là bắt buộc")
    @Positive(message = "Thời hạn gói phải lớn hơn 0")
    private Integer durationDays;

    @Column(nullable = false, precision = 10, scale = 2)
    @NotNull(message = "Giá gói là bắt buộc")
    @Positive(message = "Giá gói phải lớn hơn 0")
    private java.math.BigDecimal price;

    @Column(nullable = false, length = 3)
    @Builder.Default
    @NotNull(message = "Tiền tệ của gói là bắt buộc")
    @Pattern(regexp = "VND", message = "Tiền tệ của gói thành viên chỉ hỗ trợ VND")
    private String currency = "VND";

    @Column(nullable = false)
    @NotNull(message = "Số sách tối đa là bắt buộc")
    @Positive(message = "Số sách tối đa phải lớn hơn 0")
    private Integer maxBooksAllowed;

    @Column(nullable = false)
    @NotNull(message = "Số ngày mượn tối đa là bắt buộc")
    @Positive(message = "Số ngày mượn tối đa phải lớn hơn 0")
    private Integer maxDaysPerBook;

    @Column(nullable = false)
    @Builder.Default
    private Integer displayOrder=0;

    @Column(name = "active", nullable = false)
    @Builder.Default
    private Boolean isActive=true;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isFeatured=false;

    @Column(length = 255)
    private String badgeText;

    @Column(length = 255)
    private String adminNotes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(length = 150)
    private String createdBy;

    @Column(length = 150)
    private String updatedBy;
}
