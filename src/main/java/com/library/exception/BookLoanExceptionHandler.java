package com.library.exception;

import com.library.controller.BookLoanController;
import com.library.payload.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/** Keep loan business errors separate from unexpected infrastructure failures. */
@RestControllerAdvice(assignableTypes = BookLoanController.class)
public class BookLoanExceptionHandler {

    @ExceptionHandler({BookException.class, SubscriptionException.class})
    public ResponseEntity<ApiResponse> businessError(Exception error) {
        return ResponseEntity.badRequest().body(new ApiResponse(error.getMessage(), false));
    }

    @ExceptionHandler({IllegalArgumentException.class, java.time.DateTimeException.class})
    public ResponseEntity<ApiResponse> invalidInput(Exception error) {
        return ResponseEntity.badRequest().body(new ApiResponse("Invalid loan request", false));
    }
}
