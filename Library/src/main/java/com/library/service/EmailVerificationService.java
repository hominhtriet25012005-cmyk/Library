package com.library.service;

import com.library.model.User;

public interface EmailVerificationService {

    void issueForNewAccount(User user);

    void requestResend(String email);

    boolean verify(String rawToken);
}
