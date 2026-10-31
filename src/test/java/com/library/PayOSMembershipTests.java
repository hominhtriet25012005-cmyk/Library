package com.library;

import com.library.domain.*;
import com.library.modal.*;
import com.library.repository.*;
import com.library.service.UserService;
import com.library.service.gateway.PayOSService;
import com.library.service.impl.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import vn.payos.model.v2.paymentRequests.*;
import java.util.Optional;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class PayOSMembershipTests {
    private final PayOSOrderStore store = mock(PayOSOrderStore.class);
    private final UserService users = mock(UserService.class);
    private final PayOSService gateway = mock(PayOSService.class);
    @SuppressWarnings("unchecked")
    private final ObjectProvider<PayOSService> provider = mock(ObjectProvider.class);
    private final PayOSMembershipPaymentService service = new PayOSMembershipPaymentService(
            store, users, provider, true, "http://localhost:5173/success", "http://localhost:5173/cancel");

    private Payment setup(boolean fresh) throws Exception {
        when(provider.getIfAvailable()).thenReturn(gateway);
        when(provider.getObject()).thenReturn(gateway);
        when(users.getCurrentUser()).thenReturn(User.builder().id(7L).build());
        Payment payment = Payment.builder().id(42L).amount(100000L).currency("VND")
                .transactionId("TXN_TEST").gateway(PaymentGateway.PAYOS)
                .paymentType(PaymentType.MEMBERSHIP).description("LIBRARY").status(PaymentStatus.PENDING).build();
        when(store.prepare(8L, 7L)).thenReturn(new PayOSOrderStore.Prepared(payment, fresh));
        return payment;
    }

    private CreatePaymentLinkResponse link(long amount) {
        var link = new CreatePaymentLinkResponse();
        link.setOrderCode(42L); link.setAmount(amount); link.setCurrency("VND");
        link.setPaymentLinkId("test-link"); link.setQrCode("test-qr");
        link.setCheckoutUrl("https://example.test/checkout");
        return link;
    }

    @Test void disabledBeforePersistence() {
        var disabled = new PayOSMembershipPaymentService(store, users, provider, false, "", "");
        assertThatThrownBy(() -> disabled.initiate(8L)).isInstanceOf(IllegalStateException.class);
        verifyNoInteractions(store, users, gateway);
    }

    @Test void createsVndLinkWithoutActivatingSubscription() throws Exception {
        Payment payment = setup(true);
        when(gateway.createPaymentLink(42, 100000, "LIBRARY", "http://localhost:5173/success",
                "http://localhost:5173/cancel")).thenReturn(link(100000));
        when(store.attachLink(42L, "test-link")).thenAnswer(call -> {
            payment.setStatus(PaymentStatus.PROCESSING); return payment;
        });
        var result = service.initiate(8L);
        assertThat(result.getCurrency()).isEqualTo("VND");
        assertThat(result.getAmount()).isEqualTo(100000L);
        assertThat(result.getOrderCode()).isEqualTo(42L);
        assertThat(result.getTransactionId()).isEqualTo("TXN_TEST");
        assertThat(result.getQrCode()).isEqualTo("test-qr");
        assertThat(result.getStatus()).isEqualTo(PaymentStatus.PROCESSING);
        assertThat(result.getSuccess()).isTrue();
        verify(store).prepare(8L, 7L);
        verify(store).attachLink(42L, "test-link");
        verifyNoMoreInteractions(store);
    }

    @Test void timeoutKeepsOrderWithoutAutomaticRetry() throws Exception {
        setup(true);
        when(gateway.createPaymentLink(anyLong(), anyLong(), anyString(), anyString(), anyString()))
                .thenThrow(new IllegalStateException("sensitive simulated provider error"));
        assertThatThrownBy(() -> service.initiate(8L)).hasMessageContaining("42")
                .hasMessageNotContaining("sensitive");
        verify(store, never()).attachLink(anyLong(), anyString());
        verify(gateway, times(1)).createPaymentLink(anyLong(), anyLong(), anyString(), anyString(), anyString());
    }

    @Test void mismatchedAmountDoesNotPersistLink() throws Exception {
        setup(true);
        when(gateway.createPaymentLink(anyLong(), anyLong(), anyString(), anyString(), anyString()))
                .thenReturn(link(1));
        assertThatThrownBy(() -> service.initiate(8L)).isInstanceOf(IllegalStateException.class);
        verify(store, never()).attachLink(anyLong(), anyString());
    }

    @Test void repeatedInitiationOnlyLooksUpSameOrder() throws Exception {
        setup(false);
        PaymentLink link = new PaymentLink();
        link.setId("test-link"); link.setOrderCode(42L); link.setAmount(100000L);
        when(gateway.getPaymentLink(42L)).thenReturn(link);
        var response = service.initiate(8L);
        assertThat(response.getPaymentId()).isEqualTo(42L);
        assertThat(response.getSuccess()).isFalse();
        verify(gateway).getPaymentLink(42L);
        verify(gateway, never()).createPaymentLink(anyLong(), anyLong(), anyString(), anyString(), anyString());
    }

    @Test void orderStoreUsesSnapshotAndDeduplicatesUnderSubscriptionLock() {
        PaymentRepository payments = mock(PaymentRepository.class);
        SubscriptionRepository subscriptions = mock(SubscriptionRepository.class);
        var userRepository = mock(UserRepository.class);
        when(userRepository.findLockedById(7L)).thenReturn(Optional.of(User.builder().id(7L).build()));
        when(userRepository.findLockedById(99L)).thenReturn(Optional.of(User.builder().id(99L).build()));
        var realStore = new PayOSOrderStore(payments, subscriptions, userRepository,
                mock(SubscriptionPlanRepository.class));
        Subscription sub = Subscription.builder().id(8L).user(User.builder().id(7L).build())
                .price(100000L).currency("VND").isActive(false).build();
        when(subscriptions.findLockedById(8L)).thenReturn(Optional.of(sub));
        when(payments.saveAndFlush(any())).thenAnswer(call -> {
            Payment p = call.getArgument(0); p.setId(42L); return p;
        });
        var created = realStore.prepare(8L, 7L);
        assertThat(created.newlyCreated()).isTrue();
        assertThat(created.payment().getAmount()).isEqualTo(sub.getPrice());
        assertThat(created.payment().getCurrency()).isEqualTo("VND");
        when(payments.findFirstBySubscriptionIdAndGatewayOrderByIdDesc(8L, PaymentGateway.PAYOS))
                .thenReturn(Optional.of(created.payment()));
        assertThat(realStore.prepare(8L, 7L).newlyCreated()).isFalse();
        verify(payments, times(1)).saveAndFlush(any());
        assertThatThrownBy(() -> realStore.prepare(8L, 99L)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test void repeatedSubscribeReusesPendingDraftWithoutNewWrites() {
        var payments = mock(PaymentRepository.class);
        var subscriptions = mock(SubscriptionRepository.class);
        var userRepository = mock(UserRepository.class);
        var plans = mock(SubscriptionPlanRepository.class);
        var realStore = new PayOSOrderStore(payments, subscriptions, userRepository, plans);
        when(userRepository.findLockedById(7L)).thenReturn(Optional.of(User.builder().id(7L).build()));
        when(plans.findById(3L)).thenReturn(Optional.of(SubscriptionPlan.builder().isActive(true).build()));
        when(subscriptions.findAwaitingPayment(eq(7L), eq(3L), eq(PaymentGateway.PAYOS), any(), any()))
                .thenReturn(java.util.List.of(Subscription.builder().id(8L).build()));
        assertThat(realStore.draftSubscription(3L, 7L, "notes")).isEqualTo(8L);
        verify(subscriptions, never()).saveAndFlush(any());
        verifyNoInteractions(payments);
    }

    @Test void activeMembershipBlocksNewDraftBeforeAnyPaymentWrite() {
        var payments = mock(PaymentRepository.class);
        var subscriptions = mock(SubscriptionRepository.class);
        var userRepository = mock(UserRepository.class);
        var plans = mock(SubscriptionPlanRepository.class);
        var realStore = new PayOSOrderStore(payments, subscriptions, userRepository, plans);
        when(userRepository.findLockedById(7L)).thenReturn(Optional.of(User.builder().id(7L).build()));
        when(subscriptions.existsCurrentActiveByUserId(eq(7L), any())).thenReturn(true);

        assertThatThrownBy(() -> realStore.draftSubscription(3L, 7L, null))
                .isInstanceOf(IllegalStateException.class).hasMessageContaining("active membership");
        verifyNoInteractions(plans, payments);
        verify(subscriptions, never()).saveAndFlush(any());
    }

    @Test void createsInactiveDraftUsingPlanPriceAndAuthenticatedUser() {
        var payments = mock(PaymentRepository.class);
        var subscriptions = mock(SubscriptionRepository.class);
        var userRepository = mock(UserRepository.class);
        var plans = mock(SubscriptionPlanRepository.class);
        var realStore = new PayOSOrderStore(payments, subscriptions, userRepository, plans);
        User user = User.builder().id(7L).build();
        when(userRepository.findLockedById(7L)).thenReturn(Optional.of(user));
        var plan = SubscriptionPlan.builder().id(3L).isActive(true).price(new java.math.BigDecimal("100000.00"))
                .currency("VND").durationDays(30).maxBooksAllowed(3).maxDaysPerBook(14).build();
        when(plans.findById(3L)).thenReturn(Optional.of(plan));
        when(subscriptions.saveAndFlush(any())).thenAnswer(call -> {
            Subscription sub = call.getArgument(0);
            assertThat(sub.getId()).isNull();
            assertThat(sub.getUser()).isSameAs(user);
            assertThat(sub.getPrice()).isEqualTo(100000L);
            assertThat(sub.getCurrency()).isEqualTo("VND");
            assertThat(sub.getIsActive()).isFalse();
            sub.setId(8L); return sub;
        });
        assertThat(realStore.draftSubscription(3L, 7L, "notes")).isEqualTo(8L);
        plan.setIsActive(false);
        assertThatThrownBy(() -> realStore.draftSubscription(3L, 7L, "notes"))
                .isInstanceOf(IllegalArgumentException.class);
        verify(subscriptions, times(1)).saveAndFlush(any());
    }

    @Test void repeatLookupFailureIsSanitizedAndNeverCreatesAnotherOrder() throws Exception {
        setup(false);
        when(gateway.getPaymentLink(42L)).thenThrow(new IllegalStateException("private gateway error"));
        assertThatThrownBy(() -> service.initiate(8L)).hasMessageContaining("42").hasMessageNotContaining("private");
        verify(gateway, never()).createPaymentLink(anyLong(), anyLong(), anyString(), anyString(), anyString());
    }
}
