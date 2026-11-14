package com.library.configurations;

import com.library.controller.AdminNotificationController;
import com.library.controller.NotificationController;
import com.library.domain.NotificationEventType;
import com.library.domain.UserRole;
import com.library.exception.GlobalException;
import com.library.model.User;
import com.library.payload.dto.NotificationDTO;
import com.library.payload.dto.NotificationPreferencesDTO;
import com.library.payload.response.PageResponse;
import com.library.repository.UserRepository;
import com.library.service.NotificationPublisher;
import com.library.service.NotificationService;
import com.library.service.UserService;
import jakarta.servlet.Filter;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.mock.web.MockServletContext;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.support.AnnotationConfigWebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class NotificationHttpApiTests {

    @Configuration
    @EnableWebMvc
    @EnableWebSecurity
    @Import({SecurityConfig.class, GlobalException.class, NotificationController.class,
            AdminNotificationController.class, SecurityTestSupport.Beans.class})
    static class Config {
        @Bean NotificationService notifications() { return mock(NotificationService.class); }
        @Bean NotificationPublisher publisher() { return mock(NotificationPublisher.class); }
        @Bean UserRepository users() { return mock(UserRepository.class); }
        @Bean UserService userService() { return mock(UserService.class); }
    }

    private AnnotationConfigWebApplicationContext context;
    private MockMvc mvc;

    @BeforeEach
    void setup() {
        context = new AnnotationConfigWebApplicationContext();
        SecurityTestSupport.configure(context);
        context.setServletContext(new MockServletContext());
        context.register(Config.class);
        context.refresh();
        mvc = MockMvcBuilders.webAppContextSetup(context)
                .addFilters(context.getBean("springSecurityFilterChain", Filter.class))
                .build();
    }

    @AfterEach
    void close() {
        context.close();
    }

    private String token(String role) {
        return SecurityTestSupport.token(role);
    }

    @Test
    void notificationInboxRequiresAuthenticationAndForwardsUserFilters() throws Exception {
        NotificationService service = context.getBean(NotificationService.class);
        when(service.getMyNotifications(true, 2, 10))
                .thenReturn(new PageResponse<>(List.of(), 2, 10, 0, 0, true, false, true));

        mvc.perform(get("/api/notifications/unread-count"))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/notifications?unreadOnly=true&page=2&size=10")
                        .header("Authorization", token("ROLE_USER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pageNumber").value(2))
                .andExpect(jsonPath("$.pageSize").value(10))
                .andExpect(jsonPath("$.empty").value(true));
        verify(service).getMyNotifications(true, 2, 10);
    }

    @Test
    void notificationReadAndPreferenceEndpointsAreAvailableToSignedInUsers() throws Exception {
        NotificationService service = context.getBean(NotificationService.class);
        NotificationDTO notification = NotificationDTO.builder()
                .id(17L)
                .eventType(NotificationEventType.GENERAL_ANNOUNCEMENT)
                .title("Bảo trì")
                .message("Thư viện bảo trì tối nay.")
                .build();
        NotificationPreferencesDTO preferences = NotificationPreferencesDTO.builder()
                .emailDueReminder(true)
                .emailOverdueAlert(true)
                .emailReservationUpdates(false)
                .emailMembershipUpdates(true)
                .emailGeneralAnnouncements(false)
                .emailAdminReturnRequests(true)
                .build();
        when(service.getMyUnreadCount()).thenReturn(3L);
        when(service.markAsRead(17L)).thenReturn(notification);
        when(service.markAllAsRead()).thenReturn(2);
        when(service.getMyPreferences()).thenReturn(preferences);
        when(service.updateMyPreferences(any())).thenReturn(preferences);

        mvc.perform(get("/api/notifications/unread-count")
                        .header("Authorization", token("ROLE_USER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unreadCount").value(3));
        mvc.perform(patch("/api/notifications/17/read")
                        .header("Authorization", token("ROLE_USER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(17));
        mvc.perform(patch("/api/notifications/read-all")
                        .header("Authorization", token("ROLE_USER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(true));
        mvc.perform(get("/api/notifications/preferences")
                        .header("Authorization", token("ROLE_USER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.emailGeneralAnnouncements").value(false));
        mvc.perform(put("/api/notifications/preferences")
                        .header("Authorization", token("ROLE_USER"))
                        .contentType("application/json")
                        .content("{\"emailDueReminder\":true,\"emailOverdueAlert\":false,"
                                + "\"emailReservationUpdates\":true,\"emailMembershipUpdates\":false,"
                                + "\"emailGeneralAnnouncements\":true,\"emailAdminReturnRequests\":false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.emailDueReminder").value(true));

        verify(service).markAsRead(17L);
        verify(service).markAllAsRead();
        verify(service).getMyPreferences();
        verify(service).updateMyPreferences(any());
    }

    @Test
    void preferenceUpdateRejectsMissingOptions() throws Exception {
        mvc.perform(put("/api/notifications/preferences")
                        .header("Authorization", token("ROLE_USER"))
                        .contentType("application/json")
                        .content("{\"emailDueReminder\":true}"))
                .andExpect(status().isBadRequest());
        verify(context.getBean(NotificationService.class), never()).updateMyPreferences(any());
    }

    @Test
    void onlyAdminCanCreateValidatedGeneralAnnouncement() throws Exception {
        NotificationPublisher publisher = context.getBean(NotificationPublisher.class);
        UserService userService = context.getBean(UserService.class);
        UserRepository users = context.getBean(UserRepository.class);
        when(userService.getCurrentUser()).thenReturn(User.builder().id(99L).build());
        when(users.findIdsByRole(UserRole.ROLE_USER)).thenReturn(List.of(1L, 2L, 3L));
        when(publisher.publishGeneralAnnouncement(anyLong(), anyString(), anyString(), anyString(), any()))
                .thenReturn(3);

        String body = "{\"requestKey\":\"maintenance-20261114\","
                + "\"title\":\"Thông báo bảo trì\","
                + "\"message\":\"Thư viện tạm ngừng 30 phút.\","
                + "\"actionUrl\":\"/user\"}";
        mvc.perform(post("/api/admin/notifications/announcements")
                        .header("Authorization", token("ROLE_USER"))
                        .contentType("application/json").content(body))
                .andExpect(status().isForbidden());
        verifyNoInteractions(publisher);

        mvc.perform(post("/api/admin/notifications/announcements")
                        .header("Authorization", token("ROLE_ADMIN"))
                        .contentType("application/json").content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.requestKey").value("maintenance-20261114"))
                .andExpect(jsonPath("$.recipientCount").value(3))
                .andExpect(jsonPath("$.storedCount").value(3));
        verify(publisher).publishGeneralAnnouncement(99L, "maintenance-20261114",
                "Thông báo bảo trì", "Thư viện tạm ngừng 30 phút.", "/user");
    }

    @Test
    void announcementRejectsExternalActionUrlBeforePublishing() throws Exception {
        when(context.getBean(UserService.class).getCurrentUser())
                .thenReturn(User.builder().id(99L).build());
        mvc.perform(post("/api/admin/notifications/announcements")
                        .header("Authorization", token("ROLE_ADMIN"))
                        .contentType("application/json")
                        .content("{\"requestKey\":\"maintenance-20261114\","
                                + "\"title\":\"Bảo trì\",\"message\":\"Thông báo\","
                                + "\"actionUrl\":\"//outside.example\"}"))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(context.getBean(NotificationPublisher.class));
    }
}
