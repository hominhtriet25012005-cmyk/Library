package com.library.mapper;

import com.library.modal.Payment;
import com.library.payload.dto.PaymentDTO;
import org.springframework.stereotype.Component;

@Component
public class PaymentMapper {

    public PaymentDTO toDTO(Payment payment) {

        if (payment == null) {
            return null;
        }
        PaymentDTO dto = new PaymentDTO();
        dto.setId(payment.getId());

        // Thông tin người thanh toán.
        if (payment.getUser() != null) {
            dto.setUserId(payment.getUser().getId());
            dto.setUserName(payment.getUser().getFullName());
            dto.setUserEmail(payment.getUser().getEmail());
        }

        if (payment.getBookLoan() != null) dto.setBookLoanId(payment.getBookLoan().getId());
        if (payment.getFine() != null) dto.setFineId(payment.getFine().getId());

        // Subscription information
        if (payment.getSubscription() != null) {
            dto.setSubscriptionId(payment.getSubscription().getId());
        }

        dto.setPaymentType(payment.getPaymentType());
        dto.setStatus(payment.getStatus());
        dto.setGateway(payment.getGateway());
        dto.setAmount(payment.getAmount());
        dto.setCurrency(payment.getCurrency());
        dto.setTransactionId(payment.getTransactionId());
        dto.setGatewayPaymentId(payment.getGatewayPaymentId());
        dto.setGatewayOrderId(payment.getGatewayOrderId());
        // Gateway signatures are not needed by API consumers.
        dto.setDescription(payment.getDescription());
        dto.setFailureReason(payment.getFailureReason());
        dto.setInitiatedAt(payment.getInitiatedAt());
        dto.setCompletedAt(payment.getCompletedAt());
        dto.setCreatedAt(payment.getCreatedAt());
        dto.setUpdatedAt(payment.getUpdatedAt());

        return dto;
    }
}
