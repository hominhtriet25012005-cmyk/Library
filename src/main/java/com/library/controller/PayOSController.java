package com.library.controller;

import com.library.service.impl.PayOSConfirmationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.server.ResponseStatusException;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/payments")
public class PayOSController {
    private final PayOSConfirmationService confirmation;

    @PostMapping("/webhook/payos")
    public Map<String, String> webhook(@RequestBody Map<String, Object> body) {
        return Map.of("result", confirmation.webhook(body));
    }

    @GetMapping("/{id}/status")
    public PayOSConfirmationService.Status status(@PathVariable Long id) {
        return confirmation.status(id); }

    @PostMapping("/{id}/reconcile")
    public PayOSConfirmationService.Status reconcile(@PathVariable Long id) {
        return confirmation.reconcile(id); }

    @ExceptionHandler(AccessDeniedException.class)
    ResponseEntity<?> denied() {
        return ResponseEntity.status(403).body(Map.of("error", "Access denied")); }

    @ExceptionHandler(IllegalArgumentException.class)
    ResponseEntity<?> invalid() {
        return ResponseEntity.badRequest().body(Map.of("error", "Invalid payment evidence")); }

    @ExceptionHandler(ResponseStatusException.class)
    ResponseEntity<?> statusError(ResponseStatusException ex) {
        return ResponseEntity.status(ex.getStatusCode()).body(Map.of("error", "Payment request unavailable"));
    }

    @ExceptionHandler(RuntimeException.class)
    ResponseEntity<?> temporaryFailure() {
        // Non-2xx: no acknowledgement of a failed commit; permit provider retry.
        return ResponseEntity.status(503).body(Map.of("error", "Payment requires retry or reconciliation"));
    }
}
