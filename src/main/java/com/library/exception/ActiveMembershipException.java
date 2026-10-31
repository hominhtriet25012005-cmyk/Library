package com.library.exception;

/** A new membership order cannot be created or activated while another plan is active. */
public class ActiveMembershipException extends IllegalStateException {
    public ActiveMembershipException() {

        super("Người dùng có tư cách thành viên đang hoạt động");
    }
}
