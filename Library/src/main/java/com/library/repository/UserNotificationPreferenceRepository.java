package com.library.repository;

import com.library.model.UserNotificationPreference;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserNotificationPreferenceRepository
        extends JpaRepository<UserNotificationPreference, Long> {
}
