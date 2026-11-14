package com.library.service.impl;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.Mac;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;

/** Encrypts the one-time verification bearer token before it is stored in the email outbox. */
@Component
public class VerificationTokenCipher {

    private static final String PREFIX = "encrypted-token:v1:";
    private static final int IV_LENGTH = 12;
    private static final int TAG_LENGTH_BITS = 128;
    private static final byte[] KEY_CONTEXT =
            "library-email-verification-outbox-v1".getBytes(StandardCharsets.UTF_8);

    private final SecureRandom secureRandom = new SecureRandom();
    private final byte[] jwtSecret;

    public VerificationTokenCipher(@Value("${app.jwt.secret:}") String jwtSecret) {
        this.jwtSecret = jwtSecret == null ? new byte[0] : jwtSecret.getBytes(StandardCharsets.UTF_8);
    }

    public String encrypt(String token) {
        try {
            byte[] iv = new byte[IV_LENGTH];
            secureRandom.nextBytes(iv);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, key(), new GCMParameterSpec(TAG_LENGTH_BITS, iv));
            byte[] encrypted = cipher.doFinal(token.getBytes(StandardCharsets.UTF_8));
            byte[] packed = new byte[iv.length + encrypted.length];
            System.arraycopy(iv, 0, packed, 0, iv.length);
            System.arraycopy(encrypted, 0, packed, iv.length, encrypted.length);
            return PREFIX + Base64.getUrlEncoder().withoutPadding().encodeToString(packed);
        } catch (Exception exception) {
            throw new IllegalStateException("Không thể bảo vệ mã xác minh email trong hàng đợi.", exception);
        }
    }

    public String decrypt(String ciphertext) {
        if (ciphertext == null || !ciphertext.startsWith(PREFIX)) {
            throw new IllegalArgumentException("Nội dung xác minh email trong hàng đợi không hợp lệ.");
        }
        try {
            byte[] packed = Base64.getUrlDecoder().decode(ciphertext.substring(PREFIX.length()));
            if (packed.length <= IV_LENGTH) {
                throw new IllegalArgumentException("Nội dung mã hóa quá ngắn.");
            }
            byte[] iv = Arrays.copyOfRange(packed, 0, IV_LENGTH);
            byte[] encrypted = Arrays.copyOfRange(packed, IV_LENGTH, packed.length);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, key(), new GCMParameterSpec(TAG_LENGTH_BITS, iv));
            return new String(cipher.doFinal(encrypted), StandardCharsets.UTF_8);
        } catch (Exception exception) {
            throw new IllegalStateException("Không thể giải mã mã xác minh email đang chờ.", exception);
        }
    }

    private SecretKeySpec key() throws Exception {
        if (jwtSecret.length < 32) {
            throw new IllegalStateException("JWT_SECRET phải có ít nhất 32 byte để bảo vệ hàng đợi email.");
        }
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(jwtSecret, "HmacSHA256"));
        return new SecretKeySpec(mac.doFinal(KEY_CONTEXT), "AES");
    }
}
