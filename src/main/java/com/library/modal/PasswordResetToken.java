package com.library.modal;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "password_reset_tokens")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PasswordResetToken {

    // ID token
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Chuỗi token ngẫu nhiên
    @Column(nullable = false, unique = true, length = 255)
    private String token;

    // Token thuộc user nào
    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Token hết hạn lúc nào
    @Column(name = "expiry_date", nullable = false)
    private LocalDateTime expiryDate;

    // Nếu expiryDate < thời gian hiện tại
    // → token đã hết hạn
    public boolean isExpired() {
        return expiryDate == null || !expiryDate.isAfter(LocalDateTime.now());
    }

}
