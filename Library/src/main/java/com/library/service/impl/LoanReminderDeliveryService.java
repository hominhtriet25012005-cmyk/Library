package com.library.service.impl;

import com.library.domain.BookLoanStatus;
import com.library.domain.EmailOutboxStatus;
import com.library.domain.NotificationEventType;
import com.library.repository.BookLoanRepository;
import com.library.repository.EmailOutboxRepository;
import com.library.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class LoanReminderDeliveryService {
    private final EmailOutboxRepository outboxes;
    private final BookLoanRepository loans;
    private final EmailService emailService;
    private static final ZoneId BUSINESS_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    public static boolean supports(NotificationEventType type) {
        return type == NotificationEventType.LOAN_DUE_SOON || type == NotificationEventType.LOAN_DUE_TODAY;
    }

    @Transactional
    public void deliver(Long outboxId, String workerId) {
        var outbox = outboxes.findByIdAndLockedBy(outboxId, workerId).orElse(null);
        if (outbox == null || outbox.getStatus() != EmailOutboxStatus.PROCESSING) return;
        if (!supports(outbox.getEventType())) throw new IllegalArgumentException("Loan reminder required");
        var notification = outbox.getNotification();
        var loan = notification != null && "BOOK_LOAN".equals(notification.getSourceType())
                && notification.getSourceId() != null
                ? loans.findLockedById(notification.getSourceId()).orElse(null) : null;
        LocalDate today = LocalDate.now(BUSINESS_ZONE);
        LocalDate expectedDue = outbox.getEventType() == NotificationEventType.LOAN_DUE_SOON
                ? today.plusDays(3) : today;
        // The publisher includes the original due date in this immutable occurrence key.
        // Fail closed for legacy/missing metadata rather than send an obsolete reminder.
        String expectedKey = loan == null ? null : outbox.getEventType().name()
                + ":BOOK_LOAN:" + loan.getId() + ":U:" + outbox.getRecipient().getId()
                + ":DUE:" + loan.getDueDate();
        boolean current = loan != null && loan.getStatus() == BookLoanStatus.CHECKED_OUT
                && !loan.isReturnPending() && loan.getReturnDate() == null
                && Objects.equals(loan.getUser().getId(), outbox.getRecipient().getId())
                && expectedDue.equals(loan.getDueDate())
                && Objects.equals(expectedKey, notification.getDeduplicationKey());
        if (!current) {
            outbox.setStatus(EmailOutboxStatus.CANCELLED);
            outbox.setLastError("LOAN_REMINDER_OBSOLETE");
        } else {
            // Hold the same loan lock used by renewal until SMTP submission finishes.
            // A renewal committed first invalidates this reminder; a renewal arriving
            // during submission waits and completes after this send.
            emailService.sendEmail(outbox.getRecipientEmail(), outbox.getSubject(), outbox.getBodyHtml());
            outbox.setStatus(EmailOutboxStatus.SENT);
            outbox.setSentAt(LocalDateTime.now(BUSINESS_ZONE));
            outbox.setLastError(null);
        }
        outbox.setLockedAt(null);
        outbox.setLockedBy(null);
        outboxes.save(outbox);
    }
}
