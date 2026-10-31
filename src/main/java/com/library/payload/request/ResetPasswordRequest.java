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

    @NotBlank(message = "Reset token is required")
    @Size(max = 255, message = "Reset token must not exceed 255 characters")
    private String token;

    @NotBlank(message = "Password is required")
    private String password;
}
