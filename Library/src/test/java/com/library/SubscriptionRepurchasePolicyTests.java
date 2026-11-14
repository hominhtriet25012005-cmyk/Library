package com.library;

import com.library.domain.UserRole;
import com.library.mapper.SubscriptionMapper;
import com.library.model.Subscription;
import com.library.model.SubscriptionPlan;
import com.library.model.User;
import com.library.repository.*;
import com.library.service.UserService;
import com.library.service.impl.*;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class SubscriptionRepurchasePolicyTests {

    @Test void userCanCreateNewPayOSDraftImmediatelyAfterCancellingActiveMembership() throws Exception {
        SubscriptionRepository subscriptions = mock(SubscriptionRepository.class);
        UserRepository users = mock(UserRepository.class);
        SubscriptionPlanRepository plans = mock(SubscriptionPlanRepository.class);
        PaymentRepository payments = mock(PaymentRepository.class);
        User user = User.builder().id(4L).fullName("Reader").role(UserRole.ROLE_USER).build();
        Subscription current = Subscription.builder().id(8L).user(user).isActive(true).build();
        SubscriptionPlan plan = SubscriptionPlan.builder().id(3L).isActive(true)
                .durationDays(30).price(new java.math.BigDecimal("30000"))
                .currency("VND").maxBooksAllowed(3).maxDaysPerBook(14).build();
        when(users.findLockedById(4L)).thenReturn(Optional.of(user));
        when(subscriptions.findLockedById(8L)).thenReturn(Optional.of(current));
        when(subscriptions.save(any())).thenAnswer(call -> call.getArgument(0));
        when(subscriptions.existsCurrentActiveByUserId(eq(4L), any()))
                .thenAnswer(call -> Boolean.TRUE.equals(current.getIsActive()));
        when(plans.findById(3L)).thenReturn(Optional.of(plan));
        when(subscriptions.findAwaitingPayment(eq(4L), eq(3L), any(), any(), any()))
                .thenReturn(List.of());
        when(subscriptions.saveAndFlush(any())).thenAnswer(call -> {
            Subscription draft = call.getArgument(0);
            draft.setId(12L);
            return draft;
        });
        UserService currentUser = mock(UserService.class);
        when(currentUser.getCurrentUser()).thenReturn(user);
        var subscriptionService = new SubscriptionImpl(subscriptions, mock(SubscriptionMapper.class), currentUser,
                plans, mock(com.library.service.PaymentService.class), mock(PayOSMembershipPaymentService.class),
                mock(PayOSOrderStore.class), payments,
                mock(com.library.service.NotificationPublisher.class));

        subscriptionService.cancelSubscription(8L, "Đổi gói");
        Long draftId = new PayOSOrderStore(payments, subscriptions, users, plans)
                .draftSubscription(3L, 4L, null);

        assertEquals(12L, draftId);
        verify(subscriptions).saveAndFlush(argThat(draft -> !Boolean.TRUE.equals(draft.getIsActive())));
    }
}
