package com.library.domain;

public enum PaymentType {

    FINE, MEMBERSHIP,
    LOST_BOOK_PENALTY,

    /**
     * Thanh toán tiền phạt do làm hỏng sách
     */
    DAMAGED_BOOK_PENALTY,
}
