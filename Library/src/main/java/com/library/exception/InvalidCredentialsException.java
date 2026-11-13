package com.library.exception;

public class InvalidCredentialsException extends RuntimeException {

    public static final String MESSAGE = "Email hoặc mật khẩu không chính xác.";
    public static final String ERROR_CODE = "AUTH_INVALID_CREDENTIALS";

    public InvalidCredentialsException() {
        super(MESSAGE);
    }
}
