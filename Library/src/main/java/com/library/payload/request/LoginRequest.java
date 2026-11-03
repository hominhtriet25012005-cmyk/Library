package com.library.payload.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class LoginRequest {

    @NotNull(message = "Bắt buộc phải nhập tên người dùng hoặc email.")
    private String email;

    @NotNull(message = "Yêu cầu nhập mật khẩu.")
    private String password;
}
