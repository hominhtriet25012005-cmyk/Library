package com.library.exception;

public class PendingMembershipPaymentException extends BusinessConflictException {
    private final Long paymentId;

    public PendingMembershipPaymentException(Long paymentId) {
        super("MEMBERSHIP_PAYMENT_PENDING", "Bạn đang có đơn thanh toán gói thành viên #" + paymentId
                + " chưa hoàn tất. Vui lòng kiểm tra đơn này trước khi mua gói khác. "
                + "Chỉ tạo đơn mới khi đơn cũ đã được xác nhận hủy hoặc thất bại.");
        this.paymentId = paymentId;
    }

    public Long getPaymentId() { return paymentId; }
}
