package com.library.service.impl;

import com.library.domain.NotificationEventType;
import com.library.model.EmailOutbox;
import com.library.model.User;
import com.library.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class VerificationEmailComposer {

    private final VerificationTokenCipher tokenCipher;
    private final EmailTemplateRenderer templateRenderer;
    private final UserRepository userRepository;

    @Value("${app.api.public-base-url:http://localhost:8000}")
    private String apiPublicBaseUrl;

    public String bodyFor(EmailOutbox outbox) {
        if (outbox.getEventType() != NotificationEventType.EMAIL_VERIFICATION) {
            return outbox.getBodyHtml();
        }
        String token = tokenCipher.decrypt(outbox.getBodyHtml());
        String baseUrl = apiPublicBaseUrl == null ? "" : apiPublicBaseUrl.replaceAll("/+$", "");
        String link = baseUrl + "/auth/verify-email?token=" + token;
        String fullName = outbox.getRecipient() == null ? null
                : userRepository.findById(outbox.getRecipient().getId()).map(User::getFullName).orElse(null);
        return templateRenderer.verificationBody(
                fullName == null || fullName.isBlank() ? "bạn đọc" : fullName, link);
    }
}
