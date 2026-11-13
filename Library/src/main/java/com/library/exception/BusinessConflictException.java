package com.library.exception;

/** Signals a business rule conflict with the current system state. */
public class BusinessConflictException extends RuntimeException {

    private final String errorCode;

    public BusinessConflictException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode;
    }
}
