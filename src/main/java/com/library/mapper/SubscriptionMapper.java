package com.library.mapper;

import com.library.exception.SubscriptionException;
import com.library.modal.Subscription;
import com.library.modal.SubscriptionPlan;
import com.library.modal.User;
import com.library.payload.dto.SubscriptionDTO;
import com.library.repository.SubscriptionPlanRepository;
import com.library.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@Component
public class SubscriptionMapper {

    private final UserRepository userRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;

    /**
     * Convert Subscription entity to DTO
     */
    public SubscriptionDTO toDTO(Subscription subscription) {
        if (subscription == null) {
            return null;
        }

        SubscriptionDTO dto = new SubscriptionDTO();
        dto.setId(subscription.getId());

        // User information
        if (subscription.getUser() != null) {
            dto.setUserId(subscription.getUser().getId());
            dto.setUserName(subscription.getUser().getFullName());
            dto.setUserEmail(subscription.getUser().getEmail());
        }

        // Plan information
        if (subscription.getPlan() != null) {
            dto.setPlanId(subscription.getPlan().getId());
        }

        dto.setPlanName(subscription.getPlanName());
        dto.setPlanCode(subscription.getPlanCode());
        dto.setPrice(subscription.getPrice());
        dto.setCurrency(subscription.getCurrency());

        dto.setStartDate(subscription.getStartDate());
        dto.setEndDate(subscription.getEndDate());
        dto.setIsActive(subscription.getIsActive());
        dto.setMaxBooksAllowed(subscription.getMaxBooksAllowed());
        dto.setMaxDaysPerBook(subscription.getMaxDaysPerBook());
        dto.setAutoRenew(subscription.getAutoRenew());
        dto.setCancelledAt(subscription.getCancelledAt());
        dto.setCancellationReason(subscription.getCancellationReason());
        dto.setNotes(subscription.getNotes());
        dto.setCreatedAt(subscription.getCreatedAt());
        dto.setUpdatedAt(subscription.getUpdatedAt());

        // Calculated fields
        dto.setDaysRemaining(subscription.getDaysRemaining());
        dto.setIsValid(subscription.isValid());
        dto.setIsExpired(subscription.isExpired());

        return dto;
    }

    /**
     * Convert DTO to Subscription entity
     */
    public Subscription toEntity(SubscriptionDTO dto,
                                 SubscriptionPlan plan,
                                 User user) throws SubscriptionException {
        if (dto == null) {
            return null;
        }

        Subscription subscription = new Subscription();
        // New subscriptions never accept an existing ID from the client.
        subscription.setUser(user);
        subscription.setPlan(plan);
        subscription.setNotes(dto.getNotes());

        return subscription;
    }

    /**
     * Convert list of subscriptions to DTOs
     */
    public List<SubscriptionDTO> toDTOList(List<Subscription> subscriptions) {
        if (subscriptions == null) {
            return null;
        }

        return subscriptions.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

}
