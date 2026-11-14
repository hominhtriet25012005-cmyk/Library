package com.library.payload.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateNotificationPreferencesRequest {

    @NotNull(message = "Cần chọn nhận hoặc không nhận email nhắc hạn trả sách.")
    private Boolean emailDueReminder;

    @NotNull(message = "Cần chọn nhận hoặc không nhận email cảnh báo quá hạn.")
    private Boolean emailOverdueAlert;

    @NotNull(message = "Cần chọn nhận hoặc không nhận email cập nhật đặt giữ.")
    private Boolean emailReservationUpdates;

    @NotNull(message = "Cần chọn nhận hoặc không nhận email cập nhật gói thành viên.")
    private Boolean emailMembershipUpdates;

    @NotNull(message = "Cần chọn nhận hoặc không nhận email thông báo chung.")
    private Boolean emailGeneralAnnouncements;

    @NotNull(message = "Cần chọn nhận hoặc không nhận email yêu cầu trả sách dành cho ADMIN.")
    private Boolean emailAdminReturnRequests;
}
