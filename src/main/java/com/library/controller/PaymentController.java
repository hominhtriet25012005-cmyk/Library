package com.library.controller;

import com.library.payload.dto.PaymentDTO;
import com.library.payload.response.ApiResponse;
import com.library.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Set;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/payments")
public class PaymentController {

    private static final Set<String> PAYMENT_SORT_FIELDS = Set.of(
            "id", "createdAt", "amount", "status", "paymentType", "gateway", "currency");
    private static final int MAX_PAGE_SIZE = 100;

    private final PaymentService paymentService;

    @PostMapping("/verify")
    public ResponseEntity<?> verifyPayment() {
        return ResponseEntity.status(HttpStatus.GONE)
                .body(new ApiResponse("Legacy verification retired; use verified payOS webhook or reconciliation", false));
    }

    @GetMapping
    public ResponseEntity<?> getAllPayments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {

        if (page < 0 || size < 1 || size > MAX_PAGE_SIZE || !PAYMENT_SORT_FIELDS.contains(sortBy)
                || (!sortDir.equalsIgnoreCase("ASC") && !sortDir.equalsIgnoreCase("DESC"))) {
            return ResponseEntity.badRequest().body(new ApiResponse("Invalid payment history paging or sort", false));
        }

        Sort sort = sortDir.equalsIgnoreCase("DESC")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<PaymentDTO> payments = paymentService.getAllPayments(pageable);
        return ResponseEntity.ok(payments);
    }


}
