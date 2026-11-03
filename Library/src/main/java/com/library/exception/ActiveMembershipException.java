package com.library.exception;

/** Không thể tạo hoặc kích hoạt đơn đăng ký thành viên mới khi một gói khác đang có hiệu lực. */
public class ActiveMembershipException extends IllegalStateException {
    public ActiveMembershipException() {

        super("Người dùng có tư cách thành viên đang hoạt động");
    }
}
