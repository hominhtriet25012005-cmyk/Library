package com.library.modal;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Entity
@Table(name = "subscriptions")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Subscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(optional = false)
    @JoinColumn(name = "plan_id", nullable = false)
    private SubscriptionPlan plan;

    @Column(name = "plan_name", length = 255)
    private String planName;

    @Column(name = "plan_code", length = 100)
    private String planCode;

    @Column(nullable = false)
    private Long price;

    @Column(nullable = false, length = 3)
    private String currency;

    @Column(name = "max_books_allowed", nullable = false)
    private Integer maxBooksAllowed;

    @Column(name = "max_days_per_book", nullable = false)
    private Integer maxDaysPerBook;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "auto_renew", nullable = false)
    @Builder.Default
    private Boolean autoRenew = false;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "cancellation_reason", columnDefinition = "TEXT")
    private String cancellationReason;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false, columnDefinition = "TIMESTAMP")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false, columnDefinition = "TIMESTAMP")
    private LocalDateTime updatedAt;

    public boolean isValid() {
        if (!isActive) {
            return false;
        }
        LocalDate today = LocalDate.now();
        return !today.isBefore(startDate) && !today.isAfter(endDate);
    }

    public boolean isExpired() {
        return LocalDate.now().isAfter(endDate);
    }

    public long getDaysRemaining() {
        if (isExpired()) {
            return 0;
        }
        return ChronoUnit.DAYS.between(LocalDate.now(), endDate);
    }

    public void calculateEndDate() {
        if (plan != null && startDate != null) {
            this.endDate = startDate.plusDays(plan.getDurationDays());
        }
    }

    public void initializeFromPlan() {
        if (plan != null) {
            this.planName = plan.getName();
            this.planCode = plan.getPlanCode();
            if (!"VND".equals(plan.getCurrency()) || plan.getPrice() == null) {
                throw new IllegalArgumentException("Membership requires a VND price");
            }
            try {
                this.price = plan.getPrice().longValueExact();
            } catch (ArithmeticException ex) {
                throw new IllegalArgumentException("Price must be whole VND within the supported range");
            }
            if (this.price <= 0) {
                throw new IllegalArgumentException("Price must be positive");
            }
            this.currency = "VND";
            this.maxBooksAllowed = plan.getMaxBooksAllowed();
            this.maxDaysPerBook = plan.getMaxDaysPerBook();
            if (startDate == null) {
                this.startDate = LocalDate.now();
            }
            calculateEndDate();
        }
    }
}
