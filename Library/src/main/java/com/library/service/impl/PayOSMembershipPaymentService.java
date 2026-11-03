package com.library.service.impl;

import com.library.payload.response.PaymentInitiateResponse;
import com.library.service.UserService;
import com.library.service.gateway.PayOSService;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.util.Objects;

@Service
public class PayOSMembershipPaymentService {
    private final PayOSOrderStore store;
    private final UserService users;
    private final ObjectProvider<PayOSService> gateways;
    private final boolean creationEnabled;
    private final String returnUrl;
    private final String cancelUrl;

    public PayOSMembershipPaymentService(PayOSOrderStore store, UserService users,
            ObjectProvider<PayOSService> gateways,
            @Value("${payos.creation-enabled:false}") boolean creationEnabled,
            @Value("${payos.return-url:}") String returnUrl,
            @Value("${payos.cancel-url:}") String cancelUrl) {
        this.store = store;
        this.users = users;
        this.gateways = gateways;
        this.creationEnabled = creationEnabled;
        this.returnUrl = returnUrl;
        this.cancelUrl = cancelUrl;
    }

    public void assertAvailable() {
        if (!creationEnabled || gateways.getIfAvailable() == null) {
            throw new IllegalStateException("payOS payment creation is disabled");
        }
        PayOSService.validateUrl(returnUrl);
        PayOSService.validateUrl(cancelUrl);
    }

    public PaymentInitiateResponse initiate(Long subscriptionId) throws Exception {
        assertAvailable();
        if (subscriptionId == null) throw new IllegalArgumentException("Subscription ID is required");
        var prepared = store.prepare(subscriptionId, users.getCurrentUser().getId());
        return initiatePrepared(prepared);
    }

    public PaymentInitiateResponse initiatePrepared(PayOSOrderStore.Prepared prepared) {
        assertAvailable();
        var payment = prepared.payment();
        var response = PaymentInitiateResponse.builder().paymentId(payment.getId())
                .orderCode(payment.getId()).transactionId(payment.getTransactionId())
                .gateway(payment.getGateway()).amount(payment.getAmount()).currency(payment.getCurrency())
                .description(payment.getDescription()).status(payment.getStatus());
        if (!prepared.newlyCreated()) {
            // Never recreate an uncertain order. C1 will reconcile/settle the same order.
            vn.payos.model.v2.paymentRequests.PaymentLink link;
            try {
                link = gateways.getObject().getPaymentLink(payment.getId());
            } catch (RuntimeException ex) {
                throw new IllegalStateException("Payment " + payment.getId()
                        + " could not be reconciled; do not create a replacement order");
            }
            if (!Objects.equals(link.getOrderCode(), payment.getId())
                    || !Objects.equals(link.getAmount(), payment.getAmount())
                    || (payment.getGatewayOrderId() != null && !payment.getGatewayOrderId().equals(link.getId()))) {
                throw new IllegalStateException("payOS order mismatch; reconciliation required");
            }
            return response.paymentLinkId(link.getId()).success(false)
                    .message("Existing order; awaiting verified settlement. Do not create another order.").build();
        }
        try {
            var link = gateways.getObject().createPaymentLink(payment.getId(), payment.getAmount(),
                    payment.getDescription(), returnUrl, cancelUrl);
            if (!Objects.equals(link.getOrderCode(), payment.getId())
                    || !Objects.equals(link.getAmount(), payment.getAmount())
                    || !"VND".equals(link.getCurrency()) || link.getPaymentLinkId() == null
                    || link.getPaymentLinkId().isBlank() || link.getQrCode() == null || link.getQrCode().isBlank()) {
                throw new IllegalStateException("payOS returned mismatched order data");
            }
            PayOSService.validateUrl(link.getCheckoutUrl());
            payment = store.attachLink(payment.getId(), link.getPaymentLinkId());
            return response.paymentLinkId(link.getPaymentLinkId()).qrCode(link.getQrCode())
                    .checkoutUrl(link.getCheckoutUrl()).status(payment.getStatus()).success(true)
                    .message("Payment link created; payment has not been confirmed").build();
        } catch (RuntimeException ex) {
            // Keep committed order for reconciliation; do not expose provider secrets/errors.
            throw new IllegalStateException("Payment " + payment.getId()
                    + " requires reconciliation; do not create a replacement order");
        }
    }
}
