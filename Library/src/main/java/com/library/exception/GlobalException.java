package com.library.exception;

import com.library.payload.response.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

@RestControllerAdvice
public class GlobalException {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse> handleValidationException(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
                .map(org.springframework.context.support.DefaultMessageSourceResolvable::getDefaultMessage)
                .filter(java.util.Objects::nonNull)
                .findFirst()
                .orElse("Dữ liệu gửi lên không hợp lệ.");
        return ResponseEntity.badRequest().body(new ApiResponse(message, false));
    }

    @ExceptionHandler(UserException.class)
    public ResponseEntity<ApiResponse> handleUserException(UserException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse(e.getMessage(), false));
    }

    @ExceptionHandler(GenreException.class)
    public ResponseEntity<ApiResponse> handleGenreException(GenreException e){
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse(e.getMessage(), false));
    }

    @ExceptionHandler(BookException.class)
    public ResponseEntity<ApiResponse> handleBookException(BookException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse(e.getMessage(), false));
    }

    @ExceptionHandler(BookInUseException.class)
    public ResponseEntity<ApiResponse> handleBookInUseException(BookInUseException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ApiResponse(e.getMessage(), false));
    }

    @ExceptionHandler(InvalidBookCoverException.class)
    public ResponseEntity<ApiResponse> handleInvalidBookCover(InvalidBookCoverException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse(e.getMessage(), false));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiResponse> handleUploadTooLarge(MaxUploadSizeExceededException e) {
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(new ApiResponse("Ảnh bìa không được lớn hơn 5 MB.", false));
    }
}
