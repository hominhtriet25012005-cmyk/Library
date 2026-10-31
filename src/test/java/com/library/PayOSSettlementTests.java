package com.library;

import com.library.domain.*;
import com.library.modal.*;
import com.library.repository.*;
import com.library.service.impl.PayOSSettlementService;
import org.junit.jupiter.api.Test;
import java.time.LocalDate;
import java.util.Optional;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class PayOSSettlementTests {
    @Test void settlesOnceAndPreservesPaidDuration() {
        var payments = mock(PaymentRepository.class);
        var subscriptions = mock(SubscriptionRepository.class);
        var user = User.builder().id(7L).build();
        var sub = Subscription.builder().id(8L).user(user).price(100000L).currency("VND")
                .startDate(LocalDate.now().minusDays(2)).endDate(LocalDate.now().plusDays(28))
                .isActive(false).build();
        var payment = Payment.builder().id(42L).user(user).subscription(sub).amount(100000L)
                .currency("VND").gateway(PaymentGateway.PAYOS).paymentType(PaymentType.MEMBERSHIP)
                .status(PaymentStatus.PROCESSING).gatewayOrderId("link").build();
        when(payments.findById(42L)).thenReturn(Optional.of(payment));
        when(payments.findLockedById(42L)).thenReturn(Optional.of(payment));
        when(subscriptions.findLockedById(8L)).thenReturn(Optional.of(sub));
        var userRepository = mock(UserRepository.class);
        when(userRepository.findLockedById(7L)).thenReturn(Optional.of(user));
        when(subscriptions.findOtherCurrentActiveLockedByUserId(eq(7L), eq(8L), any()))
                .thenReturn(java.util.List.of());
        var service = new PayOSSettlementService(payments, subscriptions, userRepository);
        org.springframework.test.util.ReflectionTestUtils.setField(service, "entityManager", mock(jakarta.persistence.EntityManager.class));
        service.complete(42L, "link", 100000L, "VND", "bank-ref");
        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.SUCCESS);
        assertThat(sub.getIsActive()).isTrue();
        assertThat(sub.getEndDate()).isEqualTo(LocalDate.now().plusDays(30));
        sub.setStartDate(LocalDate.now().minusDays(1));
        service.complete(42L, "link", 100000L, "VND", "bank-ref");
        assertThat(sub.getStartDate()).isEqualTo(LocalDate.now().minusDays(1));
        assertThatThrownBy(() -> service.complete(42L, "link", 1L, "VND", "bank-ref"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test void paidSecondOrderCannotActivateAnotherMembership() {
        var payments = mock(PaymentRepository.class);
        var subscriptions = mock(SubscriptionRepository.class);
        var userRepository = mock(UserRepository.class);
        var user = User.builder().id(7L).build();
        var sub = Subscription.builder().id(9L).user(user).price(100000L).currency("VND")
                .startDate(LocalDate.now()).endDate(LocalDate.now().plusDays(30)).isActive(false).build();
        var payment = Payment.builder().id(43L).user(user).subscription(sub).amount(100000L)
                .currency("VND").gateway(PaymentGateway.PAYOS).paymentType(PaymentType.MEMBERSHIP)
                .status(PaymentStatus.PROCESSING).gatewayOrderId("second-link").build();
        when(payments.findById(43L)).thenReturn(Optional.of(payment));
        when(payments.findLockedById(43L)).thenReturn(Optional.of(payment));
        when(userRepository.findLockedById(7L)).thenReturn(Optional.of(user));
        when(subscriptions.findLockedById(9L)).thenReturn(Optional.of(sub));
        when(subscriptions.findOtherCurrentActiveLockedByUserId(eq(7L), eq(9L), any()))
                .thenReturn(java.util.List.of(Subscription.builder().id(8L).user(user).isActive(true).build()));
        var service = new PayOSSettlementService(payments, subscriptions, userRepository);
        org.springframework.test.util.ReflectionTestUtils.setField(service, "entityManager", mock(jakarta.persistence.EntityManager.class));

        assertThatThrownBy(() -> service.complete(43L, "second-link", 100000L, "VND", "bank-ref"))
                .isInstanceOf(IllegalStateException.class).hasMessageContaining("active membership");
        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.PROCESSING);
        assertThat(sub.getIsActive()).isFalse();
        verify(subscriptions, never()).saveAndFlush(any());
        verify(payments, never()).saveAndFlush(any());
    }
}
