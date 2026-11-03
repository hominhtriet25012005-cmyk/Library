package com.library.domain;

public enum PaymentStatus {

    PENDING,

    /**
     * Thanh toán đã được xử lý thành công
     */
    SUCCESS,

    /**
     * Thanh toán không thành công do không đủ số dư, thẻ bị từ chối, v.v.
     */
    FAILED,

    /**
     * Thanh toán đã bị người dùng hủy
     */
    CANCELLED,

    /**
     * Khoản thanh toán đã được hoàn lại
     */
    REFUNDED,

    /**
     * Thanh toán đang được cổng thanh toán xử lý
     */
    PROCESSING
}
