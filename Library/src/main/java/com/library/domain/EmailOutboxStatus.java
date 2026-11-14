package com.library.domain;

public enum EmailOutboxStatus {
    PENDING,
    PROCESSING,
    SENT,
    FAILED,
    CANCELLED
}
