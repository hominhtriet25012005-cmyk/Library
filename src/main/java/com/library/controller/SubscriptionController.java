package com.library.controller;

import com.library.exception.SubscriptionException;
import com.library.exception.ActiveMembershipException;
import com.library.payload.dto.SubscriptionDTO;
import com.library.payload.response.ApiResponse;
import com.library.payload.response.PaymentInitiateResponse;
import com.library.payload.response.PageResponse;
import com.library.service.SubscriptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/subscriptions")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    @ExceptionHandler(ActiveMembershipException.class)
    public ResponseEntity<?> activeMembership() {
        return ResponseEntity.status(409).body(java.util.Map.of("error", "An active membership already exists"));
    }

    @ExceptionHandler(SubscriptionException.class)
    public ResponseEntity<?> subscriptionConflict() {
        return ResponseEntity.status(409).body(java.util.Map.of("error", "Subscription cannot be changed"));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<?> paymentUnavailable() {
        return ResponseEntity.status(503).body(java.util.Map.of("error", "Subscription payment is temporarily unavailable"));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<?> invalidRequest() {
        return ResponseEntity.badRequest().body(java.util.Map.of("error", "Invalid subscription request"));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<?> denied() {
        return ResponseEntity.status(403).body(java.util.Map.of("error", "Subscription access denied"));
    }

    @PostMapping("/subscribe")
    public ResponseEntity<?> subscribe(
            @RequestBody SubscriptionDTO subscription
    ) throws Exception {
        PaymentInitiateResponse dto = subscriptionService.subscribe(subscription);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/user/active")
    public ResponseEntity<?> getUsersActiveSubscription(
            @RequestParam(required = false) Long userId
    ) throws Exception {

        try {
            SubscriptionDTO dto = subscriptionService.getUsersActiveSubscription(userId);
            return ResponseEntity.ok(dto);
        } catch (SubscriptionException notFound) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.NOT_FOUND, "No active subscription");
        }
    }

    @GetMapping("/admin")
    public ResponseEntity<?> getAllSubscriptions() {
        int page = 0;
        int size = 10;
        Pageable pageable = PageRequest.of(page, size);
        List<SubscriptionDTO> dtoList = subscriptionService.getAllSubscriptions(pageable);
        return ResponseEntity.ok(dtoList);
    }

    @GetMapping("/admin/search")
    public ResponseEntity<PageResponse<SubscriptionDTO>> searchAdminSubscriptions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Long planId,
            @RequestParam(required = false) Boolean active) {
        if (page < 0 || size < 1 || size > 100 || (userId != null && userId < 1)
                || (planId != null && planId < 1)) {
            throw new IllegalArgumentException("Invalid subscription search");
        }
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id")));
        return ResponseEntity.ok(subscriptionService.searchAdminSubscriptions(userId, planId, active, pageable));
    }

    @GetMapping("/admin/deactivate-expired")
    public ResponseEntity<?> deactivateExpiredSubscriptions() throws Exception {
        int page = 0;
        int size = 10;
        Pageable pageable = PageRequest.of(page, size);
        subscriptionService.deactivateExpiredSubscriptions();
        ApiResponse res = new ApiResponse("task done!", true);
        return ResponseEntity.ok(res);
    }

    @PostMapping("/cancel/{subscriptionId}")
    public ResponseEntity<?> cancelSubscription(
            @PathVariable Long subscriptionId,
            @RequestParam(required = false) String reason) throws SubscriptionException {

        SubscriptionDTO subscription = subscriptionService
                .cancelSubscription(subscriptionId, reason);
        return ResponseEntity.ok(subscription);
    }

    @PostMapping("/activate")
    public ResponseEntity<?> activateSubscription(
            @RequestParam Long subscriptionId,
            @RequestParam Long paymentId) throws SubscriptionException {
        SubscriptionDTO subscription = subscriptionService
                .activateSubscription(subscriptionId, paymentId);
        return ResponseEntity.ok(subscription);
    }
}
