package com.library.payload.dto;

import com.library.domain.PaymentGateway;
import com.library.domain.PaymentStatus;
import com.library.domain.PaymentType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class PaymentDTO {

    private Long id;

    @NotNull(message = "ID người dùng là bắt buộc.")
    private Long userId;

    private String userName;

    private String userEmail;

    private Long bookLoanId;
    private Long fineId;

    private Long subscriptionId;

    @NotNull(message = "Loại thanh toán là bắt buộc.")
    private PaymentType paymentType;

    private PaymentStatus status;

    @NotNull(message = "Cổng thanh toán là bắt buộc.")
    private PaymentGateway gateway;

    @NotNull(message = "Bắt buộc phải nhập số tiền.")
    @Positive(message = "Số tiền phải là số dương.")
    private Long amount;
    private String currency;

    private String transactionId;

    private String gatewayPaymentId;

    private String gatewayOrderId;

    private String gatewaySignature;

    private String description;

    private String failureReason;

    private Integer retryCount;

    private LocalDateTime initiatedAt;

    private LocalDateTime completedAt;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
