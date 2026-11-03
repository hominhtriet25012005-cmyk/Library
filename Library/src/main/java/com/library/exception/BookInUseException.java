package com.library.exception;

public class BookInUseException extends BookException {
    public BookInUseException(String message) {

        super(message);
    }
}
