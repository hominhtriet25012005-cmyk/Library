package com.library.service.impl;

import com.library.domain.UserRole;
import com.library.modal.User;
import com.library.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.Locale;

@Component
@ConditionalOnProperty(name = "app.initialize-admin", havingValue = "true", matchIfMissing = false)
@RequiredArgsConstructor
public class DataInitializationComponent implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email:}")
    private String adminEmail;

    @Value("${app.admin.password:}")
    private String adminPassword;

    @Value("${app.admin.full-name:Library Administrator}")
    private String adminFullName;

    @Override
    public void run(String... args) {
        initializeAdminUser();
    }

    private void initializeAdminUser() {
        validateAdminConfiguration();

        String normalizedEmail = adminEmail.trim().toLowerCase(Locale.ROOT);
        String normalizedFullName = StringUtils.hasText(adminFullName)
                ? adminFullName.trim()
                : "Library Administrator";

        User existingUser = userRepository.findByEmail(normalizedEmail);
        if (existingUser != null) {
            if (existingUser.getRole() != UserRole.ROLE_ADMIN) {
                throw new IllegalStateException(
                        "ADMIN_EMAIL already belongs to " + existingUser.getRole()
                                + "; refusing to promote it silently to ROLE_ADMIN"
                );
            }
            return;
        }

        User user = User.builder()
                .password(passwordEncoder.encode(adminPassword))
                .email(normalizedEmail)
                .fullName(normalizedFullName)
                .role(UserRole.ROLE_ADMIN)
                .build();

        userRepository.save(user);
    }

    private void validateAdminConfiguration() {
        if (!StringUtils.hasText(adminEmail) || !StringUtils.hasText(adminPassword)) {
            throw new IllegalStateException(
                    "APP_INITIALIZE_ADMIN=true requires both ADMIN_EMAIL and ADMIN_PASSWORD"
            );
        }
        if (adminPassword.length() < 8) {
            throw new IllegalStateException("ADMIN_PASSWORD must contain at least 8 characters");
        }
    }
}
