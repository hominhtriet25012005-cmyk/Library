package com.library.exception;

/** Lỗi dữ liệu đầu vào đã xác định, có thể trả thông báo cho người gửi yêu cầu. */
public class InvalidRequestException extends RuntimeException {
    private final String errorCode;

    public InvalidRequestException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode;
    }
}
