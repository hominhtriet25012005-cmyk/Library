package com.library.domain;

public enum BookLoanType {

    /**
     * Thủ tục mượn sách thông thường (đã bắt đầu mượn sách)
     */
    CHECKOUT,

    /**
     * Gia hạn sách (kéo dài thời hạn trả sách)
     */
    RENEWAL,

    /**
     * Trả sách (nhập trả)
     */
    RETURN
}
