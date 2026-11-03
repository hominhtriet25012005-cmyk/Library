package com.library.payload.response;

import com.library.domain.PaymentGateway;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PaymentInitiateResponse {

    private Long paymentId;
    private Long orderCode;
    private String paymentLinkId;
    private String qrCode;
    private String currency;
    private com.library.domain.PaymentStatus status;

    private PaymentGateway gateway;

    private String transactionId;


    private Long amount;

    private String description;

    private String checkoutUrl;

    private String message;

    private Boolean success;
}
