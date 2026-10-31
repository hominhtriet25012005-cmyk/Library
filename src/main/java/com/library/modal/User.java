package com.library.modal;

import com.library.domain.AuthProvider;
import com.library.domain.UserRole;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import org.hibernate.annotations.JdbcTypeCode;
import java.sql.Types;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Column;
import jakarta.persistence.Table;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "users") // Entity User ánh xạ tới bảng users trong MySQL
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class User {

    // id là khóa chính
    // AUTO_INCREMENT trong MySQL
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Email bắt buộc
    // Không được trùng giữa 2 user
    @Column(nullable = false, unique = true, length = 255)
    private String email;

    // Java dùng fullName
    // MySQL dùng full_name
    @Column(name = "full_name", nullable = false, length = 255)
    private String fullName;

    // Lưu ROLE_USER hoặc ROLE_ADMIN dưới dạng String
    // Không lưu số 0, 1
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(Types.VARCHAR)
    @Column(nullable = false, length = 20)
    private UserRole role;

    // Mật khẩu trong database
    // Khi signup sẽ được BCrypt hash trước khi lưu
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;

    // Số điện thoại
    // Nên đổi tên field từ Phone → phone cho đúng quy ước Java
    @Column(name = "phone", length = 30)
    private String phone;

    // Cho biết user đăng nhập bằng LOCAL hay GOOGLE
    // Mặc định hiện tại là LOCAL
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(Types.VARCHAR)
    @Column(name = "auth_provider", nullable = false, length = 20)
    @Builder.Default
    private AuthProvider authProvider = AuthProvider.LOCAL;

    // Dùng nếu sau này hỗ trợ Google Login
    @Column(name = "google_id", length = 255)
    private String googleId;

    // URL avatar/profile image
    @Column(name = "profile_image", length = 500)
    private String profileImage;

    // Trạng thái xác minh user
    // Mặc định false
    @Column(nullable = false)
    @Builder.Default
    private Boolean verified = false;

    // Lần đăng nhập gần nhất
    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    // Hibernate tự gán thời gian khi INSERT
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // Hibernate tự cập nhật khi UPDATE
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;



}
