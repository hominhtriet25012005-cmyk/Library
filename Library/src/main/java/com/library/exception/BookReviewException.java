package com.library.exception;

public class BookReviewException extends Exception {
    private final org.springframework.http.HttpStatus status;

    public BookReviewException(String message) {
        this(message, org.springframework.http.HttpStatus.BAD_REQUEST);
    }

    public BookReviewException(String message, org.springframework.http.HttpStatus status) {
        super(message);
        this.status = status;
    }

    public org.springframework.http.HttpStatus getStatus() { return status; }
}
