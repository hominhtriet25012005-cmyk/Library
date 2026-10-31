package com.library;

import com.library.mapper.SubscriptionMapper;
import com.library.mapper.SubscriptionPlanMapper;
import com.library.modal.Subscription;
import com.library.modal.SubscriptionPlan;
import com.library.payload.dto.SubscriptionDTO;
import com.library.payload.dto.SubscriptionPlanDTO;
import com.library.repository.SubscriptionPlanRepository;
import com.library.repository.SubscriptionRepository;
import com.library.service.UserService;
import com.library.service.impl.SubscriptionImpl;
import com.library.service.impl.SubscriptionPlanServiceImpl;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class AdminMembershipCatalogTests {
    @Test void publicCatalogOnlyShowsSellingPlansWhileAdminSeesAll() {
        SubscriptionPlanRepository repository = mock(SubscriptionPlanRepository.class);
        SubscriptionPlanMapper mapper = new SubscriptionPlanMapper();
        SubscriptionPlan selling = SubscriptionPlan.builder().id(1L).isActive(true)
                .adminNotes("internal").createdBy("Admin").updatedBy("Admin").build();
        SubscriptionPlan stopped = SubscriptionPlan.builder().id(2L).isActive(false).build();
        when(repository.findSellingPlans()).thenReturn(List.of(selling));
        when(repository.findAllPlans()).thenReturn(List.of(selling, stopped));
        var service = new SubscriptionPlanServiceImpl(repository, mapper, mock(UserService.class), repository);

        var publicPlans = service.getAvailableSubscriptionPlans();
        assertEquals(List.of(1L), publicPlans.stream().map(SubscriptionPlanDTO::getId).toList());
        assertNull(publicPlans.get(0).getAdminNotes());
        assertNull(publicPlans.get(0).getCreatedBy());
        assertEquals(List.of(1L, 2L), service.getAllSubscriptionPlan().stream().map(SubscriptionPlanDTO::getId).toList());
    }

    @Test void adminSubscriptionsUseDatabasePageInsteadOfLoadingEveryRow() {
        SubscriptionRepository repository = mock(SubscriptionRepository.class);
        SubscriptionMapper mapper = mock(SubscriptionMapper.class);
        var page = PageRequest.of(1, 2);
        Subscription subscription = Subscription.builder().id(3L).build();
        when(repository.searchAdminSubscriptions(7L, null, true, page))
                .thenReturn(new PageImpl<>(List.of(subscription), page, 3));
        when(mapper.toDTO(subscription)).thenReturn(new SubscriptionDTO());
        var service = new SubscriptionImpl(repository, mapper, mock(UserService.class),
                mock(SubscriptionPlanRepository.class), mock(com.library.service.PaymentService.class),
                mock(com.library.service.impl.PayOSMembershipPaymentService.class),
                mock(com.library.service.impl.PayOSOrderStore.class), mock(com.library.repository.PaymentRepository.class));

        var result = service.searchAdminSubscriptions(7L, null, true, page);
        assertEquals(3L, result.getTotalElements());
        assertEquals(2, result.getTotalPages());
        assertEquals(1, result.getPageNumber());
        assertEquals(1, result.getContent().size());
        verify(repository, never()).findAll();
    }
}
