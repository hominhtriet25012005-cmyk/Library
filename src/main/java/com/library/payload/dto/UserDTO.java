package com.library.payload.dto;

import com.library.domain.UserRole;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserDTO {

    private Long id;

    @NotNull(message = "Cần có địa chỉ email.")
    private String email;

    @NotNull(message = "Yêu cầu nhập mật khẩu.")
    private String password;

    private String phone;

    @NotNull(message = "Họ và tên là bắt buộc.")
    private String fullName;

    private UserRole role;

    private String username;

    private LocalDateTime lastLogin;
}
