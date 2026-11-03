package com.library.domain;

public enum ReservationStatus {

    /**
     * Đặt chỗ đã được kích hoạt và đang chờ sách có sẵn
     */
    PENDING,

    /**
     * Sách hiện đã có sẵn và người dùng đã được thông báo
     */
    AVAILABLE,

    /**
     * Người dùng đã mượn cuốn sách được đặt trước
     */
    FULFILLED,

    /**
     * Người dùng đã hủy đặt chỗ
     */
    CANCELLED,

    /**
     * Đơn đặt chỗ đã hết hạn (người dùng không đến nhận trong thời hạn quy định)
     */
    EXPIRED
}
