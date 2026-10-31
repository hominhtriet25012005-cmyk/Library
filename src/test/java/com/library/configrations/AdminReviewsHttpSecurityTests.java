package com.library.configrations;

import com.library.controller.BookReviewController;
import com.library.payload.dto.BookReviewDTO;
import com.library.payload.response.PageResponse;
import com.library.service.BookReviewService;
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

class AdminReviewsHttpSecurityTests {
    @Configuration @EnableWebMvc @EnableWebSecurity
    @Import({SecurityConfig.class, BookReviewController.class, SecurityTestSupport.Beans.class})
    static class Config {
        @Bean BookReviewService reviews() { return mock(BookReviewService.class); }
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

    @Test void onlyAdminCanSearchOrHideReviews() throws Exception {
        BookReviewService reviews = context.getBean(BookReviewService.class);
        when(reviews.searchAdminReviews(null, null, null, 0, 10))
                .thenReturn(new PageResponse<>(List.of(), 0, 10, 0, 0, true, true, true));
        when(reviews.hideReview(7L)).thenReturn(BookReviewDTO.builder().id(7L).isActive(false).build());
        mvc.perform(get("/api/reviews/admin").header("Authorization", token("ROLE_USER")))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/reviews/admin/7/hide").header("Authorization", token("ROLE_USER")))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/reviews/admin").header("Authorization", token("ROLE_ADMIN")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(0));
        mvc.perform(post("/api/reviews/admin/7/hide").header("Authorization", token("ROLE_ADMIN")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.isActive").value(false));
    }
}
