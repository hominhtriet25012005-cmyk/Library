package com.library.controller;

import com.library.exception.UserException;
import com.library.payload.dto.UserDTO;
import com.library.payload.request.ForgotPasswordRequest;
import com.library.payload.request.LoginRequest;
import com.library.payload.request.ResetPasswordRequest;
import com.library.payload.response.ApiResponse;
import com.library.payload.response.AuthResponse;
import com.library.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signupHandler(
            @Valid @RequestBody UserDTO req
    ) throws UserException {
        AuthResponse res = authService.signup(req);
        return ResponseEntity.ok(res);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> loginHandler(
            @Valid @RequestBody LoginRequest req
    ) throws UserException {
        AuthResponse res = authService.login(req.getEmail(), req.getPassword());
        return ResponseEntity.ok(res);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request
    ) throws UserException {

        authService.createPasswordResetToken(request.getEmail());

        ApiResponse res = new ApiResponse(
                "Nếu email tồn tại, hướng dẫn đặt lại mật khẩu sẽ được gửi.",
                true
        );

        return ResponseEntity.ok(res);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) throws Exception {
        authService.resetPassword(request.getToken(), request.getPassword());
        ApiResponse res = new ApiResponse(
                "Đặt lại mật khẩu thành công",
                true
        );
        return ResponseEntity.ok(res);
    }
}
