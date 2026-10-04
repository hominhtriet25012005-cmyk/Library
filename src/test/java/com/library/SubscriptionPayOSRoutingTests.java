package com.library;

import com.library.domain.PaymentGateway;
import com.library.mapper.SubscriptionMapper;
import com.library.modal.User;
import com.library.payload.dto.SubscriptionDTO;
import com.library.payload.request.PaymentInitiateRequest;
import com.library.repository.*;
import com.library.service.*;
import com.library.service.impl.*;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class SubscriptionPayOSRoutingTests {
    private final SubscriptionRepository subscriptions = mock(SubscriptionRepository.class);
    private final UserService users = mock(UserService.class);
    private final PaymentService payments = mock(PaymentService.class);
    private final PayOSMembershipPaymentService membership = mock(PayOSMembershipPaymentService.class);
    private final PayOSOrderStore store = mock(PayOSOrderStore.class);
    private final SubscriptionImpl service = new SubscriptionImpl(subscriptions,
            mock(SubscriptionMapper.class), users, mock(SubscriptionPlanRepository.class), payments, membership, store,
            mock(PaymentRepository.class));

    @Test void routeIgnoresClientUserPriceAndCurrency() throws Exception {
        when(users.getCurrentUser()).thenReturn(User.builder().id(7L).build());
        when(store.draftSubscription(3L, 7L, null)).thenReturn(8L);
        SubscriptionDTO dto = new SubscriptionDTO();
        dto.setPlanId(3L); dto.setUserId(99L); dto.setPrice(1L); dto.setCurrency("INR");
        service.subscribe(dto);
        var request = org.mockito.ArgumentCaptor.forClass(PaymentInitiateRequest.class);
        verify(payments).initiatePayment(request.capture());
        assertThat(request.getValue().getGateway()).isEqualTo(PaymentGateway.PAYOS);
        assertThat(request.getValue().getUserId()).isEqualTo(7L);
        assertThat(request.getValue().getSubscriptionId()).isEqualTo(8L);
        assertThat(request.getValue().getAmount()).isNull(); // Store supplies the snapshot amount.
    }

    @Test void suppliedSubscriptionIdIsRejectedBeforeAnyWrite() {
        SubscriptionDTO dto = new SubscriptionDTO(); dto.setPlanId(3L); dto.setId(99L);
        assertThatThrownBy(() -> service.subscribe(dto)).isInstanceOf(IllegalArgumentException.class);
        verifyNoInteractions(store, users, payments);
    }

    @Test void cannotCancelAnotherUsersSubscription() throws Exception {
        when(users.getCurrentUser()).thenReturn(User.builder().id(99L).role(com.library.domain.UserRole.ROLE_USER).build());
        when(subscriptions.findLockedById(8L)).thenReturn(java.util.Optional.of(
                com.library.modal.Subscription.builder().id(8L).user(User.builder().id(7L).build()).isActive(true).build()));
        assertThatThrownBy(() -> service.cancelSubscription(8L, "cancel"))
                .isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
        verify(subscriptions, never()).save(any());
    }
}
