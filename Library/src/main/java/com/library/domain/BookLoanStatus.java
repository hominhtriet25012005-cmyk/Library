package com.library.domain;

public enum BookLoanStatus {

    /**
     * Sách hiện đang được người dùng mượn.
     */
    CHECKED_OUT,

    /**
     * Sách đã được trả lại và việc mượn sách đã hoàn tất.
     */
    RETURNED,

    /**
     * Khoản vay đã quá hạn (đã qua ngày đến hạn mà chưa được hoàn trả)
     */
    OVERDUE,

    /**
     * Cuốn sách đã bị người dùng làm mất.
     */
    LOST,

    /**
     * Sách bị hư hại trong thời gian mượn.
     */
    DAMAGED

}
