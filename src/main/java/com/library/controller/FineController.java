package com.library.controller;

import com.library.domain.FineStatus;
import com.library.domain.FineType;
import com.library.payload.dto.FineDTO;
import com.library.payload.request.CreateFineRequest;
import com.library.payload.request.WaiveFineRequest;
import com.library.payload.response.PageResponse;
import com.library.payload.response.PaymentInitiateResponse;
import com.library.service.FineService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/fines")
public class FineController {

    private final FineService fineService;

    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    ResponseEntity<?> denied() {
        return ResponseEntity.status(403).body(java.util.Map.of("error", "Fine access denied"));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    ResponseEntity<?> invalid() {
        return ResponseEntity.badRequest().body(java.util.Map.of("error", "Invalid fine payment request"));
    }

    @ExceptionHandler(IllegalStateException.class)
    ResponseEntity<?> unavailable() {
        return ResponseEntity.status(409).body(java.util.Map.of("error", "Fine payment unavailable; reconciliation may be required"));
    }

    @PostMapping
    public ResponseEntity<?> createFine(
            @Valid @RequestBody CreateFineRequest fineRequest
    ) throws Exception {
        FineDTO fineDTO = fineService.createFine(fineRequest);
        return ResponseEntity.ok(fineDTO);
    }

    @PostMapping("/{id}/pay")
    public ResponseEntity<?> payFine(
            @PathVariable Long id,
            @RequestParam(required = false) String transactionId
    ) throws Exception {
        PaymentInitiateResponse res = fineService.payFine(id, transactionId);
        return ResponseEntity.ok(res);
    }

    @PostMapping("/waive")
    public ResponseEntity<?> waiveFine(
            @Valid @RequestBody WaiveFineRequest waiveFineRequest
    ) throws Exception {
        FineDTO fineDTO = fineService.waiveFine(waiveFineRequest);
        return ResponseEntity.ok(fineDTO);
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMyFines(
            @RequestParam(required = false) FineStatus status,
            @RequestParam(required = false) FineType type
    ) throws Exception {
        List<FineDTO> fines = fineService.getMyFines(status, type);
        return ResponseEntity.ok(fines);
    }

    @GetMapping
    public ResponseEntity<?> getAllFines(
            @RequestParam(required = false) FineStatus status,
            @RequestParam(required = false) FineType type,
            @RequestParam(required = false) Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        if (page < 0 || size < 1 || size > 100 || (userId != null && userId < 1)) {
            throw new IllegalArgumentException("Invalid fine search paging or user ID");
        }

        PageResponse<FineDTO> fines = fineService
                .getAllFines(status, type, userId, page, size);
        return ResponseEntity.ok(fines);
    }
}
