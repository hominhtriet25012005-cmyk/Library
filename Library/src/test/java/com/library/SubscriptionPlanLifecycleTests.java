package com.library;

import com.library.mapper.SubscriptionPlanMapper;
import com.library.exception.BusinessConflictException;
import com.library.model.SubscriptionPlan;
import com.library.repository.SubscriptionPlanRepository;
import com.library.service.UserService;
import com.library.service.impl.SubscriptionPlanServiceImpl;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
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

    @Test void rejectDeletingPlanAndPreserveStateWhenSubscriptionHistoryExists() {
        SubscriptionPlanRepository repository = mock(SubscriptionPlanRepository.class);
        UserService users = mock(UserService.class);
        SubscriptionPlan plan = SubscriptionPlan.builder()
                .id(7L)
                .isActive(true)
                .updatedBy("admin-cu")
                .build();
        when(repository.findById(7L)).thenReturn(Optional.of(plan));
        when(repository.hasSubscriptionHistory(7L)).thenReturn(true);
        var service = new SubscriptionPlanServiceImpl(
                repository, new SubscriptionPlanMapper(), users, repository);

        BusinessConflictException exception = assertThrows(
                BusinessConflictException.class,
                () -> service.deleteSubscriptionPlan(7L)
        );

        assertEquals("SUBSCRIPTION_PLAN_HAS_HISTORY", exception.getErrorCode());
        assertEquals("admin-cu", plan.getUpdatedBy());
        assertTrue(plan.getIsActive());
        verify(repository, never()).save(any());
        verify(repository, never()).delete(any());
        verify(repository, never()).deleteById(anyLong());
        verifyNoInteractions(users);
    }
}
