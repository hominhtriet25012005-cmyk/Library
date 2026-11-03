package com.library.domain;

public enum FineStatus {

    PENDING,

    /**
     * Tiền phạt đã được thanh toán một phần
     */
    PARTIALLY_PAID,

    /**
     * Tiền phạt đã được thanh toán đầy đủ
     */
    PAID,

    /**
     * Khoản tiền phạt đã được một quản trị viên miễn bỏ
     */
    WAIVED
}
