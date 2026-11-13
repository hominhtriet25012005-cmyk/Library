package com.library.exception;

import com.library.payload.response.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

@RestControllerAdvice
public class GlobalException {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse> handleResourceNotFound(ResourceNotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ApiResponse(e.getMessage(), false, e.getErrorCode()));
    }

    @ExceptionHandler(BusinessConflictException.class)
    public ResponseEntity<ApiResponse> handleBusinessConflict(BusinessConflictException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ApiResponse(e.getMessage(), false, e.getErrorCode()));
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ApiResponse> handleInvalidCredentials(InvalidCredentialsException e) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ApiResponse(
                        InvalidCredentialsException.MESSAGE,
                        false,
                        InvalidCredentialsException.ERROR_CODE));
    }

    @ExceptionHandler(InvalidPaginationException.class)
    public ResponseEntity<ApiResponse> handleInvalidPagination(InvalidPaginationException e) {
        return ResponseEntity.badRequest()
                .body(new ApiResponse(e.getMessage(), false, InvalidPaginationException.ERROR_CODE));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiResponse> handleRequestParameterTypeMismatch(MethodArgumentTypeMismatchException e) {
        String parameter = e.getName();
        if ("page".equals(parameter)) {
            return ResponseEntity.badRequest().body(new ApiResponse(
                    "Số trang phải là số nguyên lớn hơn hoặc bằng 0.",
                    false,
                    InvalidPaginationException.ERROR_CODE));
        }
        if ("size".equals(parameter)) {
            return ResponseEntity.badRequest().body(new ApiResponse(
                    "Số dòng mỗi trang phải là số nguyên từ 1 đến 100.",
                    false,
                    InvalidPaginationException.ERROR_CODE));
        }
        return ResponseEntity.badRequest().body(new ApiResponse(
                "Tham số yêu cầu không hợp lệ.", false, "INVALID_REQUEST"));
    }

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

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse> handleDataIntegrityViolation(DataIntegrityViolationException e) {
        Throwable cause = e;
        while (cause.getCause() != null && cause.getCause() != cause) {
            cause = cause.getCause();
        }
        String detail = cause == null || cause.getMessage() == null
                ? "" : cause.getMessage().toLowerCase(java.util.Locale.ROOT);
        String message;
        String errorCode;
        if (detail.contains("uq_fines_book_loan_type")) {
            message = "Khoản phạt cùng loại đã tồn tại cho lượt mượn này.";
            errorCode = "FINE_ALREADY_EXISTS";
        } else if (detail.contains("uq_subscription_plans_plan_code")) {
            message = "Mã gói đã tồn tại.";
            errorCode = "SUBSCRIPTION_PLAN_CODE_EXISTS";
        } else {
            message = "Dữ liệu bị trùng hoặc vi phạm ràng buộc toàn vẹn.";
            errorCode = "DATA_INTEGRITY_CONFLICT";
        }

        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ApiResponse(message, false, errorCode));
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
