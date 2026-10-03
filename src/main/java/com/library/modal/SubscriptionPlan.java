package com.library.modal;

import jakarta.persistence.*;
import jakarta.validation.constraints.Positive;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SubscriptionPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String planCode;

    @Column(nullable = false, length = 100)
    private String name;


    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    private Integer durationDays;

    @Column(nullable = false)
    @Positive(message = "Giá gói phải lớn hơn 0")
    private Long price;

    @Column(nullable = false, length = 3)
    @Builder.Default
    private String currency="VND";

    @Column(nullable = false)
    @Positive(message = "Số sách tối đa phải lớn hơn 0")
    private Integer maxBooksAllowed;

    @Column(nullable = false)
    @Positive(message = "Số ngày mượn tối đa phải lớn hơn 0")
    private Integer maxDaysPerBook;

    @Column(nullable = false)
    @Builder.Default
    private Integer displayOrder=0;

    @Column(nullable = false)
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
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Column(length = 150)
    private String createdBy;

    @Column(length = 150)
    private String updatedBy;
}
