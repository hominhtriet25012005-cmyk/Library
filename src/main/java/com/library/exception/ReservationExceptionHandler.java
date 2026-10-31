package com.library.exception;

import com.library.controller.ReservationController;
import com.library.payload.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice(assignableTypes = ReservationController.class)
public class ReservationExceptionHandler {
    @ExceptionHandler({ReservationException.class, BookException.class, SubscriptionException.class})
    public ResponseEntity<ApiResponse> businessError(Exception error) {
        return ResponseEntity.badRequest().body(new ApiResponse(error.getMessage(), false));
    }
    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<ApiResponse> denied() {
        return ResponseEntity.status(403).body(new ApiResponse("Reservation access denied", false));
    }
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse> invalidRequest() {
        return ResponseEntity.badRequest().body(new ApiResponse("Invalid reservation request", false));
    }
}
