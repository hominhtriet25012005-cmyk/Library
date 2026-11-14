package com.library.service.impl;

import com.library.model.EmailOutbox;
import com.library.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.email.outbox.enabled", havingValue = "true")
public class EmailOutboxScheduler {

    private final EmailOutboxDispatchService dispatchService;
    private final EmailService emailService;
    private final VerificationEmailComposer verificationEmailComposer;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    @Value("${app.email.outbox.batch-size:10}")
    private int batchSize;

    private final String workerId = "library-mail-" + UUID.randomUUID();
    private static final ZoneId BUSINESS_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    @PostConstruct
    void validateSmtpConfiguration() {
        if (mailUsername == null || mailUsername.isBlank()
                || mailPassword == null || mailPassword.isBlank()) {
            throw new IllegalStateException(
                    "MAIL_USERNAME và MAIL_PASSWORD phải được cấu hình khi bật email outbox.");
        }
        if (batchSize < 1 || batchSize > 100) {
            throw new IllegalStateException("app.email.outbox.batch-size phải nằm trong khoảng 1–100.");
        }
    }

    @Scheduled(fixedDelayString = "${app.email.outbox.poll-delay-ms:5000}")
    public void dispatchDueEmails() {
        LocalDateTime now = LocalDateTime.now(BUSINESS_ZONE);
        dispatchService.recoverStaleProcessing(now, batchSize);
        for (int index = 0; index < batchSize; index++) {
            EmailOutbox outbox = dispatchService.claimNext(workerId, LocalDateTime.now(BUSINESS_ZONE)).orElse(null);
            if (outbox == null) return;
            try {
                String body = verificationEmailComposer.bodyFor(outbox);
                emailService.sendEmail(outbox.getRecipientEmail(), outbox.getSubject(), body);
                dispatchService.markSent(outbox.getId(), workerId, LocalDateTime.now(BUSINESS_ZONE));
            } catch (RuntimeException failure) {
                dispatchService.markFailed(outbox.getId(), workerId, failure,
                        LocalDateTime.now(BUSINESS_ZONE));
            }
        }
    }
}
