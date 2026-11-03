package com.library;

import com.library.mapper.SubscriptionPlanMapper;
import com.library.model.SubscriptionPlan;
import com.library.model.User;
import com.library.repository.SubscriptionPlanRepository;
import com.library.service.UserService;
import com.library.service.impl.SubscriptionPlanServiceImpl;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.*;

class SubscriptionPlanLifecycleTests {

    @Test void deletePlanPermanentlyWhenItHasNeverBeenSubscribed() throws Exception {
        SubscriptionPlanRepository repository = mock(SubscriptionPlanRepository.class);
        UserService users = mock(UserService.class);
        SubscriptionPlan plan = SubscriptionPlan.builder().id(7L).isActive(true).build();
        when(repository.findById(7L)).thenReturn(Optional.of(plan));
        when(repository.hasSubscriptionHistory(7L)).thenReturn(false);
        var service = new SubscriptionPlanServiceImpl(
                repository, new SubscriptionPlanMapper(), users, repository);

        boolean permanentlyDeleted = service.deleteSubscriptionPlan(7L);

        assertTrue(permanentlyDeleted);
        verify(repository).delete(plan);
        verify(repository, never()).save(any());
        verifyNoInteractions(users);
    }

    @Test void stopSellingPlanInsteadOfDeletingWhenSubscriptionHistoryExists() throws Exception {
        SubscriptionPlanRepository repository = mock(SubscriptionPlanRepository.class);
        UserService users = mock(UserService.class);
        SubscriptionPlan plan = SubscriptionPlan.builder().id(7L).isActive(true).build();
        when(repository.findById(7L)).thenReturn(Optional.of(plan));
        when(repository.hasSubscriptionHistory(7L)).thenReturn(true);
        when(users.getCurrentUser()).thenReturn(User.builder().fullName("Admin").build());
        var service = new SubscriptionPlanServiceImpl(
                repository, new SubscriptionPlanMapper(), users, repository);

        boolean permanentlyDeleted = service.deleteSubscriptionPlan(7L);

        assertFalse(permanentlyDeleted);
        assertFalse(plan.getIsActive());
        verify(repository).save(plan);
        verify(repository, never()).delete(any());
        verify(repository, never()).deleteById(anyLong());
    }
}
