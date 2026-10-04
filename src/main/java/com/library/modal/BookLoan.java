package com.library.modal;

import com.library.domain.BookLoanStatus;
import com.library.domain.BookLoanType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import java.sql.Types;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "book_loans")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class BookLoan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JoinColumn(name = "user_id", nullable = false)
    @ManyToOne(optional = false)
    private User user;

    @JoinColumn(name = "book_id", nullable = false)
    @ManyToOne(optional = false)
    private Book book;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(Types.VARCHAR)
    @Column(nullable = false, length = 30)
    private BookLoanType type;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(Types.VARCHAR)
    @Column(nullable = false, length = 30)
    private BookLoanStatus status;

    @Column(name = "checkout_date", nullable = false)
    private LocalDate checkoutDate;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "return_date")
    private LocalDate returnDate;

    @Column(name = "renewal_count", nullable = false)
    @Builder.Default
    private Integer renewalCount = 0;

    @Column(name = "max_renewals", nullable = false)
    @Builder.Default
    private Integer maxRenewals = 2;

    // fine todo

    @Column(length = 500)
    private String notes;

    @Column(name = "is_overdue", nullable = false)
    @Builder.Default
    private Boolean isOverdue = false;

    @Column(name = "overdue_days", nullable = false)
    @Builder.Default
    private Integer overdueDays = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public boolean isActive() {
        return status == BookLoanStatus.CHECKED_OUT
                || status == BookLoanStatus.OVERDUE;
    }

    public boolean canRenew() {
        return status == BookLoanStatus.CHECKED_OUT
                && !isOverdue
                && renewalCount < maxRenewals;
    }
}
