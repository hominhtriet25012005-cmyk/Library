package com.library;

import com.library.configurations.JwtProvider;
import com.library.domain.UserRole;
import com.library.model.User;
import com.library.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:notification_api;MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.sql.init.mode=never",
        "app.jwt.secret=notification-api-test-secret-with-at-least-32-bytes",
        "app.jwt.expiration-ms=60000",
        "app.initialize-admin=false",
        "payos.enabled=false",
        "payos.creation-enabled=false",
        "app.notifications.reminder-scan-delay-ms=3600000",
        "app.notifications.reminder-scan-initial-delay-ms=3600000",
        "app.reservations.expiry-scan-delay-ms=3600000",
        "app.reservations.expiry-scan-initial-delay-ms=3600000"
})
@AutoConfigureMockMvc
@Transactional
class NotificationApiH2IntegrationTests {

    private static final String ADMIN_EMAIL = "admin-notification-api@example.test";
    private static final String USER_ONE_EMAIL = "user-one-notification-api@example.test";
    private static final String USER_TWO_EMAIL = "user-two-notification-api@example.test";

    @Autowired private MockMvc mvc;
    @Autowired private UserRepository userRepository;
    @Autowired private JwtProvider jwtProvider;

    private User userOne;
    private User userTwo;

    @BeforeEach
    void createIsolatedAccounts() {
        saveUser(ADMIN_EMAIL, "ADMIN kiểm thử", UserRole.ROLE_ADMIN);
        userOne = saveUser(USER_ONE_EMAIL, "Bạn đọc một", UserRole.ROLE_USER);
        userTwo = saveUser(USER_TWO_EMAIL, "Bạn đọc hai", UserRole.ROLE_USER);
    }

    @Test
    void notificationPreferencesAreReadAndPersistedForTheAuthenticatedUser() throws Exception {
        String token = token(USER_ONE_EMAIL, UserRole.ROLE_USER);

        mvc.perform(get("/api/notifications/unread-count"))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/notifications/preferences").header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.emailDueReminder").value(true))
                .andExpect(jsonPath("$.emailAdminReturnRequests").value(true));

        mvc.perform(put("/api/notifications/preferences")
                        .header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"emailDueReminder\":false,\"emailOverdueAlert\":true,"
                                + "\"emailReservationUpdates\":false,\"emailMembershipUpdates\":true,"
                                + "\"emailGeneralAnnouncements\":false,\"emailAdminReturnRequests\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.emailDueReminder").value(false))
                .andExpect(jsonPath("$.emailGeneralAnnouncements").value(false));

        mvc.perform(get("/api/notifications/preferences").header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.emailDueReminder").value(false))
                .andExpect(jsonPath("$.emailGeneralAnnouncements").value(false));
    }

    @Test
    void adminAnnouncementFansOutOnceAndNotificationOwnershipIsEnforced() throws Exception {
        String body = "{\"requestKey\":\"announce-nt3-001\","
                + "\"title\":\"Thông báo kiểm thử\","
                + "\"message\":\"Nội dung chỉ dùng trong cơ sở dữ liệu kiểm thử.\","
                + "\"actionUrl\":\"/user\"}";
        mvc.perform(post("/api/admin/notifications/announcements")
                        .header("Authorization", token(USER_ONE_EMAIL, UserRole.ROLE_USER))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isForbidden());

        String adminToken = token(ADMIN_EMAIL, UserRole.ROLE_ADMIN);
        mvc.perform(post("/api/admin/notifications/announcements")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.recipientCount").value(2))
                .andExpect(jsonPath("$.storedCount").value(2));

        // Replaying the same request key must not add a second notification per recipient.
        mvc.perform(post("/api/admin/notifications/announcements")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.storedCount").value(2));

        MvcResult inboxResult = mvc.perform(get("/api/notifications?page=0&size=10")
                        .header("Authorization", token(USER_ONE_EMAIL, UserRole.ROLE_USER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].title").value("Thông báo kiểm thử"))
                .andReturn();
        long notificationId = com.fasterxml.jackson.databind.json.JsonMapper.builder().build()
                .readTree(inboxResult.getResponse().getContentAsString())
                .path("content").get(0).path("id").asLong();

        mvc.perform(patch("/api/notifications/{id}/read", notificationId)
                        .header("Authorization", token(USER_TWO_EMAIL, UserRole.ROLE_USER)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errorCode").value("NOTIFICATION_NOT_FOUND"));
        mvc.perform(patch("/api/notifications/{id}/read", notificationId)
                        .header("Authorization", token(USER_ONE_EMAIL, UserRole.ROLE_USER)))
                .andExpect(status().isOk());
        mvc.perform(get("/api/notifications/unread-count")
                        .header("Authorization", token(USER_ONE_EMAIL, UserRole.ROLE_USER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unreadCount").value(0));
        mvc.perform(get("/api/notifications/unread-count")
                        .header("Authorization", token(USER_TWO_EMAIL, UserRole.ROLE_USER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unreadCount").value(1));

        // Keep explicit references so the fixture setup remains clear and assertable.
        org.assertj.core.api.Assertions.assertThat(userOne.getId()).isNotEqualTo(userTwo.getId());
    }

    private User saveUser(String email, String name, UserRole role) {
        return userRepository.saveAndFlush(User.builder()
                .email(email)
                .fullName(name)
                .password("test-only-password")
                .role(role)
                .verified(true)
                .build());
    }

    private String token(String email, UserRole role) {
        return "Bearer " + jwtProvider.generateToken(new UsernamePasswordAuthenticationToken(
                email,
                null,
                List.of(new SimpleGrantedAuthority(role.name()))));
    }
}
