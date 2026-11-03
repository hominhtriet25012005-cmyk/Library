package com.library.service;

import com.library.exception.UserException;
import com.library.payload.dto.UserDTO;
import com.library.payload.response.AuthResponse;

public interface AuthService {

    AuthResponse login(String username, String password) throws UserException;

    AuthResponse signup(UserDTO req) throws UserException;

    // Tạo mã thông báo đặt lại mật khẩu
    void createPasswordResetToken(String email) throws UserException;

    void resetPassword(String token, String newPassword) throws Exception;
}
