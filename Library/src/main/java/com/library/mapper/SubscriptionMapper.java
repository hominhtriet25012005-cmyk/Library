package com.library.mapper;

import com.library.exception.SubscriptionException;
import com.library.model.Subscription;
import com.library.model.SubscriptionPlan;
import com.library.model.User;
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
     * Chuyển đổi thực thể Subscription sang DTO
     */
    public SubscriptionDTO toDTO(Subscription subscription) {
        if (subscription == null) {
            return null;
        }

        SubscriptionDTO dto = new SubscriptionDTO();
        dto.setId(subscription.getId());

        // Thông tin người dùng
        if (subscription.getUser() != null) {
            dto.setUserId(subscription.getUser().getId());
            dto.setUserName(subscription.getUser().getFullName());
            dto.setUserEmail(subscription.getUser().getEmail());
        }

        // Thông tin gói
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

        // Các trường được tính toán
        dto.setDaysRemaining(subscription.getDaysRemaining());
        dto.setIsValid(subscription.isValid());
        dto.setIsExpired(subscription.isExpired());

        return dto;
    }

    /**
     * Chuyển đổi DTO sang thực thể Subscription
     */
    public Subscription toEntity(SubscriptionDTO dto,
                                 SubscriptionPlan plan,
                                 User user) throws SubscriptionException {
        if (dto == null) {
            return null;
        }

        Subscription subscription = new Subscription();

        // Các đăng ký mới không bao giờ chấp nhận ID đã tồn tại từ phía khách hàng.
        subscription.setUser(user);
        subscription.setPlan(plan);
        subscription.setNotes(dto.getNotes());

        return subscription;
    }

    /**
     * Chuyển đổi danh sách các gói đăng ký sang các DTO
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
