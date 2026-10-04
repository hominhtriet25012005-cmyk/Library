package com.library.modal;

import com.library.domain.FineStatus;
import com.library.domain.FineType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import java.sql.Types;

import java.time.LocalDateTime;

@Entity
@Table(name = "fines")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Fine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(optional = false)
    @JoinColumn(name = "book_loan_id", nullable = false)
    private BookLoan bookLoan;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(Types.VARCHAR)
    @Column(nullable = false, length = 30)
    private FineType type;

    @Column(nullable = false)
    private Long amount;

    @Column(name = "amount_paid", nullable = false)
    @Builder.Default
    private Long amountPaid = 0L;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(Types.VARCHAR)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private FineStatus status = FineStatus.PENDING;

    @Column(length = 500)
    private String reason;

    @Column(length = 1000)
    private String notes;

    @ManyToOne
    @JoinColumn(name = "waived_by")
    private User waivedBy;

    @Column(name = "waived_at")
    private LocalDateTime waivedAt;

    @Column(name = "waiver_reason", length = 500)
    private String waiverReason;

    // Payment tracking
    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "processed_by")
    private User processedBy;

    @Column(name = "transaction_id", length = 100)
    private String transactionId;

    @Column(name = "created_at", nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public void applyPayment(Long paymentAmount) {
        if (paymentAmount == null || paymentAmount <= 0) {
            throw new IllegalArgumentException("Payment amount must be positive");
        }

        if ((status != FineStatus.PENDING && status != FineStatus.PARTIALLY_PAID)
                || amount == null || amountPaid == null || amountPaid < 0 || amountPaid > amount
                || paymentAmount > amount - amountPaid) {
            throw new IllegalArgumentException("Fine is not payable or payment exceeds outstanding balance");
        }
        amountPaid += paymentAmount;
        status = amountPaid.equals(amount) ? FineStatus.PAID : FineStatus.PARTIALLY_PAID;
        if (status == FineStatus.PAID) paidAt = LocalDateTime.now(java.time.ZoneId.of("Asia/Ho_Chi_Minh"));
    }

    public void waive(User admin, String reason) {
        this.status = FineStatus.WAIVED;
        this.waivedBy = admin;
        this.waivedAt = LocalDateTime.now();
        this.waiverReason = reason;
    }
}
