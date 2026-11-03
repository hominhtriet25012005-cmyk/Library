package com.library.configurations;

import com.library.controller.SubscriptionController;
import com.library.controller.SubscriptionPlanController;
import com.library.payload.dto.SubscriptionPlanDTO;
import com.library.payload.response.PageResponse;
import com.library.service.SubscriptionPlanService;
import com.library.service.SubscriptionService;
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

import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AdminMembershipHttpSecurityTests {
    @Configuration @EnableWebMvc @EnableWebSecurity
    @Import({SecurityConfig.class, SubscriptionController.class, SubscriptionPlanController.class,
            SecurityTestSupport.Beans.class})
    static class Config {
        @Bean SubscriptionService subscriptions() { return mock(SubscriptionService.class); }
        @Bean SubscriptionPlanService plans() { return mock(SubscriptionPlanService.class); }
    }

    private AnnotationConfigWebApplicationContext context;
    private MockMvc mvc;

    @BeforeEach void setup() {
        context = new AnnotationConfigWebApplicationContext();
        SecurityTestSupport.configure(context);
        context.setServletContext(new MockServletContext());
        context.register(Config.class);
        context.refresh();
        mvc = MockMvcBuilders.webAppContextSetup(context)
                .addFilters(context.getBean("springSecurityFilterChain", Filter.class)).build();
    }

    @AfterEach void close() { context.close(); }

    private String token(String role) {
        return SecurityTestSupport.token(role);
    }

    @Test void usersSeeSellingPlansButNotAdminCatalogOrMemberships() throws Exception {
        var plans = context.getBean(SubscriptionPlanService.class);
        var subscriptions = context.getBean(SubscriptionService.class);
        when(plans.getAvailableSubscriptionPlans()).thenReturn(List.of(SubscriptionPlanDTO.builder().id(1L).build()));
        when(plans.getAllSubscriptionPlan()).thenReturn(List.of(SubscriptionPlanDTO.builder().id(1L).build(),
                SubscriptionPlanDTO.builder().id(2L).isActive(false).build()));
        when(subscriptions.searchAdminSubscriptions(any(), any(), any(), any()))
                .thenReturn(new PageResponse<>(List.of(), 0, 10, 0, 0, true, true, true));

        mvc.perform(get("/api/subscription-plans").header("Authorization", token("ROLE_USER")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1));
        mvc.perform(get("/api/subscription-plans/admin").header("Authorization", token("ROLE_USER")))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/subscriptions/admin/search").header("Authorization", token("ROLE_USER")))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/subscription-plans/admin").header("Authorization", token("ROLE_ADMIN")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(2));
        mvc.perform(get("/api/subscriptions/admin/search").header("Authorization", token("ROLE_ADMIN")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(0));
        mvc.perform(get("/api/subscriptions/admin/search?page=-1").header("Authorization", token("ROLE_ADMIN")))
                .andExpect(status().isBadRequest());
    }

    @Test void updatePlanIsValidatedAndDeleteReportsPermanentRemoval() throws Exception {
        var plans = context.getBean(SubscriptionPlanService.class);

        mvc.perform(put("/api/subscription-plans/admin/9")
                        .header("Authorization", token("ROLE_ADMIN"))
                        .contentType("application/json").content("{}"))
                .andExpect(status().isBadRequest());
        verify(plans, never()).updateSubscriptionPlan(anyLong(), any());

        when(plans.deleteSubscriptionPlan(9L)).thenReturn(true);
        mvc.perform(delete("/api/subscription-plans/admin/9")
                        .header("Authorization", token("ROLE_ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(true))
                .andExpect(jsonPath("$.message").value("Đã xóa vĩnh viễn gói thành công."));
        verify(plans).deleteSubscriptionPlan(9L);
    }

    @Test void deleteReportsStopSellingWhenPlanHasSubscriptionHistory() throws Exception {
        var plans = context.getBean(SubscriptionPlanService.class);
        when(plans.deleteSubscriptionPlan(9L)).thenReturn(false);

        mvc.perform(delete("/api/subscription-plans/admin/9")
                        .header("Authorization", token("ROLE_ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(true))
                .andExpect(jsonPath("$.message").value("Gói đã có lịch sử đăng ký nên chỉ được ngừng bán."));
    }

    @Test void expiredMembershipMutationUsesPostAndLegacyListAcceptsRealPage() throws Exception {
        var subscriptions = context.getBean(SubscriptionService.class);
        when(subscriptions.getAllSubscriptions(any())).thenReturn(List.of());

        mvc.perform(get("/api/subscriptions/admin?page=2&size=5")
                        .header("Authorization", token("ROLE_ADMIN")))
                .andExpect(status().isOk());
        verify(subscriptions).getAllSubscriptions(argThat(page -> page.getPageNumber() == 2 && page.getPageSize() == 5));

        mvc.perform(get("/api/subscriptions/admin/deactivate-expired")
                        .header("Authorization", token("ROLE_ADMIN")))
                .andExpect(status().isMethodNotAllowed());
        mvc.perform(post("/api/subscriptions/admin/deactivate-expired")
                        .header("Authorization", token("ROLE_ADMIN")))
                .andExpect(status().isOk());
        verify(subscriptions).deactivateExpiredSubscriptions();
    }
}
