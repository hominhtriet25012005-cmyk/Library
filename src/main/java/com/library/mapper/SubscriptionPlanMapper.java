package com.library.mapper;

import com.library.modal.SubscriptionPlan;
import com.library.payload.dto.SubscriptionPlanDTO;
import org.springframework.stereotype.Component;

import java.util.Locale;

@Component
public class SubscriptionPlanMapper {

    public SubscriptionPlanDTO toDTO(SubscriptionPlan plan) {
        if (plan == null) {
            return null;
        }

        SubscriptionPlanDTO dto = new SubscriptionPlanDTO();
        dto.setId(plan.getId());
        dto.setPlanCode(plan.getPlanCode());
        dto.setName(plan.getName());
        dto.setDescription(plan.getDescription());
        dto.setDurationDays(plan.getDurationDays());
        dto.setPrice(plan.getPrice());
        dto.setCurrency(plan.getCurrency());
        dto.setMaxBooksAllowed(plan.getMaxBooksAllowed());
        dto.setMaxDaysPerBook(plan.getMaxDaysPerBook());
        dto.setDisplayOrder(plan.getDisplayOrder());
        dto.setIsActive(plan.getIsActive());
        dto.setIsFeatured(plan.getIsFeatured());
        dto.setBadgeText(plan.getBadgeText());
        dto.setAdminNotes(plan.getAdminNotes());
        dto.setCreatedAt(plan.getCreatedAt());
        dto.setUpdatedAt(plan.getUpdatedAt());
        dto.setCreatedBy(plan.getCreatedBy());
        dto.setUpdatedBy(plan.getUpdatedBy());

        return dto;
    }

    public SubscriptionPlan toEntity(SubscriptionPlanDTO dto) {
        if (dto == null) {
            return null;
        }

        SubscriptionPlan plan = new SubscriptionPlan();
        plan.setId(dto.getId());
        plan.setPlanCode(dto.getPlanCode());
        plan.setName(dto.getName());
        plan.setDescription(dto.getDescription());
        plan.setDurationDays(dto.getDurationDays());
        plan.setPrice(dto.getPrice());
        plan.setMaxBooksAllowed(dto.getMaxBooksAllowed());
        plan.setMaxDaysPerBook(dto.getMaxDaysPerBook());
        plan.setDisplayOrder(dto.getDisplayOrder() != null ? dto.getDisplayOrder() : 0);
        plan.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : true);
        plan.setIsFeatured(dto.getIsFeatured() != null ? dto.getIsFeatured() : false);
        plan.setBadgeText(dto.getBadgeText());
        plan.setAdminNotes(dto.getAdminNotes());
        plan.setCreatedBy(dto.getCreatedBy());
        plan.setUpdatedBy(dto.getUpdatedBy());

        return plan;
    }

    /** Cập nhật entity gói thành viên từ DTO. */
    public void updateEntity(SubscriptionPlan plan, SubscriptionPlanDTO dto) {
        if (plan == null || dto == null) {
            return;
        }

        // Không đổi ID; mã gói được giữ ổn định sau khi tạo.
        if (dto.getName() != null) {
            plan.setName(dto.getName());
        }
        plan.setDescription(dto.getDescription());
        if (dto.getDurationDays() != null) {
            plan.setDurationDays(dto.getDurationDays());
        }
        if (dto.getPrice() != null) {
            plan.setPrice(dto.getPrice());
        }
        if (dto.getCurrency() != null) {
            plan.setCurrency(normalizeCurrency(dto.getCurrency()));
        }
        if (dto.getMaxBooksAllowed() != null) {
            plan.setMaxBooksAllowed(dto.getMaxBooksAllowed());
        }
        if (dto.getMaxDaysPerBook() != null) {
            plan.setMaxDaysPerBook(dto.getMaxDaysPerBook());
        }
        if (dto.getDisplayOrder() != null) {
            plan.setDisplayOrder(dto.getDisplayOrder());
        }
        if (dto.getIsActive() != null) {
            plan.setIsActive(dto.getIsActive());
        }
        if (dto.getIsFeatured() != null) {
            plan.setIsFeatured(dto.getIsFeatured());
        }
        plan.setBadgeText(dto.getBadgeText());
        plan.setAdminNotes(dto.getAdminNotes());
    }

    private String normalizeCurrency(String currency) {
        return currency == null || currency.isBlank()
                ? "VND"
                : currency.trim().toUpperCase(Locale.ROOT);
    }
}
