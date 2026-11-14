package com.library;

import com.library.domain.PaymentStatus;
import com.library.model.Payment;
import com.library.repository.PaymentRepository;
import com.library.service.impl.PayOSPaymentStateStore;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import vn.payos.model.v2.paymentRequests.PaymentLinkStatus;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class PayOSPaymentStateStoreTests {

    private final PaymentRepository payments = mock(PaymentRepository.class);
    private final EntityManager entityManager = mock(EntityManager.class);
    private final PayOSPaymentStateStore store = createStore();

    private PayOSPaymentStateStore createStore() {
        var result = new PayOSPaymentStateStore(
                payments, mock(com.library.service.NotificationPublisher.class));
        ReflectionTestUtils.setField(result, "entityManager", entityManager);
        return result;
    }

    private Payment payment(PaymentStatus status) {
        var payment = Payment.builder().id(42L).status(status).build();
        when(payments.findLockedById(42L)).thenReturn(Optional.of(payment));
        when(payments.saveAndFlush(payment)).thenReturn(payment);
        return payment;
    }

    @Test
    void cancelledGatewayOrderBecomesTerminalCancelled() {
        var payment = payment(PaymentStatus.PROCESSING);

        var result = store.synchronizeNonPaidStatus(42L, PaymentLinkStatus.CANCELLED);

        assertThat(result.getStatus()).isEqualTo(PaymentStatus.CANCELLED);
        assertThat(result.getCompletedAt()).isNotNull();
        assertThat(result.getFailureReason()).contains("CANCELLED");
        verify(payments).saveAndFlush(payment);
    }

    @Test
    void expiredGatewayOrderBecomesTerminalFailed() {
        var payment = payment(PaymentStatus.PROCESSING);

        var result = store.synchronizeNonPaidStatus(42L, PaymentLinkStatus.EXPIRED);

        assertThat(result.getStatus()).isEqualTo(PaymentStatus.FAILED);
        assertThat(result.getCompletedAt()).isNotNull();
        assertThat(result.getFailureReason()).contains("EXPIRED");
    }

    @Test
    void underpaidOrderRemainsNonTerminalForManualReconciliation() {
        var payment = payment(PaymentStatus.PENDING);

        var result = store.synchronizeNonPaidStatus(42L, PaymentLinkStatus.UNDERPAID);

        assertThat(result.getStatus()).isEqualTo(PaymentStatus.PROCESSING);
        assertThat(result.getCompletedAt()).isNull();
        assertThat(result.getFailureReason()).contains("UNDERPAID");
    }

    @Test
    void successfulPaymentIsNeverDowngradedByLateGatewayResponse() {
        var payment = payment(PaymentStatus.SUCCESS);

        var result = store.synchronizeNonPaidStatus(42L, PaymentLinkStatus.CANCELLED);

        assertThat(result.getStatus()).isEqualTo(PaymentStatus.SUCCESS);
        assertThat(result.getFailureReason()).isNull();
        verify(payments, never()).saveAndFlush(any());
    }
}
