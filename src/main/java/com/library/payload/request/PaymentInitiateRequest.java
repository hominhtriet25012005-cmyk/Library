package com.library.payload.request;

import com.library.domain.PaymentGateway;
import com.library.domain.PaymentType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PaymentInitiateRequest {

    @NotNull(message = "ID người dùng là bắt buộc.")
    private Long userId;

    private Long bookLoanId; // Required only for FINE payments

    @NotNull(message = "Thanh toán là bắt buộc.")
    private PaymentType paymentType;

    @NotNull(message = "Cổng thanh toán là bắt buộc.")
    private PaymentGateway gateway; // PAYOS is the only supported payment gateway.

    @NotNull(message = "Bắt buộc phải nhập số tiền.")
    @Positive(message = "Số tiền phải là số dương.")
    private Long amount;

    @Size(max = 500, message = "Mô tả không được vượt quá 500 ký tự.")
    private String description;

    private Long fineId;
    private Long subscriptionId;

    // Return URLs for payment gateway redirects
    @Size(max = 500, message = "URL khi thành công không được vượt quá 500 ký tự.")
    private String successUrl;

    @Size(max = 500, message = "URL hủy không được vượt quá 500 ký tự.")
    private String cancelUrl;
}
