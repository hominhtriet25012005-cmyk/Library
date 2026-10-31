package com.library.payload.response;

import com.library.payload.dto.UserDTO;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponse {

    private String jwt; // Token frontend dùng cho request tiếp theo

    private String message; // Thông báo

    private String title;  // Tiêu đề thông báo

    private UserDTO user; // Thông tin user
}
