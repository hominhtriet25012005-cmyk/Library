package com.library.exception;

public class InvalidSubscriptionPlanCreationException extends RuntimeException {
    public static final String ERROR_CODE = "SUBSCRIPTION_PLAN_ID_NOT_ALLOWED";

    public InvalidSubscriptionPlanCreationException() {
        super("Không được gửi ID khi tạo gói thành viên mới. Vui lòng dùng chức năng sửa nếu muốn cập nhật gói đã tồn tại.");
    }
}
