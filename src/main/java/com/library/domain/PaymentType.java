package com.library.domain;

public enum PaymentType {

    FINE, MEMBERSHIP,
    LOST_BOOK_PENALTY,

    /**
     * Payment for damaged book penalty
     */
    DAMAGED_BOOK_PENALTY,
}
