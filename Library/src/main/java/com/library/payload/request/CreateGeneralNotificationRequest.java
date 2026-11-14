package com.library.payload.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateGeneralNotificationRequest {

    @NotBlank(message = "Khóa yêu cầu là bắt buộc.")
    @Pattern(
            regexp = "[A-Za-z0-9_-]{8,80}",
            message = "Khóa yêu cầu chỉ được chứa chữ, số, dấu gạch ngang hoặc gạch dưới.")
    private String requestKey;

    @NotBlank(message = "Tiêu đề thông báo là bắt buộc.")
    @Size(max = 200, message = "Tiêu đề thông báo không được vượt quá 200 ký tự.")
    private String title;

    @NotBlank(message = "Nội dung thông báo là bắt buộc.")
    @Size(max = 2000, message = "Nội dung thông báo không được vượt quá 2000 ký tự.")
    private String message;

    @Size(max = 500, message = "Đường dẫn thao tác không được vượt quá 500 ký tự.")
    @Pattern(
            regexp = "^$|^/(?!/).*$",
            message = "Đường dẫn thao tác phải là đường dẫn nội bộ bắt đầu bằng một dấu '/'.")
    private String actionUrl;

    /** Email remains opt-in per announcement; omitted fields default to in-app only. */
    private boolean sendEmail;
}
