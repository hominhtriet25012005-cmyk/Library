package com.library.service.impl;

import com.library.model.EmailVerificationToken;
import com.library.model.User;
import com.library.repository.EmailVerificationTokenRepository;
import com.library.repository.UserRepository;
import com.library.service.EmailVerificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class EmailVerificationServiceImpl implements EmailVerificationService {

    private static final ZoneId BUSINESS_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final Pattern TOKEN_PATTERN = Pattern.compile("[A-Za-z0-9_-]{43}");
    private static final long RESEND_DELAY_SECONDS = 60;

    private final UserRepository userRepository;
    private final EmailVerificationTokenRepository tokenRepository;
    private final EmailOutboxEnqueueService outboxEnqueueService;
    private final SecureRandom secureRandom = new SecureRandom();

    @Override
    @Transactional
    public void issueForNewAccount(User user) {
        if (user == null || user.getId() == null || Boolean.TRUE.equals(user.getVerified())) return;
        issueToken(user, now());
    }

    @Override
    @Transactional
    public void requestResend(String email) {
        if (email == null || email.isBlank()) return;
        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        User user = userRepository.findByEmailForUpdate(normalizedEmail).orElse(null);
        if (user == null || Boolean.TRUE.equals(user.getVerified())) return;

        LocalDateTime now = now();
        var latestToken = tokenRepository.findTopByUser_IdOrderByCreatedAtDesc(user.getId());
        if (latestToken.isPresent() && latestToken.get().getCreatedAt() != null
                && latestToken.get().getCreatedAt().isAfter(now.minusSeconds(RESEND_DELAY_SECONDS))) {
            return;
        }
        issueToken(user, now);
    }

    @Override
    @Transactional
    public boolean verify(String rawToken) {
        if (rawToken == null || !TOKEN_PATTERN.matcher(rawToken).matches()) return false;
        String tokenHash = sha256(rawToken);
        EmailVerificationToken observed = tokenRepository.findByTokenHash(tokenHash).orElse(null);
        if (observed == null || observed.getUser() == null || observed.getUser().getId() == null) return false;
        User lockedUser = userRepository.findLockedById(observed.getUser().getId()).orElse(null);
        if (lockedUser == null) return false;
        EmailVerificationToken token = tokenRepository.findByTokenHashForUpdate(tokenHash).orElse(null);
        if (token == null || token.getConsumedAt() != null || token.getRevokedAt() != null) return false;

        LocalDateTime now = now();
        if (token.getExpiresAt() == null || !token.getExpiresAt().isAfter(now)) return false;

        User user = lockedUser;
        if (Boolean.TRUE.equals(user.getVerified())) {
            token.setConsumedAt(now);
            tokenRepository.save(token);
            return true;
        }
        user.setVerified(true);
        token.setConsumedAt(now);
        userRepository.save(user);
        tokenRepository.save(token);
        cancelOtherPendingVerificationEmails(user.getId(), token.getId());
        tokenRepository.revokeUnusedByUserId(user.getId(), now);
        return true;
    }

    private void issueToken(User user, LocalDateTime now) {
        cancelOtherPendingVerificationEmails(user.getId(), null);
        tokenRepository.revokeUnusedByUserId(user.getId(), now);
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        EmailVerificationToken token = tokenRepository.saveAndFlush(EmailVerificationToken.builder()
                .user(user)
                .tokenHash(sha256(rawToken))
                .expiresAt(now.plusHours(24))
                .build());
        outboxEnqueueService.enqueueVerificationEmail(token, rawToken);
    }

    private void cancelOtherPendingVerificationEmails(Long userId, Long keepTokenId) {
        for (EmailVerificationToken previous : tokenRepository
                .findByUser_IdAndConsumedAtIsNullAndRevokedAtIsNull(userId)) {
            if (keepTokenId == null || !previous.getId().equals(keepTokenId)) {
                outboxEnqueueService.cancelVerificationEmail(previous.getTokenHash());
            }
        }
    }

    private LocalDateTime now() {
        return LocalDateTime.now(BUSINESS_ZONE);
    }

    private String sha256(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("Không thể tạo mã xác minh email.", exception);
        }
    }
}
