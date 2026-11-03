package com.library.payload.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ResetPasswordRequest {

    @NotBlank(message = "Cần có mã thông báo đặt lại")
    @Size(max = 255, message = "Mã đặt lại không được vượt quá 255 ký tự")
    private String token;

    @NotBlank(message = "Cần có mật khẩu")
    @Size(min = 8, max = 72, message = "Mật khẩu phải có từ 8 đến 72 ký tự.")
    private String password;
}
