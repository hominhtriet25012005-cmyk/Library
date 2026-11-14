package com.library.repository;

import com.library.model.EmailVerificationToken;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface EmailVerificationTokenRepository
        extends JpaRepository<EmailVerificationToken, Long> {

    Optional<EmailVerificationToken> findByTokenHash(String tokenHash);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from EmailVerificationToken t join fetch t.user where t.tokenHash = :tokenHash")
    Optional<EmailVerificationToken> findByTokenHashForUpdate(@Param("tokenHash") String tokenHash);

    Optional<EmailVerificationToken> findTopByUser_IdOrderByCreatedAtDesc(Long userId);

    List<EmailVerificationToken> findByUser_IdAndConsumedAtIsNullAndRevokedAtIsNull(Long userId);

    @Modifying(flushAutomatically = true)
    @Query("update EmailVerificationToken t set t.revokedAt = :now "
            + "where t.user.id = :userId and t.consumedAt is null and t.revokedAt is null")
    int revokeUnusedByUserId(@Param("userId") Long userId, @Param("now") LocalDateTime now);
}
