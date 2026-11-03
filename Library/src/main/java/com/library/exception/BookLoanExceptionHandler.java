package com.library.exception;

import com.library.controller.BookLoanController;
import com.library.payload.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/** Hãy tách biệt các sai sót trong hoạt động cho vay khỏi những sự cố hạ tầng bất ngờ. */
@RestControllerAdvice(assignableTypes = BookLoanController.class)
public class BookLoanExceptionHandler {

    @ExceptionHandler({BookException.class, SubscriptionException.class})
    public ResponseEntity<ApiResponse> businessError(Exception error) {
        return ResponseEntity.badRequest().body(new ApiResponse(error.getMessage(), false));
    }

    @ExceptionHandler({IllegalArgumentException.class, java.time.DateTimeException.class})
    public ResponseEntity<ApiResponse> invalidInput(Exception error) {
        return ResponseEntity.badRequest().body(new ApiResponse("Yêu cầu mượn hoặc trả sách không hợp lệ.", false));
    }
}
