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
        return ResponseEntity.status(409).body(java.util.Map.of("Lỗi", "Đã có một tư cách thành viên đang hoạt động"));
    }

    @ExceptionHandler(SubscriptionException.class)
    public ResponseEntity<?> subscriptionConflict() {
        return ResponseEntity.status(409).body(java.util.Map.of("Lỗi", "Không thể thay đổi gói đăng ký"));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<?> paymentUnavailable() {
        return ResponseEntity.status(503).body(java.util.Map.of("Lỗi", "Tính năng thanh toán gói đăng ký tạm thời không khả dụng"));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<?> invalidRequest() {
        return ResponseEntity.badRequest().body(java.util.Map.of("Lỗi", "Yêu cầu đăng ký không hợp lệ"));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<?> denied() {
        return ResponseEntity.status(403).body(java.util.Map.of("Lỗi", "Quyền truy cập đăng ký bị từ chối"));
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
                    org.springframework.http.HttpStatus.NOT_FOUND, "Không tìm thấy gói thành viên đang hoạt động.");
        }
    }

    @GetMapping("/admin")
    public ResponseEntity<?> getAllSubscriptions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        validatePage(page, size);
        Pageable pageable = PageRequest.of(page, size,
                Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id")));
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
        if ((userId != null && userId < 1)
                || (planId != null && planId < 1)) {
            throw new IllegalArgumentException("Invalid subscription search");
        }
        validatePage(page, size);
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id")));
        return ResponseEntity.ok(subscriptionService.searchAdminSubscriptions(userId, planId, active, pageable));
    }

    @PostMapping("/admin/deactivate-expired")
    public ResponseEntity<?> deactivateExpiredSubscriptions() throws Exception {
        subscriptionService.deactivateExpiredSubscriptions();
        ApiResponse res = new ApiResponse("Đã ngừng các gói đăng ký hết hạn.", true);
        return ResponseEntity.ok(res);
    }

    private void validatePage(int page, int size) {
        if (page < 0 || size < 1 || size > 100) {
            throw new IllegalArgumentException("Invalid subscription page");
        }
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
