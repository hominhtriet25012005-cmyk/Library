package com.library.exception;

import com.library.controller.BookReviewController;
import com.library.payload.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice(assignableTypes = BookReviewController.class)
public class BookReviewExceptionHandler {
    @ExceptionHandler(BookReviewException.class)
    public ResponseEntity<ApiResponse> businessError(BookReviewException error) {
        return ResponseEntity.status(error.getStatus())
                .body(new ApiResponse(error.getMessage(), false));
    }

    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<ApiResponse> denied() {
        return ResponseEntity.status(403)
                .body(new ApiResponse("Review access denied", false));
    }
}
