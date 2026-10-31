package com.library.exception;

public class InvalidBookCoverException extends RuntimeException {
    public InvalidBookCoverException(String message) {
        super(message);
    }
}
