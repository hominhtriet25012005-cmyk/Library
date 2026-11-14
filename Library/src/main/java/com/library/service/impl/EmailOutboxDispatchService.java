package com.library.service.impl;

import com.library.domain.EmailOutboxStatus;
import com.library.model.EmailOutbox;
import com.library.repository.EmailOutboxRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class EmailOutboxDispatchService {

    private final EmailOutboxRepository outboxRepository;

    @Transactional
    public Optional<EmailOutbox> claimNext(String workerId, LocalDateTime now) {
        List<EmailOutbox> due = outboxRepository.findDueForUpdate(
                EmailOutboxStatus.PENDING, now, PageRequest.of(0, 1));
        if (due.isEmpty()) return Optional.empty();

        EmailOutbox outbox = due.get(0);
        outbox.setStatus(EmailOutboxStatus.PROCESSING);
        outbox.setLockedAt(now);
        outbox.setLockedBy(workerId);
        outbox.setLastAttemptAt(now);
        outbox.setAttemptCount(outbox.getAttemptCount() + 1);
        return Optional.of(outboxRepository.saveAndFlush(outbox));
    }

    @Transactional
    public void markSent(Long outboxId, String workerId, LocalDateTime now) {
        outboxRepository.findByIdAndLockedBy(outboxId, workerId).ifPresent(outbox -> {
            if (outbox.getStatus() != EmailOutboxStatus.PROCESSING) return;
            outbox.setStatus(EmailOutboxStatus.SENT);
            outbox.setSentAt(now);
            outbox.setLockedAt(null);
            outbox.setLockedBy(null);
            outbox.setLastError(null);
            outboxRepository.save(outbox);
        });
    }

    @Transactional
    public void markFailed(Long outboxId, String workerId, RuntimeException failure, LocalDateTime now) {
        outboxRepository.findByIdAndLockedBy(outboxId, workerId).ifPresent(outbox -> {
            if (outbox.getStatus() != EmailOutboxStatus.PROCESSING) return;
            int attempt = outbox.getAttemptCount() == null ? 1 : outbox.getAttemptCount();
            int maxAttempts = outbox.getMaxAttempts() == null ? 4 : outbox.getMaxAttempts();
            outbox.setLastError("EMAIL_SEND_FAILED:" + failure.getClass().getSimpleName());
            outbox.setLockedAt(null);
            outbox.setLockedBy(null);
            if (attempt >= maxAttempts) {
                outbox.setStatus(EmailOutboxStatus.FAILED);
            } else {
                outbox.setStatus(EmailOutboxStatus.PENDING);
                outbox.setNextAttemptAt(now.plusMinutes(retryDelayMinutes(attempt)));
            }
            outboxRepository.save(outbox);
        });
    }

    @Transactional
    public int recoverStaleProcessing(LocalDateTime now, int batchSize) {
        LocalDateTime cutoff = now.minusMinutes(10);
        List<EmailOutbox> stale = outboxRepository.findByStatusAndLockedAtBeforeOrderByLockedAtAsc(
                EmailOutboxStatus.PROCESSING, cutoff, PageRequest.of(0, batchSize));
        for (EmailOutbox outbox : stale) {
            int attempt = outbox.getAttemptCount() == null ? 0 : outbox.getAttemptCount();
            int maxAttempts = outbox.getMaxAttempts() == null ? 4 : outbox.getMaxAttempts();
            outbox.setLastError("EMAIL_WORKER_INTERRUPTED");
            outbox.setLockedAt(null);
            outbox.setLockedBy(null);
            if (attempt >= maxAttempts) {
                outbox.setStatus(EmailOutboxStatus.FAILED);
            } else {
                outbox.setStatus(EmailOutboxStatus.PENDING);
                outbox.setNextAttemptAt(now);
            }
        }
        outboxRepository.saveAll(stale);
        return stale.size();
    }

    private long retryDelayMinutes(int failedAttempt) {
        return switch (failedAttempt) {
            case 1 -> 1;
            case 2 -> 5;
            default -> 15;
        };
    }
}
