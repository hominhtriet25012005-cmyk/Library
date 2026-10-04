package com.library;

import com.library.domain.*;
import com.library.modal.*;
import com.library.repository.PaymentRepository;
import com.library.service.UserService;
import com.library.service.gateway.PayOSService;
import com.library.service.impl.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import vn.payos.model.webhooks.WebhookData;
import vn.payos.model.v2.paymentRequests.*;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class PayOSConfirmationTests {
    private final PayOSService gateway = mock(PayOSService.class);
    @SuppressWarnings("unchecked") private final ObjectProvider<PayOSService> provider = mock(ObjectProvider.class);
    private final PaymentRepository payments = mock(PaymentRepository.class);
    private final PayOSSettlementService settlement = mock(PayOSSettlementService.class);
    private final UserService users = mock(UserService.class);
    private final PayOSFineSettlementService fineSettlement = mock(PayOSFineSettlementService.class);
    private final PayOSConfirmationService service = new PayOSConfirmationService(provider, payments, settlement, users, fineSettlement);
    private final Map<String, Object> body = Map.of("test", "payload");

    private Payment setup() {
        when(provider.getIfAvailable()).thenReturn(gateway);
        Payment p = Payment.builder().id(42L).amount(100000L).currency("VND").gateway(PaymentGateway.PAYOS)
                .paymentType(PaymentType.MEMBERSHIP).user(User.builder().id(7L).build())
                .status(PaymentStatus.PENDING).build();
        when(payments.findById(42L)).thenReturn(Optional.of(p));
        return p;
    }
    private WebhookData webhook() {
        WebhookData data = new WebhookData();
        data.setOrderCode(42L); data.setAmount(100000L); data.setCurrency("VND");
        data.setPaymentLinkId("link"); data.setReference("receipt"); data.setCode("00");
        when(gateway.verifyWebhook(body)).thenReturn(data);
        return data;
    }
    private PaymentLink paidLink() {
        PaymentLink link = new PaymentLink();
        link.setId("link"); link.setOrderCode(42L); link.setAmount(100000L);
        link.setAmountPaid(100000L); link.setAmountRemaining(0L); link.setStatus(PaymentLinkStatus.PAID);
        Transaction receipt = new Transaction(); receipt.setAmount(100000L); receipt.setReference("receipt");
        link.setTransactions(List.of(receipt));
        when(gateway.getPaymentLink(42L)).thenReturn(link);
        return link;
    }

    @Test void signedAndServerVerifiedWebhookCanArriveBeforeCreateResponse() {
        setup(); webhook(); paidLink();
        assertThat(service.webhook(body)).isEqualTo("OK");
        verify(settlement).complete(42L, "link", 100000L, "VND", "receipt");
    }
    @Test void verifiedFineWebhookUsesFineSettlementOnly() {
        setup().setPaymentType(PaymentType.FINE); webhook(); paidLink();
        assertThat(service.webhook(body)).isEqualTo("OK");
        verify(fineSettlement).complete(42L, "link", 100000L, "VND", "receipt");
        verifyNoInteractions(settlement);
    }
    @Test void invalidSignatureNeverReadsOrWritesDatabase() {
        when(provider.getIfAvailable()).thenReturn(gateway);
        when(gateway.verifyWebhook(body)).thenThrow(new IllegalArgumentException("Invalid signature"));
        assertThatThrownBy(() -> service.webhook(body)).isInstanceOf(IllegalArgumentException.class);
        verifyNoInteractions(payments, settlement);
    }
    @Test void unknownSignedProbeIsAcknowledgedWithoutCreatingRows() {
        when(provider.getIfAvailable()).thenReturn(gateway); webhook();
        assertThat(service.webhook(body)).isEqualTo("IGNORED_UNKNOWN_ORDER");
        verifyNoInteractions(settlement);
        verify(gateway, never()).getPaymentLink(any());
        verify(payments, never()).save(any());
    }
    @Test void wrongCurrencyAmountLinkOrReceiptNeverSettles() {
        setup(); var data = webhook(); var link = paidLink();
        data.setCurrency("INR");
        assertThatThrownBy(() -> service.webhook(body)).isInstanceOf(IllegalArgumentException.class);
        data.setCurrency("VND"); data.setAmount(1L);
        assertThatThrownBy(() -> service.webhook(body)).isInstanceOf(IllegalArgumentException.class);
        data.setAmount(100000L); data.setPaymentLinkId("wrong-link");
        assertThatThrownBy(() -> service.webhook(body)).isInstanceOf(IllegalArgumentException.class);
        data.setPaymentLinkId("link"); data.setReference("wrong-receipt");
        assertThatThrownBy(() -> service.webhook(body)).isInstanceOf(IllegalArgumentException.class);
        data.setReference("receipt"); link.setAmountPaid(100001L);
        assertThatThrownBy(() -> service.webhook(body)).isInstanceOf(IllegalArgumentException.class);
        verifyNoInteractions(settlement);
    }
    @Test void pendingGatewayDoesNotActivateAndDatabaseFailureIsNotAcknowledged() {
        setup(); webhook(); var link = paidLink(); link.setStatus(PaymentLinkStatus.PENDING);
        assertThatThrownBy(() -> service.webhook(body)).isInstanceOf(IllegalStateException.class);
        verifyNoInteractions(settlement);
        link.setStatus(PaymentLinkStatus.PAID);
        doThrow(new IllegalStateException("db temporarily unavailable")).when(settlement)
                .complete(anyLong(), anyString(), anyLong(), anyString(), anyString());
        assertThatThrownBy(() -> service.webhook(body)).isInstanceOf(IllegalStateException.class);
    }
    @Test void onlyOwnerOrAdminCanReadOrReconcile() throws Exception {
        setup(); paidLink();
        when(users.getCurrentUser()).thenReturn(User.builder().id(99L).role(UserRole.ROLE_USER).build());
        assertThatThrownBy(() -> service.status(42L)).isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
        assertThatThrownBy(() -> service.reconcile(42L)).isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
        verify(gateway, never()).getPaymentLink(any());
        when(users.getCurrentUser()).thenReturn(User.builder().id(7L).role(UserRole.ROLE_USER).build());
        assertThat(service.status(42L).paymentId()).isEqualTo(42L);
        service.reconcile(42L);
        verify(settlement).complete(42L, "link", 100000L, "VND", "receipt");
        when(users.getCurrentUser()).thenReturn(User.builder().id(99L).role(UserRole.ROLE_ADMIN).build());
        assertThat(service.status(42L).paymentId()).isEqualTo(42L);
    }
    @Test void realSdkAcceptsSignedJsonAndRejectsTampering() throws Exception {
        var sdk = new vn.payos.PayOS("dummy", "dummy", "test-checksum");
        var realGateway = new PayOSService(sdk);
        var mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        var data = mapper.readValue("""
            {"orderCode":42,"amount":100000,"description":"LIBRARY","accountNumber":"TEST",
             "reference":"receipt","transactionDateTime":"2026-10-04 13:00:00","currency":"VND",
             "paymentLinkId":"link","code":"00","desc":"success"}
            """, WebhookData.class);
        var signature = sdk.getCrypto().createSignatureFromObj(data, "test-checksum");
        Map<String, Object> payload = new HashMap<>();
        payload.put("code", "00"); payload.put("desc", "success"); payload.put("success", true);
        payload.put("data", mapper.convertValue(data, Map.class)); payload.put("signature", signature);
        assertThat(realGateway.verifyWebhook(payload).getAmount()).isEqualTo(100000L);
        @SuppressWarnings("unchecked") var fields = (Map<String, Object>) payload.get("data");
        fields.put("amount", 1);
        assertThatThrownBy(() -> realGateway.verifyWebhook(payload)).isInstanceOf(IllegalArgumentException.class);
        payload.put("signature", "");
        assertThatThrownBy(() -> realGateway.verifyWebhook(payload)).isInstanceOf(IllegalArgumentException.class);
    }
}
