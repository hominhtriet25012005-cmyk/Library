package com.library.controller;

import com.library.service.impl.PayOSConfirmationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.server.ResponseStatusException;
import com.library.payload.response.ApiResponse;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/payments")
public class PayOSController {

    private final PayOSConfirmationService confirmation;

    @PostMapping("/webhook/payos")
    public Map<String, String> webhook(@RequestBody Map<String, Object> body) {

        return Map.of("Kết quả", confirmation.webhook(body));
    }

    @GetMapping("/{id}/status")
    public PayOSConfirmationService.Status status(@PathVariable Long id) {

        return confirmation.status(id); }

    @PostMapping("/{id}/reconcile")
    public PayOSConfirmationService.Status reconcile(@PathVariable Long id) {

        return confirmation.reconcile(id); }

    @ExceptionHandler(AccessDeniedException.class)
    ResponseEntity<?> denied() {

        return ResponseEntity.status(403).body(new ApiResponse("Truy cập bị từ chối", false)); }

    @ExceptionHandler(IllegalArgumentException.class)
    ResponseEntity<?> invalid() {

        return ResponseEntity.badRequest().body(new ApiResponse("Bằng chứng thanh toán không hợp lệ", false)); }

    @ExceptionHandler(ResponseStatusException.class)
    ResponseEntity<?> statusError(ResponseStatusException ex) {

        return ResponseEntity.status(ex.getStatusCode()).body(
                new ApiResponse("Yêu cầu thanh toán không khả dụng", false));
    }

    @ExceptionHandler(RuntimeException.class)
    ResponseEntity<?> temporaryFailure() {

        // Mã không thuộc dải 2xx: không có xác nhận cho một thao tác commit thất bại;
        // cho phép nhà cung cấp thử lại.
        return ResponseEntity.status(503).body(new ApiResponse(
                "Giao dịch thanh toán cần được thực hiện lại hoặc đối soát", false));
    }
}
