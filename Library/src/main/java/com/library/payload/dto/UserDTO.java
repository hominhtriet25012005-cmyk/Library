package com.library.payload.dto;

import com.library.domain.UserRole;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserDTO {

    // ID user
    private Long id;

    // Không được rỗng
    // Phải đúng định dạng email
    // Tối đa 255 ký tự
    @NotBlank(message = "Cần có địa chỉ email.")
    @Email(message = "Địa chỉ email không hợp lệ.")
    @Size(max = 255, message = "Địa chỉ email không được vượt quá 255 ký tự.")
    private String email;

    // Password hiện đang nằm trong UserDTO
    // Đây là điểm mình khuyên tách sau này
    @NotBlank(message = "Yêu cầu nhập mật khẩu.")
    @Size(min = 8, max = 72, message = "Mật khẩu phải có từ 8 đến 72 ký tự.")
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @ToString.Exclude
    private String password;

    @Size(max = 30, message = "Số điện thoại không được vượt quá 30 ký tự.")
    private String phone;

    @NotBlank(message = "Họ và tên là bắt buộc.")
    @Size(max = 255, message = "Họ và tên không được vượt quá 255 ký tự.")
    private String fullName;

    private UserRole role;

    private String username;

    private LocalDateTime lastLogin;
}
