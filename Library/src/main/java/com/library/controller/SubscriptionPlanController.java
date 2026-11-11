package com.library.controller;

import com.library.payload.dto.SubscriptionPlanDTO;
import com.library.payload.response.ApiResponse;
import com.library.service.SubscriptionPlanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/subscription-plans")
public class SubscriptionPlanController {

    private final SubscriptionPlanService subscriptionPlanService;

    @GetMapping
    public ResponseEntity<?> getAllSubscriptionPlans() {
        List<SubscriptionPlanDTO> plans = subscriptionPlanService.getAvailableSubscriptionPlans();

        return ResponseEntity.ok(plans);
    }

    @GetMapping("/admin")
    public ResponseEntity<?> getAdminSubscriptionPlans() {
        List<SubscriptionPlanDTO> plans = subscriptionPlanService.getAllSubscriptionPlan();

        return ResponseEntity.ok(plans);
    }

    @PostMapping("/admin/create")
    public ResponseEntity<?> createSubscriptionPlan(
            @Valid @RequestBody SubscriptionPlanDTO subscriptionPlanDTO
    ) throws Exception {
        SubscriptionPlanDTO plans = subscriptionPlanService.createSubscriptionPlan(
                subscriptionPlanDTO
        );

        return ResponseEntity.ok(plans);
    }

    @PutMapping("/admin/{id}")
    public ResponseEntity<?> updateSubscriptionPlan(
             @Valid @RequestBody SubscriptionPlanDTO subscriptionPlanDTO,
            @PathVariable Long id
    ) throws Exception {
        SubscriptionPlanDTO plans = subscriptionPlanService.updateSubscriptionPlan(
                id, subscriptionPlanDTO
        );

        return ResponseEntity.ok(plans);
    }

    @DeleteMapping("/admin/{id}")
    public ResponseEntity<?> deleteSubscriptionPlan(
            @PathVariable Long id
    ) throws Exception {
        boolean permanentlyDeleted = subscriptionPlanService.deleteSubscriptionPlan(id);
        String message = permanentlyDeleted
                ? "Đã xóa vĩnh viễn gói thành công."
                : "Gói đã có lịch sử đăng ký nên chỉ được ngừng bán.";
        ApiResponse res = new ApiResponse(message, true);

        return ResponseEntity.ok(res);
    }
}
