package com.library.payload.dto;

import com.library.domain.UserRole;
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
    @Size(max = 255)
    private String email;

    // Password hiện đang nằm trong UserDTO
    // Đây là điểm mình khuyên tách sau này
    @NotBlank(message = "Yêu cầu nhập mật khẩu.")
    @ToString.Exclude
    private String password;

    @Size(max = 30)
    private String phone;

    @NotBlank(message = "Họ và tên là bắt buộc.")
    @Size(max = 255)
    private String fullName;

    private UserRole role;

    private String username;

    private LocalDateTime lastLogin;
}
