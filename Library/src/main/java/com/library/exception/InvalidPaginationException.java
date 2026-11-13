package com.library.exception;

/** Signals invalid page, size, or sorting parameters in a paged API request. */
public class InvalidPaginationException extends RuntimeException {

    public static final String ERROR_CODE = "INVALID_PAGINATION_REQUEST";

    public InvalidPaginationException(String message) {
        super(message);
    }
}
